/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { BallCageCanvas } from './BallCageCanvas';
import { RilMusicPlayer } from './RilMusicPlayer';
import { LanguageSelector } from './LanguageSelector';
import { JOYFUL_BALLS_MAP } from '../data/prompts';
import { MUSIC_BINGO_SONGS } from '../data/musicBingoSongs';
import { CalledBall } from '../types/bingo';
import { BingoTvState, remoteBingo } from '../services/remoteBingo';
import { firebasePersistence } from '../services/firebasePersistence';
import {
  DEFAULT_QUIZ_TEAMS,
  QuizRoomSnapshot,
  QuizTeamColor,
  quizService,
} from '../services/quizService';

interface TvProjectorScreenProps {
  initialGame?: 'bingo' | 'quiz' | 'auto';
  initialCode?: string;
  onExitTvMode?: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const TEAM_STYLE: Record<
  QuizTeamColor,
  { bg: string; border: string; text: string; icon: string }
> = {
  red: {
    bg: 'bg-rose-950/75',
    border: 'border-rose-500/60',
    text: 'text-rose-100',
    icon: '🔴',
  },
  blue: {
    bg: 'bg-sky-950/75',
    border: 'border-sky-500/60',
    text: 'text-sky-100',
    icon: '🔵',
  },
  emerald: {
    bg: 'bg-emerald-950/75',
    border: 'border-emerald-500/60',
    text: 'text-emerald-100',
    icon: '🟢',
  },
  amber: {
    bg: 'bg-amber-950/75',
    border: 'border-amber-500/60',
    text: 'text-amber-100',
    icon: '🟡',
  },
};

export const TvProjectorScreen: React.FC<TvProjectorScreenProps> = ({
  initialGame = 'auto',
  initialCode = '',
  onExitTvMode,
}) => {
  const [connectedCode, setConnectedCode] = useState<string>(() =>
    initialCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  );
  const [codeInput, setCodeInput] = useState<string>(() =>
    initialCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  );
  const [activeGame, setActiveGame] = useState<'bingo' | 'quiz'>(
    initialGame === 'quiz' ? 'quiz' : 'bingo'
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  const [bingoTvState, setBingoTvState] = useState<BingoTvState | null>(() =>
    remoteBingo.getTvState()
  );
  const [quizSnapshot, setQuizSnapshot] = useState<QuizRoomSnapshot | null>(() =>
    quizService.getSnapshot()
  );
  const [remainingSec, setRemainingSec] = useState<number>(60);
  const tvSpeechSeededRef = useRef<boolean>(false);
  const prevTvBallCountRef = useRef<number>(0);

  const connectToRoomAsTv = async (
    rawCode: string,
    preferredGame: 'bingo' | 'quiz' | 'auto' = 'auto'
  ) => {
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 3) {
      setConnectError('Skriv inn en gyldig romkode (minst 3 tegn) fra arrangøren.');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      let check: {
        valid?: boolean;
        hasBingo?: boolean;
        hasQuiz?: boolean;
        activeGame?: 'bingo' | 'quiz';
      } | null = null;

      try {
        const resp = await fetch(`/api/rooms/validate?type=any&code=${encodeURIComponent(cleanCode)}`, {
          cache: 'no-store',
        });
        if (resp.ok) {
          check = await resp.json();
        }
      } catch {
        // Fallback to Firestore
      }

      if (!check?.valid) {
        const cloudRoom = await firebasePersistence.getActiveRoomFromFirestore(cleanCode);
        if (cloudRoom) {
          check = {
            valid: true,
            hasBingo: cloudRoom.hasBingo !== false,
            hasQuiz: cloudRoom.hasQuiz !== false,
            activeGame: cloudRoom.activeGame || 'bingo',
          };
        }
      }

      if (!check?.valid) {
        setIsConnecting(false);
        setConnectError(
          'Fant ingen aktiv sending for denne koden ennå. Arrangøren må først åpne spillet på sin enhet.'
        );
        return;
      }

      let chosen: 'bingo' | 'quiz' = 'bingo';
      if (preferredGame === 'quiz' && check.hasQuiz) {
        chosen = 'quiz';
      } else if (preferredGame === 'bingo' && check.hasBingo) {
        chosen = 'bingo';
      } else if (check.activeGame === 'quiz' || check.activeGame === 'bingo') {
        chosen = check.activeGame;
      } else if (check.hasQuiz) {
        chosen = 'quiz';
      }

      setConnectedCode(cleanCode);
      setActiveGame(chosen);
      if (chosen === 'quiz') {
        quizService.watchAsTv(cleanCode);
      } else {
        remoteBingo.watchAsTv(cleanCode);
      }
    } catch {
      setConnectError('Kunne ikke kontakte serveren for TV-visning. Prøv igjen.');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const unsubBingoTv = remoteBingo.onTvState((state) => {
      setBingoTvState(state);
    });

    const unsubMode = remoteBingo.onTvModeChange((targetGame) => {
      setActiveGame(targetGame);
      if (connectedCode) {
        if (targetGame === 'quiz') {
          quizService.watchAsTv(connectedCode);
        } else {
          remoteBingo.watchAsTv(connectedCode);
        }
      }
    });

    const unsubQuiz = quizService.subscribe(() => {
      setQuizSnapshot(quizService.getSnapshot());
    });

    return () => {
      unsubBingoTv();
      unsubMode();
      unsubQuiz();
    };
  }, [connectedCode]);

  useEffect(() => {
    const cleanInit = initialCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanInit.length >= 3) {
      connectToRoomAsTv(cleanInit, initialGame);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialGame]);

  useEffect(() => {
    if (activeGame !== 'quiz') return;
    const updateTick = () => {
      setRemainingSec(quizService.getRemainingSeconds());
    };
    updateTick();
    const timer = setInterval(updateTick, 250);
    return () => clearInterval(timer);
  }, [
    activeGame,
    quizSnapshot?.phase,
    quizSnapshot?.startedAt,
    quizSnapshot?.mimeState?.status,
    quizSnapshot?.mimeState?.startedAt,
  ]);

  const uncalledBalls = useMemo<CalledBall[]>(() => {
    const called = bingoTvState?.calledBalls || [];
    const calledSet = new Set(called.map((b) => `${b.letter}-${b.number}`));
    return JOYFUL_BALLS_MAP.filter((b) => !calledSet.has(`${b.letter}-${b.number}`)).map((b) => ({
      ...b,
      timestamp: 0,
    }));
  }, [bingoTvState?.calledBalls]);

  // Announce newly drawn balls on TV / Projector strictly in the selected menu language
  useEffect(() => {
    const balls = bingoTvState?.calledBalls || [];
    if (!connectedCode || activeGame !== 'bingo') {
      tvSpeechSeededRef.current = false;
      prevTvBallCountRef.current = 0;
      return;
    }
    if (!tvSpeechSeededRef.current) {
      tvSpeechSeededRef.current = true;
      prevTvBallCountRef.current = balls.length;
      return;
    }
    if (balls.length === 0) {
      prevTvBallCountRef.current = 0;
      return;
    }
    if (balls.length > prevTvBallCountRef.current) {
      const latest = balls[balls.length - 1];
      if (latest) {
        sounds.playBallDrop();
        sounds.speakBall(latest.letter, latest.number, latest.affirmation);
      }
      prevTvBallCountRef.current = balls.length;
    }
  }, [connectedCode, activeGame, bingoTvState?.calledBalls]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleExit = () => {
    sounds.playClick();
    remoteBingo.exitTvWatch();
    quizService.exitTvWatch();
    onExitTvMode?.();
  };

  const handleSwitchGameOnTv = (target: 'bingo' | 'quiz') => {
    sounds.playClick();
    setActiveGame(target);
    if (connectedCode) {
      if (target === 'quiz') {
        quizService.watchAsTv(connectedCode);
      } else {
        remoteBingo.watchAsTv(connectedCode);
      }
    }
  };

  // Connect screen if no room code connected yet
  if (!connectedCode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#09050a] text-amber-50 overflow-y-auto">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1e1218] via-[#130b10] to-[#080507] border-2 border-amber-400/50 shadow-2xl space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg">
            📺
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-amber-200">
              Storskjerm / Prosjektor / TV
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Koble TV-en eller projektoren til arrangørens spill. Deltakerkoden er åpen for publikum på alle skjermer, mens fasiter og arrangørens private innloggingskode holdes helt skjult!
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sounds.playClick();
              connectToRoomAsTv(codeInput, initialGame);
            }}
            className="space-y-3 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                Arrangørens romkode for TV-oppkobling:
              </label>
              <input
                type="password"
                autoComplete="off"
                maxLength={8}
                placeholder="••••"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  if (connectError) setConnectError(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-black/70 border border-amber-400/50 focus:border-amber-300 text-amber-200 font-mono font-black text-2xl text-center tracking-widest outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Skjult inntasting hindrer at publikum ser koden på projektoren mens du skriver den.
              </span>
            </div>

            {connectError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs font-bold">
                ⚠️ {connectError}
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-lg disabled:opacity-60"
            >
              {isConnecting ? 'Kobler til TV-sending...' : '📺 Start Storskjerm / TV-visning'}
            </button>
          </form>

          {onExitTvMode && (
            <button
              type="button"
              onClick={handleExit}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-300 cursor-pointer"
            >
              ⇦ Tilbake til vanlig visning
            </button>
          )}
        </div>
      </div>
    );
  }

  // Common Header Data
  const calledBalls = bingoTvState?.calledBalls || [];
  const currentBall = calledBalls.length > 0 ? calledBalls[calledBalls.length - 1] : null;
  const recentBalls = [...calledBalls].reverse().slice(1, 6);
  const bingoPlayers = bingoTvState?.playersSummary || [];

  const quizEdition = quizSnapshot?.edition || 'adult';
  const quizPhase = quizSnapshot?.phase || 'lobby';
  const quizTeams = quizSnapshot?.teams || DEFAULT_QUIZ_TEAMS;
  const publicQuestion = quizSnapshot?.currentQuestion || null;
  const quizDurationSec = quizSnapshot?.durationSec || 60;
  const timeProgressPct = Math.max(0, Math.min(100, (remainingSec / quizDurationSec) * 100));
  const sortedQuizLeaderboard = [...quizTeams].sort(
    (a, b) => (quizSnapshot?.teamScores?.[b.id] || 0) - (quizSnapshot?.teamScores?.[a.id] || 0)
  );

  const visibleCodeOnScreen =
    activeGame === 'quiz'
      ? (quizSnapshot?.showCodeOnScreen !== false ? quizSnapshot?.roomCode || connectedCode : null)
      : (bingoTvState?.showCodeOnScreen !== false ? bingoTvState?.roomCode || connectedCode : null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09060b] text-amber-50 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-clip">
      {/* Top TV Header Bar */}
      <header className="max-w-[1800px] mx-auto w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-400/25">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
            {activeGame === 'quiz'
              ? quizEdition === 'christmas'
                ? '🎄'
                : quizEdition === 'family'
                ? '🎈'
                : quizEdition === 'senior'
                ? '👵'
                : '🎭'
              : '📺'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-black text-lg sm:text-2xl text-amber-200 tracking-tight">
                {activeGame === 'quiz'
                  ? quizEdition === 'adult'
                    ? 'QUIZ · STORSKJERM / TV'
                    : quizEdition === 'family'
                    ? 'FAMILIEQUIZ · STORSKJERM / TV'
                    : quizEdition === 'senior'
                    ? 'SENIOR GRENLAND QUIZ · STORSKJERM / TV'
                    : 'JULEQUIZ · STORSKJERM / TV'
                  : 'INJOY TOGETHER · STORSKJERM / TV'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                Kun publikumsskjerm{activeGame === 'bingo' ? ` · Runde ${bingoTvState?.roundNumber || 1}` : ''}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-300 mt-1">
              <span>
                Arrangør:{' '}
                <strong className="text-white">
                  {activeGame === 'quiz'
                    ? quizSnapshot?.hostName || 'Arrangør'
                    : bingoTvState?.hostName || 'Arrangør'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              {activeGame === 'bingo' && (
                <>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950 border border-emerald-400/60 text-emerald-200 font-black">
                    👥 {bingoPlayers.length} spillere sammen
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              {visibleCodeOnScreen ? (
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-100 font-mono font-black tracking-widest">
                  📡 Deltakerkode: {visibleCodeOnScreen}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/15 text-slate-300 font-semibold">
                  🔒 Deltakerkode midlertidig skjult av arrangør
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal TV Controls (Never exposes host secrets or draw controls) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/15">
            <button
              type="button"
              onClick={() => handleSwitchGameOnTv('bingo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeGame === 'bingo'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎱 Bingo TV
            </button>
            <button
              type="button"
              onClick={() => handleSwitchGameOnTv('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeGame === 'quiz'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎭 Quiz TV
            </button>
          </div>

          <LanguageSelector variant="compact" />

          <button
            type="button"
            onClick={() => {
              const m = sounds.toggleMute();
              setIsMuted(m);
            }}
            aria-label={isMuted ? 'Slå på lyd og stemme' : 'Demp lyd og stemme'}
            title={isMuted ? 'Slå på opplesing og lyd' : 'Demp opplesing og lyd'}
            className="px-2.5 py-2 rounded-xl bg-amber-950/70 border border-amber-500/40 hover:border-amber-300 text-amber-200 text-xs font-bold cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <RilMusicPlayer variant="compact" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-500/40 hover:border-amber-300 text-amber-200 text-xs font-bold cursor-pointer"
          >
            {isFullscreen ? '⛶ Lukk Fullskjerm' : '⛶ Fullskjerm TV'}
          </button>

          {onExitTvMode && (
            <button
              type="button"
              onClick={handleExit}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-bold cursor-pointer"
            >
              Avslutt TV-visning
            </button>
          )}
        </div>
      </header>

      {/* BINGO STORSKJERM / TV MODE */}
      {activeGame === 'bingo' && (
        <main className="flex-1 max-w-[1880px] mx-auto w-full py-4 space-y-5">
          {bingoTvState?.lastClaim && (() => {
            const isFull =
              bingoTvState.lastClaim.isFullHouse || /fullbrett|fullt?\s*brett/i.test(bingoTvState.lastClaim.pattern);
            const isLine3 = !isFull && /3\s*\.?\s*rekke/i.test(bingoTvState.lastClaim.pattern);
            const tierText = isFull ? 'FULLT BRETT' : isLine3 ? '3. REKKER' : '1. REKKE';
            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white text-center shadow-2xl border-2 border-white space-y-1">
                <div className="font-heading font-black text-xl sm:text-3xl">
                  🏆 {bingoTvState.lastClaim.playerName.toUpperCase()} HAR FYLT {tierText} OG TRYKKET BINGO! 🏆
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-100">
                  {isFull
                    ? '🔄 Ny bingorunde starter automatisk for hele salen om få sekunder...'
                    : isLine3
                    ? '➡️ Spillet fortsetter nå til FULLT BRETT! (1. og 3. rekker er låst)'
                    : '➡️ Spillet fortsetter nå til 3. REKKER! (1. rekke er låst)'}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left 5 cols: Large Responsive 3D Tumbler for TV & Projector */}
            <div className="md:col-span-5 md:sticky md:top-3 self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto no-scrollbar space-y-4">
              <div className="p-3 sm:p-4 rounded-3xl bg-black/65 border-2 border-amber-400/40 shadow-2xl">
                <BallCageCanvas
                  calledBalls={calledBalls}
                  uncalledBalls={uncalledBalls}
                  isAutoCalling={false}
                  onToggleAuto={() => {}}
                  canDraw={false}
                  readOnlyMessage="🔒 Arrangøren styrer kuletrekningen privat"
                  compactSidebar={false}
                  tumblerSize="tv"
                  layout="stacked"
                />
              </div>

              {/* Room-Wide Locked Milestone Status for TV Audience */}
              <div className="p-3.5 rounded-2xl bg-black/55 border border-amber-500/30 flex flex-wrap items-center justify-center gap-2">
                {(['line1', 'line3', 'fullbrett'] as const).map((tier) => {
                  const locked = (bingoTvState?.claimedMilestones || []).includes(tier);
                  const winner = bingoTvState?.milestoneWinners?.[tier];
                  const label = tier === 'line1' ? '1. rekke' : tier === 'line3' ? '3. rekker' : 'Full brett';
                  return (
                    <span
                      key={tier}
                      className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        locked
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-white/5 border-white/15 text-amber-200/75'
                      }`}
                    >
                      {locked ? '✓' : '○'} {label}
                      {winner ? ` (${winner})` : locked ? ' · Ropt' : ''}
                    </span>
                  );
                })}
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1f1207] to-amber-950/60 border-2 border-amber-400/50 shadow-xl flex items-center gap-4">
                {currentBall ? (
                  <>
                    <div
                      className="w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xl border-2 border-white shrink-0"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentBall.color} 55%, #0f172a 100%)`,
                      }}
                    >
                      <span className="text-xs font-black text-white">{currentBall.letter}</span>
                      <span className="text-3xl font-black text-white tabular-nums leading-none">
                        {currentBall.number}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase font-black text-amber-300 tracking-wider">
                        Siste Kule ({calledBalls.length} av 75 trukket)
                      </div>
                      <div className="font-heading font-black text-lg sm:text-xl text-white leading-snug">
                        &ldquo;{currentBall.affirmation}&rdquo;
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-amber-200/80 py-2">
                    🎯 Klar for trekk! Venter på at arrangøren trekker første kule...
                  </div>
                )}
              </div>

              {recentBalls.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-500/25 flex items-center justify-center gap-2.5">
                  <span className="text-xs uppercase font-bold text-amber-300/70">Forrige:</span>
                  {recentBalls.map((b, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow border border-white/40"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.number}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 7 cols: Master 1-75 Flashboard + Live Player Summary */}
            <div className="md:col-span-7 space-y-5">
              <div className="p-5 sm:p-6 rounded-3xl bg-amber-950/35 border-2 border-amber-500/30 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-500/20">
                  <h2 className="font-heading font-black text-lg sm:text-xl text-amber-200">
                    Master Tavle (1–75)
                  </h2>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {calledBalls.length} Trukket · {75 - calledBalls.length} Gjenstår
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { letter: 'B', color: '#0284c7', min: 1 },
                    { letter: 'I', color: '#7c3aed', min: 16 },
                    { letter: 'N', color: '#059669', min: 31 },
                    { letter: 'G', color: '#d97706', min: 46 },
                    { letter: 'O', color: '#e11d48', min: 61 },
                  ].map((row) => (
                    <div key={row.letter} className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shrink-0 shadow"
                        style={{ backgroundColor: row.color }}
                      >
                        {row.letter}
                      </div>
                      <div className="grid grid-cols-15 gap-1 flex-1">
                        {Array.from({ length: 15 }, (_, i) => row.min + i).map((num) => {
                          const isCalled = calledBalls.some((b) => b.number === num);
                          const isLatest = currentBall?.number === num;
                          return (
                            <div
                              key={num}
                              className={`aspect-square rounded-md flex items-center justify-center font-black tabular-nums text-xs sm:text-sm transition-all ${
                                isLatest
                                  ? 'bg-amber-300 text-slate-950 ring-2 ring-white scale-110 shadow-lg'
                                  : isCalled
                                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                                  : 'bg-black/45 text-amber-300/25 border border-amber-500/10'
                              }`}
                            >
                              {num}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-black/50 border border-amber-500/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    👥 Deltakere som spiller sammen ({bingoPlayers.length} spillere)
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-black">
                    Runde {bingoTvState?.roundNumber || 1}
                  </span>
                </div>
                {bingoPlayers.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2">
                    Venter på at deltakere kobler seg til med koden eller starter brett...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {[...bingoPlayers]
                      .sort((a, b) => {
                        if (a.hasBingo !== b.hasBingo) return a.hasBingo ? -1 : 1;
                        return b.linesCompleted - a.linesCompleted;
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                            p.hasBingo
                              ? 'bg-amber-500/25 border-amber-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: p.avatarColor }}
                            />
                            <span className="font-bold text-sm truncate">{p.name}</span>
                            {p.isRemote && <span className="text-[11px]" title="Tilkoblet på mobil">📱</span>}
                          </div>
                          <span className="font-mono font-black text-xs text-amber-300 shrink-0">
                            {p.hasBingo ? '🏆 BINGO!' : `${p.linesCompleted} linjer`}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* QUIZ & MIMELEK STORSKJERM / TV MODE */}
      {activeGame === 'quiz' && (
        <main className="flex-1 max-w-[1800px] mx-auto w-full py-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#231932] via-[#140e1d] to-[#0a070f] border-2 border-amber-400/40 space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-sm font-black text-amber-300">
                  {quizSnapshot?.mimeState?.active
                    ? `🎭 Katolsk Jule-Mimelek · Runde ${quizSnapshot.mimeState.roundNumber}`
                    : quizPhase === 'lobby'
                    ? 'Gjør lagene klare!'
                    : `Spørsmål ${(quizSnapshot?.questionIndex ?? 0) + 1} av ${quizSnapshot?.totalQuestions || 300}`}
                </div>
              </div>

              {(quizPhase === 'question' ||
                (quizEdition === 'christmas' && quizSnapshot?.mimeState?.active && quizSnapshot.mimeState.status === 'acting')) && (
                <div
                  className={`px-5 py-2 rounded-2xl border-2 font-mono tabular-nums font-black text-3xl ${
                    remainingSec <= 10
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  }`}
                >
                  ⏱️ {remainingSec}s
                </div>
              )}
            </div>

            {quizEdition === 'christmas' && quizSnapshot?.mimeState?.active ? (
              <div className="py-10 text-center space-y-5">
                {quizSnapshot.mimeState.status === 'choosing' && (
                  <>
                    <div className="text-6xl">🤫</div>
                    <h2 className="font-heading font-black text-3xl text-white">
                      Tur: {TEAM_STYLE[quizSnapshot.mimeState.activeTeamColor]?.icon}{' '}
                      {quizSnapshot.mimeState.activeTeamName}
                    </h2>
                    <p className="text-base text-slate-200 max-w-xl mx-auto">
                      Én spiller går til arrangøren og velger sitt hemmelige ord. Ordet vises aldri på Storskjermen før runden er ferdig!
                    </p>
                  </>
                )}

                {quizSnapshot.mimeState.status === 'acting' && (
                  <>
                    <div className="w-full h-3.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (remainingSec / 60) * 100))}%` }}
                      />
                    </div>
                    <div className="text-6xl">🎭</div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-200 text-xs font-black uppercase">
                      Kategori: {quizSnapshot.mimeState.category || 'Tro & Jul'}
                    </div>
                    <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
                      {TEAM_STYLE[quizSnapshot.mimeState.activeTeamColor]?.icon}{' '}
                      {quizSnapshot.mimeState.activeTeamName} mimer nå!
                    </h2>
                  </>
                )}

                {quizSnapshot.mimeState.status === 'revealed' && (
                  <>
                    <div className="text-6xl">
                      {quizSnapshot.mimeState.guessedCorrect ? '🎉' : '⏰'}
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 max-w-xl mx-auto">
                      <div className="text-xs font-bold text-emerald-300 uppercase">
                        Hemmelig mimeord var:
                      </div>
                      <div className="font-heading font-black text-3xl sm:text-4xl text-white mt-1">
                        «{quizSnapshot.mimeState.word}»
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {quizPhase === 'lobby' && (
                  <div className="py-12 text-center space-y-4">
                    <div className="text-6xl">
                      {quizEdition === 'adult'
                        ? '🎤'
                        : quizEdition === 'family'
                        ? '🎉'
                        : quizEdition === 'senior'
                        ? '👵'
                        : '🎄'}
                    </div>
                    <h2 className="font-heading font-black text-3xl text-white">
                      {quizEdition === 'senior'
                        ? 'Velkommen til Senior Grenland Quiz (Musikk & Lokalquiz)!'
                        : 'Velkommen til Quizen!'}
                    </h2>
                    <p className="text-base text-slate-200 max-w-xl mx-auto">
                      {visibleCodeOnScreen ? (
                        <>
                          Koble til med koden{' '}
                          <strong className="font-mono text-2xl text-amber-300 tracking-widest">
                            {visibleCodeOnScreen}
                          </strong>
                        </>
                      ) : (
                        'Arrangøren har åpnet quizrommet og styrer når første spørsmål og fasit deles til skjermen.'
                      )}
                    </p>
                    <div className="text-sm font-bold text-emerald-300">
                      Tilkoblede deltakere: {(quizSnapshot?.participants || []).length}
                    </div>
                  </div>
                )}

                {(quizPhase === 'question' || quizPhase === 'reveal') && publicQuestion && (
                  <div className="space-y-6">
                    {quizPhase === 'question' && (
                      <div className="w-full h-3.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            remainingSec <= 10 ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${timeProgressPct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                      <span className="text-amber-300 uppercase tracking-wider">
                        {publicQuestion.category === 'Musikk-gjetting'
                          ? '🎵 Musikk-gjetting (Lydklipp & Quiz)'
                          : publicQuestion.category}
                      </span>
                      {publicQuestion.questionType === 'open_text' && (
                        <span className="text-fuchsia-300">✍️ Skriv-svar (AhaSlides)</span>
                      )}
                    </div>

                    {publicQuestion.musicSongId && (() => {
                      const revealedSong =
                        quizPhase === 'reveal'
                          ? MUSIC_BINGO_SONGS.find((s) => s.id === publicQuestion.musicSongId)
                          : null;
                      return (
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-500/20 border-2 border-amber-400/60 flex items-center gap-3">
                          <span className="text-3xl shrink-0">🔊</span>
                          <div>
                            <div className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wider">
                              {quizPhase === 'reveal' && revealedSong
                                ? `🎶 Låten var: «${revealedSong.title}» — ${revealedSong.artist} (${revealedSong.decade})`
                                : '🎵 LYDSPØRSMÅL · Lytt til melodien & les spørsmålet under!'}
                            </div>
                            {publicQuestion.musicHint && (
                              <div className="text-sm sm:text-base text-amber-100/90 font-semibold mt-0.5">
                                💡 Hint: {publicQuestion.musicHint}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <h2 className="font-heading font-black text-2xl sm:text-4xl text-white leading-snug">
                      {publicQuestion.question}
                    </h2>

                    {publicQuestion.questionType === 'open_text' ? (
                      <div className="space-y-4">
                        {quizSnapshot?.showLiveAnswersOnScreen || quizPhase === 'reveal' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(quizSnapshot?.liveOpenAnswers || []).map((entry) => {
                              const style = TEAM_STYLE[entry.teamColor] || TEAM_STYLE.red;
                              const isRevealed = quizPhase === 'reveal';
                              return (
                                <div
                                  key={entry.id}
                                  className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                                    isRevealed && entry.isCorrect
                                      ? 'bg-emerald-500/25 border-emerald-400'
                                      : `${style.bg} ${style.border}`
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                                    <span className="truncate">
                                      {style.icon} {entry.teamName} · {entry.submittedBy}
                                    </span>
                                    {isRevealed && entry.isCorrect && (
                                      <span className="text-emerald-300 font-black">✓ RIKTIG!</span>
                                    )}
                                  </div>
                                  <div className="font-heading font-black text-xl text-white break-words">
                                    «{entry.text}»
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-black/50 border border-fuchsia-400/30 text-center space-y-2">
                            <div className="text-3xl">🔒</div>
                            <div className="font-bold text-lg text-white">
                              Svarene er skjult til arrangøren deler fasiten!
                            </div>
                            <div className="text-xs text-amber-300 font-mono font-bold">
                              {quizSnapshot?.liveOpenAnswerCount || 0} svar mottatt så langt
                            </div>
                          </div>
                        )}

                        {quizPhase === 'reveal' && (
                          <div className="p-5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-white">
                            <div className="text-xs font-bold text-emerald-300">✓ FASIT:</div>
                            <div className="font-heading font-black text-2xl mt-0.5">
                              {publicQuestion.options[0] || publicQuestion.acceptedAnswers?.[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {publicQuestion.options.map((opt, idx) => {
                          const isRevealed = quizPhase === 'reveal';
                          const isCorrect = isRevealed && publicQuestion.correctIndex === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-5 rounded-2xl border-2 text-lg sm:text-xl font-bold flex items-center justify-between gap-3 ${
                                isCorrect
                                  ? 'bg-emerald-500/25 border-emerald-400 text-white'
                                  : isRevealed
                                  ? 'bg-black/40 border-white/10 text-slate-400 opacity-75'
                                  : 'bg-white/5 border-white/20 text-white'
                              }`}
                            >
                              <span>
                                <span className="font-mono text-amber-300 mr-2.5">
                                  {OPTION_LETTERS[idx]}.
                                </span>
                                {opt}
                              </span>
                              {isCorrect && (
                                <span className="text-emerald-300 font-black">✓ RIKTIG!</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {quizPhase === 'reveal' && publicQuestion.wordplayJoke && (
                      <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-amber-100 text-base font-medium leading-relaxed">
                        😄 <strong>Kveldens ordlek:</strong> {publicQuestion.wordplayJoke}
                      </div>
                    )}
                  </div>
                )}

                {quizPhase === 'finished' && (
                  <div className="py-10 text-center space-y-5">
                    <div className="text-6xl">🏆</div>
                    <h2 className="font-heading font-black text-3xl text-amber-300">
                      Resultattavle — Takk for kampen!
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {sortedQuizLeaderboard.map((team, rank) => {
                        const style = TEAM_STYLE[team.color];
                        return (
                          <div
                            key={team.id}
                            className={`p-4 rounded-2xl border ${style.bg} ${style.border} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-black text-xl text-amber-300">
                                #{rank + 1}
                              </span>
                              <span>{style.icon}</span>
                              <span className="font-bold text-white">{team.name}</span>
                            </div>
                            <span className="font-mono tabular-nums font-black text-2xl text-white">
                              {quizSnapshot?.teamScores?.[team.id] || 0} p
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Team Live Scoreboard Footer */}
            <div
              className={`grid gap-3 pt-3 border-t border-white/10 ${
                quizTeams.length > 6
                  ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {quizTeams.map((team) => {
                const style = TEAM_STYLE[team.color];
                const answered = quizSnapshot?.answeredTeamIds?.includes(team.id);
                const score = quizSnapshot?.teamScores?.[team.id] || 0;
                return (
                  <div
                    key={team.id}
                    className={`p-3.5 rounded-xl border ${style.bg} ${style.border} flex flex-col justify-between gap-1`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">
                        {style.icon} {team.name}
                      </span>
                      {quizPhase === 'question' && (
                        <span className={answered ? 'text-emerald-300' : 'text-slate-400'}>
                          {answered ? '✓' : '…'}
                        </span>
                      )}
                    </div>
                    <div className="font-mono tabular-nums font-black text-xl text-white">
                      {score} poeng
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
