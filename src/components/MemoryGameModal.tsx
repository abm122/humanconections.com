/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import {
  buildShuffledMemoryDeck,
  MemoryCardInstance,
  MemoryCategory,
} from '../data/memoryCardsData';
import { sessionTimer } from '../services/sessionTimer';
import { useTranslation } from '../services/i18n';
import { LanguageSelector } from './LanguageSelector';
import { getMemoryCardLabel, getMemoryTexts } from '../services/memoryI18n';

interface MemoryTeam {
  id: string;
  name: string;
  mascot: string;
  colorHex: string;
  score: number;
  pairsFound: number;
  hasCustomName?: boolean;
}

type MemoryGamePhase = 'WAITING_HOST' | 'PREVIEW_10S' | 'ACTIVE';

interface MemoryGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToOtherGames?: () => void;
}

const PREVIEW_SECONDS = 10;

export const MemoryGameModal: React.FC<MemoryGameModalProps> = ({
  isOpen,
  onClose,
  onSwitchToOtherGames,
}) => {
  const { lang, currentInfo } = useTranslation();
  const mt = getMemoryTexts(lang);

  const modalRootRef = useRef<HTMLDivElement | null>(null);
  const mismatchTimerRef = useRef<number | null>(null);
  const winnerTimerRef = useRef<number | null>(null);
  const previewIntervalRef = useRef<number | null>(null);

  const [category, setCategory] = useState<MemoryCategory>('mixed');
  const [pairCount, setPairCount] = useState<number>(15);
  const [deck, setDeck] = useState<MemoryCardInstance[]>(() =>
    buildShuffledMemoryDeck('mixed', 15)
  );
  const [gamePhase, setGamePhase] = useState<MemoryGamePhase>('WAITING_HOST');
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(PREVIEW_SECONDS);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [keepTurnOnMatch, setKeepTurnOnMatch] = useState<boolean>(true);
  const [pointsPerMatch, setPointsPerMatch] = useState<number>(1);
  const [mismatchPenalty, setMismatchPenalty] = useState<number>(0);

  const [teams, setTeams] = useState<MemoryTeam[]>(() => [
    { id: 'team-1', ...mt.defaultTeams[0], score: 0, pairsFound: 0 },
    { id: 'team-2', ...mt.defaultTeams[1], score: 0, pairsFound: 0 },
  ]);
  const [activeTeamIdx, setActiveTeamIdx] = useState<number>(0);
  const [customPrize, setCustomPrize] = useState<string>(() => mt.prizeSuggestions[0]);
  const [hasCustomPrize, setHasCustomPrize] = useState<boolean>(false);
  const [lastEventBanner, setLastEventBanner] = useState<string | null>(null);
  const [showWinnerSummary, setShowWinnerSummary] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [sessionRemaining, setSessionRemaining] = useState<string>(() =>
    sessionTimer.getFormattedRemaining()
  );

  // Sync default team names & default prize when UI language changes (unless user typed custom text)
  useEffect(() => {
    const localized = getMemoryTexts(lang);
    setTeams((prev) =>
      prev.map((team, idx) =>
        team.hasCustomName
          ? team
          : {
              ...team,
              name: localized.defaultTeams[idx % localized.defaultTeams.length].name,
            }
      )
    );
    if (!hasCustomPrize) {
      setCustomPrize(localized.prizeSuggestions[0]);
    }
    setLastEventBanner(null);
  }, [lang, hasCustomPrize]);

  const clearPendingTimers = useCallback(() => {
    if (mismatchTimerRef.current) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
    if (winnerTimerRef.current) {
      window.clearTimeout(winnerTimerRef.current);
      winnerTimerRef.current = null;
    }
    if (previewIntervalRef.current) {
      window.clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unsub = sessionTimer.subscribe(() => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
    });
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', onFsChange);
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  useEffect(() => {
    if (!isOpen) {
      clearPendingTimers();
      setIsLocked(false);
      if (gamePhase === 'PREVIEW_10S') {
        setGamePhase('ACTIVE');
      }
    }
  }, [isOpen, clearPendingTimers, gamePhase]);

  if (!isOpen) return null;

  const activeTeam = teams[activeTeamIdx] || teams[0];
  const matchedPairsCount = deck.filter((c) => c.isMatched).length / 2;
  const totalPairsInDeck = deck.length / 2;
  const allMatched = deck.length > 0 && matchedPairsCount === totalPairsInDeck;

  const startTenSecondReveal = (isMidGamePeek: boolean = false) => {
    clearPendingTimers();
    setFlippedIndices([]);
    setIsLocked(false);
    setGamePhase('PREVIEW_10S');
    setPreviewSecondsLeft(PREVIEW_SECONDS);
    setLastEventBanner(isMidGamePeek ? mt.bannerPreviewMid : mt.bannerPreviewStart);

    let remaining = PREVIEW_SECONDS;
    previewIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (previewIntervalRef.current) {
          window.clearInterval(previewIntervalRef.current);
          previewIntervalRef.current = null;
        }
        setPreviewSecondsLeft(0);
        setGamePhase('ACTIVE');
        sounds.playPop(0.95);
        setLastEventBanner(`${activeTeam.mascot} ${activeTeam.name} ${mt.bannerActiveStart}`);
      } else {
        setPreviewSecondsLeft(remaining);
      }
    }, 1000);
  };

  const handleHostStartRound = () => {
    sounds.playLineComplete();
    startTenSecondReveal(false);
  };

  const handleFinishPreviewEarly = () => {
    sounds.playClick();
    clearPendingTimers();
    setPreviewSecondsLeft(0);
    setGamePhase('ACTIVE');
    setLastEventBanner(`${activeTeam.mascot} ${activeTeam.name} ${mt.bannerActiveShort}`);
  };

  const handleShuffleDeck = (
    nextCategory: MemoryCategory = category,
    nextPairs: number = pairCount,
    resetScores: boolean = false
  ) => {
    sounds.playPop(1.05);
    clearPendingTimers();
    setIsLocked(false);
    setFlippedIndices([]);
    setMovesCount(0);
    setShowWinnerSummary(false);
    setGamePhase('WAITING_HOST');
    setPreviewSecondsLeft(PREVIEW_SECONDS);
    setDeck(buildShuffledMemoryDeck(nextCategory, nextPairs));

    if (resetScores) {
      setTeams((prev) => prev.map((t) => ({ ...t, score: 0, pairsFound: 0 })));
      setActiveTeamIdx(0);
      setRoundNumber(1);
      setLastEventBanner(mt.bannerReset);
    } else {
      setRoundNumber((r) => r + 1);
      setLastEventBanner(mt.bannerNewRound);
    }
  };

  const handleCardTap = (cardIndex: number) => {
    if (gamePhase !== 'ACTIVE' || isLocked) return;
    const card = deck[cardIndex];
    if (!card || card.isMatched || flippedIndices.includes(cardIndex)) return;

    sounds.playPop(1.1);

    if (flippedIndices.length === 0) {
      setFlippedIndices([cardIndex]);
      return;
    }

    if (flippedIndices.length === 1) {
      const firstIndex = flippedIndices[0];
      const firstCard = deck[firstIndex];
      const nextFlipped = [firstIndex, cardIndex];
      setFlippedIndices(nextFlipped);
      setMovesCount((m) => m + 1);
      setIsLocked(true);

      const firstLocalized = getMemoryCardLabel(firstCard.itemId, firstCard.label, lang);
      const secondLocalized = getMemoryCardLabel(card.itemId, card.label, lang);

      if (firstCard && firstCard.itemId === card.itemId) {
        const updatedDeck = deck.map((c, idx) =>
          idx === firstIndex || idx === cardIndex
            ? { ...c, isMatched: true, matchedByTeamId: activeTeam.id }
            : c
        );
        const nowAllMatched = updatedDeck.every((c) => c.isMatched);

        setDeck(updatedDeck);
        setTeams((prev) =>
          prev.map((t, idx) =>
            idx === activeTeamIdx
              ? {
                  ...t,
                  score: t.score + pointsPerMatch,
                  pairsFound: t.pairsFound + 1,
                }
              : t
          )
        );
        setLastEventBanner(
          `${activeTeam.mascot} ${activeTeam.name} ${mt.bannerMatch}: ${secondLocalized} (+${pointsPerMatch}${mt.pointsUnit})`
        );

        if (nowAllMatched) {
          sounds.playBingoWin();
          setFlippedIndices([]);
          setIsLocked(false);
          winnerTimerRef.current = window.setTimeout(() => {
            setShowWinnerSummary(true);
          }, 450);
        } else {
          sounds.playLineComplete();
          mismatchTimerRef.current = window.setTimeout(() => {
            setFlippedIndices([]);
            if (!keepTurnOnMatch && teams.length > 1) {
              setActiveTeamIdx((idx) => (idx + 1) % teams.length);
            }
            setIsLocked(false);
          }, 420);
        }
      } else {
        if (mismatchPenalty < 0) {
          setTeams((prev) =>
            prev.map((t, idx) =>
              idx === activeTeamIdx ? { ...t, score: t.score + mismatchPenalty } : t
            )
          );
        }
        const penaltyNote = mismatchPenalty < 0 ? ` (${mismatchPenalty}${mt.pointsUnit})` : '';
        setLastEventBanner(
          `${mt.bannerMismatch}: ${firstLocalized} / ${secondLocalized}${penaltyNote}`
        );
        mismatchTimerRef.current = window.setTimeout(() => {
          setFlippedIndices([]);
          if (teams.length > 1) {
            setActiveTeamIdx((idx) => (idx + 1) % teams.length);
          }
          setIsLocked(false);
        }, 1050);
      }
    }
  };

  const handleAdjustTeamScore = (teamIdx: number, delta: number) => {
    sounds.playClick();
    setTeams((prev) =>
      prev.map((t, idx) => (idx === teamIdx ? { ...t, score: t.score + delta } : t))
    );
  };

  const handleSetTeamScoreDirect = (teamIdx: number, rawValue: string) => {
    if (rawValue === '' || rawValue === '-') return;
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return;
    setTeams((prev) =>
      prev.map((t, idx) => (idx === teamIdx ? { ...t, score: parsed } : t))
    );
  };

  const handleRenameTeam = (teamIdx: number, newName: string) => {
    setTeams((prev) =>
      prev.map((t, idx) =>
        idx === teamIdx ? { ...t, name: newName, hasCustomName: true } : t
      )
    );
  };

  const handleAddTeam = () => {
    if (teams.length >= 6) return;
    sounds.playClick();
    const palette = mt.defaultTeams[teams.length % mt.defaultTeams.length];
    setTeams((prev) => [
      ...prev,
      {
        id: `team-${Date.now()}-${prev.length + 1}`,
        name: palette.name,
        mascot: palette.mascot,
        colorHex: palette.colorHex,
        score: 0,
        pairsFound: 0,
      },
    ]);
  };

  const handleRemoveTeam = (teamIdx: number) => {
    if (teams.length <= 1) return;
    sounds.playClick();
    setTeams((prev) => {
      const next = prev.filter((_, idx) => idx !== teamIdx);
      if (activeTeamIdx >= next.length) {
        setActiveTeamIdx(0);
      }
      return next;
    });
  };

  const toggleFullscreen = async () => {
    sounds.playClick();
    try {
      if (!document.fullscreenElement && modalRootRef.current) {
        await modalRootRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen restriction
    }
  };

  const rankedTeams = [...teams].sort((a, b) => b.score - a.score || b.pairsFound - a.pairsFound);
  const topScore = rankedTeams[0]?.score ?? 0;
  const winners = rankedTeams.filter((t) => t.score === topScore);

  const gridColsClass =
    deck.length <= 16
      ? 'grid-cols-4'
      : deck.length <= 20
      ? 'grid-cols-4 sm:grid-cols-5'
      : deck.length <= 24
      ? 'grid-cols-4 sm:grid-cols-6'
      : 'grid-cols-5 sm:grid-cols-6';

  const categoryOptions: { id: MemoryCategory; icon: string; label: string }[] = [
    { id: 'mixed', icon: '🎨', label: mt.catMixed },
    { id: 'animals', icon: '🦁', label: mt.catAnimals },
    { id: 'characters', icon: '🦄', label: mt.catCharacters },
    { id: 'things', icon: '🚒', label: mt.catThings },
  ];

  const pairOptions = [
    { pairs: 15, label: mt.size30 },
    { pairs: 12, label: mt.size24 },
    { pairs: 10, label: mt.size20 },
    { pairs: 8, label: mt.size16 },
  ];

  return (
    <div
      ref={modalRootRef}
      dir={currentInfo.dir}
      className="fixed inset-0 z-50 flex flex-col bg-[#0e1526] text-slate-100 overflow-y-auto overflow-x-clip"
    >
      {/* Unified Top Bar: Zero empty gaps, responsive across Mobile, PC, TV & Projector */}
      <header className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-3 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 shrink-0 bg-[#0b1120]/95">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shrink-0">
            🧩
          </div>
          <div className="min-w-0">
            <h1 className="font-heading font-black text-lg sm:text-2xl text-white tracking-tight leading-none">
              {mt.title}
            </h1>
            <p className="text-xs text-slate-300 mt-1 truncate">
              {deck.length} {mt.subtitleCards} ({totalPairsInDeck} {mt.subtitlePairs}) · {mt.subtitleMode} · {mt.playtimeLabel}{' '}
              <span className="font-mono tabular-nums text-emerald-300 font-bold">{sessionRemaining}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {gamePhase === 'WAITING_HOST' ? (
            <button
              type="button"
              onClick={handleHostStartRound}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>▶</span>
              <span>{mt.startBtn}</span>
            </button>
          ) : gamePhase === 'PREVIEW_10S' ? (
            <button
              type="button"
              onClick={handleFinishPreviewEarly}
              className="px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>👀</span>
              <span>
                {mt.showingCardsBtn} ({previewSecondsLeft}s) · {mt.hideNowBtn}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                startTenSecondReveal(true);
              }}
              disabled={allMatched}
              className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-100 font-bold text-xs cursor-pointer transition-all disabled:opacity-40 whitespace-nowrap"
            >
              👁️ {mt.peekBtn}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleShuffleDeck(category, pairCount, false)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>🔄</span>
            <span>{mt.shuffleBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowWinnerSummary(true);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 font-bold text-xs cursor-pointer transition-all whitespace-nowrap"
          >
            🏆 {mt.winnerBtn}
          </button>

          {onSwitchToOtherGames && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
                onSwitchToOtherGames();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs cursor-pointer transition-all whitespace-nowrap"
            >
              🎲 {mt.otherGamesBtn}
            </button>
          )}

          <LanguageSelector variant="compact" />

          <button
            type="button"
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            aria-label={isMuted ? mt.soundOn : mt.soundOff}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? mt.exitFullscreenBtn : `📺 ${mt.fullscreenBtn}`}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-100 font-bold text-xs cursor-pointer whitespace-nowrap"
          >
            ✕ {mt.closeBtn}
          </button>
        </div>
      </header>

      {/* Main Content: Fluid responsive split across Mobile, PC & Storskjerm */}
      <main className="flex-1 w-full max-w-[1880px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-start gap-5">
        {/* LEFT COLUMN: Poengviser (Team Scoreboard) & Host Config */}
        <aside className="w-full lg:w-[360px] xl:w-[395px] shrink-0 space-y-4">
          <section className="p-4 rounded-2xl bg-[#151e34] border border-slate-700/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-black text-base text-white">
                  {mt.scoreboardTitle}
                </h2>
                <p className="text-xs text-slate-300">{mt.scoreboardHint}</p>
              </div>
              {teams.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-100 text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {mt.addTeamBtn}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {teams.map((team, idx) => {
                const isTurn = idx === activeTeamIdx;
                const isNegative = team.score < 0;
                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isTurn
                        ? 'bg-slate-800/95 border-amber-400 shadow-lg'
                        : 'bg-slate-900/70 border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor: `${team.colorHex}33`,
                            border: `1px solid ${team.colorHex}`,
                          }}
                        >
                          {team.mascot}
                        </span>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => handleRenameTeam(idx, e.target.value)}
                          maxLength={24}
                          aria-label={`${mt.teamAriaPrefix} ${idx + 1}`}
                          className="w-full min-w-0 bg-transparent border-b border-transparent focus:border-amber-400 text-sm font-black text-white outline-none py-0.5 truncate"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          value={team.score}
                          onChange={(e) => handleSetTeamScoreDirect(idx, e.target.value)}
                          aria-label={`${mt.pointsAriaPrefix} ${team.name}`}
                          className={`w-12 bg-transparent text-right font-mono tabular-nums font-black text-lg outline-none ${
                            isNegative ? 'text-rose-400' : 'text-amber-300'
                          }`}
                        />
                        <span className="text-[11px] text-slate-300 font-semibold">
                          {mt.pointsUnit}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        {isTurn ? (
                          <span className="font-black text-amber-300">▶ {mt.turnNow}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setActiveTeamIdx(idx);
                            }}
                            className="text-slate-300 hover:text-white underline decoration-slate-500 cursor-pointer font-semibold"
                          >
                            {mt.giveTurnBtn}
                          </button>
                        )}
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300 tabular-nums">
                          {team.pairsFound} {mt.pairsUnit}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustTeamScore(idx, -2)}
                          className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/50 text-rose-100 font-black text-xs cursor-pointer"
                        >
                          -2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTeamScore(idx, -1)}
                          className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/50 text-rose-100 font-black text-xs cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTeamScore(idx, 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-100 font-black text-xs cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTeamScore(idx, 2)}
                          className="w-8 h-8 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-100 font-black text-xs cursor-pointer"
                        >
                          +2
                        </button>
                        {teams.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeam(idx)}
                            className="w-7 h-8 rounded-lg text-slate-400 hover:text-rose-300 text-xs cursor-pointer"
                            title={mt.removeTeamTitle}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {teams.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTeamIdx((i) => (i + 1) % teams.length);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold cursor-pointer transition-all"
              >
                {mt.nextTeamBtn} ➔
              </button>
            )}
          </section>

          {/* HOST PRIZE & CARD SETUP */}
          <section className="p-4 rounded-2xl bg-[#151e34] border border-slate-700/80 shadow-xl space-y-3.5">
            <h2 className="font-heading font-black text-sm text-white">
              {mt.hostSectionTitle}
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="memory-prize-input" className="block text-xs font-bold text-amber-200">
                {mt.prizeLabel}
              </label>
              <input
                id="memory-prize-input"
                type="text"
                value={customPrize}
                onChange={(e) => {
                  setHasCustomPrize(true);
                  setCustomPrize(e.target.value);
                }}
                placeholder={mt.prizePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 focus:border-amber-400 text-xs sm:text-sm text-white outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {mt.prizeSuggestions.map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setHasCustomPrize(false);
                      setCustomPrize(sugg);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                      customPrize === sugg
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {sugg.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              <div>
                <label htmlFor="memory-category-select" className="block text-xs font-bold text-slate-200 mb-1">
                  {mt.categoryLabel}
                </label>
                <select
                  id="memory-category-select"
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value as MemoryCategory;
                    setCategory(nextCat);
                    handleShuffleDeck(nextCat, pairCount, false);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="memory-size-select" className="block text-xs font-bold text-slate-200 mb-1">
                  {mt.boardSizeLabel}
                </label>
                <select
                  id="memory-size-select"
                  value={pairCount}
                  onChange={(e) => {
                    const nextPairs = Number(e.target.value);
                    setPairCount(nextPairs);
                    handleShuffleDeck(category, nextPairs, false);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {pairOptions.map((opt) => (
                    <option key={opt.pairs} value={opt.pairs}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300 font-semibold">{mt.matchPointsLabel}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPointsPerMatch(pts);
                      }}
                      className={`px-2.5 py-1 rounded-md font-mono font-bold cursor-pointer ${
                        pointsPerMatch === pts
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      +{pts}{mt.pointsUnit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300 font-semibold">{mt.mismatchPointsLabel}</span>
                <div className="flex items-center gap-1">
                  {[0, -1, -2].map((pen) => (
                    <button
                      key={pen}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setMismatchPenalty(pen);
                      }}
                      className={`px-2.5 py-1 rounded-md font-mono font-bold cursor-pointer ${
                        mismatchPenalty === pen
                          ? pen < 0
                            ? 'bg-rose-400 text-slate-950'
                            : 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pen === 0 ? `0${mt.pointsUnit}` : `${pen}${mt.pointsUnit}`}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200 pt-1">
                <input
                  type="checkbox"
                  checked={keepTurnOnMatch}
                  onChange={(e) => setKeepTurnOnMatch(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <span>{mt.keepTurnLabel}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  startTenSecondReveal(true);
                }}
                disabled={gamePhase === 'PREVIEW_10S' || allMatched}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs cursor-pointer disabled:opacity-40"
              >
                👁️ {mt.peekShortBtn}
              </button>
              <button
                type="button"
                onClick={() => handleShuffleDeck(category, pairCount, true)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/25 border border-slate-600 hover:border-rose-400/50 text-slate-100 font-bold text-xs cursor-pointer"
              >
                🧹 {mt.resetScoresBtn}
              </button>
            </div>
          </section>
        </aside>

        {/* RIGHT MAIN ARENA: Status Bar + Host Start Gate + 30 Touch Cards */}
        <section className="flex-1 min-w-0 w-full space-y-3.5">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#151e34] border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2"
                style={{
                  backgroundColor: `${activeTeam.colorHex}25`,
                  borderColor: activeTeam.colorHex,
                }}
              >
                {activeTeam.mascot}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-300">
                  {mt.turnPrefix} <span className="text-white font-black">{activeTeam.name}</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                  {lastEventBanner || mt.bannerInit}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-200 shrink-0">
              <div>
                {mt.roundLabel} <strong className="text-white">{roundNumber}</strong>
              </div>
              <div>
                {mt.pairsLabel} <strong className="text-emerald-300">{matchedPairsCount}/{totalPairsInDeck}</strong>
              </div>
              <div>
                {mt.movesLabel} <strong className="text-amber-300">{movesCount}</strong>
              </div>
            </div>
          </div>

          {gamePhase === 'WAITING_HOST' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#12263a] to-sky-950/90 border-2 border-emerald-400/70 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-heading font-black text-sm sm:text-base text-emerald-200">
                  {mt.waitingTitle}
                </div>
                <p className="text-xs text-slate-200 mt-0.5">{mt.waitingDescStart}</p>
              </div>
              <button
                type="button"
                onClick={handleHostStartRound}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all whitespace-nowrap"
              >
                ▶ {mt.waitingBtn}
              </button>
            </div>
          )}

          {gamePhase === 'PREVIEW_10S' && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-sky-500/20 to-amber-500/25 border-2 border-amber-400 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 font-mono tabular-nums font-black text-2xl flex items-center justify-center shadow">
                  {previewSecondsLeft}
                </div>
                <div>
                  <div className="font-heading font-black text-sm sm:text-base text-amber-200">
                    👀 {mt.previewTitle}
                  </div>
                  <div className="text-xs text-slate-100">
                    {mt.previewCountdownPrefix} <strong>{previewSecondsLeft}</strong>{' '}
                    {previewSecondsLeft === 1 ? mt.secondSingular : mt.secondPlural}.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinishPreviewEarly}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-300/60 text-amber-200 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {mt.hideEarlyBtn} ➔
              </button>
            </div>
          )}

          {customPrize.trim() && (
            <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs sm:text-sm text-amber-100 flex items-center justify-between gap-2">
              <span>
                🎁 <strong className="text-amber-300">{mt.prizeBannerPrefix}</strong> {customPrize}
              </span>
              <span className="text-[11px] text-amber-200/80 hidden sm:inline">
                {mt.prizeAudienceNote}
              </span>
            </div>
          )}

          <div className={`grid ${gridColsClass} gap-2 sm:gap-3`}>
            {deck.map((card, idx) => {
              const isFlipped =
                gamePhase === 'PREVIEW_10S' ||
                card.isMatched ||
                flippedIndices.includes(idx);
              const matchedTeam = card.matchedByTeamId
                ? teams.find((t) => t.id === card.matchedByTeamId)
                : undefined;
              const isDisabled =
                gamePhase !== 'ACTIVE' ||
                card.isMatched ||
                (isLocked && !flippedIndices.includes(idx));
              const localizedCardLabel = getMemoryCardLabel(card.itemId, card.label, lang);

              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardTap(idx)}
                  disabled={isDisabled}
                  aria-label={isFlipped ? `${localizedCardLabel} (#${idx + 1})` : `#${idx + 1}`}
                  className={`relative min-h-[88px] sm:min-h-[110px] lg:min-h-[122px] w-full rounded-2xl border-2 p-2 flex flex-col items-center justify-center transition-all duration-200 touch-manipulation select-none ${
                    isFlipped
                      ? `bg-gradient-to-br ${card.surfaceClass} ${card.ringClass} shadow-xl ${
                          card.isMatched
                            ? 'ring-2 ring-emerald-400 shadow-emerald-950/50'
                            : 'scale-[1.02]'
                        }`
                      : gamePhase === 'WAITING_HOST'
                      ? 'bg-[#16203c] border-slate-600/70 opacity-85 cursor-not-allowed'
                      : 'bg-gradient-to-br from-[#1e2d52] via-[#17223f] to-[#111930] border-sky-400/45 hover:border-amber-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-lg'
                  }`}
                >
                  {isFlipped ? (
                    <>
                      <span className="text-3xl sm:text-4xl lg:text-5xl leading-none drop-shadow-sm">
                        {card.emoji}
                      </span>
                      <span className="mt-1.5 font-heading font-black text-[11px] sm:text-xs lg:text-sm tracking-tight leading-tight text-center">
                        {localizedCardLabel}
                      </span>
                      {card.isMatched && (
                        <span
                          className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white shadow flex items-center gap-0.5"
                          style={{ backgroundColor: matchedTeam?.colorHex || '#10b981' }}
                          title={matchedTeam ? `${mt.foundByPrefix} ${matchedTeam.name}` : undefined}
                        >
                          <span>✓</span>
                          {matchedTeam && <span>{matchedTeam.mascot}</span>}
                        </span>
                      )}
                      <span className="absolute top-1.5 left-2 text-[10px] font-mono tabular-nums opacity-55 font-bold">
                        {idx + 1}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-mono tabular-nums font-black text-xl sm:text-2xl lg:text-3xl text-amber-300 drop-shadow">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-sky-200/80">
                        {gamePhase === 'WAITING_HOST' ? mt.cardReadyLabel : mt.cardTapLabel}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {showWinnerSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[#141d33] border-2 border-amber-400 p-6 shadow-2xl text-center space-y-4">
            <div className="text-5xl">🏆</div>
            <h2 className="font-heading font-black text-2xl text-white">
              {winners.length > 1
                ? mt.tieTitle
                : `${winners[0]?.mascot || ''} ${winners[0]?.name || ''} ${mt.leadsMemorySuffix}`}
            </h2>

            <div className="space-y-2 text-left">
              {rankedTeams.map((team, rIdx) => (
                <div
                  key={team.id}
                  className={`px-4 py-2.5 rounded-xl flex items-center justify-between border ${
                    rIdx === 0
                      ? 'bg-amber-400/20 border-amber-400 text-white'
                      : 'bg-slate-900/70 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-sm">
                    <span className="font-mono tabular-nums text-amber-300">#{rIdx + 1}</span>
                    <span>{team.mascot}</span>
                    <span>{team.name}</span>
                  </div>
                  <div
                    className={`font-mono tabular-nums font-black text-base ${
                      team.score < 0 ? 'text-rose-300' : 'text-amber-300'
                    }`}
                  >
                    {team.score} {mt.pointsUnit} · {team.pairsFound} {mt.pairsUnit}
                  </div>
                </div>
              ))}
            </div>

            {customPrize.trim() && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-100 text-sm">
                <div className="font-black text-emerald-300 text-xs uppercase tracking-wider mb-1">
                  🎁 {mt.hostPrizeHeading}
                </div>
                <div className="font-bold">{customPrize}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleShuffleDeck(category, pairCount, false)}
                className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                🔄 {mt.newRoundKeepBtn}
              </button>
              <button
                type="button"
                onClick={() => handleShuffleDeck(category, pairCount, true)}
                className="py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                🆕 {mt.newGameResetBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowWinnerSummary(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs cursor-pointer"
              >
                {mt.backToBoardBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
