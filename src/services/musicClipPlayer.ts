/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MUSIC_BINGO_SONGS, MusicBingoSong } from '../data/musicBingoSongs';

const DB_NAME = 'humanconnections_music_clips';
const DB_VERSION = 1;
const STORE_NAME = 'clips';

export interface StoredMusicClip {
  songId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  startOffsetSec: number;
  updatedAt: number;
}

export interface CustomClipMeta {
  songId: string;
  fileName: string;
  startOffsetSec: number;
}

export type ClipSourceType = 'custom' | 'preview' | 'cue' | 'none';

export interface MusicClipPlayerState {
  currentSongId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  sourceType: ClipSourceType;
  sourceLabel: string;
  currentTimeSec: number;
  durationSec: number;
  volume: number;
  autoStopSec: number;
  notice: string | null;
  customClips: Record<string, CustomClipMeta>;
}

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function openClipsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'songId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

class MusicClipPlayerService {
  private audioEl: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;
  private previewCache = new Map<string, string | null>();
  private listeners = new Set<() => void>();
  private autoStopTimer: number | null = null;
  private playSeq = 0;
  private clipElapsedMs = 0;
  private clipSegmentStartedAt = 0;
  private currentClipOffsetSec = 0;

  private state: MusicClipPlayerState = {
    currentSongId: null,
    isPlaying: false,
    isLoading: false,
    sourceType: 'none',
    sourceLabel: '',
    currentTimeSec: 0,
    durationSec: 0,
    volume: 0.85,
    autoStopSec: 30,
    notice: null,
    customClips: {},
  };

  constructor() {
    if (typeof window !== 'undefined') {
      void this.refreshCustomClipsIndex();
    }
  }

  private ensureAudioEl(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioEl) {
      const el = new Audio();
      el.preload = 'auto';
      el.volume = this.state.volume;
      el.addEventListener('timeupdate', () => {
        this.state = {
          ...this.state,
          currentTimeSec: Number.isFinite(el.currentTime) ? el.currentTime : 0,
          durationSec: Number.isFinite(el.duration) ? el.duration : 0,
        };
        this.notify();
      });
      el.addEventListener('loadedmetadata', () => {
        this.state = {
          ...this.state,
          durationSec: Number.isFinite(el.duration) ? el.duration : 0,
        };
        this.notify();
      });
      el.addEventListener('play', () => {
        this.clipSegmentStartedAt = Date.now();
        this.state = { ...this.state, isPlaying: true, isLoading: false };
        this.notify();
      });
      el.addEventListener('pause', () => {
        if (this.clipSegmentStartedAt > 0) {
          this.clipElapsedMs += Math.max(0, Date.now() - this.clipSegmentStartedAt);
          this.clipSegmentStartedAt = 0;
        }
        this.state = { ...this.state, isPlaying: false };
        this.notify();
      });
      el.addEventListener('ended', () => {
        if (this.clipSegmentStartedAt > 0) {
          this.clipElapsedMs += Math.max(0, Date.now() - this.clipSegmentStartedAt);
          this.clipSegmentStartedAt = 0;
        }
        const targetMs = this.state.autoStopSec * 1000;
        const remainingMs = targetMs - this.clipElapsedMs;
        if (this.state.autoStopSec > 0 && remainingMs > 1200 && el.src) {
          const offset = this.state.sourceType === 'custom' ? this.currentClipOffsetSec : 0;
          el.currentTime = Number.isFinite(el.duration) && el.duration > offset ? offset : 0;
          void el.play().then(() => {
            this.scheduleAutoStopMs(remainingMs);
          }).catch(() => {
            this.clearAutoStopTimer();
            this.state = { ...this.state, isPlaying: false };
            this.notify();
          });
          return;
        }
        this.clearAutoStopTimer();
        this.state = { ...this.state, isPlaying: false };
        this.notify();
      });
      this.audioEl = el;
    }
    return this.audioEl;
  }

  private clearAutoStopTimer() {
    if (this.autoStopTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
  }

  private scheduleAutoStop(clipDurationSec: number) {
    if (clipDurationSec <= 0) {
      this.clearAutoStopTimer();
      return;
    }
    this.scheduleAutoStopMs(clipDurationSec * 1000);
  }

  private scheduleAutoStopMs(durationMs: number) {
    this.clearAutoStopTimer();
    if (typeof window === 'undefined' || durationMs <= 0) return;
    this.autoStopTimer = window.setTimeout(() => {
      if (this.audioEl && !this.audioEl.paused) {
        this.audioEl.pause();
      }
      this.autoStopTimer = null;
    }, durationMs);
  }

  private revokeActiveObjectUrl() {
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
  }

  public getState(): MusicClipPlayerState {
    return this.state;
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public async refreshCustomClipsIndex(): Promise<void> {
    try {
      const db = await openClipsDb();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const items = (req.result || []) as StoredMusicClip[];
          const map: Record<string, CustomClipMeta> = {};
          items.forEach((item) => {
            map[item.songId] = {
              songId: item.songId,
              fileName: item.fileName,
              startOffsetSec: item.startOffsetSec || 0,
            };
          });
          this.state = { ...this.state, customClips: map };
          this.notify();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
      db.close();
    } catch {
      // IndexedDB unavailable
    }
  }

  private async getStoredClip(songId: string): Promise<StoredMusicClip | null> {
    try {
      const db = await openClipsDb();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(songId);
      const result = await new Promise<StoredMusicClip | null>((resolve) => {
        req.onsuccess = () => resolve((req.result as StoredMusicClip) || null);
        req.onerror = () => resolve(null);
      });
      db.close();
      return result;
    } catch {
      return null;
    }
  }

  public async saveSongAudioFile(songId: string, file: File, startOffsetSec = 0): Promise<void> {
    const db = await openClipsDb();
    const record: StoredMusicClip = {
      songId,
      fileName: file.name,
      mimeType: file.type || 'audio/mpeg',
      blob: file,
      startOffsetSec: Math.max(0, Math.floor(startOffsetSec)),
      updatedAt: Date.now(),
    };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    await this.refreshCustomClipsIndex();
    this.state = {
      ...this.state,
      notice: `Lydfil «${file.name}» lagret i appen!`,
    };
    this.notify();
  }

  public async removeSongAudioFile(songId: string): Promise<void> {
    if (this.state.currentSongId === songId && this.state.sourceType === 'custom') {
      this.stop();
    }
    try {
      const db = await openClipsDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(songId);
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    } catch {
      // ignore
    }
    await this.refreshCustomClipsIndex();
  }

  public async setSongStartOffset(songId: string, startOffsetSec: number): Promise<void> {
    const existing = await this.getStoredClip(songId);
    if (!existing) return;
    const db = await openClipsDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({
      ...existing,
      startOffsetSec: Math.max(0, Math.floor(startOffsetSec)),
      updatedAt: Date.now(),
    });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
    await this.refreshCustomClipsIndex();
  }

  public async bulkMatchAudioFiles(files: FileList | File[]): Promise<{
    matched: Array<{ songId: string; title: string; fileName: string }>;
    unmatched: string[];
  }> {
    const fileArray = Array.from(files);
    const matched: Array<{ songId: string; title: string; fileName: string }> = [];
    const unmatched: string[] = [];

    for (const file of fileArray) {
      const normFile = normalizeText(file.name);
      if (!normFile) {
        unmatched.push(file.name);
        continue;
      }

      let bestSong: MusicBingoSong | null = null;
      let bestScore = 0;

      for (const s of MUSIC_BINGO_SONGS) {
        const normTitle = normalizeText(s.title);
        const normArtist = normalizeText(s.artist);
        let score = 0;

        if (normFile === normTitle) {
          score += 100;
        } else if (normTitle.length >= 3 && normFile.includes(normTitle)) {
          score += 65;
        }
        if (normArtist.length >= 3 && normFile.includes(normArtist)) {
          score += 30;
        }
        if (normFile.includes(normalizeText(s.id))) {
          score += 50;
        }

        const titleTokens = normTitle.split(' ').filter((w) => w.length >= 3);
        const tokenHits = titleTokens.filter((t) => normFile.includes(t)).length;
        if (titleTokens.length > 0) {
          score += Math.round((tokenHits / titleTokens.length) * 40);
        }

        if (score > bestScore && score >= 45) {
          bestScore = score;
          bestSong = s;
        }
      }

      if (bestSong) {
        await this.saveSongAudioFile(bestSong.id, file);
        matched.push({
          songId: bestSong.id,
          title: bestSong.title,
          fileName: file.name,
        });
      } else {
        unmatched.push(file.name);
      }
    }

    return { matched, unmatched };
  }

  private async fetchServerPreviewUrl(song: MusicBingoSong): Promise<string | null> {
    if (this.previewCache.has(song.id)) {
      return this.previewCache.get(song.id) ?? null;
    }
    try {
      const qs = new URLSearchParams({
        id: song.id,
        title: song.title,
        artist: song.artist,
      });
      const resp = await fetch(`/api/music-preview?${qs.toString()}`, { cache: 'no-store' });
      if (!resp.ok) {
        this.previewCache.set(song.id, null);
        return null;
      }
      const data = (await resp.json()) as { ok?: boolean; previewUrl?: string | null };
      const url = typeof data?.previewUrl === 'string' && data.previewUrl.startsWith('https://')
        ? data.previewUrl
        : null;
      this.previewCache.set(song.id, url);
      return url;
    } catch {
      return null;
    }
  }

  private playCueMelody() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.14 * this.state.volume, ctx.currentTime + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.48);
      });
      setTimeout(() => {
        void ctx.close().catch(() => {});
      }, 1200);
    } catch {
      // ignore
    }
  }

  public async playSongClip(song: MusicBingoSong, clipDurationSec = 30): Promise<void> {
    const seq = ++this.playSeq;
    const el = this.ensureAudioEl();
    if (!el) return;

    // Toggle pause if already playing this exact song
    if (this.state.currentSongId === song.id && this.state.isPlaying) {
      el.pause();
      this.clearAutoStopTimer();
      return;
    }

    el.pause();
    this.clearAutoStopTimer();
    this.revokeActiveObjectUrl();
    this.clipElapsedMs = 0;
    this.clipSegmentStartedAt = 0;
    this.currentClipOffsetSec = 0;

    this.state = {
      ...this.state,
      currentSongId: song.id,
      isLoading: true,
      isPlaying: false,
      currentTimeSec: 0,
      durationSec: 0,
      autoStopSec: clipDurationSec,
      notice: null,
    };
    this.notify();

    // 1. Highest priority: Organizer's own audio file stored in IndexedDB
    const stored = await this.getStoredClip(song.id);
    if (seq !== this.playSeq) return;

    if (stored) {
      const objUrl = URL.createObjectURL(stored.blob);
      this.activeObjectUrl = objUrl;
      el.src = objUrl;
      el.volume = this.state.volume;
      const offset = stored.startOffsetSec || 0;
      this.currentClipOffsetSec = offset;
      const applyOffsetAndPlay = async () => {
        try {
          if (offset > 0 && Number.isFinite(el.duration) && el.duration > offset) {
            el.currentTime = offset;
          }
          await el.play();
          if (seq === this.playSeq) {
            this.scheduleAutoStop(clipDurationSec);
          }
        } catch {
          if (seq === this.playSeq) {
            this.state = {
              ...this.state,
              isLoading: false,
              isPlaying: false,
              notice: 'Nettleseren blokkerte automatisk avspilling — klikk «Spill klipp» én gang til.',
            };
            this.notify();
          }
        }
      };

      this.state = {
        ...this.state,
        sourceType: 'custom',
        sourceLabel: `📁 Egen lydfil: ${stored.fileName}`,
      };
      this.notify();

      if (offset > 0) {
        const onMeta = () => {
          el.removeEventListener('loadedmetadata', onMeta);
          void applyOffsetAndPlay();
        };
        el.addEventListener('loadedmetadata', onMeta);
        el.load();
      } else {
        await applyOffsetAndPlay();
      }
      return;
    }

    // 2. Fallback: 30-second in-app music preview via server lookup
    const previewUrl = await this.fetchServerPreviewUrl(song);
    if (seq !== this.playSeq) return;

    if (previewUrl) {
      el.src = previewUrl;
      el.volume = this.state.volume;
      this.state = {
        ...this.state,
        sourceType: 'preview',
        sourceLabel: `🎵 Innebygd lydklipp (${clipDurationSec} sek)`,
      };
      this.notify();
      try {
        await el.play();
        if (seq === this.playSeq) {
          this.scheduleAutoStop(clipDurationSec);
        }
      } catch {
        if (seq === this.playSeq) {
          this.state = {
            ...this.state,
            isLoading: false,
            isPlaying: false,
            notice: 'Kunne ikke starte lydklippet automatisk — klikk «Spill klipp» igjen.',
          };
          this.notify();
        }
      }
      return;
    }

    // 3. Offline / no preview found fallback: cue chime + prompt to attach custom MP3/M4A
    this.playCueMelody();
    this.state = {
      ...this.state,
      isLoading: false,
      isPlaying: false,
      sourceType: 'cue',
      sourceLabel: 'Ingen ferdig lydfil ennå',
      notice: `Fant ikke ferdig lydklipp for «${song.title}». Klikk «📁 Lydfil» på sangen for å legge inn din egen MP3/M4A/WAV!`,
    };
    this.notify();
  }

  public togglePlayPause() {
    const el = this.audioEl;
    if (!el || !el.src) return;
    if (el.paused) {
      const remainingMs = Math.max(1000, this.state.autoStopSec * 1000 - this.clipElapsedMs);
      void el.play().then(() => {
        this.scheduleAutoStopMs(remainingMs);
      }).catch(() => {});
    } else {
      el.pause();
      this.clearAutoStopTimer();
    }
  }

  public stop() {
    this.playSeq++;
    this.clearAutoStopTimer();
    this.clipElapsedMs = 0;
    this.clipSegmentStartedAt = 0;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.removeAttribute('src');
      this.audioEl.load();
    }
    this.revokeActiveObjectUrl();
    this.state = {
      ...this.state,
      isPlaying: false,
      isLoading: false,
      currentTimeSec: 0,
    };
    this.notify();
  }

  public seekTo(seconds: number) {
    if (!this.audioEl || !Number.isFinite(this.audioEl.duration)) return;
    const clamped = Math.max(0, Math.min(this.audioEl.duration, seconds));
    this.audioEl.currentTime = clamped;
    this.state = { ...this.state, currentTimeSec: clamped };
    this.notify();
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = clamped;
    }
    this.state = { ...this.state, volume: clamped };
    this.notify();
  }

  public clearNotice() {
    this.state = { ...this.state, notice: null };
    this.notify();
  }
}

export const musicClipPlayer = new MusicClipPlayerService();
