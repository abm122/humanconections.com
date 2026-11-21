/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { RemoteBingoClaim } from '../services/remoteBingo';

interface RemoteBingoClaimModalProps {
  claim: RemoteBingoClaim | null;
  onClose: () => void;
  isHost?: boolean;
  onStartNewRoundNow?: () => void;
}

export const RemoteBingoClaimModal: React.FC<RemoteBingoClaimModalProps> = ({
  claim,
  onClose,
  isHost = false,
  onStartNewRoundNow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(4);

  useEffect(() => {
    if (!claim) return;
    sounds.playBingoWin();

    if (claim.isFullHouse) {
      const initialSec = Math.max(1, Math.ceil((claim.autoNewRoundDelayMs || 4500) / 1000));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2e1708] via-[#1c0d05] to-[#0a0603] border-4 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-2xl text-amber-50 overflow-hidden">
        
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
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold uppercase tracking-widest inline-block mb-2">
              {claim.isFullHouse ? 'Fullbrett Bingo · Ny runde følger' : 'Direktesendt Avstandsbingo'}
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-amber-200 tracking-wide">
              {claim.isFullHouse ? 'FULLBRETT BINGO!' : 'BINGO ROPT!'}
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/40 space-y-2">
            <div className="text-sm text-amber-300 font-bold">
              Spiller som ropte bingo:
            </div>
            <div className="font-heading font-black text-2xl sm:text-3xl text-amber-100 tracking-wide">
              {claim.playerName}
            </div>
            <div className="text-xs text-emerald-400 font-mono font-bold flex items-center justify-center gap-1.5 pt-1">
              <span>🎯 Mønster:</span>
              <span className="bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {claim.pattern}
              </span>
            </div>
          </div>

          {claim.isFullHouse ? (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 text-xs font-black flex items-center justify-center gap-2">
              <span className="animate-spin">🔄</span>
              <span>Ny runde starter automatisk om {countdownSec}s...</span>
            </div>
          ) : (
            <p className="text-xs text-amber-200/80 leading-relaxed">
              {isHost
                ? 'En deltaker har ropt bingo på sin enhet! Kontroller brettet eller start ny runde.'
                : 'En deltaker i dette rommet har oppnådd bingo! Gratulerer!'}
            </p>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {isHost && onStartNewRoundNow ? (
              <button
                onClick={() => {
                  sounds.playLineComplete();
                  onStartNewRoundNow();
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all"
              >
                🔄 Start ny runde nå
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playLineComplete();
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm cursor-pointer shadow-lg transition-all"
              >
                🎉 Gratulerer vinneren!
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer transition-all"
            >
              Lukk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
