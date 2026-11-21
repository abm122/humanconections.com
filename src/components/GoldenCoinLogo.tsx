/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';

interface GoldenCoinLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const GoldenCoinLogo: React.FC<GoldenCoinLogoProps> = ({
  className = '',
  size = 'md',
  showGlow = false,
  onClick,
}) => {
  const uid = useId().replace(/:/g, '');
  const bgGradId = `hug-bg-${uid}`;
  const heartGradId = `hug-heart-${uid}`;
  const clipId = `hug-clip-${uid}`;

  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      role="img"
      aria-label="Human-connection Klem-symbol"
      title="Human-connection — Enjoy Bingo · Enjoy Together"
      onClick={onClick}
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-amber-300/90 ${selectedSize} ${className} ${
        showGlow ? 'shadow-[0_0_24px_rgba(245,158,11,0.55)] animate-glow' : 'shadow-md'
      } ${onClick ? 'cursor-pointer select-none active:scale-95 transition-transform' : ''}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full block" aria-hidden="true">
        <defs>
          <radialGradient id={bgGradId} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="48%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          <linearGradient id={heartGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="55%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        {/* Warm circular medallion backdrop */}
        <circle cx="50" cy="50" r="49" fill={`url(#${bgGradId})`} />
        <circle
          cx="50"
          cy="50"
          r="45.5"
          fill="none"
          stroke="#fef9c3"
          strokeWidth="1.5"
          opacity="0.65"
        />

        <g clipPath={`url(#${clipId})`}>
          {/* Soft warm aura behind the embrace */}
          <circle cx="50" cy="48" r="28" fill="#fef3c7" opacity="0.28" />

          {/* Left person torso */}
          <path
            d="M 16 94 C 17 62, 26 44, 41 44 C 48 44, 52 50, 52 61 L 52 94 Z"
            fill="#fffbeb"
            stroke="#78350f"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Right person torso */}
          <path
            d="M 84 94 C 83 62, 74 44, 59 44 C 52 44, 48 50, 48 61 L 48 94 Z"
            fill="#fed7aa"
            stroke="#78350f"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Left person head */}
          <circle
            cx="37"
            cy="31"
            r="9.5"
            fill="#fffbeb"
            stroke="#78350f"
            strokeWidth="2.4"
          />

          {/* Right person head */}
          <circle
            cx="63"
            cy="31"
            r="9.5"
            fill="#fed7aa"
            stroke="#78350f"
            strokeWidth="2.4"
          />

          {/* Upper hugging arm (left figure wrapping warmly across right figure's shoulders) */}
          <path
            d="M 27 51 C 40 40, 61 40, 73 51"
            fill="none"
            stroke="#78350f"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M 27 51 C 40 40, 61 40, 73 51"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="8.4"
            strokeLinecap="round"
          />

          {/* Lower hugging arm (right figure wrapping warmly around left figure's side) */}
          <path
            d="M 73 67 C 60 77, 40 77, 27 67"
            fill="none"
            stroke="#78350f"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M 73 67 C 60 77, 40 77, 27 67"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="8.4"
            strokeLinecap="round"
          />

          {/* Glowing heart nestled right at the center of the hug */}
          <path
            d="M 50 67 C 50 67, 37 59.5, 37 51.8 C 37 47.4, 40.6 44.5, 44.6 44.5 C 47.2 44.5, 49.1 46, 50 47.8 C 50.9 46, 52.8 44.5, 55.4 44.5 C 59.4 44.5, 63 47.4, 63 51.8 C 63 59.5, 50 67, 50 67 Z"
            fill={`url(#${heartGradId})`}
            stroke="#fffbeb"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse
            cx="43.5"
            cy="50.5"
            rx="2.3"
            ry="1.5"
            transform="rotate(-25 43.5 50.5)"
            fill="#fff1f2"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};
