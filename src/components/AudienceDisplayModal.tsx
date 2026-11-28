/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CalledBall, Player, BingoTheme } from '../types/bingo';
import { sounds } from '../audio/soundEngine';
import { BallCageCanvas } from './BallCageCanvas';
import { RilMusicPlayer } from './RilMusicPlayer';
import { LanguageSelector } from './LanguageSelector';
import { authService } from '../services/authService';
import { sessionTimer } from '../services/sessionTimer';
import { ownerControl } from '../services/ownerControl';
import { remoteBingo, RemoteParticipant, RemoteBingoClaim, BingoTvPlayerSummary } from '../services/remoteBingo';
import { QuizEdition } from '../data/quizQuestions';
import { MUSIC_BINGO_SONGS, MusicBingoSong } from '../data/musicBingoSongs';
import { musicBingoService, MusicBingoSnapshot } from '../services/musicBingoService';
import { musicClipPlayer, MusicClipPlayerState } from '../services/musicClipPlayer';
import { SupportedLanguage, useTranslation } from '../services/i18n';
import { formatMilestoneLabel, getBingoUiTexts, localizeBingoPattern } from '../services/bingoUiI18n';
import { getAudienceExtraTexts } from '../services/audienceExtraI18n';

export type AudienceViewOption =
  | 'multiplayer_ril'
  | 'music_bingo'
  | 'split_show'
  | 'flashboard'
  | 'stories'
  | 'leaderboard';

interface AudienceDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  calledBalls: CalledBall[];
  uncalledBalls: CalledBall[];
  onDrawNextBall: (ball?: CalledBall) => void;
  players: Player[];
  roomName?: string;
  activeTheme?: BingoTheme;
  onToggleCell?: (playerIdx: number, cardIdx: number, row: number, col: number) => void;
  onAgitateMix?: () => void;
  onOpenRemoteBingo?: () => void;
  onOpenTvMode?: (game: 'bingo' | 'quiz', code: string) => void;
  onOpenQuiz?: (edition?: QuizEdition, tab?: 'host' | 'big_screen' | 'team_play' | 'join') => void;
  onOpenPrintCards?: (mode?: 'music_bingo' | 'numbers' | 'both' | 'prompts', count?: number) => void;
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
  onOpenQuiz,
  onOpenPrintCards,
  onStartNewRound,
  onRefillDrum,
  canControlDraw = true,
}) => {
  const [viewOption, setViewOption] = useState<AudienceViewOption>('multiplayer_ril');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
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
  const [storskjermJoinNotice, setStorskjermJoinNotice] = useState<string | null>(null);
  const [copiedTvLink, setCopiedTvLink] = useState<boolean>(false);

  // Music Bingo (Eldre / Stor sal 50+ / Videosamtale) state
  const [musicSnap, setMusicSnap] = useState<MusicBingoSnapshot>(() => musicBingoService.getSnapshot());
  const [musicClipDuration, setMusicClipDuration] = useState<number>(30);
  const [musicRemainingSec, setMusicRemainingSec] = useState<number>(0);
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);
  const ax = getAudienceExtraTexts(lang);
  const langRef = useRef<SupportedLanguage>(lang);
  langRef.current = lang;

  const [musicSearch, setMusicSearch] = useState<string>('');
  const [musicCategoryFilter, setMusicCategoryFilter] = useState<string>('ALL');
  const [hideMusicTitleUntilReveal, setHideMusicTitleUntilReveal] = useState<boolean>(true);
  const [copiedMusicJoinLink, setCopiedMusicJoinLink] = useState<boolean>(false);
  const [clipPlayer, setClipPlayer] = useState<MusicClipPlayerState>(() => musicClipPlayer.getState());
  const [bulkMatchMessage, setBulkMatchMessage] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);
  const singleSongFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUploadSongIdRef = useRef<string | null>(null);

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
    const unsubJoin = remoteBingo.onParticipantJoined((p, total) => {
      sounds.playPop(1.25);
      const curUi = getBingoUiTexts(langRef.current);
      const curAx = getAudienceExtraTexts(langRef.current);
      setStorskjermJoinNotice(
        `👋 ${curUi.participantJoinedRoom.replace('{name}', p.name)} (${total} ${curAx.joinConnectedSuffix})`
      );
      window.setTimeout(() => setStorskjermJoinNotice(null), 5500);
    });
    const unsubNewRound = remoteBingo.onNewRound(() => {
      setActiveClaim(null);
      setRoundNumber(remoteBingo.getRoundNumber());
    });
    const unsubMusic = musicBingoService.subscribe(() => {
      setMusicSnap(musicBingoService.getSnapshot());
    });
    const unsubMusicClaim = musicBingoService.onClaim(() => {
      sounds.playLineComplete();
    });
    const unsubMusicNewRound = musicBingoService.onNewRound(() => {
      musicClipPlayer.stop();
      setActiveClaim(null);
    });
    const unsubClip = musicClipPlayer.subscribe(() => {
      setClipPlayer(musicClipPlayer.getState());
    });
    return () => {
      unsub();
      unsubClaim();
      unsubJoin();
      unsubNewRound();
      unsubMusic();
      unsubMusicClaim();
      unsubMusicNewRound();
      unsubClip();
    };
  }, []);

  useEffect(() => {
    if (!isOpen || viewOption !== 'music_bingo') {
      musicClipPlayer.stop();
      return;
    }
    if (canActAsHost && !musicSnap.isActive) {
      musicBingoService.ensureHostActive(hostDisplayName);
    }
    const tick = () => {
      setMusicRemainingSec(musicBingoService.getRemainingClipSeconds());
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [isOpen, viewOption, canActAsHost, hostDisplayName, musicSnap.isActive, musicSnap.clipStartedAt, musicSnap.clipDurationSec]);

  useEffect(() => {
    if (isOpen && canActAsHost) {
      const totalCount = players.length + remotePlayers.length;
      remoteBingo.syncTvStateToRoom({
        calledBalls,
        players,
        themeTitle: `${ax.tvThemePrefix} (${totalCount} ${ui.players} · ${ui.round} ${roundNumber})`,
      });
    }
  }, [isOpen, canActAsHost, calledBalls, players, remotePlayers.length, roundNumber, ax.tvThemePrefix, ui.players, ui.round]);

  if (!isOpen) return null;

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#140c06] border-2 border-amber-500/50 text-center space-y-4 shadow-2xl text-amber-50 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="font-heading font-black text-xl text-amber-200">
            {ui.audienceLockedTitle}
          </h2>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            {ui.audienceLockedDesc}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow hover:brightness-110"
            >
              ⇦ {ui.backToStart}
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
                    {ax.brandTitle}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow border border-amber-300/40">
                    Enjoy Bingo · Enjoy Together
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/35 text-emerald-200 border border-emerald-400/50 text-[10px] font-bold uppercase tracking-wider">
                    {ui.round} {roundNumber}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {hostCode && (
                    showCodeOnBigScreen ? (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400/60 text-cyan-200 text-[11px] font-mono font-bold flex items-center gap-1.5">
                        <span>📡 {ui.code}:</span>
                        <span className="text-white font-black tracking-widest">{hostCode}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/20 text-slate-300 text-[11px] font-bold flex items-center gap-1">
                        <span>🔒 {ui.codeHidden}</span>
                      </span>
                    )
                  )}
                  {hostDisplayName && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-400/40 text-purple-200 text-[11px] font-bold flex items-center gap-1">
                      <span>🎤 {hostDisplayName}</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 text-[11px] font-black flex items-center gap-1">
                    <span>👥 {players.length + remotePlayers.length} {ui.players}</span>
                  </span>
                </div>
              </div>
            </div>

            <span className="hidden 2xl:block h-8 w-px bg-amber-500/25 shrink-0" aria-hidden="true" />

            {/* View Mode Navigation */}
            <nav
              aria-label={ax.navAriaLabel}
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
                <span>{ui.audienceTabMain} ({players.length + remotePlayers.length})</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setViewOption('music_bingo');
                  if (canActAsHost) {
                    musicBingoService.ensureHostActive(hostDisplayName);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  viewOption === 'music_bingo'
                    ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 shadow-md font-black'
                    : 'text-rose-200 hover:text-white bg-rose-500/15 border border-rose-400/35'
                }`}
              >
                <span>🎵</span>
                <span>{ui.audienceTabMusic}</span>
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
                {ui.audienceTabSplit}
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
                {ui.audienceTabFlashboard}
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
                {ui.audienceTabStories}
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
                {ui.audienceTabLeaderboard}
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
                title={ax.showCodeTitle}
              >
                <span>{showCodeOnBigScreen ? '📡' : '🔒'}</span>
                <span>{showCodeOnBigScreen ? ui.audienceCodeOnTvOn : ui.audienceShowCode}</span>
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
                title={ax.tvLinkTitle}
              >
                <span>📺</span>
                <span>{copiedTvLink ? `✓ ${ui.copied}` : ui.audienceTvLink}</span>
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
                title={ax.cleanTvTitle}
              >
                <span>🖥️</span>
                <span className="hidden sm:inline">{ui.audienceCleanTv}</span>
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
                title={ax.lockScreenTitle}
              >
                <span>{isAudienceScreenLocked ? '🔒' : '🔓'}</span>
                <span>{isAudienceScreenLocked ? ui.audienceScreenLocked : ui.audienceLockScreen}</span>
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
                title={ax.remoteBingoTitle}
              >
                <span>📡</span>
                <span>{ax.remoteBingoBtn}</span>
              </button>
            )}

            {onOpenQuiz && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenQuiz('senior', canActAsHost ? 'host' : 'join');
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-emerald-400 hover:brightness-110 text-slate-950 text-xs font-black cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
                title={ax.seniorQuizTitle}
              >
                <span>👵🎵</span>
                <span>{ax.seniorQuizBtn}</span>
              </button>
            )}

            <LanguageSelector variant="compact" />

            <button
              type="button"
              onClick={() => {
                const m = sounds.toggleMute();
                setIsMuted(m);
              }}
              aria-label={isMuted ? ui.unmuteSound : ui.muteSound}
              title={isMuted ? ui.unmuteSound : ui.muteSound}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-bold cursor-pointer shadow whitespace-nowrap"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* RIL Pausemusikk for Storskjerm */}
            <RilMusicPlayer variant="compact" />

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
              title={ax.fullscreenTitle}
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
              <span>{isFullscreen ? ui.exitFullscreen : ui.fullscreen}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 cursor-pointer"
              title={ax.closeBigScreenTitle}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Fullbrett Bingo Claim Celebration Banner + Join Notice + Audience Roster Bar */}
      <div className="max-w-[1880px] mx-auto w-full mt-3 space-y-2.5">
        {storskjermJoinNotice && (
          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-teal-500/25 to-cyan-500/25 border border-emerald-400 text-emerald-100 text-xs sm:text-sm font-black flex items-center justify-between gap-2 shadow-lg">
            <span>{storskjermJoinNotice}</span>
            <button
              type="button"
              onClick={() => setStorskjermJoinNotice(null)}
              className="text-emerald-200 hover:text-white font-black cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {activeClaim && (() => {
          const tier =
            activeClaim.milestone ||
            (activeClaim.isFullHouse || /fullbrett|fullt?\s*brett/i.test(activeClaim.pattern)
              ? 'fullbrett'
              : /3\s*\.?\s*rekke/i.test(activeClaim.pattern)
              ? 'line3'
              : 'line1');
          const tierText = formatMilestoneLabel(tier, lang).toUpperCase();
          const nextText =
            tier === 'fullbrett'
              ? `🔄 ${ui.newRoundStartsSoon}`
              : tier === 'line3'
              ? `➡️ ${ui.continuesToFullbrett}`
              : `➡️ ${ui.continuesToLine3}`;
          return (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white shadow-2xl border-2 border-white flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-heading font-black text-base sm:text-xl">
                  🏆 {activeClaim.playerName.toUpperCase()} {ui.shoutedBannerPrefix} {tierText} {ui.shoutedBannerMid} {ui.shoutedBannerSuffix}
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-50">
                  {nextText}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canActAsHost && onStartNewRound && activeClaim.isFullHouse && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playLineComplete();
                      onStartNewRound();
                    }}
                    className="px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs cursor-pointer shadow"
                  >
                    🔄 {ui.claimModalStartNewRoundNow}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveClaim(null)}
                  className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white font-black text-xs cursor-pointer"
                >
                  {ui.ok}
                </button>
              </div>
            </div>
          );
        })()}

        <div className="px-4 py-2.5 rounded-2xl bg-black/55 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>👥</span>
              <span>{ui.audienceParticipantsBar} ({players.length + remotePlayers.length}):</span>
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
              title={ax.newRoundBtnTitle}
            >
              🔄 {ui.audienceNewRoundBtn} ({ui.round} {roundNumber})
            </button>
          )}
        </div>
      </div>

      {/* VIEW OPTION: DIGITAL MUSIKKBINGO FOR ELDRE & STOR SAL (50+ PERSONER / VIDEOSAMTALE) */}
      {viewOption === 'music_bingo' && (() => {
        const currentSong: MusicBingoSong | null = musicBingoService.getSongById(musicSnap.currentSongId);
        const playedSongs: MusicBingoSong[] = [...musicSnap.playedSongIds]
          .reverse()
          .map((id) => MUSIC_BINGO_SONGS.find((s) => s.id === id))
          .filter((s): s is MusicBingoSong => Boolean(s));
        const categories = ['ALL', ...Array.from(new Set(MUSIC_BINGO_SONGS.map((s) => s.category)))];
        const searchLower = musicSearch.trim().toLowerCase();
        const filteredDeck = MUSIC_BINGO_SONGS.filter((s) => {
          if (musicCategoryFilter !== 'ALL' && s.category !== musicCategoryFilter) return false;
          if (!searchLower) return true;
          return (
            s.title.toLowerCase().includes(searchLower) ||
            s.artist.toLowerCase().includes(searchLower) ||
            s.decade.toLowerCase().includes(searchLower)
          );
        });
        const activeClipMaxSec = musicSnap.clipDurationSec || musicClipDuration;
        const clipProgressPct =
          activeClipMaxSec > 0 && musicSnap.clipStartedAt > 0
            ? Math.max(0, Math.min(100, (musicRemainingSec / activeClipMaxSec) * 100))
            : 0;
        const effectiveRoomCode = musicSnap.roomCode || hostCode || '';

        return (
          <div className="flex-1 max-w-[1880px] mx-auto w-full py-4 flex flex-col lg:flex-row items-start gap-5">
            {/* LEFT COLUMN: Host Song Console, Spotify Clips, Clip Timer & Video/Hall Guide */}
            <aside className="w-full lg:w-[440px] xl:w-[470px] shrink-0 space-y-3.5">
              {/* Video Call & 50+ Hall Setup Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#28150c] via-[#1a0f08] to-black/90 border-2 border-amber-400/50 space-y-3 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                      🎵 {ui.musicTitle} · {ui.round} {musicSnap.roundNumber}
                    </div>
                    <h2 className="font-heading font-black text-base sm:text-lg text-white">
                      {ui.audienceMusicHallCardTitle}
                    </h2>
                  </div>
                  {effectiveRoomCode && (
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-400/60 text-cyan-200 font-mono font-black text-xs shrink-0">
                      {ui.code}: {effectiveRoomCode}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-black/55 border border-amber-500/25 text-xs text-amber-100/90 space-y-1.5 leading-relaxed">
                  <div>
                    🔊 <strong>{ax.musicHallGuideSpeakers}</strong> {ax.musicHallGuideSpeakersDesc}
                  </div>
                  <div>
                    💻 <strong>{ax.musicHallGuideVideo}</strong> {ax.musicHallGuideVideoDesc}
                  </div>
                </div>

                {/* Quick Hall Actions: Print 50-100 Cards & Copy Digital Board Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {onOpenPrintCards && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onOpenPrintCards('music_bingo', 50);
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-amber-100 text-slate-950 font-black text-xs cursor-pointer shadow flex items-center justify-center gap-1.5"
                    >
                      <span>🖨️</span>
                      <span>{ui.audiencePrint50Btn}</span>
                    </button>
                  )}

                  {effectiveRoomCode && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        const shareUrl = `${window.location.origin}/?spill=bingo&kode=${encodeURIComponent(effectiveRoomCode)}`;
                        navigator.clipboard?.writeText(shareUrl).catch(() => {});
                        setCopiedMusicJoinLink(true);
                        setTimeout(() => setCopiedMusicJoinLink(false), 2200);
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/60 text-cyan-100 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📱</span>
                      <span>{copiedMusicJoinLink ? `✓ ${ui.copiedLink}` : ui.audienceMusicLinkBtn}</span>
                    </button>
                  )}
                </div>

                {onOpenQuiz && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      onOpenQuiz('senior', canActAsHost ? 'host' : 'join');
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400/20 to-emerald-400/20 hover:from-amber-400/30 hover:to-emerald-400/30 border border-amber-400/50 text-amber-100 font-black text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>👵🎵</span>
                    <span>{ax.musicSeniorQuizBtn}</span>
                    <span>➔</span>
                  </button>
                )}
              </div>

              {/* Hidden File Inputs for Host-Managed Audio Clips */}
              {canActAsHost && (
                <>
                  <input
                    ref={singleSongFileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      const targetId = pendingUploadSongIdRef.current;
                      e.target.value = '';
                      if (!file || !targetId) return;
                      await musicClipPlayer.saveSongAudioFile(targetId, file);
                      const targetSong = MUSIC_BINGO_SONGS.find((s) => s.id === targetId);
                      if (targetSong && musicSnap.currentSongId === targetId) {
                        void musicClipPlayer.playSongClip(targetSong, musicClipDuration);
                      }
                    }}
                  />
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const res = await musicClipPlayer.bulkMatchAudioFiles(files);
                      e.target.value = '';
                      if (res.matched.length > 0) {
                        setBulkMatchMessage(
                          `${ax.bulkMatchPrefix} ${res.matched.length} ${ax.bulkMatchSuffix}${
                            res.unmatched.length > 0 ? ` (${res.unmatched.length} ${ax.bulkMatchUnmatchedSuffix})` : ''
                          }`
                        );
                      } else {
                        setBulkMatchMessage(ax.bulkMatchNone);
                      }
                      setTimeout(() => setBulkMatchMessage(null), 6500);
                    }}
                  />
                </>
              )}

              {/* Host Playback & Clip Timer Controls */}
              {canActAsHost && (
                <div className="p-4 rounded-2xl bg-black/65 border border-amber-500/35 space-y-3 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop(1.1);
                      const picked = musicBingoService.drawRandomNextSong(!hideMusicTitleUntilReveal, musicClipDuration);
                      if (picked) {
                        void musicClipPlayer.playSongClip(picked, musicClipDuration);
                      }
                    }}
                    disabled={musicSnap.playedSongIds.length >= MUSIC_BINGO_SONGS.length}
                    className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-sm cursor-pointer shadow-lg disabled:opacity-45 flex items-center justify-center gap-2"
                  >
                    <span>🎲</span>
                    <span>
                      {ui.audienceDrawRandomSong} ({MUSIC_BINGO_SONGS.length - musicSnap.playedSongIds.length} {ax.musicDrawLeftOf} {MUSIC_BINGO_SONGS.length})
                    </span>
                  </button>

                  {currentSong && (() => {
                    const isThisPlaying = clipPlayer.currentSongId === currentSong.id && clipPlayer.isPlaying;
                    const isThisLoading = clipPlayer.currentSongId === currentSong.id && clipPlayer.isLoading;
                    const customClip = clipPlayer.customClips[currentSong.id];
                    const audioPct =
                      clipPlayer.durationSec > 0
                        ? Math.min(100, Math.max(0, (clipPlayer.currentTimeSec / clipPlayer.durationSec) * 100))
                        : 0;
                    const fmtSec = (s: number) => {
                      const whole = Math.max(0, Math.floor(s));
                      return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
                    };

                    return (
                      <div className="p-3 rounded-2xl bg-emerald-950/35 border border-emerald-400/50 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isThisPlaying) {
                                musicClipPlayer.togglePlayPause();
                              } else {
                                if (musicRemainingSec <= 0) {
                                  musicBingoService.startClipTimer(musicClipDuration);
                                }
                                void musicClipPlayer.playSongClip(currentSong, musicClipDuration);
                              }
                            }}
                            disabled={isThisLoading}
                            className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-black text-xs sm:text-sm shadow cursor-pointer flex items-center justify-center gap-2 transition-all ${
                              isThisPlaying
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                            }`}
                          >
                            <span>{isThisLoading ? '⏳' : isThisPlaying ? '⏸️' : '▶️'}</span>
                            <span className="truncate">
                              {isThisLoading
                                ? ax.loadingClip
                                : isThisPlaying
                                ? `${ax.pauseClipPrefix} «${currentSong.title}»`
                                : `${ax.playClipPrefix} «${currentSong.title}»`}
                            </span>
                          </button>

                          {(isThisPlaying || clipPlayer.currentSongId === currentSong.id) && clipPlayer.currentTimeSec > 0 && (
                            <button
                              type="button"
                              onClick={() => musicClipPlayer.stop()}
                              className="min-h-[44px] px-3 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/50 text-rose-100 font-black text-xs cursor-pointer"
                              title={ax.stopPlaybackTitle}
                            >
                              ⏹️ {ui.audienceStopClip}
                            </button>
                          )}
                        </div>

                            {/* Progress + Volume */}
                        {clipPlayer.currentSongId === currentSong.id && clipPlayer.durationSec > 0 && (
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={Math.max(1, Math.floor(clipPlayer.durationSec))}
                              value={Math.floor(clipPlayer.currentTimeSec)}
                              onChange={(e) => musicClipPlayer.seekTo(Number(e.target.value))}
                              className="w-full accent-emerald-400 cursor-pointer h-1.5"
                              aria-label={ax.seekClipAria}
                            />
                            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-200/90">
                              <span>{clipPlayer.sourceLabel || ax.clipDefaultLabel}</span>
                              <span>
                                {fmtSec(clipPlayer.currentTimeSec)} / {fmtSec(clipPlayer.durationSec)} ({Math.round(audioPct)}%)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Volume & Organizer Custom Audio File Management */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span>🔊</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={Math.round(clipPlayer.volume * 100)}
                              onChange={(e) => musicClipPlayer.setVolume(Number(e.target.value) / 100)}
                              className="w-20 accent-amber-400 cursor-pointer h-1.5"
                              title={`${ax.volumeLabel} ${Math.round(clipPlayer.volume * 100)}%`}
                            />
                            <span className="text-[11px] font-mono text-amber-200/80 w-8">
                              {Math.round(clipPlayer.volume * 100)}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                pendingUploadSongIdRef.current = currentSong.id;
                                singleSongFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-bold text-amber-100 cursor-pointer"
                              title={ax.uploadSongAudioTitle}
                            >
                              📁 {customClip ? ax.replaceAudioBtn : ax.uploadAudioBtn}
                            </button>

                            {customClip && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextOffset = (customClip.startOffsetSec + 15) % 90;
                                    void musicClipPlayer.setSongStartOffset(currentSong.id, nextOffset);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-[11px] font-mono font-bold cursor-pointer"
                                  title={ax.startOffsetTitle}
                                >
                                  ⏩ {ax.startOffsetLabel} {customClip.startOffsetSec}s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void musicClipPlayer.removeSongAudioFile(currentSong.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-bold cursor-pointer"
                                  title={ax.removeCustomAudioTitle}
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {clipPlayer.notice && (
                          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/40 text-[11px] text-amber-100 flex items-center justify-between gap-2">
                            <span>{clipPlayer.notice}</span>
                            <button
                              type="button"
                              onClick={() => musicClipPlayer.clearNotice()}
                              className="text-amber-300 hover:text-white font-bold cursor-pointer shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Clip duration & Timer controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-amber-300/80 mr-1">{ax.clipDurationLabel}</span>
                      {[20, 30, 60, 90].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setMusicClipDuration(sec);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer border ${
                            musicClipDuration === sec
                              ? 'bg-amber-400 text-slate-950 border-white'
                              : 'bg-white/5 text-amber-200 border-white/15 hover:bg-white/10'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          musicBingoService.startClipTimer(musicClipDuration);
                          if (currentSong) {
                            void musicClipPlayer.playSongClip(currentSong, musicClipDuration);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-xs font-bold cursor-pointer"
                      >
                        ⏱️ {ax.startClockBtn}
                      </button>
                      {musicRemainingSec > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            musicBingoService.stopClipTimer();
                            musicClipPlayer.stop();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/25 border border-rose-400/50 text-rose-200 text-xs font-bold cursor-pointer"
                        >
                          ⏹️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Guess Mode vs Reveal Title Toggle + New Round (Kun Arrangør) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        const nextHide = !hideMusicTitleUntilReveal;
                        setHideMusicTitleUntilReveal(nextHide);
                        musicBingoService.setRevealCurrentSong(!nextHide);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                        hideMusicTitleUntilReveal
                          ? 'bg-amber-950/70 border-amber-400/50 text-amber-200'
                          : 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                      }`}
                    >
                      {hideMusicTitleUntilReveal
                        ? `🙈 ${ax.guessModeOnBtn}`
                        : `👁️ ${ax.guessModeOffBtn}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop(1.1);
                        musicClipPlayer.stop();
                        musicBingoService.startNewRound();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-amber-100 cursor-pointer"
                    >
                      🔄 {ax.newMusicRoundBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* Searchable 60-Song Nostalgic Deck with In-App Playable Clip Buttons */}
              {canActAsHost && (
                <div className="p-4 rounded-2xl bg-black/65 border border-amber-500/30 space-y-2.5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading font-black text-sm text-amber-200">
                        🎶 {ax.audioDeckTitle} ({filteredDeck.length})
                      </h3>
                      <div className="text-[11px] text-amber-200/70">
                        {Object.keys(clipPlayer.customClips).length}/{MUSIC_BINGO_SONGS.length} {ax.customFilesUploaded} · {musicSnap.playedSongIds.length} {ax.playedWord}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => bulkFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-100 font-black text-[11px] cursor-pointer"
                      title={ax.bulkUploadTitle}
                    >
                      📂 {ax.bulkUploadBtn}
                    </button>
                  </div>

                  {bulkMatchMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[11px] text-emerald-100 font-bold">
                      {bulkMatchMessage}
                    </div>
                  )}

                  <input
                    type="text"
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    placeholder={ui.audienceSearchSongPlaceholder}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/20 focus:border-amber-400 text-xs text-white outline-none"
                  />

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMusicCategoryFilter(cat);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          musicCategoryFilter === cat
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-white/5 text-amber-200/80 hover:bg-white/10'
                        }`}
                      >
                        {cat === 'ALL' ? ui.audienceAllCategories : cat}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {filteredDeck.map((song) => {
                      const isPlayed = musicSnap.playedSongIds.includes(song.id);
                      const isCurrent = musicSnap.currentSongId === song.id;
                      const isSongPlaying = clipPlayer.currentSongId === song.id && clipPlayer.isPlaying;
                      const isSongLoading = clipPlayer.currentSongId === song.id && clipPlayer.isLoading;
                      const hasCustomAudio = Boolean(clipPlayer.customClips[song.id]);
                      return (
                        <div
                          key={song.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                            isSongPlaying || isCurrent
                              ? 'bg-amber-500/25 border-amber-400 text-white'
                              : isPlayed
                              ? 'bg-emerald-950/35 border-emerald-500/30 text-emerald-100/80'
                              : 'bg-white/5 border-white/10 text-amber-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold truncate">
                              {isPlayed && <span className="text-emerald-300 mr-1">✓</span>}
                              {song.title}
                            </div>
                            <div className="text-[11px] text-amber-200/75 truncate">
                              {song.artist} · {song.decade}
                              {hasCustomAudio && (
                                <span className="ml-1.5 text-emerald-300 font-bold">· ✓ {ax.songSubtitleCustom}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                pendingUploadSongIdRef.current = song.id;
                                singleSongFileInputRef.current?.click();
                              }}
                              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                                hasCustomAudio
                                  ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100 hover:bg-emerald-500/35'
                                  : 'bg-white/10 border-white/20 text-amber-100 hover:bg-white/20'
                              }`}
                              title={
                                hasCustomAudio
                                  ? `${ax.replaceSongAudioTitle} (${clipPlayer.customClips[song.id].fileName})`
                                  : `${ax.uploadAudioForSongTitle} «${song.title}»`
                              }
                            >
                              {hasCustomAudio ? ax.hasCustomAudioShort : ax.audioFileBtnShort}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isSongPlaying) {
                                  musicClipPlayer.togglePlayPause();
                                } else {
                                  sounds.playPop(1.05);
                                  musicBingoService.playSong(song.id, !hideMusicTitleUntilReveal, musicClipDuration);
                                  void musicClipPlayer.playSongClip(song, musicClipDuration);
                                }
                              }}
                              disabled={isSongLoading}
                              className={`px-2.5 py-1.5 rounded-lg font-black text-[11px] cursor-pointer ${
                                isSongPlaying
                                  ? 'bg-rose-400 hover:bg-rose-300 text-slate-950'
                                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              }`}
                            >
                              {isSongLoading ? '⏳' : isSongPlaying ? ax.pauseShort : ax.playShort}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* RIGHT COLUMN: Big Hall Projector Display (Readable from back of 50+ hall) */}
            <div className="flex-1 min-w-0 w-full space-y-5">
              {/* Live Music Bingo Claim Alert */}
              {musicSnap.lastClaim && (() => {
                const isFull = /fullt?\s*brett|fullbrett|full_?house|blackout/i.test(musicSnap.lastClaim.pattern);
                const isLine3 = !isFull && /3\s*\.?\s*rekke|3\s*lines|line3/i.test(musicSnap.lastClaim.pattern);
                const nextMusicText = isFull
                  ? ax.musicClaimFullDone
                  : isLine3
                  ? `➡️ ${ui.continuesToFullbrett}`
                  : `➡️ ${ui.continuesToLine3}`;
                const localizedPattern = localizeBingoPattern(musicSnap.lastClaim.pattern, lang);
                return (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 text-slate-950 shadow-2xl border-4 border-white flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest">
                        {ax.musicClaimBadge}
                      </div>
                      <div className="font-display text-2xl sm:text-4xl font-black">
                        {musicSnap.lastClaim.playerName} {ui.shoutedBannerPrefix} {localizedPattern} {ui.shoutedBannerMid} {ui.shoutedBannerSuffix}
                      </div>
                      <div className="text-xs sm:text-sm font-black mt-1">
                        {nextMusicText}
                      </div>
                    </div>
                    {canActAsHost && (
                      <button
                        type="button"
                        onClick={() => musicBingoService.dismissClaim()}
                        className="px-4 py-2 rounded-xl bg-slate-950 text-white font-black text-xs cursor-pointer"
                      >
                        {ax.musicClaimApproveClose}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Current Song Big Stage Card */}
              <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-[#2b180c] via-[#170e0a] to-[#0b0706] border-2 border-amber-400/50 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">
                      {ax.musicStageBadge}
                    </span>
                    <span className="text-sm font-bold text-amber-200">
                      {ui.round} {musicSnap.roundNumber} · {musicSnap.playedSongIds.length} {ax.cardOfTotal} {MUSIC_BINGO_SONGS.length} {ax.musicPlayedOfSongs}
                    </span>
                  </div>

                  {musicRemainingSec > 0 && (
                    <div
                      className={`px-5 py-2 rounded-2xl border-2 font-mono tabular-nums font-black text-2xl sm:text-3xl ${
                        musicRemainingSec <= 5
                          ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse'
                          : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      }`}
                    >
                      ⏱️ {musicRemainingSec}s
                    </div>
                  )}
                </div>

                {musicSnap.clipStartedAt > 0 && musicRemainingSec > 0 && (
                  <div className="w-full h-3.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        musicRemainingSec <= 5 ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${clipProgressPct}%` }}
                    />
                  </div>
                )}

                {!currentSong ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="text-6xl">🎶</div>
                    <h2 className="font-display text-3xl sm:text-5xl font-black text-amber-100 leading-tight">
                      {ax.musicWelcomeTitle}
                    </h2>
                    <p className="text-base sm:text-xl text-amber-200/85 max-w-2xl mx-auto leading-relaxed">
                      {ax.musicWelcomeDesc}
                    </p>
                  </div>
                ) : !musicSnap.revealCurrentSong ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-sm font-black">
                      <span>🔊</span>
                      <span>{ax.musicPlayingNowBanner}</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-5xl font-black text-white leading-tight">
                      {ax.musicDoYouRecognize}
                    </h2>
                    <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-amber-400/40 max-w-2xl mx-auto space-y-1.5">
                      <div className="text-sm font-black text-amber-300 uppercase tracking-wider">
                        {ax.musicHintToHall} {currentSong.decade} · {currentSong.category}
                      </div>
                      <p className="text-base sm:text-lg text-amber-100 font-semibold">
                        💡 {currentSong.clipHint}
                      </p>
                    </div>
                    {canActAsHost && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playLineComplete();
                          musicBingoService.setRevealCurrentSong(true);
                        }}
                        className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-400 hover:brightness-110 text-slate-950 font-black text-base sm:text-lg cursor-pointer shadow-2xl"
                      >
                        {ax.musicRevealBtn}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-300">
                      {ax.musicNowPlayingBadge} ({currentSong.decade} · {currentSong.category})
                    </div>
                    <h2 className="font-display text-4xl sm:text-6xl font-black text-white leading-tight">
                      «{currentSong.title}»
                    </h2>
                    <div className="text-xl sm:text-3xl font-heading font-bold text-amber-300">
                      {currentSong.artist}
                    </div>
                    <p className="text-base sm:text-lg text-amber-100/85 max-w-2xl mx-auto">
                      🎤 {currentSong.clipHint}
                    </p>
                  </div>
                )}
              </div>

              {/* Played Songs Hall Verification Wall */}
              <div className="p-5 sm:p-6 rounded-3xl bg-black/60 border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <h3 className="font-heading font-black text-lg sm:text-xl text-amber-200">
                    📋 {ui.audiencePlayedSongsTitle} ({playedSongs.length}) {ax.musicPlayedSongsCheck}
                  </h3>
                  <span className="text-xs font-bold text-amber-300/80">
                    {ax.musicNewestTop}
                  </span>
                </div>

                {playedSongs.length === 0 ? (
                  <div className="py-6 text-center text-sm text-amber-200/60">
                    {ui.musicWaitingHost}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {playedSongs.map((s, idx) => {
                      const isLatest = s.id === musicSnap.currentSongId;
                      if (isLatest && !musicSnap.revealCurrentSong) {
                        return (
                          <div
                            key={s.id}
                            className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="text-xs font-black text-amber-300">
                                {ax.musicPlayingGuessBadge}
                              </div>
                              <div className="text-base font-bold text-white">
                                {s.decade} · {s.category}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={s.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                            isLatest
                              ? 'bg-emerald-500/20 border-emerald-400 text-white'
                              : 'bg-white/5 border-white/15 text-amber-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-heading font-black text-base sm:text-lg truncate">
                              {s.title}
                            </div>
                            <div className="text-xs sm:text-sm text-amber-200/80 truncate">
                              {s.artist} ({s.decade})
                            </div>
                          </div>
                          <span className="font-mono text-xs font-black px-2 py-1 rounded-lg bg-black/50 text-amber-300 shrink-0">
                            #{playedSongs.length - idx}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Connected Digital Participants Progress */}
              {musicSnap.participants.length > 0 && (
                <div className="p-5 rounded-3xl bg-black/55 border border-cyan-500/30 space-y-3">
                  <div className="text-sm font-black text-cyan-200 uppercase tracking-wider">
                    {ax.musicDigitalBoardsTitle} ({musicSnap.participants.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {musicSnap.participants.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          p.hasBingo
                            ? 'bg-amber-500/25 border-amber-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-100'
                        }`}
                      >
                        <span className="font-bold text-sm truncate">{p.name}</span>
                        <span className="font-mono font-black text-xs text-amber-300 shrink-0">
                          {p.hasBingo ? `🏆 ${p.linesCompleted} ${ax.musicLinesSuffix}` : `${p.markedCount}${ax.musicMarksSuffix}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* VIEW OPTION 0: MULTIPLAYER RIL ON BIG SCREEN — Floating Left Trommel Sidebar + Scrolling Player Cards */}
      {viewOption === 'multiplayer_ril' && (
        <div className="flex-1 max-w-[1880px] mx-auto w-full py-4 flex flex-col md:flex-row items-start gap-5 lg:gap-6">
          {/* Left Floating Trommel Rail: Generous width so TV & Projector show a large tumbler */}
          <aside className="w-full md:w-[430px] lg:w-[500px] xl:w-[560px] 2xl:w-[620px] shrink-0 md:sticky md:top-3 self-start md:max-h-[calc(100vh-1.5rem)] md:overflow-y-auto no-scrollbar space-y-3 z-20">
            {showBlender ? (
              <BallCageCanvas
                onBallDrawn={(ball) => {
                  if (canDrawInStorskjerm) onDrawNextBall(ball);
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
                readOnlyMessage={`🔒 ${ui.hostControlsNote}`}
                compactSidebar={false}
                tumblerSize="tv"
                layout="stacked"
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
                        ? `${ax.lastBallHash} #${calledBalls.length}/75`
                        : ax.readyToDraw}
                    </div>
                    <div className="font-heading font-black text-sm text-white leading-snug">
                      {currentBall
                        ? `«${currentBall.affirmation}»`
                        : ax.pressDrawToStart}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300/75 mt-0.5">
                      {uncalledBalls.length} {ax.ballsLeft}
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
                      {ax.refillDrumBtn}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDrawNextBall()}
                      disabled={uncalledBalls.length === 0}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-40"
                    >
                      {ax.drawNextBallBtn}
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
                <span>{showBlender ? ax.hideDrumBtn : ax.showDrumBtn}</span>
              </button>

              {recentBalls.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold mr-0.5">
                    {ax.previousShort}
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
                  {ax.showAllPlayers} ({players.length})
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
                {ax.tipHoverCell}
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
                            ? `${ui.cardNumberPrefix}${(player.activeCardIndex || 0) + 1} ${ax.cardOfTotal} ${player.cards.length}`
                            : ax.rilBoardLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-amber-300 tabular-nums">
                        {player.linesCompleted} {player.linesCompleted === 1 ? ax.lineSingular : ax.linePlural}
                      </div>
                      <div className="text-3xs uppercase tracking-wider text-amber-200/60 font-semibold">
                        {ax.completedLabel}
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
                                    ★ {ui.freeSpaceLabel} ★
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
                                    ❤️ {ui.freeSpaceLabel}
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
                                  <span>❤️ {ax.markedLabel}</span>
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
                onBallDrawn={canDrawInStorskjerm ? (ball) => onDrawNextBall(ball) : undefined}
                calledBalls={calledBalls}
                uncalledBalls={uncalledBalls}
                isAutoCalling={canDrawInStorskjerm && isAutoCalling}
                onToggleAuto={() => {
                  if (canDrawInStorskjerm) setIsAutoCalling(!isAutoCalling);
                }}
                onScramble={canDrawInStorskjerm ? onAgitateMix : undefined}
                onRefillDrum={canDrawInStorskjerm ? onRefillDrum : undefined}
                canDraw={canDrawInStorskjerm}
                readOnlyMessage={`🔒 ${ui.hostControlsNote}`}
                compactSidebar={false}
                tumblerSize="tv"
                layout="stacked"
              />
            </div>

            {recentBalls.length > 0 && (
              <div className="w-full p-3 rounded-2xl bg-black/55 border border-amber-400/30 flex items-center justify-center gap-2">
                <span className="text-3xs uppercase tracking-wider text-amber-400/70 font-semibold">
                  {ax.previousShort}
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
                {ax.splitFlashboardTitle}
              </h2>
              <span className="text-2xs font-mono text-amber-400">
                {calledBalls.length} {ax.drawnOf75Total}
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
                  {ax.recentStoriesHall}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allStories.slice(-4).map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs shrink-0 max-w-xs"
                    >
                      <div className="font-semibold text-amber-200 truncate">{s.text}</div>
                      <div className="text-3xs text-amber-300/80 mt-0.5">
                        {s.player} {s.partner ? `${ax.togetherWith} ${s.partner}` : ''}
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
                  {ax.fullFlashboardTitle}
                </h2>
                <p className="text-xs text-amber-300/70">
                  {ax.fullFlashboardDesc}
                </p>
              </div>

              {currentBall && (
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-amber-400/50">
                  <span className="text-xs uppercase tracking-wider text-amber-300/80 font-semibold">
                    {ax.lastBallLabel}
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
                  onClick={() => onDrawNextBall()}
                  disabled={uncalledBalls.length === 0}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{ax.drawNextBallBtn}</span>
                </button>
              ) : (
                <div className="px-6 py-3 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 font-bold text-xs sm:text-sm">
                  🔒 {ui.hostControlsNote}
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
              {ax.storiesTitle}
            </h2>
            <p className="text-xs text-amber-300/70 mb-4">
              {ax.storiesDesc}
            </p>

            {allStories.length === 0 ? (
              <div className="py-16 text-center text-amber-300/50 text-sm">
                {ui.audienceStoriesEmpty}
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
                        {s.player} {ax.togetherWith} <strong className="text-white">{s.partner}</strong>
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
                  {ui.audienceLeaderboardTitle} ({players.length + remotePlayers.length} {ui.players})
                </h2>
                <p className="text-xs text-amber-300/70">
                  {ax.leaderboardDesc} {ui.round} {roundNumber}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black">
                {ui.round} {roundNumber}
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
                  subtitle: `${p.cards.length} ${ui.cards} ${ax.cardsInPlaySuffix}`,
                })),
                ...remotePlayers.map((rp) => {
                  const summary = tvPlayersSummary.find((s) => s.id === rp.id);
                  return {
                    id: rp.id,
                    name: rp.name,
                    avatarColor: rp.color || '#06b6d4',
                    linesCompleted: summary?.linesCompleted || 0,
                    hasBingo: Boolean(summary?.hasBingo),
                    subtitle: ax.connectedMobileLabel,
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
                              {ax.bingoWinnerBadge}
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
                          {ax.linesColumnLabel}
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
