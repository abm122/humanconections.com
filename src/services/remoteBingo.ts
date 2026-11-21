/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { socialSocket } from './socialSocket';
import { moderation } from './moderation';
import { sessionTimer } from './sessionTimer';
import { authService } from './authService';
import { ownerControl } from './ownerControl';
import { firebasePersistence } from './firebasePersistence';
import { CalledBall } from '../types/bingo';
import { JOYFUL_BALLS_MAP } from '../data/prompts';

export interface RemoteParticipant {
  id: string;
  name: string;
  color?: string;
  joinedAt?: number;
}

export interface RemoteBingoClaim {
  userId: string;
  playerName: string;
  pattern: string;
  cardIndex: number;
  isFullHouse?: boolean;
  roundNumber?: number;
  autoNewRoundDelayMs?: number;
  timestamp: number;
}

export interface BingoNewRoundEvent {
  roomCode: string;
  roundNumber: number;
  winnerName?: string;
  reason: 'fullbrett' | 'host';
  timestamp: number;
}

export interface BingoTvPlayerSummary {
  id: string;
  name: string;
  avatarColor: string;
  linesCompleted: number;
  hasBingo: boolean;
  isRemote?: boolean;
}

export interface BingoTvState {
  roomId: string;
  roomCode: string;
  showCodeOnScreen: boolean;
  hostName: string;
  roundNumber?: number;
  calledBalls: CalledBall[];
  playersSummary: BingoTvPlayerSummary[];
  connectedParticipants?: RemoteParticipant[];
  totalPlayersCount?: number;
  themeTitle?: string;
  lastClaim?: { playerName: string; pattern: string; isFullHouse?: boolean; timestamp: number } | null;
  serverNow: number;
}

const STORAGE_KEY_HOST_CODE = 'joybingo_remote_host_code';
const STORAGE_KEY_ROUND_LOCKED = 'joybingo_round_code_locked';
const STORAGE_KEY_PLAYER_NAME = 'joybingo_remote_player_name';
const STORAGE_KEY_HOST_NAME = 'joybingo_remote_host_name';
const STORAGE_KEY_HOST_KEY = 'joybingo_host_secret_key';

class RemoteBingoService {
  private hostCode: string = '';
  private codeLockedForRound: boolean = false;
  private hostName: string = 'Arrangør';
  private currentRoomCode: string | null = null;
  private isHost: boolean = false;
  private isRemotePlayer: boolean = false;
  private playerName: string = '';
  private remoteParticipants: RemoteParticipant[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();
  private claimListeners: Set<(claim: RemoteBingoClaim) => void> = new Set();
  private ballListeners: Set<(ball: CalledBall) => void> = new Set();
  private syncRequestListeners: Set<(requesterId: string) => void> = new Set();
  private syncProvidedListeners: Set<(balls: CalledBall[]) => void> = new Set();
  private joinListeners: Set<(participant: RemoteParticipant, totalCount: number) => void> = new Set();
  private newRoundListeners: Set<(ev: BingoNewRoundEvent) => void> = new Set();
  private roundNumber: number = 1;
  private showCodeOnBigScreen: boolean = true;
  private tvState: BingoTvState | null = null;
  private isTvViewerMode: boolean = false;
  private serverActiveCode: string = '';
  private registrationError: string | null = null;
  private calledBallNumbersCache: number[] = [];
  private playersSummaryCache: BingoTvPlayerSummary[] = [];
  private quizStateCache: Record<string, unknown> | null = null;
  private lastActiveGameCache: 'bingo' | 'quiz' = 'bingo';
  private lastEditionCache: 'adult' | 'family' | 'christmas' = 'adult';
  private lastCloudSyncSignature: string = '';
  private cloudSynced: boolean = false;
  private seenParticipantIds: Set<string> = new Set();
  private remoteRoomUnsub: (() => void) | null = null;
  private tvStateListeners: Set<(state: BingoTvState) => void> = new Set();
  private tvModeChangeListeners: Set<(game: 'bingo' | 'quiz') => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Gjenopprett lagret kode kun dersom arrangør/eier allerede har gyldig tilgang; ikke slett fra localStorage før async Firebase-auth rekker å laste
      if (sessionTimer.hasFullPaidAccess() || this.canActAsHost()) {
        const savedHost = localStorage.getItem(STORAGE_KEY_HOST_CODE);
        if (savedHost && savedHost.length >= 3) {
          this.hostCode = savedHost;
          this.codeLockedForRound = localStorage.getItem(STORAGE_KEY_ROUND_LOCKED) === '1';
        }
      }

      const savedPlayerName = localStorage.getItem(STORAGE_KEY_PLAYER_NAME);
      if (savedPlayerName) {
        this.playerName = savedPlayerName;
      }

      const savedHostName = localStorage.getItem(STORAGE_KEY_HOST_NAME);
      if (savedHostName) {
        this.hostName = savedHostName;
      }

      try {
        this.broadcastChannel = new BroadcastChannel('joybingo_remote_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleChannelMessage(event.data);
        };
      } catch {
        // BroadcastChannel may fail in some restricted environments
      }

      sessionTimer.subscribe(() => {
        if (!sessionTimer.hasFullPaidAccess() && !this.isRemotePlayer && !this.canActAsHost()) {
          if (this.hostCode || this.isHost) {
            this.clearPaidHostCode();
          }
        }
      });

      firebasePersistence.subscribeAuth(() => {
        if (firebasePersistence.isHostCloudCapable() && this.isHost && this.canActAsHost() && this.hostCode) {
          void this.syncRoomToFirestore(this.hostCode, this.lastActiveGameCache, true, this.lastEditionCache);
        } else if (!firebasePersistence.isHostCloudCapable()) {
          this.cloudSynced = false;
          this.notify();
        }
      });

      this.setupSocketListeners();
    }
  }

  public canActAsHost(): boolean {
    if (this.isRemotePlayer && !ownerControl.isUnlocked()) {
      return false;
    }
    if (ownerControl.isUnlocked() || authService.isOwnerAuthenticated()) {
      return true;
    }
    const user = authService.getCurrentUser();
    return Boolean(user.isAuthenticated && sessionTimer.hasFullPaidAccess());
  }

  public getHostKeyForService(): string {
    if (!this.canActAsHost()) return '';
    return this.getOrCreateHostKey();
  }

  private getOrCreateHostKey(): string {
    if (typeof window === 'undefined') return '';
    let key =
      localStorage.getItem(STORAGE_KEY_HOST_KEY) ||
      sessionStorage.getItem(STORAGE_KEY_HOST_KEY) ||
      '';
    if (!key) {
      key = `hk-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
    localStorage.setItem(STORAGE_KEY_HOST_KEY, key);
    sessionStorage.setItem(STORAGE_KEY_HOST_KEY, key);
    return key;
  }

  private generateRandomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private mapBallNumbersToCalledBalls(numbers: number[]): CalledBall[] {
    if (!Array.isArray(numbers) || numbers.length === 0) return [];
    const byNum = new Map<number, (typeof JOYFUL_BALLS_MAP)[number]>();
    JOYFUL_BALLS_MAP.forEach((b) => byNum.set(b.number, b));
    const list: CalledBall[] = [];
    numbers.forEach((raw) => {
      const n = Number(raw);
      const found = byNum.get(n);
      if (found) {
        list.push({ ...found, timestamp: 0 });
      }
    });
    return list;
  }

  private async syncRoomToFirestore(
    activeCode: string,
    activeGame: 'bingo' | 'quiz' = 'bingo',
    force = false,
    edition: 'adult' | 'family' | 'christmas' = 'adult'
  ): Promise<void> {
    if (!activeCode || !this.canActAsHost()) return;
    this.lastActiveGameCache = activeGame;
    this.lastEditionCache = edition;
    if (!firebasePersistence.isHostCloudCapable()) {
      if (this.cloudSynced) {
        this.cloudSynced = false;
        this.notify();
      }
      return;
    }
    const quizSig = this.quizStateCache ? JSON.stringify(this.quizStateCache).slice(0, 240) : '';
    const playersSig = this.playersSummaryCache.map((p) => `${p.id}:${p.linesCompleted}:${p.hasBingo}`).join(',');
    const sig = `${activeCode}|${this.hostName}|${activeGame}|${edition}|${this.showCodeOnBigScreen}|${this.calledBallNumbersCache.join(',')}|${playersSig}|${quizSig}`;
    if (!force && sig === this.lastCloudSyncSignature) return;
    this.lastCloudSyncSignature = sig;
    const res = await firebasePersistence.syncActiveRoom({
      roomCode: activeCode,
      hostName: this.hostName,
      activeGame,
      hasBingo: true,
      hasQuiz: true,
      edition,
      calledBallNumbers: this.calledBallNumbersCache,
      showCodeOnScreen: this.showCodeOnBigScreen,
      playersSummary: this.playersSummaryCache.slice(0, 32),
      quizState: this.quizStateCache || undefined,
    });
    if (res.conflict) {
      const freshCode = this.rotateCodeAfterCollision();
      void this.registerRoomOnServer(freshCode, 0, 1);
      return;
    }
    if (res.ok !== this.cloudSynced) {
      this.cloudSynced = res.ok;
      this.notify();
    }
  }

  private rotateCodeAfterCollision(): string {
    const newCode = this.generateRandomCode();
    this.hostCode = newCode;
    this.codeLockedForRound = true;
    this.lastCloudSyncSignature = '';
    this.seenParticipantIds.clear();
    if (this.isHost) {
      this.currentRoomCode = newCode;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOST_CODE, newCode);
      localStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
    }
    if (this.isHost) {
      const hostKey = this.getOrCreateHostKey();
      const roomId = `joy-bingo-${newCode}`;
      socialSocket.connect(roomId);
      socialSocket.send('bingo:host_init', { roomCode: newCode, hostName: this.hostName, hostKey });
    }
    this.notify();
    return newCode;
  }

  private async registerRoomOnServer(
    activeCode: string,
    retryAttempt = 0,
    collisionDepth = 0
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !activeCode || !this.canActAsHost()) return false;
    const hostKey = this.getOrCreateHostKey();
    try {
      const resp = await fetch('/api/rooms/register', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bingo',
          roomCode: activeCode,
          hostName: this.hostName,
          hostKey,
        }),
      });
      if (resp.ok) {
        this.serverActiveCode = activeCode;
        this.registrationError = null;
        this.notify();
        void this.syncRoomToFirestore(activeCode, 'bingo', false);
        return true;
      }
      if (resp.status === 403 && collisionDepth < 3) {
        const freshCode = this.rotateCodeAfterCollision();
        return await this.registerRoomOnServer(freshCode, 0, collisionDepth + 1);
      }
      this.registrationError = 'Kunne ikke aktivere koden mot serveren.';
      this.notify();
    } catch {
      this.registrationError = 'Nettverksfeil ved aktivering av kode.';
    }
    if (retryAttempt < 2) {
      const delayMs = retryAttempt === 0 ? 1200 : 3500;
      setTimeout(() => {
        if (this.hostCode === activeCode && this.canActAsHost()) {
          void this.registerRoomOnServer(activeCode, retryAttempt + 1, collisionDepth);
        }
      }, delayMs);
    }
    return false;
  }

  private setupSocketListeners() {
    socialSocket.on('connection:open', () => {
      if (this.isHost && this.canActAsHost() && this.hostCode) {
        const hostKey = this.getOrCreateHostKey();
        socialSocket.send('bingo:host_init', {
          roomCode: this.hostCode,
          hostName: this.hostName,
          hostKey,
        });
        void this.registerRoomOnServer(this.hostCode);
      } else if (this.isRemotePlayer && this.currentRoomCode) {
        socialSocket.send('room:join', { roomId: `joy-bingo-${this.currentRoomCode}` });
        socialSocket.send('caller:request_sync', { roomCode: this.currentRoomCode });
      }
    });

    socialSocket.on('room:init', (payload: any) => {
      if (payload && Array.isArray(payload.participants)) {
        const incoming = payload.participants as RemoteParticipant[];
        incoming.forEach((p) => {
          if (p?.id) this.seenParticipantIds.add(p.id);
        });
        this.remoteParticipants = incoming;
        this.notify();
      }
    });

    socialSocket.on('room:state', (payload: any) => {
      if (payload && Array.isArray(payload.participants)) {
        const incoming = payload.participants as RemoteParticipant[];
        const myId = socialSocket.getProfile().id;
        const newlyJoined =
          this.isHost && this.canActAsHost()
            ? incoming.filter((p) => p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id))
            : [];
        incoming.forEach((p) => {
          if (p?.id) this.seenParticipantIds.add(p.id);
        });
        this.remoteParticipants = incoming;
        newlyJoined.forEach((p) => {
          this.joinListeners.forEach((fn) => fn(p, incoming.length));
        });
        this.notify();
      }
    });

    socialSocket.on('user:joined', (payload: any) => {
      if (payload && Array.isArray(payload.participants)) {
        const incoming = payload.participants as RemoteParticipant[];
        const myId = socialSocket.getProfile().id;
        const newlyJoined =
          this.isHost && this.canActAsHost()
            ? incoming.filter((p) => p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id))
            : [];
        incoming.forEach((p) => {
          if (p?.id) this.seenParticipantIds.add(p.id);
        });
        this.remoteParticipants = incoming;
        if (newlyJoined.length > 0) {
          newlyJoined.forEach((p) => {
            this.joinListeners.forEach((fn) => fn(p, incoming.length));
          });
        } else if (
          this.isHost &&
          this.canActAsHost() &&
          payload.user &&
          payload.user.id &&
          payload.user.id !== myId &&
          !this.seenParticipantIds.has(payload.user.id)
        ) {
          this.seenParticipantIds.add(payload.user.id);
          this.joinListeners.forEach((fn) => fn(payload.user as RemoteParticipant, incoming.length));
        }
        this.notify();
      }
    });

    socialSocket.on('user:left', (payload: any) => {
      if (payload && Array.isArray(payload.participants)) {
        this.remoteParticipants = payload.participants;
        this.notify();
      }
    });

    socialSocket.on('bingo:remote_claimed', (payload: any) => {
      if (payload && payload.playerName) {
        const claim: RemoteBingoClaim = {
          userId: payload.userId || 'remote-user',
          playerName: payload.playerName,
          pattern: payload.pattern || 'FULLBRETT BINGO',
          cardIndex: payload.cardIndex ?? 0,
          isFullHouse: Boolean(payload.isFullHouse),
          roundNumber: Number(payload.roundNumber) || this.roundNumber,
          autoNewRoundDelayMs: Number(payload.autoNewRoundDelayMs) || 0,
          timestamp: payload.timestamp || Date.now(),
        };
        this.claimListeners.forEach((fn) => fn(claim));
      }
    });

    socialSocket.on('bingo:new_round', (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const nextRound = Number(payload.roundNumber) || this.roundNumber + 1;
      this.roundNumber = nextRound;
      this.calledBallNumbersCache = [];
      this.lastCloudSyncSignature = '';
      if (this.tvState) {
        this.tvState = {
          ...this.tvState,
          roundNumber: nextRound,
          calledBalls: [],
          lastClaim: null,
          serverNow: Date.now(),
        };
        this.tvStateListeners.forEach((fn) => fn(this.tvState!));
      }
      const ev: BingoNewRoundEvent = {
        roomCode: String(payload.roomCode || this.currentRoomCode || this.hostCode || ''),
        roundNumber: nextRound,
        winnerName: payload.winnerName ? String(payload.winnerName) : undefined,
        reason: payload.reason === 'host' ? 'host' : 'fullbrett',
        timestamp: Number(payload.timestamp) || Date.now(),
      };
      if (this.isHost && this.canActAsHost() && this.hostCode) {
        void this.syncRoomToFirestore(this.hostCode, 'bingo', true);
      }
      this.newRoundListeners.forEach((fn) => fn(ev));
      this.notify();
    });

    socialSocket.on('caller:sync_ball', (ball: any) => {
      if (ball && typeof ball.number === 'number') {
        this.ballListeners.forEach((fn) => fn(ball as CalledBall));
      }
    });

    socialSocket.on('caller:sync_requested', (payload: any) => {
      if (this.isHost && this.canActAsHost() && payload && payload.requesterId) {
        this.syncRequestListeners.forEach((fn) => fn(payload.requesterId));
      }
    });

    socialSocket.on('caller:sync_provided', (payload: any) => {
      if (!this.isRemotePlayer) return;
      if (payload && Array.isArray(payload.balls)) {
        const myId = socialSocket.getProfile().id;
        if (!payload.requesterId || payload.requesterId === myId) {
          this.syncProvidedListeners.forEach((fn) => fn(payload.balls as CalledBall[]));
        }
      }
    });

    socialSocket.on('bingo:tv_state', (payload: any) => {
      if (payload && typeof payload === 'object') {
        const showCode = payload.showCodeOnScreen !== false;
        if (typeof payload.roundNumber === 'number' && payload.roundNumber > 0) {
          this.roundNumber = payload.roundNumber;
        }
        const sanitized: BingoTvState = {
          ...(payload as BingoTvState),
          roundNumber: Number(payload.roundNumber) || this.roundNumber,
          showCodeOnScreen: showCode,
          roomCode:
            this.isTvViewerMode && !showCode
              ? ''
              : String(payload.roomCode || ''),
        };
        this.tvState = sanitized;
        if (this.canActAsHost()) {
          this.showCodeOnBigScreen = showCode;
        }
        this.tvStateListeners.forEach((fn) => fn(sanitized));
        this.notify();
      }
    });

    socialSocket.on('tv:mode_changed', (payload: any) => {
      if (payload && (payload.game === 'bingo' || payload.game === 'quiz')) {
        this.tvModeChangeListeners.forEach((fn) => fn(payload.game));
      }
    });
  }

  private handleChannelMessage(data: any) {
    if (!data || !data.type) return;
    if (data.type === 'bingo:remote_claimed' && data.payload) {
      this.claimListeners.forEach((fn) => fn(data.payload));
    } else if (data.type === 'caller:sync_ball' && data.payload && this.isRemotePlayer) {
      this.ballListeners.forEach((fn) => fn(data.payload));
    } else if (data.type === 'bingo:tv_state' && data.payload) {
      const incoming = data.payload as BingoTvState;
      const showCode = incoming.showCodeOnScreen !== false;
      const sanitized: BingoTvState = {
        ...incoming,
        showCodeOnScreen: showCode,
        roomCode:
          this.isTvViewerMode && !showCode
            ? ''
            : String(incoming.roomCode || ''),
      };
      this.tvState = sanitized;
      this.tvStateListeners.forEach((fn) => fn(sanitized));
      this.notify();
    }
  }

  public getHostCode(): string {
    if (!this.canActAsHost()) {
      return '';
    }
    return this.hostCode;
  }

  public isCodeLockedForRound(): boolean {
    return this.codeLockedForRound && Boolean(this.hostCode && this.hostCode.length >= 4);
  }

  public ensurePaidHostCode(): string {
    if (!this.canActAsHost()) {
      return '';
    }
    if (!this.hostCode || this.hostCode.length < 3) {
      if (typeof window !== 'undefined') {
        const savedHost = localStorage.getItem(STORAGE_KEY_HOST_CODE);
        if (savedHost && savedHost.length >= 3) {
          this.hostCode = savedHost;
          this.codeLockedForRound = localStorage.getItem(STORAGE_KEY_ROUND_LOCKED) === '1';
        }
      }
    }
    if (!this.hostCode || this.hostCode.length < 3) {
      this.hostCode = this.generateRandomCode();
      this.codeLockedForRound = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
        localStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
      }
      this.notify();
    } else if (!this.codeLockedForRound) {
      this.codeLockedForRound = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
      }
      this.notify();
    }
    return this.hostCode;
  }

  public unlockCodeForNewRound() {
    if (!this.canActAsHost()) return;
    this.codeLockedForRound = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
    }
    this.notify();
  }

  public startNewRound(): string {
    if (!this.canActAsHost()) return '';
    this.codeLockedForRound = false;
    this.calledBallNumbersCache = [];
    this.lastCloudSyncSignature = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
    }
    return this.generateNewHostCode();
  }

  public clearPaidHostCode() {
    const oldCode = this.hostCode || this.currentRoomCode;
    const hostKey =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY_HOST_KEY) ||
          sessionStorage.getItem(STORAGE_KEY_HOST_KEY) ||
          undefined
        : undefined;
    this.hostCode = '';
    this.serverActiveCode = '';
    this.registrationError = null;
    this.calledBallNumbersCache = [];
    this.lastCloudSyncSignature = '';
    this.codeLockedForRound = false;
    this.isHost = false;
    if (!this.isRemotePlayer) {
      this.currentRoomCode = null;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      if (oldCode) {
        fetch('/api/rooms/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: oldCode, hostKey }),
        }).catch(() => {});
        socialSocket.send('bingo:host_leave', { roomCode: oldCode, hostKey });
        void firebasePersistence.deleteActiveRoom(oldCode);
      }
    }
    this.notify();
  }

  public generateNewHostCode(): string {
    if (!this.canActAsHost()) {
      return '';
    }
    // Koden genereres maks 1 gang per aktive runde, og kun av arrangør
    if (this.isCodeLockedForRound()) {
      return '';
    }
    const oldCode = this.hostCode;
    const hostKey = this.getOrCreateHostKey();
    if (oldCode && typeof window !== 'undefined') {
      fetch('/api/rooms/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bingo', roomCode: oldCode, hostKey }),
      }).catch(() => {});
      socialSocket.send('bingo:host_leave', { roomCode: oldCode, hostKey });
      void firebasePersistence.deleteActiveRoom(oldCode);
    }
    this.hostCode = this.generateRandomCode();
    this.codeLockedForRound = true;
    this.calledBallNumbersCache = [];
    this.lastCloudSyncSignature = '';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
      localStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
    }
    if (this.isHost) {
      this.activateHostSession(this.hostCode);
    }
    this.notify();
    return this.hostCode;
  }

  public setCustomHostCode(code: string): boolean {
    if (!this.canActAsHost()) return false;
    if (this.isCodeLockedForRound()) return false;
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 3 || clean.length > 8) return false;
    this.hostCode = clean;
    this.codeLockedForRound = true;
    this.lastCloudSyncSignature = '';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
      localStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
    }
    if (this.isHost) {
      this.activateHostSession(this.hostCode);
    }
    this.notify();
    return true;
  }

  public getHostName(): string {
    return this.hostName || 'Arrangør';
  }

  public setHostName(name: string) {
    if (!this.canActAsHost()) return;
    const clean = name.trim();
    if (!clean) return;
    this.hostName = clean;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOST_NAME, this.hostName);
    }
    socialSocket.updateProfile(this.hostName);
    if (this.isHost && this.hostCode) {
      void this.syncRoomToFirestore(this.hostCode, 'bingo', false);
    }
    this.notify();
  }

  public isRoomActiveOnServer(): boolean {
    return Boolean(this.hostCode && this.serverActiveCode === this.hostCode);
  }

  public isCloudRoomSynced(): boolean {
    return this.cloudSynced && firebasePersistence.isHostCloudCapable();
  }

  public getRegistrationError(): string | null {
    return this.registrationError;
  }

  public notifyQuizHosted(code: string, edition: 'adult' | 'family' | 'christmas') {
    if (!this.canActAsHost() || !code) return;
    void this.syncRoomToFirestore(code, 'quiz', true, edition);
  }

  public syncQuizStateToCloud(
    quizState: Record<string, unknown>,
    edition: 'adult' | 'family' | 'christmas' = 'adult'
  ) {
    if (!this.canActAsHost()) return;
    this.quizStateCache = quizState;
    const activeCode = this.hostCode || this.currentRoomCode;
    if (!activeCode) return;
    void this.syncRoomToFirestore(activeCode, 'quiz', false, edition);
  }

  public heartbeatHostSession(hostProfileName?: string) {
    if (!this.canActAsHost() || this.isRemotePlayer) return;
    const activeCode = this.hostCode || this.ensurePaidHostCode();
    if (!activeCode) return;
    if (hostProfileName && hostProfileName.trim() && hostProfileName.trim() !== this.hostName) {
      this.hostName = hostProfileName.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HOST_NAME, this.hostName);
      }
      socialSocket.updateProfile(this.hostName);
    }
    void this.registerRoomOnServer(activeCode);
  }

  public reactivateCurrentHostCode(): string {
    if (!this.canActAsHost()) return '';
    this.serverActiveCode = '';
    this.registrationError = null;
    this.lastCloudSyncSignature = '';
    return this.activateHostSession(this.hostCode || undefined, this.hostName, true);
  }

  public activateHostSession(code?: string, hostProfileName?: string, forceReconnect = false): string {
    if (!this.canActAsHost()) {
      this.isHost = false;
      this.notify();
      return '';
    }
    const activeCode = (code && code.trim().toUpperCase()) || this.ensurePaidHostCode();
    if (!activeCode) return '';

    const wasAlreadySameHost = this.isHost && this.hostCode === activeCode;
    const hostKey = this.getOrCreateHostKey();
    this.hostCode = activeCode;
    this.isHost = true;
    this.isRemotePlayer = false;
    this.currentRoomCode = activeCode;
    if (hostProfileName && hostProfileName.trim()) {
      this.hostName = hostProfileName.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HOST_NAME, this.hostName);
      }
      socialSocket.updateProfile(this.hostName);
    }
    const roomId = `joy-bingo-${activeCode}`;
    if (forceReconnect || !wasAlreadySameHost) {
      socialSocket.connect(roomId);
    }
    socialSocket.send('bingo:host_init', { roomCode: activeCode, hostName: this.hostName, hostKey });
    void this.registerRoomOnServer(activeCode);
    this.notify();
    return activeCode;
  }

  private stopRemoteRoomSubscription() {
    if (this.remoteRoomUnsub) {
      try {
        this.remoteRoomUnsub();
      } catch {
        // ignore
      }
      this.remoteRoomUnsub = null;
    }
  }

  private attachRemoteBingoCloudSync(cleanCode: string) {
    this.stopRemoteRoomSubscription();
    this.remoteRoomUnsub = firebasePersistence.subscribeActiveRoom(cleanCode, (rec) => {
      if (!rec) return;
      const calledBalls = this.mapBallNumbersToCalledBalls(rec.calledBallNumbers || []);
      if (this.isRemotePlayer && this.currentRoomCode === cleanCode && calledBalls.length > 0) {
        this.syncProvidedListeners.forEach((fn) => fn(calledBalls));
      }
      if (this.isTvViewerMode) {
        const showCode = rec.showCodeOnScreen !== false;
        const tvPayload: BingoTvState = {
          roomId: `joy-bingo-${cleanCode}`,
          roomCode: showCode ? cleanCode : '',
          showCodeOnScreen: showCode,
          hostName: rec.hostName || 'Arrangør',
          calledBalls,
          playersSummary: Array.isArray(rec.playersSummary)
            ? rec.playersSummary.map((p, idx) => ({
                id: p.id || `cloud-p-${idx}`,
                name: p.name,
                avatarColor: p.avatarColor || '#f59e0b',
                linesCompleted: p.linesCompleted,
                hasBingo: p.hasBingo,
              }))
            : [],
          themeTitle: this.tvState?.themeTitle || 'Storskjerm',
          lastClaim: this.tvState?.lastClaim || null,
          serverNow: rec.updatedAt || Date.now(),
        };
        this.tvState = tvPayload;
        this.tvStateListeners.forEach((fn) => fn(tvPayload));
        this.notify();
      }
    });
  }

  public async validateAndJoinAsRemotePlayer(
    code: string,
    rawName: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 3) {
      return { success: false, error: 'Vennligst skriv inn en gyldig spillkode (minst 3 tegn).' };
    }

    const trimmedName = rawName.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: 'Skriv inn et kallenavn på minst 2 tegn.' };
    }

    const modResult = moderation.filterText(trimmedName);
    if (modResult.hasBannedWords) {
      return { success: false, error: 'Upassende ord er ikke tillatt. Velg et hyggelig navn for sosial trivsel.' };
    }

    let isValid = false;
    let cloudFallbackBalls: CalledBall[] = [];

    try {
      const resp = await fetch(`/api/rooms/validate?type=bingo&code=${encodeURIComponent(cleanCode)}`, {
        cache: 'no-store',
      });
      if (resp.ok) {
        const check = await resp.json();
        isValid = Boolean(check?.valid);
      }
    } catch {
      // Fallback to Firestore below
    }

    if (!isValid) {
      const cloudRoom = await firebasePersistence.getActiveRoomFromFirestore(cleanCode);
      if (cloudRoom && (cloudRoom.hasBingo || cloudRoom.activeGame === 'bingo' || !cloudRoom.activeGame)) {
        isValid = true;
        cloudFallbackBalls = this.mapBallNumbersToCalledBalls(cloudRoom.calledBallNumbers || []);
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Fant ingen aktiv bingovert med denne koden. Sjekk at arrangøren har åpnet rommet og aktivert koden.',
      };
    }

    const joined = this.joinAsRemotePlayer(cleanCode, trimmedName);
    if (joined.success && cloudFallbackBalls.length > 0) {
      setTimeout(() => {
        if (this.isRemotePlayer && this.currentRoomCode === cleanCode) {
          this.syncProvidedListeners.forEach((fn) => fn(cloudFallbackBalls));
        }
      }, 150);
    }
    return joined;
  }

  public joinAsRemotePlayer(code: string, rawName: string): { success: boolean; error?: string } {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 3) {
      return { success: false, error: 'Vennligst skriv inn en gyldig spillkode (minst 3 tegn).' };
    }

    const trimmedName = rawName.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: 'Skriv inn et kallenavn på minst 2 tegn.' };
    }

    // Filter banned words for social wellbeing
    const modResult = moderation.filterText(trimmedName);
    if (modResult.hasBannedWords) {
      return { success: false, error: 'Upassende ord er ikke tillatt. Velg et hyggelig navn for sosial trivsel.' };
    }

    this.playerName = modResult.cleanText;
    this.currentRoomCode = cleanCode;
    this.isRemotePlayer = true;
    this.isHost = false;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PLAYER_NAME, this.playerName);
    }

    const roomId = `joy-bingo-${cleanCode}`;
    socialSocket.updateProfile(this.playerName);
    socialSocket.connect(roomId);

    // Marker kun at spiller deltar i vertens eksterne økt (gir IKKE vertstilgang til andre spill)
    sessionTimer.setRemoteAccessGranted(true);

    // Live Firestore subscription + WS + HTTP sync for cross-device / cross-instance resilience
    this.attachRemoteBingoCloudSync(cleanCode);

    socialSocket.send('caller:request_sync', { roomCode: cleanCode });
    setTimeout(() => {
      if (this.isRemotePlayer && this.currentRoomCode === cleanCode) {
        socialSocket.send('caller:request_sync', { roomCode: cleanCode });
        fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((st) => {
            if (this.isRemotePlayer && this.currentRoomCode === cleanCode && Array.isArray(st?.calledBalls) && st.calledBalls.length > 0) {
              this.syncProvidedListeners.forEach((fn) => fn(st.calledBalls as CalledBall[]));
            }
          })
          .catch(() => {});
      }
    }, 650);

    this.notify();
    return { success: true };
  }

  public leaveRemoteSession() {
    const oldCode = this.currentRoomCode;
    const wasHost = this.isHost;
    const hostKey =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY_HOST_KEY) ||
          sessionStorage.getItem(STORAGE_KEY_HOST_KEY) ||
          undefined
        : undefined;
    this.stopRemoteRoomSubscription();
    this.seenParticipantIds.clear();
    this.isRemotePlayer = false;
    this.isHost = false;
    this.currentRoomCode = null;
    if (wasHost) {
      this.serverActiveCode = '';
      this.calledBallNumbersCache = [];
      this.playersSummaryCache = [];
      this.quizStateCache = null;
      this.lastCloudSyncSignature = '';
      this.cloudSynced = false;
    }
    sessionTimer.setRemoteAccessGranted(false);
    if (wasHost && oldCode) {
      socialSocket.send('bingo:host_leave', { roomCode: oldCode, hostKey });
      if (typeof window !== 'undefined') {
        fetch('/api/rooms/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'bingo', roomCode: oldCode, hostKey }),
        }).catch(() => {});
        void firebasePersistence.deleteActiveRoom(oldCode);
      }
    }
    socialSocket.joinRoom('joy-lounge');
    this.notify();
  }

  public claimBingo(
    pattern: string = 'FULLBRETT',
    cardIndex: number = 0,
    isFullHouse: boolean = true,
    overridePlayerName?: string,
    confirmedNumbers?: number[]
  ) {
    const activeCode = this.currentRoomCode || this.hostCode || undefined;
    const claim: RemoteBingoClaim = {
      userId: socialSocket.getProfile().id,
      playerName: (overridePlayerName && overridePlayerName.trim()) || this.playerName || socialSocket.getProfile().name,
      pattern,
      cardIndex,
      isFullHouse,
      roundNumber: this.roundNumber,
      autoNewRoundDelayMs: isFullHouse ? 4500 : 0,
      timestamp: Date.now(),
    };

    socialSocket.send('bingo:remote_claim', {
      roomCode: activeCode,
      playerName: claim.playerName,
      pattern: claim.pattern,
      isFullHouse,
      cardIndex: claim.cardIndex,
      confirmedNumbers,
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'bingo:remote_claimed',
        payload: claim,
      });
    }

    // Trigger local listeners too so player sees instant feedback
    this.claimListeners.forEach((fn) => fn(claim));
  }

  public broadcastRoundResetToRoom(winnerName?: string) {
    if (!this.canActAsHost()) return;
    const hostKey = this.getOrCreateHostKey();
    const activeCode = this.hostCode || this.currentRoomCode || '';
    this.calledBallNumbersCache = [];
    this.lastCloudSyncSignature = '';
    if (activeCode) {
      socialSocket.send('bingo:start_new_round', {
        roomCode: activeCode,
        hostKey,
        winnerName,
      });
      void this.syncRoomToFirestore(activeCode, 'bingo', true);
    }
  }

  public sendRemotePlayerProgress(data: {
    playerName: string;
    linesCompleted: number;
    hasBingo: boolean;
    avatarColor?: string;
  }) {
    if (!this.isRemotePlayer || !this.currentRoomCode) return;
    socialSocket.send('bingo:player_progress', {
      roomCode: this.currentRoomCode,
      playerName: data.playerName,
      linesCompleted: data.linesCompleted,
      hasBingo: data.hasBingo,
      avatarColor: data.avatarColor,
    });
  }

  public broadcastBallToRoom(ball: CalledBall) {
    if (!this.canActAsHost()) return;
    const hostKey = this.getOrCreateHostKey();
    const activeCode = this.hostCode || this.currentRoomCode || undefined;
    if (typeof ball?.number === 'number' && !this.calledBallNumbersCache.includes(ball.number)) {
      this.calledBallNumbersCache = [...this.calledBallNumbersCache, ball.number];
    }
    socialSocket.send('caller:ball_drawn', { ball, hostKey, roomCode: activeCode, hostName: this.hostName });
    if (activeCode) {
      void this.syncRoomToFirestore(activeCode, 'bingo', false);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'caller:sync_ball',
        payload: ball,
      });
    }
  }

  public provideBallSyncToRoom(balls: CalledBall[], requesterId?: string) {
    if (!this.canActAsHost()) return;
    const hostKey = this.getOrCreateHostKey();
    const activeCode = this.hostCode || this.currentRoomCode || undefined;
    socialSocket.send('caller:provide_sync', {
      roomCode: activeCode,
      balls,
      requesterId,
      hostKey,
    });
  }

  public kickParticipant(targetUserId: string, targetUserName: string) {
    if (!this.canActAsHost()) return;
    socialSocket.banUser(targetUserId, targetUserName);
    this.remoteParticipants = this.remoteParticipants.filter((p) => p.id !== targetUserId);
    this.notify();
  }

  public getIsHost(): boolean {
    return this.isHost && this.canActAsHost();
  }

  public getIsRemotePlayer(): boolean {
    return this.isRemotePlayer;
  }

  public getCurrentRoomCode(): string | null {
    return this.currentRoomCode;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public getParticipants(): RemoteParticipant[] {
    return this.remoteParticipants;
  }

  public getConnectedRemotePlayers(): RemoteParticipant[] {
    const myId = socialSocket.getProfile().id;
    return this.remoteParticipants.filter((p) => p?.id && p.id !== myId);
  }

  public getRoundNumber(): number {
    return this.roundNumber;
  }

  public onNewRound(fn: (ev: BingoNewRoundEvent) => void): () => void {
    this.newRoundListeners.add(fn);
    return () => this.newRoundListeners.delete(fn);
  }

  public onClaim(fn: (claim: RemoteBingoClaim) => void): () => void {
    this.claimListeners.add(fn);
    return () => this.claimListeners.delete(fn);
  }

  public onBall(fn: (ball: CalledBall) => void): () => void {
    this.ballListeners.add(fn);
    return () => this.ballListeners.delete(fn);
  }

  public onSyncRequest(fn: (requesterId: string) => void): () => void {
    this.syncRequestListeners.add(fn);
    return () => this.syncRequestListeners.delete(fn);
  }

  public onSyncProvided(fn: (balls: CalledBall[]) => void): () => void {
    this.syncProvidedListeners.add(fn);
    return () => this.syncProvidedListeners.delete(fn);
  }

  public onParticipantJoined(fn: (participant: RemoteParticipant, totalCount: number) => void): () => void {
    this.joinListeners.add(fn);
    return () => this.joinListeners.delete(fn);
  }

  public isShowCodeOnBigScreen(): boolean {
    return this.showCodeOnBigScreen;
  }

  public toggleCodeOnBigScreen(show: boolean) {
    if (!this.canActAsHost()) return;
    this.showCodeOnBigScreen = show;
    const hostKey = this.getOrCreateHostKey();
    const activeCode = this.hostCode || this.currentRoomCode || '';
    if (activeCode) {
      socialSocket.send('bingo:toggle_code_on_screen', {
        roomCode: activeCode,
        showCodeOnScreen: show,
        hostKey,
        hostName: this.hostName,
      });
      void this.syncRoomToFirestore(activeCode, 'bingo', false);
    }
    if (this.tvState) {
      const nextTv: BingoTvState = {
        ...this.tvState,
        showCodeOnScreen: show,
        roomCode: show ? activeCode : '',
        serverNow: Date.now(),
      };
      this.tvState = nextTv;
      this.broadcastChannel?.postMessage({ type: 'bingo:tv_state', payload: nextTv });
      this.tvStateListeners.forEach((fn) => fn(nextTv));
    }
    this.notify();
  }

  public syncTvStateToRoom(data: {
    calledBalls: CalledBall[];
    players: Array<{
      id: string;
      name: string;
      avatarColor: string;
      linesCompleted: number;
      hasBingo: boolean;
    }>;
    themeTitle?: string;
  }) {
    if (!this.canActAsHost()) return;
    const activeCode = this.hostCode || this.currentRoomCode;
    if (!activeCode) return;

    this.calledBallNumbersCache = (Array.isArray(data.calledBalls) ? data.calledBalls : [])
      .map((b) => Number(b.number))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 75);

    const hostKey = this.getOrCreateHostKey();
    const localSummary: BingoTvPlayerSummary[] = data.players.slice(0, 32).map((p) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      linesCompleted: p.linesCompleted,
      hasBingo: p.hasBingo,
      isRemote: false,
    }));
    const existingRemoteMap = new Map<string, BingoTvPlayerSummary>();
    (this.tvState?.playersSummary || []).forEach((p) => {
      if (p.isRemote) existingRemoteMap.set(p.id, p);
    });
    const remoteAdditions: BingoTvPlayerSummary[] = this.getConnectedRemotePlayers()
      .filter((rp) => !localSummary.some((lp) => lp.id === rp.id))
      .map((rp) => {
        const prev = existingRemoteMap.get(rp.id);
        return {
          id: rp.id,
          name: rp.name,
          avatarColor: prev?.avatarColor || rp.color || '#06b6d4',
          linesCompleted: prev?.linesCompleted || 0,
          hasBingo: Boolean(prev?.hasBingo),
          isRemote: true,
        };
      });
    const mergedForCloud = [...localSummary, ...remoteAdditions].slice(0, 50);
    this.playersSummaryCache = mergedForCloud;

    socialSocket.send('bingo:host_sync_state', {
      roomCode: activeCode,
      hostKey,
      hostName: this.hostName,
      calledBalls: data.calledBalls,
      playersSummary: localSummary,
      themeTitle: data.themeTitle,
      showCodeOnScreen: this.showCodeOnBigScreen,
    });
    void this.syncRoomToFirestore(activeCode, 'bingo', false);

    const localTvPayload: BingoTvState = {
      roomId: `joy-bingo-${activeCode}`,
      roomCode: this.showCodeOnBigScreen ? activeCode : '',
      showCodeOnScreen: this.showCodeOnBigScreen,
      hostName: this.hostName,
      roundNumber: this.roundNumber,
      calledBalls: data.calledBalls,
      playersSummary: mergedForCloud,
      connectedParticipants: this.getConnectedRemotePlayers(),
      totalPlayersCount: mergedForCloud.length,
      themeTitle: data.themeTitle,
      lastClaim: this.tvState?.lastClaim || null,
      serverNow: Date.now(),
    };
    this.tvState = localTvPayload;
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'bingo:tv_state', payload: localTvPayload });
      } catch {
        // ignore
      }
    }
  }

  public watchAsTv(rawCode: string) {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) return;
    this.isTvViewerMode = true;
    const roomId = `joy-bingo-${cleanCode}`;
    this.attachRemoteBingoCloudSync(cleanCode);
    socialSocket.connectAsTvViewer(roomId, () => {
      socialSocket.send('bingo:tv_watch', { roomCode: cleanCode });
    });
    if (typeof window !== 'undefined') {
      fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((st) => {
          if (this.isTvViewerMode && (st?.valid || st?.found)) {
            const showCode = st.showCodeOnScreen !== false;
            if (typeof st.roundNumber === 'number' && st.roundNumber > 0) {
              this.roundNumber = st.roundNumber;
            }
            const tvPayload: BingoTvState = {
              roomId,
              roomCode: showCode ? cleanCode : '',
              showCodeOnScreen: showCode,
              hostName: st.hostName || 'Arrangør',
              roundNumber: st.roundNumber || this.roundNumber,
              calledBalls: Array.isArray(st.calledBalls) ? st.calledBalls : [],
              playersSummary: Array.isArray(st.playersSummary) ? st.playersSummary : [],
              connectedParticipants: Array.isArray(st.connectedParticipants) ? st.connectedParticipants : [],
              totalPlayersCount: Array.isArray(st.playersSummary) ? st.playersSummary.length : 0,
              lastClaim: st.lastClaim || null,
              serverNow: st.serverNow || Date.now(),
            };
            this.tvState = tvPayload;
            this.tvStateListeners.forEach((fn) => fn(tvPayload));
            this.notify();
          }
        })
        .catch(() => {});
    }
    this.notify();
  }

  public exitTvWatch() {
    this.isTvViewerMode = false;
    this.stopRemoteRoomSubscription();
    socialSocket.exitTvMode();
    this.notify();
  }

  public getTvState(): BingoTvState | null {
    return this.tvState;
  }

  public onTvState(fn: (state: BingoTvState) => void): () => void {
    this.tvStateListeners.add(fn);
    return () => this.tvStateListeners.delete(fn);
  }

  public onTvModeChange(fn: (game: 'bingo' | 'quiz') => void): () => void {
    this.tvModeChangeListeners.add(fn);
    return () => this.tvModeChangeListeners.delete(fn);
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const remoteBingo = new RemoteBingoService();
