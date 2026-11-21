/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CalledBall } from '../types/bingo';
import { sounds } from '../audio/soundEngine';
import { progression } from '../services/progression';
import { useTranslation } from '../services/i18n';

interface BallCageCanvasProps {
  onBallDrawn?: (ball: CalledBall) => void;
  calledBalls: CalledBall[];
  uncalledBalls: CalledBall[];
  isAutoCalling: boolean;
  onToggleAuto: () => void;
  onOpenMixer?: () => void;
  onOpenAudience?: () => void;
  onScramble?: () => void;
  onRefillDrum?: () => void;
  scrambleTrigger?: number;
  onPause?: () => void;
  isPaused?: boolean;
  canDraw?: boolean;
  readOnlyMessage?: string;
  compactSidebar?: boolean;
}

interface PhysicsBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  letter: string;
  number: number;
}

export const BallCageCanvas: React.FC<BallCageCanvasProps> = ({
  onBallDrawn,
  calledBalls,
  uncalledBalls,
  isAutoCalling,
  onToggleAuto,
  onOpenMixer,
  onOpenAudience,
  onScramble,
  onRefillDrum,
  scrambleTrigger,
  onPause,
  isPaused = false,
  canDraw = true,
  readOnlyMessage = '🔒 Kun arrangør styrer kuletrekningen',
  compactSidebar = false,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [currentBall, setCurrentBall] = useState<CalledBall | null>(
    calledBalls.length > 0 ? calledBalls[calledBalls.length - 1] : null
  );

  // Keep ref to latest props for 60fps render loop
  const uncalledRef = useRef(uncalledBalls);
  uncalledRef.current = uncalledBalls;
  const onBallDrawnRef = useRef(onBallDrawn);
  onBallDrawnRef.current = onBallDrawn;

  const cageStateRef = useRef({
    angle: 0,
    angularVel: 0.02,
    isDrawing: false,
    drawProgress: 0,
    exitBall: null as CalledBall | null,
    isDragging: false,
    lastMouseAngle: 0,
    lastTime: 0,
  });

  const ballsRef = useRef<PhysicsBall[]>([]);

  // Initialize tumbling balls in cage
  useEffect(() => {
    const balls: PhysicsBall[] = [];
    const colors = ['#0284c7', '#7c3aed', '#059669', '#d97706', '#e11d48'];
    const letters = ['B', 'I', 'N', 'G', 'O'];

    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      balls.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 9 + Math.random() * 2,
        color: colors[i % colors.length],
        letter: letters[i % 5],
        number: (i % 75) + 1,
      });
    }
    ballsRef.current = balls;
  }, []);

  // Update current ball display when calledBalls changes from outside
  useEffect(() => {
    if (calledBalls.length > 0) {
      setCurrentBall(calledBalls[calledBalls.length - 1]);
    } else {
      setCurrentBall(null);
    }
  }, [calledBalls]);

  const lastScrambleTriggerRef = useRef(0);
  const onScrambleRef = useRef(onScramble);
  useEffect(() => {
    onScrambleRef.current = onScramble;
  }, [onScramble]);

  // Robust Ball Scramble & Agitation action
  const scrambleBalls = useCallback((intensity = 1.0, notifyParent = true) => {
    if (notifyParent && !canDraw) return;
    setIsScrambling(true);
    sounds.playCageTumble(1.5);
    progression.recordMixerAgitate();

    const state = cageStateRef.current;
    // Boost angular velocity for rapid tumble
    state.angularVel = Math.min(0.65, 0.35 + intensity * 0.25);

    // Apply explosive scattering impulse to all balls
    ballsRef.current.forEach((b) => {
      const scatterAngle = Math.random() * Math.PI * 2;
      const speed = (12 + Math.random() * 16) * intensity;
      b.vx = Math.cos(scatterAngle) * speed;
      b.vy = Math.sin(scatterAngle) * speed - 6; // pop upward
    });

    if (notifyParent && onScrambleRef.current) {
      onScrambleRef.current();
    }

    setTimeout(() => {
      setIsScrambling(false);
    }, 1200);
  }, [canDraw]);

  // Listen to external scramble trigger (e.g. from Mixer Console)
  useEffect(() => {
    if (scrambleTrigger && scrambleTrigger > 0 && scrambleTrigger !== lastScrambleTriggerRef.current) {
      lastScrambleTriggerRef.current = scrambleTrigger;
      scrambleBalls(1.2, false);
    }
  }, [scrambleTrigger, scrambleBalls]);

  const drawNextBall = () => {
    if (!canDraw) return;
    if (cageStateRef.current.isDrawing || uncalledRef.current.length === 0) return;

    setIsSpinning(true);
    const state = cageStateRef.current;
    state.isDrawing = true;
    state.angularVel = 0.45; // Rapid spin
    state.drawProgress = 0;

    // Pick random uncalled ball
    const randomIndex = Math.floor(Math.random() * uncalledRef.current.length);
    const chosen = uncalledRef.current[randomIndex];
    state.exitBall = chosen;

    // Give tumbling balls extra push
    ballsRef.current.forEach((b) => {
      b.vx += (Math.random() - 0.5) * 12;
      b.vy -= 6 + Math.random() * 8;
    });

    sounds.playCageTumble(1.3);

    // After quick spin and chute animation, finalize ball drop and trigger callback
    setTimeout(() => {
      sounds.playBallDrop();
      sounds.speakBall(chosen.letter, chosen.number, chosen.affirmation);
      setCurrentBall(chosen);
      if (onBallDrawnRef.current) {
        onBallDrawnRef.current(chosen);
      }
      setIsSpinning(false);
      state.isDrawing = false;
      state.drawProgress = 1.0;
    }, 1000);
  };

  // Interactive mouse/touch drag to spin crank & scramble
  const getMouseAngle = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const cx = rect.left + rect.width * 0.44;
    const cy = rect.top + rect.height * 0.48;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    pointerStartRef.current = { x: clientX, y: clientY, time: Date.now() };

    const angle = getMouseAngle(e);
    cageStateRef.current.isDragging = true;
    cageStateRef.current.lastMouseAngle = angle;
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw || !cageStateRef.current.isDragging) return;
    const currentAngle = getMouseAngle(e);
    let delta = currentAngle - cageStateRef.current.lastMouseAngle;

    // Normalize delta wrap-around
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

    cageStateRef.current.angle += delta;
    // Drag imparts rotational velocity
    cageStateRef.current.angularVel = Math.min(0.5, Math.max(-0.5, delta * 3.5));
    cageStateRef.current.lastMouseAngle = currentAngle;

    // Impart drag force to balls
    ballsRef.current.forEach((b) => {
      b.vx += -Math.sin(currentAngle) * delta * 15;
      b.vy += Math.cos(currentAngle) * delta * 15;
    });
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw) {
      cageStateRef.current.isDragging = false;
      return;
    }
    if (cageStateRef.current.isDragging) {
      cageStateRef.current.isDragging = false;
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : ('clientX' in e ? e.clientX : 0);
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : ('clientY' in e ? e.clientY : 0);
      const dist = Math.hypot(clientX - pointerStartRef.current.x, clientY - pointerStartRef.current.y);
      const elapsed = Date.now() - pointerStartRef.current.time;

      // If clicked or tapped directly on the cage without extensive dragging, roll/draw ball immediately!
      if (dist < 24 && elapsed < 600) {
        if (!isSpinning && uncalledRef.current.length > 0) {
          sounds.playPop(1.1);
          drawNextBall();
          return;
        } else if (uncalledRef.current.length === 0) {
          scrambleBalls(1.3);
        }
      }

      // If dragged fast, play tumble sound
      if (Math.abs(cageStateRef.current.angularVel) > 0.08) {
        sounds.playCageTumble(1.2);
      }
    }
  };

  // 60 FPS Canvas Physics & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;

    const render = (time: number) => {
      if (!lastTime) lastTime = time;
      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.04);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w * 0.44;
      const centerY = h * 0.48;
      const cageRadius = 90;

      // Update cage angle
      const state = cageStateRef.current;
      if (!state.isDragging) {
        state.angle += state.angularVel * (dt * 60);

        // Natural drag deceleration toward idle spin
        if (state.angularVel > 0.02) {
          state.angularVel *= 0.965;
          if (state.angularVel < 0.02) state.angularVel = 0.02;
        } else if (state.angularVel < -0.02) {
          state.angularVel *= 0.965;
          if (state.angularVel > -0.02) state.angularVel = 0.02;
        }
      }

      // Animate drawProgress if drawing
      if (state.isDrawing) {
        state.drawProgress = Math.min(1.0, state.drawProgress + dt * 1.15);
      }

      // Physics update for tumbling balls inside cage
      const balls = ballsRef.current;
      const gravity = 0.38;
      const omega = state.angularVel;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        // 1. Gravity pulls downward
        b.vy += gravity * (dt * 60);

        // 2. Rotational swirling along tangent
        const distFromCenter = Math.sqrt(b.x * b.x + b.y * b.y);
        const maxDist = cageRadius - b.radius - 3;

        const vTanX = -omega * b.y * 1.8;
        const vTanY = omega * b.x * 1.8;

        if (distFromCenter > maxDist * 0.55) {
          const gripFactor = Math.min(0.25, ((distFromCenter - maxDist * 0.55) / (maxDist * 0.45)) * 0.22);
          b.vx += (vTanX - b.vx) * gripFactor;
          b.vy += (vTanY - b.vy) * gripFactor;
        }

        // 3. Soft ball-to-ball repulsion
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          const dx = b2.x - b.x;
          const dy = b2.y - b.y;
          const minDist = b.radius + b2.radius;
          const distSq = dx * dx + dy * dy;

          if (distSq < minDist * minDist && distSq > 0.001) {
            const d = Math.sqrt(distSq);
            const overlap = (minDist - d) * 0.45;
            const nx = dx / d;
            const ny = dy / d;

            b.x -= nx * overlap;
            b.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            const relativeVelocity = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
            if (relativeVelocity > 0) {
              b.vx -= relativeVelocity * nx * 0.5;
              b.vy -= relativeVelocity * ny * 0.5;
              b2.vx += relativeVelocity * nx * 0.5;
              b2.vy += relativeVelocity * ny * 0.5;
            }
          }
        }

        // Apply velocities with damping
        b.x += b.vx * (dt * 60);
        b.y += b.vy * (dt * 60);
        b.vx *= 0.99;
        b.vy *= 0.99;

        // Constrain to spherical cage boundary
        const curDist = Math.sqrt(b.x * b.x + b.y * b.y);
        if (curDist > maxDist) {
          const nx = b.x / curDist;
          const ny = b.y / curDist;
          b.x = nx * maxDist;
          b.y = ny * maxDist;

          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 1.55 * dot * nx) * 0.72;
          b.vy = (b.vy - 1.55 * dot * ny) * 0.72;
        }
      }

      // 1. Draw Brass Stand & Base
      ctx.save();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      // Stand legs
      ctx.moveTo(centerX - 95, centerY + 105);
      ctx.lineTo(centerX - 40, centerY);
      ctx.lineTo(centerX + 40, centerY);
      ctx.lineTo(centerX + 95, centerY + 105);
      ctx.stroke();

      // Base bar
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(centerX - 110, centerY + 105);
      ctx.lineTo(centerX + 110, centerY + 105);
      ctx.stroke();

      // Ball Chute rail leading to right
      const chuteStartX = centerX + 18;
      const chuteStartY = centerY + 65;
      const chuteCtrlX = centerX + 80;
      const chuteCtrlY = centerY + 85;
      const chuteEndX = centerX + 130;
      const chuteEndY = centerY + 88;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(chuteStartX, chuteStartY);
      ctx.quadraticCurveTo(chuteCtrlX, chuteCtrlY, chuteEndX, chuteEndY);
      ctx.stroke();

      // Catcher cup / cradle
      ctx.beginPath();
      ctx.arc(chuteEndX, chuteEndY + 3, 16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();

      // 2. Draw Balls Inside Cage (behind front cage wires)
      ctx.save();
      ctx.translate(centerX, centerY);

      balls.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          b.x - b.radius * 0.3,
          b.y - b.radius * 0.3,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, b.color);
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fill();

        // Small ball number dot
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.number), b.x, b.y);
      });
      ctx.restore();

      // 3. Draw Rotating Wire Cage & Agitator Fins
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer golden cage ring
      ctx.beginPath();
      ctx.arc(0, 0, cageRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner wire ribs (rotating with cage angle)
      const numRibs = 14;
      for (let i = 0; i < numRibs; i++) {
        const ribAngle = state.angle + (i * Math.PI) / (numRibs / 2);
        const cos = Math.cos(ribAngle);

        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(cos) * cageRadius, cageRadius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = cos > 0 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.25)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Horizontal latitude wire rings
      [-50, -25, 0, 25, 50].forEach((offsetY) => {
        const rAtY = Math.sqrt(Math.max(0, cageRadius * cageRadius - offsetY * offsetY));
        ctx.beginPath();
        ctx.ellipse(0, offsetY, rAtY, rAtY * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Internal Agitator paddle blade
      ctx.save();
      ctx.rotate(state.angle);
      ctx.beginPath();
      ctx.moveTo(-50, -6);
      ctx.lineTo(50, 6);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // Center brass hub & handle
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#d97706';
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crank handle turning
      const handleLen = 52;
      const hx = Math.cos(state.angle) * handleLen;
      const hy = Math.sin(state.angle) * handleLen;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hx, hy, 8, 0, Math.PI * 2);
      ctx.fillStyle = state.isDragging ? '#fef08a' : '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // 4. Draw Exiting / Active Ball on Chute into Catcher
      const activeBallToDraw = state.isDrawing ? state.exitBall : (currentBall || state.exitBall);
      if (activeBallToDraw) {
        const tProgress = state.isDrawing ? state.drawProgress : 1.0;
        const u = 1 - tProgress;
        const tt = tProgress * tProgress;
        const uu = u * u;
        const ut2 = 2 * u * tProgress;
        const ballX = uu * chuteStartX + ut2 * chuteCtrlX + tt * chuteEndX;
        const ballY = uu * chuteStartY + ut2 * chuteCtrlY + tt * chuteEndY - 13;
        const ballR = 14;

        ctx.save();
        ctx.shadowColor = activeBallToDraw.color || '#f59e0b';
        ctx.shadowBlur = 16;

        ctx.beginPath();
        ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          ballX - ballR * 0.35,
          ballY - ballR * 0.35,
          ballR * 0.1,
          ballX,
          ballY,
          ballR
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, activeBallToDraw.color || '#f59e0b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Letter & Number text
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeBallToDraw.letter, ballX, ballY - 3.5);
        ctx.font = '900 10px sans-serif';
        ctx.fillText(String(activeBallToDraw.number), ballX, ballY + 4.5);

        ctx.restore();
      }

      // 5. Draw Top Status Banner on the Canvas
      ctx.save();
      ctx.fillStyle = 'rgba(15, 9, 4, 0.85)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(10, 8, 220, 26, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (state.isDrawing) {
        ctx.fillText('🌪️ Blenderen virvler...', 18, 21);
      } else if (currentBall) {
        ctx.fillText(`🎲 ${currentBall.letter}-${currentBall.number}: "${currentBall.affirmation.slice(0, 18)}"`, 18, 21);
      } else if (!canDraw) {
        ctx.fillText('⏳ Venter på arrangør', 18, 21);
      } else {
        ctx.fillText('🎲 Klar for terningkast', 18, 21);
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentBall, canDraw]);

  // Handle auto caller interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (canDraw && isAutoCalling && uncalledBalls.length > 0) {
      timer = setInterval(() => {
        drawNextBall();
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [canDraw, isAutoCalling, uncalledBalls.length]);

  return (
    <div
      className={`relative flex flex-col items-center bg-amber-950/45 border border-amber-500/25 rounded-2xl backdrop-blur-md shadow-2xl w-full overflow-hidden ${
        compactSidebar ? 'p-3' : 'p-4'
      }`}
    >
      {/* Cage Canvas & Drawn Ball display */}
      <div
        className={`flex w-full items-center justify-between ${
          compactSidebar
            ? 'flex-col sm:flex-row gap-2.5'
            : 'flex-col md:flex-row gap-4'
        }`}
      >
        {/* Interactive 60fps Cage Canvas with Drag to Spin Handle */}
        <div className="relative group shrink-0">
          <canvas
            ref={canvasRef}
            width={340}
            height={260}
            className={`${canDraw ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} touch-none select-none rounded-xl block ${
              compactSidebar ? 'w-[205px] h-[157px]' : 'max-w-full h-auto'
            }`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            title={
              canDraw
                ? "Trykk eller dra for å rulle trommelen"
                : "Kun arrangøren trekker kulene fra trommelen"
            }
          />
          <div
            className={`absolute top-1.5 left-2 rounded-full bg-black/80 border border-amber-400/60 text-amber-200 font-bold pointer-events-none shadow flex items-center gap-1 ${
              compactSidebar ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            }`}
          >
            {canDraw ? (
              <>
                <span>🎲</span>
                <span>{compactSidebar ? 'Trykk/dra for å rulle' : 'Trykk eller dra for å rulle trommelen'}</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Arrangør styrer trekk</span>
              </>
            )}
          </div>
          <div
            className={`absolute bottom-1.5 left-2 text-amber-200/85 font-mono font-bold pointer-events-none bg-black/65 px-2 py-0.5 rounded-md border border-amber-500/20 ${
              compactSidebar ? 'text-[10px]' : 'text-xs'
            }`}
          >
            {uncalledBalls.length > 0 ? `${uncalledBalls.length} kuler igjen` : 'Alle 75 kuler trukket'}
          </div>
        </div>

        {/* Big Spotlight on Current Drawn Ball */}
        <div
          className={`flex flex-col items-center justify-center min-w-0 w-full ${
            compactSidebar ? 'p-1.5 flex-1' : 'p-3 md:min-w-[210px] max-w-xs'
          }`}
        >
          <div
            className={`uppercase font-mono font-bold tracking-wider text-amber-300/80 mb-1 flex items-center gap-1 text-center ${
              compactSidebar ? 'text-[9px]' : 'text-[10px] mb-1.5 gap-1.5'
            }`}
          >
            <span>🎲</span>
            <span>{compactSidebar ? 'Siste tall & ord' : 'Siste tall & ord fra blenderen'}</span>
          </div>

          {currentBall ? (
            <div className="flex flex-col items-center animate-glow w-full">
              {/* Ball Sphere with Radiant Gradient */}
              <div
                className={`rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white/80 transition-transform duration-300 transform hover:scale-105 ${
                  compactSidebar ? 'w-16 h-16' : 'w-24 h-24'
                }`}
                style={{
                  background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentBall.color} 55%, #0f172a 100%)`,
                  boxShadow: `0 0 30px ${currentBall.color}88, inset 0 -4px 10px rgba(0,0,0,0.5)`,
                }}
              >
                <span
                  className={`font-black tracking-widest text-white/90 drop-shadow ${
                    compactSidebar ? 'text-[10px]' : 'text-sm'
                  }`}
                >
                  {currentBall.letter}
                </span>
                <span
                  className={`font-extrabold text-white tabular-nums drop-shadow-md leading-none ${
                    compactSidebar ? 'text-xl' : 'text-3xl'
                  }`}
                >
                  {currentBall.number}
                </span>
              </div>

              {/* Joyful Affirmation Callout */}
              <div className="mt-1.5 text-center w-full px-1">
                <span
                  className={`text-amber-300 font-heading font-black tracking-tight block leading-snug ${
                    compactSidebar ? 'text-sm' : 'text-base sm:text-lg'
                  }`}
                >
                  &ldquo;{currentBall.affirmation}&rdquo;
                </span>
                <span className="text-[10px] text-amber-100/75 font-mono mt-0.5 block">
                  Kule #{calledBalls.length}/75 ({currentBall.letter}-{currentBall.number})
                </span>
              </div>

              {/* Recent History Tray */}
              {calledBalls.length > 1 && (
                <div className="mt-1.5 pt-1.5 border-t border-amber-500/20 w-full flex flex-wrap items-center justify-center gap-1">
                  <span className="text-[9px] text-amber-300/60 uppercase font-mono">Før:</span>
                  {calledBalls
                    .slice(0, -1)
                    .slice(-3)
                    .reverse()
                    .map((b, idx) => (
                      <span
                        key={`${b.letter}-${b.number}-${idx}`}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-200 bg-black/50 border border-amber-500/20"
                        title={b.affirmation}
                      >
                        {b.letter}-{b.number}
                      </span>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center text-center border border-dashed border-amber-500/30 rounded-xl bg-amber-950/20 w-full ${
                compactSidebar ? 'p-3' : 'p-5'
              }`}
            >
              <div
                className={`rounded-full border-2 border-amber-400/40 flex items-center justify-center text-amber-300/60 mb-1.5 ${
                  compactSidebar ? 'w-10 h-10' : 'w-14 h-14 mb-2'
                }`}
              >
                <span className={compactSidebar ? 'text-base font-bold' : 'text-xl font-bold'}>?</span>
              </div>
              <p className="text-xs text-amber-200/90 font-bold">
                {canDraw ? 'Blenderen er klar' : 'Venter på arrangør'}
              </p>
              <p className="text-[10px] text-amber-300/60 mt-0.5">
                {canDraw
                  ? 'Rist eller trykk trekk for å starte'
                  : 'Arrangøren trekker kulene'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons: Only Host can Draw, Refill Drum, Scramble/Agitate, Auto-Roll, Mixer & Audience */}
      {canDraw ? (
        <div
          className={`flex flex-wrap items-center justify-center w-full border-t border-amber-500/15 ${
            compactSidebar ? 'gap-1.5 mt-2 pt-2.5' : 'gap-2 sm:gap-2.5 mt-2 pt-3'
          }`}
        >
          {uncalledBalls.length === 0 && onRefillDrum ? (
            <button
              type="button"
              onClick={() => {
                sounds.playPop(1.2);
                onRefillDrum();
                scrambleBalls(1.3, false);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 hover:brightness-110 active:scale-95 text-slate-950 font-heading font-black rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer ring-2 ring-emerald-200 animate-pulse"
              title="Fyll og bland alle 75 kuler i trommelen på nytt uten å nullstille spillernes bingokort"
            >
              <span>🔄</span>
              <span>Bland trommelen på nytt (behold brett)</span>
            </button>
          ) : (
            <button
              onClick={drawNextBall}
              disabled={isSpinning || uncalledBalls.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-heading font-black rounded-xl shadow-lg shadow-amber-900/40 transition-all flex items-center gap-2 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSpinning ? 'Virvler...' : '🎲 Trekk kule / Terningkast'}
            </button>
          )}

          {/* Dedicated Scramble / Tumble Balls Button */}
          <button
            onClick={() => scrambleBalls(1.2)}
            disabled={isSpinning}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
              isScrambling
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 animate-pulse'
                : 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 border border-amber-400/50 hover:border-amber-300 text-amber-200 hover:text-white'
            }`}
            title="Scramble & Agitate Balls inside the tumbler (Hotkey: S)"
          >
            <span className={isScrambling ? 'animate-spin' : ''}>🌪️</span>
            <span>{isScrambling ? t('auto_calling_active') : t('scramble_cage')}</span>
          </button>

          {/* Auto Roll */}
          <button
            onClick={onToggleAuto}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              isAutoCalling
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-amber-950/60 border-amber-500/30 text-amber-200 hover:bg-amber-900/40'
            }`}
          >
            {isAutoCalling ? `${t('auto_calling')} (5s)` : `${t('auto_calling')} (5s)`}
          </button>

          {/* Pause/Fortsett-knapp plassert rett ved trommelen */}
          {onPause && (
            <button
              onClick={() => {
                sounds.playClick();
                onPause();
              }}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                isPaused
                  ? 'bg-rose-500 text-white ring-2 ring-rose-300 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500/25 to-amber-600/25 border border-amber-400/50 hover:bg-amber-500/40 text-amber-200 hover:text-white'
              }`}
              title="Pause eller fortsett spillet (fryser også spilletid)"
            >
              <span>{isPaused ? '▶️' : '⏸️'}</span>
              <span>{isPaused ? 'Fortsett' : 'Pause'}</span>
            </button>
          )}

          {onOpenMixer && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenMixer();
              }}
              className="px-3 py-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-amber-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Mixer & Cage Controls"
            >
              <span>🎛️</span>
              <span>{t('mixer')}</span>
            </button>
          )}

          {onOpenAudience && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAudience();
              }}
              className="px-3 py-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-amber-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Show Audience TV / Projector Display"
            >
              <span>📺</span>
              <span>{t('audience_tv')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 w-full pt-3 border-t border-amber-500/15 flex items-center justify-center">
          <div className="px-4 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center gap-2">
            <span>{readOnlyMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
