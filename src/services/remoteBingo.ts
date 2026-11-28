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
import { BingoMilestone, CalledBall } from '../types/bingo';
import { JOYFUL_BALLS_MAP } from '../data/prompts';

export interface RemoteParticipant {
  id: string;
  name: string;
  color?: string;
  joinedAt?: number;
  game?: string;
}

export interface HostActivityNotification {
  id: string;
  type: 'join' | 'bingo';
  playerName: string;
  gameLabel: string;
  detail: string;
  milestone?: BingoMilestone;
  nextTargetLabel?: string;
  timestamp: number;
  read: boolean;
}

export interface RemoteBingoClaim {
  claimId?: string;
  userId: string;
  playerName: string;
  pattern: string;
  milestone?: BingoMilestone;
  cardIndex: number;
  isFullHouse?: boolean;
  roundNumber?: number;
  claimedMilestones?: BingoMilestone[];
  milestoneWinners?: Partial<Record<BingoMilestone, string>>;
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
  lastClaim?: { playerName: string; pattern: string; isFullHouse?: boolean; milestone?: BingoMilestone; timestamp: number } | null;
  claimedMilestones?: BingoMilestone[];
  milestoneWinners?: Partial<Record<BingoMilestone, string>>;
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
  private lastEditionCache: 'adult' | 'family' | 'christmas' | 'senior' = 'adult';
  private lastCloudSyncSignature: string = '';
  private cloudSynced: boolean = false;
  private seenParticipantIds: Set<string> = new Set();
  private remoteRoomUnsub: (() => void) | null = null;
  private tvStateListeners: Set<(state: BingoTvState) => void> = new Set();
  private tvModeChangeListeners: Set<(game: 'bingo' | 'quiz') => void> = new Set();
  private claimedMilestones: BingoMilestone[] = [];
  private milestoneWinners: Partial<Record<BingoMilestone, string>> = {};
  private preClaimSnapshot: { claimedMilestones: BingoMilestone[]; milestoneWinners: Partial<Record<BingoMilestone, string>> } | null = null;
  private hostNotifications: HostActivityNotification[] = [];
  private recentActivityKeys: Map<string, number> = new Map();
  private seenClaimIds: Set<string> = new Set();
  private claimRejectedListeners: Set<(payload: { message?: string; milestone?: BingoMilestone; claimedMilestones?: BingoMilestone[]; milestoneWinners?: Partial<Record<BingoMilestone, string>> }) => void> = new Set();
  private statePollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Slett eventuelle gamle koder fra localStorage slik at koder fra gårsdagens økt ALDRI gjenbrukes ved ny innlogging
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);

      // Gjenopprett kode kun innenfor samme aktive nettleser-sesjon (F5), og bare dersom arrangør/eier allerede har gyldig tilgang
      if (sessionTimer.hasPaidAccess() || this.canActAsHost()) {
        const savedHost = sessionStorage.getItem(STORAGE_KEY_HOST_CODE);
        if (savedHost && savedHost.length >= 3) {
          this.hostCode = savedHost;
          this.codeLockedForRound = sessionStorage.getItem(STORAGE_KEY_ROUND_LOCKED) === '1';
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
        if (!sessionTimer.hasPaidAccess() && !this.isRemotePlayer && !this.canActAsHost()) {
          if (this.hostCode || this.isHost) {
            this.clearPaidHostCode();
          }
        }
      });

      authService.onLogin((user) => {
        if (this.canActAsHost()) {
          this.resetHostCodeForNewLogin(user.name);
        }
      });

      authService.subscribe(() => {
        const user = authService.getCurrentUser();
        if (!user.isAuthenticated && !ownerControl.isUnlocked() && !this.isRemotePlayer) {
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
    return Boolean(user.isAuthenticated && sessionTimer.hasPaidAccess());
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

  private generateRandomCode(excludeCode?: string): string {
    const cleanExclude = (excludeCode || '').trim().toUpperCase();
    for (let i = 0; i < 25; i++) {
      const candidate = Math.floor(1000 + Math.random() * 9000).toString();
      if (!cleanExclude || candidate !== cleanExclude) {
        return candidate;
      }
    }
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
    edition: 'adult' | 'family' | 'christmas' | 'senior' = 'adult'
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
    const newCode = this.generateRandomCode(this.hostCode);
    this.hostCode = newCode;
    this.codeLockedForRound = true;
    this.lastCloudSyncSignature = '';
    this.seenParticipantIds.clear();
    if (this.isHost) {
      this.currentRoomCode = newCode;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.setItem(STORAGE_KEY_HOST_CODE, newCode);
      sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
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
          calledBalls: this.mapBallNumbersToCalledBalls(this.calledBallNumbersCache),
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
        const myId = socialSocket.getProfile().id;
        if (this.isHost && this.canActAsHost()) {
          incoming.forEach((p) => {
            if (p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id)) {
              this.seenParticipantIds.add(p.id);
              this.recordJoinActivity(p, p.game || 'Avstandsbingo');
              this.joinListeners.forEach((fn) => fn(p, incoming.length));
            }
          });
        } else {
          incoming.forEach((p) => {
            if (p?.id) this.seenParticipantIds.add(p.id);
          });
        }
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
          this.recordJoinActivity(p, p.game || 'Avstandsbingo');
          this.joinListeners.forEach((fn) => fn(p, incoming.length));
        });
        this.notify();
      }
    });

    socialSocket.on('user:joined', (payload: any) => {
      if (payload && Array.isArray(payload.participants)) {
        const incoming = payload.participants as RemoteParticipant[];
        const myId = socialSocket.getProfile().id;
        const payloadUser = payload.user as (RemoteParticipant & { game?: string }) | undefined;
        const shouldEmitPayloadUser = Boolean(
          this.isHost &&
          this.canActAsHost() &&
          payloadUser?.id &&
          payloadUser.id !== myId &&
          !this.seenParticipantIds.has(payloadUser.id)
        );
        const newlyJoined =
          this.isHost && this.canActAsHost()
            ? incoming.filter((p) => p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id))
            : [];
        incoming.forEach((p) => {
          if (p?.id) this.seenParticipantIds.add(p.id);
        });
        if (payloadUser?.id) {
          this.seenParticipantIds.add(payloadUser.id);
        }
        this.remoteParticipants = incoming;
        if (newlyJoined.length > 0) {
          newlyJoined.forEach((p) => {
            const gameLabel = payloadUser?.id === p.id && payloadUser?.game ? payloadUser.game : p.game || 'Avstandsbingo';
            this.recordJoinActivity(p, gameLabel);
            this.joinListeners.forEach((fn) => fn(p, incoming.length));
          });
        } else if (shouldEmitPayloadUser && payloadUser) {
          this.recordJoinActivity(payloadUser, payloadUser.game || 'Avstandsbingo');
          this.joinListeners.forEach((fn) => fn(payloadUser, incoming.length));
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
        const tier = this.resolveMilestoneFromPattern(
          String(payload.pattern || ''),
          Boolean(payload.isFullHouse)
        );
        const dedupKey = String(
          payload.claimId || `${String(payload.playerName).trim().toLowerCase()}:${tier}:${Number(payload.roundNumber) || this.roundNumber}:${payload.timestamp || ''}`
        );
        if (this.seenClaimIds.has(dedupKey)) {
          return;
        }
        this.seenClaimIds.add(dedupKey);
        this.preClaimSnapshot = null;

        if (Array.isArray(payload.claimedMilestones)) {
          this.claimedMilestones = payload.claimedMilestones as BingoMilestone[];
        } else {
          this.applyLocalMilestoneClaim(tier, String(payload.playerName));
        }
        if (payload.milestoneWinners && typeof payload.milestoneWinners === 'object') {
          this.milestoneWinners = { ...payload.milestoneWinners };
        } else if (!this.milestoneWinners[tier]) {
          this.milestoneWinners = { ...this.milestoneWinners, [tier]: String(payload.playerName) };
        }
        const claim: RemoteBingoClaim = {
          claimId: payload.claimId ? String(payload.claimId) : dedupKey,
          userId: payload.userId || 'remote-user',
          playerName: payload.playerName,
          pattern: payload.pattern || 'FULLBRETT BINGO',
          milestone: (payload.milestone as BingoMilestone) || tier,
          cardIndex: payload.cardIndex ?? 0,
          isFullHouse: Boolean(payload.isFullHouse),
          roundNumber: Number(payload.roundNumber) || this.roundNumber,
          claimedMilestones: [...this.claimedMilestones],
          milestoneWinners: { ...this.milestoneWinners },
          autoNewRoundDelayMs: Number(payload.autoNewRoundDelayMs) || 0,
          timestamp: payload.timestamp || Date.now(),
        };
        this.recordBingoClaimActivity(claim.playerName, claim.milestone || tier, claim.pattern, 'Avstandsbingo');
        this.claimListeners.forEach((fn) => fn(claim));
        this.notify();
      }
    });

    socialSocket.on('bingo:claim_rejected', (payload: any) => {
      if (payload && typeof payload === 'object') {
        this.handleClaimRejectionPayload(payload);
      }
    });

    socialSocket.on('bingo:new_round', (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const nextRound = Number(payload.roundNumber) || this.roundNumber + 1;
      const incomingNewCode = String(payload.newRoomCode || payload.roomCode || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      const prevCode = this.hostCode || this.currentRoomCode || '';
      if (incomingNewCode && incomingNewCode.length >= 3 && incomingNewCode !== prevCode) {
        this.applyRotatedRoomCode(prevCode, incomingNewCode);
      }
      this.roundNumber = nextRound;
      this.calledBallNumbersCache = [];
      this.claimedMilestones = [];
      this.milestoneWinners = {};
      this.lastCloudSyncSignature = '';
      const effectiveCode = incomingNewCode || this.currentRoomCode || this.hostCode || '';
      if (this.tvState) {
        this.tvState = {
          ...this.tvState,
          roomId: effectiveCode ? `joy-bingo-${effectiveCode}` : this.tvState.roomId,
          roomCode: this.isTvViewerMode && !this.tvState.showCodeOnScreen ? '' : effectiveCode,
          roundNumber: nextRound,
          calledBalls: [],
          lastClaim: null,
          claimedMilestones: [],
          milestoneWinners: {},
          serverNow: Date.now(),
        };
        this.tvStateListeners.forEach((fn) => fn(this.tvState!));
      }
      const ev: BingoNewRoundEvent = {
        roomCode: effectiveCode,
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
        if (Array.isArray(payload.claimedMilestones)) {
          this.claimedMilestones = payload.claimedMilestones as BingoMilestone[];
        }
        if (payload.milestoneWinners && typeof payload.milestoneWinners === 'object') {
          this.milestoneWinners = { ...payload.milestoneWinners };
        }
        if (Array.isArray(payload.connectedParticipants)) {
          const incomingConn = payload.connectedParticipants as RemoteParticipant[];
          const myId = socialSocket.getProfile().id;
          if (this.isHost && this.canActAsHost()) {
            const newlySeen = incomingConn.filter(
              (p) => p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id)
            );
            incomingConn.forEach((p) => {
              if (p?.id) this.seenParticipantIds.add(p.id);
            });
            if (incomingConn.length > 0) {
              this.remoteParticipants = incomingConn;
            }
            newlySeen.forEach((p) => {
              this.recordJoinActivity(p, p.game || 'Avstandsbingo');
              this.joinListeners.forEach((fn) => fn(p, incomingConn.length));
            });
          } else if (incomingConn.length > 0) {
            this.remoteParticipants = incomingConn;
          }
        }
        const sanitized: BingoTvState = {
          ...(payload as BingoTvState),
          roundNumber: Number(payload.roundNumber) || this.roundNumber,
          showCodeOnScreen: showCode,
          claimedMilestones: Array.isArray(payload.claimedMilestones)
            ? (payload.claimedMilestones as BingoMilestone[])
            : [...this.claimedMilestones],
          milestoneWinners:
            payload.milestoneWinners && typeof payload.milestoneWinners === 'object'
              ? { ...payload.milestoneWinners }
              : { ...this.milestoneWinners },
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

  private resolveMilestoneFromPattern(pattern: string, isFullHouse: boolean): BingoMilestone {
    if (isFullHouse || /fullbrett|fullt?\s*brett|full_?house|blackout/i.test(pattern)) {
      return 'fullbrett';
    }
    if (/3\s*\.?\s*rekke|3\s*line|tre\s*rekke/i.test(pattern)) {
      return 'line3';
    }
    return 'line1';
  }

  private applyLocalMilestoneClaim(tier: BingoMilestone, winnerName: string) {
    const nextSet = new Set<BingoMilestone>(this.claimedMilestones);
    nextSet.add(tier);
    if (tier === 'line3' || tier === 'fullbrett') {
      nextSet.add('line1');
    }
    if (tier === 'fullbrett') {
      nextSet.add('line3');
    }
    this.claimedMilestones = Array.from(nextSet);
    if (winnerName && !this.milestoneWinners[tier]) {
      this.milestoneWinners = { ...this.milestoneWinners, [tier]: winnerName };
    }
  }

  private handleClaimRejectionPayload(payload: {
    message?: string;
    milestone?: BingoMilestone;
    claimedMilestones?: BingoMilestone[];
    milestoneWinners?: Partial<Record<BingoMilestone, string>>;
  }) {
    if (Array.isArray(payload.claimedMilestones)) {
      this.claimedMilestones = payload.claimedMilestones;
    } else if (this.preClaimSnapshot) {
      this.claimedMilestones = [...this.preClaimSnapshot.claimedMilestones];
    }
    if (payload.milestoneWinners && typeof payload.milestoneWinners === 'object') {
      this.milestoneWinners = { ...payload.milestoneWinners };
    } else if (this.preClaimSnapshot) {
      this.milestoneWinners = { ...this.preClaimSnapshot.milestoneWinners };
    }
    this.preClaimSnapshot = null;
    this.claimRejectedListeners.forEach((fn) => fn(payload));
    this.notify();
  }

  private stopRoomStatePolling() {
    if (this.statePollTimer) {
      clearInterval(this.statePollTimer);
      this.statePollTimer = null;
    }
  }

  private startRoomStatePolling(cleanCode: string) {
    this.stopRoomStatePolling();
    if (typeof window === 'undefined' || !cleanCode) return;
    const poll = () => {
      const activeCode = this.currentRoomCode || this.hostCode;
      if ((!this.isHost && !this.isRemotePlayer) || !activeCode || activeCode !== cleanCode) {
        this.stopRoomStatePolling();
        return;
      }
      fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((st) => {
          if (!st || !st.valid || (this.currentRoomCode !== cleanCode && this.hostCode !== cleanCode)) return;
          const migratedCode = st.migratedToCode
            ? String(st.migratedToCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
            : '';
          const effectiveCode = migratedCode || cleanCode;
          if (migratedCode && migratedCode !== cleanCode) {
            this.applyRotatedRoomCode(cleanCode, migratedCode);
          }
          if ((typeof st.roundNumber === 'number' && st.roundNumber > this.roundNumber) || (migratedCode && migratedCode !== cleanCode)) {
            this.roundNumber = Number(st.roundNumber) || this.roundNumber + 1;
            this.calledBallNumbersCache = [];
            this.claimedMilestones = Array.isArray(st.claimedMilestones) ? st.claimedMilestones : [];
            this.milestoneWinners =
              st.milestoneWinners && typeof st.milestoneWinners === 'object' ? { ...st.milestoneWinners } : {};
            this.lastCloudSyncSignature = '';
            this.newRoundListeners.forEach((fn) =>
              fn({
                roomCode: effectiveCode,
                roundNumber: this.roundNumber,
                reason: 'fullbrett',
                timestamp: Date.now(),
              })
            );
            this.notify();
            return;
          }
          let changed = false;
          if (Array.isArray(st.claimedMilestones)) {
            const nextStr = JSON.stringify(st.claimedMilestones);
            if (nextStr !== JSON.stringify(this.claimedMilestones)) {
              this.claimedMilestones = st.claimedMilestones as BingoMilestone[];
              changed = true;
            }
          }
          if (st.milestoneWinners && typeof st.milestoneWinners === 'object') {
            const nextWStr = JSON.stringify(st.milestoneWinners);
            if (nextWStr !== JSON.stringify(this.milestoneWinners)) {
              this.milestoneWinners = { ...st.milestoneWinners };
              changed = true;
            }
          }
          if (this.isRemotePlayer && Array.isArray(st.calledBalls) && st.calledBalls.length > 0) {
            this.syncProvidedListeners.forEach((fn) => fn(st.calledBalls as CalledBall[]));
          }
          if (Array.isArray(st.connectedParticipants) && st.connectedParticipants.length > 0) {
            const incomingConn = st.connectedParticipants as RemoteParticipant[];
            const myId = socialSocket.getProfile().id;
            if (this.isHost && this.canActAsHost()) {
              incomingConn.forEach((p) => {
                if (p?.id && p.id !== myId && !this.seenParticipantIds.has(p.id)) {
                  this.seenParticipantIds.add(p.id);
                  this.recordJoinActivity(p, p.game || 'Avstandsbingo');
                  this.joinListeners.forEach((fn) => fn(p, incomingConn.length));
                }
              });
            }
            this.remoteParticipants = incomingConn;
          }
          if (st.lastClaim && st.lastClaim.playerName && st.lastClaim.timestamp) {
            const lc = st.lastClaim;
            const tier = lc.milestone || this.resolveMilestoneFromPattern(String(lc.pattern || ''), Boolean(lc.isFullHouse));
            const dedupKey = String(
              lc.claimId || `${String(lc.playerName).trim().toLowerCase()}:${tier}:${Number(st.roundNumber) || this.roundNumber}:${lc.timestamp}`
            );
            if (!this.seenClaimIds.has(dedupKey)) {
              this.seenClaimIds.add(dedupKey);
              const claim: RemoteBingoClaim = {
                claimId: dedupKey,
                userId: 'remote-poll',
                playerName: String(lc.playerName),
                pattern: String(lc.pattern || 'BINGO'),
                milestone: tier,
                cardIndex: 0,
                isFullHouse: Boolean(lc.isFullHouse) || tier === 'fullbrett',
                roundNumber: Number(st.roundNumber) || this.roundNumber,
                claimedMilestones: [...this.claimedMilestones],
                milestoneWinners: { ...this.milestoneWinners },
                autoNewRoundDelayMs: tier === 'fullbrett' ? 4500 : 0,
                timestamp: Number(lc.timestamp),
              };
              this.recordBingoClaimActivity(claim.playerName, tier, claim.pattern, 'Avstandsbingo');
              this.claimListeners.forEach((fn) => fn(claim));
              changed = true;
            }
          }
          if (changed) this.notify();
        })
        .catch(() => {});
    };
    this.statePollTimer = setInterval(poll, 2500);
  }

  private handleChannelMessage(data: any) {
    if (!data || !data.type) return;
    if (data.type === 'bingo:remote_claimed' && data.payload) {
      const claim = data.payload as RemoteBingoClaim;
      if (Array.isArray(claim.claimedMilestones)) {
        this.claimedMilestones = claim.claimedMilestones;
      } else {
        this.applyLocalMilestoneClaim(
          claim.milestone || this.resolveMilestoneFromPattern(claim.pattern, Boolean(claim.isFullHouse)),
          claim.playerName
        );
      }
      if (claim.milestoneWinners) {
        this.milestoneWinners = { ...claim.milestoneWinners };
      }
      this.claimListeners.forEach((fn) => fn(claim));
      this.notify();
    } else if (data.type === 'caller:sync_ball' && data.payload && this.isRemotePlayer) {
      this.ballListeners.forEach((fn) => fn(data.payload));
    } else if (data.type === 'bingo:tv_state' && data.payload) {
      const incoming = data.payload as BingoTvState;
      const showCode = incoming.showCodeOnScreen !== false;
      if (Array.isArray(incoming.claimedMilestones)) {
        this.claimedMilestones = incoming.claimedMilestones;
      }
      if (incoming.milestoneWinners) {
        this.milestoneWinners = { ...incoming.milestoneWinners };
      }
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
        localStorage.removeItem(STORAGE_KEY_HOST_CODE);
        localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
        const savedHost = sessionStorage.getItem(STORAGE_KEY_HOST_CODE);
        if (savedHost && savedHost.length >= 3) {
          this.hostCode = savedHost;
          this.codeLockedForRound = sessionStorage.getItem(STORAGE_KEY_ROUND_LOCKED) === '1';
        }
      }
    }
    if (!this.hostCode || this.hostCode.length < 3) {
      this.hostCode = this.generateRandomCode();
      this.codeLockedForRound = true;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
        sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
      }
      this.notify();
    } else if (!this.codeLockedForRound) {
      this.codeLockedForRound = true;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
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
      sessionStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
    }
    this.notify();
  }

  public resetHostCodeForNewLogin(hostProfileName?: string): string {
    if (!this.canActAsHost()) return '';
    const oldCode = this.hostCode || this.currentRoomCode || '';
    const hostKey = this.getOrCreateHostKey();
    if (hostProfileName && hostProfileName.trim() && hostProfileName.trim() !== 'Gjest') {
      this.hostName = hostProfileName.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HOST_NAME, this.hostName);
      }
      socialSocket.updateProfile(this.hostName);
    }
    if (oldCode && typeof window !== 'undefined') {
      fetch('/api/rooms/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all', roomCode: oldCode, hostKey }),
      }).catch(() => {});
      socialSocket.send('bingo:host_leave', { roomCode: oldCode, hostKey });
      void firebasePersistence.deleteActiveRoom(oldCode);
    }
    const freshCode = this.generateRandomCode(oldCode);
    this.hostCode = freshCode;
    this.serverActiveCode = '';
    this.codeLockedForRound = true;
    this.calledBallNumbersCache = [];
    this.claimedMilestones = [];
    this.milestoneWinners = {};
    this.lastCloudSyncSignature = '';
    this.seenParticipantIds.clear();
    this.seenClaimIds.clear();
    this.remoteParticipants = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.setItem(STORAGE_KEY_HOST_CODE, freshCode);
      sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
    }
    if (this.isHost) {
      this.activateHostSession(freshCode, this.hostName, true);
    } else {
      this.notify();
    }
    return freshCode;
  }

  public rotateHostCodeLocalForRound(excludePrevCode?: string): { prevCode: string; newCode: string } {
    if (!this.canActAsHost()) return { prevCode: '', newCode: '' };
    const prevCode = (excludePrevCode || this.hostCode || this.currentRoomCode || '').trim().toUpperCase();
    const newCode = this.generateRandomCode(prevCode);
    this.hostCode = newCode;
    this.codeLockedForRound = true;
    this.calledBallNumbersCache = [];
    this.claimedMilestones = [];
    this.milestoneWinners = {};
    this.lastCloudSyncSignature = '';
    if (this.isHost) {
      this.currentRoomCode = newCode;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.setItem(STORAGE_KEY_HOST_CODE, newCode);
      sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
      if (prevCode && prevCode !== newCode) {
        void firebasePersistence.deleteActiveRoom(prevCode);
      }
    }
    this.notify();
    return { prevCode, newCode };
  }

  public finishHostCodeRotationToRoom(newCode: string) {
    if (!this.canActAsHost() || !newCode) return;
    const cleanNew = newCode.trim().toUpperCase();
    this.hostCode = cleanNew;
    this.serverActiveCode = cleanNew;
    if (this.isHost) {
      this.currentRoomCode = cleanNew;
      socialSocket.connect(`joy-bingo-${cleanNew}`);
      this.startRoomStatePolling(cleanNew);
      void this.syncRoomToFirestore(cleanNew, this.lastActiveGameCache, true, this.lastEditionCache);
    }
    this.notify();
  }

  public applyRotatedRoomCode(oldCode: string, newCode: string) {
    const cleanNew = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanOld = oldCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanNew || cleanNew.length < 3) return;

    if (this.isHost && this.canActAsHost()) {
      const changed = this.hostCode !== cleanNew;
      this.hostCode = cleanNew;
      this.currentRoomCode = cleanNew;
      this.codeLockedForRound = true;
      this.serverActiveCode = cleanNew;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_HOST_CODE);
        localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
        sessionStorage.setItem(STORAGE_KEY_HOST_CODE, cleanNew);
        sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
        if (cleanOld && cleanOld !== cleanNew) {
          void firebasePersistence.deleteActiveRoom(cleanOld);
        }
      }
      if (changed) {
        socialSocket.connect(`joy-bingo-${cleanNew}`);
        this.startRoomStatePolling(cleanNew);
        void this.syncRoomToFirestore(cleanNew, this.lastActiveGameCache, true, this.lastEditionCache);
      }
    } else if (this.isRemotePlayer) {
      const changed = this.currentRoomCode !== cleanNew;
      this.currentRoomCode = cleanNew;
      if (changed) {
        socialSocket.connect(`joy-bingo-${cleanNew}`);
        this.attachRemoteBingoCloudSync(cleanNew);
        this.startRoomStatePolling(cleanNew);
      }
    }

    if (this.isTvViewerMode) {
      this.attachRemoteBingoCloudSync(cleanNew);
      if (this.tvState) {
        this.tvState = {
          ...this.tvState,
          roomId: `joy-bingo-${cleanNew}`,
          roomCode: this.tvState.showCodeOnScreen !== false ? cleanNew : '',
        };
        this.tvStateListeners.forEach((fn) => fn(this.tvState!));
      }
    }
    this.notify();
  }

  public startNewRound(winnerName?: string): string {
    if (!this.canActAsHost()) return '';
    const { prevCode, newCode } = this.rotateHostCodeLocalForRound();
    if (!newCode) return '';
    const hostKey = this.getOrCreateHostKey();
    if (prevCode) {
      socialSocket.send('bingo:start_new_round', {
        roomCode: prevCode,
        newRoomCode: newCode,
        hostKey,
        winnerName,
      });
      if (typeof window !== 'undefined') {
        fetch('/api/rooms/bingo/new_round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: prevCode, newRoomCode: newCode, hostKey, winnerName }),
        }).catch(() => {});
      }
    }
    this.finishHostCodeRotationToRoom(newCode);
    if (!this.isHost) {
      this.activateHostSession(newCode, this.hostName, true);
    }
    return newCode;
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
    this.claimedMilestones = [];
    this.milestoneWinners = {};
    this.lastCloudSyncSignature = '';
    this.codeLockedForRound = false;
    this.isHost = false;
    if (!this.isRemotePlayer) {
      this.currentRoomCode = null;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.removeItem(STORAGE_KEY_HOST_CODE);
      sessionStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
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
    this.hostCode = this.generateRandomCode(oldCode);
    this.codeLockedForRound = true;
    this.calledBallNumbersCache = [];
    this.lastCloudSyncSignature = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
      sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
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
      localStorage.removeItem(STORAGE_KEY_HOST_CODE);
      localStorage.removeItem(STORAGE_KEY_ROUND_LOCKED);
      sessionStorage.setItem(STORAGE_KEY_HOST_CODE, this.hostCode);
      sessionStorage.setItem(STORAGE_KEY_ROUND_LOCKED, '1');
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

  public notifyQuizHosted(code: string, edition: 'adult' | 'family' | 'christmas' | 'senior') {
    if (!this.canActAsHost() || !code) return;
    void this.syncRoomToFirestore(code, 'quiz', true, edition);
  }

  public syncQuizStateToCloud(
    quizState: Record<string, unknown>,
    edition: 'adult' | 'family' | 'christmas' | 'senior' = 'adult'
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
    socialSocket.send('bingo:host_init', {
      roomCode: activeCode,
      hostName: this.hostName,
      hostKey,
      calledBalls: this.mapBallNumbersToCalledBalls(this.calledBallNumbersCache),
    });
    void this.registerRoomOnServer(activeCode);
    this.startRoomStatePolling(activeCode);
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
    this.claimedMilestones = [];
    this.milestoneWinners = {};

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
    this.startRoomStatePolling(cleanCode);

    socialSocket.send('caller:request_sync', { roomCode: cleanCode });
    setTimeout(() => {
      if (this.isRemotePlayer && this.currentRoomCode === cleanCode) {
        socialSocket.send('caller:request_sync', { roomCode: cleanCode });
        fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((st) => {
            if (this.isRemotePlayer && this.currentRoomCode === cleanCode) {
              if (typeof st?.roundNumber === 'number' && st.roundNumber > 0) {
                this.roundNumber = st.roundNumber;
              }
              if (Array.isArray(st?.claimedMilestones)) {
                this.claimedMilestones = st.claimedMilestones as BingoMilestone[];
              }
              if (st?.milestoneWinners && typeof st.milestoneWinners === 'object') {
                this.milestoneWinners = { ...st.milestoneWinners };
              }
              if (Array.isArray(st?.calledBalls) && st.calledBalls.length > 0) {
                this.syncProvidedListeners.forEach((fn) => fn(st.calledBalls as CalledBall[]));
              }
              this.notify();
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
    this.stopRoomStatePolling();
    this.seenParticipantIds.clear();
    this.seenClaimIds.clear();
    this.isRemotePlayer = false;
    this.isHost = false;
    this.currentRoomCode = null;
    this.claimedMilestones = [];
    this.milestoneWinners = {};
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
    confirmedNumbers?: number[],
    calledBalls?: CalledBall[]
  ) {
    const tier = this.resolveMilestoneFromPattern(pattern, isFullHouse);
    if (this.claimedMilestones.includes(tier)) {
      return;
    }
    const activeCode = this.currentRoomCode || this.hostCode || undefined;
    const claimerName =
      (overridePlayerName && overridePlayerName.trim()) ||
      this.playerName ||
      socialSocket.getProfile().name;

    this.preClaimSnapshot = {
      claimedMilestones: [...this.claimedMilestones],
      milestoneWinners: { ...this.milestoneWinners },
    };
    this.applyLocalMilestoneClaim(tier, claimerName);

    const claimId = `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.seenClaimIds.add(claimId);

    const claim: RemoteBingoClaim = {
      claimId,
      userId: socialSocket.getProfile().id,
      playerName: claimerName,
      pattern,
      milestone: tier,
      cardIndex,
      isFullHouse,
      roundNumber: this.roundNumber,
      claimedMilestones: [...this.claimedMilestones],
      milestoneWinners: { ...this.milestoneWinners },
      autoNewRoundDelayMs: isFullHouse ? 4500 : 0,
      timestamp: Date.now(),
    };

    const wsPayload = {
      roomCode: activeCode,
      claimId,
      playerName: claim.playerName,
      pattern: claim.pattern,
      milestone: tier,
      isFullHouse,
      cardIndex: claim.cardIndex,
      confirmedNumbers,
      calledBalls: calledBalls && calledBalls.length > 0 ? calledBalls : this.mapBallNumbersToCalledBalls(this.calledBallNumbersCache),
    };

    socialSocket.send('bingo:remote_claim', wsPayload);

    if (typeof window !== 'undefined' && activeCode) {
      fetch('/api/rooms/bingo/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wsPayload,
          senderId: socialSocket.getProfile().id,
        }),
      })
        .then(async (resp) => {
          const data = await resp.json().catch(() => null);
          if (!resp.ok || data?.success === false) {
            if (data) {
              this.handleClaimRejectionPayload(data);
            }
          } else if (data?.claim) {
            this.preClaimSnapshot = null;
          }
        })
        .catch(() => {});
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'bingo:remote_claimed',
        payload: claim,
      });
    }

    // Record for organizer notification log + trigger local listeners for instant feedback
    this.recordBingoClaimActivity(claim.playerName, tier, claim.pattern, 'Avstandsbingo');
    this.claimListeners.forEach((fn) => fn(claim));
    this.notify();
  }

  public broadcastRoundResetToRoom(winnerName?: string): string {
    if (!this.canActAsHost()) return '';
    return this.startNewRound(winnerName);
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

  public requestBallSyncFromRoom() {
    const activeCode = this.currentRoomCode || this.hostCode;
    if (!activeCode) return;
    socialSocket.send('caller:request_sync', { roomCode: activeCode });
    if (typeof window !== 'undefined') {
      fetch(`/api/rooms/state?code=${encodeURIComponent(activeCode)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((st) => {
          if (!st || !st.valid) return;
          const migratedCode = st.migratedToCode
            ? String(st.migratedToCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
            : '';
          const effectiveCode = migratedCode || activeCode;
          if (migratedCode && migratedCode !== activeCode) {
            this.applyRotatedRoomCode(activeCode, migratedCode);
          }
          if ((typeof st.roundNumber === 'number' && st.roundNumber > this.roundNumber) || (migratedCode && migratedCode !== activeCode)) {
            this.roundNumber = Number(st.roundNumber) || this.roundNumber + 1;
            this.calledBallNumbersCache = [];
            this.claimedMilestones = Array.isArray(st.claimedMilestones) ? st.claimedMilestones : [];
            this.milestoneWinners =
              st.milestoneWinners && typeof st.milestoneWinners === 'object' ? { ...st.milestoneWinners } : {};
            this.lastCloudSyncSignature = '';
            this.newRoundListeners.forEach((fn) =>
              fn({
                roomCode: effectiveCode,
                roundNumber: this.roundNumber,
                reason: 'fullbrett',
                timestamp: Date.now(),
              })
            );
            this.notify();
            return;
          }
          if (Array.isArray(st.calledBalls) && st.calledBalls.length > 0) {
            this.syncProvidedListeners.forEach((fn) => fn(st.calledBalls as CalledBall[]));
          }
        })
        .catch(() => {});
    }
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

  public getClaimedMilestones(): BingoMilestone[] {
    return [...this.claimedMilestones];
  }

  public getMilestoneWinners(): Partial<Record<BingoMilestone, string>> {
    return { ...this.milestoneWinners };
  }

  public onNewRound(fn: (ev: BingoNewRoundEvent) => void): () => void {
    this.newRoundListeners.add(fn);
    return () => this.newRoundListeners.delete(fn);
  }

  public onClaimRejected(
    fn: (payload: {
      message?: string;
      milestone?: BingoMilestone;
      claimedMilestones?: BingoMilestone[];
      milestoneWinners?: Partial<Record<BingoMilestone, string>>;
    }) => void
  ): () => void {
    this.claimRejectedListeners.add(fn);
    return () => this.claimRejectedListeners.delete(fn);
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

  private pushHostNotification(entry: Omit<HostActivityNotification, 'id' | 'read'>) {
    const dedupKey = `${entry.type}:${entry.playerName.toLowerCase()}:${entry.milestone || ''}:${entry.gameLabel}`;
    const lastTs = this.recentActivityKeys.get(dedupKey) || 0;
    if (Date.now() - lastTs < 2500) {
      return;
    }
    this.recentActivityKeys.set(dedupKey, Date.now());
    const item: HostActivityNotification = {
      ...entry,
      id: `hn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
    };
    this.hostNotifications = [item, ...this.hostNotifications].slice(0, 40);
  }

  private recordJoinActivity(participant: RemoteParticipant, gameLabel: string) {
    const cleanName = (participant?.name || 'Deltaker').trim() || 'Deltaker';
    this.pushHostNotification({
      type: 'join',
      playerName: cleanName,
      gameLabel,
      detail: `${cleanName} ble med i ${gameLabel}`,
      timestamp: Date.now(),
    });
  }

  private recordBingoClaimActivity(
    playerName: string,
    milestone: BingoMilestone,
    _pattern: string,
    gameLabel: string
  ) {
    const cleanName = (playerName || 'Deltaker').trim() || 'Deltaker';
    const tierText =
      milestone === 'fullbrett'
        ? 'Full brett'
        : milestone === 'line3'
        ? '3. rekker'
        : '1. rekke';
    const nextTargetLabel =
      milestone === 'fullbrett'
        ? 'Ny runde'
        : milestone === 'line3'
        ? 'Full brett'
        : '3. rekker';
    const nextText =
      milestone === 'fullbrett'
        ? 'Ny runde starter!'
        : `Spillet fortsetter til ${nextTargetLabel}`;
    this.pushHostNotification({
      type: 'bingo',
      playerName: cleanName,
      gameLabel,
      milestone,
      nextTargetLabel,
      detail: `${cleanName} fylte ${tierText} og trykket BINGO! ➡️ ${nextText}`,
      timestamp: Date.now(),
    });
  }

  public recordParticipantJoinedExternal(
    id: string,
    name: string,
    color: string = '#06b6d4',
    gameLabel: string = 'Quiz'
  ) {
    if (!this.canActAsHost() || !name.trim()) return;
    const key = id || `ext-${name.trim().toLowerCase()}-${gameLabel}`;
    if (this.seenParticipantIds.has(key)) return;
    this.seenParticipantIds.add(key);
    const participant: RemoteParticipant = {
      id: key,
      name: name.trim(),
      color,
      joinedAt: Date.now(),
      game: gameLabel,
    };
    this.recordJoinActivity(participant, gameLabel);
    this.joinListeners.forEach((fn) => fn(participant, this.getConnectedRemotePlayers().length || 1));
    this.notify();
  }

  public recordBingoActivityLocal(playerName: string, milestone: BingoMilestone, pattern: string) {
    this.recordBingoClaimActivity(playerName, milestone, pattern, 'Bingo');
    this.notify();
  }

  public recordMusicBingoClaim(playerName: string, pattern: string) {
    const tier = this.resolveMilestoneFromPattern(pattern, /fullt?\s*brett|full_?house|blackout/i.test(pattern));
    this.recordBingoClaimActivity(playerName, tier, pattern, 'Musikkbingo');
    this.notify();
  }

  public getHostNotifications(): HostActivityNotification[] {
    return [...this.hostNotifications];
  }

  public getUnreadNotificationCount(): number {
    return this.hostNotifications.filter((n) => !n.read).length;
  }

  public markHostNotificationsRead() {
    if (!this.hostNotifications.some((n) => !n.read)) return;
    this.hostNotifications = this.hostNotifications.map((n) => ({ ...n, read: true }));
    this.notify();
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
      claimedMilestones: [...this.claimedMilestones],
      milestoneWinners: { ...this.milestoneWinners },
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
            if (Array.isArray(st.claimedMilestones)) {
              this.claimedMilestones = st.claimedMilestones as BingoMilestone[];
            }
            if (st.milestoneWinners && typeof st.milestoneWinners === 'object') {
              this.milestoneWinners = { ...st.milestoneWinners };
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
              claimedMilestones: Array.isArray(st.claimedMilestones) ? (st.claimedMilestones as BingoMilestone[]) : [],
              milestoneWinners:
                st.milestoneWinners && typeof st.milestoneWinners === 'object' ? { ...st.milestoneWinners } : {},
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
