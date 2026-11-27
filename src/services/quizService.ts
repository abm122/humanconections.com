/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { socialSocket } from './socialSocket';
import { moderation } from './moderation';
import { sessionTimer } from './sessionTimer';
import { remoteBingo } from './remoteBingo';
import { firebasePersistence } from './firebasePersistence';
import {
  QuizEdition,
  QuizQuestion,
  QuizQuestionType,
  getQuestionsForEdition,
  isOpenTextAnswerCorrect,
} from '../data/quizQuestions';

export type QuizTeamColor = 'red' | 'blue' | 'emerald' | 'amber';

export interface QuizTeamDef {
  id: string;
  name: string;
  color: QuizTeamColor;
}

export interface QuizParticipantInfo {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamColor: QuizTeamColor;
  joinedAt: number;
}

export interface QuizSubmittedAnswer {
  teamId: string;
  teamName: string;
  submittedBy: string;
  optionIndex: number;
  textAnswer?: string;
  isCorrect?: boolean;
  manuallyAwarded?: boolean;
  submittedAt: number;
}

export interface QuizOpenTextEntry {
  id: string;
  senderId: string;
  teamId: string;
  teamName: string;
  teamColor: QuizTeamColor;
  submittedBy: string;
  text: string;
  isCorrect?: boolean;
  manuallyAwarded?: boolean;
  submittedAt: number;
}

export interface QuizPublicQuestion {
  id: string;
  category: string;
  questionType: QuizQuestionType;
  musicSongId?: string;
  musicHint?: string;
  question: string;
  options: [string, string, string, string];
  samplePlaceholder?: string;
  correctIndex: number | null;
  acceptedAnswers?: string[];
  wordplayJoke: string | null;
}

export interface QuizMimePublicState {
  active: boolean;
  cardId: string;
  category: string;
  activeTeamIndex: number;
  activeTeamId: string;
  activeTeamName: string;
  activeTeamColor: QuizTeamColor;
  status: 'choosing' | 'acting' | 'revealed';
  word: string | null;
  startedAt: number;
  durationSec: number;
  guessedCorrect?: boolean;
  roundNumber: number;
}

export interface QuizRoomSnapshot {
  roomId: string;
  roomCode: string;
  hostName: string;
  edition: QuizEdition;
  phase: 'lobby' | 'question' | 'reveal' | 'finished';
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizPublicQuestion | null;
  startedAt: number;
  durationSec: number;
  serverNow: number;
  showLiveAnswersOnScreen: boolean;
  showCodeOnScreen: boolean;
  teams: QuizTeamDef[];
  teamScores: Record<string, number>;
  participants: QuizParticipantInfo[];
  answeredTeamIds: string[];
  liveOpenAnswers: QuizOpenTextEntry[];
  liveOpenAnswerCount: number;
  revealedAnswers: Record<string, QuizSubmittedAnswer>;
  mimeState?: QuizMimePublicState | null;
}

export const DEFAULT_QUIZ_TEAMS: QuizTeamDef[] = [
  { id: 'team-red', name: 'Rødt lag', color: 'red' },
  { id: 'team-blue', name: 'Blått lag', color: 'blue' },
  { id: 'team-emerald', name: 'Grønt lag', color: 'emerald' },
  { id: 'team-amber', name: 'Gult lag', color: 'amber' },
];

class QuizService {
  private snapshot: QuizRoomSnapshot | null = null;
  private isHost: boolean = false;
  private isRemoteParticipant: boolean = false;
  private isTvViewerMode: boolean = false;
  private myTeamId: string = 'team-red';
  private myTeamName: string = '';
  private myTeamColor: QuizTeamColor = 'red';
  private myPlayerName: string = '';
  private joinedRoomCode: string = '';
  private hostRoomCode: string = '';
  private hostEdition: QuizEdition = 'adult';
  private hostTeams: QuizTeamDef[] = DEFAULT_QUIZ_TEAMS.map((t) => ({ ...t }));
  private lastError: string | null = null;
  private listeners: Set<() => void> = new Set();
  private joinListeners: Set<(participant: QuizParticipantInfo, totalCount: number) => void> = new Set();
  private seenParticipantIds: Set<string> = new Set();
  private remoteQuizUnsub: (() => void) | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private clockOffsetMs: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('joybingo_quiz_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'quiz:state' && event.data?.payload) {
            this.applySnapshot(event.data.payload);
          }
        };
      } catch {
        // Ignore if BroadcastChannel is unavailable
      }

      socialSocket.on('connection:open', () => {
        if (this.isHost && !this.isRemoteParticipant && remoteBingo.canActAsHost()) {
          const code = this.resolveActiveRoomCode();
          if (code) {
            const hostKey = remoteBingo.getHostKeyForService();
            const resolvedHostName = (this.snapshot?.hostName || remoteBingo.getHostName() || 'Arrangør').trim();
            const questions = getQuestionsForEdition(this.hostEdition);
            socialSocket.send('quiz:host_init', {
              roomCode: code,
              hostName: resolvedHostName,
              hostKey,
              edition: this.hostEdition,
              totalQuestions: questions.length,
              teams: this.hostTeams,
            });
            fetch('/api/rooms/register', {
              method: 'POST',
              cache: 'no-store',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'quiz', roomCode: code, hostName: resolvedHostName, hostKey }),
            }).catch(() => {});
          }
        } else if (this.isRemoteParticipant && this.joinedRoomCode) {
          socialSocket.send('quiz:join_team', {
            roomCode: this.joinedRoomCode,
            playerName: this.myPlayerName,
            teamId: this.myTeamId,
            teamName: this.myTeamName || undefined,
            teamColor: this.myTeamColor,
          });
          socialSocket.send('quiz:request_state', { roomCode: this.joinedRoomCode });
        }
      });

      socialSocket.on('quiz:state', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          this.applySnapshot(payload as QuizRoomSnapshot);
        }
      });

      socialSocket.on('quiz:error', (payload: unknown) => {
        const err = payload as { message?: string };
        if (err?.message) {
          this.lastError = err.message;
          if (this.isRemoteParticipant && !this.snapshot) {
            this.isRemoteParticipant = false;
            this.joinedRoomCode = '';
            sessionTimer.setRemoteAccessGranted(false);
          }
          this.notify();
        }
      });

      sessionTimer.subscribe(() => {
        if (this.isHost && !sessionTimer.hasPaidAccess()) {
          this.leaveQuiz();
        }
      });
    }
  }

  private resolveActiveRoomCode(): string {
    return (
      this.snapshot?.roomCode ||
      (this.isHost ? this.hostRoomCode || remoteBingo.getHostCode() : this.joinedRoomCode) ||
      ''
    )
      .trim()
      .toUpperCase();
  }

  private applySnapshot(next: QuizRoomSnapshot) {
    if (typeof next.serverNow === 'number' && next.serverNow > 0) {
      this.clockOffsetMs = next.serverNow - Date.now();
    }
    const showCode = next.showCodeOnScreen !== false;
    const sanitizedNext: QuizRoomSnapshot =
      this.isTvViewerMode && !showCode
        ? { ...next, showCodeOnScreen: false, roomCode: '' }
        : { ...next, showCodeOnScreen: showCode };

    const incomingParticipants = Array.isArray(sanitizedNext.participants) ? sanitizedNext.participants : [];
    if (this.isHost && !this.isRemoteParticipant) {
      const newlyJoined = incomingParticipants.filter(
        (p) => p?.id && !this.seenParticipantIds.has(p.id)
      );
      incomingParticipants.forEach((p) => {
        if (p?.id) this.seenParticipantIds.add(p.id);
      });
      if (this.snapshot && newlyJoined.length > 0) {
        newlyJoined.forEach((p) => {
          this.joinListeners.forEach((fn) => fn(p, incomingParticipants.length));
        });
      }
    }

    this.snapshot = sanitizedNext;
    this.lastError = null;
    if (
      sanitizedNext.edition === 'adult' ||
      sanitizedNext.edition === 'family' ||
      sanitizedNext.edition === 'christmas' ||
      sanitizedNext.edition === 'senior'
    ) {
      this.hostEdition = sanitizedNext.edition;
    }
    if (Array.isArray(sanitizedNext.teams) && sanitizedNext.teams.length >= 2) {
      this.hostTeams = sanitizedNext.teams;
    }
    if (this.isHost && !this.isRemoteParticipant && remoteBingo.canActAsHost()) {
      const isPublicReveal = sanitizedNext.phase === 'reveal' || sanitizedNext.phase === 'finished';
      const q = sanitizedNext.currentQuestion;
      const sanitizedCloudQ = q
        ? {
            id: q.id,
            category: q.category,
            questionType: q.questionType,
            musicSongId: q.musicSongId,
            musicHint: q.musicHint,
            question: q.question,
            options: q.options,
            samplePlaceholder: q.samplePlaceholder,
            correctIndex: isPublicReveal ? q.correctIndex : null,
            acceptedAnswers: isPublicReveal ? q.acceptedAnswers : undefined,
            wordplayJoke: isPublicReveal ? q.wordplayJoke : null,
          }
        : null;
      const m = sanitizedNext.mimeState;
      const sanitizedCloudMime = m
        ? {
            ...m,
            word: m.status === 'revealed' ? m.word : null,
          }
        : null;
      remoteBingo.syncQuizStateToCloud(
        {
          phase: sanitizedNext.phase,
          questionIndex: sanitizedNext.questionIndex,
          totalQuestions: sanitizedNext.totalQuestions,
          currentQuestion: sanitizedCloudQ,
          startedAt: sanitizedNext.startedAt,
          durationSec: sanitizedNext.durationSec,
          showLiveAnswersOnScreen: sanitizedNext.showLiveAnswersOnScreen,
          showCodeOnScreen: sanitizedNext.showCodeOnScreen,
          teams: sanitizedNext.teams,
          teamScores: sanitizedNext.teamScores,
          answeredTeamIds: sanitizedNext.answeredTeamIds,
          mimeState: sanitizedCloudMime,
          updatedAt: Date.now(),
        },
        sanitizedNext.edition
      );
    }
    this.notify();
  }

  private broadcastLocalFallback(snap: QuizRoomSnapshot) {
    this.applySnapshot(snap);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'quiz:state', payload: snap });
      } catch {
        // ignore
      }
    }
  }

  public getRoomCode(): string {
    if (this.isHost && remoteBingo.canActAsHost()) {
      return this.snapshot?.roomCode || this.hostRoomCode || remoteBingo.getHostCode();
    }
    if (this.isRemoteParticipant) {
      return this.snapshot?.roomCode || this.joinedRoomCode;
    }
    return '';
  }

  public getSnapshot(): QuizRoomSnapshot | null {
    return this.snapshot;
  }

  public getIsHost(): boolean {
    return this.isHost && !this.isRemoteParticipant && remoteBingo.canActAsHost();
  }

  public getIsRemoteParticipant(): boolean {
    return this.isRemoteParticipant;
  }

  public getMyTeamId(): string {
    return this.myTeamId;
  }

  public setMyTeamId(teamId: string) {
    this.myTeamId = teamId;
    this.notify();
  }

  public getMyPlayerName(): string {
    return this.myPlayerName;
  }

  public getHostEdition(): QuizEdition {
    return this.snapshot?.edition || this.hostEdition;
  }

  public getHostTeams(): QuizTeamDef[] {
    return this.snapshot?.teams || this.hostTeams;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public clearError() {
    this.lastError = null;
    this.notify();
  }

  public getRemainingSeconds(): number {
    if (!this.snapshot) return 60;
    if (this.snapshot.mimeState?.active && this.snapshot.mimeState.status === 'acting' && this.snapshot.mimeState.startedAt) {
      const approxServerNow = Date.now() + this.clockOffsetMs;
      const elapsedSec = (approxServerNow - this.snapshot.mimeState.startedAt) / 1000;
      return Math.max(0, Math.ceil((this.snapshot.mimeState.durationSec || 60) - elapsedSec));
    }
    if (this.snapshot.phase !== 'question' || !this.snapshot.startedAt) {
      return 60;
    }
    const approxServerNow = Date.now() + this.clockOffsetMs;
    const elapsedSec = (approxServerNow - this.snapshot.startedAt) / 1000;
    return Math.max(0, Math.ceil((this.snapshot.durationSec || 60) - elapsedSec));
  }

  public startHostSession(edition: QuizEdition, hostName?: string, customCode?: string) {
    if (this.isRemoteParticipant || !remoteBingo.canActAsHost()) {
      this.isHost = false;
      this.notify();
      return;
    }

    const code = (customCode || remoteBingo.ensurePaidHostCode()).trim().toUpperCase();
    if (!code) {
      this.isHost = false;
      this.notify();
      return;
    }

    const hostKey = remoteBingo.getHostKeyForService();
    const resolvedHostName = (hostName || remoteBingo.getHostName() || 'Arrangør').trim();
    const questions = getQuestionsForEdition(edition);

    this.isHost = true;
    this.isRemoteParticipant = false;
    this.joinedRoomCode = '';
    this.hostRoomCode = code;
    this.hostEdition = edition;

    const roomId = `joy-quiz-${code}`;
    socialSocket.updateProfile(resolvedHostName);
    socialSocket.connect(roomId);

    socialSocket.send('quiz:host_init', {
      roomCode: code,
      hostName: resolvedHostName,
      hostKey,
      edition,
      totalQuestions: questions.length,
      teams: this.hostTeams,
    });

    if (typeof window !== 'undefined') {
      fetch('/api/rooms/register', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', roomCode: code, hostName: resolvedHostName, hostKey }),
      }).catch(() => {});
      remoteBingo.notifyQuizHosted(code, edition);
    }

    if (!this.snapshot || this.snapshot.roomCode !== code) {
      const initialSnap: QuizRoomSnapshot = {
        roomId,
        roomCode: code,
        hostName: resolvedHostName,
        edition,
        phase: 'lobby',
        questionIndex: 0,
        totalQuestions: questions.length,
        currentQuestion: null,
        startedAt: 0,
        durationSec: 60,
        serverNow: Date.now(),
        showLiveAnswersOnScreen: true,
        showCodeOnScreen: remoteBingo.isShowCodeOnBigScreen(),
        teams: this.hostTeams,
        teamScores: this.hostTeams.reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {}),
        participants: [],
        answeredTeamIds: [],
        liveOpenAnswers: [],
        liveOpenAnswerCount: 0,
        revealedAnswers: {},
      };
      this.broadcastLocalFallback(initialSnap);
    }

    this.notify();
  }

  public switchEdition(edition: QuizEdition) {
    if (!this.getIsHost()) return;
    this.hostEdition = edition;
    const questions = getQuestionsForEdition(edition);
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:reset_game', { roomCode, edition, hostKey });

    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        edition,
        phase: 'lobby',
        questionIndex: 0,
        totalQuestions: questions.length,
        currentQuestion: null,
        startedAt: 0,
        answeredTeamIds: [],
        liveOpenAnswers: [],
        liveOpenAnswerCount: 0,
        revealedAnswers: {},
        mimeState: null,
        teamScores: this.hostTeams.reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {}),
      });
    }
    this.notify();
  }

  public updateTeams(teams: QuizTeamDef[]) {
    if (!this.getIsHost()) return;
    this.hostTeams = teams;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:update_teams', { roomCode, teams, hostKey });
    if (this.snapshot) {
      const nextScores = { ...this.snapshot.teamScores };
      teams.forEach((t) => {
        if (typeof nextScores[t.id] !== 'number') nextScores[t.id] = 0;
      });
      this.broadcastLocalFallback({
        ...this.snapshot,
        teams,
        teamScores: nextScores,
      });
    }
  }

  public startQuestion(questionIndex: number, question: QuizQuestion, durationSec = 60) {
    if (!this.getIsHost()) return;
    const questions = getQuestionsForEdition(question.edition);
    this.hostEdition = question.edition;
    const safeDuration = Math.min(180, Math.max(15, Math.trunc(Number(durationSec) || 60)));
    const qType = question.questionType || 'multiple_choice';
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();

    socialSocket.send('quiz:start_question', {
      roomCode,
      hostKey,
      edition: question.edition,
      questionIndex,
      totalQuestions: questions.length,
      durationSec: safeDuration,
      question: {
        id: question.id,
        category: question.category,
        questionType: qType,
        musicSongId: question.musicSongId,
        musicHint: question.musicHint,
        question: question.question,
        options: question.options,
        correctIndex: question.correctIndex,
        acceptedAnswers: question.acceptedAnswers,
        samplePlaceholder: question.samplePlaceholder,
        wordplayJoke: question.wordplayJoke,
        hostAnswerNote: question.hostAnswerNote,
      },
    });

    // Optimistic local state while server confirms
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        edition: question.edition,
        phase: 'question',
        questionIndex,
        totalQuestions: questions.length,
        currentQuestion: {
          id: question.id,
          category: question.category,
          questionType: qType,
          musicSongId: question.musicSongId,
          musicHint: question.musicHint,
          question: question.question,
          options: question.options,
          samplePlaceholder: question.samplePlaceholder,
          correctIndex: null,
          wordplayJoke: null,
        },
        startedAt: Date.now(),
        durationSec: safeDuration,
        serverNow: Date.now(),
        answeredTeamIds: [],
        liveOpenAnswers: [],
        liveOpenAnswerCount: 0,
        revealedAnswers: {},
      });
    }
  }

  public toggleLiveAnswersOnScreen(show: boolean) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:toggle_live_answers', { roomCode, showLiveAnswersOnScreen: show, hostKey });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        showLiveAnswersOnScreen: show,
      });
    }
  }

  public toggleCodeOnScreen(show: boolean) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:toggle_code_on_screen', { roomCode, showCodeOnScreen: show, hostKey });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        showCodeOnScreen: show,
      });
    }
  }

  private stopRemoteQuizSubscription() {
    if (this.remoteQuizUnsub) {
      try {
        this.remoteQuizUnsub();
      } catch {
        // ignore
      }
      this.remoteQuizUnsub = null;
    }
  }

  private applyCloudQuizRecord(cleanCode: string, rec: NonNullable<Awaited<ReturnType<typeof firebasePersistence.getActiveRoomFromFirestore>>>) {
    const qs = (rec.quizState || {}) as Record<string, any>;
    const teams =
      Array.isArray(qs.teams) && qs.teams.length >= 2
        ? (qs.teams as QuizTeamDef[])
        : DEFAULT_QUIZ_TEAMS.map((t) => ({ ...t }));
    const phase =
      qs.phase === 'question' || qs.phase === 'reveal' || qs.phase === 'finished'
        ? qs.phase
        : 'lobby';
    const isReveal = phase === 'reveal' || phase === 'finished';
    const rawQ = qs.currentQuestion as QuizPublicQuestion | null | undefined;
    const sanitizedQ: QuizPublicQuestion | null = rawQ
      ? {
          id: String(rawQ.id || ''),
          category: String(rawQ.category || ''),
          questionType: rawQ.questionType || 'multiple_choice',
          musicSongId: rawQ.musicSongId ? String(rawQ.musicSongId) : undefined,
          musicHint: rawQ.musicHint ? String(rawQ.musicHint) : undefined,
          question: String(rawQ.question || ''),
          options: Array.isArray(rawQ.options) && rawQ.options.length === 4 ? (rawQ.options as [string, string, string, string]) : ['', '', '', ''],
          samplePlaceholder: rawQ.samplePlaceholder,
          correctIndex: isReveal && typeof rawQ.correctIndex === 'number' ? rawQ.correctIndex : null,
          acceptedAnswers: isReveal && Array.isArray(rawQ.acceptedAnswers) ? rawQ.acceptedAnswers : undefined,
          wordplayJoke: isReveal && typeof rawQ.wordplayJoke === 'string' ? rawQ.wordplayJoke : null,
        }
      : null;

    const showCode = qs.showCodeOnScreen !== false && rec.showCodeOnScreen !== false;
    const snap: QuizRoomSnapshot = {
      roomId: `joy-quiz-${cleanCode}`,
      roomCode: this.isTvViewerMode && !showCode ? '' : cleanCode,
      hostName: rec.hostName || 'Arrangør',
      edition: rec.edition || 'adult',
      phase,
      questionIndex: typeof qs.questionIndex === 'number' ? qs.questionIndex : 0,
      totalQuestions: typeof qs.totalQuestions === 'number' ? qs.totalQuestions : 300,
      currentQuestion: sanitizedQ,
      startedAt: typeof qs.startedAt === 'number' ? qs.startedAt : 0,
      durationSec: typeof qs.durationSec === 'number' ? qs.durationSec : 60,
      serverNow: typeof qs.updatedAt === 'number' ? qs.updatedAt : rec.updatedAt || Date.now(),
      showLiveAnswersOnScreen: qs.showLiveAnswersOnScreen !== false,
      showCodeOnScreen: showCode,
      teams,
      teamScores: (qs.teamScores as Record<string, number>) || teams.reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {}),
      participants: this.snapshot?.participants || [],
      answeredTeamIds: Array.isArray(qs.answeredTeamIds) ? (qs.answeredTeamIds as string[]) : [],
      liveOpenAnswers: this.snapshot?.liveOpenAnswers || [],
      liveOpenAnswerCount: this.snapshot?.liveOpenAnswerCount || 0,
      revealedAnswers: this.snapshot?.revealedAnswers || {},
      mimeState: qs.mimeState
        ? {
            ...(qs.mimeState as QuizMimePublicState),
            word: (qs.mimeState as QuizMimePublicState).status === 'revealed' ? (qs.mimeState as QuizMimePublicState).word : null,
          }
        : null,
    };
    this.snapshot = snap;
    this.lastError = null;
    this.notify();
  }

  private attachRemoteQuizCloudSync(cleanCode: string) {
    this.stopRemoteQuizSubscription();
    this.remoteQuizUnsub = firebasePersistence.subscribeActiveRoom(cleanCode, (rec) => {
      if (!rec) return;
      if (this.isRemoteParticipant || this.isTvViewerMode) {
        this.applyCloudQuizRecord(cleanCode, rec);
      }
    });
  }

  public watchAsTv(rawCode: string) {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) return;
    this.isHost = false;
    this.isRemoteParticipant = false;
    this.isTvViewerMode = true;
    const roomId = `joy-quiz-${cleanCode}`;
    this.attachRemoteQuizCloudSync(cleanCode);
    socialSocket.connectAsTvViewer(roomId, () => {
      socialSocket.send('quiz:tv_watch', { roomCode: cleanCode });
    });
    if (typeof window !== 'undefined') {
      fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((st) => {
          if (this.isTvViewerMode && st?.quizSnapshot) {
            this.applySnapshot(st.quizSnapshot as QuizRoomSnapshot);
          }
        })
        .catch(() => {});
    }
    this.notify();
  }

  public exitTvWatch() {
    this.isTvViewerMode = false;
    this.stopRemoteQuizSubscription();
    socialSocket.exitTvMode();
    this.notify();
  }

  public getIsTvViewer(): boolean {
    return this.isTvViewerMode;
  }

  public removeOpenEntry(entryId: string) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:remove_open_entry', { roomCode, entryId, hostKey });
    if (this.snapshot) {
      const nextEntries = (this.snapshot.liveOpenAnswers || []).filter((e) => e.id !== entryId);
      this.broadcastLocalFallback({
        ...this.snapshot,
        liveOpenAnswers: nextEntries,
        liveOpenAnswerCount: nextEntries.length,
      });
    }
  }

  public awardTeamAnswer(teamId: string) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:award_team_answer', { roomCode, teamId, hostKey });
  }

  public adjustTeamScore(teamId: string, delta: number) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:adjust_score', { roomCode, teamId, delta, hostKey });
    if (this.snapshot) {
      const nextScore = Math.max(0, (this.snapshot.teamScores?.[teamId] || 0) + delta);
      this.broadcastLocalFallback({
        ...this.snapshot,
        teamScores: {
          ...this.snapshot.teamScores,
          [teamId]: nextScore,
        },
      });
    }
  }

  public startMimeChoose(teamIndex: number, roundNumber: number) {
    if (!this.getIsHost() || this.getHostEdition() !== 'christmas') return;
    const teams = this.getHostTeams();
    const safeIdx = ((teamIndex % teams.length) + teams.length) % teams.length;
    const team = teams[safeIdx] || teams[0];
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:mime_choose', {
      roomCode,
      hostKey,
      activeTeamIndex: safeIdx,
      activeTeamId: team.id,
      activeTeamName: team.name,
      activeTeamColor: team.color,
      roundNumber,
    });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        mimeState: {
          active: true,
          cardId: '',
          category: '',
          activeTeamIndex: safeIdx,
          activeTeamId: team.id,
          activeTeamName: team.name,
          activeTeamColor: team.color,
          status: 'choosing',
          word: null,
          startedAt: 0,
          durationSec: 60,
          roundNumber,
        },
      });
    }
  }

  public startMimeActing(
    teamIndex: number,
    cardId: string,
    word: string,
    category: string,
    roundNumber: number
  ) {
    if (!this.getIsHost() || this.getHostEdition() !== 'christmas') return;
    const teams = this.getHostTeams();
    const safeIdx = ((teamIndex % teams.length) + teams.length) % teams.length;
    const team = teams[safeIdx] || teams[0];
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:mime_start', {
      roomCode,
      hostKey,
      activeTeamIndex: safeIdx,
      activeTeamId: team.id,
      activeTeamName: team.name,
      activeTeamColor: team.color,
      cardId,
      word,
      category,
      roundNumber,
      durationSec: 60,
    });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        mimeState: {
          active: true,
          cardId,
          category,
          activeTeamIndex: safeIdx,
          activeTeamId: team.id,
          activeTeamName: team.name,
          activeTeamColor: team.color,
          status: 'acting',
          word: null,
          startedAt: Date.now(),
          durationSec: 60,
          roundNumber,
        },
      });
    }
  }

  public revealMimeResult(guessedCorrect: boolean, points: number, secretWord?: string) {
    if (!this.getIsHost() || this.getHostEdition() !== 'christmas') return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:mime_reveal', {
      roomCode,
      hostKey,
      guessedCorrect,
      points,
      word: secretWord,
    });
    if (this.snapshot && this.snapshot.mimeState) {
      const m = this.snapshot.mimeState;
      const nextScores = { ...this.snapshot.teamScores };
      if (guessedCorrect && points > 0) {
        nextScores[m.activeTeamId] = (nextScores[m.activeTeamId] || 0) + points;
      }
      this.broadcastLocalFallback({
        ...this.snapshot,
        teamScores: nextScores,
        mimeState: {
          ...m,
          status: 'revealed',
          guessedCorrect,
          word: secretWord || m.word,
        },
      });
    }
  }

  public stopMimeMode() {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:mime_stop', { roomCode, hostKey });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        mimeState: null,
      });
    }
  }

  public revealAnswer(question?: QuizQuestion) {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:reveal_answer', { roomCode, hostKey });
    if (this.snapshot && question && this.snapshot.currentQuestion) {
      const accepted = question.acceptedAnswers || [];
      const updatedEntries = (this.snapshot.liveOpenAnswers || []).map((e) => ({
        ...e,
        isCorrect:
          question.questionType === 'open_text'
            ? isOpenTextAnswerCorrect(e.text, accepted)
            : e.isCorrect,
      }));
      this.broadcastLocalFallback({
        ...this.snapshot,
        phase: 'reveal',
        liveOpenAnswers: updatedEntries,
        currentQuestion: {
          ...this.snapshot.currentQuestion,
          correctIndex: question.correctIndex,
          acceptedAnswers: question.acceptedAnswers,
          wordplayJoke: question.wordplayJoke,
        },
      });
    }
  }

  public hideAnswer() {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:hide_answer', { roomCode, hostKey });
    if (this.snapshot && this.snapshot.currentQuestion) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        phase: 'question',
        currentQuestion: {
          ...this.snapshot.currentQuestion,
          correctIndex: null,
          acceptedAnswers: undefined,
          wordplayJoke: null,
        },
      });
    }
  }

  public finishGame() {
    if (!this.getIsHost()) return;
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:finish_game', { roomCode, hostKey });
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        phase: 'finished',
      });
    }
  }

  public resetGame(edition?: QuizEdition) {
    if (!this.getIsHost()) return;
    const targetEdition = edition || this.getHostEdition();
    const hostKey = remoteBingo.getHostKeyForService();
    const roomCode = this.resolveActiveRoomCode();
    remoteBingo.unlockCodeForNewRound();
    socialSocket.send('quiz:reset_game', { roomCode, edition: targetEdition, hostKey });
  }

  public async validateAndJoinQuizWithCode(
    rawCode: string,
    rawPlayerName: string,
    teamId: string,
    customTeamName?: string,
    teamColor: QuizTeamColor = 'red'
  ): Promise<{ success: boolean; error?: string }> {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 3) {
      return { success: false, error: 'Vennligst skriv inn en gyldig koblingskode (minst 3 tegn).' };
    }

    const trimmedName = rawPlayerName.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: 'Skriv inn ditt navn eller lagnavn (minst 2 tegn).' };
    }

    const modName = moderation.filterText(trimmedName);
    if (modName.hasBannedWords) {
      return { success: false, error: 'Upassende ord er ikke tillatt. Velg et hyggelig navn for sosial trivsel.' };
    }

    let finalTeamName = customTeamName?.trim() || '';
    if (finalTeamName) {
      const modTeam = moderation.filterText(finalTeamName);
      if (modTeam.hasBannedWords) {
        return { success: false, error: 'Upassende ord i lagnavn er ikke tillatt.' };
      }
      finalTeamName = modTeam.cleanText;
    }

    let isValid = false;
    let cloudRec: Awaited<ReturnType<typeof firebasePersistence.getActiveRoomFromFirestore>> = null;

    try {
      const resp = await fetch(`/api/rooms/validate?type=quiz&code=${encodeURIComponent(cleanCode)}`, {
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
      cloudRec = await firebasePersistence.getActiveRoomFromFirestore(cleanCode);
      if (cloudRec && (cloudRec.hasQuiz || cloudRec.activeGame === 'quiz' || !cloudRec.activeGame)) {
        isValid = true;
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Fant ingen aktiv quiz med denne koblingskoden. Sjekk at arrangøren har åpnet rommet og aktivert koden.',
      };
    }

    const joined = this.joinQuizWithCode(cleanCode, trimmedName, teamId, finalTeamName || undefined, teamColor);
    if (joined.success && cloudRec) {
      this.applyCloudQuizRecord(cleanCode, cloudRec);
    }
    return joined;
  }

  public joinQuizWithCode(
    rawCode: string,
    rawPlayerName: string,
    teamId: string,
    customTeamName?: string,
    teamColor: QuizTeamColor = 'red'
  ): { success: boolean; error?: string } {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 3) {
      return { success: false, error: 'Vennligst skriv inn en gyldig koblingskode (minst 3 tegn).' };
    }

    const trimmedName = rawPlayerName.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: 'Skriv inn ditt navn eller lagnavn (minst 2 tegn).' };
    }

    const modName = moderation.filterText(trimmedName);
    if (modName.hasBannedWords) {
      return { success: false, error: 'Upassende ord er ikke tillatt. Velg et hyggelig navn for sosial trivsel.' };
    }

    let finalTeamName = customTeamName?.trim() || '';
    if (finalTeamName) {
      const modTeam = moderation.filterText(finalTeamName);
      if (modTeam.hasBannedWords) {
        return { success: false, error: 'Upassende ord i lagnavn er ikke tillatt.' };
      }
      finalTeamName = modTeam.cleanText;
    }

    this.isHost = false;
    this.isRemoteParticipant = true;
    this.joinedRoomCode = cleanCode;
    this.hostRoomCode = '';
    this.myPlayerName = modName.cleanText;
    this.myTeamId = teamId;
    this.myTeamName = finalTeamName;
    this.myTeamColor = teamColor;

    // Host has paid for the event: remote quiz participants join free
    sessionTimer.setRemoteAccessGranted(true);

    const roomId = `joy-quiz-${cleanCode}`;
    socialSocket.updateProfile(this.myPlayerName);
    socialSocket.connect(roomId);
    this.attachRemoteQuizCloudSync(cleanCode);

    const emitJoin = () => {
      socialSocket.send('quiz:join_team', {
        roomCode: cleanCode,
        playerName: this.myPlayerName,
        teamId,
        teamName: finalTeamName || undefined,
        teamColor,
      });
      socialSocket.send('quiz:request_state', { roomCode: cleanCode });
    };

    emitJoin();
    setTimeout(() => {
      emitJoin();
      if (typeof window !== 'undefined' && this.isRemoteParticipant && this.joinedRoomCode === cleanCode) {
        fetch(`/api/rooms/state?code=${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((st) => {
            if (this.isRemoteParticipant && st?.quizSnapshot && !this.snapshot) {
              this.applySnapshot(st.quizSnapshot as QuizRoomSnapshot);
            }
          })
          .catch(() => {});
      }
    }, 550);

    this.notify();
    return { success: true };
  }

  public submitTeamAnswer(teamId: string, optionIndex: number) {
    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:submit_answer', {
      roomCode,
      teamId,
      optionIndex,
    });
  }

  public submitOpenTextAnswer(
    teamId: string,
    rawText: string
  ): { success: boolean; error?: string; cleanText?: string } {
    const trimmed = rawText.trim().slice(0, 120);
    if (!trimmed) {
      return { success: false, error: 'Skriv et svar før du sender det inn.' };
    }
    const mod = moderation.filterText(trimmed);
    if (mod.hasBannedWords) {
      return {
        success: false,
        error: 'Upassende ord er ikke tillatt på storskjermen. Skriv et hyggelig svar!',
      };
    }

    const roomCode = this.resolveActiveRoomCode();
    socialSocket.send('quiz:submit_answer', {
      roomCode,
      teamId,
      textAnswer: mod.cleanText,
    });

    return { success: true, cleanText: mod.cleanText };
  }

  public kickParticipant(userId: string, playerName: string) {
    if (!this.getIsHost()) return;
    socialSocket.banUser(userId, playerName);
    if (this.snapshot) {
      this.broadcastLocalFallback({
        ...this.snapshot,
        participants: this.snapshot.participants.filter((p) => p.id !== userId),
      });
    }
  }

  public leaveQuiz() {
    const wasHost = this.isHost;
    const oldCode = this.resolveActiveRoomCode();
    const hostKey = remoteBingo.getHostKeyForService() || undefined;
    if (this.isRemoteParticipant) {
      sessionTimer.setRemoteAccessGranted(false);
    }
    this.stopRemoteQuizSubscription();
    this.seenParticipantIds.clear();
    this.isHost = false;
    this.isRemoteParticipant = false;
    this.joinedRoomCode = '';
    this.hostRoomCode = '';
    this.snapshot = null;
    if (wasHost && oldCode) {
      socialSocket.send('quiz:host_leave', { roomCode: oldCode, hostKey });
      if (typeof window !== 'undefined') {
        fetch('/api/rooms/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'quiz', roomCode: oldCode, hostKey }),
        }).catch(() => {});
      }
    }
    socialSocket.joinRoom('joy-lounge');
    this.notify();
  }

  public onParticipantJoined(fn: (participant: QuizParticipantInfo, totalCount: number) => void): () => void {
    this.joinListeners.add(fn);
    return () => this.joinListeners.delete(fn);
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const quizService = new QuizService();
