/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import {
  MUSIC_BINGO_SONGS,
  evaluateMusicBingoBoard,
  generateMusicBingoCard,
} from '../data/musicBingoSongs';
import { MusicBingoSnapshot, musicBingoService } from '../services/musicBingoService';
import { useTranslation } from '../services/i18n';
import {
  formatMilestoneLabel,
  getBingoUiTexts,
  localizeBingoPattern,
  localizeServerBingoMessage,
} from '../services/bingoUiI18n';

interface DigitalMusicBingoBoardProps {
  roomCode: string;
  playerName: string;
  onClaimedBingo?: (pattern: string) => void;
}

export const DigitalMusicBingoBoard: React.FC<DigitalMusicBingoBoardProps> = ({
  roomCode,
  playerName,
  onClaimedBingo,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);

  const [snap, setSnap] = useState<MusicBingoSnapshot>(() => musicBingoService.getSnapshot());
  const [cardSeed, setCardSeed] = useState<number>(() => Math.floor(100 + Math.random() * 900));
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set());
  const [largeFont, setLargeFont] = useState<boolean>(true);
  const [lightPaperMode, setLightPaperMode] = useState<boolean>(true);
  const [claimSent, setClaimSent] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [newRoundBanner, setNewRoundBanner] = useState<string | null>(null);
  const [dismissedClaimTs, setDismissedClaimTs] = useState<number>(0);

  useEffect(() => {
    musicBingoService.requestSync(roomCode);
    const unsub = musicBingoService.subscribe(() => {
      setSnap(musicBingoService.getSnapshot());
    });
    const unsubReject = musicBingoService.onClaimRejected((msg) => {
      sounds.playClick();
      setClaimSent(null);
      setClaimError(localizeServerBingoMessage(msg, lang));
    });
    const unsubClaim = musicBingoService.onClaim(() => {
      sounds.playLineComplete();
    });
    const unsubNewRound = musicBingoService.onNewRound((ev) => {
      sounds.playLineComplete();
      setMarkedIds(new Set());
      setClaimSent(null);
      setClaimError(null);
      setCardSeed(Math.floor(100 + Math.random() * 900));
      setNewRoundBanner(
        ui.musicNewRoundNotice.replace('{n}', String(ev.roundNumber))
      );
      window.setTimeout(() => setNewRoundBanner(null), 6000);
    });
    return () => {
      unsub();
      unsubReject();
      unsubClaim();
      unsubNewRound();
    };
  }, [roomCode, lang, ui.musicNewRoundNotice]);

  // Reset board automatically when roundNumber changes via polling or WS
  useEffect(() => {
    setMarkedIds(new Set());
    setClaimSent(null);
    setClaimError(null);
  }, [snap.roundNumber]);

  const cardData = useMemo(() => generateMusicBingoCard(cardSeed, snap.roundNumber), [cardSeed, snap.roundNumber]);

  const evalResult = useMemo(
    () => evaluateMusicBingoBoard(cardData.grid, markedIds),
    [cardData.grid, markedIds]
  );

  useEffect(() => {
    if (roomCode && playerName) {
      musicBingoService.reportDigitalProgress(
        roomCode,
        playerName,
        evalResult.markedCount,
        evalResult.linesCompleted,
        evalResult.hasFullHouse || evalResult.linesCompleted > 0
      );
    }
  }, [roomCode, playerName, evalResult.markedCount, evalResult.linesCompleted, evalResult.hasFullHouse]);

  const claimedMilestones = snap.claimedMilestones || [];
  const milestoneWinners = snap.milestoneWinners || {};

  const eligibleMusicClaim = useMemo(() => {
    if (evalResult.hasFullHouse && !claimedMilestones.includes('fullbrett')) {
      return {
        tier: 'fullbrett' as const,
        pattern: 'FULLT BRETT · MUSIKKBINGO',
        label: `${ui.musicShoutBtnPrefix} ${ui.milestoneFullbrett}`,
      };
    }
    if (evalResult.linesCompleted >= 3 && !claimedMilestones.includes('line3')) {
      return {
        tier: 'line3' as const,
        pattern: '3. REKKER · MUSIKKBINGO',
        label: `${ui.musicShoutBtnPrefix} ${ui.milestoneLine3}`,
      };
    }
    if (evalResult.linesCompleted >= 1 && !claimedMilestones.includes('line1')) {
      return {
        tier: 'line1' as const,
        pattern: '1. REKKE · MUSIKKBINGO',
        label: `${ui.musicShoutBtnPrefix} ${ui.milestoneLine1}`,
      };
    }
    return null;
  }, [evalResult.hasFullHouse, evalResult.linesCompleted, claimedMilestones, ui]);

  const handleToggleSong = (songId: string) => {
    sounds.playPop(1.08);
    setClaimError(null);
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleClaim = () => {
    if (!eligibleMusicClaim) {
      sounds.playClick();
      if (claimedMilestones.includes('fullbrett')) {
        setClaimError(`🔒 ${ui.musicAllClaimedHint}`);
      } else {
        setClaimError(`🔒 ${ui.musicNeedLineHint}`);
      }
      return;
    }
    setClaimError(null);
    sounds.playBingoWin();
    musicBingoService.claimDigitalBingo(
      roomCode,
      playerName || ui.guest,
      eligibleMusicClaim.pattern,
      evalResult.linesCompleted,
      evalResult.hasFullHouse
    );
    const nextHint =
      eligibleMusicClaim.tier === 'line1'
        ? ui.continuesToLine3
        : eligibleMusicClaim.tier === 'line3'
        ? ui.continuesToFullbrett
        : ui.newRoundStartsSoon;
    setClaimSent(`🎉 ${ui.claimModalBadge} (${formatMilestoneLabel(eligibleMusicClaim.tier, lang)}) · ${nextHint}`);
    if (onClaimedBingo) onClaimedBingo(eligibleMusicClaim.pattern);
  };

  const currentSong = snap.currentSongId
    ? MUSIC_BINGO_SONGS.find((s) => s.id === snap.currentSongId) || null
    : null;

  return (
    <div className="space-y-4 text-left">
      {/* Header & accessibility controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black/50 border border-amber-400/40">
        <div>
          <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
            🎵 {ui.musicTitle} · {ui.cardNumberPrefix}{cardSeed} · {ui.round} {snap.roundNumber}
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            {ui.musicHallSubtitle}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLargeFont((v) => !v);
            }}
            className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
              largeFont
                ? 'bg-amber-400 text-slate-950 border-white'
                : 'bg-white/10 text-amber-100 border-white/20'
            }`}
          >
            Aa {largeFont ? '++' : '+'}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLightPaperMode((v) => !v);
            }}
            className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            {lightPaperMode ? '🌙' : '☀️'}
          </button>

          <span className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-black/40 border border-amber-500/35 text-amber-200/90 flex items-center gap-1.5 select-none">
            <span>🔒</span>
            <span>{ui.host}</span>
          </span>
        </div>
      </div>

      {newRoundBanner && (
        <div className="p-3 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-100 font-black text-xs sm:text-sm text-center animate-pulse">
          {newRoundBanner}
        </div>
      )}

      {/* Current active song status from host */}
      {currentSong ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-[#221509] to-emerald-950/60 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              🔊 {ui.musicCurrentClip}:
            </div>
            {snap.revealCurrentSong ? (
              <div className="font-heading font-black text-base sm:text-lg text-white">
                «{currentSong.title}» — {currentSong.artist} ({currentSong.decade})
              </div>
            ) : (
              <div className="font-heading font-bold text-sm sm:text-base text-amber-100">
                🎵 {ui.musicHiddenSong} ({currentSong.decade} · {currentSong.category})
              </div>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300">
            {snap.playedSongIds.length}
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/25 text-xs text-amber-200/80 text-center">
          ⏳ {ui.musicWaitingHost}
        </div>
      )}

      {/* Progress, Milestones & Shout Music Bingo */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/45 border border-white/15">
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
          <span className="text-amber-200">
            {ui.musicProgressLabel}: <strong className="font-mono text-white">{evalResult.markedCount} / 24</strong>
          </span>
          <span className="text-emerald-300">
            {ui.linesCountLabel}: <strong className="font-mono text-white">{evalResult.linesCompleted}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['line1', 'line3', 'fullbrett'] as const).map((tier) => {
              const taken = claimedMilestones.includes(tier);
              const winner = milestoneWinners[tier];
              const label = formatMilestoneLabel(tier, lang);
              return (
                <span
                  key={tier}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black border ${
                    taken
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                      : 'bg-white/5 border-white/15 text-amber-200/75'
                  }`}
                >
                  {taken ? '✓' : '•'} {label}
                  {winner ? ` (${winner})` : taken ? ` · ${ui.claimedBy}` : ''}
                </span>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={!eligibleMusicClaim}
          onClick={handleClaim}
          className={`min-h-[48px] px-5 py-2.5 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all ${
            eligibleMusicClaim
              ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 text-slate-950 ring-2 ring-white animate-pulse cursor-pointer'
              : 'bg-white/10 border border-amber-500/30 text-amber-200/50 cursor-not-allowed'
          }`}
        >
          {eligibleMusicClaim
            ? `📣 ${eligibleMusicClaim.label} 🎵`
            : claimedMilestones.includes('line3')
            ? `🔒 ${ui.milestoneFullbrett}`
            : claimedMilestones.includes('line1')
            ? `🔒 ${ui.milestoneLine3}`
            : `🔒 ${ui.musicShoutBtnPrefix} ${ui.milestoneLine1}`}
        </button>
      </div>

      {snap.lastClaim && snap.lastClaim.timestamp !== dismissedClaimTs && (() => {
        const isFull = Boolean(snap.lastClaim.isFullHouse) || /fullt?\s*brett|full_?house|blackout/i.test(snap.lastClaim.pattern);
        const isLine3 = !isFull && (snap.lastClaim.milestone === 'line3' || /3\s*\.?\s*rekke|3\s*line/i.test(snap.lastClaim.pattern));
        const patternDisplay = localizeBingoPattern(snap.lastClaim.pattern, lang);
        return (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-cyan-500/25 border-2 border-amber-300 text-amber-50 flex flex-wrap items-center justify-between gap-2 shadow-xl">
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-black text-amber-200">
                🏆 {snap.lastClaim.playerName} {ui.shoutedBannerMid} {patternDisplay} {ui.shoutedBannerSuffix}
              </div>
              <div className="text-xs font-bold text-emerald-200">
                {isFull
                  ? ui.newRoundStartsSoon
                  : isLine3
                  ? ui.continuesToFullbrett
                  : ui.continuesToLine3}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedClaimTs(snap.lastClaim!.timestamp)}
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-xs font-bold text-amber-100 cursor-pointer shrink-0"
            >
              {ui.ok}
            </button>
          </div>
        );
      })()}

      {claimError && (
        <div className="p-3 rounded-2xl bg-rose-950/90 border border-amber-400/70 text-amber-100 font-bold text-xs sm:text-sm text-center">
          {claimError}
        </div>
      )}

      {claimSent && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-100 font-black text-sm text-center">
          {claimSent}
        </div>
      )}

      {/* 5x5 Digital Music Bingo Board */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border-2 shadow-2xl ${
          lightPaperMode
            ? 'bg-amber-50 border-amber-600 text-slate-950'
            : 'bg-[#120d08] border-amber-500/50 text-amber-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2 px-1 text-xs font-bold opacity-80">
          <span>{ui.musicSongsGridTitle}</span>
          <span>{ui.musicTapToMarkHint}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {cardData.grid.map((row) =>
            row.map((cell) => {
              if (cell.isCenter) {
                return (
                  <div
                    key="center-free"
                    className={`min-h-[82px] sm:min-h-[100px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center select-none ${
                      lightPaperMode
                        ? 'bg-amber-300 border-amber-700 text-slate-950'
                        : 'bg-amber-500/30 border-amber-400 text-amber-100'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">🎵</span>
                    <span className="font-black text-xs sm:text-sm leading-tight mt-0.5">
                      {ui.freeSpaceLabel}
                    </span>
                  </div>
                );
              }

              const song = cell.song!;
              const isMarked = markedIds.has(song.id);

              return (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => handleToggleSong(song.id)}
                  className={`min-h-[82px] sm:min-h-[100px] p-2 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isMarked
                      ? lightPaperMode
                        ? 'bg-emerald-600 border-emerald-900 text-white shadow-inner scale-[0.98]'
                        : 'bg-emerald-500/35 border-emerald-400 text-white shadow-inner scale-[0.98]'
                      : lightPaperMode
                        ? 'bg-white hover:bg-amber-100 border-slate-300 text-slate-950 shadow-sm'
                        : 'bg-black/50 hover:bg-white/10 border-amber-500/30 text-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`font-black leading-tight break-words ${
                        largeFont ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
                      }`}
                    >
                      {song.title}
                    </span>
                    {isMarked && (
                      <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <div
                    className={`leading-tight mt-1 ${
                      largeFont ? 'text-[11px] sm:text-xs font-bold' : 'text-[10px] font-semibold'
                    } ${isMarked ? 'text-emerald-100' : lightPaperMode ? 'text-slate-600' : 'text-amber-300/80'}`}
                  >
                    {song.artist}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
