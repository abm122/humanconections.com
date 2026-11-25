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
  const [snap, setSnap] = useState<MusicBingoSnapshot>(() => musicBingoService.getSnapshot());
  const [cardSeed, setCardSeed] = useState<number>(() => Math.floor(100 + Math.random() * 900));
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set());
  const [largeFont, setLargeFont] = useState<boolean>(true);
  const [lightPaperMode, setLightPaperMode] = useState<boolean>(true);
  const [claimSent, setClaimSent] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [dismissedClaimTs, setDismissedClaimTs] = useState<number>(0);

  useEffect(() => {
    musicBingoService.requestSync(roomCode);
    const unsub = musicBingoService.subscribe(() => {
      setSnap(musicBingoService.getSnapshot());
    });
    const unsubReject = musicBingoService.onClaimRejected((msg) => {
      sounds.playClick();
      setClaimSent(null);
      setClaimError(msg);
    });
    const unsubClaim = musicBingoService.onClaim(() => {
      sounds.playLineComplete();
    });
    return () => {
      unsub();
      unsubReject();
      unsubClaim();
    };
  }, [roomCode]);

  // Nullstill avkryssing automatisk hvis arrangøren starter en ny runde
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
        label: '🏆 ROP MUSIKKBINGO! (Fullt brett)',
      };
    }
    if (evalResult.linesCompleted >= 3 && !claimedMilestones.includes('line3')) {
      return {
        tier: 'line3' as const,
        pattern: '3. REKKER · MUSIKKBINGO',
        label: '🎉 ROP MUSIKKBINGO! (3. rekker)',
      };
    }
    if (evalResult.linesCompleted >= 1 && !claimedMilestones.includes('line1')) {
      return {
        tier: 'line1' as const,
        pattern: '1. REKKE · MUSIKKBINGO',
        label: '🎉 ROP MUSIKKBINGO! (1. rekke)',
      };
    }
    return null;
  }, [evalResult.hasFullHouse, evalResult.linesCompleted, claimedMilestones]);

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
      if (claimedMilestones.includes('line3')) {
        setClaimError('🔒 1. og 3. rekke er allerede ropt! Du må fullføre fullt brett før du kan rope BINGO.');
      } else if (claimedMilestones.includes('line1')) {
        setClaimError('🔒 1. rekke er allerede ropt! Du må fullføre 3. rekker eller fullt brett før du kan rope BINGO.');
      } else {
        setClaimError('🔒 Du må krysse av minst 1 hel rekke først før du kan rope BINGO.');
      }
      return;
    }
    setClaimError(null);
    sounds.playBingoWin();
    musicBingoService.claimDigitalBingo(
      roomCode,
      playerName || 'Deltaker',
      eligibleMusicClaim.pattern,
      evalResult.linesCompleted,
      evalResult.hasFullHouse
    );
    const nextHint =
      eligibleMusicClaim.tier === 'line1'
        ? 'Spillet fortsetter til 3. rekker!'
        : eligibleMusicClaim.tier === 'line3'
        ? 'Spillet fortsetter til Fullt brett!'
        : 'Fullt brett oppnådd!';
    setClaimSent(`🎉 Bingo sendt til arrangør og alle deltakere (${eligibleMusicClaim.pattern})! ➡️ ${nextHint}`);
    if (onClaimedBingo) onClaimedBingo(eligibleMusicClaim.pattern);
  };

  const currentSong = snap.currentSongId
    ? MUSIC_BINGO_SONGS.find((s) => s.id === snap.currentSongId) || null
    : null;

  return (
    <div className="space-y-4 text-left">
      {/* Kontroller for lesbarhet (eldre-vennlig høy kontrast & stor skrift) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black/50 border border-amber-400/40">
        <div>
          <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
            🎵 Digitalt Musikkbingo-brett · Brett #{cardSeed} · Runde {snap.roundNumber}
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            Lytt til lydklipp fra arrangøren og trykk på sangene du kjenner igjen på brettet ditt.
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
            {largeFont ? 'Aa Ekstra stor skrift: PÅ' : 'Aa Normal skrift'}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setLightPaperMode((v) => !v);
            }}
            className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            {lightPaperMode ? '🌙 Mørkt brett' : '☀️ Lyst papirbrett'}
          </button>

          <span className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-black/40 border border-amber-500/35 text-amber-200/90 flex items-center gap-1.5 select-none">
            <span>🔒</span>
            <span>Kun arrangør styrer ny runde</span>
          </span>
        </div>
      </div>

      {/* Aktiv sang-status fra arrangør */}
      {currentSong && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-[#221509] to-emerald-950/60 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              🔊 Spilles nå fra arrangør:
            </div>
            {snap.revealCurrentSong ? (
              <div className="font-heading font-black text-base sm:text-lg text-white">
                «{currentSong.title}» — {currentSong.artist} ({currentSong.decade})
              </div>
            ) : (
              <div className="font-heading font-bold text-sm sm:text-base text-amber-100">
                🎵 Hint: {currentSong.decade} · {currentSong.category} (Lytt etter melodien!)
              </div>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300">
            {snap.playedSongIds.length} sanger spilt
          </span>
        </div>
      )}

      {/* Fremdrift, Milepæl-lås & Rop BINGO */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/45 border border-white/15">
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
          <span className="text-amber-200">
            Krysset av: <strong className="font-mono text-white">{evalResult.markedCount} / 24</strong>
          </span>
          <span className="text-emerald-300">
            Rekker: <strong className="font-mono text-white">{evalResult.linesCompleted}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['line1', 'line3', 'fullbrett'] as const).map((tier) => {
              const taken = claimedMilestones.includes(tier);
              const winner = milestoneWinners[tier];
              const label = tier === 'line1' ? '1. rekke' : tier === 'line3' ? '3. rekker' : 'Fullt brett';
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
                  {winner ? ` (${winner})` : taken ? ' · Tatt' : ''}
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
            ? '🔒 Låst — fyll fullt brett'
            : claimedMilestones.includes('line1')
            ? '🔒 Låst — fyll 3. rekker'
            : '🔒 ROP MUSIKKBINGO (Fyll 1. rekke)'}
        </button>
      </div>

      {snap.lastClaim && snap.lastClaim.timestamp !== dismissedClaimTs && (() => {
        const isFull = /fullt?\s*brett|full_?house|blackout/i.test(snap.lastClaim.pattern);
        const isLine3 = !isFull && /3\s*\.?\s*rekke/i.test(snap.lastClaim.pattern);
        const nextLevel = isFull ? 'Ny runde kan startes av arrangør' : isLine3 ? 'Fullt brett' : '3. rekker';
        return (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-cyan-500/25 border-2 border-amber-300 text-amber-50 flex flex-wrap items-center justify-between gap-2 shadow-xl">
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-black text-amber-200">
                🏆 {snap.lastClaim.playerName} har faktisk fylt {snap.lastClaim.pattern} og trykket MUSIKKBINGO!
              </div>
              <div className="text-xs font-bold text-emerald-200">
                {isFull
                  ? '🔄 Fullt brett er oppnådd! Vent på at arrangøren starter ny runde.'
                  : `➡️ Vi spiller videre nå til ${nextLevel}! (${isLine3 ? '1. og 3. rekker' : '1. rekke'} er låst)`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedClaimTs(snap.lastClaim!.timestamp)}
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-xs font-bold text-amber-100 cursor-pointer shrink-0"
            >
              OK
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

      {/* 5x5 Digitalt Musikkbingobrett */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border-2 shadow-2xl ${
          lightPaperMode
            ? 'bg-amber-50 border-amber-600 text-slate-950'
            : 'bg-[#120d08] border-amber-500/50 text-amber-50'
        }`}
      >
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
                      FRI RUTE
                    </span>
                    <span className="text-[10px] font-bold opacity-85">Allsang!</span>
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
