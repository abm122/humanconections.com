/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CalledBall, Player, BingoTheme } from '../types/bingo';
import { sounds } from '../audio/soundEngine';
import { BallCageCanvas } from './BallCageCanvas';
import { RilMusicPlayer } from './RilMusicPlayer';
import { authService } from '../services/authService';
import { sessionTimer } from '../services/sessionTimer';
import { ownerControl } from '../services/ownerControl';
import { remoteBingo, RemoteParticipant, RemoteBingoClaim, BingoTvPlayerSummary } from '../services/remoteBingo';

export type AudienceViewOption = 'multiplayer_ril' | 'split_show' | 'flashboard' | 'stories' | 'leaderboard';

interface AudienceDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  calledBalls: CalledBall[];
  uncalledBalls: CalledBall[];
  onDrawNextBall: () => void;
  players: Player[];
  roomName?: string;
  activeTheme?: BingoTheme;
  onToggleCell?: (playerIdx: number, cardIdx: number, row: number, col: number) => void;
  onAgitateMix?: () => void;
  onOpenRemoteBingo?: () => void;
  onOpenTvMode?: (game: 'bingo' | 'quiz', code: string) => void;
  onStartNewRound?: () => void;
  onRefillDrum?: () => void;
  canControlDraw?: boolean;
}

export const AudienceDisplayModal: React.FC<AudienceDisplayModalProps> = ({
  isOpen,
  onClose,
  calledBalls,
  uncalledBalls,
  onDrawNextBall,
  players,
  roomName = 'joy-lounge',
  activeTheme = 'ril',
  onToggleCell,
  onAgitateMix,
  onOpenRemoteBingo,
  onOpenTvMode,
  onStartNewRound,
  onRefillDrum,
  canControlDraw = true,
}) => {
  const [viewOption, setViewOption] = useState<AudienceViewOption>('multiplayer_ril');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spotlightPlayerIdx, setSpotlightPlayerIdx] = useState<number | 'all'>('all');
  const [showBlender, setShowBlender] = useState(true);
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [isAudienceScreenLocked, setIsAudienceScreenLocked] = useState(false);
  const [showCodeOnBigScreen, setShowCodeOnBigScreen] = useState<boolean>(() =>
    remoteBingo.isShowCodeOnBigScreen()
  );
  const [remotePlayers, setRemotePlayers] = useState<RemoteParticipant[]>(() =>
    remoteBingo.getConnectedRemotePlayers()
  );
  const [tvPlayersSummary, setTvPlayersSummary] = useState<BingoTvPlayerSummary[]>(() =>
    remoteBingo.getTvState()?.playersSummary || []
  );
  const [roundNumber, setRoundNumber] = useState<number>(() => remoteBingo.getRoundNumber());
  const [activeClaim, setActiveClaim] = useState<RemoteBingoClaim | null>(null);
  const [copiedTvLink, setCopiedTvLink] = useState<boolean>(false);

  const authUser = authService.getCurrentUser();
  const isOwner = authUser.role === 'owner' || ownerControl.isUnlocked();
  const isRemoteParticipant = remoteBingo.getIsRemotePlayer() && !isOwner;
  const canActAsHost =
    canControlDraw &&
    !isRemoteParticipant &&
    (isOwner || (authUser.isAuthenticated && sessionTimer.hasPaidAccess()));
  const canDrawInStorskjerm = canActAsHost && !isAudienceScreenLocked;
  const hasAccess = !isRemoteParticipant && (isOwner || sessionTimer.hasPaidAccess());
  const hostDisplayName =
    (authUser.isAuthenticated && authUser.name && authUser.name !== 'Gjest' ? authUser.name : '') ||
    remoteBingo.getHostName();
  const hostCode = remoteBingo.getHostCode();

  useEffect(() => {
    const unsub = remoteBingo.subscribe(() => {
      setShowCodeOnBigScreen(remoteBingo.isShowCodeOnBigScreen());
      setRemotePlayers([...remoteBingo.getConnectedRemotePlayers()]);
      setRoundNumber(remoteBingo.getRoundNumber());
      setTvPlayersSummary([...(remoteBingo.getTvState()?.playersSummary || [])]);
    });
    const unsubClaim = remoteBingo.onClaim((claim) => {
      setActiveClaim(claim);
    });
    const unsubNewRound = remoteBingo.onNewRound(() => {
      setActiveClaim(null);
      setRoundNumber(remoteBingo.getRoundNumber());
    });
    return () => {
      unsub();
      unsubClaim();
      unsubNewRound();
    };
  }, []);

  useEffect(() => {
    if (isOpen && canActAsHost) {
      const totalCount = players.length + remotePlayers.length;
      remoteBingo.syncTvStateToRoom({
        calledBalls,
        players,
        themeTitle: `Storskjerm RIL (${totalCount} spillere · Runde ${roundNumber})`,
      });
    }
  }, [isOpen, canActAsHost, calledBalls, players, remotePlayers.length, roundNumber]);

  if (!isOpen) return null;

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#140c06] border-2 border-amber-500/50 text-center space-y-4 shadow-2xl text-amber-50 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="font-heading font-black text-xl text-amber-200">
            Innlogging og spilletid kreves for Storskjerm
          </h2>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Storskjermvisning krever aktiv innlogging og gyldig spilletid (Kort, Apple Pay eller Google Pay).
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow hover:brightness-110"
            >
              ⇦ Tilbake til startmenyen (Logg inn & Betaling)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentBall = calledBalls.length > 0 ? calledBalls[calledBalls.length - 1] : null;
  const recentBalls = [...calledBalls].reverse().slice(1, 6);

  // Group called numbers by letter (B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75)
  const isNumberCalled = (num?: number) => {
    if (!num) return false;
    return calledBalls.some((b) => b.number === num);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Collect all player stories across cards
  const allStories: { player: string; text: string; partner?: string; note?: string }[] = [];
  players.forEach((p) => {
    p.cards.forEach((card) => {
      card.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isMarked && (cell.markedBy || cell.storyNote)) {
            allStories.push({
              player: p.name,
              text: cell.text,
              partner: cell.markedBy,
              note: cell.storyNote,
            });
          }
        });
      });
    });
  });

  const displayedPlayers =
    spotlightPlayerIdx === 'all'
      ? players
      : [players[spotlightPlayerIdx]].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0704] text-amber-50 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-clip">
      {/* Unified Studio Presentation Header (Zero Empty Voids Across PC, TV & Projector) */}
      <header className="w-fit max-w-full mx-auto rounded-2xl bg-black/55 backdrop-blur-md border border-amber-500/25 px-3.5 sm:px-5 py-3 shadow-2xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
          {/* Left Zone: Brand Emblem + View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-xl" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="32" fill="url(#sunGlowAudience)" />
                  <path
                    d="M50 4 L50 18 M50 82 L50 96 M4 50 L18 50 M82 50 L96 50"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 17 L27 27 M73 73 L83 83 M17 83 L27 73 M73 27 L83 17"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 66 C40 54 30 43 30 34 C30 25 37 19 44 19 C48 19 50 22 50 22 C50 22 52 19 56 19 C63 19 70 25 70 34 C70 43 60 54 50 66 Z"
                    fill="url(#heartGlowAudience)"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <defs>
                    <radialGradient id="sunGlowAudience" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="65%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </radialGradient>
                    <linearGradient id="heartGlowAudience" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="50%" stopColor="#e11d48" />
                      <stop offset="100%" stopColor="#9f1239" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-rose-600 text-[8px] font-black text-white border border-amber-300">
                  ❤️
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-lg sm:text-xl font-black text-amber-100 tracking-tight leading-none">
                    Human-connection · STORSKJERM
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow border border-amber-300/40">
                    Enjoy Bingo · Enjoy Together
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/35 text-emerald-200 border border-emerald-400/50 text-[10px] font-bold uppercase tracking-wider">
                    Runde {roundNumber}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {hostCode && (
                    showCodeOnBigScreen ? (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400/60 text-cyan-200 text-[11px] font-mono font-bold flex items-center gap-1.5">
                        <span>📡 Kode:</span>
                        <span className="text-white font-black tracking-widest">{hostCode}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/20 text-slate-300 text-[11px] font-bold flex items-center gap-1">
                        <span>🔒 Kode skjult</span>
                      </span>
                    )
                  )}
                  {hostDisplayName && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-400/40 text-purple-200 text-[11px] font-bold flex items-center gap-1">
                      <span>🎤 {hostDisplayName}</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 text-[11px] font-black flex items-center gap-1">
                    <span>👥 {players.length + remotePlayers.length} spillere</span>
                  </span>
                </div>
              </div>
            </div>

            <span className="hidden 2xl:block h-8 w-px bg-amber-500/25 shrink-0" aria-hidden="true" />

            {/* View Mode Navigation */}
            <nav
              aria-label="Storskjermvisninger"
              className="flex items-center gap-1 p-1 bg-black/60 border border-amber-500/30 rounded-xl overflow-x-auto no-scrollbar max-w-full shrink-0"
            >
              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('multiplayer_ril');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  viewOption === 'multiplayer_ril'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200/75 hover:text-amber-100'
                }`}
              >
                <span>🏆</span>
                <span>Storskjerm ({players.length + remotePlayers.length})</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('split_show');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewOption === 'split_show'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200/75 hover:text-amber-100'
                }`}
              >
                Big Screen Split
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('flashboard');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewOption === 'flashboard'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200/75 hover:text-amber-100'
                }`}
              >
                75-Flashboard
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('stories');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewOption === 'stories'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200/75 hover:text-amber-100'
                }`}
              >
                Fortellinger
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('leaderboard');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewOption === 'leaderboard'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-amber-200/75 hover:text-amber-100'
                }`}
              >
                Stilling
              </button>
            </nav>
          </div>

          {/* Host Presentation Controls, Music, Fullscreen & Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {canActAsHost && hostCode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  remoteBingo.toggleCodeOnBigScreen(!showCodeOnBigScreen);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow border transition-all whitespace-nowrap ${
                  showCodeOnBigScreen
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100'
                    : 'bg-black/60 border-white/20 text-slate-200 hover:border-amber-400'
                }`}
                title="Deltakerkoden er åpen for alle skjermer som standard (arrangørens private innlogging og fasiter er alltid skjult)"
              >
                <span>{showCodeOnBigScreen ? '📡' : '🔒'}</span>
                <span>{showCodeOnBigScreen ? 'Kode på TV: PÅ' : 'Vis kode'}</span>
              </button>
            )}

            {canActAsHost && hostCode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  const tvUrl = `${window.location.origin}/?tv=1&spill=bingo&kode=${encodeURIComponent(hostCode)}`;
                  navigator.clipboard?.writeText(tvUrl).catch(() => {});
                  setCopiedTvLink(true);
                  setTimeout(() => setCopiedTvLink(false), 2200);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/50 text-purple-100 text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
                title="Kopier ren TV / Prosjektor-lenke uten vertskontroller"
              >
                <span>📺</span>
                <span>{copiedTvLink ? '✓ Kopiert!' : 'TV-lenke'}</span>
              </button>
            )}

            {canActAsHost && hostCode && onOpenTvMode && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenTvMode('bingo', hostCode);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
                title="Åpne ren TV-visning uten vertsknapper"
              >
                <span>🖥️</span>
                <span className="hidden sm:inline">Ren TV</span>
              </button>
            )}

            {canActAsHost && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsAudienceScreenLocked((prev) => {
                    const next = !prev;
                    if (next) setIsAutoCalling(false);
                    return next;
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow border transition-all whitespace-nowrap ${
                  isAudienceScreenLocked
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                    : 'bg-amber-950/80 border-amber-400/50 text-amber-200 hover:border-amber-300'
                }`}
                title="Lås trekning på storskjermen så bare arrangørens styringsenhet kan trekke kuler"
              >
                <span>{isAudienceScreenLocked ? '🔒' : '🔓'}</span>
                <span>{isAudienceScreenLocked ? 'Skjerm Låst' : 'Lås skjerm'}</span>
              </button>
            )}

            {onOpenRemoteBingo && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenRemoteBingo();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-slate-950 text-xs font-black cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
                title="Bytt fritt til Avstandsbingo uten ny betaling eller innlogging"
              >
                <span>📡</span>
                <span>Avstandsbingo</span>
              </button>
            )}

            {/* RIL Pausemusikk for Storskjerm */}
            <RilMusicPlayer variant="compact" />

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
              title="Fullskjerm for prosjektor eller TV"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
              <span>{isFullscreen ? 'Lukk Fullskjerm' : 'Fullskjerm TV'}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 cursor-pointer"
              title="Lukk storskjerm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Fullbrett Bingo Claim Celebration Banner + Audience Roster Bar */}
      <div className="max-w-[1880px] mx-auto w-full mt-3 space-y-2.5">
        {activeClaim && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white shadow-2xl border-2 border-white flex flex-wrap items-center justify-between gap-3 animate-pulse">
            <div className="font-heading font-black text-base sm:text-xl">
              🎉 {activeClaim.isFullHouse ? 'FULLBRETT BINGO FRA' : 'BINGO ROP FRA'}{' '}
              {activeClaim.playerName.toUpperCase()}!{' '}
              {activeClaim.isFullHouse && '· 🔄 Ny runde starter straks!'}
            </div>
            {canActAsHost && onStartNewRound && (
              <button
                type="button"
                onClick={() => {
                  sounds.playLineComplete();
                  onStartNewRound();
                }}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                🔄 Start ny runde nå
              </button>
            )}
          </div>
        )}

        <div className="px-4 py-2.5 rounded-2xl bg-black/55 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>👥</span>
              <span>Deltakere som spiller sammen ({players.length + remotePlayers.length}):</span>
            </span>
            {players.map((p) => (
              <span
                key={`loc-${p.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-100"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.avatarColor }} />
                <span>{p.name}</span>
                {p.linesCompleted > 0 && (
                  <span className="text-[10px] text-amber-300 font-mono">({p.linesCompleted}L)</span>
                )}
              </span>
            ))}
            {remotePlayers.map((rp) => {
              const summary = tvPlayersSummary.find((s) => s.id === rp.id);
              return (
                <span
                  key={`rem-${rp.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-xs font-bold text-cyan-100"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{rp.name}</span>
                  <span className="text-[10px] text-cyan-300">📱</span>
                  {summary && summary.linesCompleted > 0 && (
                    <span className="text-[10px] text-amber-300 font-mono">({summary.linesCompleted}L)</span>
                  )}
                </span>
              );
            })}
          </div>
          {canActAsHost && onStartNewRound && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop(1.1);
                onStartNewRound();
              }}
              className="px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-[11px] font-black cursor-pointer shrink-0"
              title="Start en ny bingorunde for hele salen og alle mobiler (beholder romkode og deltakere)"
            >
              🔄 Ny runde (Runde {roundNumber})
            </button>
          )}
        </div>
      </div>

      {/* VIEW OPTION 0: MULTIPLAYER RIL ON BIG SCREEN — Floating Left Trommel Sidebar + Scrolling Player Cards */}
      {viewOption === 'multiplayer_ril' && (
        <div className="flex-1 max-w-[1880px] mx-auto w-full py-4 flex flex-col md:flex-row items-start gap-5">
          {/* Left Floating Trommel Rail: Stays pinned visibly on the left side while scrolling cards up/down */}
          <aside className="w-full md:w-[390px] lg:w-[420px] xl:w-[445px] shrink-0 md:sticky md:top-3 self-start md:max-h-[calc(100vh-1.5rem)] md:overflow-y-auto no-scrollbar space-y-3 z-20">
            {showBlender ? (
              <BallCageCanvas
                onBallDrawn={() => {
                  if (canDrawInStorskjerm) onDrawNextBall();
                }}
                calledBalls={calledBalls}
                uncalledBalls={uncalledBalls}
                isAutoCalling={canDrawInStorskjerm && isAutoCalling}
                onToggleAuto={() => {
                  if (canDrawInStorskjerm) setIsAutoCalling(!isAutoCalling);
                }}
                onScramble={canDrawInStorskjerm ? onAgitateMix : undefined}
                onRefillDrum={canDrawInStorskjerm ? onRefillDrum : undefined}
                scrambleTrigger={0}
                canDraw={canDrawInStorskjerm}
                readOnlyMessage="🔒 Arrangøren styrer kuletrekningen"
                compactSidebar={true}
              />
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-[#1f1207] to-black/90 border border-amber-400/40 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  {currentBall ? (
                    <div
                      className="w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-xl border-2 border-white shrink-0"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentBall.color} 55%, #0f172a 100%)`,
                      }}
                    >
                      <span className="text-[10px] font-black text-white">{currentBall.letter}</span>
                      <span className="text-xl font-black text-white tabular-nums leading-none">
                        {currentBall.number}
                      </span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl">
                      🎰
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                      {currentBall
                        ? `Siste Kule #${calledBalls.length}/75`
                        : 'Klar til trekk'}
                    </div>
                    <div className="font-heading font-black text-sm text-white leading-snug">
                      {currentBall
                        ? `«${currentBall.affirmation}»`
                        : 'Trykk Trekk Neste Kule for å starte'}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300/75 mt-0.5">
                      {uncalledBalls.length} kuler igjen
                    </div>
                  </div>
                </div>

                {canDrawInStorskjerm && (
                  uncalledBalls.length === 0 && onRefillDrum ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop(1.2);
                        onRefillDrum();
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 hover:brightness-110 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer"
                    >
                      🔄 Bland trommelen på nytt (75 kuler)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onDrawNextBall}
                      disabled={uncalledBalls.length === 0}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-40"
                    >
                      🎲 Trekk Neste Kule
                    </button>
                  )
                )}
              </div>
            )}

            {/* Compact Stage Toolbar below Trommel in Left Rail */}
            <div className="p-2.5 rounded-2xl bg-black/60 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowBlender(!showBlender);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  showBlender
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-black/60 text-amber-200 border-amber-500/40 hover:bg-black/80'
                }`}
              >
                <span>🎛️</span>
                <span>{showBlender ? 'Skjul 3D-trommel' : 'Vis 3D-trommel'}</span>
              </button>

              {recentBalls.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold mr-0.5">
                    Før:
                  </span>
                  {recentBalls.slice(0, 4).map((b, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow border border-white/30"
                      style={{ backgroundColor: b.color }}
                      title={`${b.letter}-${b.number}: ${b.affirmation}`}
                    >
                      {b.number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right Panel: Player Switcher + Storskjerm Cards Grid */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Player Switcher Tabs (Show All vs Individual) */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 flex-wrap max-w-full">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSpotlightPlayerIdx('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    spotlightPlayerIdx === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300'
                      : 'bg-black/50 text-amber-200/80 hover:bg-black/70 border border-amber-500/20'
                  }`}
                >
                  👥 Vis Alle Spillere ({players.length})
                </button>

                {players.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.playClick();
                      setSpotlightPlayerIdx(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      spotlightPlayerIdx === idx
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                        : 'bg-black/50 text-amber-200/80 hover:bg-black/70 border border-amber-500/20'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: p.avatarColor }}
                    />
                    <span>{p.name}</span>
                    {p.hasBingo && <span className="text-xs">🏆</span>}
                    {p.linesCompleted > 0 && !p.hasBingo && (
                      <span className="text-3xs bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                        {p.linesCompleted} L
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-2xs text-amber-300/70 font-medium">
                💡 Tips: Hold over en rute for hele ordet · Trykk for å krysse av
              </div>
            </div>

            {/* Cards Display Grid (Multiple Players Side-by-Side) */}
            <div
              className={`grid gap-4 sm:gap-5 ${
                displayedPlayers.length === 1
                  ? 'max-w-2xl mx-auto w-full'
                  : displayedPlayers.length === 2
                  ? 'grid-cols-1 xl:grid-cols-2'
                  : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'
              }`}
            >
            {displayedPlayers.map((player) => {
              const actualPlayerIdx = players.findIndex((p) => p.id === player.id);
              const card = player.cards[player.activeCardIndex || 0] || player.cards[0];
              if (!card) return null;

              return (
                <div
                  key={player.id}
                  className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-2xl flex flex-col justify-between ${
                    player.hasBingo
                      ? 'bg-gradient-to-b from-amber-500/25 via-amber-950/40 to-black border-amber-400 ring-4 ring-amber-300/50'
                      : 'bg-gradient-to-b from-amber-950/40 via-[#180e07] to-black border-amber-500/30'
                  }`}
                >
                  {/* Player Card Header */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/20 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {actualPlayerIdx + 1}
                      </div>
                      <div>
                        <div className="font-heading font-black text-base text-amber-100 flex items-center gap-2">
                          <span>{player.name}</span>
                          {player.hasBingo && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-3xs font-black animate-pulse">
                              BINGO! 🏆
                            </span>
                          )}
                        </div>
                        <div className="text-2xs text-amber-300/70">
                          {player.cards.length > 1
                            ? `Kort ${(player.activeCardIndex || 0) + 1} av ${player.cards.length}`
                            : 'RIL Bingobrett'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-amber-300 tabular-nums">
                        {player.linesCompleted} {player.linesCompleted === 1 ? 'linje' : 'linjer'}
                      </div>
                      <div className="text-3xs uppercase tracking-wider text-amber-200/60 font-semibold">
                        Fullført
                      </div>
                    </div>
                  </div>

                  {/* 5x5 Bingo Board */}
                  <div className="flex-1 flex flex-col">
                    {/* B-I-N-G-O Headers */}
                    <div className="grid grid-cols-5 gap-1.5 mb-1.5 text-center">
                      {[
                        { letter: 'B', color: '#0284c7' },
                        { letter: 'I', color: '#7c3aed' },
                        { letter: 'N', color: '#059669' },
                        { letter: 'G', color: '#d97706' },
                        { letter: 'O', color: '#e11d48' },
                      ].map((h) => (
                        <div
                          key={h.letter}
                          className="py-1 rounded-lg text-white font-black text-xs shadow-sm"
                          style={{ backgroundColor: h.color }}
                        >
                          {h.letter}
                        </div>
                      ))}
                    </div>

                    {/* 5 Rows of Cells */}
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {card.map((row, rIdx) =>
                        row.map((cell, cIdx) => {
                          return (
                            <div
                              key={cell.id || `${rIdx}-${cIdx}`}
                              role="button"
                              tabIndex={0}
                              title={`${cell.letter ? `${cell.letter}-` : ''}${cell.number ?? ''}: ${cell.text}`}
                              onClick={() => {
                                if (onToggleCell && !cell.isFreeSpace) {
                                  sounds.playClick();
                                  onToggleCell(actualPlayerIdx, player.activeCardIndex || 0, rIdx, cIdx);
                                }
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && onToggleCell && !cell.isFreeSpace) {
                                  e.preventDefault();
                                  sounds.playClick();
                                  onToggleCell(actualPlayerIdx, player.activeCardIndex || 0, rIdx, cIdx);
                                }
                              }}
                              className={`aspect-square p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between items-center text-center transition-all cursor-pointer select-none relative overflow-hidden group ${
                                cell.isFreeSpace
                                  ? 'bg-gradient-to-br from-amber-400/30 to-amber-600/30 border-amber-400 text-amber-200'
                                  : cell.isMarked
                                  ? 'bg-gradient-to-br from-emerald-600/50 via-amber-500/40 to-emerald-700/50 border-emerald-400 shadow-md ring-1 ring-emerald-300/40'
                                  : 'bg-black/45 border-amber-500/20 text-amber-200/80 hover:bg-black/60 hover:border-amber-400/50'
                              }`}
                            >
                              {/* Number Badge or Free Space */}
                              <div className="w-full flex items-center justify-between text-3xs font-extrabold">
                                {cell.isFreeSpace ? (
                                  <span className="w-full text-center text-amber-300 font-black">
                                    ★ FRI ★
                                  </span>
                                ) : (
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-black tabular-nums ${
                                      cell.isMarked
                                        ? 'bg-emerald-400 text-slate-950'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {cell.letter ? `${cell.letter}-` : ''}
                                    {cell.number || ''}
                                  </span>
                                )}
                              </div>

                              {/* Prompt Text / Story */}
                              <div className="my-auto w-full px-0.5">
                                {cell.isFreeSpace ? (
                                  <div className="text-[10px] sm:text-xs font-black text-amber-200 uppercase tracking-wide leading-tight">
                                    RIL Livsglede ❤️
                                  </div>
                                ) : (
                                  <div
                                    className={`text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-3 text-left ${
                                      cell.isMarked
                                        ? 'text-white font-bold'
                                        : 'text-amber-100/90'
                                    }`}
                                  >
                                    {cell.text}
                                  </div>
                                )}
                              </div>

                              {/* Stamp / Daub Mark */}
                              {cell.isMarked && !cell.isFreeSpace && (
                                <div className="w-full flex items-center justify-between text-[8px] text-emerald-200 font-extrabold pt-0.5 border-t border-emerald-400/30">
                                  <span>❤️ Krysset</span>
                                  {cell.markedBy && (
                                    <span className="truncate max-w-[50px]">{cell.markedBy}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW OPTION 1: SPLIT SHOW (Big Current Ball + Master Flashboard + Recent Stories) */}
      {viewOption === 'split_show' && (
        <div className="flex-1 max-w-[1880px] mx-auto w-full py-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sticky 3D Drum Blender Cage & Host Draw Action */}
          <div className="md:col-span-5 md:sticky md:top-3 self-start md:max-h-[calc(100vh-1.5rem)] md:overflow-y-auto no-scrollbar flex flex-col items-center gap-3 z-20">
            {/* 3D Ball Cage Tumbler Drum */}
            <div className="w-full">
              <BallCageCanvas
                onBallDrawn={canDrawInStorskjerm ? onDrawNextBall : undefined}
                calledBalls={calledBalls}
                uncalledBalls={uncalledBalls}
                isAutoCalling={canDrawInStorskjerm && isAutoCalling}
                onToggleAuto={() => {
                  if (canDrawInStorskjerm) setIsAutoCalling(!isAutoCalling);
                }}
                onScramble={canDrawInStorskjerm ? onAgitateMix : undefined}
                onRefillDrum={canDrawInStorskjerm ? onRefillDrum : undefined}
                canDraw={canDrawInStorskjerm}
                compactSidebar={true}
              />
            </div>

            {recentBalls.length > 0 && (
              <div className="w-full p-3 rounded-2xl bg-black/55 border border-amber-400/30 flex items-center justify-center gap-2">
                <span className="text-3xs uppercase tracking-wider text-amber-400/70 font-semibold">
                  Forrige:
                </span>
                {recentBalls.map((b, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-2xs shadow border border-white/40"
                    style={{ backgroundColor: b.color }}
                    title={`${b.letter}-${b.number}: ${b.affirmation}`}
                  >
                    {b.number}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Master 75-Ball Flashboard */}
          <div className="md:col-span-7 flex flex-col p-6 rounded-3xl bg-amber-950/30 border border-amber-500/25">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/15">
              <h2 className="font-heading font-bold text-base text-amber-200">
                Audience Master Flashboard (1–75)
              </h2>
              <span className="text-2xs font-mono text-amber-400">
                {calledBalls.length} Trukket / 75 Totalt
              </span>
            </div>

            {/* 5 Row Flashboard: B, I, N, G, O */}
            <div className="space-y-2">
              {[
                { letter: 'B', color: '#0284c7', min: 1, max: 15 },
                { letter: 'I', color: '#7c3aed', min: 16, max: 30 },
                { letter: 'N', color: '#059669', min: 31, max: 45 },
                { letter: 'G', color: '#d97706', min: 46, max: 60 },
                { letter: 'O', color: '#e11d48', min: 61, max: 75 },
              ].map((row) => (
                <div key={row.letter} className="flex items-center gap-1.5">
                  {/* Letter Header */}
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-base shrink-0 shadow"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.letter}
                  </div>

                  {/* Numbers in range */}
                  <div className="grid grid-cols-15 gap-1 flex-1">
                    {Array.from({ length: 15 }, (_, i) => row.min + i).map((num) => {
                      const called = isNumberCalled(num);
                      const isLatest = currentBall?.number === num;
                      return (
                        <div
                          key={num}
                          className={`aspect-square rounded-md flex items-center justify-center font-bold tabular-nums text-2xs sm:text-xs transition-all ${
                            isLatest
                              ? 'bg-amber-300 text-slate-950 ring-2 ring-white scale-110 shadow-lg font-black'
                              : called
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'bg-black/40 text-amber-400/25 border border-amber-500/10'
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

            {/* Recent Stories Snippet below flashboard */}
            {allStories.length > 0 && (
              <div className="mt-5 pt-3 border-t border-amber-500/15">
                <span className="text-2xs uppercase tracking-wider text-amber-300/70 font-semibold block mb-2">
                  Direkte Fortellinger og Koblinger fra Salen:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allStories.slice(-4).map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs shrink-0 max-w-xs"
                    >
                      <div className="font-semibold text-amber-200 truncate">{s.text}</div>
                      <div className="text-3xs text-amber-300/80 mt-0.5">
                        {s.player} {s.partner ? `sammen med ${s.partner}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW OPTION 2: FULL FLASHBOARD ONLY (Huge numbers for high visibility) */}
      {viewOption === 'flashboard' && (
        <div className="flex-1 max-w-[1880px] mx-auto w-full py-5 flex flex-col justify-center">
          <div className="p-6 sm:p-10 rounded-3xl bg-amber-950/40 border-2 border-amber-400/40 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-500/20">
              <div>
                <h2 className="font-display text-2xl sm:text-4xl font-black text-amber-200">
                  Full 75-Ball Flashboard
                </h2>
                <p className="text-xs text-amber-300/70">
                  Alle trukkede kuler lyser opp i gyldent. Tall 1 til 75.
                </p>
              </div>

              {currentBall && (
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-amber-400/50">
                  <span className="text-xs uppercase tracking-wider text-amber-300/80 font-semibold">
                    Siste Kule:
                  </span>
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shadow"
                    style={{ backgroundColor: currentBall.color }}
                  >
                    {currentBall.number}
                  </span>
                  <span className="font-heading font-bold text-amber-200 text-sm hidden sm:inline">
                    {currentBall.letter}-{currentBall.number} ({currentBall.affirmation})
                  </span>
                </div>
              )}
            </div>

            {/* Big Flashboard Rows */}
            <div className="space-y-4">
              {[
                { letter: 'B', color: '#0284c7', min: 1, max: 15 },
                { letter: 'I', color: '#7c3aed', min: 16, max: 30 },
                { letter: 'N', color: '#059669', min: 31, max: 45 },
                { letter: 'G', color: '#d97706', min: 46, max: 60 },
                { letter: 'O', color: '#e11d48', min: 61, max: 75 },
              ].map((row) => (
                <div key={row.letter} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shrink-0"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.letter}
                  </div>

                  <div className="grid grid-cols-15 gap-1 sm:gap-2 flex-1">
                    {Array.from({ length: 15 }, (_, i) => row.min + i).map((num) => {
                      const called = isNumberCalled(num);
                      const isLatest = currentBall?.number === num;
                      return (
                        <div
                          key={num}
                          className={`aspect-square rounded-lg flex items-center justify-center font-black tabular-nums text-xs sm:text-lg transition-all ${
                            isLatest
                              ? 'bg-amber-300 text-slate-950 ring-4 ring-white scale-110 shadow-2xl z-10'
                              : called
                              ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                              : 'bg-black/50 text-amber-400/20 border border-amber-500/15'
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

            <div className="mt-8 flex justify-center">
              {canDrawInStorskjerm ? (
                <button
                  onClick={onDrawNextBall}
                  disabled={uncalledBalls.length === 0}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Trekk Neste Kule</span>
                  <span>🎲</span>
                </button>
              ) : (
                <div className="px-6 py-3 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 font-bold text-xs sm:text-sm">
                  🔒 Arrangøren styrer kuletrekningen
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW OPTION 3: JOY STORIES STREAM */}
      {viewOption === 'stories' && (
        <div className="flex-1 max-w-[1880px] mx-auto w-full py-5">
          <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/30">
            <h2 className="font-display text-2xl font-bold text-amber-200 mb-1">
              Gledeshistorier og Mellommenneskelige Koblinger
            </h2>
            <p className="text-xs text-amber-300/70 mb-4">
              Levende samling av hjertevarme relasjoner registrert av spillerne under spillet
            </p>

            {allStories.length === 0 ? (
              <div className="py-16 text-center text-amber-300/50 text-sm">
                Ingen historier er registrert ennå. Spillere legger til historier ved å trykke på rutene på bingobrettet!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allStories.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 text-xs space-y-1"
                  >
                    <div className="font-bold text-amber-300 text-sm">{s.text}</div>
                    {s.partner && (
                      <div className="text-amber-200 font-semibold">
                        {s.player} sammen med <strong className="text-white">{s.partner}</strong>
                      </div>
                    )}
                    {s.note && (
                      <div className="text-amber-100/80 italic mt-1">&ldquo;{s.note}&rdquo;</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW OPTION 4: AUDIENCE LEADERBOARD & WINNERS STAND */}
      {viewOption === 'leaderboard' && (
        <div className="flex-1 max-w-[1600px] mx-auto w-full py-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-950/40 border border-amber-500/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-amber-200 mb-1">
                  Spilloversikt & Stilling ({players.length + remotePlayers.length} spillere)
                </h2>
                <p className="text-xs text-amber-300/70">
                  Alle som deltar sammen i Runde {roundNumber} (lokale brett + mobildeltakere)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black">
                Runde {roundNumber}
              </span>
            </div>

            <div className="space-y-3">
              {[
                ...players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  avatarColor: p.avatarColor,
                  linesCompleted: p.linesCompleted,
                  hasBingo: p.hasBingo,
                  subtitle: `${p.cards.length} Kort i spill`,
                })),
                ...remotePlayers.map((rp) => {
                  const summary = tvPlayersSummary.find((s) => s.id === rp.id);
                  return {
                    id: rp.id,
                    name: rp.name,
                    avatarColor: rp.color || '#06b6d4',
                    linesCompleted: summary?.linesCompleted || 0,
                    hasBingo: Boolean(summary?.hasBingo),
                    subtitle: 'Tilkoblet på mobil/nett 📱',
                  };
                }),
              ]
                .sort((a, b) => {
                  if (a.hasBingo !== b.hasBingo) return a.hasBingo ? -1 : 1;
                  return b.linesCompleted - a.linesCompleted;
                })
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      p.hasBingo
                        ? 'bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-transparent border-amber-400 ring-2 ring-amber-300 shadow-xl'
                        : 'bg-black/40 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shadow"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base text-amber-100 flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.hasBingo && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-2xs font-black">
                              BINGO VINNER 🏆
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-300/60 font-medium">
                          {p.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xl font-black text-amber-300 tabular-nums">
                          {p.linesCompleted}
                        </div>
                        <div className="text-3xs uppercase tracking-wider text-amber-200/60">
                          Linjer
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
