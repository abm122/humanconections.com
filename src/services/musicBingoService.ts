/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { socialSocket } from './socialSocket';
import { remoteBingo } from './remoteBingo';
import { BingoMilestone } from '../types/bingo';
import { MUSIC_BINGO_SONGS, MusicBingoSong } from '../data/musicBingoSongs';

export interface MusicBingoClaimInfo {
  claimId?: string;
  playerName: string;
  pattern: string;
  milestone?: BingoMilestone;
  isFullHouse?: boolean;
  roundNumber?: number;
  claimedMilestones?: BingoMilestone[];
  milestoneWinners?: Partial<Record<BingoMilestone, string>>;
  autoNewRoundDelayMs?: number;
  timestamp: number;
}

export interface MusicBingoNewRoundEvent {
  roomCode: string;
  roundNumber: number;
  winnerName?: string;
  reason: 'fullbrett' | 'host';
  timestamp: number;
}

export interface MusicBingoParticipantProgress {
  id: string;
  name: string;
  markedCount: number;
  linesCompleted: number;
  hasBingo: boolean;
}

export interface MusicBingoSnapshot {
  roomCode: string;
  hostName: string;
  roundNumber: number;
  isActive: boolean;
  playedSongIds: string[];
  currentSongId: string | null;
  revealCurrentSong: boolean;
  clipStartedAt: number;
  clipDurationSec: number;
  lastClaim: MusicBingoClaimInfo | null;
  claimedMilestones: BingoMilestone[];
  milestoneWinners: Partial<Record<BingoMilestone, string>>;
  participants: MusicBingoParticipantProgress[];
  serverNow: number;
}

const DEFAULT_SNAPSHOT: MusicBingoSnapshot = {
  roomCode: '',
  hostName: 'Arrangør',
  roundNumber: 1,
  isActive: false,
  playedSongIds: [],
  currentSongId: null,
  revealCurrentSong: false,
  clipStartedAt: 0,
  clipDurationSec: 30,
  lastClaim: null,
  claimedMilestones: [],
  milestoneWinners: {},
  participants: [],
  serverNow: Date.now(),
};

class MusicBingoService {
  private snapshot: MusicBingoSnapshot = { ...DEFAULT_SNAPSHOT };
  private listeners: Set<() => void> = new Set();
  private rejectListeners: Set<(message: string) => void> = new Set();
  private claimListeners: Set<(claim: MusicBingoClaimInfo & { milestone?: BingoMilestone }) => void> = new Set();
  private newRoundListeners: Set<(ev: MusicBingoNewRoundEvent) => void> = new Set();
  private seenParticipantIds: Set<string> = new Set();
  private seenClaimIds: Set<string> = new Set();
  private lastRecordedClaimTs: number = 0;
  private clockOffsetMs = 0;
  private statePollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      socialSocket.on('music:state', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          this.applyServerState(payload as Partial<MusicBingoSnapshot>);
        }
      });

      socialSocket.on('music:participant_joined', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          const data = payload as { participant?: MusicBingoParticipantProgress };
          if (data.participant?.id && data.participant?.name) {
            this.seenParticipantIds.add(data.participant.id);
            remoteBingo.recordParticipantJoinedExternal(
              data.participant.id,
              data.participant.name,
              '#f59e0b',
              'Musikkbingo'
            );
          }
        }
      });

      socialSocket.on('music:bingo_claimed', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          this.handleIncomingClaimPayload(payload as Partial<MusicBingoClaimInfo>);
        }
      });

      socialSocket.on('music:new_round', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          const data = payload as Partial<MusicBingoNewRoundEvent>;
          this.handleIncomingNewRound({
            roomCode: String(data.roomCode || this.snapshot.roomCode || ''),
            roundNumber: Number(data.roundNumber) || (this.snapshot.roundNumber || 1) + 1,
            winnerName: data.winnerName ? String(data.winnerName) : undefined,
            reason: data.reason === 'host' ? 'host' : 'fullbrett',
            timestamp: Number(data.timestamp) || Date.now(),
          });
        }
      });

      socialSocket.on('music:claim_rejected', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          const data = payload as {
            message?: string;
            claimedMilestones?: BingoMilestone[];
            milestoneWinners?: Partial<Record<BingoMilestone, string>>;
          };
          this.snapshot = {
            ...this.snapshot,
            claimedMilestones: Array.isArray(data.claimedMilestones)
              ? data.claimedMilestones
              : this.snapshot.claimedMilestones,
            milestoneWinners:
              data.milestoneWinners && typeof data.milestoneWinners === 'object'
                ? data.milestoneWinners
                : this.snapshot.milestoneWinners,
          };
          this.notify();
          if (data.message) {
            this.rejectListeners.forEach((fn) => fn(data.message!));
          }
        }
      });

      socialSocket.on('connection:open', () => {
        if (remoteBingo.canActAsHost() && this.snapshot.isActive) {
          this.pushHostState();
        } else {
          const code = remoteBingo.getCurrentRoomCode();
          if (code) {
            socialSocket.send('music:request_state', { roomCode: code });
            this.startStatePolling(code);
          }
        }
      });
    }
  }

  private handleIncomingClaimPayload(raw: Partial<MusicBingoClaimInfo>) {
    if (!raw.playerName || !raw.pattern) return;
    const claimId = raw.claimId ? String(raw.claimId) : '';
    if (claimId) {
      if (this.seenClaimIds.has(claimId)) return;
      this.seenClaimIds.add(claimId);
      if (this.seenClaimIds.size > 200) {
        const first = this.seenClaimIds.values().next().value;
        if (first) this.seenClaimIds.delete(first);
      }
    }
    const ts = Number(raw.timestamp) || Date.now();
    const isFullHouse = Boolean(raw.isFullHouse) || raw.milestone === 'fullbrett';
    const nextClaimed = Array.isArray(raw.claimedMilestones)
      ? raw.claimedMilestones
      : raw.milestone
      ? Array.from(new Set([...this.snapshot.claimedMilestones, raw.milestone]))
      : this.snapshot.claimedMilestones;
    const nextWinners =
      raw.milestoneWinners && typeof raw.milestoneWinners === 'object'
        ? raw.milestoneWinners
        : raw.milestone
        ? { ...this.snapshot.milestoneWinners, [raw.milestone]: raw.playerName }
        : this.snapshot.milestoneWinners;

    const normalizedClaim: MusicBingoClaimInfo = {
      claimId: claimId || undefined,
      playerName: raw.playerName,
      pattern: raw.pattern,
      milestone: raw.milestone,
      isFullHouse,
      roundNumber: raw.roundNumber || this.snapshot.roundNumber,
      claimedMilestones: nextClaimed,
      milestoneWinners: nextWinners,
      autoNewRoundDelayMs: raw.autoNewRoundDelayMs ?? (isFullHouse ? 4500 : 0),
      timestamp: ts,
    };

    if (ts !== this.lastRecordedClaimTs) {
      this.lastRecordedClaimTs = ts;
      remoteBingo.recordMusicBingoClaim(normalizedClaim.playerName, normalizedClaim.pattern);
    }

    this.snapshot = {
      ...this.snapshot,
      lastClaim: normalizedClaim,
      claimedMilestones: nextClaimed,
      milestoneWinners: nextWinners,
    };
    this.notify();
    this.claimListeners.forEach((fn) => fn(normalizedClaim));
  }

  private handleIncomingNewRound(ev: MusicBingoNewRoundEvent) {
    if (ev.roundNumber <= this.snapshot.roundNumber && this.snapshot.playedSongIds.length === 0 && this.snapshot.claimedMilestones.length === 0) {
      return;
    }
    this.snapshot = {
      ...this.snapshot,
      roomCode: ev.roomCode || this.snapshot.roomCode,
      roundNumber: ev.roundNumber,
      playedSongIds: [],
      currentSongId: null,
      revealCurrentSong: false,
      clipStartedAt: 0,
      lastClaim: null,
      claimedMilestones: [],
      milestoneWinners: {},
      participants: this.snapshot.participants.map((p) => ({
        ...p,
        markedCount: 0,
        linesCompleted: 0,
        hasBingo: false,
      })),
    };
    this.notify();
    this.newRoundListeners.forEach((fn) => fn(ev));
  }

  private applyServerState(incoming: Partial<MusicBingoSnapshot>) {
    if (typeof incoming.serverNow === 'number' && incoming.serverNow > 0) {
      this.clockOffsetMs = incoming.serverNow - Date.now();
    }
    const prevRound = this.snapshot.roundNumber || 1;
    const incomingRound = typeof incoming.roundNumber === 'number' ? incoming.roundNumber : prevRound;

    if (Array.isArray(incoming.participants)) {
      incoming.participants.forEach((p) => {
        if (p?.id && !this.seenParticipantIds.has(p.id)) {
          this.seenParticipantIds.add(p.id);
          remoteBingo.recordParticipantJoinedExternal(p.id, p.name, '#f59e0b', 'Musikkbingo');
        }
      });
    }

    const roomCode = incoming.roomCode || this.snapshot.roomCode;
    if (roomCode) {
      this.startStatePolling(roomCode);
    }

    this.snapshot = {
      ...this.snapshot,
      ...incoming,
      playedSongIds: Array.isArray(incoming.playedSongIds)
        ? incoming.playedSongIds
        : this.snapshot.playedSongIds,
      claimedMilestones: Array.isArray(incoming.claimedMilestones)
        ? incoming.claimedMilestones
        : this.snapshot.claimedMilestones,
      milestoneWinners:
        incoming.milestoneWinners && typeof incoming.milestoneWinners === 'object'
          ? incoming.milestoneWinners
          : this.snapshot.milestoneWinners,
      participants: Array.isArray(incoming.participants)
        ? incoming.participants
        : this.snapshot.participants,
    };
    this.notify();

    if (incomingRound > prevRound) {
      this.newRoundListeners.forEach((fn) =>
        fn({
          roomCode: roomCode || '',
          roundNumber: incomingRound,
          reason: 'fullbrett',
          timestamp: Date.now(),
        })
      );
    }

    if (incoming.lastClaim && incoming.lastClaim.timestamp && incoming.lastClaim.timestamp !== this.lastRecordedClaimTs) {
      this.handleIncomingClaimPayload(incoming.lastClaim);
    }
  }

  private startStatePolling(roomCode: string) {
    if (typeof window === 'undefined') return;
    const clean = this.resolveRoomCode(roomCode);
    if (!clean || this.statePollTimer) return;
    this.statePollTimer = setInterval(() => {
      const activeCode = this.resolveRoomCode();
      if (!activeCode) {
        this.stopStatePolling();
        return;
      }
      fetch(`/api/rooms/state?code=${encodeURIComponent(activeCode)}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.musicSnapshot && typeof data.musicSnapshot === 'object') {
            this.applyServerState(data.musicSnapshot as Partial<MusicBingoSnapshot>);
          }
        })
        .catch(() => {});
    }, 2500);
  }

  public stopStatePolling() {
    if (this.statePollTimer) {
      clearInterval(this.statePollTimer);
      this.statePollTimer = null;
    }
  }

  public getSnapshot(): MusicBingoSnapshot {
    return this.snapshot;
  }

  public getSongById(songId: string | null): MusicBingoSong | null {
    if (!songId) return null;
    return MUSIC_BINGO_SONGS.find((s) => s.id === songId) || null;
  }

  public getRemainingClipSeconds(): number {
    if (!this.snapshot.clipStartedAt || !this.snapshot.clipDurationSec) return 0;
    const approxNow = Date.now() + this.clockOffsetMs;
    const elapsed = (approxNow - this.snapshot.clipStartedAt) / 1000;
    return Math.max(0, Math.ceil(this.snapshot.clipDurationSec - elapsed));
  }

  private resolveRoomCode(explicitCode?: string): string {
    return (
      explicitCode ||
      this.snapshot.roomCode ||
      remoteBingo.getHostCode() ||
      remoteBingo.getCurrentRoomCode() ||
      ''
    )
      .trim()
      .toUpperCase();
  }

  private pushHostState() {
    if (!remoteBingo.canActAsHost()) return;
    const code = this.resolveRoomCode();
    if (!code) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const hostName = remoteBingo.getHostName() || this.snapshot.hostName || 'Arrangør';
    this.snapshot = {
      ...this.snapshot,
      roomCode: code,
      hostName,
      isActive: true,
      serverNow: Date.now(),
    };
    socialSocket.send('music:host_sync', {
      roomCode: code,
      hostKey,
      hostName,
      roundNumber: this.snapshot.roundNumber,
      playedSongIds: this.snapshot.playedSongIds,
      currentSongId: this.snapshot.currentSongId,
      revealCurrentSong: this.snapshot.revealCurrentSong,
      clipStartedAt: this.snapshot.clipStartedAt,
      clipDurationSec: this.snapshot.clipDurationSec,
      lastClaim: this.snapshot.lastClaim,
    });
    this.startStatePolling(code);
    this.notify();
  }

  public ensureHostActive(hostName?: string) {
    if (!remoteBingo.canActAsHost()) return;
    const code = remoteBingo.ensurePaidHostCode();
    if (!code) return;
    this.snapshot = {
      ...this.snapshot,
      roomCode: code,
      hostName: hostName || remoteBingo.getHostName() || 'Arrangør',
      isActive: true,
    };
    this.pushHostState();
  }

  public playSong(songId: string, revealImmediately = false, clipDurationSec = 30) {
    if (!remoteBingo.canActAsHost()) return;
    const played = this.snapshot.playedSongIds.includes(songId)
      ? this.snapshot.playedSongIds
      : [...this.snapshot.playedSongIds, songId];

    this.snapshot = {
      ...this.snapshot,
      isActive: true,
      currentSongId: songId,
      playedSongIds: played,
      revealCurrentSong: revealImmediately,
      clipStartedAt: Date.now(),
      clipDurationSec,
    };
    this.playChime();
    this.pushHostState();
  }

  public drawRandomNextSong(revealImmediately = false, clipDurationSec = 30): MusicBingoSong | null {
    const unplayed = MUSIC_BINGO_SONGS.filter((s) => !this.snapshot.playedSongIds.includes(s.id));
    if (unplayed.length === 0) return null;
    const picked = unplayed[Math.floor(Math.random() * unplayed.length)];
    this.playSong(picked.id, revealImmediately, clipDurationSec);
    return picked;
  }

  public setRevealCurrentSong(reveal: boolean) {
    if (!remoteBingo.canActAsHost()) return;
    this.snapshot = {
      ...this.snapshot,
      revealCurrentSong: reveal,
    };
    this.pushHostState();
  }

  public startClipTimer(clipDurationSec = 30) {
    if (!remoteBingo.canActAsHost()) return;
    this.snapshot = {
      ...this.snapshot,
      clipStartedAt: Date.now(),
      clipDurationSec,
    };
    this.playChime();
    this.pushHostState();
  }

  public stopClipTimer() {
    if (!remoteBingo.canActAsHost()) return;
    this.snapshot = {
      ...this.snapshot,
      clipStartedAt: 0,
    };
    this.pushHostState();
  }

  public startNewRound(winnerName?: string) {
    if (!remoteBingo.canActAsHost()) return;
    const nextRound = (this.snapshot.roundNumber || 1) + 1;
    const code = this.resolveRoomCode();
    const hostKey = remoteBingo.getHostKeyForService();
    this.handleIncomingNewRound({
      roomCode: code,
      roundNumber: nextRound,
      winnerName,
      reason: 'host',
      timestamp: Date.now(),
    });
    if (code) {
      socialSocket.send('music:new_round', {
        roomCode: code,
        hostKey,
        roundNumber: nextRound,
        winnerName,
      });
      if (typeof window !== 'undefined') {
        fetch('/api/rooms/music/new_round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: code, hostKey, winnerName }),
        }).catch(() => {});
      }
    }
    this.pushHostState();
  }

  public dismissClaim() {
    if (!remoteBingo.canActAsHost()) return;
    this.snapshot = {
      ...this.snapshot,
      lastClaim: null,
    };
    this.pushHostState();
  }

  public requestSync(roomCode?: string) {
    const code = this.resolveRoomCode(roomCode);
    if (!code) return;
    socialSocket.send('music:request_state', { roomCode: code });
    this.startStatePolling(code);
    if (typeof window !== 'undefined') {
      fetch(`/api/rooms/state?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.musicSnapshot && typeof data.musicSnapshot === 'object') {
            this.applyServerState(data.musicSnapshot as Partial<MusicBingoSnapshot>);
          }
        })
        .catch(() => {});
    }
  }

  public reportDigitalProgress(
    roomCode: string,
    playerName: string,
    markedCount: number,
    linesCompleted: number,
    hasBingo: boolean
  ) {
    const code = this.resolveRoomCode(roomCode);
    if (!code) return;
    socialSocket.send('music:player_progress', {
      roomCode: code,
      playerName,
      markedCount,
      linesCompleted,
      hasBingo,
    });
  }

  public claimDigitalBingo(
    roomCode: string,
    playerName: string,
    pattern: string,
    linesCompleted?: number,
    hasFullHouse?: boolean
  ) {
    const code = this.resolveRoomCode(roomCode);
    if (!code) return;
    const claimId = `mcl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    socialSocket.send('music:claim_bingo', {
      roomCode: code,
      playerName,
      pattern,
      linesCompleted,
      hasFullHouse,
      claimId,
    });

    if (typeof window !== 'undefined') {
      fetch('/api/rooms/music/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          senderId: socialSocket.getProfile().id || 'http-client',
          playerName,
          pattern,
          linesCompleted,
          hasFullHouse,
          claimId,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok && data) {
            this.snapshot = {
              ...this.snapshot,
              claimedMilestones: Array.isArray(data.claimedMilestones)
                ? data.claimedMilestones
                : this.snapshot.claimedMilestones,
              milestoneWinners:
                data.milestoneWinners && typeof data.milestoneWinners === 'object'
                  ? data.milestoneWinners
                  : this.snapshot.milestoneWinners,
            };
            this.notify();
            if (data.message) {
              this.rejectListeners.forEach((fn) => fn(String(data.message)));
            }
          } else if (res.ok && data?.claim) {
            this.handleIncomingClaimPayload(data.claim as Partial<MusicBingoClaimInfo>);
          }
        })
        .catch(() => {});
    }
  }

  /**
   * Spiller en vennlig og tydelig klokke/akkord med Web Audio API når et lydklipp starter.
   */
  public playChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.38);
      });
      setTimeout(() => {
        void ctx.close().catch(() => {});
      }, 800);
    } catch {
      // Ignore audio errors when muted or blocked
    }
  }

  public onClaimRejected(fn: (message: string) => void): () => void {
    this.rejectListeners.add(fn);
    return () => this.rejectListeners.delete(fn);
  }

  public onClaim(fn: (claim: MusicBingoClaimInfo & { milestone?: BingoMilestone }) => void): () => void {
    this.claimListeners.add(fn);
    return () => this.claimListeners.delete(fn);
  }

  public onNewRound(fn: (ev: MusicBingoNewRoundEvent) => void): () => void {
    this.newRoundListeners.add(fn);
    return () => this.newRoundListeners.delete(fn);
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const musicBingoService = new MusicBingoService();
