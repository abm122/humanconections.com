/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { BingoCell } from '../types/bingo';
import { sounds } from '../audio/soundEngine';
import { progression } from '../services/progression';
import { GoldenCoinLogo } from './GoldenCoinLogo';
import { useTranslation } from '../services/i18n';
import { getBingoUiTexts } from '../services/bingoUiI18n';
import { getWinnerTaskForLines } from '../data/winnerTasks';

interface VictoryModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
  onOpenShareModal: () => void;
  winnerName?: string;
  card: BingoCell[][];
  linesCompleted: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star' | 'heart';
  opacity: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onPlayAgain,
  onOpenShareModal,
  winnerName,
  card,
  linesCompleted,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);
  const currentLevel = progression.getLevelInfo();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const localizedTask = getWinnerTaskForLines(linesCompleted, true, lang);

  useEffect(() => {
    if (isOpen) {
      sounds.playBingoWin();
    }
  }, [isOpen]);

  // Confetti / Particle Animation Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#f59e0b',
      '#fde047',
      '#ef4444',
      '#ec4899',
      '#10b981',
      '#06b6d4',
      '#8b5cf6',
      '#f97316',
    ];
    const shapes: ('rect' | 'circle' | 'star' | 'heart')[] = ['rect', 'circle', 'star', 'heart'];

    const particles: ConfettiParticle[] = Array.from({ length: 140 }, () => {
      const angle = (Math.random() * Math.PI) / 1.2 + Math.PI / 12;
      const speed = Math.random() * 12 + 6;
      return {
        x: width * 0.5 + (Math.random() - 0.5) * 300,
        y: height * 0.6 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.sin(angle) * speed,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 1,
      };
    });

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const drawHeart = (c: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
      c.beginPath();
      const topCurveHeight = size * 0.3;
      c.moveTo(cx, cy + topCurveHeight);
      c.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
      c.bezierCurveTo(cx - size / 2, cy + (size + topCurveHeight) / 2, cx, cy + (size + topCurveHeight) / 2, cx, cy + size);
      c.bezierCurveTo(cx, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + topCurveHeight);
      c.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
      c.closePath();
      c.fill();
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
          p.vy = Math.random() * 3 + 2;
          p.vx = (Math.random() - 0.5) * 4;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
        } else if (p.shape === 'heart') {
          drawHeart(ctx, 0, -p.size / 2, p.size);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const collectedStories: { text: string; partner?: string; note?: string }[] = [];
  card.forEach((row) => {
    row.forEach((cell) => {
      if (cell.isMarked && (cell.markedBy || cell.storyNote)) {
        collectedStories.push({
          text: cell.text,
          partner: cell.markedBy,
          note: cell.storyNote,
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[70] w-full h-full"
      />

      <div className="relative z-[70] w-full max-w-xl bg-gradient-to-b from-[#24170d] via-[#1a1109] to-[#0f0a05] border-2 border-amber-400/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-amber-50 max-h-[90vh] flex flex-col text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-3">
            <GoldenCoinLogo size="xl" showGlow />
            <span className="absolute -bottom-2 -right-2 text-2xl animate-bounce">🎉</span>
          </div>

          <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-amber-400/90">
            {ui.victoryBadge}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 mt-1">
            {ui.victoryFullHeadline}
          </h2>
          {winnerName && (
            <p className="font-heading text-sm sm:text-base text-amber-200/90 mt-1 font-bold">
              🏆 {winnerName}
            </p>
          )}
        </div>

        <div className="relative z-10 my-3 p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-amber-950/80 to-emerald-950/80 border-2 border-amber-400 text-center space-y-1.5 shadow-xl">
          <div className="text-2xs font-black uppercase tracking-wider text-rose-300 flex items-center justify-center gap-1.5">
            <span>{localizedTask.icon}</span>
            <span>{ui.winnerTaskBadge}</span>
            <span>💖</span>
          </div>
          <div className="font-heading font-black text-base sm:text-lg text-amber-100 leading-snug">
            «{localizedTask.task}»
          </div>
        </div>

        <div className="relative z-10 my-2 p-3 rounded-2xl bg-amber-950/50 border border-amber-500/25 grid grid-cols-3 gap-2">
          <div>
            <div className="font-heading text-lg sm:text-xl font-black text-amber-300 tabular-nums">
              +1,000
            </div>
            <div className="text-3xs uppercase tracking-wider text-amber-200/60">{ui.winnerTaskRewardLabel}</div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-xl font-black text-amber-300 tabular-nums">
              Lv. {currentLevel.level}
            </div>
            <div className="text-3xs uppercase tracking-wider text-amber-200/60">{currentLevel.title}</div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-xl font-black text-amber-300 tabular-nums">
              {linesCompleted}
            </div>
            <div className="text-3xs uppercase tracking-wider text-amber-200/60">{ui.linesCountLabel}</div>
          </div>
        </div>

        {collectedStories.length > 0 && (
          <div className="relative z-10 flex-1 overflow-y-auto my-2 p-3 rounded-xl bg-black/40 border border-amber-500/15 text-left space-y-2.5 max-h-48">
            <div className="text-2xs font-bold uppercase tracking-wider text-amber-300/80">
              {ui.victoryStoriesTitle} ({collectedStories.length})
            </div>
            {collectedStories.map((s, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/15 text-xs">
                <div className="font-semibold text-amber-200">{s.text}</div>
                {s.partner && (
                  <div className="text-2xs text-amber-400/90 mt-0.5">
                    {ui.withLabel}: <span className="font-bold">{s.partner}</span>
                  </div>
                )}
                {s.note && (
                  <div className="text-2xs text-amber-100/80 italic mt-0.5">&ldquo;{s.note}&rdquo;</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenShareModal();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-950/70 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-amber-100 font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{ui.victoryShareJoy}</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-heading font-black text-sm rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{ui.victoryPlayNewRound}</span>
            <span>☀️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
