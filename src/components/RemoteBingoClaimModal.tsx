/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { RemoteBingoClaim } from '../services/remoteBingo';
import { useTranslation } from '../services/i18n';
import {
  formatMilestoneLabel,
  getBingoUiTexts,
  localizeBingoPattern,
} from '../services/bingoUiI18n';
import { WinnerTask } from '../data/winnerTasks';

interface RemoteBingoClaimModalProps {
  claim: RemoteBingoClaim | null;
  winnerTask?: WinnerTask | null;
  onClose: () => void;
  isHost?: boolean;
  onStartNewRoundNow?: () => void;
}

export const RemoteBingoClaimModal: React.FC<RemoteBingoClaimModalProps> = ({
  claim,
  winnerTask,
  onClose,
  isHost = false,
  onStartNewRoundNow,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(5);

  useEffect(() => {
    if (!claim) return;
    sounds.playBingoWin();

    if (claim.isFullHouse) {
      const initialSec = Math.max(1, Math.ceil((claim.autoNewRoundDelayMs || 5500) / 1000));
      setCountdownSec(initialSec);
      const timer = window.setInterval(() => {
        setCountdownSec((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [claim]);

  useEffect(() => {
    if (!claim) return;

    // Zero-dependency particle celebration
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 400;

    const colors = ['#ff5b24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24', '#a855f7'];
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      rotation: number;
      rotSpeed: number;
    }[] = [];

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 6,
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.98;
        p.alpha -= 0.008;
        p.rotation += p.rotSpeed;

        if (p.alpha > 0.01) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [claim]);

  if (!claim) return null;

  const resolvedTier: 'line1' | 'line3' | 'fullbrett' =
    claim.milestone ||
    (claim.isFullHouse || /fullbrett|fullt?\s*brett|full_?house|blackout/i.test(claim.pattern)
      ? 'fullbrett'
      : /3\s*\.?\s*rekke|3\s*line/i.test(claim.pattern)
      ? 'line3'
      : 'line1');
  const tierLabel = formatMilestoneLabel(resolvedTier, lang);
  const localizedPattern = localizeBingoPattern(claim.pattern, lang);
  const nextLevelLabel =
    resolvedTier === 'line1'
      ? ui.milestoneLine3
      : resolvedTier === 'line3'
      ? ui.milestoneFullbrett
      : ui.newRoundBtn;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2e1708] via-[#1c0d05] to-[#0a0603] border-4 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-2xl text-amber-50 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Confetti canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Glow halo */}
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none rounded-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-black text-4xl flex items-center justify-center shadow-xl animate-bounce">
            🏆
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 text-xs font-mono font-bold uppercase tracking-widest inline-block mb-2">
              ✓ {ui.claimModalBadge} · {tierLabel}
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-amber-200 tracking-wide">
              {claim.isFullHouse ? ui.claimModalTitleFull : `${tierLabel.toUpperCase()} — ${ui.claimModalTitleLine}`}
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/40 space-y-2">
            <div className="text-xs sm:text-sm text-amber-300 font-bold">
              {ui.shoutedBannerMid} {tierLabel} {ui.shoutedBannerSuffix}
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-amber-100 tracking-wide">
              {claim.playerName}
            </div>
            <div className="text-xs text-emerald-400 font-mono font-bold flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span>🎯 {ui.claimModalPatternLabel}</span>
              <span className="bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {localizedPattern}
              </span>
              {typeof claim.cardIndex === 'number' && claim.cardIndex >= 0 && (
                <span className="bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-200">
                  {ui.claimModalCardPrefix}{claim.cardIndex + 1}
                </span>
              )}
              {typeof claim.roundNumber === 'number' && (
                <span className="bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30 text-cyan-200">
                  {ui.claimModalRoundPrefix} #{claim.roundNumber}
                </span>
              )}
            </div>
          </div>

          {winnerTask && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/75 via-black/60 to-rose-950/60 border border-amber-400/60 text-center space-y-1.5 shadow-lg">
              <div className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center justify-center gap-1.5">
                <span>{winnerTask.icon}</span>
                <span>{ui.claimModalTaskBadge}</span>
                <span>💖</span>
              </div>
              <div className="font-heading font-bold text-sm sm:text-base text-amber-100 leading-snug">
                «{winnerTask.task}»
              </div>
              <div className="text-[11px] text-amber-300/80 font-mono">
                +{winnerTask.sparkReward} {ui.winnerTaskRewardLabel}
              </div>
            </div>
          )}

          {claim.isFullHouse ? (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 text-xs font-black flex items-center justify-center gap-2">
              <span className="animate-spin">🔄</span>
              <span>{ui.claimModalNewRoundNote} ({countdownSec}s)</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-400/50 text-cyan-100 text-xs sm:text-sm font-bold leading-relaxed space-y-1">
              <div className="text-amber-200 font-black">
                {resolvedTier === 'line1' ? ui.claimModalContinuesLine3 : ui.claimModalContinuesFull}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {claim.isFullHouse ? (
              isHost && onStartNewRoundNow ? (
                <button
                  onClick={() => {
                    sounds.playLineComplete();
                    onStartNewRoundNow();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all"
                >
                  {ui.claimModalStartNewRoundNow}
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playLineComplete();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm cursor-pointer shadow-lg transition-all"
                >
                  {ui.claimModalAcknowledgeBtn}
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => {
                    sounds.playLineComplete();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all"
                >
                  ➡️ {nextLevelLabel}
                </button>
                {isHost && onStartNewRoundNow && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onStartNewRoundNow();
                      onClose();
                    }}
                    className="py-3 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-100 text-xs font-bold cursor-pointer transition-all"
                    title={ui.newRoundBtn}
                  >
                    🔄 {ui.newRoundBtn}
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer transition-all"
            >
              {ui.claimModalCloseBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
