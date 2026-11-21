/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { authService } from '../services/authService';
import { sessionTimer } from '../services/sessionTimer';
import { remoteBingo } from '../services/remoteBingo';
import { ownerControl } from '../services/ownerControl';
import {
  CHRISTMAS_MIME_CARDS,
  QuizCategory,
  QuizEdition,
  QuizMimeCard,
  QuizQuestion,
  QuizQuestionType,
  getQuestionsForEdition,
  loadDrawnIdsForEdition,
  saveDrawnIdsForEdition,
  shuffleQuestionOptions,
  shuffleQuizItems,
} from '../data/quizQuestions';
import {
  DEFAULT_QUIZ_TEAMS,
  QuizRoomSnapshot,
  QuizTeamColor,
  QuizTeamDef,
  quizService,
} from '../services/quizService';

interface QuizGameModalProps {
  isOpen: boolean;
  initialEdition?: QuizEdition;
  initialTab?: 'host' | 'big_screen' | 'team_play' | 'join';
  initialJoinCode?: string;
  onClose: () => void;
  onOpenVippsModal?: () => void;
  onOpenAuth?: () => void;
  onSwitchToBigScreenBingo?: () => void;
  onSwitchToRemoteBingo?: () => void;
  onOpenTvMode?: (game: 'quiz' | 'bingo', code: string) => void;
}

const TEAM_STYLE: Record<
  QuizTeamColor,
  { bg: string; border: string; text: string; badge: string; icon: string }
> = {
  red: {
    bg: 'bg-rose-950/70',
    border: 'border-rose-500/60',
    text: 'text-rose-100',
    badge: 'bg-rose-500 text-white',
    icon: '🔴',
  },
  blue: {
    bg: 'bg-sky-950/70',
    border: 'border-sky-500/60',
    text: 'text-sky-100',
    badge: 'bg-sky-500 text-slate-950',
    icon: '🔵',
  },
  emerald: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/60',
    text: 'text-emerald-100',
    badge: 'bg-emerald-400 text-slate-950',
    icon: '🟢',
  },
  amber: {
    bg: 'bg-amber-950/70',
    border: 'border-amber-500/60',
    text: 'text-amber-100',
    badge: 'bg-amber-400 text-slate-950',
    icon: '🟡',
  },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const QuizGameModal: React.FC<QuizGameModalProps> = ({
  isOpen,
  initialEdition = 'adult',
  initialTab,
  initialJoinCode,
  onClose,
  onOpenVippsModal,
  onOpenAuth,
  onSwitchToBigScreenBingo,
  onSwitchToRemoteBingo,
  onOpenTvMode,
}) => {
  const [edition, setEdition] = useState<QuizEdition>(initialEdition);
  const [activeTab, setActiveTab] = useState<'host' | 'big_screen' | 'team_play' | 'join'>(
    initialTab || 'host'
  );
  const [snapshot, setSnapshot] = useState<QuizRoomSnapshot | null>(() => quizService.getSnapshot());
  const [remainingSec, setRemainingSec] = useState<number>(60);
  const [sessionRemaining, setSessionRemaining] = useState<string>(() =>
    sessionTimer.getFormattedRemaining()
  );
  const [hasFullPaid, setHasFullPaid] = useState<boolean>(() => sessionTimer.hasFullPaidAccess());
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Host state
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [activePreparedQ, setActivePreparedQ] = useState<QuizQuestion | null>(null);
  const [randomOrderEnabled, setRandomOrderEnabled] = useState<boolean>(true);
  const [drawnQuestionIds, setDrawnQuestionIds] = useState<string[]>(() =>
    loadDrawnIdsForEdition(initialEdition)
  );
  const [showQuestionList, setShowQuestionList] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<'all' | QuizQuestionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'Alle' | QuizCategory>('Alle');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [editingTeams, setEditingTeams] = useState<QuizTeamDef[]>(() =>
    quizService.getHostTeams()
  );
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState<boolean>(false);
  const [copiedTvLink, setCopiedTvLink] = useState<boolean>(false);
  const [hideSecretsOnHostDesktop, setHideSecretsOnHostDesktop] = useState<boolean>(false);
  const [isBigScreenFullscreen, setIsBigScreenFullscreen] = useState<boolean>(false);
  const [hostLocalChoice, setHostLocalChoice] = useState<number | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  // Mimelek state (50 katolske jule-mimeord, turbasert mellom lagene)
  const [hostActivityMode, setHostActivityMode] = useState<'quiz' | 'mime'>('quiz');
  const [activeMimeTeamIdx, setActiveMimeTeamIdx] = useState<number>(0);
  const [mimeRoundNumber, setMimeRoundNumber] = useState<number>(1);
  const [usedMimeIds, setUsedMimeIds] = useState<string[]>([]);
  const [mimeCandidateCards, setMimeCandidateCards] = useState<QuizMimeCard[]>(() =>
    CHRISTMAS_MIME_CARDS.slice(0, 5)
  );
  const [selectedMimeCard, setSelectedMimeCard] = useState<QuizMimeCard | null>(null);
  const [hideMimeWordOnHost, setHideMimeWordOnHost] = useState<boolean>(false);
  const [showAllMimeCards, setShowAllMimeCards] = useState<boolean>(false);
  const [mimeSearch, setMimeSearch] = useState<string>('');

  // Join form state (participants joining via koblingskode)
  const [joinCode, setJoinCode] = useState<string>(initialJoinCode || '');
  const [joinName, setJoinName] = useState<string>(() => {
    const u = authService.getCurrentUser();
    return u.isAuthenticated && u.name && u.name !== 'Gjest' ? u.name : '';
  });
  const [joinTeamId, setJoinTeamId] = useState<string>('team-red');
  const [customTeamName, setCustomTeamName] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Team screen selected option & AhaSlides typed-answer feedback
  const [localPickedOption, setLocalPickedOption] = useState<number | null>(null);
  const [openTextInput, setOpenTextInput] = useState<string>('');
  const [submittedOpenText, setSubmittedOpenText] = useState<string | null>(null);
  const [openTextError, setOpenTextError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setEdition(initialEdition);
    setRandomOrderEnabled(true);
    setDrawnQuestionIds(loadDrawnIdsForEdition(initialEdition));
    if (initialJoinCode && initialJoinCode.trim()) {
      setJoinCode(initialJoinCode.trim().toUpperCase());
      setJoinError(null);
    }
    const user = authService.getCurrentUser();
    const isOwner = user.role === 'owner' || ownerControl.isUnlocked();
    const isAuthenticatedHost = user.isAuthenticated || isOwner;
    const paid = sessionTimer.hasFullPaidAccess() || isOwner;
    setHasFullPaid(paid);

    if (initialTab === 'join') {
      setActiveTab('join');
    } else if (quizService.getIsRemoteParticipant()) {
      setActiveTab('team_play');
    } else if (paid && isAuthenticatedHost) {
      const hostName =
        (user.name && user.name !== 'Gjest' ? user.name : '') ||
        remoteBingo.getHostName();
      remoteBingo.activateHostSession(undefined, hostName);
      quizService.startHostSession(initialEdition, hostName);
      setActiveTab(initialTab || 'host');
    } else {
      setActiveTab('join');
    }
  }, [isOpen, initialEdition, initialTab, initialJoinCode]);

  useEffect(() => {
    const unsubQuiz = quizService.subscribe(() => {
      const next = quizService.getSnapshot();
      setSnapshot(next);
      setQuizError(quizService.getLastError());
      if (next) {
        setEdition((prevEd) => {
          if (prevEd !== next.edition) {
            setDrawnQuestionIds(loadDrawnIdsForEdition(next.edition));
          }
          return next.edition;
        });
        setEditingTeams(next.teams);
      }
    });

    const unsubQuizJoin = quizService.onParticipantJoined((p, total) => {
      sounds.playPop(1.2);
      setJoinNotice(`👋 ${p.name} ble med på ${p.teamName || 'laget'} med koden! (${total} aktive deltakere)`);
      setTimeout(() => setJoinNotice(null), 5000);
    });

    const unsubSession = sessionTimer.subscribe(() => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      setHasFullPaid(sessionTimer.hasFullPaidAccess());
    });

    return () => {
      unsubQuiz();
      unsubQuizJoin();
      unsubSession();
    };
  }, []);

  // Reset picked option & open-text input when question changes
  useEffect(() => {
    setLocalPickedOption(null);
    setHostLocalChoice(null);
    setOpenTextInput('');
    setSubmittedOpenText(null);
    setOpenTextError(null);
  }, [snapshot?.questionIndex, snapshot?.phase]);

  // 1-second synced countdown tick for 60s limit (quiz + mimelek)
  useEffect(() => {
    if (!isOpen) return;
    const updateTick = () => {
      const rem = quizService.getRemainingSeconds();
      setRemainingSec(rem);
    };
    updateTick();
    const timer = setInterval(updateTick, 250);
    return () => clearInterval(timer);
  }, [isOpen, snapshot?.phase, snapshot?.startedAt, snapshot?.mimeState?.status, snapshot?.mimeState?.startedAt]);

  if (!isOpen) return null;

  const currentAuthUser = authService.getCurrentUser();
  const isOwnerUser = currentAuthUser.role === 'owner' || ownerControl.isUnlocked();
  const isRemoteParticipant = quizService.getIsRemoteParticipant() && !isOwnerUser;
  const isHost = !isRemoteParticipant && (isOwnerUser || (currentAuthUser.isAuthenticated && hasFullPaid));
  const activeEdition = snapshot?.edition || edition;
  const questions = getQuestionsForEdition(activeEdition);
  const hostQuestion = questions[selectedQuestionIdx] || questions[0];
  const publicQuestion = snapshot?.currentQuestion;
  const phase = snapshot?.phase || 'lobby';
  const roomCode = isHost || isRemoteParticipant ? quizService.getRoomCode() : '';
  const showCodeOnBigScreen = snapshot?.showCodeOnScreen ?? true;
  const teams = snapshot?.teams || editingTeams || DEFAULT_QUIZ_TEAMS;
  const myTeamId = quizService.getMyTeamId();
  const myTeam = teams.find((t) => t.id === myTeamId) || teams[0];
  const sortedLeaderboard = [...teams].sort(
    (a, b) => (snapshot?.teamScores?.[b.id] || 0) - (snapshot?.teamScores?.[a.id] || 0)
  );

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleCopyJoinLink = () => {
    sounds.playClick();
    const shareUrl = `${window.location.origin}/?spill=quiz&utgave=${encodeURIComponent(activeEdition)}&kode=${encodeURIComponent(roomCode)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedJoinLink(true);
    setTimeout(() => setCopiedJoinLink(false), 2200);
  };

  const handleCopyTvLink = () => {
    sounds.playClick();
    const tvUrl = `${window.location.origin}/?tv=1&spill=quiz&kode=${encodeURIComponent(roomCode)}`;
    navigator.clipboard?.writeText(tvUrl).catch(() => {});
    setCopiedTvLink(true);
    setTimeout(() => setCopiedTvLink(false), 2400);
  };

  const toggleBigScreenFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsBigScreenFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsBigScreenFullscreen(false);
    }
  };

  const getCategoryDisplayLabel = (cat: 'Alle' | QuizCategory): string => {
    if (cat === 'Alle') return 'Alle';
    if (activeEdition === 'christmas') {
      if (cat === 'Musikk') return '🎵 Julesanger & Kirkemusikk';
      if (cat === 'Kultur') return '⛪ Katolsk Tro & Tradisjon';
      if (cat === 'Fans & Popkultur') return '📖 Bibelen & Helgener';
      if (cat === 'Ordlek & Humor') return '✨ Familiegåter & Glede';
    }
    return cat;
  };

  const drawMimeCandidates = (excludeIds: string[] = usedMimeIds) => {
    let pool = CHRISTMAS_MIME_CARDS.filter((c) => !excludeIds.includes(c.id));
    if (pool.length < 5) {
      pool = [...CHRISTMAS_MIME_CARDS];
      setUsedMimeIds([]);
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setMimeCandidateCards(shuffled.slice(0, 5));
  };

  const handleOpenMimeMode = () => {
    sounds.playClick();
    setHostActivityMode('mime');
    drawMimeCandidates();
    setSelectedMimeCard(null);
    setHideMimeWordOnHost(false);
    quizService.startMimeChoose(activeMimeTeamIdx, mimeRoundNumber);
  };

  const handleSelectMimeCardAndAct = (card: QuizMimeCard) => {
    sounds.playPop(1.1);
    setSelectedMimeCard(card);
    setShowAllMimeCards(false);
  };

  const handleLaunchSelectedMime60s = () => {
    if (!selectedMimeCard) return;
    sounds.playPop(1.15);
    setUsedMimeIds((prev) =>
      prev.includes(selectedMimeCard.id) ? prev : [...prev, selectedMimeCard.id]
    );
    quizService.startMimeActing(
      activeMimeTeamIdx,
      selectedMimeCard.id,
      selectedMimeCard.word,
      selectedMimeCard.category,
      mimeRoundNumber
    );
  };

  const handleJudgeMime = (guessedCorrect: boolean, points: number) => {
    if (guessedCorrect) {
      sounds.playLineComplete();
    } else {
      sounds.playClick();
    }
    quizService.revealMimeResult(guessedCorrect, points, selectedMimeCard?.word);
  };

  const handleNextMimeTeamTurn = () => {
    sounds.playClick();
    const nextIdx = (activeMimeTeamIdx + 1) % teams.length;
    const nextRound = mimeRoundNumber + 1;
    setActiveMimeTeamIdx(nextIdx);
    setMimeRoundNumber(nextRound);
    setSelectedMimeCard(null);
    setHideMimeWordOnHost(false);
    drawMimeCandidates();
    quizService.startMimeChoose(nextIdx, nextRound);
  };

  const handleEditionSwitch = (nextEd: QuizEdition) => {
    sounds.playClick();
    setEdition(nextEd);
    setSelectedQuestionIdx(0);
    setActivePreparedQ(null);
    setDrawnQuestionIds(loadDrawnIdsForEdition(nextEd));
    setRandomOrderEnabled(true);
    setHostActivityMode('quiz');
    quizService.switchEdition(nextEd);
  };

  const handleStartQuestion = (idx: number, edOverride?: QuizEdition) => {
    sounds.playPop(1.1);
    setHostActivityMode('quiz');
    const targetEd = edOverride || activeEdition;
    const editionQuestions = getQuestionsForEdition(targetEd);
    const rawQ = editionQuestions[idx] || editionQuestions[0];
    const prepared = randomOrderEnabled ? shuffleQuestionOptions(rawQ) : rawQ;
    setSelectedQuestionIdx(idx);
    setActivePreparedQ(prepared);
    setDrawnQuestionIds((prev) => {
      const next = prev.includes(rawQ.id) ? prev : [...prev, rawQ.id];
      saveDrawnIdsForEdition(targetEd, next);
      return next;
    });
    quizService.startQuestion(idx, prepared);
  };

  const handleReveal = () => {
    sounds.playLineComplete();
    const activeQ =
      activePreparedQ || questions[snapshot?.questionIndex ?? selectedQuestionIdx] || hostQuestion;
    quizService.revealAnswer(activeQ);
  };

  const handleRandomQuestion = (filterMode: 'all' | 'open_text' | 'multiple_choice' | boolean = 'all') => {
    const resolvedFilter: 'all' | 'open_text' | 'multiple_choice' =
      filterMode === true ? 'open_text' : filterMode === false ? 'all' : filterMode;
    const currentIdx = snapshot?.questionIndex ?? selectedQuestionIdx;
    // Hent strengt kun fra valgt quiz-utgave (aldri blandet mellom forskjellige quizer)
    const editionQuestions = getQuestionsForEdition(activeEdition);
    const matchingEntries = editionQuestions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        if (resolvedFilter === 'open_text') return q.questionType === 'open_text';
        if (resolvedFilter === 'multiple_choice') return (q.questionType || 'multiple_choice') === 'multiple_choice';
        return true;
      });
    if (matchingEntries.length === 0) return;

    let unused = matchingEntries.filter(
      ({ q, idx }) => !drawnQuestionIds.includes(q.id) && idx !== currentIdx
    );
    if (unused.length === 0) {
      // Bunken for dette filteret i denne quizen er brukt opp -> stokk kun denne quizen på nytt
      const matchingIds = new Set(matchingEntries.map(({ q }) => q.id));
      const cleared = drawnQuestionIds.filter((id) => !matchingIds.has(id));
      setDrawnQuestionIds(cleared);
      saveDrawnIdsForEdition(activeEdition, cleared);
      unused = matchingEntries.filter(({ idx }) => idx !== currentIdx);
      if (unused.length === 0) unused = matchingEntries;
    }

    const picked = shuffleQuizItems(unused)[0];
    handleStartQuestion(picked.idx, activeEdition);
  };

  const handleNextQuestion = () => {
    if (randomOrderEnabled) {
      handleRandomQuestion('all');
      return;
    }
    const currentIdx = snapshot?.questionIndex ?? selectedQuestionIdx;
    if (currentIdx + 1 < questions.length) {
      handleStartQuestion(currentIdx + 1);
    } else {
      sounds.playBingoWin();
      quizService.finishGame();
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    setJoinError(null);
    setIsJoining(true);
    const chosenDefault = DEFAULT_QUIZ_TEAMS.find((t) => t.id === joinTeamId) || DEFAULT_QUIZ_TEAMS[0];
    const res = await quizService.validateAndJoinQuizWithCode(
      joinCode,
      joinName,
      joinTeamId,
      customTeamName.trim() || chosenDefault.name,
      chosenDefault.color
    );
    setIsJoining(false);
    if (!res.success) {
      setJoinError(res.error || 'Kunne ikke koble til quizen.');
      sounds.playClick();
      return;
    }
    sounds.playBingoWin();
    setActiveTab('team_play');
  };

  const handleTeamAnswer = (optionIdx: number) => {
    if (phase !== 'question' || remainingSec <= 0) return;
    sounds.playPop(1.05);
    setLocalPickedOption(optionIdx);
    setHostLocalChoice(optionIdx);
    quizService.submitTeamAnswer(myTeam.id, optionIdx);
  };

  const handleTeamOpenTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'question' || remainingSec <= 0) return;
    setOpenTextError(null);
    const res = quizService.submitOpenTextAnswer(myTeam.id, openTextInput);
    if (!res.success) {
      setOpenTextError(res.error || 'Kunne ikke sende svaret.');
      sounds.playClick();
      return;
    }
    sounds.playPop(1.1);
    setSubmittedOpenText(res.cleanText || openTextInput.trim());
  };

  const handleHostRequirePaid = () => {
    sounds.playClick();
    const user = authService.getCurrentUser();
    if (!user.isAuthenticated && onOpenAuth) {
      onClose();
      onOpenAuth();
      return;
    }
    if (onOpenVippsModal) {
      onClose();
      onOpenVippsModal();
    }
  };

  const handleTeamRename = (teamId: string, newName: string) => {
    const updated = editingTeams.map((t) => (t.id === teamId ? { ...t, name: newName } : t));
    setEditingTeams(updated);
    quizService.updateTeams(updated);
  };

  const timeProgressPct = Math.max(0, Math.min(100, (remainingSec / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-7xl bg-gradient-to-b from-[#17121e] via-[#100c16] to-[#08060c] border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto max-h-[95vh]">

        {/* Clean Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#1b1424] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${
                activeEdition === 'christmas'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {activeEdition === 'adult' ? '🎭' : activeEdition === 'family' ? '🎈' : '🎄'}
            </div>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-white leading-tight">
                {activeEdition === 'adult'
                  ? 'QUIZ — Kultur-, Musikk- & Fanquiz'
                  : activeEdition === 'family'
                    ? 'Familie- & Barnequiz — Kultur, Musikk & Ordlek'
                    : `JuleQuiz — Katolsk Familiequiz & ${CHRISTMAS_MIME_CARDS.length} Mimelek`}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {(isHost && hasFullPaid && roomCode) || (isRemoteParticipant && snapshot?.roomCode) ? (
                  <>
                    <span>
                      Koblingskode:{' '}
                      <strong className="font-mono text-amber-300">
                        {hideSecretsOnHostDesktop && isHost ? '••••' : roomCode}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                ) : (
                  <>
                    <span>Deltaker med kode eller betalt arrangør</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>Maks 60 sek per spørsmål</span>
                {hasFullPaid && !isRemoteParticipant && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-300 font-mono tabular-nums">
                      Spilletid: {sessionRemaining}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch back to Bingo seamlessly using same paid session */}
            {isHost && onSwitchToBigScreenBingo && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSwitchToBigScreenBingo();
                }}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-amber-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                📺 Bingo Storskjerm
              </button>
            )}
            {isHost && onSwitchToRemoteBingo && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSwitchToRemoteBingo();
                }}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-cyan-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                📡 Avstandsbingo
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
              title="Lukk"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Segmented Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('host');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'host'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🎛️ Arrangør & Fasit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('big_screen');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'big_screen'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  📺 Storskjerm / TV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('team_play');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'team_play'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  📱 Lagskjerm (Mobil / Brett)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('join');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'join'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🔗 Delta med kode
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('join');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'join'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🔗 Koble til Quiz (Gratis med kode)
                </button>
                {isRemoteParticipant && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab('team_play');
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        activeTab === 'team_play'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      📱 Ditt Lag ({myTeam.name})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab('big_screen');
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        activeTab === 'big_screen'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      📺 Se Storskjerm
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Edition Toggle for Host */}
          {isHost && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => handleEditionSwitch('adult')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  activeEdition === 'adult'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎭 QUIZ
              </button>
              <button
                type="button"
                onClick={() => handleEditionSwitch('family')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  activeEdition === 'family'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎈 Familie & Barn
              </button>
              <button
                type="button"
                onClick={() => handleEditionSwitch('christmas')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  activeEdition === 'christmas'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎄 JuleQuiz
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-left">
          {joinNotice && isHost && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-100 text-xs sm:text-sm font-black flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <span>{joinNotice}</span>
              <button
                type="button"
                onClick={() => setJoinNotice(null)}
                className="text-emerald-200 hover:text-white px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW 1: HOST CONTROL & ANSWER KEY (ARRANGØR & FASIT)  */}
          {/* ===================================================== */}
          {activeTab === 'host' && isHost && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* Left 7 cols: Active Question, 60s Control & FASIT */}
              <div className="lg:col-span-7 space-y-4">

                {/* Koblingskode & Storskjerm / TV Personvern Strip */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-300">
                        📡 Deltakerkode (åpen for alle skjermer · fasiter og privat arrangør-innlogging holdes skjult):
                      </div>
                      <div className="font-mono font-black text-2xl sm:text-3xl text-amber-300 tracking-widest mt-0.5">
                        {hideSecretsOnHostDesktop ? '••••' : roomCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                      >
                        {copiedCode ? '✓ Kopiert!' : '📋 Kopier kode'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyJoinLink}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 font-bold text-xs cursor-pointer transition-colors"
                      >
                        {copiedJoinLink ? '✓ Lenke kopiert!' : '🔗 Deltakerlenke'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyTvLink}
                        className="px-3.5 py-2 rounded-xl bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/50 text-purple-100 font-bold text-xs cursor-pointer transition-colors"
                        title="Åpne denne lenken på TV, Smart-TV eller prosjektor for ren publikumsvisning uten fasit og kode"
                      >
                        {copiedTvLink ? '✓ TV-lenke kopiert!' : '📺 Kopier TV / Prosjektor-lenke'}
                      </button>
                      {onOpenTvMode && roomCode && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onClose();
                            onOpenTvMode('quiz', roomCode);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-100 font-bold text-xs cursor-pointer transition-colors"
                        >
                          🖥️ Ren TV-visning her
                        </button>
                      )}
                      {hostActivityMode === 'quiz' && (
                        <button
                          type="button"
                          onClick={() => setShowQuestionList(!showQuestionList)}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white cursor-pointer transition-colors"
                        >
                          {showQuestionList ? 'Skjul fasitliste' : `📖 Alle ${questions.length} spørsmål & fasit`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Presenter Privacy Controls */}
                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        quizService.toggleCodeOnScreen(!showCodeOnBigScreen);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-colors ${
                        showCodeOnBigScreen
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                          : 'bg-black/50 border-white/20 text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      {showCodeOnBigScreen
                        ? '📡 Deltakerkode ÅPEN på alle skjermer (Klikk for å skjule)'
                        : '🔒 Deltakerkode SKJULT på TV (Klikk for å åpne)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setHideSecretsOnHostDesktop((v) => !v);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-colors ${
                        hideSecretsOnHostDesktop
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                          : 'bg-black/50 border-white/20 text-slate-200 hover:border-amber-400'
                      }`}
                      title="Aktiver hvis du speiler din egen PC til projektoren og ikke vil at publikum skal se fasit og kode"
                    >
                      {hideSecretsOnHostDesktop
                        ? '🙈 Prosjektormaske PÅ (Fasit & kode skjult her)'
                        : '🙈 Skjul fasit & kode på min skjerm'}
                    </button>
                  </div>
                </div>

                {/* Activity Mode Bar: Spørsmålsquiz (Tilfeldig trekk) vs. Katolsk Mimelek (50 ord) */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#23121b] via-[#171222] to-[#111c19] border border-amber-400/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setHostActivityMode('quiz');
                        quizService.stopMimeMode();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        hostActivityMode === 'quiz'
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-white/10 text-slate-200 hover:bg-white/15'
                      }`}
                    >
                      🎙️ Spørsmålsquiz ({questions.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenMimeMode}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        hostActivityMode === 'mime'
                          ? 'bg-rose-500 text-white shadow ring-2 ring-rose-300/60'
                          : 'bg-rose-500/20 border border-rose-400/50 text-rose-200 hover:bg-rose-500/30'
                      }`}
                    >
                      🎭 Mimelek ({CHRISTMAS_MIME_CARDS.length} katolske ord · Lagrundgang)
                    </button>
                  </div>

                  {hostActivityMode === 'quiz' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setRandomOrderEnabled((v) => !v);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                          randomOrderEnabled
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-white/5 border-white/15 text-slate-300'
                        }`}
                        title="Trekk spørsmål og svaralternativer i tilfeldig rekkefølge kun fra denne quizen uten gjentakelser"
                      >
                        {randomOrderEnabled
                          ? `🔀 Tilfeldig trekk: PÅ (${Math.max(0, questions.length - drawnQuestionIds.length)}/${questions.length} igjen)`
                          : '📋 Rekkefølge: Fast'}
                      </button>
                      {drawnQuestionIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setDrawnQuestionIds([]);
                            saveDrawnIdsForEdition(activeEdition, []);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-amber-200 cursor-pointer"
                          title="Stokk alle spørsmålene i denne quizen på nytt"
                        >
                          🔄 Stokk ({drawnQuestionIds.length} brukt)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ===================================================== */}
                {/* HOST MIMELEK PANEL (KATOLSKE JULE-MIMEORD)            */}
                {/* ===================================================== */}
                {hostActivityMode === 'mime' && (() => {
                  const mimeState = snapshot?.mimeState;
                  const currentTurnTeam = teams[activeMimeTeamIdx] || teams[0];
                  const nextTurnTeam = teams[(activeMimeTeamIdx + 1) % teams.length] || teams[0];
                  const curTeamStyle = TEAM_STYLE[currentTurnTeam.color] || TEAM_STYLE.red;
                  const mimeFiltered = CHRISTMAS_MIME_CARDS.filter((c) => {
                    if (!mimeSearch.trim()) return true;
                    const q = mimeSearch.trim().toLowerCase();
                    return c.word.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
                  });

                  return (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2a1118] via-[#18101c] to-black/80 border-2 border-rose-400/60 space-y-4 shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <div className="text-xs font-black text-rose-300 uppercase tracking-wide">
                            🎭 Katolsk Jule-Mimelek · Runde {mimeRoundNumber} ({CHRISTMAS_MIME_CARDS.length} ord)
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                            <span>Tur nå:</span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${curTeamStyle.badge}`}>
                              {curTeamStyle.icon} {currentTurnTeam.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {teams.map((t, tIdx) => {
                            const st = TEAM_STYLE[t.color];
                            const isActiveTurn = tIdx === activeMimeTeamIdx;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setActiveMimeTeamIdx(tIdx);
                                  if (mimeState?.status !== 'acting') {
                                    quizService.startMimeChoose(tIdx, mimeRoundNumber);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                                  isActiveTurn
                                    ? `${st.badge} border-white shadow`
                                    : 'bg-black/40 border-white/15 text-slate-300 hover:text-white'
                                }`}
                                title={`Gi turen til ${t.name}`}
                              >
                                {st.icon} {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {mimeState?.status === 'acting' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300">
                              ⏱️ {currentTurnTeam.name} mimer nå! Laget har 60 sek på å gjette:
                            </span>
                            <span
                              className={`font-mono tabular-nums font-black text-2xl ${
                                remainingSec <= 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
                              }`}
                            >
                              {remainingSec}s
                            </span>
                          </div>

                          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-200 ${
                                remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, (remainingSec / 60) * 100))}%` }}
                            />
                          </div>

                          <div className="p-4 rounded-xl bg-black/60 border border-amber-400/40 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-amber-300">
                                🤫 Hemmelig mimeord (skjult fra Storskjerm / TV):
                              </span>
                              <button
                                type="button"
                                onClick={() => setHideMimeWordOnHost((v) => !v)}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-slate-200 cursor-pointer"
                              >
                                {hideMimeWordOnHost ? '👁️ Vis ord' : '🙈 Skjul på min skjerm'}
                              </button>
                            </div>
                            {hideMimeWordOnHost ? (
                              <div className="text-sm font-bold text-slate-400 italic py-1">
                                [Skjult for å hindre smugtitting — trykk «Vis ord» for å sjekke fasit]
                              </div>
                            ) : (
                              <div>
                                <div className="font-heading font-black text-lg text-white">
                                  «{selectedMimeCard?.word || 'Katolsk juleord'}»
                                </div>
                                {selectedMimeCard?.tip && (
                                  <div className="text-xs text-slate-300 mt-0.5">
                                    💡 Mimetips: {selectedMimeCard.tip}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleJudgeMime(true, 100)}
                              className="py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg"
                            >
                              ✅ Riktig gjettet! (+100 p)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJudgeMime(true, 50)}
                              className="py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg"
                            >
                              🌟 Delvis riktig (+50 p)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJudgeMime(false, 0)}
                              className="py-3 px-4 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 border border-rose-400 text-rose-100 font-black text-xs sm:text-sm cursor-pointer"
                            >
                              ⏰ Tid ute / Avslør (0 p)
                            </button>
                          </div>
                        </div>
                      ) : mimeState?.status === 'revealed' ? (
                        <div className="space-y-4">
                          <div
                            className={`p-4 rounded-2xl border-2 ${
                              mimeState.guessedCorrect
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                                : 'bg-rose-950/50 border-rose-400/60 text-rose-100'
                            }`}
                          >
                            <div className="text-xs font-bold uppercase">
                              {mimeState.guessedCorrect
                                ? `🎉 ${currentTurnTeam.name} klarte det!`
                                : `⏰ Tiden gikk ut for ${currentTurnTeam.name}`}
                            </div>
                            <div className="font-heading font-black text-xl text-white mt-1">
                              Ordet var: «{mimeState.word || selectedMimeCard?.word}»
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextMimeTeamTurn}
                            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-lg"
                          >
                            ➡️ Neste lag: {TEAM_STYLE[nextTurnTeam.color].icon} {nextTurnTeam.name} (Velg ord hos arrangøren)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-100 leading-relaxed">
                            <strong>🤫 Slik fungerer det:</strong> Én spiller fra{' '}
                            <strong className="text-white">{currentTurnTeam.name}</strong> kommer bort til arrangøren og velger hvilket ord han/hun vil mime for laget sitt. Storskjermen avslører ingenting!
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-300">
                              Velg mellom 5 tilfeldige ord ({CHRISTMAS_MIME_CARDS.length - usedMimeIds.length} ubrukte igjen):
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  drawMimeCandidates();
                                  setSelectedMimeCard(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer"
                              >
                                🔄 Trekk 5 nye ord
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setShowAllMimeCards((v) => !v);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                              >
                                {showAllMimeCards ? 'Skjul liste' : `📖 Se alle ${CHRISTMAS_MIME_CARDS.length} ord`}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mimeCandidateCards.map((card) => {
                              const picked = selectedMimeCard?.id === card.id;
                              return (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => handleSelectMimeCardAndAct(card)}
                                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                                    picked
                                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg'
                                      : 'bg-black/45 border-white/15 hover:border-amber-400 text-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold text-amber-300 uppercase">
                                      {card.category}
                                    </span>
                                    {picked && (
                                      <span className="text-[11px] font-black text-emerald-300">✓ VALGT</span>
                                    )}
                                  </div>
                                  <div className="font-bold text-xs sm:text-sm leading-snug">{card.word}</div>
                                  <div className="text-[11px] text-slate-400">💡 {card.tip}</div>
                                </button>
                              );
                            })}
                          </div>

                          {showAllMimeCards && (
                            <div className="p-3 rounded-xl bg-black/60 border border-white/15 space-y-2.5">
                              <input
                                type="text"
                                value={mimeSearch}
                                onChange={(e) => setMimeSearch(e.target.value)}
                                placeholder={`Søk blant alle ${CHRISTMAS_MIME_CARDS.length} katolske mimeord...`}
                                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-amber-400"
                              />
                              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                                {mimeFiltered.map((c, mIdx) => {
                                  const used = usedMimeIds.includes(c.id);
                                  const picked = selectedMimeCard?.id === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectMimeCardAndAct(c)}
                                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 cursor-pointer ${
                                        picked
                                          ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                          : used
                                          ? 'bg-white/5 border-white/10 text-slate-400'
                                          : 'bg-white/5 border-white/15 hover:border-amber-400 text-slate-100'
                                      }`}
                                    >
                                      <span>
                                        <strong className="text-amber-300 mr-1.5">#{mIdx + 1}</strong>
                                        {c.word}{' '}
                                        <span className="text-[10px] text-slate-400">({c.category})</span>
                                      </span>
                                      {picked ? (
                                        <span className="text-emerald-300 font-black">✓ Valgt</span>
                                      ) : used ? (
                                        <span className="text-[10px] text-slate-500">Brukt</span>
                                      ) : (
                                        <span className="text-amber-300 font-bold">Velg</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedMimeCard && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={handleLaunchSelectedMime60s}
                                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-xl"
                              >
                                ▶️ Start 60 sek Mimelek for {currentTurnTeam.name}!{' '}
                                {hideSecretsOnHostDesktop ? '(Hemmelig ord valgt)' : `(«${selectedMimeCard.word}»)`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Full Question List & Answer Key Drawer */}
                {hostActivityMode === 'quiz' && showQuestionList && (() => {
                  const categories: Array<'Alle' | QuizCategory> = [
                    'Alle',
                    'Musikk',
                    'Kultur',
                    'Fans & Popkultur',
                    'Ordlek & Humor',
                  ];
                  const searchLower = questionSearch.trim().toLowerCase();
                  const filteredEntries = questions
                    .map((q, idx) => ({ q, idx }))
                    .filter(({ q }) => {
                      const qType = q.questionType || 'multiple_choice';
                      if (typeFilter !== 'all' && qType !== typeFilter) {
                        return false;
                      }
                      if (categoryFilter !== 'Alle' && q.category !== categoryFilter) {
                        return false;
                      }
                      if (!searchLower) return true;
                      return (
                        q.question.toLowerCase().includes(searchLower) ||
                        q.options.some((opt) => opt.toLowerCase().includes(searchLower)) ||
                        (q.acceptedAnswers || []).some((a) => a.toLowerCase().includes(searchLower)) ||
                        q.category.toLowerCase().includes(searchLower)
                      );
                    });

                  return (
                    <div className="p-4 rounded-2xl bg-black/50 border border-amber-400/30 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-amber-300">
                          Arrangørens oversikt & fasit ({filteredEntries.length} av {questions.length} ·{' '}
                          {activeEdition === 'adult'
                            ? 'QUIZ'
                            : activeEdition === 'family'
                              ? 'Familie & Barn'
                              : 'JuleQuiz — Katolsk Familiequiz'})
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuestionList(false);
                              handleRandomQuestion('multiple_choice');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                          >
                            ☑️ Tilfeldig A–D
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuestionList(false);
                              handleRandomQuestion('open_text');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                          >
                            ✍️ Tilfeldig Skriv-svar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuestionList(false);
                              handleRandomQuestion('all');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                            title="Trekk tilfeldig mellom flervalg og skriv-svar kun fra denne quizen"
                          >
                            🎲 Tilfeldig (Alle i quizen)
                          </button>
                        </div>
                      </div>

                      {/* Format Filter: All / AhaSlides Open-Text (50) / Multiple Choice (100) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: 'all' as const, label: `Alle (${questions.length})` },
                          {
                            id: 'open_text' as const,
                            label: `✍️ Skriv svar / AhaSlides (${questions.filter((q) => q.questionType === 'open_text').length})`,
                          },
                          {
                            id: 'multiple_choice' as const,
                            label: `☑️ Flervalg A–D (${questions.filter((q) => (q.questionType || 'multiple_choice') === 'multiple_choice').length})`,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setTypeFilter(tab.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              typeFilter === tab.id
                                ? 'bg-fuchsia-400 text-slate-950'
                                : 'bg-white/10 text-slate-200 hover:bg-white/15'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              categoryFilter === cat
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-white/10 text-slate-300 hover:bg-white/15'
                            }`}
                          >
                            {getCategoryDisplayLabel(cat)}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        placeholder={`Søk i alle ${questions.length} spørsmål eller svar...`}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-xs text-white outline-none"
                      />

                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {filteredEntries.length === 0 ? (
                          <div className="text-xs text-slate-400 py-4 text-center">
                            Ingen spørsmål matchet søket. Prøv et annet ord eller velg «Alle».
                          </div>
                        ) : (
                          filteredEntries.map(({ q, idx }) => {
                            const isOpenType = q.questionType === 'open_text';
                            return (
                              <div
                                key={q.id}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3"
                              >
                                <div className="space-y-1 text-xs">
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                    <span className="text-amber-300/90">#{idx + 1} · {q.category}</span>
                                    <span className={isOpenType ? 'text-fuchsia-300' : 'text-cyan-300'}>
                                      {isOpenType ? '✍️ Skriv svar (AhaSlides)' : '☑️ Flervalg'}
                                    </span>
                                  </div>
                                  <div className="font-bold text-white">
                                    {q.question}
                                  </div>
                                  {hideSecretsOnHostDesktop ? (
                                    <div className="text-slate-400 italic text-[11px]">
                                      🙈 Fasit skjult (Prosjektormaske PÅ)
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-emerald-300 font-bold">
                                        {isOpenType
                                          ? q.hostAnswerNote
                                          : `Fasit: ${OPTION_LETTERS[q.correctIndex]}) ${q.options[q.correctIndex]}`}
                                      </div>
                                      <div className="text-slate-400 text-[11px]">{q.wordplayJoke}</div>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowQuestionList(false);
                                    handleStartQuestion(idx);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                                >
                                  Kjør nå
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Active Question & Host Answer Key Card */}
                {hostActivityMode === 'quiz' && (() => {
                  const displayIdx = phase === 'lobby' ? selectedQuestionIdx : (snapshot?.questionIndex ?? selectedQuestionIdx);
                  const fallbackHostQ: QuizQuestion = questions[displayIdx] || hostQuestion;
                  const activeHostQ: QuizQuestion =
                    activePreparedQ && activePreparedQ.id === fallbackHostQ.id
                      ? activePreparedQ
                      : fallbackHostQ;
                  const isOpenTextQ = activeHostQ.questionType === 'open_text';
                  const liveEntries = snapshot?.liveOpenAnswers || [];
                  const showLiveWall = snapshot?.showLiveAnswersOnScreen ?? true;

                  return (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/15 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className="text-amber-300">
                            Spørsmål {displayIdx + 1} av {questions.length} · {getCategoryDisplayLabel(activeHostQ.category)}
                          </span>
                          <span className={isOpenTextQ ? 'text-fuchsia-300' : 'text-cyan-300'}>
                            {isOpenTextQ ? '· ✍️ Skriv svar (AhaSlides)' : '· ☑️ Flervalg A–D'}
                          </span>
                        </div>
                        <div className="font-mono tabular-nums font-black text-base text-white">
                          {phase === 'question' ? (
                            <span className={remainingSec <= 10 ? 'text-rose-400' : 'text-emerald-300'}>
                              ⏱️ {remainingSec}s / 60s
                            </span>
                          ) : phase === 'reveal' ? (
                            <span className="text-emerald-300">✓ Fasit vist</span>
                          ) : phase === 'finished' ? (
                            <span className="text-amber-300">🏆 Finale</span>
                          ) : (
                            <span className="text-slate-400">Klar til start (60s runde)</span>
                          )}
                        </div>
                      </div>

                      {phase === 'question' && (
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${timeProgressPct}%` }}
                          />
                        </div>
                      )}

                      <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-snug">
                        {activeHostQ.question}
                      </h3>

                      {isOpenTextQ ? (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-xl bg-fuchsia-950/30 border border-fuchsia-400/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-fuchsia-200 font-semibold">
                              ✍️ Deltakerne skriver inn egne svar på mobilen og de vises på storskjermen!
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                quizService.toggleLiveAnswersOnScreen(!showLiveWall);
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                                showLiveWall
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-white/10 text-slate-200 border border-white/20'
                              }`}
                            >
                              {showLiveWall ? '👁️ Vises live på Storskjerm: PÅ' : '🙈 Skjult til fasit: AV'}
                            </button>
                          </div>

                          {/* Host Live Typed Answer Moderation & Approval List */}
                          {liveEntries.length > 0 && (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              <div className="text-xs font-bold text-slate-300">
                                Innsendte svar ({liveEntries.length}):
                              </div>
                              {liveEntries.map((entry) => {
                                const tStyle = TEAM_STYLE[entry.teamColor] || TEAM_STYLE.red;
                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-2.5 rounded-xl border ${tStyle.bg} ${tStyle.border} flex items-center justify-between gap-2 text-xs`}
                                  >
                                    <div className="min-w-0">
                                      <span className="font-bold text-white">
                                        {tStyle.icon} {entry.teamName} ({entry.submittedBy}):
                                      </span>{' '}
                                      <span className="text-amber-200 font-black">«{entry.text}»</span>
                                      {phase === 'reveal' && entry.isCorrect && (
                                        <span className="ml-2 text-emerald-300 font-black">✓ RIKTIG</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {phase === 'reveal' && !entry.isCorrect && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            sounds.playLineComplete();
                                            quizService.awardTeamAnswer(entry.teamId);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
                                          title="Godkjenn svar manuelt og gi +100 poeng"
                                        >
                                          ✓ Godkjenn (+100 p)
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          sounds.playClick();
                                          quizService.removeOpenEntry(entry.id);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-black/40 text-rose-300 hover:text-rose-100 font-bold text-[11px] cursor-pointer"
                                        title="Fjern svar fra skjermen"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 4 Options with Host's Fasit Highlighted (hidden when Prosjektormaske is ON) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeHostQ.options.map((opt, oIdx) => {
                            const isAnswer = !hideSecretsOnHostDesktop && oIdx === activeHostQ.correctIndex;
                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 ${
                                  isAnswer
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                                    : 'bg-black/40 border-white/10 text-slate-300'
                                }`}
                              >
                                <span>
                                  <strong className="font-mono mr-1.5">{OPTION_LETTERS[oIdx]}.</strong>
                                  {opt}
                                </span>
                                {isAnswer && (
                                  <span className="text-[11px] font-black text-emerald-300 shrink-0">
                                    ✓ FASIT
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Host Private Answer & Joke Guide */}
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-400/30 space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-amber-300">
                            🎙️ Arrangørens Fasit & Ordlek-manus (skjult for publikum til du aktivt deler den):
                          </div>
                          {hideSecretsOnHostDesktop && (
                            <button
                              type="button"
                              onClick={() => setHideSecretsOnHostDesktop(false)}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                            >
                              👁️ Vis fasit her
                            </button>
                          )}
                        </div>
                        {hideSecretsOnHostDesktop ? (
                          <p className="text-slate-400 italic">
                            🙈 Skjult på din skjerm (Prosjektormaske PÅ) — publikum kan ikke smuglese fasiten.
                          </p>
                        ) : (
                          <>
                            <p className="text-amber-100 font-semibold">{activeHostQ.hostAnswerNote}</p>
                            <p className="text-slate-300 italic">{activeHostQ.wordplayJoke}</p>
                          </>
                        )}
                      </div>

                      {/* Host Controls */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        {phase === 'lobby' && (
                          <button
                            type="button"
                            onClick={() =>
                              randomOrderEnabled
                                ? handleRandomQuestion('all')
                                : handleStartQuestion(selectedQuestionIdx)
                            }
                            className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm cursor-pointer transition-colors"
                          >
                            {randomOrderEnabled
                              ? '🎲 Trekk neste spørsmål (Tilfeldig · 60 sek)'
                              : `▶ Start Spørsmål ${selectedQuestionIdx + 1} (60 sek)`}
                          </button>
                        )}

                        {phase === 'question' && (
                          <button
                            type="button"
                            onClick={handleReveal}
                            className={`px-5 py-3 rounded-xl font-black text-sm cursor-pointer transition-colors ${
                              remainingSec === 0
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {remainingSec === 0
                              ? '⏰ Tiden er ute! Vis fasit & Poeng'
                              : '✨ Vis fasit til publikum & Poeng'}
                          </button>
                        )}

                        {phase === 'reveal' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                quizService.hideAnswer();
                              }}
                              className="px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-black text-xs sm:text-sm cursor-pointer transition-colors"
                              title="Skjul fasiten igjen for publikum og Storskjerm"
                            >
                              🙈 Skjul fasit fra publikum
                            </button>
                            <button
                              type="button"
                              onClick={handleNextQuestion}
                              className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm cursor-pointer transition-colors"
                            >
                              {randomOrderEnabled
                                ? `🎲 Neste tilfeldige spørsmål (${drawnQuestionIds.length}/${questions.length} trukket)`
                                : (snapshot?.questionIndex ?? 0) + 1 < questions.length
                                ? `➔ Neste spørsmål (${(snapshot?.questionIndex ?? 0) + 2} av ${questions.length})`
                                : '🏆 Avslutt & Vis Vinnerpodium'}
                            </button>
                          </>
                        )}

                        {(phase === 'lobby' || phase === 'reveal') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRandomQuestion('multiple_choice')}
                              className="px-3.5 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-200 cursor-pointer transition-colors"
                            >
                              ☑️ Tilfeldig A–D
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRandomQuestion('open_text')}
                              className="px-3.5 py-3 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-xs font-bold text-fuchsia-200 cursor-pointer transition-colors"
                            >
                              ✍️ Tilfeldig Skriv-svar
                            </button>
                          </>
                        )}

                        {(phase === 'finished' || phase === 'reveal' || phase === 'question') && (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedQuestionIdx(0);
                              setActivePreparedQ(null);
                              quizService.resetGame(activeEdition);
                            }}
                            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-slate-200 cursor-pointer transition-colors"
                            title="Nullstiller poeng og runde uten å gjenta allerede brukte spørsmål"
                          >
                            ↺ Nullstill poeng & ny runde
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right 5 cols: Stillingsliste (Live), Teams, Live Answers & Moderation */}
              <div className="lg:col-span-5 space-y-4">
                {/* Live Stillingsliste (Rankings + Online Deltakere) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/50 to-emerald-950/30 border border-amber-400/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-heading font-black text-sm text-amber-200 flex items-center gap-1.5">
                      <span>🏆</span>
                      <span>Stillingsliste (Live)</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-black">
                      👥 {(snapshot?.participants || []).length} deltakere med kode
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {sortedLeaderboard.map((team, rankIdx) => {
                      const style = TEAM_STYLE[team.color];
                      const score = snapshot?.teamScores?.[team.id] || 0;
                      const memberCount = (snapshot?.participants || []).filter((p) => p.teamId === team.id).length;
                      return (
                        <div
                          key={team.id}
                          className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-black text-amber-300 w-5">
                              {rankIdx === 0 && score > 0 ? '🥇' : rankIdx === 1 && score > 0 ? '🥈' : rankIdx === 2 && score > 0 ? '🥉' : `${rankIdx + 1}.`}
                            </span>
                            <span>{style.icon}</span>
                            <span className="font-bold text-white truncate">{team.name}</span>
                            {memberCount > 0 && (
                              <span className="text-[10px] text-slate-400">({memberCount})</span>
                            )}
                          </div>
                          <span className="font-mono font-black text-amber-200 shrink-0 tabular-nums">
                            {score} p
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team Status & Rename */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-white">
                      Lagoppsett & Poengstyring
                    </h4>
                    <span className="text-xs text-slate-400">Én skjerm per lag eller online</span>
                  </div>

                  <div className="space-y-2">
                    {teams.map((team) => {
                      const style = TEAM_STYLE[team.color];
                      const hasAnswered = snapshot?.answeredTeamIds?.includes(team.id);
                      const revealedPick = snapshot?.revealedAnswers?.[team.id];
                      const score = snapshot?.teamScores?.[team.id] || 0;
                      const members = (snapshot?.participants || []).filter((p) => p.teamId === team.id);

                      return (
                        <div
                          key={team.id}
                          className={`p-3 rounded-xl border ${style.bg} ${style.border} space-y-1.5`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span>{style.icon}</span>
                              <input
                                type="text"
                                value={team.name}
                                onChange={(e) => handleTeamRename(team.id, e.target.value)}
                                className="bg-black/40 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-bold text-white w-full max-w-[160px] outline-none focus:border-amber-400"
                                title="Endre lagnavn"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {phase === 'question' && (
                                <span className={`text-[11px] font-bold ${hasAnswered ? 'text-emerald-300' : 'text-slate-400'}`}>
                                  {hasAnswered ? '✓ Svart' : 'Tenker...'}
                                </span>
                              )}
                              {phase === 'reveal' && revealedPick && (
                                <span className="text-[11px] font-mono font-bold text-amber-200">
                                  Valgte {OPTION_LETTERS[revealedPick.optionIndex]}
                                </span>
                              )}
                              <span className="font-mono tabular-nums font-black text-sm text-white min-w-[44px] text-right">
                                {score} p
                              </span>
                            </div>
                          </div>

                          {/* Host direct score controls (Arrangøren styrer poengstillingen) */}
                          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10">
                            <span className="text-[10px] font-bold text-slate-300">Poengstilling:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  quizService.adjustTeamScore(team.id, -50);
                                }}
                                className="px-2 py-0.5 rounded bg-black/40 hover:bg-rose-500/30 border border-white/15 text-[11px] font-mono font-bold text-rose-200 cursor-pointer"
                                title={`Trekk 50 poeng fra ${team.name}`}
                              >
                                -50
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop(1.05);
                                  quizService.adjustTeamScore(team.id, 50);
                                }}
                                className="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-200 cursor-pointer"
                                title={`Gi +50 poeng til ${team.name}`}
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playLineComplete();
                                  quizService.adjustTeamScore(team.id, 100);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-400/25 hover:bg-emerald-400/40 border border-emerald-400/50 text-[11px] font-mono font-bold text-emerald-200 cursor-pointer"
                                title={`Gi +100 poeng til ${team.name}`}
                              >
                                +100
                              </button>
                            </div>
                          </div>

                          {members.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {members.map((m) => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1.5 text-[11px] bg-black/40 px-2 py-0.5 rounded-md text-slate-200"
                                >
                                  <span>{m.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sounds.playClick();
                                      quizService.kickParticipant(m.id, m.name);
                                    }}
                                    className="text-rose-400 hover:text-rose-200 font-bold cursor-pointer"
                                    title={`Utesteng ${m.name} for forstyrrende adferd`}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Tips for Physical vs Online */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-amber-300">💡 Slik kjører dere quizen sammen:</div>
                  <p>
                    <strong>Fysisk sal / fest:</strong> Åpne <strong>📺 TV / Prosjektor-lenken</strong> på TV-en (fasit og kode er skjult der til du deler dem aktivt), og gi hvert bord én mobil med koden <strong className="font-mono text-amber-300">{hideSecretsOnHostDesktop ? '••••' : roomCode}</strong>.
                  </p>
                  <p>
                    <strong>Online / Hybrid:</strong> Deltakerne logger inn gratis med koden fra mobilen sin, velger lagfarge og stemmer innen 60 sekunder!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW 2: STORSKJERM / TV PROJECTION VIEW               */}
          {/* ===================================================== */}
          {activeTab === 'big_screen' && (isHost || isRemoteParticipant) && (
            <div className="space-y-5">
              {/* Big Screen Stage Banner */}
              <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#231932] via-[#140e1d] to-[#0a070f] border border-amber-400/40 space-y-5 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      {activeEdition === 'adult'
                        ? '🎭 QUIZ — Kultur-, Musikk- & Fanquiz'
                        : activeEdition === 'family'
                          ? '🎈 Familie- & Barnequiz — Kultur, Musikk & Ordlek'
                          : `🎄 JuleQuiz — Katolsk Familiequiz & ${CHRISTMAS_MIME_CARDS.length} Mimelek`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Vert: {snapshot?.hostName || 'Arrangør'} ·{' '}
                      {snapshot?.mimeState?.active
                        ? `🎭 Mimelek Runde ${snapshot.mimeState.roundNumber}`
                        : `Spørsmål ${Math.min((snapshot?.questionIndex ?? 0) + 1, questions.length)} av ${questions.length}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      {showCodeOnBigScreen ? (
                        <>
                          <div className="text-[11px] text-slate-400">📡 Deltakerkode (åpen for alle):</div>
                          <div className="font-mono font-black text-2xl text-amber-300 tracking-widest">
                            {roomCode}
                          </div>
                        </>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-bold text-slate-300">
                          🔒 Deltakerkode midlertidig skjult av arrangør
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={toggleBigScreenFullscreen}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      {isBigScreenFullscreen ? '⛶ Lukk Fullskjerm' : '⛶ Fullskjerm TV'}
                    </button>
                    {(phase === 'question' || (snapshot?.mimeState?.active && snapshot.mimeState.status === 'acting')) && (
                      <div
                        className={`px-4 py-2 rounded-2xl border font-mono tabular-nums font-black text-2xl ${
                          remainingSec <= 10
                            ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                            : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        }`}
                      >
                        {remainingSec}s
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Screen MIMELEK Stage (never leaks secret word before reveal!) */}
                {snapshot?.mimeState?.active ? (
                  <div className="py-6 text-center space-y-5">
                    {snapshot.mimeState.status === 'choosing' && (
                      <>
                        <div className="text-5xl">🤫</div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-rose-500/25 border border-rose-400 text-rose-200 text-xs font-black uppercase tracking-wider">
                          Katolsk Jule-Mimelek · Runde {snapshot.mimeState.roundNumber}
                        </div>
                        <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                          Tur: {TEAM_STYLE[snapshot.mimeState.activeTeamColor]?.icon} {snapshot.mimeState.activeTeamName}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto">
                          Én spiller fra <strong>{snapshot.mimeState.activeTeamName}</strong> går bort til arrangøren og velger et hemmelig ord til mimeleken!
                        </p>
                      </>
                    )}

                    {snapshot.mimeState.status === 'acting' && (
                      <>
                        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, (remainingSec / 60) * 100))}%` }}
                          />
                        </div>
                        <div className="text-5xl">🎭</div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-200 text-xs font-black uppercase">
                          Katolsk Jule-Mimelek · Kategori: {snapshot.mimeState.category || 'Tro & Jul'}
                        </div>
                        <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                          {TEAM_STYLE[snapshot.mimeState.activeTeamColor]?.icon} {snapshot.mimeState.activeTeamName} mimer nå!
                        </h3>
                        <p className="text-base text-emerald-300 font-bold">
                          Laget har 60 sekunder på å rope ut riktig svar!
                        </p>
                      </>
                    )}

                    {snapshot.mimeState.status === 'revealed' && (
                      <>
                        <div className="text-5xl">{snapshot.mimeState.guessedCorrect ? '🎉' : '⏰'}</div>
                        <div className="text-xs font-black uppercase text-amber-300">
                          {snapshot.mimeState.guessedCorrect
                            ? `Riktig gjettet av ${snapshot.mimeState.activeTeamName}!`
                            : `Tiden løp ut for ${snapshot.mimeState.activeTeamName}`}
                        </div>
                        <div className="p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 max-w-xl mx-auto">
                          <div className="text-xs font-bold text-emerald-300">Hemmelig mimeord var:</div>
                          <div className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
                            «{snapshot.mimeState.word}»
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                <>
                {/* Big Screen Main Stage Content */}
                {phase === 'lobby' && (
                  <div className="py-10 text-center space-y-4">
                    <div className="text-5xl">
                      {activeEdition === 'adult' ? '🎤' : activeEdition === 'family' ? '🎉' : '🎄'}
                    </div>
                    <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                      {activeEdition === 'christmas' ? 'Velkommen til JuleQuiz!' : 'Velkommen til lagquiz!'}
                      {showCodeOnBigScreen && roomCode && (
                        <>
                          {' '}Koble til med kode <span className="font-mono text-amber-300">{roomCode}</span>
                        </>
                      )}
                    </h3>
                    <p className="text-sm text-slate-300 max-w-xl mx-auto">
                      Samle laget rundt én skjerm (f.eks. Rødt lag eller Blått lag) eller bli med hver for dere på mobil. Dere får <strong>60 sekunder</strong> på hvert spørsmål!
                    </p>
                    <div className="text-xs text-emerald-300 font-bold">
                      Tilkoblede deltakere: {(snapshot?.participants || []).length}
                    </div>
                  </div>
                )}

                {(phase === 'question' || phase === 'reveal') && publicQuestion && (
                  <div className="space-y-5">
                    {phase === 'question' && (
                      <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${timeProgressPct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-amber-300">{publicQuestion.category}</span>
                      {publicQuestion.questionType === 'open_text' && (
                        <span className="text-fuchsia-300">
                          ✍️ Skriv-svar (AhaSlides Live på Storskjerm)
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-black text-xl sm:text-2xl text-white leading-snug">
                      {publicQuestion.question}
                    </h3>

                    {publicQuestion.questionType === 'open_text' ? (
                      <div className="space-y-4">
                        {(snapshot?.showLiveAnswersOnScreen || phase === 'reveal') ? (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-slate-300">
                              {(snapshot?.liveOpenAnswers || []).length > 0
                                ? `Innsendte svar fra lagene (${(snapshot?.liveOpenAnswers || []).length}):`
                                : 'Venter på at lagene skriver inn sine svar på mobilen...'}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {(snapshot?.liveOpenAnswers || []).map((entry) => {
                                const style = TEAM_STYLE[entry.teamColor] || TEAM_STYLE.red;
                                const isRevealed = phase === 'reveal';
                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-4 rounded-2xl border-2 transition-all space-y-1.5 ${
                                      isRevealed && entry.isCorrect
                                        ? 'bg-emerald-500/25 border-emerald-400 scale-[1.02]'
                                        : `${style.bg} ${style.border}`
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                                      <span className="truncate">
                                        {style.icon} {entry.teamName} · {entry.submittedBy}
                                      </span>
                                      {isRevealed && entry.isCorrect && (
                                        <span className="text-emerald-300 font-black shrink-0">✓ RIKTIG!</span>
                                      )}
                                    </div>
                                    <div className="font-heading font-black text-lg sm:text-xl text-white break-words">
                                      «{entry.text}»
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-black/50 border border-fuchsia-400/30 text-center space-y-2">
                            <div className="text-3xl">🔒</div>
                            <div className="font-bold text-base text-white">
                              Hemmelig runde — svarene vises når fasiten åpnes!
                            </div>
                            <div className="text-xs text-amber-300 font-mono font-bold">
                              {snapshot?.liveOpenAnswerCount || 0} svar mottatt så langt
                            </div>
                          </div>
                        )}

                        {phase === 'reveal' && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-white">
                            <div className="text-xs font-bold text-emerald-300">✓ RIKTIG SVAR (FASIT):</div>
                            <div className="font-heading font-black text-xl sm:text-2xl mt-0.5">
                              {publicQuestion.options[0] || publicQuestion.acceptedAnswers?.[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {publicQuestion.options.map((opt, idx) => {
                          const isRevealed = phase === 'reveal';
                          const isCorrect = isRevealed && publicQuestion.correctIndex === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-4 sm:p-5 rounded-2xl border-2 text-base sm:text-lg font-bold flex items-center justify-between gap-3 transition-all ${
                                isCorrect
                                  ? 'bg-emerald-500/25 border-emerald-400 text-white scale-[1.01]'
                                  : isRevealed
                                  ? 'bg-black/40 border-white/10 text-slate-400 opacity-70'
                                  : 'bg-white/5 border-white/20 text-white'
                              }`}
                            >
                              <span>
                                <span className="font-mono text-amber-300 mr-2.5">{OPTION_LETTERS[idx]}.</span>
                                {opt}
                              </span>
                              {isCorrect && <span className="text-emerald-300 font-black">✓ RIKTIG!</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {phase === 'reveal' && publicQuestion.wordplayJoke && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-amber-100 text-sm sm:text-base font-medium leading-relaxed">
                        😄 <strong>Kveldens ordlek:</strong> {publicQuestion.wordplayJoke}
                      </div>
                    )}
                  </div>
                )}

                {phase === 'finished' && (
                  <div className="py-8 text-center space-y-5">
                    <div className="text-5xl">🏆</div>
                    <h3 className="font-heading font-black text-2xl sm:text-3xl text-amber-300">
                      Quizkvelden er ferdig — Her er Vinnerlaget!
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {sortedLeaderboard.map((team, rank) => {
                        const style = TEAM_STYLE[team.color];
                        return (
                          <div
                            key={team.id}
                            className={`p-4 rounded-2xl border ${style.bg} ${style.border} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-black text-lg text-amber-300">#{rank + 1}</span>
                              <span>{style.icon}</span>
                              <span className="font-bold text-white">{team.name}</span>
                            </div>
                            <span className="font-mono tabular-nums font-black text-xl text-white">
                              {snapshot?.teamScores?.[team.id] || 0} p
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </>
                )}

                {/* Team Live Score & Answered Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                  {teams.map((team) => {
                    const style = TEAM_STYLE[team.color];
                    const answered = snapshot?.answeredTeamIds?.includes(team.id);
                    const score = snapshot?.teamScores?.[team.id] || 0;
                    return (
                      <div
                        key={team.id}
                        className={`p-3 rounded-xl border ${style.bg} ${style.border} flex flex-col justify-between gap-1`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="truncate">{style.icon} {team.name}</span>
                          {phase === 'question' && (
                            <span className={answered ? 'text-emerald-300' : 'text-slate-400'}>
                              {answered ? '✓' : '…'}
                            </span>
                          )}
                        </div>
                        <div className="font-mono tabular-nums font-black text-lg text-white">
                          {score} poeng
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW 3: LAGSKJERM / MOBIL (Én skjerm per lag / Online) */}
          {/* ===================================================== */}
          {activeTab === 'team_play' && (
            <div className="max-w-xl mx-auto space-y-4">
              {/* Team Selector (allows picking which team this screen represents) */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">
                    {isRemoteParticipant
                      ? `Pålogget som ${quizService.getMyPlayerName()}`
                      : 'Velg hvilket lag denne skjermen styrer:'}
                  </span>
                  <span className="font-mono font-bold text-amber-300">Kode: {roomCode}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {teams.map((t) => {
                    const style = TEAM_STYLE[t.color];
                    const isSelected = myTeam.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          quizService.setMyTeamId(t.id);
                          if (isRemoteParticipant) {
                            quizService.joinQuizWithCode(
                              roomCode,
                              quizService.getMyPlayerName() || 'Spiller',
                              t.id,
                              t.name,
                              t.color
                            );
                          }
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? `${style.badge} border-white shadow-lg`
                            : `${style.bg} ${style.border} ${style.text} opacity-75 hover:opacity-100`
                        }`}
                      >
                        <span>{style.icon}</span>
                        <span className="truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {quizError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs font-bold">
                  ⚠️ {quizError}
                </div>
              )}

              {/* Active Team Question / Wait Card */}
              <div className={`p-5 rounded-3xl border-2 ${TEAM_STYLE[myTeam.color].bg} ${TEAM_STYLE[myTeam.color].border} space-y-4 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{TEAM_STYLE[myTeam.color].icon}</span>
                    <span>{myTeam.name}</span>
                    <span className="text-slate-300 font-mono tabular-nums">
                      · {snapshot?.teamScores?.[myTeam.id] || 0} p
                    </span>
                  </div>
                  {(phase === 'question' || (snapshot?.mimeState?.active && snapshot.mimeState.status === 'acting')) && (
                    <div
                      className={`font-mono tabular-nums font-black text-xl ${
                        remainingSec <= 10 ? 'text-rose-300' : 'text-emerald-300'
                      }`}
                    >
                      ⏱️ {remainingSec}s
                    </div>
                  )}
                </div>

                {snapshot?.mimeState?.active ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="text-4xl">
                      {snapshot.mimeState.status === 'choosing'
                        ? '🤫'
                        : snapshot.mimeState.status === 'acting'
                          ? '🎭'
                          : snapshot.mimeState.guessedCorrect
                            ? '🎉'
                            : '⏰'}
                    </div>
                    <h4 className="font-heading font-black text-lg text-white">
                      {snapshot.mimeState.status === 'choosing'
                        ? `Mimelek · ${snapshot.mimeState.activeTeamName} velger ord hos arrangøren`
                        : snapshot.mimeState.status === 'acting'
                          ? `${snapshot.mimeState.activeTeamName} mimer nå! (${remainingSec}s)`
                          : `Mimeordet var: «${snapshot.mimeState.word}»`}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {snapshot.mimeState.status === 'acting'
                        ? snapshot.mimeState.activeTeamId === myTeam.id
                          ? 'Gjett ordet høyt sammen med laget ditt før klokka når 0!'
                          : `Følg med når ${snapshot.mimeState.activeTeamName} mimer! Neste runde er snart deres tur.`
                        : snapshot.mimeState.status === 'choosing'
                          ? 'Én fra laget går bort til arrangøren og velger sitt katolske jule-mimeord.'
                          : 'Arrangøren oppdaterer poengstillingen og sender turen videre.'}
                    </p>
                  </div>
                ) : (
                <>
                {phase === 'lobby' && (
                  <div className="py-8 text-center space-y-2">
                    <div className="text-4xl">⏳</div>
                    <h4 className="font-heading font-bold text-lg text-white">
                      Gjør laget klart!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Arrangøren starter første spørsmål snart. Diskuter svaret sammen på laget — dere har 60 sekunder per spørsmål.
                    </p>
                  </div>
                )}

                {(phase === 'question' || phase === 'reveal') && publicQuestion && (
                  <div className="space-y-4">
                    {phase === 'question' && (
                      <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            remainingSec <= 10 ? 'bg-rose-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${timeProgressPct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
                      <span className="text-amber-300">
                        Spørsmål {(snapshot?.questionIndex ?? 0) + 1} av {questions.length} · {publicQuestion.category}
                      </span>
                      {publicQuestion.questionType === 'open_text' && (
                        <span className="text-fuchsia-300">✍️ Skriv svar (AhaSlides)</span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-base sm:text-lg text-white leading-snug">
                      {publicQuestion.question}
                    </h4>

                    {publicQuestion.questionType === 'open_text' ? (
                      <div className="space-y-3">
                        {phase === 'question' ? (
                          <form onSubmit={handleTeamOpenTextSubmit} className="space-y-2.5">
                            <input
                              type="text"
                              value={openTextInput}
                              onChange={(e) => {
                                setOpenTextInput(e.target.value);
                                if (openTextError) setOpenTextError(null);
                              }}
                              disabled={remainingSec <= 0}
                              maxLength={120}
                              placeholder={publicQuestion.samplePlaceholder || 'Skriv lagets svar her...'}
                              className="w-full px-4 py-3.5 rounded-xl bg-black/60 border-2 border-white/25 focus:border-amber-400 text-sm sm:text-base font-bold text-white outline-none disabled:opacity-60"
                            />
                            {openTextError && (
                              <div className="text-xs text-rose-300 font-bold">⚠️ {openTextError}</div>
                            )}
                            <button
                              type="submit"
                              disabled={remainingSec <= 0 || !openTextInput.trim()}
                              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {submittedOpenText ? '✏️ Oppdater svar på Storskjerm' : '📤 Send svar til Storskjerm ➔'}
                            </button>
                          </form>
                        ) : (
                          <div className="space-y-2.5">
                            <div
                              className={`p-4 rounded-xl border-2 ${
                                snapshot?.revealedAnswers?.[myTeam.id]?.isCorrect
                                  ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                  : 'bg-black/45 border-white/20 text-slate-200'
                              }`}
                            >
                              <div className="text-xs text-slate-300">Deres innsendte svar:</div>
                              <div className="font-heading font-black text-base mt-0.5">
                                {snapshot?.revealedAnswers?.[myTeam.id]?.textAnswer ||
                                  submittedOpenText ||
                                  '(Ingen innsendt)'}
                              </div>
                              {snapshot?.revealedAnswers?.[myTeam.id]?.isCorrect && (
                                <div className="text-xs font-black text-emerald-300 mt-1">
                                  ✓ RIKTIG SVAR!
                                </div>
                              )}
                            </div>
                            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-white">
                              <div className="text-[11px] font-bold text-emerald-300">✓ FASIT:</div>
                              <div className="font-bold text-sm mt-0.5">
                                {publicQuestion.options[0] || publicQuestion.acceptedAnswers?.[0]}
                              </div>
                            </div>
                          </div>
                        )}

                        {phase === 'question' && remainingSec > 0 && submittedOpenText && (
                          <div className="text-xs text-emerald-300 font-bold text-center">
                            ✓ Sendt inn for {myTeam.name}: «{submittedOpenText}» (kan endres før klokka når 0).
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {publicQuestion.options.map((opt, idx) => {
                          const chosenIdx =
                            phase === 'reveal'
                              ? snapshot?.revealedAnswers?.[myTeam.id]?.optionIndex ?? localPickedOption
                              : localPickedOption ?? hostLocalChoice;
                          const isPicked = chosenIdx === idx;
                          const isRevealed = phase === 'reveal';
                          const isCorrect = isRevealed && publicQuestion.correctIndex === idx;
                          const isWrongPick = isRevealed && isPicked && !isCorrect;

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={phase !== 'question' || remainingSec <= 0}
                              onClick={() => handleTeamAnswer(idx)}
                              className={`w-full min-h-[48px] p-3.5 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between gap-2 transition-all cursor-pointer disabled:cursor-default ${
                                isCorrect
                                  ? 'bg-emerald-500/30 border-emerald-400 text-white'
                                  : isWrongPick
                                  ? 'bg-rose-500/30 border-rose-400 text-rose-100'
                                  : isPicked
                                  ? 'bg-amber-400 text-slate-950 border-white shadow-lg'
                                  : 'bg-black/45 hover:bg-black/65 border-white/20 text-white'
                              }`}
                            >
                              <span>
                                <strong className="font-mono mr-2">{OPTION_LETTERS[idx]}.</strong>
                                {opt}
                              </span>
                              {isCorrect && <span className="text-xs font-black text-emerald-300">✓ RIKTIG</span>}
                              {isWrongPick && <span className="text-xs font-black text-rose-300">✕ FEIL</span>}
                              {!isRevealed && isPicked && (
                                <span className="text-xs font-black">✓ VALGT</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {phase === 'question' && remainingSec <= 0 && (
                      <div className="p-3 rounded-xl bg-black/50 text-xs text-amber-200 font-bold text-center">
                        ⏰ Tiden (60 sekunder) er ute! Venter på at arrangøren viser fasit.
                      </div>
                    )}

                    {publicQuestion.questionType !== 'open_text' && phase === 'question' && remainingSec > 0 && localPickedOption !== null && (
                      <div className="text-xs text-emerald-300 font-bold text-center">
                        ✓ Svar registrert for {myTeam.name}! Dere kan fortsatt ombestemme dere før klokka når 0.
                      </div>
                    )}

                    {phase === 'reveal' && publicQuestion.wordplayJoke && (
                      <div className="p-3.5 rounded-xl bg-black/50 border border-amber-400/40 text-xs text-amber-100 leading-relaxed">
                        😄 <strong>Ordlek & fasit:</strong> {publicQuestion.wordplayJoke}
                      </div>
                    )}
                  </div>
                )}

                {phase === 'finished' && (
                  <div className="py-6 text-center space-y-3">
                    <div className="text-4xl">🏆</div>
                    <h4 className="font-heading font-black text-xl text-amber-300">
                      Takk for kampen, {myTeam.name}!
                    </h4>
                    <div className="space-y-2 text-left">
                      {sortedLeaderboard.map((t, r) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-black/40 flex items-center justify-between text-xs font-bold"
                        >
                          <span>#{r + 1} {TEAM_STYLE[t.color].icon} {t.name}</span>
                          <span className="font-mono tabular-nums text-amber-300">
                            {snapshot?.teamScores?.[t.id] || 0} p
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW 4: JOIN WITH CODE (DELTAKER / LAG)               */}
          {/* ===================================================== */}
          {activeTab === 'join' && (
            <div className="max-w-md mx-auto space-y-4">
              <form
                onSubmit={handleJoinSubmit}
                className="p-5 rounded-2xl bg-white/5 border border-white/15 space-y-4"
              >
                <div>
                  <h3 className="font-heading font-black text-base text-white">
                    Bli med i Quiz med kode eller lenke (Gratis · Kahoot-modus)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Åpen for barn, familie og alle aldre — ingen innlogging, e-post eller betaling kreves!
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">
                    Koblingskode fra arrangør:
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      if (joinError) setJoinError(null);
                    }}
                    placeholder="f.eks. 4821"
                    maxLength={8}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:border-amber-400 font-mono font-black text-lg text-center tracking-widest text-amber-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1">
                    Kallenavn (bruk ikke e-post eller fullt navn):
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => {
                      setJoinName(e.target.value);
                      if (joinError) setJoinError(null);
                    }}
                    placeholder="f.eks. Løve, Stjerne eller Kari"
                    maxLength={24}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 focus:border-amber-400 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1.5">
                    Velg lagfarge / lag:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_QUIZ_TEAMS.map((t) => {
                      const style = TEAM_STYLE[t.color];
                      const active = joinTeamId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setJoinTeamId(t.id);
                          }}
                          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                            active
                              ? `${style.badge} border-white shadow`
                              : `${style.bg} ${style.border} ${style.text}`
                          }`}
                        >
                          <span>{style.icon}</span>
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Valgfritt eget lagnavn:
                  </label>
                  <input
                    type="text"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="La stå tom for standard (f.eks. Rødt lag)"
                    maxLength={28}
                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-amber-400 text-xs text-white outline-none"
                  />
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs font-bold">
                    ⚠️ {joinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isJoining ? '⏳ Kobler til aktiv quiz...' : '🚀 Koble til Quiz nå ➔'}
                </button>
              </form>

              {!hasFullPaid && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span>Er du <strong>arrangør</strong> som vil styre quiz, få koblingskode & se fasit?</span>
                  <button
                    type="button"
                    onClick={handleHostRequirePaid}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shrink-0"
                  >
                    Betal & Aktiver spilletid
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
