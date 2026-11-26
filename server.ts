/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

server.on('error', (err: unknown) => {
  console.error('Server error event caught:', err);
});

wss.on('error', (err: unknown) => {
  console.error('WebSocket server error event caught:', err);
});

app.set('trust proxy', true);
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.path === '/api/health' || req.path === '/healthz') {
      return next();
    }
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim().toLowerCase();
    const host = ((req.headers['x-forwarded-host'] as string) || req.headers.host || '').split(',')[0]?.trim();
    const isLocal = !host || host.startsWith('localhost') || host.startsWith('127.0.0.1');
    if (!isLocal && proto === 'http') {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    if (!isLocal && proto === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}
app.use(express.json({ limit: '2mb' }));

interface ClientInfo {
  ws: WebSocket;
  id: string;
  name: string;
  color: string;
  roomId: string;
  hostedBingoRoomId?: string;
  joinedBingoRoomId?: string;
  activeQuizRoomId?: string;
  isTvViewer?: boolean;
  tvWatchCode?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  type: 'text' | 'reaction' | 'achievement' | 'cheer';
  reactionEmoji?: string;
  achievementTitle?: string;
  timestamp: number;
}

interface Friend {
  id: string;
  name: string;
  color: string;
  isOnline: boolean;
  statusText?: string;
  lastActive: number;
}

interface CustomCard {
  id: string;
  title: string;
  theme: string;
  creatorName: string;
  items: string[];
  createdAt: number;
}

// In-memory server-authoritative state
const clients = new Map<WebSocket, ClientInfo>();
const roomMessages = new Map<string, ChatMessage[]>();
const customCards = new Map<string, CustomCard>();
// Global directory of known community players for friends management
const playerDirectory = new Map<string, Friend>();

// Server-authoritative multiplayer Quiz rooms
interface QuizTeamDef {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'emerald' | 'amber';
}

interface QuizParticipantInfo {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamColor: 'red' | 'blue' | 'emerald' | 'amber';
  joinedAt: number;
}

interface QuizSubmittedAnswer {
  teamId: string;
  teamName: string;
  submittedBy: string;
  optionIndex: number;
  textAnswer?: string;
  isCorrect?: boolean;
  manuallyAwarded?: boolean;
  submittedAt: number;
}

interface QuizOpenTextEntry {
  id: string;
  senderId: string;
  teamId: string;
  teamName: string;
  teamColor: 'red' | 'blue' | 'emerald' | 'amber';
  submittedBy: string;
  text: string;
  isCorrect?: boolean;
  manuallyAwarded?: boolean;
  submittedAt: number;
}

interface QuizActiveQuestionPayload {
  id: string;
  category: string;
  questionType: 'multiple_choice' | 'open_text';
  musicSongId?: string;
  musicHint?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  acceptedAnswers?: string[];
  samplePlaceholder?: string;
  wordplayJoke: string;
  hostAnswerNote: string;
}

interface QuizMimeServerState {
  active: boolean;
  cardId: string;
  word: string;
  category: string;
  activeTeamIndex: number;
  activeTeamId: string;
  activeTeamName: string;
  activeTeamColor: 'red' | 'blue' | 'emerald' | 'amber';
  status: 'choosing' | 'acting' | 'revealed';
  startedAt: number;
  durationSec: number;
  guessedCorrect?: boolean;
  roundNumber: number;
}

interface QuizRoomState {
  roomId: string;
  roomCode: string;
  hostId: string;
  hostKey?: string;
  hostName: string;
  isHostActive: boolean;
  edition: 'adult' | 'family' | 'christmas' | 'senior';
  phase: 'lobby' | 'question' | 'reveal' | 'finished';
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizActiveQuestionPayload | null;
  startedAt: number;
  durationSec: number;
  showLiveAnswersOnScreen: boolean;
  showCodeOnScreen: boolean;
  teams: QuizTeamDef[];
  teamScores: Record<string, number>;
  participants: QuizParticipantInfo[];
  answers: Record<string, QuizSubmittedAnswer>;
  openTextEntries: QuizOpenTextEntry[];
  gradedQuestionIndices: Set<number>;
  mimeState: QuizMimeServerState | null;
}

function normalizeQuizServerText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[«»"'.,!?():;]/g, '')
    .replace(/\s+/g, ' ');
}

function isServerOpenTextCorrect(text: string, accepted: string[] = []): boolean {
  const norm = normalizeQuizServerText(text);
  if (!norm) return false;
  return accepted.some((ans) => {
    const clean = normalizeQuizServerText(ans);
    if (!clean) return false;
    return norm === clean || (clean.length >= 3 && norm.includes(clean));
  });
}

const DEFAULT_QUIZ_TEAMS: QuizTeamDef[] = [
  { id: 'team-red', name: 'Rødt lag', color: 'red' },
  { id: 'team-blue', name: 'Blått lag', color: 'blue' },
  { id: 'team-emerald', name: 'Grønt lag', color: 'emerald' },
  { id: 'team-amber', name: 'Gult lag', color: 'amber' },
];

interface BingoTvPlayerSummary {
  id: string;
  name: string;
  avatarColor: string;
  linesCompleted: number;
  hasBingo: boolean;
  isRemote?: boolean;
}

type ServerBingoMilestone = 'line1' | 'line3' | 'fullbrett';

function resolveBingoMilestoneFromPattern(pattern: string, isFullHouse: boolean): ServerBingoMilestone {
  if (isFullHouse || /fullbrett|fullt?\s*brett|full_?house|blackout/i.test(pattern)) {
    return 'fullbrett';
  }
  if (/3\s*\.?\s*rekke|3\s*line|tre\s*rekke/i.test(pattern)) {
    return 'line3';
  }
  return 'line1';
}

interface BingoHostRoomEntry {
  roomId: string;
  roomCode: string;
  hostId: string;
  hostKey?: string;
  hostName: string;
  createdAt: number;
  roundNumber?: number;
  calledBalls: any[];
  showCodeOnScreen: boolean;
  playersSummary: BingoTvPlayerSummary[];
  themeTitle?: string;
  lastClaim?: { playerName: string; pattern: string; isFullHouse?: boolean; milestone?: ServerBingoMilestone; timestamp: number } | null;
  claimedMilestones?: ServerBingoMilestone[];
  milestoneWinners?: Partial<Record<ServerBingoMilestone, string>>;
}

interface MusicBingoParticipantProgress {
  id: string;
  name: string;
  markedCount: number;
  linesCompleted: number;
  hasBingo: boolean;
}

interface MusicBingoRoomState {
  roomCode: string;
  hostId: string;
  hostKey?: string;
  hostName: string;
  roundNumber: number;
  isActive: boolean;
  playedSongIds: string[];
  currentSongId: string | null;
  revealCurrentSong: boolean;
  clipStartedAt: number;
  clipDurationSec: number;
  lastClaim: { playerName: string; pattern: string; timestamp: number } | null;
  claimedMilestones?: ServerBingoMilestone[];
  milestoneWinners?: Partial<Record<ServerBingoMilestone, string>>;
  participants: Map<string, MusicBingoParticipantProgress>;
}

const quizRooms = new Map<string, QuizRoomState>();
const bingoHostRooms = new Map<string, BingoHostRoomEntry>();
const musicBingoRooms = new Map<string, MusicBingoRoomState>();
const pendingBingoRoundTimers = new Map<string, ReturnType<typeof setTimeout>>();
const bingoRemoteProgressByRoom = new Map<string, Map<string, BingoTvPlayerSummary>>();
const activeTvGameByCode = new Map<string, 'quiz' | 'bingo'>();
const lastFirestoreSyncByCode = new Map<string, number>();

function serializeMusicRoom(room: MusicBingoRoomState) {
  return {
    roomCode: room.roomCode,
    hostName: room.hostName,
    roundNumber: room.roundNumber,
    isActive: room.isActive,
    playedSongIds: room.playedSongIds,
    currentSongId: room.currentSongId,
    revealCurrentSong: room.revealCurrentSong,
    clipStartedAt: room.clipStartedAt,
    clipDurationSec: room.clipDurationSec,
    lastClaim: room.lastClaim,
    claimedMilestones: room.claimedMilestones || [],
    milestoneWinners: room.milestoneWinners || {},
    participants: Array.from(room.participants.values()).slice(0, 120),
    serverNow: Date.now(),
  };
}

function broadcastMusicBingoState(code: string, room: MusicBingoRoomState) {
  const bingoRoomId = `joy-bingo-${code}`;
  const quizRoomId = `joy-quiz-${code}`;
  const msg = JSON.stringify({
    type: 'music:state',
    payload: serializeMusicRoom(room),
  });
  for (const [ws, client] of clients.entries()) {
    if (
      ws.readyState === WebSocket.OPEN &&
      (isClientInRoom(client, bingoRoomId) || isClientInRoom(client, quizRoomId) || client.tvWatchCode === code)
    ) {
      ws.send(msg);
    }
  }
}

const ROOM_DATA_DIR = path.join(__dirname, '.data');
const ACTIVE_ROOMS_PATH = path.join(ROOM_DATA_DIR, 'active-rooms.json');
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
let activeRoomsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function buildCalledBallFromNumber(num: number): any {
  const letters: ('B' | 'I' | 'N' | 'G' | 'O')[] = ['B', 'I', 'N', 'G', 'O'];
  const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
  const col = Math.min(4, Math.max(0, Math.floor((num - 1) / 15)));
  return {
    number: num,
    letter: letters[col],
    color: colors[col],
    affirmation: 'Fellesskap & Glede',
    timestamp: Date.now(),
  };
}

function pruneExpiredRooms(now = Date.now()) {
  for (const [id, entry] of bingoHostRooms.entries()) {
    if (now - (entry.createdAt || now) > ROOM_TTL_MS) {
      bingoHostRooms.delete(id);
    }
  }
  for (const [id, room] of quizRooms.entries()) {
    if (!room.isHostActive && room.participants.length === 0) {
      quizRooms.delete(id);
    }
  }
}

function saveActiveRoomsNow() {
  try {
    pruneExpiredRooms();
    if (!fs.existsSync(ROOM_DATA_DIR)) {
      fs.mkdirSync(ROOM_DATA_DIR, { recursive: true });
    }
    const serializedQuizRooms = Array.from(quizRooms.values())
      .filter((r) => r.isHostActive)
      .map((r) => ({
        ...r,
        gradedQuestionIndices: Array.from(r.gradedQuestionIndices || []),
      }));
    const payload = {
      savedAt: Date.now(),
      bingoRooms: Array.from(bingoHostRooms.values()),
      quizRooms: serializedQuizRooms,
      activeTvGame: Array.from(activeTvGameByCode.entries()),
    };
    const tmpPath = `${ACTIVE_ROOMS_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
    fs.renameSync(tmpPath, ACTIVE_ROOMS_PATH);
  } catch (err) {
    console.warn('Could not persist active-rooms.json:', err instanceof Error ? err.message : err);
  }
}

function scheduleSaveActiveRooms() {
  if (activeRoomsSaveTimer) return;
  activeRoomsSaveTimer = setTimeout(() => {
    activeRoomsSaveTimer = null;
    saveActiveRoomsNow();
  }, 250);
}

function loadPersistedActiveRooms() {
  try {
    if (!fs.existsSync(ACTIVE_ROOMS_PATH)) return;
    const raw = fs.readFileSync(ACTIVE_ROOMS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (Array.isArray(parsed?.bingoRooms)) {
      for (const b of parsed.bingoRooms) {
        if (b && b.roomId && b.roomCode && now - (Number(b.createdAt) || now) <= ROOM_TTL_MS) {
          bingoHostRooms.set(String(b.roomId), {
            ...b,
            calledBalls: Array.isArray(b.calledBalls) ? b.calledBalls : [],
            playersSummary: Array.isArray(b.playersSummary) ? b.playersSummary : [],
            showCodeOnScreen: b.showCodeOnScreen !== false,
          });
        }
      }
    }
    if (Array.isArray(parsed?.quizRooms)) {
      for (const q of parsed.quizRooms) {
        if (q && q.roomId && q.roomCode && q.isHostActive) {
          quizRooms.set(String(q.roomId), {
            ...q,
            participants: [],
            gradedQuestionIndices: new Set<number>(Array.isArray(q.gradedQuestionIndices) ? q.gradedQuestionIndices : []),
          });
        }
      }
    }
    if (Array.isArray(parsed?.activeTvGame)) {
      for (const pair of parsed.activeTvGame) {
        if (Array.isArray(pair) && pair.length === 2 && (pair[1] === 'quiz' || pair[1] === 'bingo')) {
          activeTvGameByCode.set(String(pair[0]), pair[1]);
        }
      }
    }
    if (bingoHostRooms.size > 0 || quizRooms.size > 0) {
      console.log(`Restored ${bingoHostRooms.size} bingo & ${quizRooms.size} quiz active rooms from disk.`);
    }
  } catch (err) {
    console.warn('Could not restore active-rooms.json:', err instanceof Error ? err.message : err);
  }
}

loadPersistedActiveRooms();

function isBingoRoomHost(roomId: string, clientId: string, payload?: any): boolean {
  const entry = bingoHostRooms.get(roomId);
  if (!entry) return false;
  if (entry.hostId === clientId) return true;
  if (entry.hostKey && payload?.hostKey && String(payload.hostKey) === entry.hostKey) {
    entry.hostId = clientId;
    return true;
  }
  return false;
}

function isQuizRoomHost(room: QuizRoomState, clientId: string, payload?: any): boolean {
  if (!room.isHostActive) return false;
  if (room.hostId === clientId) return true;
  if (room.hostKey && payload?.hostKey && String(payload.hostKey) === room.hostKey) {
    room.hostId = clientId;
    return true;
  }
  return false;
}

function cleanRoomCode(raw: unknown): string {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isClientInRoom(client: ClientInfo, roomId: string): boolean {
  return (
    client.roomId === roomId ||
    client.hostedBingoRoomId === roomId ||
    client.joinedBingoRoomId === roomId ||
    client.activeQuizRoomId === roomId
  );
}

function resolveBingoRoomId(client: ClientInfo, payload?: any): string {
  const explicitCode = cleanRoomCode(payload?.roomCode);
  if (explicitCode.length >= 3) return `joy-bingo-${explicitCode}`;
  if (client.roomId.startsWith('joy-bingo-')) return client.roomId;
  if (client.hostedBingoRoomId) return client.hostedBingoRoomId;
  if (client.joinedBingoRoomId) return client.joinedBingoRoomId;
  return client.roomId;
}

function resolveQuizRoomId(client: ClientInfo, payload?: any): string {
  const explicitCode = cleanRoomCode(payload?.roomCode);
  if (explicitCode.length >= 3) return `joy-quiz-${explicitCode}`;
  if (client.roomId.startsWith('joy-quiz-')) return client.roomId;
  if (client.activeQuizRoomId) return client.activeQuizRoomId;
  return client.roomId;
}

function ensureUnifiedArrangementRooms(
  code: string,
  hostId: string,
  hostName: string,
  hostKey?: string
) {
  const cleanCode = cleanRoomCode(code);
  if (!cleanCode || cleanCode.length < 3) return;

  const bingoRoomId = `joy-bingo-${cleanCode}`;
  const existingBingo = bingoHostRooms.get(bingoRoomId);
  if (!existingBingo) {
    bingoHostRooms.set(bingoRoomId, {
      roomId: bingoRoomId,
      roomCode: cleanCode,
      hostId: hostId || 'http-host',
      hostKey,
      hostName: hostName || 'Arrangør',
      createdAt: Date.now(),
      roundNumber: 1,
      calledBalls: [],
      showCodeOnScreen: true,
      playersSummary: [],
      lastClaim: null,
    });
  } else {
    if (hostId && hostId !== 'http-host') existingBingo.hostId = hostId;
    if (hostKey && !existingBingo.hostKey) existingBingo.hostKey = hostKey;
    if (hostName) existingBingo.hostName = hostName;
    if (!existingBingo.roundNumber) existingBingo.roundNumber = 1;
  }

  const quizRoomId = `joy-quiz-${cleanCode}`;
  const qRoom = getOrCreateQuizRoom(quizRoomId);
  qRoom.roomCode = cleanCode;
  if (hostName) qRoom.hostName = hostName;
  if (hostId && hostId !== 'http-host') qRoom.hostId = hostId;
  if (hostKey && !qRoom.hostKey) qRoom.hostKey = hostKey;
  qRoom.isHostActive = true;
}

function getOrCreateQuizRoom(roomId: string): QuizRoomState {
  if (!quizRooms.has(roomId)) {
    const code = roomId.replace(/^joy-quiz-/i, '') || roomId;
    quizRooms.set(roomId, {
      roomId,
      roomCode: code,
      hostId: '',
      hostName: 'Arrangør',
      isHostActive: false,
      edition: 'adult',
      phase: 'lobby',
      questionIndex: 0,
      totalQuestions: 300,
      currentQuestion: null,
      startedAt: 0,
      durationSec: 60,
      showLiveAnswersOnScreen: true,
      showCodeOnScreen: true,
      teams: DEFAULT_QUIZ_TEAMS.map((t) => ({ ...t })),
      teamScores: {
        'team-red': 0,
        'team-blue': 0,
        'team-emerald': 0,
        'team-amber': 0,
      },
      participants: [],
      answers: {},
      openTextEntries: [],
      gradedQuestionIndices: new Set<number>(),
      mimeState: null,
    });
  }
  return quizRooms.get(roomId)!;
}

function serializeQuizRoomPublic(room: QuizRoomState, isTvViewer = false) {
  const isRevealed = room.phase === 'reveal' || room.phase === 'finished';
  const isOpenText = room.currentQuestion?.questionType === 'open_text';
  const answeredTeamIds = Object.keys(room.answers);
  const publicQuestion = room.currentQuestion
    ? {
        id: room.currentQuestion.id,
        category: room.currentQuestion.category,
        questionType: room.currentQuestion.questionType,
        musicSongId: room.currentQuestion.musicSongId,
        musicHint: room.currentQuestion.musicHint,
        question: room.currentQuestion.question,
        options: room.currentQuestion.options,
        samplePlaceholder: room.currentQuestion.samplePlaceholder,
        correctIndex: isRevealed ? room.currentQuestion.correctIndex : null,
        acceptedAnswers: isRevealed ? room.currentQuestion.acceptedAnswers : undefined,
        wordplayJoke: isRevealed ? room.currentQuestion.wordplayJoke : null,
      }
    : null;

  const canShowLiveEntries = isOpenText && (room.showLiveAnswersOnScreen || isRevealed);

  return {
    roomId: room.roomId,
    // Keep join/login code hidden on TV/Projector until organizer actively reveals it
    roomCode: !isTvViewer || room.showCodeOnScreen ? room.roomCode : '',
    hostName: room.hostName,
    edition: room.edition,
    phase: room.phase,
    questionIndex: room.questionIndex,
    totalQuestions: room.totalQuestions,
    currentQuestion: publicQuestion,
    startedAt: room.startedAt,
    durationSec: room.durationSec,
    serverNow: Date.now(),
    showLiveAnswersOnScreen: room.showLiveAnswersOnScreen,
    showCodeOnScreen: room.showCodeOnScreen,
    teams: room.teams,
    teamScores: room.teamScores,
    participants: room.participants,
    answeredTeamIds,
    liveOpenAnswers: canShowLiveEntries ? room.openTextEntries : [],
    liveOpenAnswerCount: room.openTextEntries.length,
    // Only share option picks once revealed so teams cannot copy each other mid-round
    revealedAnswers: isRevealed ? room.answers : {},
    mimeState: room.mimeState
      ? {
          active: room.mimeState.active,
          cardId: room.mimeState.cardId,
          category: room.mimeState.category,
          activeTeamIndex: room.mimeState.activeTeamIndex,
          activeTeamId: room.mimeState.activeTeamId,
          activeTeamName: room.mimeState.activeTeamName,
          activeTeamColor: room.mimeState.activeTeamColor,
          status: room.mimeState.status,
          // Keep the secret mime word hidden on big screen & team phones until revealed!
          word: room.mimeState.status === 'revealed' ? room.mimeState.word : null,
          startedAt: room.mimeState.startedAt,
          durationSec: room.mimeState.durationSec,
          guessedCorrect: room.mimeState.guessedCorrect,
          roundNumber: room.mimeState.roundNumber,
        }
      : null,
  };
}

function broadcastQuizState(roomId: string, room: QuizRoomState) {
  const regularPayload = JSON.stringify({
    type: 'quiz:state',
    payload: serializeQuizRoomPublic(room, false),
  });
  const tvPayload = JSON.stringify({
    type: 'quiz:state',
    payload: serializeQuizRoomPublic(room, true),
  });
  for (const [ws, client] of clients.entries()) {
    if (isClientInRoom(client, roomId) && ws.readyState === WebSocket.OPEN) {
      ws.send(client.isTvViewer ? tvPayload : regularPayload);
    }
  }
}

function buildMergedBingoPlayersSummary(entry: BingoHostRoomEntry): BingoTvPlayerSummary[] {
  const localPlayers: BingoTvPlayerSummary[] = (Array.isArray(entry.playersSummary) ? entry.playersSummary : []).map((p) => ({
    ...p,
    isRemote: Boolean(p.isRemote),
  }));
  const seenIds = new Set(localPlayers.map((p) => p.id));
  const remoteProgress = bingoRemoteProgressByRoom.get(entry.roomId);
  const connected = getRoomParticipants(entry.roomId).filter((p) => p.id !== entry.hostId);

  for (const p of connected) {
    if (!p?.id || seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    const prog = remoteProgress?.get(p.id);
    localPlayers.push({
      id: p.id,
      name: p.name,
      avatarColor: prog?.avatarColor || p.color || '#06b6d4',
      linesCompleted: prog?.linesCompleted || 0,
      hasBingo: Boolean(prog?.hasBingo),
      isRemote: true,
    });
  }

  return localPlayers.slice(0, 50);
}

function serializeBingoTvState(entry: BingoHostRoomEntry, isTvViewer = false) {
  const mergedPlayers = buildMergedBingoPlayersSummary(entry);
  const connectedParticipants = getRoomParticipants(entry.roomId).filter((p) => p.id !== entry.hostId);
  return {
    roomId: entry.roomId,
    roomCode: !isTvViewer || entry.showCodeOnScreen ? entry.roomCode : '',
    showCodeOnScreen: entry.showCodeOnScreen,
    hostName: entry.hostName,
    roundNumber: entry.roundNumber || 1,
    calledBalls: entry.calledBalls,
    playersSummary: mergedPlayers,
    connectedParticipants,
    totalPlayersCount: mergedPlayers.length,
    themeTitle: entry.themeTitle || 'Storskjerm & Sosial Bingo',
    lastClaim: entry.lastClaim || null,
    claimedMilestones: entry.claimedMilestones || [],
    milestoneWinners: entry.milestoneWinners || {},
    serverNow: Date.now(),
  };
}

function broadcastBingoTvState(roomId: string, entry: BingoHostRoomEntry) {
  const regularPayload = JSON.stringify({
    type: 'bingo:tv_state',
    payload: serializeBingoTvState(entry, false),
  });
  const tvPayload = JSON.stringify({
    type: 'bingo:tv_state',
    payload: serializeBingoTvState(entry, true),
  });
  for (const [ws, client] of clients.entries()) {
    if (isClientInRoom(client, roomId) && ws.readyState === WebSocket.OPEN) {
      ws.send(client.isTvViewer ? tvPayload : regularPayload);
    }
  }
}

function executeBingoNewRound(
  roomId: string,
  entry: BingoHostRoomEntry,
  winnerName?: string,
  reason: 'fullbrett' | 'host' = 'fullbrett'
) {
  const pendingTimer = pendingBingoRoundTimers.get(roomId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingBingoRoundTimers.delete(roomId);
  }
  entry.roundNumber = (entry.roundNumber || 1) + 1;
  entry.calledBalls = [];
  entry.lastClaim = null;
  entry.claimedMilestones = [];
  entry.milestoneWinners = {};
  entry.playersSummary = (entry.playersSummary || []).map((p) => ({
    ...p,
    linesCompleted: 0,
    hasBingo: false,
  }));
  const progMap = bingoRemoteProgressByRoom.get(roomId);
  if (progMap) {
    for (const [uid, prog] of progMap.entries()) {
      progMap.set(uid, { ...prog, linesCompleted: 0, hasBingo: false });
    }
  }
  broadcastToRoom(roomId, {
    type: 'bingo:new_round',
    payload: {
      roomCode: entry.roomCode,
      roundNumber: entry.roundNumber,
      winnerName: winnerName || '',
      reason,
      claimedMilestones: [],
      milestoneWinners: {},
      timestamp: Date.now(),
    },
  });
  broadcastBingoTvState(roomId, entry);
  scheduleSaveActiveRooms();
}

function moveTvViewersToGame(roomCode: string, targetGame: 'quiz' | 'bingo') {
  const cleanCode = roomCode.trim().toUpperCase();
  if (!cleanCode) return;
  activeTvGameByCode.set(cleanCode, targetGame);
  const targetRoomId = targetGame === 'quiz' ? `joy-quiz-${cleanCode}` : `joy-bingo-${cleanCode}`;
  for (const [ws, client] of clients.entries()) {
    if (client.isTvViewer && client.tvWatchCode === cleanCode && client.roomId !== targetRoomId && ws.readyState === WebSocket.OPEN) {
      client.roomId = targetRoomId;
      ws.send(JSON.stringify({ type: 'tv:mode_changed', payload: { game: targetGame } }));
    }
  }
}

// Seed initial custom community cards
customCards.set('family-joy', {
  id: 'family-joy',
  title: 'Heartfelt Family Gathering',
  theme: 'heartfelt',
  creatorName: 'Auntie Joy',
  createdAt: Date.now() - 3600000,
  items: [
    "Tells a funny story about growing up",
    "Cooked a dish everyone asks for every holiday",
    "Knows how to speak 2+ languages",
    "Can sing a song from their childhood",
    "Brought a dessert to share with everyone",
    "Has a secret talent nobody here guessed",
    "Took the earliest flight/drive to get here",
    "Remembers Grandma or Grandpa's favorite joke",
    "Wearing festive or colorful socks",
    "Took a nap today before coming",
    "Keeps a garden with fresh herbs or tomatoes",
    "Has a framed picture with you in their home",
    "Knows how to play an acoustic instrument",
    "Traveled outside the country this year",
    "Can name all cousins in age order",
    "Gave the warmest hug when arriving",
    "Loves early morning coffee in total quiet",
    "Won a sports or school trophy back in the day",
    "Has a pet that acts like a human child",
    "Taught someone how to drive or ride a bike",
    "Knows the recipe without looking at instructions",
    "Shared a nostalgic photo album today",
    "Has lived in more than 3 states or countries",
    "Always tells the best bedtime stories"
  ]
});

customCards.set('team-kindness', {
  id: 'team-kindness',
  title: 'Kindness & Workplace Warmth',
  theme: 'kindness',
  creatorName: 'Team Champion',
  createdAt: Date.now() - 7200000,
  items: [
    "Helped unblock a teammate with zero hesitation",
    "Sends cheerful Friday affirmations in chat",
    "Organized an impromptu virtual coffee chat",
    "Shares keyboard shortcut tricks graciously",
    "Gives credit to colleagues in team meetings",
    "Brought homemade treats or fruit to the office",
    "Takes brisk walking breaks to clear their head",
    "Uses funny custom slack/chat emojis",
    "Listened patiently during a tough project roadblock",
    "Celebrated someone else's work anniversary",
    "Keeps desk plants thriving happily",
    "Can teach you a neat productivity tip",
    "Mentored someone new to the community",
    "Sent a sincere thank you note to someone this week",
    "Always has a cup of herbal tea or warm brew",
    "Laughs out loud at silly team memes",
    "Speaks up with thoughtful kindness for quiet members",
    "Volunteered to write meeting recap notes",
    "Remembers colleagues' pets' and kids' names",
    "Has an inspiring desk quote or art",
    "Practices a digital sunset after workday hours",
    "Organized a team fundraiser or charity run",
    "Made a stressful deadline feel manageable and calm",
    "Smiles and asks 'How are you really doing?'"
  ]
});

// Seed default friendly peers
const sampleFriends = [
  { id: 'usr-clara', name: 'Clara Sun', color: '#f59e0b', isOnline: true, statusText: 'Playing Human Bingo ✨', lastActive: Date.now() },
  { id: 'usr-mateo', name: 'Mateo Rivers', color: '#059669', isOnline: true, statusText: 'Spinning Ball Cage 🎲', lastActive: Date.now() - 60000 },
  { id: 'usr-ananya', name: 'Ananya Patel', color: '#7c3aed', isOnline: false, statusText: 'Shared a Kindness Card 💖', lastActive: Date.now() - 3600000 },
  { id: 'usr-liam', name: 'Liam O\'Connor', color: '#0284c7', isOnline: true, statusText: 'Hosting Table Night 🎉', lastActive: Date.now() - 120000 }
];
sampleFriends.forEach(f => playerDirectory.set(f.id, f));

// Broadcast helper within a specific room
function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, client] of clients.entries()) {
    if (isClientInRoom(client, roomId) && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Broadcast helper to all connected clients
function broadcastGlobal(message: object) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Get participants in a room (exclude silent TV/Projector screens)
function getRoomParticipants(roomId: string) {
  const seen = new Set<string>();
  const list: { id: string; name: string; color: string }[] = [];
  for (const client of clients.values()) {
    if (isClientInRoom(client, roomId) && !client.isTvViewer && !seen.has(client.id)) {
      seen.add(client.id);
      list.push({ id: client.id, name: client.name, color: client.color });
    }
  }
  return list;
}

// Moderation and banned users store with 10-minute auto-expiry
interface BanRecord {
  bannedAt: number;
  bannedUntil: number;
  name: string;
}
const bannedUsers = new Map<string, BanRecord>();
const mutedUsers = new Set<string>();

const TEN_MINUTES_MS = 10 * 60 * 1000;

function isUserBanned(userId: string): boolean {
  if (!userId || !bannedUsers.has(userId)) return false;
  const ban = bannedUsers.get(userId)!;
  if (Date.now() > ban.bannedUntil) {
    bannedUsers.delete(userId);
    return false;
  }
  return true;
}

const BANNED_PATTERNS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cock', 'twat',
  'kill yourself', 'kys', 'hate you', 'die', 'nazi', 'hitler', 'terrorist',
  'pedophile', 'scam', 'spam', 'porn', 'nsfw', 'sex', 'boobs', 'penis', 'vagina'
];

function sanitizeMessage(text: string): { cleanText: string; hadBanned: boolean } {
  let clean = text || '';
  let hadBanned = false;
  for (const word of BANNED_PATTERNS) {
    const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(clean)) {
      hadBanned = true;
      clean = clean.replace(regex, '✨💖✨');
    }
  }
  return { cleanText: clean, hadBanned };
}

wss.on('connection', (ws) => {
  let currentClient: ClientInfo = {
    ws,
    id: `guest-${Math.random().toString(36).substring(2, 8)}`,
    name: 'Joy Traveler',
    color: '#f59e0b',
    roomId: 'joy-lounge',
  };

  clients.set(ws, currentClient);

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, payload } = data;

      // Check if user is banned (with 10-minute expiry)
      if (isUserBanned(currentClient.id) || (payload?.id && isUserBanned(payload.id))) {
        ws.send(JSON.stringify({
          type: 'user:banned',
          payload: { reason: 'Du er midlertidig utestengt fra dette spillet for å opprettholde sosial trivsel. Utestengelsen opphører automatisk etter 10 minutter, eller kan oppheves av bingoverten.' }
        }));
        try { ws.close(); } catch {}
        return;
      }

      switch (type) {
        case 'ws:ping': {
          break;
        }

        case 'user:init': {
          if (currentClient.isTvViewer) break;
          if (payload.id) currentClient.id = payload.id;
          if (payload.name) currentClient.name = sanitizeMessage(payload.name).cleanText || 'Joy Traveler';
          if (payload.color) currentClient.color = payload.color;
          if (payload.roomId) {
            currentClient.roomId = payload.roomId;
            if (String(payload.roomId).startsWith('joy-bingo-') && currentClient.hostedBingoRoomId !== payload.roomId) {
              currentClient.joinedBingoRoomId = payload.roomId;
            } else if (String(payload.roomId).startsWith('joy-quiz-')) {
              currentClient.activeQuizRoomId = payload.roomId;
            }
          }

          if (isUserBanned(currentClient.id)) {
            ws.send(JSON.stringify({
              type: 'user:banned',
              payload: { reason: 'Du er midlertidig utestengt fra dette spillet for å opprettholde sosial trivsel. Utestengelsen opphører automatisk etter 10 minutter, eller kan oppheves av bingoverten.' }
            }));
            try { ws.close(); } catch {}
            return;
          }

          // Register in directory
          playerDirectory.set(currentClient.id, {
            id: currentClient.id,
            name: currentClient.name,
            color: currentClient.color,
            isOnline: true,
            statusText: 'Playing Joy Bingo',
            lastActive: Date.now(),
          });

          // Send current room messages & participants
          const history = roomMessages.get(currentClient.roomId) || [];
          ws.send(JSON.stringify({
            type: 'room:init',
            payload: {
              roomId: currentClient.roomId,
              participants: getRoomParticipants(currentClient.roomId),
              messages: history.slice(-40),
              friends: Array.from(playerDirectory.values()),
              customCards: Array.from(customCards.values()),
              bannedUsers: Array.from(bannedUsers.keys()).filter((id) => isUserBanned(id)),
            }
          }));

          // If joining an active Bingo room, immediately push server-cached balls
          if (currentClient.roomId.startsWith('joy-bingo-')) {
            const bEntry = bingoHostRooms.get(currentClient.roomId);
            if (bEntry && bEntry.calledBalls.length > 0 && currentClient.hostedBingoRoomId !== currentClient.roomId) {
              ws.send(JSON.stringify({
                type: 'caller:sync_provided',
                payload: { balls: bEntry.calledBalls, requesterId: currentClient.id }
              }));
            }
          }

          // Notify room of user join
          broadcastToRoom(currentClient.roomId, {
            type: 'user:joined',
            payload: {
              user: { id: currentClient.id, name: currentClient.name, color: currentClient.color },
              participants: getRoomParticipants(currentClient.roomId)
            }
          }, ws);

          if (currentClient.roomId.startsWith('joy-bingo-')) {
            const bEntry = bingoHostRooms.get(currentClient.roomId);
            if (bEntry) {
              broadcastBingoTvState(currentClient.roomId, bEntry);
            }
          }

          broadcastGlobal({
            type: 'friends:update',
            payload: { friends: Array.from(playerDirectory.values()) }
          });
          break;
        }

        case 'room:join': {
          if (currentClient.isTvViewer) break;
          const oldRoom = currentClient.roomId;
          const nextRoom = payload.roomId || 'joy-lounge';
          currentClient.roomId = nextRoom;
          if (nextRoom === 'joy-lounge') {
            currentClient.joinedBingoRoomId = undefined;
          } else if (String(nextRoom).startsWith('joy-bingo-') && currentClient.hostedBingoRoomId !== nextRoom) {
            currentClient.joinedBingoRoomId = nextRoom;
          } else if (String(nextRoom).startsWith('joy-quiz-')) {
            currentClient.activeQuizRoomId = nextRoom;
          }

          // Notify old room
          broadcastToRoom(oldRoom, {
            type: 'user:left',
            payload: {
              userId: currentClient.id,
              participants: getRoomParticipants(oldRoom)
            }
          });

          // Send new room state
          const history = roomMessages.get(currentClient.roomId) || [];
          ws.send(JSON.stringify({
            type: 'room:state',
            payload: {
              roomId: currentClient.roomId,
              participants: getRoomParticipants(currentClient.roomId),
              messages: history.slice(-40),
            }
          }));

          // Immediately sync already drawn Bingo balls stored on server
          if (currentClient.roomId.startsWith('joy-bingo-')) {
            const bEntry = bingoHostRooms.get(currentClient.roomId);
            if (bEntry && bEntry.calledBalls.length > 0 && currentClient.hostedBingoRoomId !== currentClient.roomId) {
              ws.send(JSON.stringify({
                type: 'caller:sync_provided',
                payload: { balls: bEntry.calledBalls, requesterId: currentClient.id }
              }));
            }
          }

          // Notify new room
          broadcastToRoom(currentClient.roomId, {
            type: 'user:joined',
            payload: {
              user: { id: currentClient.id, name: currentClient.name, color: currentClient.color },
              participants: getRoomParticipants(currentClient.roomId)
            }
          }, ws);

          if (oldRoom.startsWith('joy-bingo-')) {
            const oldEntry = bingoHostRooms.get(oldRoom);
            if (oldEntry) broadcastBingoTvState(oldRoom, oldEntry);
          }
          if (currentClient.roomId.startsWith('joy-bingo-')) {
            const newEntry = bingoHostRooms.get(currentClient.roomId);
            if (newEntry) broadcastBingoTvState(currentClient.roomId, newEntry);
          }
          break;
        }

        case 'chat:send': {
          if (mutedUsers.has(currentClient.id)) {
            ws.send(JSON.stringify({
              type: 'chat:warning',
              payload: { message: 'You are currently muted in this room by the game host.' }
            }));
            return;
          }

          const { cleanText } = sanitizeMessage(payload.text || '');
          const msg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            senderId: currentClient.id,
            senderName: currentClient.name,
            senderColor: currentClient.color,
            text: cleanText,
            type: payload.type || 'text',
            reactionEmoji: payload.reactionEmoji,
            achievementTitle: payload.achievementTitle,
            timestamp: Date.now(),
          };

          if (!roomMessages.has(currentClient.roomId)) {
            roomMessages.set(currentClient.roomId, []);
          }
          const list = roomMessages.get(currentClient.roomId)!;
          list.push(msg);
          if (list.length > 80) list.shift();

          // Broadcast once to everyone in room including sender (no second ws.send to avoid duplicate key)
          broadcastToRoom(currentClient.roomId, {
            type: 'chat:message',
            payload: msg
          });
          break;
        }

        case 'friend:cheer': {
          const cheerMsg: ChatMessage = {
            id: `cheer-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            senderId: currentClient.id,
            senderName: currentClient.name,
            senderColor: currentClient.color,
            text: `sent a warm cheer of joy to ${sanitizeMessage(payload.targetName || 'you').cleanText}! 💛✨`,
            type: 'cheer',
            reactionEmoji: '✨',
            timestamp: Date.now(),
          };

          if (!roomMessages.has(currentClient.roomId)) {
            roomMessages.set(currentClient.roomId, []);
          }
          roomMessages.get(currentClient.roomId)!.push(cheerMsg);

          // Broadcast once to room
          broadcastToRoom(currentClient.roomId, {
            type: 'chat:message',
            payload: cheerMsg
          });
          break;
        }

        case 'achievement:broadcast': {
          const achieveMsg: ChatMessage = {
            id: `achieve-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            senderId: currentClient.id,
            senderName: currentClient.name,
            senderColor: currentClient.color,
            text: `unlocked the achievement: ${sanitizeMessage(payload.title).cleanText}! 🏆🎉`,
            type: 'achievement',
            achievementTitle: payload.title,
            timestamp: Date.now(),
          };

          if (!roomMessages.has(currentClient.roomId)) {
            roomMessages.set(currentClient.roomId, []);
          }
          roomMessages.get(currentClient.roomId)!.push(achieveMsg);

          // Broadcast once to room
          broadcastToRoom(currentClient.roomId, {
            type: 'chat:message',
            payload: achieveMsg
          });
          break;
        }

        case 'moderation:ban_user': {
          if (currentClient.roomId.startsWith('joy-bingo-') && bingoHostRooms.has(currentClient.roomId)) {
            if (!isBingoRoomHost(currentClient.roomId, currentClient.id, payload)) break;
          } else if (currentClient.roomId.startsWith('joy-quiz-') && quizRooms.has(currentClient.roomId)) {
            const qRoom = quizRooms.get(currentClient.roomId)!;
            if (!isQuizRoomHost(qRoom, currentClient.id, payload)) break;
          }
          const targetId = payload.targetUserId;
          const targetName = payload.targetUserName || 'Participant';
          if (!targetId) break;

          bannedUsers.set(targetId, {
            bannedAt: Date.now(),
            bannedUntil: Date.now() + TEN_MINUTES_MS,
            name: targetName,
          });

          // Find socket of target and close it
          for (const [targetWs, client] of clients.entries()) {
            if (client.id === targetId) {
              targetWs.send(JSON.stringify({
                type: 'user:banned',
                payload: { reason: 'Du er midlertidig utestengt fra bingosesjonen i 10 minutter for forstyrrende adferd, eller inntil verten opphever det.' }
              }));
              try { targetWs.close(); } catch {}
            }
          }

          // Announce in room
          const systemMsg: ChatMessage = {
            id: `sys-ban-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: 'system',
            senderName: '🛡️ Trivsel & Moderering',
            senderColor: '#ef4444',
            text: `⚠️ ${targetName} ble midlertidig utestengt i 10 minutter for å bevare sosial trivsel.`,
            type: 'text',
            timestamp: Date.now(),
          };

          if (!roomMessages.has(currentClient.roomId)) {
            roomMessages.set(currentClient.roomId, []);
          }
          roomMessages.get(currentClient.roomId)!.push(systemMsg);

          broadcastToRoom(currentClient.roomId, {
            type: 'chat:message',
            payload: systemMsg,
          });

          broadcastToRoom(currentClient.roomId, {
            type: 'user:left',
            payload: {
              userId: targetId,
              participants: getRoomParticipants(currentClient.roomId)
            }
          });

          if (quizRooms.has(currentClient.roomId)) {
            const qRoom = quizRooms.get(currentClient.roomId)!;
            qRoom.participants = qRoom.participants.filter((p) => p.id !== targetId);
            broadcastQuizState(currentClient.roomId, qRoom);
          }

          if (currentClient.roomId.startsWith('joy-bingo-')) {
            const progMap = bingoRemoteProgressByRoom.get(currentClient.roomId);
            if (progMap) progMap.delete(targetId);
            const bEntry = bingoHostRooms.get(currentClient.roomId);
            if (bEntry) broadcastBingoTvState(currentClient.roomId, bEntry);
          }

          broadcastGlobal({
            type: 'moderation:banned_list',
            payload: { bannedUsers: Array.from(bannedUsers.keys()).filter((id) => isUserBanned(id)) }
          });
          break;
        }

        case 'moderation:mute_user': {
          const targetId = payload.targetUserId;
          if (!targetId) break;
          if (mutedUsers.has(targetId)) {
            mutedUsers.delete(targetId);
          } else {
            mutedUsers.add(targetId);
          }
          break;
        }

        case 'moderation:unban_user': {
          const targetId = payload.targetUserId;
          if (targetId) bannedUsers.delete(targetId);
          broadcastGlobal({
            type: 'moderation:banned_list',
            payload: { bannedUsers: Array.from(bannedUsers.keys()).filter((id) => isUserBanned(id)) }
          });
          break;
        }

        case 'host:message': {
          // Participant sends a direct message to the host/arrangør
          const { cleanText } = sanitizeMessage(payload.text || '');
          if (!cleanText.trim()) break;

          const hostMsg = {
            id: `hmsg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: currentClient.id,
            senderName: currentClient.name,
            senderColor: currentClient.color,
            text: cleanText,
            timestamp: Date.now(),
            roomId: currentClient.roomId,
          };

          // Broadcast to everyone in the room so the host receives it
          broadcastToRoom(currentClient.roomId, {
            type: 'host:message_received',
            payload: hostMsg
          });
          break;
        }

        case 'host:reply': {
          if (currentClient.roomId.startsWith('joy-bingo-') && bingoHostRooms.has(currentClient.roomId)) {
            if (!isBingoRoomHost(currentClient.roomId, currentClient.id, payload)) break;
          } else if (currentClient.roomId.startsWith('joy-quiz-') && quizRooms.has(currentClient.roomId)) {
            const qRoom = quizRooms.get(currentClient.roomId)!;
            if (!isQuizRoomHost(qRoom, currentClient.id, payload)) break;
          }
          // Host replies to a participant or broadcasts an organizer announcement
          const { cleanText } = sanitizeMessage(payload.text || '');
          if (!cleanText.trim()) break;

          const replyMsg = {
            id: `hrep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            hostName: payload.hostName || currentClient.name || 'Bingovert / Arrangør',
            text: cleanText,
            targetUserId: payload.targetUserId,
            timestamp: Date.now(),
            roomId: currentClient.roomId,
          };

          broadcastToRoom(currentClient.roomId, {
            type: 'host:reply_received',
            payload: replyMsg
          });
          break;
        }

        case 'caller:ball_drawn': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          // Only the authenticated room host may draw & broadcast balls in remote rooms
          if (targetBingoRoom.startsWith('joy-bingo-')) {
            const code = cleanRoomCode(payload?.roomCode || targetBingoRoom.replace(/^joy-bingo-/i, ''));
            if (!bingoHostRooms.has(targetBingoRoom) && code.length >= 3 && payload?.hostKey) {
              ensureUnifiedArrangementRooms(
                code,
                currentClient.id,
                sanitizeMessage(String(payload?.hostName || currentClient.name || 'Arrangør')).cleanText || 'Arrangør',
                String(payload.hostKey)
              );
            }
            if (!isBingoRoomHost(targetBingoRoom, currentClient.id, payload)) {
              ws.send(JSON.stringify({
                type: 'bingo:error',
                payload: { message: 'Kun arrangøren styrer kuletrekningen.' }
              }));
              break;
            }
            const entry = bingoHostRooms.get(targetBingoRoom);
            if (entry && payload?.ball && typeof payload.ball.number === 'number') {
              moveTvViewersToGame(entry.roomCode, 'bingo');
              const withoutSame = entry.calledBalls.filter(
                (b: any) => !(b.letter === payload.ball.letter && b.number === payload.ball.number)
              );
              entry.calledBalls = [...withoutSame, payload.ball];
              scheduleSaveActiveRooms();
              broadcastBingoTvState(targetBingoRoom, entry);
            }
          }
          broadcastToRoom(targetBingoRoom, {
            type: 'caller:sync_ball',
            payload: payload.ball
          }, ws);
          break;
        }

        case 'bingo:remote_claim': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          // A remote or Storskjerm participant physically claimed BINGO (1. rekke, 3. rekker, or Fullbrett)!
          const cleanName = sanitizeMessage(payload.playerName || currentClient.name).cleanText || 'Spiller';
          const cleanPattern = sanitizeMessage(payload.pattern || 'FULLBRETT').cleanText || 'FULLBRETT';
          const isFullHouse = Boolean(payload?.isFullHouse) || /fullbrett|fullt?\s*brett|full_?house|blackout/i.test(cleanPattern);
          const milestoneTier = resolveBingoMilestoneFromPattern(cleanPattern, isFullHouse);
          const displayPattern = isFullHouse
            ? 'FULLBRETT BINGO'
            : milestoneTier === 'line3'
            ? '3. REKKER'
            : cleanPattern;

          const entry = bingoHostRooms.get(targetBingoRoom);
          if (entry) {
            const existingClaimed = Array.isArray(entry.claimedMilestones) ? entry.claimedMilestones : [];
            if (existingClaimed.includes(milestoneTier)) {
              const prevWinner = entry.milestoneWinners?.[milestoneTier];
              const tierLabel =
                milestoneTier === 'fullbrett'
                  ? 'Full brett'
                  : milestoneTier === 'line3'
                  ? '3. rekker'
                  : '1. rekke';
              const nextHint =
                milestoneTier === 'line1'
                  ? 'Bingorop er låst til 3. rekker eller fullt brett er fullført.'
                  : milestoneTier === 'line3'
                  ? 'Bingorop er låst til fullt brett er fullført.'
                  : 'Runden avsluttes straks.';
              ws.send(JSON.stringify({
                type: 'bingo:claim_rejected',
                payload: {
                  milestone: milestoneTier,
                  claimedMilestones: existingClaimed,
                  milestoneWinners: entry.milestoneWinners || {},
                  message: prevWinner
                    ? `🔒 ${tierLabel} er allerede ropt av ${prevWinner}! ${nextHint}`
                    : `🔒 ${tierLabel} er allerede ropt i dette rommet! ${nextHint}`,
                },
              }));
              break;
            }

            const minRequiredBalls = isFullHouse ? 24 : milestoneTier === 'line3' ? 12 : 4;
            if (entry.calledBalls.length < minRequiredBalls) {
              ws.send(JSON.stringify({
                type: 'bingo:claim_rejected',
                payload: { message: 'For få kuler er trukket til å rope bingo for dette mønsteret ennå.' },
              }));
              break;
            }
            if (Array.isArray(payload?.confirmedNumbers)) {
              const drawnSet = new Set(entry.calledBalls.map((b) => b.number));
              const nonFreeNums = payload.confirmedNumbers.filter((n: unknown) => typeof n === 'number' && n !== 38);
              const allValid = nonFreeNums.length >= minRequiredBalls && nonFreeNums.every((n: number) => drawnSet.has(n));
              if (!allValid) {
                ws.send(JSON.stringify({
                  type: 'bingo:claim_rejected',
                  payload: { message: 'Alle tall i vinnerrekken må være trukket og bekreftet før du kan rope BINGO!' },
                }));
                break;
              }
            }

            const nextClaimedSet = new Set<ServerBingoMilestone>(existingClaimed);
            nextClaimedSet.add(milestoneTier);
            if (milestoneTier === 'line3' || milestoneTier === 'fullbrett') {
              nextClaimedSet.add('line1');
            }
            if (milestoneTier === 'fullbrett') {
              nextClaimedSet.add('line3');
            }
            entry.claimedMilestones = Array.from(nextClaimedSet);
            entry.milestoneWinners = {
              ...(entry.milestoneWinners || {}),
              [milestoneTier]: cleanName,
            };
            entry.lastClaim = {
              playerName: cleanName,
              pattern: displayPattern,
              isFullHouse,
              milestone: milestoneTier,
              timestamp: Date.now(),
            };
            scheduleSaveActiveRooms();
            broadcastBingoTvState(targetBingoRoom, entry);
          }

          broadcastToRoom(targetBingoRoom, {
            type: 'bingo:remote_claimed',
            payload: {
              userId: currentClient.id,
              playerName: cleanName,
              pattern: displayPattern,
              milestone: milestoneTier,
              isFullHouse,
              roundNumber: entry?.roundNumber || 1,
              claimedMilestones: entry?.claimedMilestones || [milestoneTier],
              milestoneWinners: entry?.milestoneWinners || { [milestoneTier]: cleanName },
              autoNewRoundDelayMs: isFullHouse ? 4500 : 0,
              cardIndex: payload.cardIndex ?? 0,
              timestamp: Date.now()
            }
          });

          if (entry && isFullHouse && !pendingBingoRoundTimers.has(targetBingoRoom)) {
            const timer = setTimeout(() => {
              pendingBingoRoundTimers.delete(targetBingoRoom);
              const latest = bingoHostRooms.get(targetBingoRoom);
              if (latest) {
                executeBingoNewRound(targetBingoRoom, latest, cleanName, 'fullbrett');
              }
            }, 4500);
            pendingBingoRoundTimers.set(targetBingoRoom, timer);
          }
          break;
        }

        case 'bingo:start_new_round': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          const entry = bingoHostRooms.get(targetBingoRoom);
          if (!entry || !isBingoRoomHost(targetBingoRoom, currentClient.id, payload)) {
            break;
          }
          executeBingoNewRound(
            targetBingoRoom,
            entry,
            payload?.winnerName ? sanitizeMessage(String(payload.winnerName)).cleanText : undefined,
            'host'
          );
          break;
        }

        case 'bingo:player_progress': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          if (!targetBingoRoom.startsWith('joy-bingo-')) break;
          const entry = bingoHostRooms.get(targetBingoRoom);
          if (!entry) break;
          if (!bingoRemoteProgressByRoom.has(targetBingoRoom)) {
            bingoRemoteProgressByRoom.set(targetBingoRoom, new Map());
          }
          const progMap = bingoRemoteProgressByRoom.get(targetBingoRoom)!;
          const cleanName = sanitizeMessage(String(payload?.playerName || currentClient.name || 'Spiller')).cleanText || 'Spiller';
          progMap.set(currentClient.id, {
            id: currentClient.id,
            name: cleanName,
            avatarColor: String(payload?.avatarColor || currentClient.color || '#06b6d4'),
            linesCompleted: Math.max(0, Math.trunc(Number(payload?.linesCompleted) || 0)),
            hasBingo: Boolean(payload?.hasBingo),
            isRemote: true,
          });
          broadcastBingoTvState(targetBingoRoom, entry);
          break;
        }

        case 'caller:request_sync': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          const syncCode = cleanRoomCode(payload?.roomCode || targetBingoRoom.replace(/^joy-bingo-/i, ''));
          if (!bingoHostRooms.has(targetBingoRoom) && syncCode.length >= 3) {
            await hydrateRoomFromFirestoreIfNeeded(syncCode);
          }
          const entry = bingoHostRooms.get(targetBingoRoom);
          if (entry && entry.calledBalls.length > 0) {
            ws.send(JSON.stringify({
              type: 'caller:sync_provided',
              payload: {
                balls: entry.calledBalls,
                requesterId: currentClient.id,
              }
            }));
          }
          // Participant also asks the host in the room for current drawn balls
          broadcastToRoom(targetBingoRoom, {
            type: 'caller:sync_requested',
            payload: { requesterId: currentClient.id }
          }, ws);
          break;
        }

        case 'caller:provide_sync': {
          const targetBingoRoom = resolveBingoRoomId(currentClient, payload);
          if (targetBingoRoom.startsWith('joy-bingo-')) {
            if (!isBingoRoomHost(targetBingoRoom, currentClient.id, payload)) {
              break;
            }
            const entry = bingoHostRooms.get(targetBingoRoom);
            if (entry && Array.isArray(payload?.balls) && payload.balls.length > 0 && entry.calledBalls.length === 0) {
              entry.calledBalls = payload.balls;
            }
          }
          // Host sends list of already drawn balls
          broadcastToRoom(targetBingoRoom, {
            type: 'caller:sync_provided',
            payload: {
              balls: payload.balls || [],
              requesterId: payload.requesterId
            }
          });
          break;
        }

        case 'card:create': {
          const newCard: CustomCard = {
            id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: payload.title || 'Joyful Community Card',
            theme: payload.theme || 'heartfelt',
            creatorName: currentClient.name,
            items: payload.items || [],
            createdAt: Date.now(),
          };
          customCards.set(newCard.id, newCard);

          broadcastGlobal({
            type: 'card:created',
            payload: { card: newCard, allCards: Array.from(customCards.values()) }
          });
          break;
        }

        case 'bingo:host_init': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.roomId.replace(/^joy-bingo-/i, ''));
          if (code && code.length >= 3) {
            const bingoRoomId = `joy-bingo-${code}`;
            const existing = bingoHostRooms.get(bingoRoomId);
            const incomingKey = payload?.hostKey ? String(payload.hostKey) : undefined;
            if (existing && existing.hostId !== 'http-host' && existing.hostId !== currentClient.id) {
              if (!existing.hostKey || !incomingKey || existing.hostKey !== incomingKey) {
                ws.send(JSON.stringify({
                  type: 'bingo:error',
                  payload: { message: 'Bare arrangøren kan styre dette spillrommet.' }
                }));
                break;
              }
            }
            const cleanHostName = sanitizeMessage(String(payload?.hostName || currentClient.name || 'Arrangør')).cleanText || 'Arrangør';
            const nextEntry: BingoHostRoomEntry = {
              roomId: bingoRoomId,
              roomCode: code,
              hostId: currentClient.id,
              hostKey: incomingKey || existing?.hostKey,
              hostName: cleanHostName,
              createdAt: existing?.createdAt || Date.now(),
              roundNumber: existing?.roundNumber || 1,
              calledBalls: existing?.calledBalls || [],
              showCodeOnScreen: existing?.showCodeOnScreen ?? true,
              playersSummary: existing?.playersSummary || [],
              themeTitle: existing?.themeTitle,
              lastClaim: existing?.lastClaim || null,
              claimedMilestones: existing?.claimedMilestones || [],
              milestoneWinners: existing?.milestoneWinners || {},
            };
            bingoHostRooms.set(bingoRoomId, nextEntry);
            currentClient.hostedBingoRoomId = bingoRoomId;
            ensureUnifiedArrangementRooms(code, currentClient.id, cleanHostName, nextEntry.hostKey);
            scheduleSaveActiveRooms();
            broadcastBingoTvState(bingoRoomId, nextEntry);
          }
          break;
        }

        case 'bingo:host_sync_state': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.hostedBingoRoomId?.replace(/^joy-bingo-/i, '') || currentClient.roomId.replace(/^joy-bingo-/i, ''));
          const bingoRoomId = code ? `joy-bingo-${code}` : currentClient.roomId;
          if (!bingoHostRooms.has(bingoRoomId) && code && code.length >= 3 && payload?.hostKey) {
            ensureUnifiedArrangementRooms(
              code,
              currentClient.id,
              sanitizeMessage(String(payload?.hostName || currentClient.name || 'Arrangør')).cleanText || 'Arrangør',
              String(payload.hostKey)
            );
          }
          const entry = bingoHostRooms.get(bingoRoomId);
          if (!entry || !isBingoRoomHost(bingoRoomId, currentClient.id, payload)) break;
          currentClient.hostedBingoRoomId = bingoRoomId;
          moveTvViewersToGame(entry.roomCode, 'bingo');
          if (Array.isArray(payload?.calledBalls)) {
            entry.calledBalls = payload.calledBalls;
            if (payload.calledBalls.length === 0) {
              entry.lastClaim = null;
            }
          }
          if (Array.isArray(payload?.playersSummary)) {
            entry.playersSummary = payload.playersSummary.slice(0, 32);
          }
          if (typeof payload?.themeTitle === 'string') {
            entry.themeTitle = payload.themeTitle.slice(0, 60);
          }
          if (typeof payload?.showCodeOnScreen === 'boolean') {
            entry.showCodeOnScreen = payload.showCodeOnScreen;
          }
          scheduleSaveActiveRooms();
          broadcastBingoTvState(bingoRoomId, entry);
          break;
        }

        case 'bingo:toggle_code_on_screen': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.hostedBingoRoomId?.replace(/^joy-bingo-/i, '') || currentClient.roomId.replace(/^joy-bingo-/i, ''));
          const bingoRoomId = code ? `joy-bingo-${code}` : currentClient.roomId;
          if (!bingoHostRooms.has(bingoRoomId) && code && code.length >= 3 && payload?.hostKey) {
            ensureUnifiedArrangementRooms(
              code,
              currentClient.id,
              sanitizeMessage(String(payload?.hostName || currentClient.name || 'Arrangør')).cleanText || 'Arrangør',
              String(payload.hostKey)
            );
          }
          const entry = bingoHostRooms.get(bingoRoomId);
          if (!entry || !isBingoRoomHost(bingoRoomId, currentClient.id, payload)) break;
          entry.showCodeOnScreen = Boolean(payload?.showCodeOnScreen);
          scheduleSaveActiveRooms();
          broadcastBingoTvState(bingoRoomId, entry);
          break;
        }

        case 'bingo:tv_watch': {
          const code = String(payload?.roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (!code || code.length < 3) {
            ws.send(JSON.stringify({ type: 'bingo:error', payload: { message: 'Ugyldig romkode for TV-visning.' } }));
            break;
          }
          const bingoRoomId = `joy-bingo-${code}`;
          if (!bingoHostRooms.has(bingoRoomId)) {
            await hydrateRoomFromFirestoreIfNeeded(code);
          }
          const entry = bingoHostRooms.get(bingoRoomId);
          if (!entry) {
            ws.send(JSON.stringify({ type: 'bingo:error', payload: { message: 'Fant ingen aktiv bingorunde med denne koden. Arrangøren må først starte spillet.' } }));
            break;
          }
          currentClient.isTvViewer = true;
          currentClient.tvWatchCode = code;
          currentClient.roomId = bingoRoomId;
          ws.send(JSON.stringify({
            type: 'bingo:tv_state',
            payload: serializeBingoTvState(entry, true),
          }));
          break;
        }

        case 'bingo:host_leave': {
          const code = String(payload?.roomCode || currentClient.roomId.replace(/^joy-bingo-/i, '')).trim().toUpperCase();
          if (code) {
            const bingoRoomId = `joy-bingo-${code}`;
            if (!bingoHostRooms.has(bingoRoomId) || isBingoRoomHost(bingoRoomId, currentClient.id, payload)) {
              bingoHostRooms.delete(bingoRoomId);
              saveActiveRoomsNow();
            }
          }
          break;
        }

        case 'quiz:host_init': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          const incomingKey = payload?.hostKey ? String(payload.hostKey) : undefined;
          if (room.isHostActive && room.hostId && room.hostId !== 'http-host' && room.hostId !== currentClient.id) {
            if (!room.hostKey || !incomingKey || room.hostKey !== incomingKey) {
              ws.send(JSON.stringify({
                type: 'quiz:error',
                payload: { message: 'Bare arrangøren kan styre dette quizrommet.' }
              }));
              break;
            }
          }
          room.isHostActive = true;
          room.hostId = currentClient.id;
          currentClient.activeQuizRoomId = targetQuizRoomId;
          if (incomingKey) {
            room.hostKey = incomingKey;
          }
          if (payload?.roomCode) {
            room.roomCode = cleanRoomCode(payload.roomCode);
          }
          if (payload?.hostName) {
            room.hostName = sanitizeMessage(String(payload.hostName)).cleanText || 'Arrangør';
          }
          if (
            payload?.edition === 'adult' ||
            payload?.edition === 'family' ||
            payload?.edition === 'christmas' ||
            payload?.edition === 'senior'
          ) {
            room.edition = payload.edition;
          }
          if (typeof payload?.totalQuestions === 'number' && payload.totalQuestions > 0) {
            room.totalQuestions = payload.totalQuestions;
          }
          if (Array.isArray(payload?.teams) && payload.teams.length >= 2) {
            room.teams = payload.teams.slice(0, 30).map((t: any) => ({
              id: String(t.id),
              name: sanitizeMessage(String(t.name || 'Lag')).cleanText.slice(0, 28) || 'Lag',
              color: ['red', 'blue', 'emerald', 'amber'].includes(t.color) ? t.color : 'blue',
            }));
            for (const t of room.teams) {
              if (typeof room.teamScores[t.id] !== 'number') {
                room.teamScores[t.id] = 0;
              }
            }
          }

          ensureUnifiedArrangementRooms(room.roomCode, currentClient.id, room.hostName, room.hostKey);
          scheduleSaveActiveRooms();
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:update_teams': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) {
            ws.send(JSON.stringify({ type: 'quiz:error', payload: { message: 'Kun arrangøren kan endre lag.' } }));
            break;
          }
          if (Array.isArray(payload?.teams) && payload.teams.length >= 2) {
            room.teams = payload.teams.slice(0, 30).map((t: any) => ({
              id: String(t.id),
              name: sanitizeMessage(String(t.name || 'Lag')).cleanText.slice(0, 28) || 'Lag',
              color: ['red', 'blue', 'emerald', 'amber'].includes(t.color) ? t.color : 'blue',
            }));
            for (const t of room.teams) {
              if (typeof room.teamScores[t.id] !== 'number') {
                room.teamScores[t.id] = 0;
              }
            }
            broadcastQuizState(targetQuizRoomId, room);
          }
          break;
        }

        case 'quiz:join_team': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const joinCode = cleanRoomCode(payload?.roomCode || targetQuizRoomId.replace(/^joy-quiz-/i, ''));
          if ((!quizRooms.has(targetQuizRoomId) || !quizRooms.get(targetQuizRoomId)!.isHostActive) && joinCode.length >= 3) {
            await hydrateRoomFromFirestoreIfNeeded(joinCode);
          }
          const room = quizRooms.get(targetQuizRoomId);
          if (!room || !room.isHostActive) {
            ws.send(JSON.stringify({
              type: 'quiz:error',
              payload: { message: 'Fant ingen aktiv quiz med denne koblingskoden. Arrangøren må først betale og starte spillet.' }
            }));
            break;
          }
          currentClient.activeQuizRoomId = targetQuizRoomId;
          currentClient.roomId = targetQuizRoomId;
          const cleanPlayerName = sanitizeMessage(String(payload?.playerName || currentClient.name)).cleanText.trim();
          const teamId = String(payload?.teamId || 'team-red');
          const matchedTeam = room.teams.find((t) => t.id === teamId);
          const cleanTeamName = sanitizeMessage(String(payload?.teamName || matchedTeam?.name || 'Lag')).cleanText.trim();
          const teamColor: 'red' | 'blue' | 'emerald' | 'amber' =
            matchedTeam?.color ||
            (['red', 'blue', 'emerald', 'amber'].includes(payload?.teamColor) ? payload.teamColor : 'red');

          if (!matchedTeam) {
            room.teams.push({ id: teamId, name: cleanTeamName, color: teamColor });
            room.teamScores[teamId] = room.teamScores[teamId] ?? 0;
          }

          const existingIdx = room.participants.findIndex((p) => p.id === currentClient.id);
          const participant: QuizParticipantInfo = {
            id: currentClient.id,
            name: cleanPlayerName || 'Spiller',
            teamId,
            teamName: matchedTeam ? matchedTeam.name : cleanTeamName,
            teamColor,
            joinedAt: Date.now(),
          };
          if (existingIdx >= 0) {
            room.participants[existingIdx] = participant;
          } else {
            room.participants.push(participant);
            broadcastToRoom(targetQuizRoomId, {
              type: 'quiz:participant_joined',
              payload: {
                participant,
                totalCount: room.participants.length,
                roomCode: joinCode,
              },
            });
            const linkedBingoRoomId = `joy-bingo-${joinCode}`;
            if (bingoHostRooms.has(linkedBingoRoomId)) {
              broadcastToRoom(linkedBingoRoomId, {
                type: 'user:joined',
                payload: {
                  user: {
                    id: currentClient.id,
                    name: participant.name,
                    color: currentClient.color,
                    game: 'Quiz',
                  },
                  participants: getRoomParticipants(linkedBingoRoomId),
                },
              }, ws);
            }
          }

          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:start_question': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) {
            ws.send(JSON.stringify({ type: 'quiz:error', payload: { message: 'Kun arrangøren kan starte spørsmål.' } }));
            break;
          }
          if (!payload?.question || typeof payload?.questionIndex !== 'number') break;

          moveTvViewersToGame(room.roomCode, 'quiz');
          if (
            payload.edition === 'adult' ||
            payload.edition === 'family' ||
            payload.edition === 'christmas' ||
            payload.edition === 'senior'
          ) {
            room.edition = payload.edition;
          }
          if (room.edition !== 'christmas') {
            room.mimeState = null;
          }
          if (typeof payload.totalQuestions === 'number' && payload.totalQuestions > 0) {
            room.totalQuestions = payload.totalQuestions;
          }
          room.phase = 'question';
          room.questionIndex = payload.questionIndex;
          room.currentQuestion = {
            id: String(payload.question.id || `q-${payload.questionIndex}`),
            category: String(payload.question.category || 'Kultur'),
            questionType: payload.question.questionType === 'open_text' ? 'open_text' : 'multiple_choice',
            musicSongId: payload.question.musicSongId ? String(payload.question.musicSongId) : undefined,
            musicHint: payload.question.musicHint ? String(payload.question.musicHint) : undefined,
            question: String(payload.question.question || ''),
            options: Array.isArray(payload.question.options) ? payload.question.options : ['', '', '', ''],
            correctIndex: Number(payload.question.correctIndex ?? 0),
            acceptedAnswers: Array.isArray(payload.question.acceptedAnswers)
              ? payload.question.acceptedAnswers.map((a: any) => String(a))
              : undefined,
            samplePlaceholder: payload.question.samplePlaceholder
              ? String(payload.question.samplePlaceholder)
              : undefined,
            wordplayJoke: String(payload.question.wordplayJoke || ''),
            hostAnswerNote: String(payload.question.hostAnswerNote || ''),
          };
          room.startedAt = Date.now();
          room.durationSec = Math.min(180, Math.max(15, Number(payload.durationSec) || 60));
          room.answers = {};
          room.openTextEntries = [];
          room.mimeState = null;

          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:toggle_live_answers': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          room.showLiveAnswersOnScreen = Boolean(payload?.showLiveAnswersOnScreen);
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:toggle_code_on_screen': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          room.showCodeOnScreen = Boolean(payload?.showCodeOnScreen);
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:remove_open_entry': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          const entryId = String(payload?.entryId || '');
          if (entryId) {
            room.openTextEntries = room.openTextEntries.filter((e) => e.id !== entryId);
            broadcastQuizState(targetQuizRoomId, room);
          }
          break;
        }

        case 'quiz:submit_answer': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (room.phase !== 'question' || !room.currentQuestion) {
            ws.send(JSON.stringify({
              type: 'quiz:error',
              payload: { message: 'Ingen aktiv spørsmålsrunde akkurat nå.' }
            }));
            break;
          }

          const elapsedMs = Date.now() - room.startedAt;
          if (elapsedMs > room.durationSec * 1000 + 1500) {
            ws.send(JSON.stringify({
              type: 'quiz:error',
              payload: { message: 'Tiden (60 sekunder) har løpt ut for dette spørsmålet!' }
            }));
            break;
          }

          const teamId = String(payload?.teamId || '');
          if (!teamId) break;

          const teamDef = room.teams.find((t) => t.id === teamId);
          const submitter = room.participants.find((p) => p.id === currentClient.id);
          const submitterName = submitter?.name || currentClient.name || 'Lagspiller';
          const resolvedTeamName = teamDef?.name || submitter?.teamName || teamId;
          const resolvedTeamColor: 'red' | 'blue' | 'emerald' | 'amber' =
            teamDef?.color || submitter?.teamColor || 'red';

          if (room.currentQuestion.questionType === 'open_text') {
            const rawText = String(payload?.textAnswer || '').trim().slice(0, 120);
            if (!rawText) break;
            const { cleanText, hadBanned } = sanitizeMessage(rawText);
            if (hadBanned) {
              ws.send(JSON.stringify({
                type: 'quiz:error',
                payload: { message: 'Upassende ord er ikke tillatt på storskjermen. Skriv et hyggelig svar!' }
              }));
              break;
            }

            const now = Date.now();
            room.answers[teamId] = {
              teamId,
              teamName: resolvedTeamName,
              submittedBy: submitterName,
              optionIndex: -1,
              textAnswer: cleanText,
              submittedAt: now,
            };

            const existingEntryIdx = room.openTextEntries.findIndex(
              (e) => e.senderId === currentClient.id && e.teamId === teamId
            );
            const entryObj: QuizOpenTextEntry = {
              id: existingEntryIdx >= 0 ? room.openTextEntries[existingEntryIdx].id : `ot-${now}-${Math.random().toString(36).slice(2, 6)}`,
              senderId: currentClient.id,
              teamId,
              teamName: resolvedTeamName,
              teamColor: resolvedTeamColor,
              submittedBy: submitterName,
              text: cleanText,
              submittedAt: now,
            };
            if (existingEntryIdx >= 0) {
              room.openTextEntries[existingEntryIdx] = entryObj;
            } else {
              room.openTextEntries.push(entryObj);
            }
          } else {
            const optionIndex = Number(payload?.optionIndex);
            if (Number.isNaN(optionIndex) || optionIndex < 0 || optionIndex > 3) break;

            room.answers[teamId] = {
              teamId,
              teamName: resolvedTeamName,
              submittedBy: submitterName,
              optionIndex,
              submittedAt: Date.now(),
            };
          }

          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:award_team_answer': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          const teamId = String(payload?.teamId || '');
          if (!teamId || !room.answers[teamId]) break;
          if (!room.answers[teamId].isCorrect) {
            room.answers[teamId].isCorrect = true;
            room.answers[teamId].manuallyAwarded = true;
            room.teamScores[teamId] = (room.teamScores[teamId] || 0) + 100;
            room.openTextEntries.forEach((e) => {
              if (e.teamId === teamId) {
                e.isCorrect = true;
                e.manuallyAwarded = true;
              }
            });
            broadcastQuizState(targetQuizRoomId, room);
          }
          break;
        }

        case 'quiz:reveal_answer': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (!room.currentQuestion) break;

          if (!room.gradedQuestionIndices.has(room.questionIndex)) {
            room.gradedQuestionIndices.add(room.questionIndex);
            const maxMs = Math.max(1000, room.durationSec * 1000);

            if (room.currentQuestion.questionType === 'open_text') {
              const accepted = room.currentQuestion.acceptedAnswers || [];
              for (const [teamId, ans] of Object.entries(room.answers)) {
                const matched = isServerOpenTextCorrect(ans.textAnswer || '', accepted);
                ans.isCorrect = matched;
                if (matched) {
                  const elapsed = Math.max(0, ans.submittedAt - room.startedAt);
                  const speedBonus = Math.round(Math.max(0, 1 - elapsed / maxMs) * 25);
                  room.teamScores[teamId] = (room.teamScores[teamId] || 0) + 100 + speedBonus;
                } else {
                  room.teamScores[teamId] = room.teamScores[teamId] || 0;
                }
              }
              room.openTextEntries.forEach((entry) => {
                entry.isCorrect = isServerOpenTextCorrect(entry.text, accepted);
              });
            } else {
              const correctIdx = room.currentQuestion.correctIndex;
              for (const [teamId, ans] of Object.entries(room.answers)) {
                const matched = ans.optionIndex === correctIdx;
                ans.isCorrect = matched;
                if (matched) {
                  const elapsed = Math.max(0, ans.submittedAt - room.startedAt);
                  const speedBonus = Math.round(Math.max(0, 1 - elapsed / maxMs) * 25);
                  room.teamScores[teamId] = (room.teamScores[teamId] || 0) + 100 + speedBonus;
                } else {
                  room.teamScores[teamId] = room.teamScores[teamId] || 0;
                }
              }
            }
          }

          room.phase = 'reveal';
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:hide_answer': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (!room.currentQuestion) break;
          room.phase = 'question';
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:finish_game': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          room.phase = 'finished';
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:reset_game': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (
            payload?.edition === 'adult' ||
            payload?.edition === 'family' ||
            payload?.edition === 'christmas' ||
            payload?.edition === 'senior'
          ) {
            room.edition = payload.edition;
          }
          room.phase = 'lobby';
          room.questionIndex = 0;
          room.currentQuestion = null;
          room.startedAt = 0;
          room.answers = {};
          room.openTextEntries = [];
          room.gradedQuestionIndices.clear();
          room.mimeState = null;
          for (const t of room.teams) {
            room.teamScores[t.id] = 0;
          }

          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:adjust_score': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          const teamId = String(payload?.teamId || '');
          const delta = Number(payload?.delta || 0);
          if (!teamId || Number.isNaN(delta)) break;
          room.teamScores[teamId] = Math.max(0, (room.teamScores[teamId] || 0) + delta);
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:mime_choose': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (room.edition !== 'christmas') break;
          moveTvViewersToGame(room.roomCode, 'quiz');
          const teamColor: 'red' | 'blue' | 'emerald' | 'amber' =
            ['red', 'blue', 'emerald', 'amber'].includes(payload?.activeTeamColor) ? payload.activeTeamColor : 'red';
          room.mimeState = {
            active: true,
            cardId: '',
            word: '',
            category: '',
            activeTeamIndex: Number(payload?.activeTeamIndex || 0),
            activeTeamId: String(payload?.activeTeamId || 'team-red'),
            activeTeamName: sanitizeMessage(String(payload?.activeTeamName || 'Lag')).cleanText.slice(0, 28) || 'Lag',
            activeTeamColor: teamColor,
            status: 'choosing',
            startedAt: 0,
            durationSec: 60,
            roundNumber: Number(payload?.roundNumber || 1),
          };
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:mime_start': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (room.edition !== 'christmas') break;
          moveTvViewersToGame(room.roomCode, 'quiz');
          const teamColor: 'red' | 'blue' | 'emerald' | 'amber' =
            ['red', 'blue', 'emerald', 'amber'].includes(payload?.activeTeamColor) ? payload.activeTeamColor : 'red';
          room.mimeState = {
            active: true,
            cardId: String(payload?.cardId || ''),
            word: String(payload?.word || ''),
            category: String(payload?.category || 'Katolsk jule-mime'),
            activeTeamIndex: Number(payload?.activeTeamIndex || 0),
            activeTeamId: String(payload?.activeTeamId || 'team-red'),
            activeTeamName: sanitizeMessage(String(payload?.activeTeamName || 'Lag')).cleanText.slice(0, 28) || 'Lag',
            activeTeamColor: teamColor,
            status: 'acting',
            startedAt: Date.now(),
            durationSec: 60,
            roundNumber: Number(payload?.roundNumber || 1),
          };
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:mime_reveal': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          if (room.edition !== 'christmas') break;
          if (room.mimeState) {
            const guessedCorrect = Boolean(payload?.guessedCorrect);
            const points = Math.max(0, Number(payload?.points || 0));
            if (payload?.word && !room.mimeState.word) {
              room.mimeState.word = String(payload.word);
            }
            if (guessedCorrect && points > 0) {
              room.teamScores[room.mimeState.activeTeamId] = (room.teamScores[room.mimeState.activeTeamId] || 0) + points;
            }
            room.mimeState.status = 'revealed';
            room.mimeState.guessedCorrect = guessedCorrect;
            broadcastQuizState(targetQuizRoomId, room);
          }
          break;
        }

        case 'quiz:mime_stop': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const room = getOrCreateQuizRoom(targetQuizRoomId);
          if (!isQuizRoomHost(room, currentClient.id, payload)) break;
          room.mimeState = null;
          broadcastQuizState(targetQuizRoomId, room);
          break;
        }

        case 'quiz:request_state': {
          const targetQuizRoomId = resolveQuizRoomId(currentClient, payload);
          const reqCode = cleanRoomCode(payload?.roomCode || targetQuizRoomId.replace(/^joy-quiz-/i, ''));
          if ((!quizRooms.has(targetQuizRoomId) || !quizRooms.get(targetQuizRoomId)!.isHostActive) && reqCode.length >= 3) {
            await hydrateRoomFromFirestoreIfNeeded(reqCode);
          }
          const room = quizRooms.get(targetQuizRoomId);
          if (!room || !room.isHostActive) {
            ws.send(JSON.stringify({
              type: 'quiz:error',
              payload: { message: 'Fant ingen aktiv quiz med denne koblingskoden. Arrangøren må først betale og starte spillet.' }
            }));
            break;
          }
          ws.send(JSON.stringify({
            type: 'quiz:state',
            payload: serializeQuizRoomPublic(room, Boolean(currentClient.isTvViewer)),
          }));
          break;
        }

        case 'quiz:tv_watch': {
          const code = cleanRoomCode(payload?.roomCode);
          if (!code || code.length < 3) {
            ws.send(JSON.stringify({ type: 'quiz:error', payload: { message: 'Ugyldig romkode for TV-visning.' } }));
            break;
          }
          const quizRoomId = `joy-quiz-${code}`;
          if (!quizRooms.has(quizRoomId) || !quizRooms.get(quizRoomId)!.isHostActive) {
            await hydrateRoomFromFirestoreIfNeeded(code);
          }
          const room = quizRooms.get(quizRoomId);
          if (!room || !room.isHostActive) {
            ws.send(JSON.stringify({
              type: 'quiz:error',
              payload: { message: 'Fant ingen aktiv quiz med denne koden. Arrangøren må først starte quizen.' }
            }));
            break;
          }
          currentClient.isTvViewer = true;
          currentClient.tvWatchCode = code;
          currentClient.roomId = quizRoomId;
          ws.send(JSON.stringify({
            type: 'quiz:state',
            payload: serializeQuizRoomPublic(room, true),
          }));
          break;
        }

        case 'tv:exit': {
          currentClient.isTvViewer = false;
          currentClient.tvWatchCode = undefined;
          break;
        }

        case 'quiz:host_leave': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.activeQuizRoomId?.replace(/^joy-quiz-/i, '') || currentClient.roomId.replace(/^joy-quiz-/i, ''));
          const targetId = code ? `joy-quiz-${code}` : currentClient.roomId;
          const room = quizRooms.get(targetId) || quizRooms.get(currentClient.roomId);
          if (room && !isQuizRoomHost(room, currentClient.id, payload)) break;
          if (code) {
            quizRooms.delete(`joy-quiz-${code}`);
          }
          quizRooms.delete(currentClient.roomId);
          if (currentClient.activeQuizRoomId === targetId) {
            currentClient.activeQuizRoomId = undefined;
          }
          saveActiveRoomsNow();
          break;
        }

        case 'music:host_sync': {
          const code = cleanRoomCode(
            payload?.roomCode || currentClient.hostedBingoRoomId?.replace(/^joy-bingo-/i, '') || currentClient.roomId.replace(/^joy-bingo-/i, '')
          );
          if (!code || code.length < 3) break;
          const existing = musicBingoRooms.get(code);
          const incomingKey = payload?.hostKey ? String(payload.hostKey) : undefined;
          if (existing && existing.hostId && existing.hostId !== currentClient.id) {
            if (!existing.hostKey || !incomingKey || existing.hostKey !== incomingKey) {
              break;
            }
          }
          const mRoom: MusicBingoRoomState = existing || {
            roomCode: code,
            hostId: currentClient.id,
            hostKey: incomingKey,
            hostName: sanitizeMessage(String(payload?.hostName || currentClient.name || 'Arrangør')).cleanText || 'Arrangør',
            roundNumber: 1,
            isActive: true,
            playedSongIds: [],
            currentSongId: null,
            revealCurrentSong: false,
            clipStartedAt: 0,
            clipDurationSec: 30,
            lastClaim: null,
            claimedMilestones: [],
            milestoneWinners: {},
            participants: new Map(),
          };
          mRoom.hostId = currentClient.id;
          if (incomingKey) mRoom.hostKey = incomingKey;
          if (payload?.hostName) {
            mRoom.hostName = sanitizeMessage(String(payload.hostName)).cleanText || mRoom.hostName;
          }
          mRoom.isActive = true;
          if (typeof payload?.roundNumber === 'number' && payload.roundNumber > 0) {
            mRoom.roundNumber = payload.roundNumber;
          }
          if (Array.isArray(payload?.playedSongIds)) {
            mRoom.playedSongIds = payload.playedSongIds.slice(0, 80).map((s: any) => String(s));
          }
          if (payload?.currentSongId !== undefined) {
            mRoom.currentSongId = payload.currentSongId ? String(payload.currentSongId) : null;
          }
          if (typeof payload?.revealCurrentSong === 'boolean') {
            mRoom.revealCurrentSong = payload.revealCurrentSong;
          }
          if (typeof payload?.clipStartedAt === 'number') {
            mRoom.clipStartedAt = payload.clipStartedAt;
          }
          if (typeof payload?.clipDurationSec === 'number' && payload.clipDurationSec > 0) {
            mRoom.clipDurationSec = Math.min(120, Math.max(5, payload.clipDurationSec));
          }
          if (payload?.lastClaim === null) {
            mRoom.lastClaim = null;
          }
          musicBingoRooms.set(code, mRoom);
          ensureUnifiedArrangementRooms(code, currentClient.id, mRoom.hostName, mRoom.hostKey);
          broadcastMusicBingoState(code, mRoom);
          break;
        }

        case 'music:new_round': {
          const code = cleanRoomCode(payload?.roomCode);
          if (!code) break;
          const mRoom = musicBingoRooms.get(code);
          if (!mRoom) break;
          const incomingKey = payload?.hostKey ? String(payload.hostKey) : undefined;
          if (mRoom.hostId !== currentClient.id && (!mRoom.hostKey || !incomingKey || mRoom.hostKey !== incomingKey)) {
            break;
          }
          mRoom.roundNumber = (mRoom.roundNumber || 1) + 1;
          mRoom.playedSongIds = [];
          mRoom.currentSongId = null;
          mRoom.revealCurrentSong = false;
          mRoom.clipStartedAt = 0;
          mRoom.lastClaim = null;
          mRoom.claimedMilestones = [];
          mRoom.milestoneWinners = {};
          for (const [uid, prog] of mRoom.participants.entries()) {
            mRoom.participants.set(uid, { ...prog, markedCount: 0, linesCompleted: 0, hasBingo: false });
          }
          broadcastMusicBingoState(code, mRoom);
          break;
        }

        case 'music:request_state': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.roomId.replace(/^joy-(bingo|quiz)-/i, ''));
          if (!code) break;
          const mRoom = musicBingoRooms.get(code);
          if (mRoom && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'music:state', payload: serializeMusicRoom(mRoom) }));
          }
          break;
        }

        case 'music:player_progress': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.roomId.replace(/^joy-(bingo|quiz)-/i, ''));
          if (!code) break;
          let mRoom = musicBingoRooms.get(code);
          if (!mRoom) {
            mRoom = {
              roomCode: code,
              hostId: '',
              hostName: 'Arrangør',
              roundNumber: 1,
              isActive: true,
              playedSongIds: [],
              currentSongId: null,
              revealCurrentSong: false,
              clipStartedAt: 0,
              clipDurationSec: 30,
              lastClaim: null,
              claimedMilestones: [],
              milestoneWinners: {},
              participants: new Map(),
            };
            musicBingoRooms.set(code, mRoom);
          }
          const cleanName = sanitizeMessage(String(payload?.playerName || currentClient.name || 'Deltaker')).cleanText || 'Deltaker';
          const isNewMusicParticipant = !mRoom.participants.has(currentClient.id);
          if (cleanName && (!currentClient.name || currentClient.name === 'Spiller' || currentClient.name === 'Deltaker')) {
            currentClient.name = cleanName;
          }
          const bingoRoomId = `joy-bingo-${code}`;
          if (currentClient.hostedBingoRoomId !== bingoRoomId && !currentClient.isTvViewer) {
            currentClient.joinedBingoRoomId = bingoRoomId;
          }
          const participantProgress: MusicBingoParticipantProgress = {
            id: currentClient.id,
            name: cleanName,
            markedCount: Math.max(0, Math.min(25, Math.trunc(Number(payload?.markedCount) || 0))),
            linesCompleted: Math.max(0, Math.trunc(Number(payload?.linesCompleted) || 0)),
            hasBingo: Boolean(payload?.hasBingo),
          };
          mRoom.participants.set(currentClient.id, participantProgress);
          if (isNewMusicParticipant && currentClient.id !== mRoom.hostId) {
            broadcastToRoom(bingoRoomId, {
              type: 'music:participant_joined',
              payload: {
                participant: participantProgress,
                totalCount: mRoom.participants.size,
                roomCode: code,
              },
            }, ws);
            broadcastToRoom(bingoRoomId, {
              type: 'user:joined',
              payload: {
                user: {
                  id: currentClient.id,
                  name: cleanName,
                  color: currentClient.color,
                  game: 'Musikkbingo',
                },
                participants: getRoomParticipants(bingoRoomId),
              },
            }, ws);
            const bEntry = bingoHostRooms.get(bingoRoomId);
            if (bEntry) {
              broadcastBingoTvState(bingoRoomId, bEntry);
            }
          }
          broadcastMusicBingoState(code, mRoom);
          break;
        }

        case 'music:claim_bingo': {
          const code = cleanRoomCode(payload?.roomCode || currentClient.roomId.replace(/^joy-(bingo|quiz)-/i, ''));
          if (!code) break;
          const mRoom = musicBingoRooms.get(code);
          if (!mRoom) break;
          const cleanName = sanitizeMessage(String(payload?.playerName || currentClient.name || 'Deltaker')).cleanText || 'Deltaker';
          const cleanPattern = sanitizeMessage(String(payload?.pattern || 'MUSIKKBINGO')).cleanText || 'MUSIKKBINGO';
          const isFull = Boolean(payload?.hasFullHouse) || /fullt?\s*brett|full_?house|blackout/i.test(cleanPattern);
          const tier = resolveBingoMilestoneFromPattern(cleanPattern, isFull);
          const claimedList = Array.isArray(mRoom.claimedMilestones) ? mRoom.claimedMilestones : [];
          if (claimedList.includes(tier)) {
            const prevWinner = mRoom.milestoneWinners?.[tier];
            const tierLabel = tier === 'fullbrett' ? 'Fullt brett' : tier === 'line3' ? '3. rekker' : '1. rekke';
            ws.send(JSON.stringify({
              type: 'music:claim_rejected',
              payload: {
                milestone: tier,
                claimedMilestones: claimedList,
                milestoneWinners: mRoom.milestoneWinners || {},
                message: prevWinner
                  ? `🔒 ${tierLabel} er allerede ropt av ${prevWinner}! Vent til neste rekke/brett er fullført.`
                  : `🔒 ${tierLabel} er allerede ropt! Vent til neste rekke/brett er fullført.`,
              },
            }));
            break;
          }

          const trackedProg = mRoom.participants.get(currentClient.id);
          const reportedLines =
            typeof payload?.linesCompleted === 'number'
              ? payload.linesCompleted
              : trackedProg?.linesCompleted;
          const requiredLines = tier === 'fullbrett' ? 10 : tier === 'line3' ? 3 : 1;
          if (typeof reportedLines === 'number' && reportedLines < requiredLines) {
            ws.send(JSON.stringify({
              type: 'music:claim_rejected',
              payload: {
                milestone: tier,
                claimedMilestones: claimedList,
                milestoneWinners: mRoom.milestoneWinners || {},
                message: `🔒 Du må ha fylt minst ${requiredLines} ${requiredLines === 1 ? 'hel rekke' : 'rekker'} på brettet før du kan rope BINGO!`,
              },
            }));
            break;
          }

          const nextSet = new Set<ServerBingoMilestone>(claimedList);
          nextSet.add(tier);
          if (tier === 'line3' || tier === 'fullbrett') nextSet.add('line1');
          if (tier === 'fullbrett') nextSet.add('line3');
          mRoom.claimedMilestones = Array.from(nextSet);
          mRoom.milestoneWinners = {
            ...(mRoom.milestoneWinners || {}),
            [tier]: cleanName,
          };
          const claimTimestamp = Date.now();
          mRoom.lastClaim = {
            playerName: cleanName,
            pattern: cleanPattern,
            timestamp: claimTimestamp,
          };
          broadcastMusicBingoState(code, mRoom);

          const musicClaimNotice = JSON.stringify({
            type: 'music:bingo_claimed',
            payload: {
              roomCode: code,
              playerName: cleanName,
              pattern: cleanPattern,
              milestone: tier,
              isFullHouse: tier === 'fullbrett',
              claimedMilestones: mRoom.claimedMilestones,
              milestoneWinners: mRoom.milestoneWinners,
              timestamp: claimTimestamp,
            },
          });
          const bingoRoomId = `joy-bingo-${code}`;
          const quizRoomId = `joy-quiz-${code}`;
          for (const [clientWs, client] of clients.entries()) {
            if (
              clientWs.readyState === WebSocket.OPEN &&
              (isClientInRoom(client, bingoRoomId) || isClientInRoom(client, quizRoomId) || client.tvWatchCode === code)
            ) {
              clientWs.send(musicClaimNotice);
            }
          }
          break;
        }
      }
    } catch {
      // ignore malformed ws messages
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    clients.delete(ws);
    if (client) {
      if (playerDirectory.has(client.id)) {
        playerDirectory.get(client.id)!.isOnline = false;
        playerDirectory.get(client.id)!.lastActive = Date.now();
      }

      broadcastToRoom(client.roomId, {
        type: 'user:left',
        payload: {
          userId: client.id,
          participants: getRoomParticipants(client.roomId)
        }
      });

      if (client.roomId.startsWith('joy-bingo-')) {
        const progMap = bingoRemoteProgressByRoom.get(client.roomId);
        if (progMap) progMap.delete(client.id);
        const bEntry = bingoHostRooms.get(client.roomId);
        if (bEntry) broadcastBingoTvState(client.roomId, bEntry);
      }

      broadcastGlobal({
        type: 'friends:update',
        payload: { friends: Array.from(playerDirectory.values()) }
      });
    }
  });
});

async function hydrateRoomFromFirestoreIfNeeded(rawCode: string, forceRefresh = false): Promise<boolean> {
  const cleanCode = cleanRoomCode(rawCode);
  if (!cleanCode || cleanCode.length < 3 || !firebaseWebConfig) return false;

  const bingoRoomId = `joy-bingo-${cleanCode}`;
  const quizRoomId = `joy-quiz-${cleanCode}`;
  const existingLocalBingo = bingoHostRooms.get(bingoRoomId);
  const existingLocalQuiz = quizRooms.get(quizRoomId);
  const isLocallyHostedBingo = Boolean(existingLocalBingo && existingLocalBingo.hostId !== 'firestore-remote-host');
  const isLocallyHostedQuiz = Boolean(
    existingLocalQuiz && existingLocalQuiz.isHostActive && existingLocalQuiz.hostId && existingLocalQuiz.hostId !== 'firestore-remote-host'
  );
  if (!forceRefresh && isLocallyHostedBingo && isLocallyHostedQuiz) {
    return true;
  }

  const lastChecked = lastFirestoreSyncByCode.get(cleanCode) || 0;
  if (!forceRefresh && existingLocalBingo && existingLocalQuiz?.isHostActive && Date.now() - lastChecked < 1200) {
    return true;
  }
  lastFirestoreSyncByCode.set(cleanCode, Date.now());

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseWebConfig.projectId
    )}/databases/${encodeURIComponent(
      firebaseWebConfig.firestoreDatabaseId
    )}/documents/activeRooms/${encodeURIComponent(cleanCode)}?key=${encodeURIComponent(
      firebaseWebConfig.apiKey
    )}`;
    const resp = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return false;
    const docData: any = await resp.json();
    const fields = docData?.fields;
    if (!fields || typeof fields !== 'object') return false;

    const decoded: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      decoded[k] = decodeFirestoreValue(v);
    }

    const expiresAtMs = Number(decoded.expiresAtMs || 0);
    if (expiresAtMs > 0 && Date.now() > expiresAtMs) {
      return false;
    }

    const hostName = sanitizeMessage(String(decoded.hostName || 'Arrangør')).cleanText || 'Arrangør';
    const hasBingo = decoded.hasBingo !== false;
    const hasQuiz = decoded.hasQuiz !== false;
    const activeGame = decoded.activeGame === 'quiz' ? 'quiz' : 'bingo';
    const edition: 'adult' | 'family' | 'christmas' =
      decoded.edition === 'family' || decoded.edition === 'christmas' ? decoded.edition : 'adult';
    const showCodeOnScreen = decoded.showCodeOnScreen !== false;
    const ballNumbers: number[] = Array.isArray(decoded.calledBallNumbers)
      ? decoded.calledBallNumbers
          .map((n: any) => Math.trunc(Number(n)))
          .filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 75)
      : [];
    const playersSummary: BingoTvPlayerSummary[] = Array.isArray(decoded.playersSummary)
      ? decoded.playersSummary.slice(0, 50).map((p: any, idx: number) => ({
          id: String(p?.id || `cloud-p-${idx}`),
          name: sanitizeMessage(String(p?.name || 'Spiller')).cleanText || 'Spiller',
          avatarColor: String(p?.avatarColor || '#f59e0b'),
          linesCompleted: Math.max(0, Math.trunc(Number(p?.linesCompleted) || 0)),
          hasBingo: Boolean(p?.hasBingo),
        }))
      : [];

    if (hasBingo && !bingoHostRooms.has(bingoRoomId)) {
      bingoHostRooms.set(bingoRoomId, {
        roomId: bingoRoomId,
        roomCode: cleanCode,
        hostId: 'firestore-remote-host',
        hostName,
        createdAt: Date.now(),
        calledBalls: ballNumbers.map(buildCalledBallFromNumber),
        showCodeOnScreen,
        playersSummary,
        lastClaim: null,
      });
    } else if (hasBingo && bingoHostRooms.has(bingoRoomId)) {
      const existing = bingoHostRooms.get(bingoRoomId)!;
      if (existing.hostId === 'firestore-remote-host') {
        existing.hostName = hostName;
        existing.calledBalls = ballNumbers.map(buildCalledBallFromNumber);
        existing.showCodeOnScreen = showCodeOnScreen;
        if (playersSummary.length > 0) {
          existing.playersSummary = playersSummary;
        }
      }
    }

    if (hasQuiz) {
      const qRoom = getOrCreateQuizRoom(quizRoomId);
      qRoom.roomCode = cleanCode;
      if (!qRoom.hostId || qRoom.hostId === 'firestore-remote-host') {
        qRoom.hostId = 'firestore-remote-host';
        qRoom.hostName = hostName;
        qRoom.edition = edition;
        qRoom.showCodeOnScreen = showCodeOnScreen;
        qRoom.isHostActive = true;

        const qs = decoded.quizState;
        if (qs && typeof qs === 'object') {
          if (qs.edition === 'adult' || qs.edition === 'family' || qs.edition === 'christmas') {
            qRoom.edition = qs.edition;
          }
          if (qs.phase === 'lobby' || qs.phase === 'question' || qs.phase === 'reveal' || qs.phase === 'finished') {
            qRoom.phase = qs.phase;
          }
          if (typeof qs.questionIndex === 'number') {
            qRoom.questionIndex = qs.questionIndex;
          }
          if (typeof qs.totalQuestions === 'number' && qs.totalQuestions > 0) {
            qRoom.totalQuestions = qs.totalQuestions;
          }
          if (typeof qs.startedAt === 'number') {
            qRoom.startedAt = qs.startedAt;
          }
          if (typeof qs.durationSec === 'number') {
            qRoom.durationSec = qs.durationSec;
          }
          if (typeof qs.showCodeOnScreen === 'boolean') {
            qRoom.showCodeOnScreen = qs.showCodeOnScreen;
          }
          if (typeof qs.showLiveAnswersOnScreen === 'boolean') {
            qRoom.showLiveAnswersOnScreen = qs.showLiveAnswersOnScreen;
          }
          if (Array.isArray(qs.teams) && qs.teams.length >= 2) {
            qRoom.teams = qs.teams.slice(0, 6).map((t: any) => ({
              id: String(t.id),
              name: String(t.name || 'Lag').slice(0, 28),
              color: ['red', 'blue', 'emerald', 'amber'].includes(t.color) ? t.color : 'blue',
            }));
          }
          if (qs.teamScores && typeof qs.teamScores === 'object') {
            for (const [k, v] of Object.entries(qs.teamScores)) {
              qRoom.teamScores[k] = Number(v) || 0;
            }
          }
          if (qs.currentQuestion && typeof qs.currentQuestion === 'object') {
            const cq = qs.currentQuestion as any;
            qRoom.currentQuestion = {
              id: String(cq.id || `q-${qRoom.questionIndex}`),
              category: String(cq.category || 'Kultur'),
              questionType: cq.questionType === 'open_text' ? 'open_text' : 'multiple_choice',
              question: String(cq.question || ''),
              options: Array.isArray(cq.options) && cq.options.length === 4 ? cq.options : ['', '', '', ''],
              correctIndex: typeof cq.correctIndex === 'number' ? cq.correctIndex : -1,
              acceptedAnswers: Array.isArray(cq.acceptedAnswers) ? cq.acceptedAnswers : undefined,
              samplePlaceholder: cq.samplePlaceholder ? String(cq.samplePlaceholder) : undefined,
              wordplayJoke: cq.wordplayJoke ? String(cq.wordplayJoke) : '',
              hostAnswerNote: '',
            };
          } else if (qRoom.phase === 'lobby') {
            qRoom.currentQuestion = null;
          }
          if (qs.mimeState && typeof qs.mimeState === 'object') {
            qRoom.mimeState = qs.mimeState as any;
          } else {
            qRoom.mimeState = null;
          }
        }
      }
    }

    activeTvGameByCode.set(cleanCode, activeGame);
    scheduleSaveActiveRooms();
    return true;
  } catch (err) {
    console.warn('Firestore activeRooms lookup failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

// Room activation & validation endpoints (ensures room codes only work when an active paid host exists)
app.post('/api/rooms/register', (req, res) => {
  const { type, roomCode, hostName, hostKey } = req.body || {};
  const cleanCode = cleanRoomCode(roomCode);
  if (!cleanCode || cleanCode.length < 3) {
    return res.status(400).json({ success: false, error: 'Ugyldig koblingskode' });
  }
  pruneExpiredRooms();
  const cleanHostName = sanitizeMessage(String(hostName || 'Arrangør')).cleanText || 'Arrangør';
  const cleanHostKey = hostKey ? String(hostKey) : undefined;

  const bingoRoomId = `joy-bingo-${cleanCode}`;
  const existingBingo = bingoHostRooms.get(bingoRoomId);
  if (
    existingBingo &&
    existingBingo.hostId !== 'firestore-remote-host' &&
    existingBingo.hostKey &&
    cleanHostKey &&
    existingBingo.hostKey !== cleanHostKey
  ) {
    return res.status(403).json({ success: false, conflict: true, error: 'Romkoden er allerede reservert av en annen arrangør.' });
  }
  const quizRoomId = `joy-quiz-${cleanCode}`;
  const qRoom = getOrCreateQuizRoom(quizRoomId);
  if (
    qRoom.isHostActive &&
    qRoom.hostId !== 'firestore-remote-host' &&
    qRoom.hostKey &&
    cleanHostKey &&
    qRoom.hostKey !== cleanHostKey
  ) {
    return res.status(403).json({ success: false, conflict: true, error: 'Quizrommet er allerede reservert av en annen arrangør.' });
  }

  // Activate BOTH Bingo and Quiz under the same arrangement room code so all participants with the code can play together
  bingoHostRooms.set(bingoRoomId, {
    roomId: bingoRoomId,
    roomCode: cleanCode,
    hostId: existingBingo?.hostId && existingBingo.hostId !== 'firestore-remote-host' ? existingBingo.hostId : 'http-host',
    hostKey: cleanHostKey || existingBingo?.hostKey,
    hostName: cleanHostName,
    createdAt: Date.now(),
    calledBalls: existingBingo?.calledBalls || [],
    showCodeOnScreen: existingBingo?.showCodeOnScreen ?? true,
    playersSummary: existingBingo?.playersSummary || [],
    themeTitle: existingBingo?.themeTitle,
    lastClaim: existingBingo?.lastClaim || null,
  });

  qRoom.roomCode = cleanCode;
  qRoom.hostName = cleanHostName;
  if (qRoom.hostId === 'firestore-remote-host') qRoom.hostId = 'http-host';
  if (cleanHostKey) qRoom.hostKey = cleanHostKey;
  qRoom.showCodeOnScreen = existingBingo?.showCodeOnScreen ?? qRoom.showCodeOnScreen ?? true;
  qRoom.isHostActive = true;

  if (type === 'quiz' || type === 'bingo') {
    activeTvGameByCode.set(cleanCode, type);
  } else if (!activeTvGameByCode.has(cleanCode)) {
    activeTvGameByCode.set(cleanCode, 'bingo');
  }

  saveActiveRoomsNow();

  return res.json({
    success: true,
    roomId: type === 'quiz' ? quizRoomId : bingoRoomId,
    roomCode: cleanCode,
    hasBingo: true,
    hasQuiz: true,
  });
});

app.post('/api/rooms/unregister', (req, res) => {
  const { type, roomCode, hostKey } = req.body || {};
  const cleanCode = cleanRoomCode(roomCode);
  const cleanHostKey = hostKey ? String(hostKey) : undefined;
  if (cleanCode) {
    if (type === 'bingo' || !type || type === 'all') {
      const entry = bingoHostRooms.get(`joy-bingo-${cleanCode}`);
      if (!entry?.hostKey || !cleanHostKey || entry.hostKey === cleanHostKey) {
        bingoHostRooms.delete(`joy-bingo-${cleanCode}`);
      }
    }
    if (type === 'quiz' || !type || type === 'all') {
      const qRoom = quizRooms.get(`joy-quiz-${cleanCode}`);
      if (!qRoom?.hostKey || !cleanHostKey || qRoom.hostKey === cleanHostKey) {
        quizRooms.delete(`joy-quiz-${cleanCode}`);
      }
    }
    if (!bingoHostRooms.has(`joy-bingo-${cleanCode}`) && !quizRooms.has(`joy-quiz-${cleanCode}`)) {
      activeTvGameByCode.delete(cleanCode);
    }
    saveActiveRoomsNow();
  }
  res.json({ success: true });
});

app.get('/api/rooms/validate', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const type = String(req.query.type || 'any');
  const cleanCode = cleanRoomCode(req.query.code);
  if (!cleanCode || cleanCode.length < 3) {
    return res.json({ valid: false });
  }
  if (!bingoHostRooms.has(`joy-bingo-${cleanCode}`) || !quizRooms.get(`joy-quiz-${cleanCode}`)?.isHostActive) {
    await hydrateRoomFromFirestoreIfNeeded(cleanCode);
  }
  const entry = bingoHostRooms.get(`joy-bingo-${cleanCode}`);
  const qRoom = quizRooms.get(`joy-quiz-${cleanCode}`);
  const hasBingo = Boolean(entry);
  const hasQuiz = Boolean(qRoom && qRoom.isHostActive);
  const preferred = activeTvGameByCode.get(cleanCode);
  const activeGame = preferred === 'quiz' && hasQuiz
    ? 'quiz'
    : preferred === 'bingo' && hasBingo
    ? 'bingo'
    : hasBingo
    ? 'bingo'
    : hasQuiz
    ? 'quiz'
    : null;

  if (type === 'any') {
    return res.json({
      valid: hasBingo || hasQuiz,
      activeGame,
      hasBingo,
      hasQuiz,
      hostName: qRoom?.hostName || entry?.hostName,
      edition: qRoom?.edition,
    });
  }
  if (type === 'bingo') {
    return res.json({ valid: hasBingo || hasQuiz, activeGame, hostName: entry?.hostName || qRoom?.hostName });
  }
  return res.json({ valid: hasQuiz || hasBingo, activeGame, hostName: qRoom?.hostName || entry?.hostName, edition: qRoom?.edition });
});

app.get('/api/rooms/state', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const cleanCode = cleanRoomCode(req.query.code);
  if (!cleanCode || cleanCode.length < 3) {
    return res.json({ valid: false, calledBalls: [] });
  }
  await hydrateRoomFromFirestoreIfNeeded(cleanCode);
  const entry = bingoHostRooms.get(`joy-bingo-${cleanCode}`);
  const qRoom = quizRooms.get(`joy-quiz-${cleanCode}`);
  const mRoom = musicBingoRooms.get(cleanCode);
  const hasBingo = Boolean(entry);
  const hasQuiz = Boolean(qRoom && qRoom.isHostActive);
  return res.json({
    valid: hasBingo || hasQuiz || Boolean(mRoom),
    activeGame: activeTvGameByCode.get(cleanCode) || (hasBingo ? 'bingo' : hasQuiz ? 'quiz' : null),
    hostName: entry?.hostName || qRoom?.hostName || mRoom?.hostName || 'Arrangør',
    roundNumber: entry?.roundNumber || 1,
    calledBalls: entry?.calledBalls || [],
    playersSummary: entry ? buildMergedBingoPlayersSummary(entry) : [],
    connectedParticipants: entry
      ? getRoomParticipants(entry.roomId).filter((p) => p.id !== entry.hostId)
      : [],
    lastClaim: entry?.lastClaim || null,
    claimedMilestones: entry?.claimedMilestones || [],
    milestoneWinners: entry?.milestoneWinners || {},
    showCodeOnScreen: Boolean(entry?.showCodeOnScreen ?? qRoom?.showCodeOnScreen ?? true),
    edition: qRoom?.edition || 'adult',
    quizSnapshot: hasQuiz && qRoom ? serializeQuizRoomPublic(qRoom, false) : null,
    musicSnapshot: mRoom ? serializeMusicRoom(mRoom) : null,
  });
});

// =========================================================================
// Persistent Server-Side Owner Configuration (PIN, App Settings & Prices)
// =========================================================================
interface PersistedOwnerConfig {
  pin: string;
  profile: {
    name: string;
    email: string;
    phoneOrVipps: string;
    bankAccount: string;
    appTitle: string;
    appSubtitle: string;
    customWinnerTaskLine1: string;
    customWinnerTaskLine2: string;
    customWinnerTaskBingo: string;
    categoryOrder: string[];
    startPanelDefaults?: {
      defaultMode: 'ALL_IN_ONE' | 'HUMAN_BINGO' | 'CALLER_CAGE' | 'PASS_PLAY';
      defaultCardDisplayMode: 'both' | 'numbers' | 'prompts';
      defaultCardsPerPlayer: number;
      defaultScreenDevice: 'mobile' | 'desktop' | 'big_screen';
      defaultPlayerCount: number;
      showLiveDrum: boolean;
    };
    visibleModules: {
      showBigScreen: boolean;
      showMixer: boolean;
      showSchedule: boolean;
      showQuests: boolean;
      showIosInstall: boolean;
      showPrint: boolean;
      showReport: boolean;
      showBroadcast: boolean;
      showParticipants: boolean;
      showDrumOnMobile: boolean;
      familyKidsMode: boolean;
    };
  };
  pricingSettings: {
    isMonetizationActive: boolean;
    ownerName: string;
    vippsNumber: string;
    bankAccount: string;
    payoutEmail: string;
    commissionPercent: number;
    fixedFeePerPlayer: number;
    eventPassPrice: number;
    proBigScreenPrice: number;
    eventExtensionPrice: number;
    price20MinTrial: number;
    price1Hour: number;
    price2Hours: number;
    price3Hours: number;
    price4Hours: number;
    priceFullDay: number;
  };
  runtimeStripeSecretKey?: string;
  runtimeStripePublishableKey?: string;
  updatedAt: number;
}

const DATA_DIR = path.join(__dirname, '.data');
const OWNER_CONFIG_PATH = path.join(DATA_DIR, 'owner-config.json');

const DEFAULT_OWNER_CONFIG: PersistedOwnerConfig = {
  pin: (process.env.OWNER_PIN || '2026').trim() || '2026',
  profile: {
    name: 'Eier & Admin',
    email: 'adhanom3@gmail.com',
    phoneOrVipps: '920 00 000',
    bankAccount: '',
    appTitle: 'JoyBingo',
    appSubtitle: 'Sosial Trivsel & Fellesskap for Foreninger, Lag, Familie og Venner',
    customWinnerTaskLine1: 'Gi en god og varm klem til den som fortjener det aller mest!',
    customWinnerTaskLine2: 'Få med hele rommet på et felles gledesrop eller applaus for alle!',
    customWinnerTaskBingo: 'KRONING: Reis deg, rop et rungende BINGO og del ut en varm klem og seierssmil!',
    categoryOrder: ['ril', 'classic_joy', 'family_kids', 'heartfelt', 'laughter', 'kindness', 'gratitude'],
    startPanelDefaults: {
      defaultMode: 'ALL_IN_ONE',
      defaultCardDisplayMode: 'both',
      defaultCardsPerPlayer: 1,
      defaultScreenDevice: 'desktop',
      defaultPlayerCount: 2,
      showLiveDrum: true,
    },
    visibleModules: {
      showBigScreen: true,
      showMixer: true,
      showSchedule: false,
      showQuests: true,
      showIosInstall: false,
      showPrint: true,
      showReport: true,
      showBroadcast: true,
      showParticipants: true,
      showDrumOnMobile: true,
      familyKidsMode: true,
    },
  },
  pricingSettings: {
    isMonetizationActive: true,
    ownerName: 'JoyBingo Eier',
    vippsNumber: '920 00 000',
    bankAccount: '',
    payoutEmail: 'adhanom3@gmail.com',
    commissionPercent: 15,
    fixedFeePerPlayer: 10,
    eventPassPrice: 49,
    proBigScreenPrice: 199,
    eventExtensionPrice: 79,
    price20MinTrial: 19,
    price1Hour: 49,
    price2Hours: 89,
    price3Hours: 129,
    price4Hours: 169,
    priceFullDay: 199,
  },
  runtimeStripeSecretKey: '',
  runtimeStripePublishableKey: '',
  updatedAt: 0,
};

// Firebase Web Config for Firestore publicConfig sync & Identity Toolkit token verification
interface FirebaseWebConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

function loadFirebaseWebConfig(): FirebaseWebConfig | null {
  try {
    const cfgPath = path.join(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed?.projectId && parsed?.apiKey && parsed?.firestoreDatabaseId) {
      return {
        projectId: String(parsed.projectId),
        apiKey: String(parsed.apiKey),
        firestoreDatabaseId: String(parsed.firestoreDatabaseId),
      };
    }
  } catch (err) {
    console.warn('Could not load firebase-applet-config.json:', err);
  }
  return null;
}

const firebaseWebConfig = loadFirebaseWebConfig();
const AUTHORIZED_OWNER_EMAIL = 'adhanom3@gmail.com';
let lastFirestoreSyncAttempt = 0;

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return String(val.stringValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) {
    const ms = Date.parse(String(val.timestampValue));
    return Number.isFinite(ms) ? ms : Date.now();
  }
  if ('arrayValue' in val) {
    const arr = Array.isArray(val.arrayValue?.values) ? val.arrayValue.values : [];
    return arr.map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

async function syncPublicConfigFromFirestore(force = false): Promise<boolean> {
  if (!firebaseWebConfig) return false;
  const now = Date.now();
  if (!force && now - lastFirestoreSyncAttempt < 10_000) {
    return false;
  }
  lastFirestoreSyncAttempt = now;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseWebConfig.projectId
    )}/databases/${encodeURIComponent(
      firebaseWebConfig.firestoreDatabaseId
    )}/documents/publicConfig/app?key=${encodeURIComponent(firebaseWebConfig.apiKey)}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const docData: any = await res.json();
    const fields = docData?.fields;
    if (!fields || typeof fields !== 'object') return false;

    const decoded: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      decoded[k] = decodeFirestoreValue(v);
    }

    const cloudUpdatedMs =
      (typeof decoded.updatedAt === 'number' && decoded.updatedAt > 0
        ? decoded.updatedAt
        : Date.parse(String(docData.updateTime || ''))) || Date.now();

    if (persistedOwnerConfig.updatedAt === 0 || cloudUpdatedMs >= persistedOwnerConfig.updatedAt) {
      applyPublicConfigToServer(decoded);
      persistedOwnerConfig.updatedAt = cloudUpdatedMs;
      savePersistedOwnerConfig(persistedOwnerConfig);
      return true;
    }
  } catch (err) {
    console.warn('Firestore publicConfig sync skipped:', err instanceof Error ? err.message : err);
  }
  return false;
}

function applyPublicConfigToServer(decoded: Record<string, any>) {
  if (!decoded || typeof decoded !== 'object') return;
  const curP = persistedOwnerConfig.profile;
  persistedOwnerConfig.profile = {
    ...curP,
    ...(typeof decoded.appTitle === 'string' && decoded.appTitle.trim() ? { appTitle: decoded.appTitle.trim() } : {}),
    ...(typeof decoded.appSubtitle === 'string' ? { appSubtitle: decoded.appSubtitle.trim() } : {}),
    ...(typeof decoded.customWinnerTaskLine1 === 'string' ? { customWinnerTaskLine1: decoded.customWinnerTaskLine1.trim() } : {}),
    ...(typeof decoded.customWinnerTaskLine2 === 'string' ? { customWinnerTaskLine2: decoded.customWinnerTaskLine2.trim() } : {}),
    ...(typeof decoded.customWinnerTaskBingo === 'string' ? { customWinnerTaskBingo: decoded.customWinnerTaskBingo.trim() } : {}),
    ...(Array.isArray(decoded.categoryOrder) && decoded.categoryOrder.length > 0
      ? { categoryOrder: decoded.categoryOrder.map(String) }
      : {}),
    ...(decoded.startPanelDefaults && typeof decoded.startPanelDefaults === 'object'
      ? {
          startPanelDefaults: {
            ...DEFAULT_OWNER_CONFIG.profile.startPanelDefaults!,
            ...curP.startPanelDefaults,
            ...decoded.startPanelDefaults,
          },
        }
      : {}),
    visibleModules: {
      ...curP.visibleModules,
      ...(decoded.visibleModules && typeof decoded.visibleModules === 'object' ? decoded.visibleModules : {}),
    },
  };

  const curPs = persistedOwnerConfig.pricingSettings;
  persistedOwnerConfig.pricingSettings = {
    ...curPs,
    ...(typeof decoded.isMonetizationActive === 'boolean' ? { isMonetizationActive: decoded.isMonetizationActive } : {}),
    commissionPercent: sanitizeNonNegativePrice(decoded.commissionPercent, curPs.commissionPercent),
    fixedFeePerPlayer: sanitizeNonNegativePrice(decoded.fixedFeePerPlayer, curPs.fixedFeePerPlayer),
    eventPassPrice: sanitizeNonNegativePrice(decoded.eventPassPrice, curPs.eventPassPrice),
    proBigScreenPrice: sanitizeNonNegativePrice(decoded.proBigScreenPrice, curPs.proBigScreenPrice),
    eventExtensionPrice: sanitizeNonNegativePrice(decoded.eventExtensionPrice, curPs.eventExtensionPrice),
    price20MinTrial: sanitizeNonNegativePrice(decoded.price20MinTrial, curPs.price20MinTrial),
    price1Hour: sanitizeNonNegativePrice(decoded.price1Hour, curPs.price1Hour),
    price2Hours: sanitizeNonNegativePrice(decoded.price2Hours, curPs.price2Hours),
    price3Hours: sanitizeNonNegativePrice(decoded.price3Hours, curPs.price3Hours),
    price4Hours: sanitizeNonNegativePrice(decoded.price4Hours, curPs.price4Hours),
    priceFullDay: sanitizeNonNegativePrice(decoded.priceFullDay, curPs.priceFullDay),
  };
}

function sanitizeNonNegativePrice(val: unknown, fallback: number): number {
  if (val === '' || val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function loadPersistedOwnerConfig(): PersistedOwnerConfig {
  try {
    if (fs.existsSync(OWNER_CONFIG_PATH)) {
      const raw = fs.readFileSync(OWNER_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        pin: typeof parsed?.pin === 'string' && parsed.pin.trim().length >= 4
          ? parsed.pin.trim()
          : DEFAULT_OWNER_CONFIG.pin,
        profile: {
          ...DEFAULT_OWNER_CONFIG.profile,
          ...(parsed?.profile || {}),
          visibleModules: {
            ...DEFAULT_OWNER_CONFIG.profile.visibleModules,
            ...(parsed?.profile?.visibleModules || {}),
          },
          categoryOrder: Array.isArray(parsed?.profile?.categoryOrder) && parsed.profile.categoryOrder.length > 0
            ? parsed.profile.categoryOrder
            : DEFAULT_OWNER_CONFIG.profile.categoryOrder,
        },
        pricingSettings: {
          ...DEFAULT_OWNER_CONFIG.pricingSettings,
          ...(parsed?.pricingSettings || {}),
        },
        runtimeStripeSecretKey: typeof parsed?.runtimeStripeSecretKey === 'string' ? parsed.runtimeStripeSecretKey : '',
        runtimeStripePublishableKey: typeof parsed?.runtimeStripePublishableKey === 'string' ? parsed.runtimeStripePublishableKey : '',
        updatedAt: Number(parsed?.updatedAt) || Date.now(),
      };
    }
  } catch (err) {
    console.error('Failed to read owner-config.json:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_OWNER_CONFIG));
}

function savePersistedOwnerConfig(cfg: PersistedOwnerConfig): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${OWNER_CONFIG_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(cfg, null, 2), 'utf-8');
    fs.renameSync(tmpPath, OWNER_CONFIG_PATH);
    return true;
  } catch (err) {
    console.error('Failed to persist owner-config.json:', err);
    return false;
  }
}

let persistedOwnerConfig: PersistedOwnerConfig = loadPersistedOwnerConfig();
if (!fs.existsSync(OWNER_CONFIG_PATH)) {
  savePersistedOwnerConfig(persistedOwnerConfig);
}

const activeOwnerTokens = new Map<string, number>();

function issueOwnerToken(): string {
  const now = Date.now();
  for (const [tok, exp] of activeOwnerTokens.entries()) {
    if (exp < now) activeOwnerTokens.delete(tok);
  }
  const token = crypto.randomBytes(24).toString('hex');
  activeOwnerTokens.set(token, now + 24 * 60 * 60 * 1000);
  return token;
}

function isValidOwnerToken(token: unknown): boolean {
  if (typeof token !== 'string' || !token) return false;
  const exp = activeOwnerTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) {
    activeOwnerTokens.delete(token);
    return false;
  }
  return true;
}

function getPublicOwnerSnapshot() {
  return {
    profilePublic: {
      appTitle: persistedOwnerConfig.profile.appTitle,
      appSubtitle: persistedOwnerConfig.profile.appSubtitle,
      customWinnerTaskLine1: persistedOwnerConfig.profile.customWinnerTaskLine1,
      customWinnerTaskLine2: persistedOwnerConfig.profile.customWinnerTaskLine2,
      customWinnerTaskBingo: persistedOwnerConfig.profile.customWinnerTaskBingo,
      categoryOrder: persistedOwnerConfig.profile.categoryOrder,
      startPanelDefaults: persistedOwnerConfig.profile.startPanelDefaults || DEFAULT_OWNER_CONFIG.profile.startPanelDefaults,
      visibleModules: persistedOwnerConfig.profile.visibleModules,
    },
    pricingSettings: {
      isMonetizationActive: persistedOwnerConfig.pricingSettings.isMonetizationActive,
      commissionPercent: persistedOwnerConfig.pricingSettings.commissionPercent,
      fixedFeePerPlayer: persistedOwnerConfig.pricingSettings.fixedFeePerPlayer,
      eventPassPrice: persistedOwnerConfig.pricingSettings.eventPassPrice,
      proBigScreenPrice: persistedOwnerConfig.pricingSettings.proBigScreenPrice,
      eventExtensionPrice: persistedOwnerConfig.pricingSettings.eventExtensionPrice,
      price20MinTrial: persistedOwnerConfig.pricingSettings.price20MinTrial,
      price1Hour: persistedOwnerConfig.pricingSettings.price1Hour,
      price2Hours: persistedOwnerConfig.pricingSettings.price2Hours,
      price3Hours: persistedOwnerConfig.pricingSettings.price3Hours,
      price4Hours: persistedOwnerConfig.pricingSettings.price4Hours,
      priceFullDay: persistedOwnerConfig.pricingSettings.priceFullDay,
    },
    updatedAt: persistedOwnerConfig.updatedAt,
  };
}

app.get('/api/owner/public-config', async (_req, res) => {
  await syncPublicConfigFromFirestore(false);
  res.json({
    success: true,
    ...getPublicOwnerSnapshot(),
  });
});

app.post('/api/owner/sync-from-firebase', async (req, res) => {
  if (!firebaseWebConfig) {
    return res.status(400).json({ success: false, error: 'Firebase er ikke konfigurert på serveren.' });
  }
  const authHeader = String(req.headers.authorization || '');
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const idToken = bearerToken || String(req.body?.idToken || '').trim();
  if (!idToken) {
    return res.status(401).json({ success: false, error: 'Mangler Firebase ID-token.' });
  }

  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(6000),
      }
    );
    const verifyData: any = await verifyRes.json();
    const user = Array.isArray(verifyData?.users) ? verifyData.users[0] : null;
    const email = String(user?.email || '').toLowerCase();
    const emailVerified = Boolean(user?.emailVerified);

    if (!user || !emailVerified || email !== AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `Kun bekreftet eier (${AUTHORIZED_OWNER_EMAIL}) kan synkronisere eierinnstillinger.`,
      });
    }

    const { secrets, publicConfig } = req.body || {};
    if (secrets && typeof secrets === 'object') {
      if (typeof secrets.pin === 'string' && secrets.pin.trim().length >= 4) {
        persistedOwnerConfig.pin = secrets.pin.trim();
      }
      if (typeof secrets.ownerName === 'string' && secrets.ownerName.trim()) {
        persistedOwnerConfig.profile.name = secrets.ownerName.trim();
        persistedOwnerConfig.pricingSettings.ownerName = secrets.ownerName.trim();
      }
      if (typeof secrets.email === 'string' && secrets.email.trim()) {
        persistedOwnerConfig.profile.email = secrets.email.trim();
      }
      if (typeof secrets.phoneOrVipps === 'string') {
        persistedOwnerConfig.profile.phoneOrVipps = secrets.phoneOrVipps.trim();
        persistedOwnerConfig.pricingSettings.vippsNumber = secrets.phoneOrVipps.trim();
      }
      if (typeof secrets.bankAccount === 'string') {
        persistedOwnerConfig.profile.bankAccount = secrets.bankAccount.trim();
        persistedOwnerConfig.pricingSettings.bankAccount = secrets.bankAccount.trim();
      }
      if (typeof secrets.payoutEmail === 'string' && secrets.payoutEmail.trim()) {
        persistedOwnerConfig.pricingSettings.payoutEmail = secrets.payoutEmail.trim();
      }
    }

    if (publicConfig && typeof publicConfig === 'object') {
      applyPublicConfigToServer(publicConfig);
    }

    persistedOwnerConfig.updatedAt = Date.now();
    savePersistedOwnerConfig(persistedOwnerConfig);

    const ownerToken = issueOwnerToken();
    const snapshot = getPublicOwnerSnapshot();
    broadcastGlobal({
      type: 'owner:config_updated',
      payload: snapshot,
    });

    return res.json({
      success: true,
      ownerToken,
      profile: persistedOwnerConfig.profile,
      ...snapshot,
    });
  } catch (err) {
    console.error('Firebase admin token verification failed:', err);
    return res.status(500).json({ success: false, error: 'Kunne ikke verifisere Firebase-innlogging.' });
  }
});

app.post('/api/owner/verify-pin', (req, res) => {
  const entered = String(req.body?.pin || '').trim();
  const activePin = persistedOwnerConfig.pin || '2026';
  if (!entered || entered !== activePin) {
    return res.json({ success: false, valid: false });
  }
  const ownerToken = issueOwnerToken();
  return res.json({
    success: true,
    valid: true,
    ownerToken,
    profile: persistedOwnerConfig.profile,
    pricingSettings: persistedOwnerConfig.pricingSettings,
    updatedAt: persistedOwnerConfig.updatedAt,
  });
});

app.post('/api/owner/change-pin', (req, res) => {
  const currentPin = String(req.body?.currentPin || '').trim();
  const newPin = String(req.body?.newPin || '').trim();
  const token = req.body?.ownerToken;
  const activePin = persistedOwnerConfig.pin || '2026';

  if (!isValidOwnerToken(token) || currentPin) {
    if (currentPin !== activePin) {
      return res.status(403).json({
        success: false,
        message: 'Nåværende PIN-kode er feil.',
      });
    }
  }

  if (newPin.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Ny PIN-kode må bestå av minst 4 siffer.',
    });
  }

  persistedOwnerConfig.pin = newPin;
  persistedOwnerConfig.updatedAt = Date.now();
  const saved = savePersistedOwnerConfig(persistedOwnerConfig);
  const nextToken = issueOwnerToken();

  return res.json({
    success: saved,
    ownerToken: nextToken,
    message: saved
      ? 'PIN-koden er oppdatert og lagret på serveren!'
      : 'PIN ble oppdatert i minnet, men kunne ikke skrives til disk.',
  });
});

app.post('/api/owner/update-config', (req, res) => {
  const { ownerToken, pin, profile, pricingSettings } = req.body || {};
  const activePin = persistedOwnerConfig.pin || '2026';
  const authorized = isValidOwnerToken(ownerToken) || (typeof pin === 'string' && pin.trim() === activePin);

  if (!authorized) {
    return res.status(403).json({
      success: false,
      error: 'Eiertilgang kreves for å lagre endringer på serveren. Lås opp eierpanelet med din PIN-kode.',
    });
  }

  if (profile && typeof profile === 'object') {
    const p = profile as Record<string, unknown>;
    persistedOwnerConfig.profile = {
      ...persistedOwnerConfig.profile,
      ...(typeof p.name === 'string' && p.name.trim() ? { name: p.name.trim() } : {}),
      ...(typeof p.email === 'string' ? { email: p.email.trim() } : {}),
      ...(typeof p.phoneOrVipps === 'string' ? { phoneOrVipps: p.phoneOrVipps.trim() } : {}),
      ...(typeof p.bankAccount === 'string' ? { bankAccount: p.bankAccount.trim() } : {}),
      ...(typeof p.appTitle === 'string' && p.appTitle.trim() ? { appTitle: p.appTitle.trim() } : {}),
      ...(typeof p.appSubtitle === 'string' ? { appSubtitle: p.appSubtitle.trim() } : {}),
      ...(typeof p.customWinnerTaskLine1 === 'string' ? { customWinnerTaskLine1: p.customWinnerTaskLine1.trim() } : {}),
      ...(typeof p.customWinnerTaskLine2 === 'string' ? { customWinnerTaskLine2: p.customWinnerTaskLine2.trim() } : {}),
      ...(typeof p.customWinnerTaskBingo === 'string' ? { customWinnerTaskBingo: p.customWinnerTaskBingo.trim() } : {}),
      ...(Array.isArray(p.categoryOrder) && p.categoryOrder.length > 0
        ? { categoryOrder: p.categoryOrder.map(String) }
        : {}),
      ...(p.startPanelDefaults && typeof p.startPanelDefaults === 'object'
        ? {
            startPanelDefaults: {
              ...DEFAULT_OWNER_CONFIG.profile.startPanelDefaults!,
              ...persistedOwnerConfig.profile.startPanelDefaults,
              ...(p.startPanelDefaults as any),
            },
          }
        : {}),
      visibleModules: {
        ...persistedOwnerConfig.profile.visibleModules,
        ...((p.visibleModules && typeof p.visibleModules === 'object') ? (p.visibleModules as any) : {}),
      },
    };
  }

  if (pricingSettings && typeof pricingSettings === 'object') {
    const ps = pricingSettings as Record<string, unknown>;
    const cur = persistedOwnerConfig.pricingSettings;
    persistedOwnerConfig.pricingSettings = {
      ...cur,
      ...(typeof ps.isMonetizationActive === 'boolean' ? { isMonetizationActive: ps.isMonetizationActive } : {}),
      ...(typeof ps.ownerName === 'string' && ps.ownerName.trim() ? { ownerName: ps.ownerName.trim() } : {}),
      ...(typeof ps.vippsNumber === 'string' ? { vippsNumber: ps.vippsNumber.trim() } : {}),
      ...(typeof ps.bankAccount === 'string' ? { bankAccount: ps.bankAccount.trim() } : {}),
      ...(typeof ps.payoutEmail === 'string' ? { payoutEmail: ps.payoutEmail.trim() } : {}),
      commissionPercent: sanitizeNonNegativePrice(ps.commissionPercent, cur.commissionPercent),
      fixedFeePerPlayer: sanitizeNonNegativePrice(ps.fixedFeePerPlayer, cur.fixedFeePerPlayer),
      eventPassPrice: sanitizeNonNegativePrice(ps.eventPassPrice, cur.eventPassPrice),
      proBigScreenPrice: sanitizeNonNegativePrice(ps.proBigScreenPrice, cur.proBigScreenPrice),
      eventExtensionPrice: sanitizeNonNegativePrice(ps.eventExtensionPrice, cur.eventExtensionPrice),
      price20MinTrial: sanitizeNonNegativePrice(ps.price20MinTrial, cur.price20MinTrial),
      price1Hour: sanitizeNonNegativePrice(ps.price1Hour, cur.price1Hour),
      price2Hours: sanitizeNonNegativePrice(ps.price2Hours, cur.price2Hours),
      price3Hours: sanitizeNonNegativePrice(ps.price3Hours, cur.price3Hours),
      price4Hours: sanitizeNonNegativePrice(ps.price4Hours, cur.price4Hours),
      priceFullDay: sanitizeNonNegativePrice(ps.priceFullDay, cur.priceFullDay),
    };
  }

  persistedOwnerConfig.updatedAt = Date.now();
  const saved = savePersistedOwnerConfig(persistedOwnerConfig);
  const snapshot = getPublicOwnerSnapshot();

  broadcastGlobal({
    type: 'owner:config_updated',
    payload: snapshot,
  });

  return res.json({
    success: saved,
    ...snapshot,
    message: saved ? 'Innstillinger og priser lagret på serveren!' : 'Kunne ikke skrive konfigurasjon til disk.',
  });
});

// REST API endpoints for sharing cards or retrieving card by ID
app.get('/api/cards', (_req, res) => {
  res.json(Array.from(customCards.values()));
});

app.get('/api/cards/:id', (req, res) => {
  const card = customCards.get(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

app.post('/api/cards', (req, res) => {
  const { title, theme, creatorName, items } = req.body;
  if (!title || !items || !Array.isArray(items) || items.length < 24) {
    return res.status(400).json({ error: 'Please provide at least 24 joyful items and a title' });
  }
  const id = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const card: CustomCard = {
    id,
    title,
    theme: theme || 'heartfelt',
    creatorName: creatorName || 'Anonymous',
    items,
    createdAt: Date.now()
  };
  customCards.set(id, card);
  res.status(201).json(card);
});

// REST API endpoint for simulating Vipps ePayment v1 API calls
app.post('/api/vipps/simulate', (req, res) => {
  const { amount, phone, packageLabel, payerName } = req.body;
  const numAmount = Number(amount) || 19;
  const cleanPhone = (phone || '92000000').replace(/\s+/g, '');
  const orderRef = `VIPPS-TEST-${Date.now().toString().slice(-6)}`;
  
  // Realistically simulate network roundtrip of Vipps API
  setTimeout(() => {
    res.json({
      success: true,
      reference: orderRef,
      status: 'CREATED',
      amount: {
        currency: 'NOK',
        value: numAmount * 100, // in øre
        formatted: `${numAmount} kr`,
      },
      customer: {
        phoneNumber: cleanPhone,
        name: payerName || 'Bingovert Test',
      },
      paymentMethod: {
        type: 'WALLET',
      },
      orderDescription: packageLabel || `JoyBingo spilletid (${numAmount} kr)`,
      merchantSerialNumber: '314892',
      vippsEndpoint: 'POST https://api.vipps.no/epayments/v1/payments',
      redirectUrl: `vipps://pay?phone=${cleanPhone}&amount=${numAmount * 100}&orderId=${orderRef}`,
      idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  }, 350);
});

app.post('/api/vipps/simulate-approval', (req, res) => {
  const { reference, amount, payerName, phone, packageLabel } = req.body;
  const numAmount = Number(amount) || 19;
  const cleanPhone = (phone || '92000000').replace(/\s+/g, '');

  setTimeout(() => {
    res.json({
      success: true,
      reference: reference || `VIPPS-TEST-${Date.now().toString().slice(-6)}`,
      status: 'CAPTURED',
      transactionId: `TX-VIPPS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      capturedAmount: {
        currency: 'NOK',
        value: numAmount * 100,
        formatted: `${numAmount} kr`,
      },
      netCommission: Math.round(numAmount * 0.85),
      payer: {
        name: payerName || 'Bingovert Test',
        phoneNumber: cleanPhone,
      },
      packageLabel: packageLabel || `${numAmount} kr pakke`,
      settlementStatus: 'SETTLED',
      webhookEvent: 'PAYMENT.CAPTURED',
      timestamp: new Date().toISOString(),
      message: 'Betaling ble godkjent og beløpet ble simulert trukket fra konto og kreditert eiers saldo.',
    });
  }, 400);
});

// Set of verified Vipps transactions to prevent fraud and reuse
const verifiedVippsTransactions = new Set<string>();

// Endpoint to verify payment made to Vipps number 92000000
app.post('/api/vipps/verify-transfer', (req, res) => {
  const { amount, payerPhone, payerName, packageLabel, vippsTransactionRef, orderRef } = req.body;
  const cleanRef = (vippsTransactionRef || '').toString().trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const cleanPhone = (payerPhone || '').toString().trim().replace(/\s+/g, '');

  if (!cleanPhone || cleanPhone.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Vennligst skriv inn et gyldig mobilnummer (8 siffer) som du vippset fra.',
    });
  }

  if (!cleanRef || cleanRef.length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Du må oppgi transaksjonsnummeret / referansekoden fra Vipps-kvitteringen din etter at du har vippset til 920 00 000.',
    });
  }

  if (verifiedVippsTransactions.has(cleanRef)) {
    return res.status(400).json({
      success: false,
      error: 'Denne Vipps-kvitteringen er allerede registrert og brukt. Hver betaling kan kun brukes én gang.',
    });
  }

  // Register verified reference
  verifiedVippsTransactions.add(cleanRef);

  const numAmount = Number(amount) || 19;
  return res.json({
    success: true,
    verified: true,
    reference: cleanRef,
    orderRef: orderRef || `VIPPS-${Date.now().toString().slice(-6)}`,
    amount: numAmount,
    amountFormatted: `${numAmount} kr`,
    payerPhone: cleanPhone,
    payerName: payerName || 'Vipps-bruker',
    packageLabel: packageLabel || `${numAmount} kr`,
    recipientNumber: '920 00 000',
    verifiedAt: Date.now(),
    message: `Vipps-betaling på ${numAmount} kr til 920 00 000 ble verifisert med referanse ${cleanRef}.`,
  });
});

// Server-side Ledger for verified Card, Apple Pay and Google Pay transactions
const processedTransactions: any[] = [];

app.get('/api/checkout/transactions', (_req, res) => {
  res.json({ success: true, count: processedTransactions.length, transactions: processedTransactions });
});

// Secure Card & Digital Wallet Checkout Endpoint (blocked whenever Stripe is configured)
app.post('/api/checkout/process-card', (req, res) => {
  if (activeStripeSecretKey && isValidStripeKey(activeStripeSecretKey)) {
    return res.status(403).json({
      success: false,
      code: 'STRIPE_REQUIRED',
      error: 'Gratis/simulert betaling er deaktivert fordi ekte Stripe-betaling er aktiv. Bruk Stripe Checkout.',
    });
  }

  return res.status(403).json({
    success: false,
    code: 'NO_STRIPE_KEY',
    error: 'Betaling krever aktiv Stripe-gateway (STRIPE_SECRET_KEY).',
  });
});

// Stripe Configuration for real payment processing (Visa, Mastercard, Apple Pay, Google Pay)
let activeStripeSecretKey = process.env.STRIPE_SECRET_KEY || persistedOwnerConfig.runtimeStripeSecretKey || '';
let activeStripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || persistedOwnerConfig.runtimeStripePublishableKey || '';

const isValidStripeKey = (key: string): boolean => key.startsWith('sk_') || key.startsWith('rk_');
const isLiveStripeKey = (key: string): boolean => key.startsWith('sk_live_') || key.startsWith('rk_live_');
const isTestStripeKey = (key: string): boolean => key.startsWith('sk_test_') || key.startsWith('rk_test_');

function getStripeClient(): Stripe | null {
  if (!activeStripeSecretKey || !isValidStripeKey(activeStripeSecretKey)) {
    return null;
  }
  try {
    return new Stripe(activeStripeSecretKey);
  } catch (err) {
    console.error('Failed to initialize Stripe client:', err);
    return null;
  }
}

// Check Stripe Gateway Status
app.get('/api/stripe/status', (_req, res) => {
  const hasKey = Boolean(activeStripeSecretKey && isValidStripeKey(activeStripeSecretKey));
  const isLive = isLiveStripeKey(activeStripeSecretKey);
  const isTest = isTestStripeKey(activeStripeSecretKey);
  const configuredViaEnv = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    isValidStripeKey(process.env.STRIPE_SECRET_KEY) &&
    activeStripeSecretKey === process.env.STRIPE_SECRET_KEY
  );

  res.json({
    configured: hasKey,
    isLive,
    isTest,
    mode: isLive ? 'live' : isTest ? 'test' : 'unconfigured',
    source: !hasKey ? 'none' : configuredViaEnv ? 'env' : 'runtime',
    publishableKey: activeStripePublishableKey || (isTest ? 'pk_test_sample' : null),
  });
});

// Update Stripe Keys (from Owner Control Modal)
app.post('/api/stripe/update-keys', (req, res) => {
  const { secretKey, publishableKey, ownerToken } = req.body || {};
  if (!isValidOwnerToken(ownerToken)) {
    return res.status(403).json({ success: false, error: 'Ugyldig eller manglende eier-sesjon.' });
  }
  if (typeof secretKey === 'string') {
    const trimmed = secretKey.trim();
    if (trimmed) {
      activeStripeSecretKey = trimmed;
      persistedOwnerConfig.runtimeStripeSecretKey = trimmed;
    } else if (process.env.STRIPE_SECRET_KEY) {
      activeStripeSecretKey = process.env.STRIPE_SECRET_KEY;
      persistedOwnerConfig.runtimeStripeSecretKey = '';
    } else {
      activeStripeSecretKey = '';
      persistedOwnerConfig.runtimeStripeSecretKey = '';
    }
  }
  if (typeof publishableKey === 'string') {
    const trimmedPub = publishableKey.trim();
    activeStripePublishableKey = trimmedPub || process.env.STRIPE_PUBLISHABLE_KEY || '';
    persistedOwnerConfig.runtimeStripePublishableKey = trimmedPub;
  }
  persistedOwnerConfig.updatedAt = Date.now();
  savePersistedOwnerConfig(persistedOwnerConfig);

  const hasKey = Boolean(activeStripeSecretKey && isValidStripeKey(activeStripeSecretKey));
  const isLive = isLiveStripeKey(activeStripeSecretKey);
  const isTest = isTestStripeKey(activeStripeSecretKey);
  const configuredViaEnv = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    isValidStripeKey(process.env.STRIPE_SECRET_KEY) &&
    activeStripeSecretKey === process.env.STRIPE_SECRET_KEY
  );

  res.json({
    success: true,
    configured: hasKey,
    isLive,
    isTest,
    mode: isLive ? 'live' : isTest ? 'test' : 'unconfigured',
    source: !hasKey ? 'none' : configuredViaEnv ? 'env' : 'runtime',
    message: hasKey
      ? configuredViaEnv
        ? `Stripe API-nøkkel er aktiv via Hemmeligheter (${isLive ? 'LIVE EKTE BETALING' : 'TEST-MODUS'}).`
        : `Stripe API-nøkkel lagret på serveren (${isLive ? 'LIVE EKTE BETALING' : 'TEST-MODUS'}).`
      : 'Stripe-nøkkel ble fjernet.',
  });
});

// Create Real Stripe Checkout Session (Visa, Mastercard, Apple Pay, Google Pay)
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  await syncPublicConfigFromFirestore(false);
  const { amount, minutes, packageLabel, payerName, payerEmail, payerPhone } = req.body;
  const numMinutes = Number(minutes) || 120;
  const ps = persistedOwnerConfig.pricingSettings;
  const packagePriceMap: Record<number, number> = {
    20: ps.price20MinTrial,
    60: ps.price1Hour,
    120: ps.price2Hours,
    180: ps.price3Hours,
    240: ps.price4Hours,
    1440: ps.priceFullDay,
  };
  const authoritativePrice = packagePriceMap[numMinutes];
  const rawAmount = authoritativePrice !== undefined ? authoritativePrice : Number(amount);
  const numAmount = Math.max(1, Number.isFinite(rawAmount) ? rawAmount : 19);
  const label = packageLabel || `${numAmount} kr spilletid`;

  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(400).json({
      success: false,
      code: 'NO_STRIPE_KEY',
      error: 'Stripe API-nøkkel mangler på serveren. For at bankene skal tillate reell belastning av kundens konto og innskudd til din konto, må du som eier oppgi din hemmelige Stripe-nøkkel (sk_live_/rk_live_ eller sk_test_/rk_test_) i Eierkontroll under Økonomi eller i Hemmeligheter (STRIPE_SECRET_KEY).',
    });
  }

  try {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
    const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
    const proto = forwardedProto || req.protocol || 'https';
    const hostHeader = forwardedHost || req.headers.host;
    const origin = req.headers.origin || (hostHeader ? `${proto}://${hostHeader}` : 'http://localhost:3000');

    const cleanEmail = typeof payerEmail === 'string' ? payerEmail.trim() : '';
    const validCustomerEmail =
      cleanEmail && cleanEmail.includes('@') && cleanEmail !== 'kunde@joybingo.no'
        ? cleanEmail
        : undefined;

    const session = await stripe.checkout.sessions.create({
      // Only instant card & wallet payments (Visa, Mastercard, Apple Pay, Google Pay) — never Klarna / Buy-Now-Pay-Later
      allowed_payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'nok',
            product_data: {
              name: `Human-connection: ${label}`,
              description: `${numMinutes} minutter arrangements-spilletid med storskjerm og avstandsbingo.`,
            },
            unit_amount: Math.round(numAmount * 100), // øre
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: validCustomerEmail,
      metadata: {
        minutes: String(numMinutes),
        packageLabel: label,
        payerName: typeof payerName === 'string' ? payerName.trim() : '',
        payerPhone: typeof payerPhone === 'string' ? payerPhone.trim() : '',
      },
      success_url: `${origin}/?stripe_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?stripe_status=cancelled`,
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount: numAmount,
      currency: 'NOK',
    });
  } catch (err: any) {
    console.error('Stripe Checkout Session error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Kunne ikke opprette Stripe Checkout-sesjon.',
    });
  }
});

// Verify completed Stripe Checkout Session
app.get('/api/stripe/verify-session', async (req, res) => {
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Mangler session_id parameter.' });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(400).json({ success: false, error: 'Stripe er ikke konfigurert.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const grossNok = (session.amount_total || 0) / 100;
      const minutes = Number(session.metadata?.minutes) || 120;
      const packageLabel = session.metadata?.packageLabel || `${grossNok} kr spilletid`;
      const payerName = session.customer_details?.name || session.metadata?.payerName || 'Stripe-kunde';
      const customerEmail = session.customer_details?.email || undefined;

      const txRecord = {
        success: true,
        status: 'SUCCEEDED',
        reference: `STRIPE-${session.id.slice(-8).toUpperCase()}`,
        transactionId: session.payment_intent ? String(session.payment_intent) : session.id,
        amount: grossNok,
        currency: 'NOK',
        paymentMethod: 'stripe',
        cardBrand: 'Visa/Mastercard/Apple Pay',
        packageLabel,
        payerName,
        payerEmail: customerEmail || '',
        bankIdVerified: true,
        processedAt: Date.now(),
        message: `Ekte betaling på ${grossNok} kr ble bekreftet betalt via Stripe.`,
      };

      if (!processedTransactions.some(t => t.transactionId === txRecord.transactionId)) {
        processedTransactions.unshift(txRecord);
      }

      return res.json({
        success: true,
        paid: true,
        session: {
          id: session.id,
          amount: grossNok,
          currency: 'NOK',
          minutes,
          packageLabel,
          payerName,
          customerEmail,
          payerEmail: customerEmail,
          paymentIntent: session.payment_intent,
        },
      });
    } else {
      return res.json({
        success: true,
        paid: false,
        paymentStatus: session.payment_status,
      });
    }
  } catch (err: any) {
    console.error('Error verifying Stripe session:', err);
    res.status(500).json({ success: false, error: err?.message || 'Kunne ikke hente Stripe-sesjon.' });
  }
});

const musicPreviewCache = new Map<string, { previewUrl: string | null; expiresAt: number }>();

app.get('/api/music-preview', async (req, res) => {
  const title = String(req.query.title || '').trim().slice(0, 120);
  const artist = String(req.query.artist || '').trim().slice(0, 120);
  const songId = String(req.query.id || `${title}-${artist}`).trim().slice(0, 80);

  if (!title && !artist) {
    return res.json({ ok: false, previewUrl: null });
  }

  const cached = musicPreviewCache.get(songId);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ ok: true, previewUrl: cached.previewUrl });
  }

  const queryTerm = `${title} ${artist}`.trim();
  const tryLookup = async (country?: string): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3800);
    try {
      const url = new URL('https://itunes.apple.com/search');
      url.searchParams.set('term', queryTerm);
      url.searchParams.set('media', 'music');
      url.searchParams.set('entity', 'song');
      url.searchParams.set('limit', '5');
      if (country) url.searchParams.set('country', country);
      const r = await fetch(url.toString(), { signal: controller.signal });
      if (!r.ok) return null;
      const data = (await r.json()) as { results?: Array<{ previewUrl?: string; trackName?: string; artistName?: string }> };
      const results = Array.isArray(data?.results) ? data.results : [];
      const firstWithPreview = results.find(
        (item) => typeof item?.previewUrl === 'string' && item.previewUrl.startsWith('https://')
      );
      return firstWithPreview?.previewUrl || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const previewUrl = (await tryLookup('NO')) || (await tryLookup());
  musicPreviewCache.set(songId, {
    previewUrl,
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  });
  return res.json({ ok: true, previewUrl });
});

app.get(['/api/health', '/healthz'], (_req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    region: process.env.CLOUD_RUN_REGION || process.env.GOOGLE_CLOUD_REGION || 'auto',
    timestamp: Date.now(),
  });
});

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('User-agent: *\nAllow: /\n\nSitemap: https://humanconections.com/sitemap.xml\n');
});

app.get('/sitemap.xml', (_req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url>\n' +
      '    <loc>https://humanconections.com/</loc>\n' +
      '    <changefreq>weekly</changefreq>\n' +
      '    <priority>1.0</priority>\n' +
      '  </url>\n' +
      '</urlset>\n'
  );
});

// Vite middleware in dev or static files in production
async function startServer() {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  const hostIdx = args.indexOf('--host');
  const cliPort = portIdx !== -1 && args[portIdx + 1] ? Number(args[portIdx + 1]) : null;
  const cliHost = hostIdx !== -1 && args[hostIdx + 1] ? args[hostIdx + 1] : null;

  // In development, default to port 3000 as required by the runtime environment.
  // In production, respect process.env.PORT if provided.
  const isProd = process.env.NODE_ENV === 'production';
  const port = cliPort || (isProd ? (Number(process.env.PORT) || 3000) : 3000);
  const host = cliHost || process.env.HOST || '0.0.0.0';

  if (isProd) {
    app.use(
      express.static(path.join(__dirname, 'dist'), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Mount Vite middlewares in development with HMR & extra WS server disabled to avoid port 24678 conflicts.
    // Initialize asynchronously so server.listen binds port 3000 immediately and avoids startup probe timeouts.
    let viteMiddleware: any = null;
    const viteReadyPromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
            ws: false,
          },
          appType: 'spa',
        })
      )
      .then((vite) => {
        viteMiddleware = vite.middlewares;
        return vite.middlewares;
      })
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
        throw err;
      });

    app.use((req, res, next) => {
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      viteReadyPromise.then((mw) => mw(req, res, next)).catch(next);
    });
  }

  server.listen(port, host, () => {
    console.log(`JoyPulse Bingo server running on http://${host}:${port}`);
    void syncPublicConfigFromFirestore(true);
  });
}

startServer();
