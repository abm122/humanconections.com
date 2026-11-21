/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'square' | 'heart' | 'star';
}

export interface ParticleCanvasHandle {
  burst: (x: number, y: number, count?: number, palette?: string[]) => void;
  celebrateBingo: () => void;
  triggerScreenShake: (intensity?: number) => void;
}

const GOLD_PALETTE = ['#f59e0b', '#fbbf24', '#fef08a', '#fb7185', '#38bdf8', '#34d399', '#a78bfa'];

export const ParticleCanvas = React.forwardRef<ParticleCanvasHandle, { className?: string }>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const ambientOrbsRef = useRef<{ x: number; y: number; r: number; alpha: number; vy: number; vx: number }[]>([]);
    const shakeRef = useRef<{ amount: number; decay: number }>({ amount: 0, decay: 0.9 });
    const animIdRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    const burst = (x: number, y: number, count = 28, palette = GOLD_PALETTE) => {
      const shapes: ('circle' | 'square' | 'heart' | 'star')[] = ['circle', 'square', 'star', 'heart'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 7.5;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 4 + Math.random() * 8,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 1,
          decay: 0.012 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
    };

    const triggerScreenShake = (intensity = 6) => {
      shakeRef.current.amount = intensity;
    };

    const celebrateBingo = () => {
      triggerScreenShake(12);
      if (!canvasRef.current) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      // Burst from multiple festive points
      const points = [
        { x: w * 0.2, y: h * 0.4 },
        { x: w * 0.5, y: h * 0.3 },
        { x: w * 0.8, y: h * 0.4 },
        { x: w * 0.35, y: h * 0.6 },
        { x: w * 0.65, y: h * 0.6 },
      ];

      points.forEach((pt, idx) => {
        setTimeout(() => {
          burst(pt.x, pt.y, 45);
        }, idx * 120);
      });
    };

    React.useImperativeHandle(ref, () => ({
      burst,
      celebrateBingo,
      triggerScreenShake,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Initialize gentle ambient golden floating orbs
        if (ambientOrbsRef.current.length === 0) {
          const orbs = [];
          for (let i = 0; i < 24; i++) {
            orbs.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              r: 1.5 + Math.random() * 4,
              alpha: 0.2 + Math.random() * 0.45,
              vy: -(0.2 + Math.random() * 0.4),
              vx: (Math.random() - 0.5) * 0.2,
            });
          }
          ambientOrbsRef.current = orbs;
        }
      };

      resize();
      window.addEventListener('resize', resize);

      const loop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const rawDt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        // Clamp delta time to avoid huge leaps if tab was unfocused
        const dt = Math.min(rawDt, 0.05);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply camera shake if active
        ctx.save();
        if (shakeRef.current.amount > 0.1) {
          const sx = (Math.random() - 0.5) * shakeRef.current.amount * 2;
          const sy = (Math.random() - 0.5) * shakeRef.current.amount * 2;
          ctx.translate(sx, sy);
          shakeRef.current.amount *= shakeRef.current.decay;
        }

        // Draw ambient bokeh floating embers
        ctx.save();
        for (const orb of ambientOrbsRef.current) {
          orb.y += orb.vy * (dt * 60);
          orb.x += orb.vx * (dt * 60);
          if (orb.y < -10) orb.y = canvas.height + 10;
          if (orb.x < -10) orb.x = canvas.width + 10;
          if (orb.x > canvas.width + 10) orb.x = -10;

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${orb.alpha})`;
          ctx.fill();
        }
        ctx.restore();

        // Update & render active celebration particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx * (dt * 60);
          p.y += p.vy * (dt * 60);
          p.vy += 0.18 * (dt * 60); // gravity
          p.vx *= 0.985;
          p.rotation += p.vRot;
          p.alpha -= p.decay * (dt * 60);

          if (p.alpha <= 0 || p.y > canvas.height + 20) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'square') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else if (p.shape === 'star') {
            // Draw a neat 4-point golden star
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
          } else if (p.shape === 'heart') {
            // Little joyful heart
            const s = p.size * 0.7;
            ctx.beginPath();
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(-s, -s * 0.8, -s * 1.4, s * 0.3, 0, s * 1.2);
            ctx.bezierCurveTo(s * 1.4, s * 0.3, s, -s * 0.8, 0, s * 0.3);
            ctx.fill();
          }
          ctx.restore();
        }

        ctx.restore();
        animIdRef.current = requestAnimationFrame(loop);
      };

      animIdRef.current = requestAnimationFrame(loop);

      return () => {
        window.removeEventListener('resize', resize);
        if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`pointer-events-none fixed inset-0 z-40 ${className}`}
      />
    );
  }
);

ParticleCanvas.displayName = 'ParticleCanvas';
