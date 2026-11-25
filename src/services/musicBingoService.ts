/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { socialSocket } from './socialSocket';
import { remoteBingo } from './remoteBingo';
import { BingoMilestone } from '../types/bingo';
import { MUSIC_BINGO_SONGS, MusicBingoSong } from '../data/musicBingoSongs';

export interface MusicBingoClaimInfo {
  playerName: string;
  pattern: string;
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
  private seenParticipantIds: Set<string> = new Set();
  private lastRecordedClaimTs: number = 0;
  private clockOffsetMs = 0;

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
          const data = payload as {
            playerName?: string;
            pattern?: string;
            milestone?: BingoMilestone;
            timestamp?: number;
          };
          if (data.playerName && data.pattern) {
            const ts = data.timestamp || Date.now();
            if (ts !== this.lastRecordedClaimTs) {
              this.lastRecordedClaimTs = ts;
              remoteBingo.recordMusicBingoClaim(data.playerName, data.pattern);
            }
            this.claimListeners.forEach((fn) =>
              fn({
                playerName: data.playerName!,
                pattern: data.pattern!,
                milestone: data.milestone,
                timestamp: ts,
              })
            );
          }
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
          }
        }
      });
    }
  }

  private applyServerState(incoming: Partial<MusicBingoSnapshot>) {
    if (typeof incoming.serverNow === 'number' && incoming.serverNow > 0) {
      this.clockOffsetMs = incoming.serverNow - Date.now();
    }
    if (Array.isArray(incoming.participants)) {
      incoming.participants.forEach((p) => {
        if (p?.id && !this.seenParticipantIds.has(p.id)) {
          this.seenParticipantIds.add(p.id);
          remoteBingo.recordParticipantJoinedExternal(p.id, p.name, '#f59e0b', 'Musikkbingo');
        }
      });
    }
    if (incoming.lastClaim && incoming.lastClaim.timestamp && incoming.lastClaim.timestamp !== this.lastRecordedClaimTs) {
      this.lastRecordedClaimTs = incoming.lastClaim.timestamp;
      remoteBingo.recordMusicBingoClaim(incoming.lastClaim.playerName, incoming.lastClaim.pattern);
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

  public startNewRound() {
    if (!remoteBingo.canActAsHost()) return;
    const nextRound = (this.snapshot.roundNumber || 1) + 1;
    this.snapshot = {
      ...this.snapshot,
      roundNumber: nextRound,
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
    const code = this.resolveRoomCode();
    if (code) {
      socialSocket.send('music:new_round', {
        roomCode: code,
        hostKey: remoteBingo.getHostKeyForService(),
        roundNumber: nextRound,
      });
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
    socialSocket.send('music:claim_bingo', {
      roomCode: code,
      playerName,
      pattern,
      linesCompleted,
      hasFullHouse,
    });
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

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const musicBingoService = new MusicBingoService();
