/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameScreen, GameMode, BingoTheme, BingoCell, Player, CalledBall, CardDisplayMode, BingoMilestone } from './types/bingo';
import { THEMES, JOYFUL_BALLS_MAP, shuffleArray } from './data/prompts';
import { sounds } from './audio/soundEngine';
import { MixerConsoleModal } from './components/MixerConsoleModal';
import { AudienceDisplayModal } from './components/AudienceDisplayModal';
import { DailyQuestsModal } from './components/DailyQuestsModal';
import { ParticleCanvas, ParticleCanvasHandle } from './components/ParticleCanvas';
import { TitleScreen } from './components/TitleScreen';
import { BallCageCanvas } from './components/BallCageCanvas';
import { BingoBoard } from './components/BingoBoard';
import { VictoryModal } from './components/VictoryModal';
import { SocialChatDrawer } from './components/SocialChatDrawer';
import { FriendsDrawer } from './components/FriendsDrawer';
import { CustomCardCreatorModal } from './components/CustomCardCreatorModal';
import { ShareAchievementModal } from './components/ShareAchievementModal';
import { PrintableCardsModal } from './components/PrintableCardsModal';
import { DailyScheduleModal } from './components/DailyScheduleModal';
import { MonetizationModal } from './components/MonetizationModal';
import { monetization } from './services/monetization';
import { OwnerControlModal } from './components/OwnerControlModal';
import { AuthModal } from './components/AuthModal';
import { ReportProblemModal } from './components/ReportProblemModal';
import { WinnerTaskModal } from './components/WinnerTaskModal';
import { IosInstallModal } from './components/IosInstallModal';
import { EventTimeoutModal } from './components/EventTimeoutModal';
import { VippsPaymentModal } from './components/VippsPaymentModal';
import { BroadcastModal } from './components/BroadcastModal';
import { ParticipantsModal } from './components/ParticipantsModal';
import { GoldenCoinLogo } from './components/GoldenCoinLogo';
import { RilMusicPlayer } from './components/RilMusicPlayer';
import { WinnerTask, getWinnerTaskForLines } from './data/winnerTasks';
import { LanguageSelector } from './components/LanguageSelector';
import { useTranslation } from './services/i18n';
import { progression, LevelInfo, DailyQuest } from './services/progression';
import { socialSocket } from './services/socialSocket';
import { ownerControl, SystemAnnouncement } from './services/ownerControl';
import { authService, AuthUser } from './services/authService';
import { sessionTimer } from './services/sessionTimer';
import { RemoteBingoModal } from './components/RemoteBingoModal';
import { QuizGameModal } from './components/QuizGameModal';
import { QuizEdition } from './data/quizQuestions';
import { RemoteBingoClaimModal } from './components/RemoteBingoClaimModal';
import { SecretOwnerLoginModal } from './components/SecretOwnerLoginModal';
import { remoteBingo, RemoteBingoClaim, RemoteParticipant, BingoTvPlayerSummary } from './services/remoteBingo';
import { quizService } from './services/quizService';
import { firebasePersistence } from './services/firebasePersistence';
import { GameModeSelectorModal } from './components/GameModeSelectorModal';
import { MemoryGameModal } from './components/MemoryGameModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TvProjectorScreen } from './components/TvProjectorScreen';

// Generate a 5x5 randomized bingo grid with standard B1-15, I16-30, N31-45, G46-60, O61-75
function generateBingoCard(prompts: string[], isNumerical: boolean = true): BingoCell[][] {
  const letters: ('B' | 'I' | 'N' | 'G' | 'O')[] = ['B', 'I', 'N', 'G', 'O'];

  // Standard B1-15, I16-30, N31-45, G46-60, O61-75 unique numbers
  const bPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 1)).slice(0, 5);
  const iPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 16)).slice(0, 5);
  const nPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 31)).slice(0, 4);
  const gPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 46)).slice(0, 5);
  const oPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 61)).slice(0, 5);

  const promptsShuffled = shuffleArray(prompts);
  const card: BingoCell[][] = [];

  let pIdx = 0;
  for (let r = 0; r < 5; r++) {
    const row: BingoCell[] = [];
    for (let c = 0; c < 5; c++) {
      const isCenter = r === 2 && c === 2;
      const letter = letters[c];

      let number = 0;
      if (c === 0) number = bPool[r];
      else if (c === 1) number = iPool[r];
      else if (c === 2) number = isCenter ? 38 : nPool[r > 2 ? r - 1 : r];
      else if (c === 3) number = gPool[r];
      else number = oPool[r];

      const ballData = JOYFUL_BALLS_MAP.find((b) => b.number === number);
      const affirmation = ballData ? ballData.affirmation : 'Joyful Light';
      const promptText = promptsShuffled.length > 0 ? promptsShuffled[pIdx % promptsShuffled.length] : affirmation;
      pIdx++;

      if (isCenter) {
        row.push({
          id: `cell-${r}-${c}`,
          row: r,
          col: c,
          text: 'GRATIS GNIST',
          letter: 'N',
          number: 38,
          isFreeSpace: true,
          isMarked: true,
        });
      } else {
        row.push({
          id: `cell-${r}-${c}`,
          row: r,
          col: c,
          text: promptText,
          letter,
          number,
          isFreeSpace: false,
          isMarked: false,
        });
      }
    }
    card.push(row);
  }
  return card;
}

function isCellBallDrawn(cell: BingoCell, calledBalls: CalledBall[]): boolean {
  if (cell.isFreeSpace) return true;
  return calledBalls.some(
    (b) =>
      (b.letter === cell.letter && b.number === cell.number) ||
      (Boolean(b.affirmation) &&
        Boolean(cell.text) &&
        b.affirmation.trim().toLowerCase() === cell.text.trim().toLowerCase())
  );
}

// Check for win patterns (rows, columns, diagonals) and Fullbrett (all 25 physically confirmed)
function evaluateBoardWins(card: BingoCell[][], calledBalls?: CalledBall[]): {
  hasBingo: boolean;
  isFullHouse: boolean;
  winningCoords: { row: number; col: number }[];
  completedLines: number;
} {
  const coords: { row: number; col: number }[] = [];
  let completedLines = 0;

  const isConfirmedCell = (cell: BingoCell) =>
    cell.isFreeSpace ||
    (cell.isMarked && (!calledBalls || isCellBallDrawn(cell, calledBalls)));

  // Check 5 rows (vannrett)
  for (let r = 0; r < 5; r++) {
    if (card[r].every((c) => isConfirmedCell(c))) {
      completedLines++;
      for (let c = 0; c < 5; c++) coords.push({ row: r, col: c });
    }
  }

  // Check 5 columns (loddrett)
  for (let c = 0; c < 5; c++) {
    if (card.every((r) => isConfirmedCell(r[c]))) {
      completedLines++;
      for (let r = 0; r < 5; r++) coords.push({ row: r, col: c });
    }
  }

  // Check main diagonal (kryssende)
  if ([0, 1, 2, 3, 4].every((i) => isConfirmedCell(card[i][i]))) {
    completedLines++;
    for (let i = 0; i < 5; i++) coords.push({ row: i, col: i });
  }

  // Check anti-diagonal (kryssende)
  if ([0, 1, 2, 3, 4].every((i) => isConfirmedCell(card[i][4 - i]))) {
    completedLines++;
    for (let i = 0; i < 5; i++) coords.push({ row: i, col: 4 - i });
  }

  const isFullHouse = card.length === 5 && card.every((row) => row.every((cell) => isConfirmedCell(cell)));

  return {
    hasBingo: completedLines > 0,
    isFullHouse,
    winningCoords: coords,
    completedLines,
  };
}

interface EligibleBingoClaim {
  milestone: BingoMilestone;
  pattern: '1. REKKE' | '3. REKKER' | 'FULLBRETT';
  isFullHouse: boolean;
  cardIndex: number;
  label: string;
  confirmedNumbers: number[];
}

function getEligibleBingoClaimForPlayer(
  player: Player | undefined,
  calledBalls: CalledBall[]
): EligibleBingoClaim | null {
  if (!player || !player.cards || player.cards.length === 0) return null;
  const claimed = player.claimedMilestones || [];

  let bestFullCardIdx = -1;
  let bestFullNumbers: number[] = [];
  let bestThreeCardIdx = -1;
  let bestThreeNumbers: number[] = [];
  let bestOneCardIdx = -1;
  let bestOneNumbers: number[] = [];

  player.cards.forEach((card, cIdx) => {
    const res = evaluateBoardWins(card, calledBalls);
    const winningNums = Array.from(
      new Set(
        res.winningCoords
          .map(({ row, col }) => card[row]?.[col]?.number)
          .filter((n): n is number => typeof n === 'number')
      )
    );
    const allCardNums = card
      .flat()
      .filter((cell) => !cell.isFreeSpace && cell.isMarked && isCellBallDrawn(cell, calledBalls))
      .map((cell) => cell.number)
      .filter((n): n is number => typeof n === 'number');

    if (res.isFullHouse && bestFullCardIdx === -1) {
      bestFullCardIdx = cIdx;
      bestFullNumbers = allCardNums;
    }
    if (res.completedLines >= 3 && bestThreeCardIdx === -1) {
      bestThreeCardIdx = cIdx;
      bestThreeNumbers = winningNums.length >= 12 ? winningNums : allCardNums;
    }
    if (res.completedLines >= 1 && bestOneCardIdx === -1) {
      bestOneCardIdx = cIdx;
      bestOneNumbers = winningNums.length >= 4 ? winningNums : allCardNums;
    }
  });

  if (bestFullCardIdx !== -1 && !claimed.includes('fullbrett')) {
    return {
      milestone: 'fullbrett',
      pattern: 'FULLBRETT',
      isFullHouse: true,
      cardIndex: bestFullCardIdx,
      label: '🏆 Rop BINGO! (Full brett)',
      confirmedNumbers: bestFullNumbers,
    };
  }

  if (bestThreeCardIdx !== -1 && !claimed.includes('line3')) {
    return {
      milestone: 'line3',
      pattern: '3. REKKER',
      isFullHouse: false,
      cardIndex: bestThreeCardIdx,
      label: '🎉 Rop BINGO! (3. rekker)',
      confirmedNumbers: bestThreeNumbers,
    };
  }

  if (bestOneCardIdx !== -1 && !claimed.includes('line1')) {
    return {
      milestone: 'line1',
      pattern: '1. REKKE',
      isFullHouse: false,
      cardIndex: bestOneCardIdx,
      label: '🎉 Rop BINGO! (1. rekke)',
      confirmedNumbers: bestOneNumbers,
    };
  }

  return null;
}

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [mode, setMode] = useState<GameMode>('ALL_IN_ONE');
  const [unifiedView, setUnifiedView] = useState<'both' | 'cards' | 'stage'>('both');
  const [theme, setTheme] = useState<BingoTheme>('classic_joy');
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>('numbers');
  const [numCardsPerPlayer, setNumCardsPerPlayer] = useState<number>(1);
  const [viewAllCards, setViewAllCards] = useState<boolean>(true);
  const [scrambleTrigger, setScrambleTrigger] = useState<number>(0);
  const [bannedNotice, setBannedNotice] = useState<string | null>(null);
  const detectPlayDeviceFromWidth = (): 'mobile' | 'desktop' | 'big_screen' => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth >= 1600) return 'big_screen';
    return 'desktop';
  };
  const userPickedPlayScreenRef = useRef<boolean>(false);
  const [screenDevice, setScreenDevice] = useState<'mobile' | 'desktop' | 'big_screen'>(() =>
    detectPlayDeviceFromWidth()
  );
  const [mobileShowBlender, setMobileShowBlender] = useState<boolean>(true);
  const [isPlayToolsOpen, setIsPlayToolsOpen] = useState<boolean>(false);
  const playToolsRef = useRef<HTMLDivElement | null>(null);
  const [isPlayScreenMenuOpen, setIsPlayScreenMenuOpen] = useState<boolean>(false);
  const playScreenRef = useRef<HTMLDivElement | null>(null);
  const [isPlayQuizMenuOpen, setIsPlayQuizMenuOpen] = useState<boolean>(false);
  const playQuizRef = useRef<HTMLDivElement | null>(null);

  // Players state (each player has cards: BingoCell[][][])
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Ball Cage State (for caller mode)
  const [calledBalls, setCalledBalls] = useState<CalledBall[]>([]);
  const [uncalledBalls, setUncalledBalls] = useState<CalledBall[]>(() =>
    shuffleArray(
      JOYFUL_BALLS_MAP.map((b) => ({
        ...b,
        timestamp: Date.now(),
      }))
    )
  );
  const [isAutoCalling, setIsAutoCalling] = useState(false);

  // Modals & Drawers state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [isOwnerControlOpen, setIsOwnerControlOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isIosInstallOpen, setIsIosInstallOpen] = useState(false);
  const [isEventTimeoutOpen, setIsEventTimeoutOpen] = useState(false);
  const [isVippsModalOpen, setIsVippsModalOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isRemoteBingoOpen, setIsRemoteBingoOpen] = useState(false);
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [quizInitialEdition, setQuizInitialEdition] = useState<QuizEdition>('adult');
  const [quizInitialTab, setQuizInitialTab] = useState<'host' | 'big_screen' | 'team_play' | 'join' | undefined>(undefined);
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [remoteBingoClaim, setRemoteBingoClaim] = useState<RemoteBingoClaim | null>(null);
  const [hostJoinNotice, setHostJoinNotice] = useState<string | null>(null);
  const [roundResetNotice, setRoundResetNotice] = useState<string | null>(null);
  const [cardActionNotice, setCardActionNotice] = useState<{ text: string; tone: 'warn' | 'ready' } | null>(null);
  const cardNoticeTimerRef = useRef<number | null>(null);
  const [bingoRoundNumber, setBingoRoundNumber] = useState<number>(() => remoteBingo.getRoundNumber());
  const [remoteParticipantsList, setRemoteParticipantsList] = useState<RemoteParticipant[]>(() =>
    remoteBingo.getConnectedRemotePlayers()
  );
  const [tvPlayersSummaryList, setTvPlayersSummaryList] = useState<BingoTvPlayerSummary[]>(() =>
    remoteBingo.getTvState()?.playersSummary || []
  );
  const [copiedActiveShareLink, setCopiedActiveShareLink] = useState<boolean>(false);
  const [copiedActiveRoomCode, setCopiedActiveRoomCode] = useState<boolean>(false);
  const [tvModeConfig, setTvModeConfig] = useState<{
    active: boolean;
    game: 'bingo' | 'quiz' | 'auto';
    code: string;
  } | null>(null);

  const handleOpenPaymentGuarded = useCallback(() => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    if (!user.isAuthenticated && !isOwner) {
      sounds.playClick();
      setIsAuthOpen(true);
      return;
    }
    setIsVippsModalOpen(true);
  }, []);

  const handleOpenGameSelectorGuarded = useCallback(() => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    if (!user.isAuthenticated && !isOwner) {
      sounds.playClick();
      setIsAuthOpen(true);
      return;
    }
    if (!isOwner && !sessionTimer.hasFullPaidAccess()) {
      sounds.playClick();
      setIsVippsModalOpen(true);
      return;
    }
    setIsGameSelectorOpen(true);
  }, []);

  const handleOpenQuiz = (
    edition: QuizEdition = 'adult',
    tab?: 'host' | 'big_screen' | 'team_play' | 'join'
  ) => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    const isJoiningWithCode = tab === 'join' || quizService.getIsRemoteParticipant();

    if (!isJoiningWithCode && !isOwner) {
      if (!user.isAuthenticated) {
        sounds.playClick();
        setIsAuthOpen(true);
        return;
      }
      if (!sessionTimer.hasFullPaidAccess()) {
        sounds.playClick();
        setIsVippsModalOpen(true);
        return;
      }
    }

    setQuizInitialEdition(edition);
    setQuizInitialTab(tab);
    setIsQuizModalOpen(true);
  };

  const handleOpenMemoryGuarded = useCallback(() => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    if (!user.isAuthenticated && !isOwner) {
      sounds.playClick();
      setIsAuthOpen(true);
      return;
    }
    if (!isOwner && !sessionTimer.hasFullPaidAccess()) {
      sounds.playClick();
      setIsVippsModalOpen(true);
      return;
    }
    setIsMemoryModalOpen(true);
  }, []);
  const [isSecretOwnerLoginOpen, setIsSecretOwnerLoginOpen] = useState(false);
  const [timeWarningNotice, setTimeWarningNotice] = useState<string | null>(null);
  const [sessionPlayerNames, setSessionPlayerNames] = useState<string[]>(['Spiller 1']);
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const timeoutHandledRef = useRef(false);
  const [stripePaymentNotice, setStripePaymentNotice] = useState<{
    isOpen: boolean;
    amount: number;
    label: string;
    reference: string;
  } | null>(null);
  const [pendingGameStart, setPendingGameStart] = useState<{
    chosenMode: GameMode;
    chosenTheme: BingoTheme;
    playerCount: number;
    cardsCount: number;
    initialDisplayMode: CardDisplayMode;
    customPlayerNames?: string[];
    targetScreenDevice?: 'mobile' | 'desktop' | 'big_screen';
  } | null>(null);

  // Strictly guard Storskjerm: require mandatory login & paid session (free for Owner), and NEVER allow remote participants
  const handleOpenAudience = () => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();

    if (remoteBingo.getIsRemotePlayer() && !isOwner) {
      return;
    }

    if (!user.isAuthenticated && !isOwner) {
      sounds.playClick();
      setIsAuthOpen(true);
      return;
    }

    if (!isOwner && !sessionTimer.hasPaidAccess()) {
      sounds.playClick();
      setIsVippsModalOpen(true);
      return;
    }

    if (!remoteBingo.getIsRemotePlayer() && sessionTimer.hasFullPaidAccess()) {
      remoteBingo.activateHostSession(undefined, user.name);
    }

    if (players.length === 0 || (calledBalls.length === 0 && uncalledBalls.length === 0)) {
      handleStartGame(mode, theme, players.length || 2, numCardsPerPlayer, displayMode, undefined, 'big_screen');
      return;
    }

    userPickedPlayScreenRef.current = true;
    setScreenDevice('big_screen');
    setIsAudienceOpen(true);
  };
  const [winnerModalTask, setWinnerModalTask] = useState<{
    isOpen: boolean;
    winnerName: string;
    linesCount: number;
    isFullHouse?: boolean;
    task: WinnerTask;
  } | null>(null);

  const showCardActionNotice = useCallback((text: string, tone: 'warn' | 'ready' = 'warn') => {
    setCardActionNotice({ text, tone });
    if (cardNoticeTimerRef.current) {
      window.clearTimeout(cardNoticeTimerRef.current);
    }
    cardNoticeTimerRef.current = window.setTimeout(() => {
      setCardActionNotice(null);
      cardNoticeTimerRef.current = null;
    }, 4500);
  }, []);
  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => ownerControl.isUnlocked());
  const [isRemoteBingoParticipant, setIsRemoteBingoParticipant] = useState<boolean>(() =>
    remoteBingo.getIsRemotePlayer()
  );
  const isOwnerActive = (authUser.isAuthenticated && authUser.role === 'owner') || isOwnerUnlocked;
  const isRemoteParticipant = isRemoteBingoParticipant && !isOwnerActive;
  const canHostDrawBalls =
    !isRemoteParticipant && (isOwnerActive || (authUser.isAuthenticated && sessionTimer.hasPaidAccess()));
  const calledBallsRef = useRef<CalledBall[]>(calledBalls);
  const themeRef = useRef<BingoTheme>(theme);
  const displayModeRef = useRef<CardDisplayMode>(displayMode);
  const isAudienceOpenRef = useRef<boolean>(isAudienceOpen);
  const screenDeviceRef = useRef<'mobile' | 'desktop' | 'big_screen'>(screenDevice);
  const localNewRoundFallbackTimerRef = useRef<number | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState<SystemAnnouncement | null>(() =>
    ownerControl.getActiveAnnouncement()
  );
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Progression & Points State
  const [playerStats, setPlayerStats] = useState(progression.getStats());
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(progression.getDailyQuests());
  const [levelUpToast, setLevelUpToast] = useState<LevelInfo | null>(null);
  const [questToast, setQuestToast] = useState<DailyQuest | null>(null);

  // Particle Canvas Ref
  const particleRef = useRef<ParticleCanvasHandle | null>(null);

  // Start a new round locally (dealing fresh cards & resetting balls)
  const applyLocalNewRoundReset = useCallback(() => {
    if (localNewRoundFallbackTimerRef.current) {
      window.clearTimeout(localNewRoundFallbackTimerRef.current);
      localNewRoundFallbackTimerRef.current = null;
    }
    const chosenTheme = themeRef.current || 'classic_joy';
    const themePrompts = THEMES[chosenTheme]?.prompts?.length > 0
      ? THEMES[chosenTheme].prompts
      : THEMES.heartfelt.prompts;
    const isNumerical =
      displayModeRef.current === 'numbers' ||
      displayModeRef.current === 'both' ||
      chosenTheme === 'classic_joy';

    setIsAutoCalling(false);
    setCalledBalls([]);
    setUncalledBalls(
      shuffleArray(
        JOYFUL_BALLS_MAP.map((b) => ({
          ...b,
          timestamp: Date.now(),
        }))
      )
    );
    setRemoteBingoClaim(null);
    setWinnerModalTask(null);
    setCardActionNotice(null);
    setScreen((prev) => (prev === 'VICTORY' ? 'PLAYING' : prev));
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        linesCompleted: 0,
        hasBingo: false,
        claimedMilestones: [],
        cards: p.cards.map(() => generateBingoCard(themePrompts, isNumerical)),
      }))
    );
  }, []);

  const triggerFullbrettClaimAndRound = useCallback((
    winnerName: string,
    cardIndex: number = 0,
    confirmedNumbers?: number[]
  ) => {
    const inOnlineOrBigScreen = Boolean(
      remoteBingo.getCurrentRoomCode() ||
      remoteBingo.getHostCode() ||
      isAudienceOpenRef.current ||
      screenDeviceRef.current === 'big_screen'
    );
    if (inOnlineOrBigScreen) {
      remoteBingo.claimBingo('FULLBRETT', cardIndex, true, winnerName, confirmedNumbers);
      if (!socialSocket.getIsConnected() && !remoteBingo.getIsRemotePlayer()) {
        if (!localNewRoundFallbackTimerRef.current) {
          localNewRoundFallbackTimerRef.current = window.setTimeout(() => {
            localNewRoundFallbackTimerRef.current = null;
            applyLocalNewRoundReset();
            setBingoRoundNumber((r) => r + 1);
            setRoundResetNotice(`🔄 Ny runde startet etter Fullbrett BINGO av ${winnerName}!`);
            window.setTimeout(() => setRoundResetNotice(null), 4500);
          }, 4500);
        }
      }
      return true;
    }
    return false;
  }, [applyLocalNewRoundReset]);

  // Ball drawn in caller mode, blender, or remote sync — NO auto-marking! Participants must physically confirm drawn balls on their own card.
  const handleBallDrawn = useCallback((ball: CalledBall, broadcast: boolean = true) => {
    if (broadcast) {
      const curUser = authService.getCurrentUser();
      const isOwner = curUser.role === 'owner' || ownerControl.isUnlocked();
      const isRemote = remoteBingo.getIsRemotePlayer();
      const hasPaidOrOwner = isOwner || (curUser.isAuthenticated && sessionTimer.hasPaidAccess());
      if ((isRemote && !isOwner) || !hasPaidOrOwner) {
        return;
      }
    }

    setCalledBalls((prev) => {
      const withoutSame = prev.filter((b) => !(b.letter === ball.letter && b.number === ball.number));
      return [...withoutSame, ball];
    });

    setUncalledBalls((prev) =>
      prev.filter((b) => !(b.letter === ball.letter && b.number === ball.number))
    );

    // Audio announcement & speech callout
    sounds.playBallDrop();
    sounds.speakBall(ball.letter, ball.number, ball.affirmation);

    // Broadcast & analytics only when initiated by host
    if (broadcast) {
      progression.recordHostBallDrawn();
      ownerControl.recordBallDrawn();
      remoteBingo.broadcastBallToRoom(ball);
    }
  }, []);

  // Initialize socket and progression listener
  useEffect(() => {
    const initialSearch = typeof window !== 'undefined' ? window.location.search : '';
    const startsInTvMode = initialSearch.includes('tv=1') || initialSearch.includes('storskjerm=tv');
    if (!startsInTvMode) {
      socialSocket.connect();
    }

    const unsubProgression = progression.subscribe((stats, leveledUp, completedQuest) => {
      setPlayerStats(stats);
      setDailyQuests(progression.getDailyQuests());
      if (leveledUp) {
        sounds.playLineComplete();
        setLevelUpToast(leveledUp);
        particleRef.current?.celebrateBingo();
        setTimeout(() => setLevelUpToast(null), 4500);
      }
      if (completedQuest) {
        sounds.playLineComplete();
        setQuestToast(completedQuest);
        particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.4, 22);
        setTimeout(() => setQuestToast(null), 4500);
      }
    });

    // Listen for room ball sync when participating in a remote host room
    const unsubBall = socialSocket.on('caller:sync_ball', (payload: unknown) => {
      if (!remoteBingo.getIsRemotePlayer()) return;
      const ball = payload as CalledBall;
      if (ball && typeof ball.number === 'number') {
        handleBallDrawn(ball, false);
      }
    });

    const unsubRemoteState = remoteBingo.subscribe(() => {
      setIsRemoteBingoParticipant(remoteBingo.getIsRemotePlayer());
      setRemoteParticipantsList([...remoteBingo.getConnectedRemotePlayers()]);
      setTvPlayersSummaryList([...(remoteBingo.getTvState()?.playersSummary || [])]);
      setBingoRoundNumber(remoteBingo.getRoundNumber());
    });

    const unsubHostParticipantJoin = remoteBingo.onParticipantJoined((p, total) => {
      if (remoteBingo.getIsRemotePlayer() || !remoteBingo.canActAsHost()) return;
      const activeCode = remoteBingo.getHostCode();
      const connectedCount = remoteBingo.getConnectedRemotePlayers().length;
      sounds.playPop(1.25);
      setHostJoinNotice(
        `👋 ${p.name} ble med med kode${activeCode ? ` ${activeCode}` : ''}! (${connectedCount || total} på mobil/nett)`
      );
      setTimeout(() => setHostJoinNotice(null), 5500);
    });

    const unsubBanned = socialSocket.on('user:banned', (payload: unknown) => {
      const data = payload as { reason?: string };
      setBannedNotice(data.reason || 'You have been removed from this game session for disturbing social wellbeing.');
    });

    const unsubOwner = ownerControl.subscribe(() => {
      setIsOwnerUnlocked(ownerControl.isUnlocked());
      setActiveAnnouncement(ownerControl.getActiveAnnouncement());
    });

    const unsubAuth = authService.subscribe(() => {
      const u = authService.getCurrentUser();
      setAuthUser(u);
    });

    const evaluateSessionState = () => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      const curUser = authService.getCurrentUser();
      const isOwner = curUser.role === 'owner' || ownerControl.isUnlocked();

      // Eier / Admin skal aldri stenges ute av timeout!
      if (isOwner) {
        timeoutHandledRef.current = false;
        setIsEventTimeoutOpen(false);
        setTimeWarningNotice(null);
        return;
      }

      const remainingMs = sessionTimer.getRemainingMs();

      // Advarsel før spilletiden er over (5 minutter og 1 minutt)
      if (!sessionTimer.isExpired() && sessionTimer.hasPaidAccess() && !remoteBingo.getIsRemotePlayer()) {
        if (remainingMs <= 60 * 1000 && remainingMs > 0) {
          setTimeWarningNotice(`🚨 Siste minutt! Spillet avsluttes og vert/spiller logges automatisk ut om ${Math.ceil(remainingMs / 1000)}s.`);
        } else if (remainingMs <= 5 * 60 * 1000 && remainingMs > 0) {
          setTimeWarningNotice(`⚠️ Kun ${sessionTimer.getFormattedRemaining()} igjen av spilletiden! Verten og spillere logges automatisk ut ved 00:00.`);
        } else {
          setTimeWarningNotice(null);
        }
      } else {
        setTimeWarningNotice(null);
      }

      // Automatisk utlogging når betalt pakketid har løpt ut til 00:00:00
      if (sessionTimer.hasTimedOut()) {
        setTimeWarningNotice(null);
        if (!timeoutHandledRef.current) {
          timeoutHandledRef.current = true;
          if (curUser.isAuthenticated) {
            authService.logout();
          }
          if (quizService.getIsHost()) {
            quizService.leaveQuiz();
          }
          if (!remoteBingo.getIsRemotePlayer() && remoteBingo.getIsHost()) {
            remoteBingo.leaveRemoteSession();
          }
          setIsQuizModalOpen(false);
          setIsRemoteBingoOpen(false);
          setIsAudienceOpen(false);
          setIsGameSelectorOpen(false);
          setIsMixerOpen(false);
          setIsBroadcastOpen(false);
          setIsParticipantsOpen(false);
          setIsVippsModalOpen(false);
          setScreen('TITLE');
          setIsEventTimeoutOpen(true);
        }
      } else {
        timeoutHandledRef.current = false;
      }
    };

    evaluateSessionState();
    const unsubSession = sessionTimer.subscribe(evaluateSessionState);

    const unsubRemoteClaim = remoteBingo.onClaim((claim) => {
      setRemoteBingoClaim(claim);
    });

    const unsubNewRound = remoteBingo.onNewRound((ev) => {
      applyLocalNewRoundReset();
      setBingoRoundNumber(ev.roundNumber);
      sounds.playPop(1.3);
      setRoundResetNotice(
        ev.winnerName
          ? `🔄 Runde ${ev.roundNumber} startet automatisk etter Fullbrett BINGO av ${ev.winnerName}!`
          : `🔄 Ny bingorunde (Runde ${ev.roundNumber}) er startet!`
      );
      window.setTimeout(() => setRoundResetNotice(null), 5500);
    });

    const unsubSyncReq = remoteBingo.onSyncRequest((requesterId) => {
      remoteBingo.provideBallSyncToRoom(calledBallsRef.current, requesterId);
    });

    const unsubClaimRejected = socialSocket.on('bingo:claim_rejected', (payload: unknown) => {
      const data = payload as { message?: string };
      sounds.playClick();
      showCardActionNotice(
        data?.message || 'Alle tall i rekken må være trukket og bekreftet før du kan rope BINGO!',
        'warn'
      );
    });

    const unsubSyncProvided = remoteBingo.onSyncProvided((balls) => {
      if (!remoteBingo.getIsRemotePlayer() || balls.length === 0) return;
      setCalledBalls((prev) => {
        const existingKeys = new Set(prev.map((b) => `${b.letter}-${b.number}`));
        const additions = balls.filter((b) => !existingKeys.has(`${b.letter}-${b.number}`));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
      setUncalledBalls((prev) =>
        prev.filter((b) => !balls.some((sb) => sb.letter === b.letter && sb.number === b.number))
      );
    });

    // Global hemmelig snarvei for eier: Shift + E (kun utenfor tekstfelt og aldri for deltakere)
    const handleGlobalSecretKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if (
        isTyping ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        remoteBingo.getIsRemotePlayer() ||
        quizService.getIsRemoteParticipant()
      ) {
        return;
      }

      if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        sounds.playLineComplete();
        setIsSecretOwnerLoginOpen(true);
      }
    };

    const handleResize = () => {
      if (!userPickedPlayScreenRef.current) {
        setScreenDevice(detectPlayDeviceFromWidth());
      }
    };
    const handleClickOutsideTools = (e: MouseEvent) => {
      if (playToolsRef.current && !playToolsRef.current.contains(e.target as Node)) {
        setIsPlayToolsOpen(false);
      }
      if (playScreenRef.current && !playScreenRef.current.contains(e.target as Node)) {
        setIsPlayScreenMenuOpen(false);
      }
      if (playQuizRef.current && !playQuizRef.current.contains(e.target as Node)) {
        setIsPlayQuizMenuOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      document.addEventListener('mousedown', handleClickOutsideTools);
      window.addEventListener('keydown', handleGlobalSecretKey);
      const urlParams = new URLSearchParams(window.location.search);
      const hasInviteCode = urlParams.has('kode') || urlParams.has('code') || urlParams.has('join');

      if (
        !hasInviteCode &&
        !remoteBingo.getIsRemotePlayer() &&
        !quizService.getIsRemoteParticipant() &&
        (window.location.search.includes('eier=true') || window.location.search.includes('admin=2026'))
      ) {
        setIsSecretOwnerLoginOpen(true);
      }

      // Single-URL support for Privacy Policy (?personvern=true or /personvern)
      if (window.location.pathname === '/personvern' || urlParams.has('personvern')) {
        setIsPrivacyOpen(true);
        window.history.replaceState({}, document.title, '/');
      }

      // Dedicated TV / Projector / Storskjerm view (?tv=1&spill=quiz|bingo&kode=XYZ)
      const isTvParam = urlParams.get('tv') === '1' || urlParams.get('storskjerm') === 'tv';
      if (isTvParam) {
        const gameTarget = (urlParams.get('spill') || urlParams.get('game') || '').toLowerCase();
        const tvGame: 'bingo' | 'quiz' | 'auto' =
          gameTarget === 'bingo' || gameTarget === 'remote'
            ? 'bingo'
            : gameTarget === 'quiz'
            ? 'quiz'
            : 'auto';
        const tvCode = (urlParams.get('kode') || urlParams.get('code') || '').trim().toUpperCase();
        setTvModeConfig({ active: true, game: tvGame, code: tvCode });
        window.history.replaceState({}, document.title, '/?tv=1');
      } else {
        // Single-URL Kahoot-style invite link support (?kode=XYZ&spill=quiz|bingo&utgave=family|christmas|adult)
        const inviteCodeRaw = urlParams.get('kode') || urlParams.get('code') || urlParams.get('join');
        if (inviteCodeRaw && inviteCodeRaw.trim()) {
          const cleanInviteCode = inviteCodeRaw.trim().toUpperCase();
          const gameTarget = (urlParams.get('spill') || urlParams.get('game') || '').toLowerCase();
          const editionParam = urlParams.get('utgave') || urlParams.get('edition');
          const validEdition: QuizEdition =
            editionParam === 'adult' || editionParam === 'family' || editionParam === 'christmas'
              ? editionParam
              : 'family';

          setPendingJoinCode(cleanInviteCode);
          if (gameTarget === 'bingo' || gameTarget === 'remote') {
            setIsRemoteBingoOpen(true);
          } else if (gameTarget === 'quiz') {
            setQuizInitialEdition(validEdition);
            setQuizInitialTab('join');
            setIsQuizModalOpen(true);
          } else {
            fetch(`/api/rooms/validate?type=any&code=${encodeURIComponent(cleanInviteCode)}`, {
              cache: 'no-store',
            })
              .then(async (r) => {
                const info = r.ok ? await r.json() : null;
                if (info?.valid) return info;
                const cloud = await firebasePersistence.getActiveRoomFromFirestore(cleanInviteCode);
                return cloud ? { valid: true, activeGame: cloud.activeGame || 'bingo' } : null;
              })
              .then((info) => {
                if (info?.activeGame === 'bingo') {
                  setIsRemoteBingoOpen(true);
                } else {
                  setQuizInitialEdition(validEdition);
                  setQuizInitialTab('join');
                  setIsQuizModalOpen(true);
                }
              })
              .catch(() => {
                setQuizInitialEdition(validEdition);
                setQuizInitialTab('join');
                setIsQuizModalOpen(true);
              });
          }
          window.history.replaceState({}, document.title, '/');
        }
      }

      // Check for Stripe Checkout return
      const stripeStatus = urlParams.get('stripe_status');
      const stripeSessionId = urlParams.get('session_id');

      if (stripeStatus === 'success' && stripeSessionId) {
        fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(stripeSessionId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.paid) {
              const minutes = Number(data.session?.minutes) || 120;
              const packageLabel = data.session?.packageLabel || `${minutes} minutter spilletid`;
              const grossAmount = data.session?.amount || 89;

              if (sessionTimer.hasPaidAccess()) {
                sessionTimer.extendSession(minutes, packageLabel);
              } else {
                sessionTimer.activatePaidSession(minutes, packageLabel);
              }

              const ref = `STRIPE-${stripeSessionId.slice(-8).toUpperCase()}`;
              const stripePayerName = data.session?.payerName || 'Stripe-arrangør';
              const activeUser = authService.ensureAuthenticatedFromPayment(
                stripePayerName,
                data.session?.customerEmail || data.session?.payerEmail
              );
              remoteBingo.setHostName(activeUser.name);
              remoteBingo.activateHostSession(undefined, activeUser.name);

              monetization.recordTransaction({
                type: 'event_pass',
                title: `Ekte Stripe-betaling: ${packageLabel}`,
                grossAmount,
                commissionAmount: Math.round(grossAmount * 0.85),
                playerCount: 1,
                paymentMethod: 'stripe',
                payerName: activeUser.name || stripePayerName,
                reference: ref,
              });

              sounds.playBingoWin();
              setStripePaymentNotice({
                isOpen: true,
                amount: grossAmount,
                label: packageLabel,
                reference: ref,
              });
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch((err) => {
            console.error('Kunne ikke verifisere Stripe-betaling:', err);
          });
      } else if (stripeStatus === 'cancelled') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => {
      unsubProgression();
      unsubBall();
      unsubRemoteState();
      unsubHostParticipantJoin();
      unsubBanned();
      unsubOwner();
      unsubAuth();
      unsubSession();
      unsubRemoteClaim();
      unsubNewRound();
      unsubSyncReq();
      unsubClaimRejected();
      unsubSyncProvided();
      if (cardNoticeTimerRef.current) {
        window.clearTimeout(cardNoticeTimerRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousedown', handleClickOutsideTools);
        window.removeEventListener('keydown', handleGlobalSecretKey);
      }
    };
  }, [handleBallDrawn, applyLocalNewRoundReset, showCardActionNotice]);

  useEffect(() => {
    calledBallsRef.current = calledBalls;
  }, [calledBalls]);

  useEffect(() => {
    themeRef.current = theme;
    displayModeRef.current = displayMode;
    isAudienceOpenRef.current = isAudienceOpen;
    screenDeviceRef.current = screenDevice;
  }, [theme, displayMode, isAudienceOpen, screenDevice]);

  // Sørg for at betalt arrangør eller eier ALLTID har sin kode aktivert og registrert på serveren (uten 1s WS-spam)
  useEffect(() => {
    if (tvModeConfig?.active) return;
    if (isRemoteParticipant) return;
    const hasFullPaidOrOwner =
      isOwnerActive || (authUser.isAuthenticated && sessionTimer.hasFullPaidAccess());
    if (!hasFullPaidOrOwner) return;

    const hostProfileName =
      (authUser.isAuthenticated && authUser.name && authUser.name !== 'Gjest' ? authUser.name : '') ||
      remoteBingo.getHostName();
    remoteBingo.activateHostSession(undefined, hostProfileName);

    const heartbeatTimer = window.setInterval(() => {
      if (remoteBingo.canActAsHost() && !remoteBingo.getIsRemotePlayer()) {
        remoteBingo.heartbeatHostSession(hostProfileName);
      }
    }, 25000);

    return () => window.clearInterval(heartbeatTimer);
  }, [
    tvModeConfig?.active,
    isRemoteParticipant,
    isOwnerActive,
    authUser.isAuthenticated,
    authUser.name,
  ]);

  // Sync live Bingo state to connected Storskjerm / TV screens
  useEffect(() => {
    if (canHostDrawBalls && (screen === 'PLAYING' || screen === 'VICTORY')) {
      remoteBingo.syncTvStateToRoom({
        calledBalls,
        players,
        themeTitle: THEMES[theme]?.title || 'Joy Bingo',
      });
    }
  }, [canHostDrawBalls, screen, calledBalls, players, theme]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if (isTyping || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const isOwner = authService.getCurrentUser().role === 'owner' || ownerControl.isUnlocked();
      const canControlHost = !remoteBingo.getIsRemotePlayer() || isOwner;

      if (e.key === 'm' || e.key === 'M') {
        const muted = sounds.toggleMute();
        setIsMuted(muted);
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsQuestsOpen((prev) => !prev);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsScheduleOpen((prev) => !prev);
      } else if ((e.key === 'a' || e.key === 'A') && canControlHost) {
        if (isAudienceOpen) {
          setIsAudienceOpen(false);
        } else {
          handleOpenAudience();
        }
      } else if ((e.key === 'x' || e.key === 'X') && canControlHost) {
        setIsMixerOpen((prev) => !prev);
      } else if ((e.key === 's' || e.key === 'S') && canControlHost) {
        handleTriggerAgitateMix(1.3);
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (screen === 'PLAYING') setScreen('PAUSED');
        else if (screen === 'PAUSED') setScreen('PLAYING');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isAudienceOpen]);

  // Pause session timer during game pauses
  useEffect(() => {
    if (screen === 'PAUSED') {
      sessionTimer.pauseSession();
    } else if (screen === 'PLAYING') {
      sessionTimer.resumeSession();
    }
  }, [screen]);

  // Draw ball for audience screen (Host/Arrangør only)
  const handleDrawNextBallForAudience = () => {
    const isOwner = authService.getCurrentUser().role === 'owner' || ownerControl.isUnlocked();
    if (remoteBingo.getIsRemotePlayer() && !isOwner) return;
    if (!isOwner && (!authService.getCurrentUser().isAuthenticated || !sessionTimer.hasPaidAccess())) return;
    if (uncalledBalls.length === 0) return;
    const randomIndex = Math.floor(Math.random() * uncalledBalls.length);
    const chosen = uncalledBalls[randomIndex];
    handleBallDrawn(chosen);
  };

  const handleShuffleBalls = useCallback(() => {
    setUncalledBalls((prev) => shuffleArray([...prev]));
    sounds.playPop(1.3);
  }, []);

  // Refill & remix all 75 balls in the drum WITHOUT resetting active cards, confirmed cells, or milestones
  const handleRefillDrumKeepCards = useCallback(() => {
    const isOwner = authService.getCurrentUser().role === 'owner' || ownerControl.isUnlocked();
    if (remoteBingo.getIsRemotePlayer() && !isOwner) return;
    if (!isOwner && (!authService.getCurrentUser().isAuthenticated || !sessionTimer.hasPaidAccess())) return;

    setIsAutoCalling(false);
    setUncalledBalls(
      shuffleArray(
        JOYFUL_BALLS_MAP.map((b) => ({
          ...b,
          timestamp: Date.now(),
        }))
      )
    );
    setScrambleTrigger((prev) => prev + 1);
    sounds.playCageTumble(1.4);
    progression.recordMixerAgitate();
    particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.35, 18);
    showCardActionNotice(
      '🔄 Trommelen er fylt og blandet på nytt med 75 kuler — aktive bingokort og avkryssinger beholdes!',
      'ready'
    );
  }, [showCardActionNotice]);

  const handleTriggerAgitateMix = useCallback((_speed: number = 1.0) => {
    sounds.playCageTumble(1.5);
    progression.recordMixerAgitate();
    setScrambleTrigger((prev) => prev + 1);
    handleShuffleBalls();
    particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.35, 18);
  }, [handleShuffleBalls]);

  // Start a new game session
  const handleStartGame = (
    chosenMode: GameMode,
    chosenTheme: BingoTheme,
    playerCount: number = 1,
    cardsCount: number = 1,
    initialDisplayMode: CardDisplayMode = 'numbers',
    customPlayerNames?: string[],
    targetScreenDevice?: 'mobile' | 'desktop' | 'big_screen'
  ) => {
    // Require mandatory login & real payment to play (free for Owner)
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();

    if (!user.isAuthenticated && !isOwner) {
      sounds.playClick();
      setPendingGameStart({
        chosenMode,
        chosenTheme,
        playerCount,
        cardsCount,
        initialDisplayMode,
        customPlayerNames,
        targetScreenDevice,
      });
      setIsAuthOpen(true);
      return;
    }

    if (!isOwner && !sessionTimer.hasPaidAccess()) {
      sounds.playClick();
      setPendingGameStart({
        chosenMode,
        chosenTheme,
        playerCount,
        cardsCount,
        initialDisplayMode,
        customPlayerNames,
        targetScreenDevice,
      });
      setIsVippsModalOpen(true);
      return;
    }

    if (!remoteBingo.getIsRemotePlayer() && sessionTimer.hasFullPaidAccess()) {
      remoteBingo.activateHostSession(undefined, user.name);
    }

    if (targetScreenDevice) {
      setScreenDevice(targetScreenDevice);
      if (targetScreenDevice === 'big_screen') {
        setIsAudienceOpen(true);
      }
    }
    setMode(chosenMode);
    setTheme(chosenTheme);
    setNumCardsPerPlayer(cardsCount);
    setDisplayMode(initialDisplayMode);

    const themePrompts = THEMES[chosenTheme]?.prompts?.length > 0
      ? THEMES[chosenTheme].prompts
      : THEMES.heartfelt.prompts;

    const isNumerical = initialDisplayMode === 'numbers' || initialDisplayMode === 'both' || chosenTheme === 'classic_joy';

    const count = customPlayerNames && customPlayerNames.length > 0 ? customPlayerNames.length : playerCount;
    const newPlayers: Player[] = [];
    const colors = ['#f59e0b', '#059669', '#7c3aed', '#0284c7', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];

    for (let i = 0; i < count; i++) {
      // Generate 1 to 6 simultaneous cards for this player
      const playerCards: BingoCell[][][] = [];
      for (let c = 0; c < cardsCount; c++) {
        playerCards.push(generateBingoCard(themePrompts, isNumerical));
      }

      const playerName =
        customPlayerNames && customPlayerNames[i]?.trim()
          ? customPlayerNames[i].trim()
          : (count === 1 ? socialSocket.getProfile().name : `Player ${i + 1}`);

      newPlayers.push({
        id: `p-${i + 1}`,
        name: playerName,
        avatarColor: colors[i % colors.length],
        cards: playerCards,
        activeCardIndex: 0,
        linesCompleted: 0,
        hasBingo: false,
        claimedMilestones: [],
      });
    }

    setPlayers(newPlayers);
    setActivePlayerIndex(0);
    ownerControl.recordGameStarted(count);

    // Initialize 75 Joyful Affirmation balls for tumbler
    const balls = shuffleArray(
      JOYFUL_BALLS_MAP.map((b) => ({
        ...b,
        timestamp: Date.now(),
      }))
    );
    setUncalledBalls(balls);
    setCalledBalls([]);
    setIsAutoCalling(false);

    setScreen('PLAYING');
    sounds.playLineComplete();
    particleRef.current?.burst(window.innerWidth / 2, window.innerHeight / 2, 25);
  };

  const handleAuthSuccess = (loggedInUser: AuthUser) => {
    const isOwner = loggedInUser.role === 'owner' || ownerControl.isUnlocked();
    if (isOwner) {
      setIsOwnerControlOpen(true);
      return;
    }
    if (!sessionTimer.hasFullPaidAccess()) {
      setIsVippsModalOpen(true);
    } else {
      setIsGameSelectorOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsVippsModalOpen(false);
    sounds.playLineComplete();
    particleRef.current?.burst(window.innerWidth / 2, window.innerHeight / 2, 35);
    setIsGameSelectorOpen(true);
  };

  // Join remote bingo game room with host code
  const handleJoinedAsRemotePlayer = (_code: string, name: string) => {
    const chosenTheme = theme || 'ril';
    const themePrompts = THEMES[chosenTheme]?.prompts?.length > 0
      ? THEMES[chosenTheme].prompts
      : THEMES.heartfelt.prompts;
    const isNumerical = displayMode === 'numbers' || displayMode === 'both' || chosenTheme === 'classic_joy';
    const playerCards: BingoCell[][][] = [generateBingoCard(themePrompts, isNumerical)];

    const remotePlayer: Player = {
      id: `remote-${Date.now()}`,
      name,
      avatarColor: '#06b6d4',
      cards: playerCards,
      activeCardIndex: 0,
      linesCompleted: 0,
      hasBingo: false,
      claimedMilestones: [],
    };

    setIsAutoCalling(false);
    setCalledBalls([]);
    setUncalledBalls(
      shuffleArray(
        JOYFUL_BALLS_MAP.map((b) => ({
          ...b,
          timestamp: Date.now(),
        }))
      )
    );
    setIsRemoteBingoParticipant(true);
    setPlayers([remotePlayer]);
    setActivePlayerIndex(0);
    setScreen('PLAYING');
    sounds.playLineComplete();
  };

  // Allow renaming players at any time
  const handleRenamePlayer = (playerIndex: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPlayers((prev) => {
      const updated = [...prev];
      if (updated[playerIndex]) {
        updated[playerIndex] = { ...updated[playerIndex], name: trimmed };
      }
      return updated;
    });
    sounds.playClick();
  };

  // Toggle cell confirmation on a specific card (strictly requires drawn ball in calledBalls)
  const handleToggleCell = (
    cardIdx: number,
    row: number,
    col: number,
    partner?: string,
    note?: string,
    targetPlayerIndex?: number
  ) => {
    if (players.length === 0) return;

    const pIdx = targetPlayerIndex !== undefined ? targetPlayerIndex : activePlayerIndex;
    const currentPlayers = players.map((p) => ({
      ...p,
      cards: p.cards.map((c) => c.map((r) => r.map((cell) => ({ ...cell })))),
    }));
    const player = currentPlayers[pIdx];
    if (!player) return;
    const targetCard = player.cards[cardIdx];
    if (!targetCard) return;

    const cell = targetCard[row][col];
    if (cell.isFreeSpace) return;

    const willBeMarked = !cell.isMarked;

    // Require that the number or word has actually been drawn before allowing physical confirmation
    if (willBeMarked && !isCellBallDrawn(cell, calledBalls)) {
      sounds.playClick();
      showCardActionNotice(
        `⏳ ${cell.letter}-${cell.number} («${cell.text}») er ikke trukket ennå! Bekreft bare tall eller ord som faktisk er trukket.`,
        'warn'
      );
      return;
    }

    cell.isMarked = willBeMarked;

    if (willBeMarked) {
      cell.markedBy = partner;
      cell.storyNote = note;
      cell.markedAt = Date.now();

      // Progression rewards
      if (note || partner) {
        progression.recordStoryNote();
      } else {
        progression.recordDaub(player.cards.length > 1);
      }

      particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.45, 12);
    } else {
      cell.markedBy = undefined;
      cell.storyNote = undefined;
    }

    // Evaluate verified lines per card (no automatic BINGO claim — player must press Rop BINGO! physically)
    let bestCardLines = 0;
    player.cards.forEach((c) => {
      const res = evaluateBoardWins(c, calledBalls);
      if (res.completedLines > bestCardLines) {
        bestCardLines = res.completedLines;
      }
    });

    player.linesCompleted = bestCardLines;

    const unlockedClaim = getEligibleBingoClaimForPlayer(player, calledBalls);
    if (unlockedClaim && willBeMarked) {
      sounds.playLineComplete();
      particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.4, 20);
      showCardActionNotice(
        `✨ ${unlockedClaim.pattern} er fylt på brettet ditt! Trykk fysisk på «${unlockedClaim.label}» for å melde inn bingo!`,
        'ready'
      );
    }

    if (remoteBingo.getIsRemotePlayer()) {
      remoteBingo.sendRemotePlayerProgress({
        playerName: player.name,
        linesCompleted: bestCardLines,
        hasBingo: player.hasBingo,
        avatarColor: player.avatarColor,
      });
    }

    setPlayers(currentPlayers);
  };

  // Physical BINGO ROP button handler — strictly gated to verified 1. rekke, 3. rekker, or Full brett
  const handlePhysicalBingoCall = (targetPlayerIndex?: number) => {
    const pIdx = targetPlayerIndex !== undefined ? targetPlayerIndex : activePlayerIndex;
    const player = players[pIdx] || players[0];
    const eligible = getEligibleBingoClaimForPlayer(player, calledBalls);

    if (!player || !eligible) {
      sounds.playClick();
      showCardActionNotice(
        '🔒 Du kan ikke rope BINGO ennå! Bekreft først trukne tall/ord til du har 1. rekke, 3. rekker (loddrett, vannrett eller kryssende) eller fullt brett.',
        'warn'
      );
      return;
    }

    const updatedPlayers = players.map((p, idx) => {
      if (idx !== (targetPlayerIndex !== undefined ? targetPlayerIndex : players.indexOf(player))) {
        return p;
      }
      const nextClaimed = new Set<BingoMilestone>(p.claimedMilestones || []);
      nextClaimed.add(eligible.milestone);
      if (eligible.milestone === 'line3' || eligible.milestone === 'fullbrett') {
        nextClaimed.add('line1');
      }
      if (eligible.milestone === 'fullbrett') {
        nextClaimed.add('line3');
      }
      return {
        ...p,
        claimedMilestones: Array.from(nextClaimed),
        hasBingo: eligible.isFullHouse ? true : p.hasBingo,
      };
    });
    setPlayers(updatedPlayers);
    setCardActionNotice(null);

    if (remoteBingo.getIsRemotePlayer()) {
      remoteBingo.sendRemotePlayerProgress({
        playerName: player.name,
        linesCompleted: player.linesCompleted,
        hasBingo: eligible.isFullHouse || player.hasBingo,
        avatarColor: player.avatarColor,
      });
    }

    if (eligible.isFullHouse) {
      sounds.playBingoWin();
      sounds.speakWin(true);
      progression.recordBingoWin();
      ownerControl.recordBingoWon();
      particleRef.current?.celebrateBingo();
      socialSocket.broadcastAchievement(`${player.name} fullførte FULLBRETT BINGO!`);
      const handledOnlineOrBigScreen = triggerFullbrettClaimAndRound(
        player.name,
        eligible.cardIndex,
        eligible.confirmedNumbers
      );
      if (!handledOnlineOrBigScreen) {
        setTimeout(() => {
          setScreen('VICTORY');
        }, 700);
      }
    } else {
      const milestoneLines = eligible.milestone === 'line3' ? 3 : 1;
      sounds.playLineComplete();
      sounds.speakWin(false);
      progression.recordLineWin();
      particleRef.current?.celebrateBingo();

      const task = getWinnerTaskForLines(milestoneLines, false);
      setWinnerModalTask({
        isOpen: true,
        winnerName: player.name,
        linesCount: milestoneLines,
        isFullHouse: false,
        task,
      });

      const inRoom = Boolean(
        remoteBingo.getCurrentRoomCode() ||
        remoteBingo.getHostCode() ||
        isAudienceOpenRef.current ||
        screenDeviceRef.current === 'big_screen'
      );
      if (inRoom) {
        remoteBingo.claimBingo(
          eligible.pattern,
          eligible.cardIndex,
          false,
          player.name,
          eligible.confirmedNumbers
        );
      }
    }
  };


  const handleCustomCardCreated = (cardTitle: string, items: string[]) => {
    const card = generateBingoCard(items, displayMode === 'numbers');
    setPlayers([
      {
        id: 'p-custom',
        name: socialSocket.getProfile().name,
        avatarColor: '#f59e0b',
        cards: [card],
        activeCardIndex: 0,
        linesCompleted: 0,
        hasBingo: false,
      },
    ]);
    setActivePlayerIndex(0);
    setScreen('PLAYING');
    sounds.playLineComplete();
  };

  // Host ban action to remove and ban disruptive participants
  const handleBanPlayer = (playerName: string, reason?: string) => {
    sounds.playClick();
    ownerControl.banParticipant(playerName, reason || 'Forstyrrende oppførsel i fellesskapet');
    setPlayers((prev) => prev.filter((p) => p.name.toLowerCase() !== playerName.toLowerCase()));
    setBannedNotice(
      `Deltaker «${playerName}» ble utestengt fra bingosesjonen av verten for å bevare sosial trivsel og trygghet.`
    );
  };

  // Start a fresh Bingo round for current room (keeps room code & participants, resets balls & cards)
  const handleStartNewBingoRound = () => {
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    if (
      (remoteBingo.getIsRemotePlayer() && !isOwner) ||
      (!isOwner && (!user.isAuthenticated || !sessionTimer.hasPaidAccess()))
    ) {
      return;
    }
    sounds.playPop(1.2);
    applyLocalNewRoundReset();
    if (socialSocket.getIsConnected() && (remoteBingo.getHostCode() || remoteBingo.getCurrentRoomCode())) {
      remoteBingo.broadcastRoundResetToRoom();
    } else {
      setBingoRoundNumber((r) => r + 1);
    }
  };

  // Reset current session progress and return to Title Screen for fresh parameters
  const handleResetGame = () => {
    sounds.playPop(1.1);
    setIsAutoCalling(false);
    setCalledBalls([]);
    setUncalledBalls(
      shuffleArray(
        JOYFUL_BALLS_MAP.map((b) => ({
          ...b,
          timestamp: Date.now(),
        }))
      )
    );
    if (!remoteBingo.getIsRemotePlayer() && remoteBingo.canActAsHost()) {
      remoteBingo.unlockCodeForNewRound();
    }
    setPlayers([]);
    setActivePlayerIndex(0);
    setScreen('TITLE');
  };

  const activePlayer = players[activePlayerIndex] || players[0];
  const currentLevel = progression.getLevelInfo(playerStats.points);

  if (tvModeConfig?.active) {
    return (
      <TvProjectorScreen
        initialGame={tvModeConfig.game}
        initialCode={tvModeConfig.code}
        onExitTvMode={() => {
          setTvModeConfig(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, '/');
          }
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-clip bg-[#120b06] text-amber-50">
      {/* 60fps Particle & Confetti Canvas */}
      <ParticleCanvas ref={particleRef} />

      {/* Real-time System / Host Broadcast Announcement Banner */}
      {activeAnnouncement && (
        <div className="relative z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xl border-b border-amber-300">
          <div className="flex items-center gap-2 max-w-4xl mx-auto truncate">
            <span className="text-base animate-bounce">
              {activeAnnouncement.type === 'celebration'
                ? '🎉'
                : activeAnnouncement.type === 'pause'
                ? '☕'
                : activeAnnouncement.type === 'alert'
                ? '⚠️'
                : '📢'}
            </span>
            <span className="font-heading font-black tracking-wide uppercase text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              Vertsmelding ({activeAnnouncement.author})
            </span>
            <span className="font-extrabold truncate text-slate-950">{activeAnnouncement.message}</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              ownerControl.dismissActiveAnnouncement();
            }}
            className="text-slate-950 hover:text-black font-black text-xs ml-3 p-1 rounded cursor-pointer"
            title="Lukk melding"
          >
            ✕
          </button>
        </div>
      )}

      {/* Host Join Notification Toast */}
      {hostJoinNotice && (
        <div className="fixed top-6 right-4 sm:right-6 z-50 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl border-2 border-white font-heading font-black text-xs sm:text-sm flex items-center gap-3 animate-fadeIn max-w-sm">
          <span>{hostJoinNotice}</span>
          <button
            type="button"
            onClick={() => setHostJoinNotice(null)}
            className="text-slate-950 hover:text-black font-black px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* New Round Started Toast */}
      {roundResetNotice && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl border-2 border-white font-heading font-black text-xs sm:text-sm flex items-center gap-3 animate-fadeIn max-w-sm">
          <span>{roundResetNotice}</span>
          <button
            type="button"
            onClick={() => setRoundResetNotice(null)}
            className="text-slate-950 hover:text-black font-black px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Level Up Celebration Banner */}
      {levelUpToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 px-6 py-3 rounded-2xl shadow-2xl border-2 border-white font-heading font-black text-sm flex items-center gap-3 animate-bounce">
          <span className="text-2xl">{levelUpToast.badgeIcon}</span>
          <div>
            <div className="text-xs uppercase tracking-wider font-extrabold text-amber-900">
              Level Up! You are now:
            </div>
            <div className="text-base font-black">{levelUpToast.title} (Level {levelUpToast.level})</div>
          </div>
          <span className="text-2xs bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-bold ml-2">
            Unlocked: {levelUpToast.perk}
          </span>
        </div>
      )}

      {/* Screen 1: Title Screen */}
      {screen === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenPrintModal={() => setIsPrintOpen(true)}
          onOpenAudience={handleOpenAudience}
          onOpenMixer={() => setIsMixerOpen(true)}
          onOpenQuests={() => setIsQuestsOpen(true)}
          onOpenSchedule={() => setIsScheduleOpen(true)}
          onOpenOwnerControl={() => setIsOwnerControlOpen(true)}
          onOpenVippsModal={handleOpenPaymentGuarded}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenReportProblem={() => setIsReportOpen(true)}
          onOpenIosInstall={() => setIsIosInstallOpen(true)}
          onOpenEventTimeout={() => setIsEventTimeoutOpen(true)}
          onOpenBroadcast={() => setIsBroadcastOpen(true)}
          onOpenParticipants={() => setIsParticipantsOpen(true)}
          onOpenRemoteBingo={() => setIsRemoteBingoOpen(true)}
          onOpenSecretOwnerLogin={() => setIsSecretOwnerLoginOpen(true)}
          onOpenGameSelector={handleOpenGameSelectorGuarded}
          onOpenQuiz={handleOpenQuiz}
          onOpenMemory={handleOpenMemoryGuarded}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onQuickJoinWithCode={(code, target) => {
            const clean = code.trim().toUpperCase();
            setPendingJoinCode(clean);
            if (target === 'bingo') {
              setIsRemoteBingoOpen(true);
            } else {
              setQuizInitialEdition('family');
              setQuizInitialTab('join');
              setIsQuizModalOpen(true);
            }
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            const m = sounds.toggleMute();
            setIsMuted(m);
          }}
        />
      )}

      {/* Screen 2: Active Playing HUD & Table */}
      {screen === 'PLAYING' && (() => {
        const playContainerWidth =
          screenDevice === 'mobile'
            ? 'max-w-lg'
            : screenDevice === 'big_screen'
            ? 'max-w-[1880px]'
            : 'max-w-[1520px]';

        const selectPlayScreenPreset = (preset: 'mobile' | 'desktop' | 'big_screen') => {
          sounds.playClick();
          userPickedPlayScreenRef.current = true;
          setScreenDevice(preset);
        };

        const eligibleBingoClaim = getEligibleBingoClaimForPlayer(activePlayer, calledBalls);
        const activeCardForEval = activePlayer
          ? activePlayer.cards[activePlayer.activeCardIndex || 0] || activePlayer.cards[0]
          : undefined;
        const activeCardWinEval = activeCardForEval
          ? evaluateBoardWins(activeCardForEval, calledBalls)
          : null;
        const claimedMilestones = activePlayer?.claimedMilestones || [];
        const completedLinesCount = activeCardWinEval?.completedLines || 0;

        return (
        <div className="relative min-h-screen w-full flex flex-col justify-start px-2.5 py-2.5 sm:px-5 sm:py-3.5 overflow-x-clip pb-32 sm:pb-16">
          {/* Ambient Table Background with generated asset */}
          <div
            className="fixed inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none filter blur-xs"
            style={{ backgroundImage: `url('/joyful_bingo_backdrop.jpg')` }}
          />

          {/* TIDSVARSEL FØR SPILLETID UTLØPER (5 MIN / 1 MIN) */}
          {timeWarningNotice && (
            <div className={`relative z-30 ${playContainerWidth} mx-auto w-full mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-rose-950/95 via-[#2a0e08] to-rose-950/95 border-2 border-rose-500 shadow-2xl flex items-center justify-between gap-3 text-left animate-pulse`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <div className="font-heading font-black text-xs sm:text-sm text-rose-200">
                    {timeWarningNotice}
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Forleng med Visa, Mastercard eller Apple Pay for å unngå automatisk avslutning.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsVippsModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <span>💳 Forleng med Kort / Pay ➔</span>
              </button>
            </div>
          )}

          {/* UNIFIED STREAMLINED TOP HUD BAR — Tight Cohesive Flow (Zero Empty Holes Between Headings) */}
          <header
            className="relative z-30 w-fit max-w-full mx-auto px-3 sm:px-4 py-2 mb-3 rounded-2xl bg-black/55 backdrop-blur-md border border-amber-500/25 shadow-xl flex flex-wrap items-center justify-center gap-2"
          >
            {/* Left Zone: Startmeny + Romkode + Subtle Hairline Divider + View/Format/Screen Controls */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setScreen('TITLE');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all cursor-pointer shadow whitespace-nowrap"
                title="Gå tilbake til startmenyen"
              >
                <GoldenCoinLogo size="sm" />
                <span className="font-heading font-black text-xs text-amber-200">
                  ⇦ Startmeny
                </span>
                {theme === 'ril' && (
                  <span className="hidden sm:inline text-[10px] font-black text-emerald-300">· RIL</span>
                )}
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsRemoteBingoOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition-all cursor-pointer shadow whitespace-nowrap"
                title="Se åpen romkode, koble til mobil eller åpne deltakerliste"
              >
                <span>📡</span>
                <span className="font-mono font-black text-white text-xs">
                  {isRemoteParticipant
                    ? `Rom: ${remoteBingo.getCurrentRoomCode() || 'Aktiv'}`
                    : remoteBingo.getHostCode()
                    ? `${remoteBingo.getHostCode()}`
                    : 'Rom'}
                </span>
                <span className="text-[11px] font-black text-emerald-300 font-mono tabular-nums">
                  · R{bingoRoundNumber} · 👥 {players.length + remoteParticipantsList.length}
                </span>
              </button>

              <span className="hidden md:block h-5 w-px bg-amber-500/25 shrink-0 mx-0.5" aria-hidden="true" />

              {mode === 'ALL_IN_ONE' && screenDevice !== 'mobile' && (
                <div className="flex items-center p-0.5 bg-black/60 border border-amber-500/30 rounded-lg shrink-0">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setUnifiedView('both');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      unifiedView === 'both'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    {t('dual_view')}
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setUnifiedView('cards');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      unifiedView === 'cards'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    {t('cards_only')}
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setUnifiedView('stage');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      unifiedView === 'stage'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    {t('stage_only')}
                  </button>
                </div>
              )}

              <div className="flex items-center p-0.5 bg-black/60 border border-amber-500/30 rounded-lg shrink-0">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDisplayMode('numbers');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    displayMode === 'numbers'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-amber-200/70 hover:text-amber-100'
                  }`}
                >
                  {t('numbers')}
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDisplayMode('both');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    displayMode === 'both'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-amber-200/70 hover:text-amber-100'
                  }`}
                >
                  {t('both')}
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDisplayMode('prompts');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    displayMode === 'prompts'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-amber-200/70 hover:text-amber-100'
                  }`}
                >
                  {t('prompts')}
                </button>
              </div>

              {/* Skjermstørrelse Rullegardin (spares plass og unngår overlapp i toppmenyen) */}
              <div className="relative shrink-0" ref={playScreenRef}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsPlayScreenMenuOpen((v) => !v);
                    setIsPlayQuizMenuOpen(false);
                    setIsPlayToolsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isPlayScreenMenuOpen
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                      : 'bg-black/60 border-amber-500/35 text-amber-100 hover:border-amber-400'
                  }`}
                  title="Velg skjermstørrelse (Mobil, PC eller TV / Prosjektor)"
                >
                  <span>{screenDevice === 'mobile' ? '📱' : screenDevice === 'big_screen' ? '📺' : '💻'}</span>
                  <span>
                    {screenDevice === 'mobile'
                      ? 'Mobil'
                      : screenDevice === 'big_screen'
                      ? 'TV / Prosjektor'
                      : 'PC'}
                  </span>
                  <span className="text-[10px] opacity-80">{isPlayScreenMenuOpen ? '▲' : '▼'}</span>
                </button>

                {isPlayScreenMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 rounded-2xl bg-[#181009] border border-amber-400/50 shadow-2xl p-1.5 z-50 space-y-1 text-left">
                    {[
                      { id: 'mobile' as const, icon: '📱', label: 'Mobil', desc: 'Liten skjerm & touch' },
                      { id: 'desktop' as const, icon: '💻', label: 'PC / Nettbrett', desc: 'Standard side-ved-side' },
                      { id: 'big_screen' as const, icon: '📺', label: 'TV / Prosjektor', desc: 'Stort oppsett for sal' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          selectPlayScreenPreset(opt.id);
                          setIsPlayScreenMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                          screenDevice === opt.id
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-amber-100 hover:bg-amber-500/20 font-semibold'
                        }`}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <div className="min-w-0">
                          <div className="leading-tight">{opt.label}</div>
                          <div
                            className={`text-[10px] leading-tight ${
                              screenDevice === opt.id ? 'text-slate-900/80' : 'text-amber-300/65'
                            }`}
                          >
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activePlayer && activePlayer.cards.length > 1 && (
                <button
                  onClick={() => setViewAllCards(!viewAllCards)}
                  className="px-2 py-1.5 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-200 text-xs font-semibold hover:border-amber-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {viewAllCards ? t('grid_view') : t('single_card')}
                </button>
              )}
            </div>

            <span className="hidden lg:block h-5 w-px bg-amber-500/25 shrink-0" aria-hidden="true" />

            {/* Essential Host Shortcuts + Quiz & Memory Rullegardin + Verktøy + Language + Sound + Pause */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0">
              {!isRemoteParticipant && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    handleOpenAudience();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 hover:border-amber-300 text-amber-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Publikum Storskjerm / TV-visning (A)"
                >
                  <span>📺</span>
                  <span className="hidden sm:inline">{t('audience_tv')}</span>
                </button>
              )}

              {!isRemoteParticipant && (
                <div className="relative" ref={playQuizRef}>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsPlayQuizMenuOpen((v) => !v);
                      setIsPlayScreenMenuOpen(false);
                      setIsPlayToolsOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isPlayQuizMenuOpen
                        ? 'bg-purple-500 text-white border-purple-300 font-black'
                        : 'bg-purple-600/30 border-purple-400/50 hover:border-purple-300 text-purple-100'
                    }`}
                    title="Åpne Quiz eller Memory (VoksenQuiz, FamilieQuiz, JuleQuiz, Memory)"
                  >
                    <span>🎭</span>
                    <span>Quiz &amp; Memory</span>
                    <span className="text-[10px] opacity-80">{isPlayQuizMenuOpen ? '▲' : '▼'}</span>
                  </button>

                  {isPlayQuizMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-[#181009] border border-purple-400/50 shadow-2xl p-1.5 z-50 space-y-1 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayQuizMenuOpen(false);
                          handleOpenQuiz('adult');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-100 hover:bg-purple-500/25 font-bold flex items-center gap-2.5 cursor-pointer"
                      >
                        <span className="text-base">🎭</span>
                        <div>
                          <div>VoksenQuiz</div>
                          <div className="text-[10px] text-purple-300/70 font-normal">Kveldsshow · Live &amp; Lagspill</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayQuizMenuOpen(false);
                          handleOpenQuiz('family');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-amber-100 hover:bg-amber-500/25 font-bold flex items-center gap-2.5 cursor-pointer"
                      >
                        <span className="text-base">🎈</span>
                        <div>
                          <div>FamilieQuiz</div>
                          <div className="text-[10px] text-amber-300/70 font-normal">Barn &amp; voksne sammen</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayQuizMenuOpen(false);
                          handleOpenQuiz('christmas');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-emerald-100 hover:bg-emerald-500/25 font-bold flex items-center gap-2.5 cursor-pointer"
                      >
                        <span className="text-base">🎄</span>
                        <div>
                          <div>JuleQuiz</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Juletre, mat &amp; tradisjoner</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayQuizMenuOpen(false);
                          handleOpenMemoryGuarded();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-sky-100 hover:bg-sky-500/25 font-bold flex items-center gap-2.5 cursor-pointer"
                      >
                        <span className="text-base">🧩</span>
                        <div>
                          <div>Memory</div>
                          <div className="text-[10px] text-sky-300/70 font-normal">30 kort (15 par) · Lagspill</div>
                        </div>
                      </button>
                      <div className="h-px bg-purple-400/25 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlayQuizMenuOpen(false);
                          handleOpenGameSelectorGuarded();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-cyan-200 hover:bg-cyan-500/20 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <span>🎲</span>
                        <span>Velg blant alle 6 spillformer</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <LanguageSelector variant="compact" />

              <button
                onClick={() => {
                  const m = sounds.toggleMute();
                  setIsMuted(m);
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-amber-100 cursor-pointer"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              {/* Consolidated Tools Menu in Active Game (prevents header overflow on right) */}
              <div className="relative" ref={playToolsRef}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsPlayToolsOpen((v) => !v);
                    setIsPlayScreenMenuOpen(false);
                    setIsPlayQuizMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    isPlayToolsOpen
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                      : 'bg-amber-950/70 border-amber-500/40 text-amber-200 hover:border-amber-400'
                  }`}
                  title="Verktøy, mikser, dagsplan, utskrift og innstillinger"
                >
                  <span>⚙️</span>
                  <span className="hidden sm:inline">Verktøy</span>
                  <span className="text-[10px]">{isPlayToolsOpen ? '▲' : '▼'}</span>
                </button>

                {isPlayToolsOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#181009] border border-amber-400/50 shadow-2xl p-2 z-50 space-y-1 text-left">
                    {!isRemoteParticipant && (remoteBingo.getHostCode() || remoteBingo.getCurrentRoomCode()) && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          const code = remoteBingo.getHostCode() || remoteBingo.getCurrentRoomCode() || '';
                          if (code) {
                            const shareUrl = `${window.location.origin}/?spill=bingo&kode=${encodeURIComponent(code)}`;
                            navigator.clipboard?.writeText(shareUrl).catch(() => {});
                            setCopiedActiveShareLink(true);
                            setTimeout(() => setCopiedActiveShareLink(false), 2000);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 flex items-center justify-between cursor-pointer"
                      >
                        <span>🔗 {copiedActiveShareLink ? '✓ Lenke kopiert!' : 'Del spillerside'}</span>
                      </button>
                    )}

                    {!isRemoteParticipant && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayToolsOpen(false);
                          setIsMixerOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                      >
                        <span>🎛️</span>
                        <span>{t('mixer')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsPlayToolsOpen(false);
                        setIsQuestsOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center justify-between cursor-pointer"
                    >
                      <span>🎯 {t('daily_quests')}</span>
                      {dailyQuests.some((q) => q.isCompleted && !q.isClaimed) && (
                        <span className="text-[10px] font-black text-emerald-300">Ny!</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsPlayToolsOpen(false);
                        setIsScheduleOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>📅</span>
                      <span>{t('daily_schedule')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsPlayToolsOpen(false);
                        setIsPrintOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🖨️</span>
                      <span>Skriv ut bingokort</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsPlayToolsOpen(false);
                        setIsFriendsOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center justify-between cursor-pointer"
                    >
                      <span>👥 Venner & Nivå</span>
                      <span className="font-mono text-[11px] text-amber-300">Lvl {currentLevel.level}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsPlayToolsOpen(false);
                        setIsReportOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>💬</span>
                      <span>Rapporter problem</span>
                    </button>

                    {!isOwnerActive && !isRemoteParticipant && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlayToolsOpen(false);
                          handleOpenPaymentGuarded();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-black text-amber-300 hover:bg-amber-500/20 flex items-center justify-between cursor-pointer"
                      >
                        <span>💳 Spilletid & Betaling</span>
                        <span className="font-mono text-[11px]">{sessionRemaining}</span>
                      </button>
                    )}

                    {isOwnerActive && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayToolsOpen(false);
                          setIsOwnerControlOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-2 cursor-pointer"
                      >
                        <span>👑</span>
                        <span>Eierpanel (∞ Ubegrenset)</span>
                      </button>
                    )}

                    {!isRemoteParticipant && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsPlayToolsOpen(false);
                          setIsAuthOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-purple-200 hover:bg-purple-500/20 flex items-center justify-between cursor-pointer border-t border-white/10 mt-1 pt-2"
                      >
                        <span>{authUser.isAuthenticated ? `${authUser.avatar} ${authUser.name}` : '🔑 Logg inn'}</span>
                        <span className="text-[10px] text-purple-300">Profil</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setScreen('PAUSED');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/70 hover:bg-amber-500/35 text-amber-200 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap"
                title="Pause spillet og frys spilletiden"
              >
                <span>⏸️</span>
                <span className="hidden sm:inline">Pause</span>
              </button>
            </div>
          </header>

          {/* Main Playfield: Responsive for Mobile, Desktop, TV and Storskjerm */}
          <main className={`relative z-10 flex-1 flex flex-col items-center justify-start my-1 ${playContainerWidth} mx-auto w-full`}>
            {/* Storskjerm / TV Notice Banner if in big_screen mode and modal was closed */}
            {screenDevice === 'big_screen' && !isAudienceOpen && (
              <div className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 via-amber-950/80 to-emerald-950/80 border border-amber-400/60 shadow-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">📺</span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-200">TV & Prosjektor-oppløsning aktiv</div>
                    <div className="text-xs text-amber-300/80">Utnytter hele bredden for forsamling — klikk for ren publikumsvisning uten vertsknapper</div>
                  </div>
                </div>
                <button
                  onClick={handleOpenAudience}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow cursor-pointer whitespace-nowrap"
                >
                  Åpne Publikums-Storskjerm ➔
                </button>
              </div>
            )}

            {/* Shared Milestones + Strictly Gated Physical BINGO ROP Card (No extra Trekk bar above!) */}
            {(() => {
              const milestonePanel = activePlayer ? (
                <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-[#140d07]/95 border border-amber-400/35 shadow-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[11px] font-heading font-black uppercase tracking-wider text-amber-300">
                      🎯 Milepæler
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          id: 'line1' as const,
                          label: '1. rekke',
                          done: claimedMilestones.includes('line1'),
                          ready: completedLinesCount >= 1 && !claimedMilestones.includes('line1'),
                          progress: `${Math.min(completedLinesCount, 1)}/1`,
                        },
                        {
                          id: 'line3' as const,
                          label: '3. rekker',
                          done: claimedMilestones.includes('line3'),
                          ready: completedLinesCount >= 3 && !claimedMilestones.includes('line3'),
                          progress: `${Math.min(completedLinesCount, 3)}/3`,
                        },
                        {
                          id: 'fullbrett' as const,
                          label: 'Full brett',
                          done: claimedMilestones.includes('fullbrett') || activePlayer.hasBingo,
                          ready: Boolean(activeCardWinEval?.isFullHouse) && !claimedMilestones.includes('fullbrett'),
                          progress: activeCardWinEval?.isFullHouse ? '25/25' : `${completedLinesCount}/12`,
                        },
                      ].map((m) => (
                        <div
                          key={m.id}
                          className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                            m.done
                              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                              : m.ready
                              ? 'bg-amber-400/25 border-amber-300 text-amber-100 animate-pulse'
                              : 'bg-white/5 border-white/10 text-amber-200/75'
                          }`}
                        >
                          <span>{m.done ? '✓' : m.ready ? '🔔' : '•'}</span>
                          <span>{m.label}</span>
                          {!m.done && (
                            <span className="font-mono text-[10px] opacity-80 tabular-nums">({m.progress})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-500/20">
                    <span className="text-[10px] text-amber-200/70 leading-tight">
                      Vannrett, loddrett eller kryssende · Bekreft trukne tall fysisk
                    </span>
                    <button
                      type="button"
                      disabled={!eligibleBingoClaim}
                      onClick={() => handlePhysicalBingoCall()}
                      className={`px-3 py-1.5 rounded-xl font-heading font-black text-xs tracking-wide transition-all flex items-center gap-1.5 shrink-0 ${
                        eligibleBingoClaim
                          ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-xl ring-2 ring-amber-200 cursor-pointer active:scale-95 animate-pulse'
                          : 'bg-white/5 border border-amber-500/25 text-amber-200/45 cursor-not-allowed'
                      }`}
                      title={
                        eligibleBingoClaim
                          ? `Trykk fysisk for å rope ${eligibleBingoClaim.pattern}!`
                          : 'Låst til 1. rekke, 3. rekker eller Full brett er bekreftet med trukne tall/ord'
                      }
                    >
                      <span>{eligibleBingoClaim ? '📣' : '🔒'}</span>
                      <span>
                        {eligibleBingoClaim
                          ? eligibleBingoClaim.label
                          : 'Rop BINGO! (Fyll rekke)'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : null;

              const actionNoticeBox = cardActionNotice ? (
                <div
                  role="status"
                  className={`w-full px-3 py-2 rounded-xl border-2 shadow-lg flex items-center justify-between gap-2 text-xs font-bold transition-all ${
                    cardActionNotice.tone === 'ready'
                      ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                      : 'bg-rose-950/95 border-amber-400/80 text-amber-100'
                  }`}
                >
                  <span>{cardActionNotice.text}</span>
                  <button
                    type="button"
                    onClick={() => setCardActionNotice(null)}
                    className="text-xs font-black px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer shrink-0"
                    aria-label="Lukk melding"
                  >
                    ✕
                  </button>
                </div>
              ) : null;

              const standingsSection = !isRemoteParticipant ? (
                <section className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1d120a] via-[#130d08] to-black/80 border border-amber-500/35 shadow-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">📊</span>
                      <h3 className="font-heading font-black text-sm text-amber-200">
                        Arrangørens Stillingsliste & Deltakere
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-black">
                        Runde {bingoRoundNumber}
                      </span>
                      {remoteBingo.getHostCode() && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-400/60 text-cyan-100 font-mono font-black text-xs tracking-widest">
                          📡 Romkode: {remoteBingo.getHostCode()}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-black">
                        👥 {players.length + remoteParticipantsList.length} spiller sammen ({players.length} brett · {remoteParticipantsList.length} på mobil)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          handleStartNewBingoRound();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-100 font-black text-[11px] cursor-pointer shadow"
                        title="Start ny runde for hele rommet (beholder romkoden og alle deltakere)"
                      >
                        🔄 Ny runde nå
                      </button>
                      {remoteBingo.getHostCode() && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              navigator.clipboard?.writeText(remoteBingo.getHostCode()).catch(() => {});
                              setCopiedActiveRoomCode(true);
                              setTimeout(() => setCopiedActiveRoomCode(false), 1800);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer shadow"
                          >
                            {copiedActiveRoomCode ? '✓ Kode kopiert!' : '📋 Kopier romkode'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              const code = remoteBingo.getHostCode();
                              const shareUrl = `${window.location.origin}/?spill=bingo&kode=${encodeURIComponent(code)}`;
                              navigator.clipboard?.writeText(shareUrl).catch(() => {});
                              setCopiedActiveShareLink(true);
                              setTimeout(() => setCopiedActiveShareLink(false), 2000);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-100 font-bold text-[11px] cursor-pointer shadow"
                          >
                            {copiedActiveShareLink ? '✓ Spillerlenke kopiert!' : '🔗 Del spillerside'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsRemoteBingoOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-amber-200 font-bold text-[11px] cursor-pointer"
                      >
                        💬 Meldinger & Deltakerkontroll
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Ranked Standings of ALL Players in Room (local + remote) */}
                    <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                        🏆 Stillingsliste — Alle som spiller sammen ({players.length + remoteParticipantsList.length})
                      </div>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {[
                          ...players.map((p) => ({
                            id: p.id,
                            name: p.name,
                            avatarColor: p.avatarColor,
                            linesCompleted: p.linesCompleted,
                            hasBingo: p.hasBingo,
                            isRemote: false,
                          })),
                          ...remoteParticipantsList.map((rp) => {
                            const tvSum = tvPlayersSummaryList.find((s) => s.id === rp.id);
                            return {
                              id: rp.id,
                              name: rp.name,
                              avatarColor: rp.color || '#06b6d4',
                              linesCompleted: tvSum?.linesCompleted || 0,
                              hasBingo: Boolean(tvSum?.hasBingo),
                              isRemote: true,
                            };
                          }),
                        ]
                          .sort((a, b) => {
                            if (a.hasBingo !== b.hasBingo) return a.hasBingo ? -1 : 1;
                            return b.linesCompleted - a.linesCompleted;
                          })
                          .map((p, rankIdx) => (
                            <div
                              key={p.id}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                                p.hasBingo
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                                  : 'bg-white/5 border-white/10 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono font-black text-amber-300 w-4">
                                  {p.hasBingo ? '🏆' : `${rankIdx + 1}.`}
                                </span>
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: p.avatarColor }}
                                />
                                <span className="font-bold truncate">{p.name}</span>
                                {p.isRemote && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 font-bold shrink-0">
                                    📱 Mobil
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-black text-[11px] text-amber-300 shrink-0">
                                {p.hasBingo ? 'FULLBRETT!' : `${p.linesCompleted} ${p.linesCompleted === 1 ? 'linje' : 'linjer'}`}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Remote Participants Joined with Room Code */}
                    <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                        📱 Deltakere tilkoblet med koden ({remoteParticipantsList.length})
                      </div>
                      {remoteParticipantsList.length === 0 ? (
                        <div className="text-xs text-slate-400 py-2">
                          Ingen eksterne mobildeltakere koblet til ennå. Del romkoden eller trykk «Del spillerside».
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                          {remoteParticipantsList.map((rp) => (
                            <div
                              key={rp.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-400/35 text-xs text-cyan-100"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-bold">{rp.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  remoteBingo.kickParticipant(rp.id, rp.name);
                                  ownerControl.banParticipant(rp.name, 'Utestengt fra spillrom (10 min)');
                                }}
                                className="ml-1 text-rose-300 hover:text-rose-100 font-black cursor-pointer"
                                title={`Utesteng ${rp.name} for forstyrrende adferd`}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : null;

              const playersAndCardsBlock = (
                <div className="w-full flex flex-col items-center">
                  {/* Pass & Play switcher */}
                  {players.length > 1 && (
                    <div className="flex items-center gap-2 mb-3 bg-black/40 p-1.5 rounded-xl border border-amber-500/20 flex-wrap justify-center">
                      {players.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                            activePlayerIndex === idx
                              ? 'bg-amber-400 text-slate-950 shadow-md'
                              : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                          }`}
                        >
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setActivePlayerIndex(idx);
                            }}
                            className="cursor-pointer"
                          >
                            {p.name} {p.hasBingo && '🏆'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = prompt(`Rediger spillernavn:`, p.name);
                              if (newName && newName.trim()) {
                                handleRenamePlayer(idx, newName.trim());
                              }
                            }}
                            className="opacity-60 hover:opacity-100 text-[11px] p-0.5 cursor-pointer"
                            title="Endre spillernavn manuelt"
                          >
                            ✏️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multiple cards switcher */}
                  {activePlayer && activePlayer.cards.length > 1 && !viewAllCards && (
                    <div className="flex items-center gap-2 mb-3 bg-black/50 p-1 rounded-xl border border-amber-500/20 flex-wrap justify-center">
                      {activePlayer.cards.map((_, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => {
                            sounds.playClick();
                            const updated = [...players];
                            updated[activePlayerIndex].activeCardIndex = cIdx;
                            setPlayers(updated);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activePlayer.activeCardIndex === cIdx
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-amber-200/70 hover:text-amber-100'
                          }`}
                        >
                          Card #{cIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cards Display */}
                  {activePlayer && (
                    <div
                      className={`w-full ${
                        viewAllCards && activePlayer.cards.length > 1
                          ? activePlayer.cards.length === 2
                            ? 'grid grid-cols-1 xl:grid-cols-2 gap-4'
                            : screenDevice === 'big_screen'
                            ? 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4'
                            : 'grid grid-cols-1 md:grid-cols-2 gap-3.5'
                          : 'flex justify-center'
                      }`}
                    >
                      {viewAllCards && activePlayer.cards.length > 1 ? (
                        activePlayer.cards.map((card, cIdx) => {
                          const winRes = evaluateBoardWins(card, calledBalls);
                          return (
                            <div key={cIdx} className="w-full">
                              <BingoBoard
                                card={card}
                                onToggleCell={(r: number, c: number, p?: string, n?: string) =>
                                  handleToggleCell(cIdx, r, c, p, n)
                                }
                                winningCoords={winRes.winningCoords}
                                playerName={players.length > 1 ? activePlayer.name : undefined}
                                cardIndex={cIdx}
                                totalCards={activePlayer.cards.length}
                                displayMode={displayMode}
                                onChangeDisplayMode={setDisplayMode}
                                calledBalls={calledBalls}
                                currentBall={calledBalls[calledBalls.length - 1] || null}
                                onPause={() => setScreen('PAUSED')}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className={`w-full ${screenDevice === 'big_screen' ? 'max-w-3xl' : 'max-w-2xl'}`}>
                          <BingoBoard
                            card={activePlayer.cards[activePlayer.activeCardIndex || 0] || activePlayer.cards[0]}
                            onToggleCell={(r: number, c: number, p?: string, n?: string) =>
                              handleToggleCell(activePlayer.activeCardIndex || 0, r, c, p, n)
                            }
                            winningCoords={
                              evaluateBoardWins(
                                activePlayer.cards[activePlayer.activeCardIndex || 0] || activePlayer.cards[0],
                                calledBalls
                              ).winningCoords
                            }
                            playerName={players.length > 1 ? activePlayer.name : undefined}
                            cardIndex={activePlayer.activeCardIndex || 0}
                            totalCards={activePlayer.cards.length}
                            displayMode={displayMode}
                            onChangeDisplayMode={setDisplayMode}
                            calledBalls={calledBalls}
                            currentBall={calledBalls[calledBalls.length - 1] || null}
                            onPause={() => setScreen('PAUSED')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );

              if (screenDevice === 'mobile') {
                return (
                  <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-3 pb-20">
                    {actionNoticeBox}

                    {/* Mobile Trommel (i vanlig dokumentflyt — dekker ikke kortet under rulling) */}
                    {mobileShowBlender && (
                      <div className="w-full">
                        <BallCageCanvas
                          onBallDrawn={handleBallDrawn}
                          calledBalls={calledBalls}
                          uncalledBalls={uncalledBalls}
                          isAutoCalling={isAutoCalling}
                          onToggleAuto={() => setIsAutoCalling(!isAutoCalling)}
                          onOpenMixer={() => setIsMixerOpen(true)}
                          onOpenAudience={handleOpenAudience}
                          onScramble={handleShuffleBalls}
                          onRefillDrum={handleRefillDrumKeepCards}
                          scrambleTrigger={scrambleTrigger}
                          onPause={() => setScreen('PAUSED')}
                          isPaused={false}
                          canDraw={canHostDrawBalls}
                          readOnlyMessage="🔒 Kun arrangør styrer kuletrekningen"
                          compactSidebar={true}
                        />
                      </div>
                    )}

                    {/* Mobile Milepæler & Rop BINGO! (rett over brettet, uten ekstra trekk-rad og uten å flyte over kortet) */}
                    {milestonePanel}

                    {/* Mobile Player & Card Switchers + Board */}
                    {playersAndCardsBlock}

                    {/* Mobile Standings */}
                    {standingsSection}

                    {/* Compact Mobile Bottom Quick Dock (<= 48px — viser alltid siste kule uten å dekke bingokortet) */}
                    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-md px-2 py-1.5 rounded-2xl bg-black/95 backdrop-blur-md border border-amber-400/45 shadow-2xl flex items-center justify-between gap-1.5">
                      {/* Compact Live Ball Readout inside bottom dock */}
                      <div
                        className="flex items-center gap-1.5 min-w-0 px-1.5 py-0.5 rounded-xl bg-amber-950/60 border border-amber-500/30"
                        title={
                          calledBalls.length > 0
                            ? `${calledBalls[calledBalls.length - 1].letter}-${calledBalls[calledBalls.length - 1].number}: ${calledBalls[calledBalls.length - 1].affirmation}`
                            : 'Ingen kule trukket ennå'
                        }
                      >
                        <span className="font-mono font-black text-xs text-amber-300 shrink-0 tabular-nums">
                          {calledBalls.length > 0
                            ? `${calledBalls[calledBalls.length - 1].letter}-${calledBalls[calledBalls.length - 1].number}`
                            : 'Klar'}
                        </span>
                        {calledBalls.length > 0 && (
                          <span className="text-[10px] text-amber-100/85 truncate max-w-[70px]">
                            {calledBalls[calledBalls.length - 1].affirmation}
                          </span>
                        )}
                      </div>

                      {canHostDrawBalls && (
                        uncalledBalls.length === 0 ? (
                          <button
                            type="button"
                            onClick={handleRefillDrumKeepCards}
                            className="py-1.5 px-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0"
                            title="Bland alle 75 kuler på nytt uten å nullstille brett"
                          >
                            <span>🔄</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (uncalledBalls.length > 0) {
                                const chosen = uncalledBalls[Math.floor(Math.random() * uncalledBalls.length)];
                                handleBallDrawn(chosen);
                              }
                            }}
                            className="py-1.5 px-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0"
                            title="Trekk neste kule"
                          >
                            <span>🎲 Trekk</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        disabled={!eligibleBingoClaim}
                        onClick={() => handlePhysicalBingoCall()}
                        className={`flex-1 py-1.5 px-2 font-black text-[11px] rounded-xl shadow flex items-center justify-center gap-1 transition-all truncate ${
                          eligibleBingoClaim
                            ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 text-white active:scale-95 cursor-pointer ring-2 ring-amber-200 animate-pulse'
                            : 'bg-white/5 border border-amber-500/25 text-amber-200/45 cursor-not-allowed'
                        }`}
                        title={
                          eligibleBingoClaim
                            ? `Trykk for å rope ${eligibleBingoClaim.pattern}!`
                            : 'Låst til 1. rekke, 3. rekker eller Full brett er fylt og bekreftet'
                        }
                      >
                        <span className="truncate">{eligibleBingoClaim ? eligibleBingoClaim.label : '🔒 BINGO'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileShowBlender(!mobileShowBlender)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold cursor-pointer shrink-0 ${
                          mobileShowBlender
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-black/60 border-amber-500/35 text-amber-200'
                        }`}
                        title={mobileShowBlender ? 'Skjul 3D trommel' : 'Vis 3D trommel'}
                      >
                        🎰
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setScreen('PAUSED');
                        }}
                        className="py-1.5 px-2 bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/30 text-amber-200 font-bold text-xs rounded-xl shadow cursor-pointer flex items-center active:scale-95 shrink-0"
                        title="Pause spillet og frys spilletiden"
                      >
                        ⏸️
                      </button>
                    </div>
                  </div>
                );
              }

              // STAGE ONLY FOCUS (TV / Caller Cage mode without boards)
              if ((mode === 'ALL_IN_ONE' && unifiedView === 'stage') || mode === 'CALLER_CAGE') {
                return (
                  <div className="w-full flex flex-col items-center gap-5">
                    <div className={`w-full ${screenDevice === 'big_screen' ? 'max-w-2xl' : 'max-w-xl'}`}>
                      <BallCageCanvas
                        onBallDrawn={handleBallDrawn}
                        calledBalls={calledBalls}
                        uncalledBalls={uncalledBalls}
                        isAutoCalling={isAutoCalling}
                        onToggleAuto={() => setIsAutoCalling(!isAutoCalling)}
                        onOpenMixer={() => setIsMixerOpen(true)}
                        onOpenAudience={handleOpenAudience}
                        onScramble={handleShuffleBalls}
                        onRefillDrum={handleRefillDrumKeepCards}
                        scrambleTrigger={scrambleTrigger}
                        onPause={() => setScreen('PAUSED')}
                        isPaused={false}
                        canDraw={canHostDrawBalls}
                        readOnlyMessage="🔒 Kun arrangør styrer kuletrekningen"
                      />
                    </div>
                    {standingsSection}
                  </div>
                );
              }

              // DESKTOP / PC / TV SPLIT VIEW: Sticky Floating Left Trommel & Milepæler Rail + Right Bingo Cards & Standings
              return (
                <div className="w-full flex flex-col md:flex-row items-start gap-4 lg:gap-6">
                  {/* Left Floating Rail: Stays pinned on the left side of the Bingo Card while scrolling up/down */}
                  <aside className="w-full md:w-[350px] lg:w-[410px] xl:w-[440px] shrink-0 md:sticky md:top-3 self-start md:max-h-[calc(100vh-1.5rem)] md:overflow-y-auto no-scrollbar space-y-2.5 z-20">
                    <BallCageCanvas
                      onBallDrawn={handleBallDrawn}
                      calledBalls={calledBalls}
                      uncalledBalls={uncalledBalls}
                      isAutoCalling={isAutoCalling}
                      onToggleAuto={() => setIsAutoCalling(!isAutoCalling)}
                      onOpenMixer={() => setIsMixerOpen(true)}
                      onOpenAudience={handleOpenAudience}
                      onScramble={handleShuffleBalls}
                      onRefillDrum={handleRefillDrumKeepCards}
                      scrambleTrigger={scrambleTrigger}
                      onPause={() => setScreen('PAUSED')}
                      isPaused={false}
                      canDraw={canHostDrawBalls}
                      readOnlyMessage="🔒 Kun arrangør styrer kuletrekningen"
                      compactSidebar={true}
                    />

                    {/* Milepæler & Rop BINGO! directly attached below Trommelen in left rail (never overlaps Bingo Card!) */}
                    {milestonePanel}

                    {/* Physical Confirmation Feedback inside left rail so it never obscures the board */}
                    {actionNoticeBox}
                  </aside>

                  {/* Right Main Area: Interactive Bingo Cards + Host Standings & Participants */}
                  <div className="flex-1 min-w-0 w-full flex flex-col items-center gap-5">
                    {playersAndCardsBlock}
                    {standingsSection}
                  </div>
                </div>
              );
            })()}
          </main>

          {/* Bottom Control Bar */}
          <footer className={`relative z-20 flex flex-wrap items-center justify-between gap-2 w-full ${playContainerWidth} mx-auto pt-3 text-2xs text-amber-300/60 font-medium`}>
            <div className="flex items-center gap-2">
              <span>{displayMode === 'numbers' ? 'Numbered 1-75 Card' : 'Joy Connection Card'}</span>
              <span>·</span>
              <span>
                {activePlayer ? `${activePlayer.cards.length} Cards in Play` : '1 Card in Play'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsShareOpen(true);
                }}
                className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:text-amber-100 cursor-pointer"
              >
                Share Progress
              </button>
            </div>
          </footer>
        </div>
        );
      })()}

      {/* Screen 3: Pause Modal with RIL Pause Music Player and Timer Pausing */}
      {screen === 'PAUSED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#1a1209] border-2 border-amber-500/50 rounded-3xl p-6 text-center text-amber-50 shadow-2xl space-y-3">
            <h3 className="font-display text-2xl font-black text-amber-200">
              ⏸️ Spillet er Pauset
            </h3>
            
            {/* Paused timer indicator */}
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-2xs text-amber-200 flex items-center justify-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              {isOwnerActive ? (
                <span>Eiermodus aktiv: <strong className="text-emerald-300">∞ Ubegrenset (Eier)</strong></span>
              ) : (
                <span>Spilletiden er fryst på: <strong className="text-amber-100">{sessionRemaining}</strong></span>
              )}
            </div>

            {isOwnerActive && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setScreen('PLAYING');
                  setIsOwnerControlOpen(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>👑</span>
                <span>Åpne Eierpanel</span>
              </button>
            )}

            {/* RIL Pause Music Player with Dropdown */}
            <RilMusicPlayer className="text-left" />

            <div className="space-y-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  setScreen('PLAYING');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-heading font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('resume_game')}</span>
              </button>

              {/* Reset Game button: Clears session progress and returns to Title Screen */}
              <button
                onClick={handleResetGame}
                className="w-full py-3 bg-gradient-to-r from-rose-900/80 via-rose-800/80 to-amber-900/80 hover:from-rose-800 hover:to-amber-800 border-2 border-rose-500/50 hover:border-rose-400 text-rose-100 font-heading font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
                title="Clears current bingo session progress and returns to Title Screen to start fresh"
              >
                <svg className="w-4 h-4 text-rose-300 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('reset_game')} (Start Fresh)</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsPrintOpen(true);
                }}
                className="w-full py-2.5 bg-amber-950/60 border border-amber-500/30 text-amber-200 font-semibold text-xs rounded-xl hover:bg-amber-900/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>{t('print_cards')}</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setScreen('TITLE');
                }}
                className="w-full py-2 text-xs text-amber-400/70 hover:text-amber-200 cursor-pointer transition-colors"
              >
                Quit to Title Screen (Keep Progress)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 4: Victory Modal */}
      <VictoryModal
        isOpen={screen === 'VICTORY'}
        onPlayAgain={() => {
          if (isRemoteParticipant) {
            setScreen('PLAYING');
            return;
          }
          handleStartGame(mode, theme, players.length, numCardsPerPlayer, displayMode);
        }}
        onOpenShareModal={() => setIsShareOpen(true)}
        winnerName={activePlayer?.name}
        card={activePlayer?.cards[activePlayer.activeCardIndex || 0] || []}
        linesCompleted={activePlayer?.linesCompleted || 1}
      />

      {/* Real-time In-Game Social Chat & Reactions Drawer */}
      <SocialChatDrawer
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        onEmojiBurst={() => {
          sounds.playPop(1.4);
          particleRef.current?.burst(window.innerWidth * 0.8, window.innerHeight * 0.7, 16);
        }}
      />

      {/* Friends & Player Directory Drawer */}
      <FriendsDrawer
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        currentRoomId={socialSocket.getProfile().roomId}
      />

      {/* Custom Bingo Card Creator Modal */}
      <CustomCardCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onCardCreated={handleCustomCardCreated}
      />

      {/* Share Achievement & Community Card Modal */}
      <ShareAchievementModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        achievementTitle={activePlayer?.hasBingo ? 'Full House Joyful BINGO!' : 'Warmth & Connection Journey'}
        cardTitle={THEMES[theme]?.title || 'Custom Community Card'}
        stats={{
          connectionsMade: playerStats.storiesShared || playerStats.daubsCount,
          pointsEarned: playerStats.points,
          linesCompleted: activePlayer?.linesCompleted || 0,
        }}
      />

      {/* Printable Cards Modal (supports numerous & numerical) */}
      <PrintableCardsModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        defaultTheme={theme}
      />

      {/* Mixer & Cage Control Station */}
      <MixerConsoleModal
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        onTriggerAgitateMix={handleTriggerAgitateMix}
        onShuffleBalls={handleShuffleBalls}
        onRefillDrum={canHostDrawBalls ? handleRefillDrumKeepCards : undefined}
        ballsRemaining={uncalledBalls.length}
        calledBalls={calledBalls}
        currentBall={calledBalls[calledBalls.length - 1] || null}
        onDrawBall={() => {
          if (!canHostDrawBalls) return;
          if (uncalledBalls.length > 0) {
            const chosen = uncalledBalls[Math.floor(Math.random() * uncalledBalls.length)];
            handleBallDrawn(chosen);
          }
        }}
      />

      {/* Audience TV & Projector Presentation Screen */}
      <AudienceDisplayModal
        isOpen={isAudienceOpen}
        onClose={() => setIsAudienceOpen(false)}
        calledBalls={calledBalls}
        uncalledBalls={uncalledBalls}
        onDrawNextBall={handleDrawNextBallForAudience}
        players={players}
        roomName={socialSocket.getProfile().roomId}
        activeTheme={theme}
        canControlDraw={canHostDrawBalls}
        onToggleCell={(playerIdx, cardIdx, r, c) => {
          if (!canHostDrawBalls) return;
          handleToggleCell(cardIdx, r, c, undefined, undefined, playerIdx);
        }}
        onAgitateMix={() => {
          if (!canHostDrawBalls) return;
          handleTriggerAgitateMix(1.2);
        }}
        onRefillDrum={canHostDrawBalls ? handleRefillDrumKeepCards : undefined}
        onOpenRemoteBingo={() => setIsRemoteBingoOpen(true)}
        onOpenTvMode={(game, code) => setTvModeConfig({ active: true, game, code })}
        onStartNewRound={handleStartNewBingoRound}
      />

      {/* Daily Joy Quests & Challenges Modal */}
      <DailyQuestsModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        onRewardClaimed={() => {
          particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.45, 26);
        }}
      />

      {/* 24-Hour Daily Plan & Schedule Table Modal */}
      <DailyScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onCelebrate={() => {
          particleRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.4, 25);
        }}
      />

      {/* Monetization, Host Commission & Vipps Modal */}
      <MonetizationModal
        isOpen={isMonetizationOpen}
        onClose={() => setIsMonetizationOpen(false)}
        activePlayerCount={players.length > 0 ? players.length : 1}
      />

      {/* Eier- & Vertskontroll Modal (Adhanom) */}
      <OwnerControlModal
        isOpen={isOwnerControlOpen}
        onClose={() => setIsOwnerControlOpen(false)}
        players={players}
        onDrawBall={() => {
          if (uncalledBalls.length > 0) {
            handleDrawNextBallForAudience();
          }
        }}
        onAgitateMix={() => handleTriggerAgitateMix(1.3)}
        onResetRound={handleResetGame}
        onSwitchScreenDevice={(dev) => {
          setScreenDevice(dev);
          if (dev === 'big_screen') handleOpenAudience();
        }}
        onBanPlayer={handleBanPlayer}
        uncalledBallsCount={uncalledBalls.length}
        calledBallsCount={calledBalls.length}
      />

      {/* Kringkasting for bingoverter og spillere */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />

      {/* Deltakere & Antall for bingoverter og spillere */}
      <ParticipantsModal
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        playerNames={players.length > 0 ? players.map((p) => p.name) : sessionPlayerNames}
        onUpdatePlayerNames={(names) => {
          setSessionPlayerNames(names);
          if (players.length > 0) {
            const updated = names.map((name, idx) =>
              players[idx]
                ? { ...players[idx], name }
                : {
                    id: `p-${idx + 1}`,
                    name,
                    avatarColor: '#f59e0b',
                    cards: players[0]?.cards || [],
                    activeCardIndex: 0,
                    linesCompleted: 0,
                    hasBingo: false,
                  }
            );
            setPlayers(updated);
          }
        }}
      />

      {/* Innlogging & Brukerprofil Modal (Arrangørinnlogging + Kahoot hurtigtilgang) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleAuthSuccess}
        onRequirePayment={() => setIsVippsModalOpen(true)}
        onOpenOwnerControl={() => setIsOwnerControlOpen(true)}
        onQuickJoinQuiz={() => {
          setQuizInitialEdition('family');
          setQuizInitialTab('join');
          setIsQuizModalOpen(true);
        }}
        onQuickJoinBingo={() => {
          setIsRemoteBingoOpen(true);
        }}
      />

      {/* Rapporter Problem & Tilbakemelding Modal */}
      <ReportProblemModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* iOS & Apple Device Install Helper Modal */}
      <IosInstallModal
        isOpen={isIosInstallOpen}
        onClose={() => setIsIosInstallOpen(false)}
      />

      {/* Spilletid Utløpt & Automatisk Utlogging Modal */}
      <EventTimeoutModal
        isOpen={isEventTimeoutOpen}
        onClose={() => {
          setIsEventTimeoutOpen(false);
          if (sessionTimer.hasTimedOut()) {
            sessionTimer.resetToUnpaid();
          }
        }}
        onSessionExtended={() => {
          timeoutHandledRef.current = false;
          setIsEventTimeoutOpen(false);
        }}
        onOpenVippsPayment={() => {
          setIsEventTimeoutOpen(false);
          if (sessionTimer.hasTimedOut()) {
            sessionTimer.resetToUnpaid();
          }
          handleOpenPaymentGuarded();
        }}
      />

      {/* Interaktiv Vipps Betalingsmodal (valg av spilletid for spillere og vert) */}
      <VippsPaymentModal
        isOpen={isVippsModalOpen}
        onClose={() => setIsVippsModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onBackToAuth={() => {
          setIsVippsModalOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Hub for valg av spillform for arrangement: Storskjerm, Avstandsbingo eller Klassisk */}
      <GameModeSelectorModal
        isOpen={isGameSelectorOpen}
        onClose={() => setIsGameSelectorOpen(false)}
        onOpenOwnerControl={() => setIsOwnerControlOpen(true)}
        onSelectBigScreen={() => {
          setIsGameSelectorOpen(false);
          setIsRemoteBingoOpen(false);
          const p = pendingGameStart;
          setPendingGameStart(null);
          if (screen === 'PLAYING' && players.length > 0 && (calledBalls.length > 0 || uncalledBalls.length > 0)) {
            setScreenDevice('big_screen');
            setIsAudienceOpen(true);
          } else {
            handleStartGame(
              p?.chosenMode || mode,
              p?.chosenTheme || theme,
              p?.playerCount || players.length || 2,
              p?.cardsCount || numCardsPerPlayer,
              p?.initialDisplayMode || displayMode,
              p?.customPlayerNames,
              'big_screen'
            );
          }
        }}
        onSelectRemoteBingo={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          const p = pendingGameStart;
          setPendingGameStart(null);
          if (screen !== 'PLAYING' || players.length === 0) {
            handleStartGame(
              p?.chosenMode || mode,
              p?.chosenTheme || theme,
              p?.playerCount || 1,
              p?.cardsCount || 1,
              p?.initialDisplayMode || displayMode,
              p?.customPlayerNames
            );
          }
          setIsRemoteBingoOpen(true);
        }}
        onSelectAdultQuiz={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          setIsRemoteBingoOpen(false);
          setPendingGameStart(null);
          handleOpenQuiz('adult', 'host');
        }}
        onSelectFamilyQuiz={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          setIsRemoteBingoOpen(false);
          setPendingGameStart(null);
          handleOpenQuiz('family', 'host');
        }}
        onSelectChristmasQuiz={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          setIsRemoteBingoOpen(false);
          setPendingGameStart(null);
          handleOpenQuiz('christmas', 'host');
        }}
        onSelectMemory={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          setIsRemoteBingoOpen(false);
          setPendingGameStart(null);
          handleOpenMemoryGuarded();
        }}
        onSelectClassicBoard={() => {
          setIsGameSelectorOpen(false);
          setIsAudienceOpen(false);
          setIsRemoteBingoOpen(false);
          const p = pendingGameStart;
          setPendingGameStart(null);
          if (screen === 'PLAYING' && players.length > 0 && (calledBalls.length > 0 || uncalledBalls.length > 0)) {
            setScreenDevice('desktop');
          } else {
            handleStartGame(
              p?.chosenMode || mode,
              p?.chosenTheme || theme,
              p?.playerCount || players.length || 2,
              p?.cardsCount || numCardsPerPlayer,
              p?.initialDisplayMode || displayMode,
              p?.customPlayerNames,
              'desktop'
            );
          }
        }}
      />

      {/* Kultur-, Musikk- & Fanquiz Modal (Valg 3: Voksenutgave & Valg 4: Familie/Barn) */}
      <QuizGameModal
        isOpen={isQuizModalOpen}
        initialEdition={quizInitialEdition}
        initialTab={quizInitialTab}
        initialJoinCode={pendingJoinCode}
        onClose={() => {
          setIsQuizModalOpen(false);
          setPendingJoinCode('');
        }}
        onOpenVippsModal={handleOpenPaymentGuarded}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSwitchToBigScreenBingo={() => handleOpenAudience()}
        onSwitchToRemoteBingo={() => setIsRemoteBingoOpen(true)}
        onOpenTvMode={(game, code) => setTvModeConfig({ active: true, game, code })}
      />

      {/* 6. Spill: Memory (20 bildekort · 10 par · Lagspill for barn & familier) */}
      <MemoryGameModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        onSwitchToOtherGames={handleOpenGameSelectorGuarded}
      />

      {/* Avstandsbingo Modal (delta med spillkode eller vis vertskode) */}
      <RemoteBingoModal
        isOpen={isRemoteBingoOpen}
        initialJoinCode={pendingJoinCode}
        onClose={() => {
          setIsRemoteBingoOpen(false);
          setPendingJoinCode('');
        }}
        isHostPlaying={screen === 'PLAYING' && !isRemoteParticipant}
        onJoinedAsRemotePlayer={handleJoinedAsRemotePlayer}
        onStartNewRound={handleStartNewBingoRound}
        onOpenVippsModal={() => {
          setIsRemoteBingoOpen(false);
          handleOpenPaymentGuarded();
        }}
        onSwitchToBigScreen={() => handleOpenAudience()}
        onOpenTvMode={(game, code) => setTvModeConfig({ active: true, game, code })}
      />

      {/* Personvern & Barnetrygghet Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* Avstandsbingo Rop BINGO feiringsmodal */}
      <RemoteBingoClaimModal
        claim={remoteBingoClaim}
        onClose={() => setRemoteBingoClaim(null)}
        isHost={!remoteBingo.getIsRemotePlayer()}
        onStartNewRoundNow={handleStartNewBingoRound}
      />

      {/* Hemmelig Eierinnlogging Modal (åpnes via 5x trykk på mynt, Shift+E eller ?eier=true) */}
      <SecretOwnerLoginModal
        isOpen={isSecretOwnerLoginOpen}
        onClose={() => setIsSecretOwnerLoginOpen(false)}
        onSuccess={() => setIsOwnerControlOpen(true)}
      />

      {/* Hyggelig Vinneroppgave Modal for 1. og 3. rekke */}
      {winnerModalTask && (
        <WinnerTaskModal
          isOpen={winnerModalTask.isOpen}
          onClose={() => setWinnerModalTask(null)}
          winnerName={winnerModalTask.winnerName}
          linesCount={winnerModalTask.linesCount}
          isFullHouse={Boolean(winnerModalTask.isFullHouse)}
          task={winnerModalTask.task}
          onCompleteTask={() => {
            progression.recordStoryNote();
            particleRef.current?.celebrateBingo();
          }}
        />
      )}

      {/* Quest Completed Toast Banner */}
      {questToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-2xl border-2 border-amber-200">
            <span className="text-2xl">{questToast.icon}</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-black text-amber-950">Daily Quest Completed!</div>
              <div className="text-sm font-extrabold">{questToast.title} (+{questToast.rewardPoints} pts)</div>
            </div>
          </div>
        </div>
      )}

      {/* Real Stripe Payment Success Notice Modal */}
      {stripePaymentNotice && stripePaymentNotice.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-[#0e2118] via-[#09150f] to-[#040a07] border-2 border-emerald-400 text-center text-white shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg animate-bounce">
              ✓
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black">
                EKTE STRIPE-BETALING FULLFØRT
              </span>
              <h3 className="font-heading font-black text-xl text-emerald-300 mt-2">
                Betaling Vellykket & Godkjent!
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                Beløpet på <strong className="text-white font-mono">{stripePaymentNotice.amount} NOK</strong> ble godkjent og faktisk trukket via Stripe. Pengene er overført til din saldo, og spilletiden (<strong className="text-amber-300">{stripePaymentNotice.label}</strong>) er umiddelbart aktivert!
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/30 text-2xs font-mono text-emerald-300/80">
              Transaksjonsreferanse: {stripePaymentNotice.reference}
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playPop(1.1);
                setStripePaymentNotice(null);
                setIsGameSelectorOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all"
            >
              Velg spillform (Storskjerm / Avstandsbingo) ➔
            </button>
          </div>
        </div>
      )}

      {/* Social Wellbeing / Disturbant Banned Notice Modal */}
      {bannedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#1a0f08] border-2 border-rose-500/50 shadow-2xl text-center text-amber-50">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 mx-auto flex items-center justify-center text-3xl mb-4">
              🛡️
            </div>
            <h2 className="font-heading text-xl font-bold text-rose-300 mb-2">
              Social Wellbeing Notice
            </h2>
            <p className="text-sm text-amber-100/90 leading-relaxed mb-4">
              {bannedNotice}
            </p>
            <p className="text-xs text-amber-300/60 mb-6">
              This application is built for uplifting human connection, mutual respect, and joyful play. Disruptive behavior is not permitted.
            </p>
            <button
              onClick={() => {
                setBannedNotice(null);
                setScreen('TITLE');
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-sm cursor-pointer shadow-lg"
            >
              Return to Title Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
