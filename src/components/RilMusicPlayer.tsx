/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { sounds, RIL_PAUSE_TRACKS } from '../audio/soundEngine';

interface RilMusicPlayerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const RilMusicPlayer: React.FC<RilMusicPlayerProps> = ({
  className = '',
  variant = 'full',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => sounds.isPauseMusicPlaying());
  const [selectedTrack, setSelectedTrack] = useState<string>(() => sounds.getCurrentPauseTrack());
  const [volume, setVolume] = useState<number>(() => Math.round(sounds.getPauseMusicVolume() * 100));

  useEffect(() => {
    // Keep in sync periodically or on window focus
    const interval = window.setInterval(() => {
      setIsPlaying(sounds.isPauseMusicPlaying());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    sounds.playClick();
    const playing = sounds.togglePauseMusic(selectedTrack);
    setIsPlaying(playing);
  };

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrack = e.target.value;
    setSelectedTrack(newTrack);
    if (isPlaying) {
      sounds.playPauseMusic(newTrack);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    sounds.setPauseMusicVolume(val / 100);
  };

  const activeTrackObj = RIL_PAUSE_TRACKS.find((t) => t.id === selectedTrack) || RIL_PAUSE_TRACKS[0];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 bg-gradient-to-r from-amber-950/80 to-emerald-950/80 p-2 rounded-2xl border border-amber-500/30 text-amber-100 ${className}`}>
        <button
          onClick={handleToggle}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse'
              : 'bg-black/60 text-amber-300 hover:bg-black/80'
          }`}
          title={isPlaying ? 'Stopp pausemusikk' : 'Start pausemusikk'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <select
          value={selectedTrack}
          onChange={handleTrackChange}
          className="bg-black/70 border border-amber-500/40 rounded-xl px-2 py-1.5 text-xs text-amber-200 outline-none focus:border-amber-400 cursor-pointer"
        >
          {RIL_PAUSE_TRACKS.map((track) => (
            <option key={track.id} value={track.id} className="bg-slate-950 text-amber-100">
              {track.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#24170d] via-[#1a1109] to-[#0f0a05] border-2 border-amber-500/40 shadow-xl p-4 sm:p-5 text-amber-50 ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg shadow-md ring-2 ring-white/20">
            🎶
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-sm sm:text-base text-amber-200">
                RIL Pausemusikk
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                Trivsel
              </span>
            </div>
            <p className="text-2xs text-amber-300/80">
              Hyggelig pause- og kaffelyd for lag, foreninger og fellesskap
            </p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-amber-400 animate-pulse rounded-full" />
            <span className="w-1 h-5 bg-amber-300 animate-pulse delay-75 rounded-full" />
            <span className="w-1 h-4 bg-amber-500 animate-pulse delay-150 rounded-full" />
            <span className="w-1 h-2 bg-amber-200 animate-pulse delay-200 rounded-full" />
          </div>
        )}
      </div>

      {/* Track Dropdown Selector */}
      <div className="relative z-10 space-y-2 mb-3">
        <label className="block text-2xs font-black uppercase tracking-wider text-amber-300/80">
          Velg pausemelodi i spillelisten:
        </label>
        <div className="relative">
          <select
            value={selectedTrack}
            onChange={handleTrackChange}
            className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl bg-black/70 border-2 border-amber-500/40 text-xs sm:text-sm font-bold text-amber-100 outline-none focus:border-amber-400 shadow-inner cursor-pointer"
          >
            {RIL_PAUSE_TRACKS.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950 text-amber-100 py-2">
                {track.name} ({track.tempo} BPM)
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Track Description */}
        <div className="text-2xs text-amber-200/70 italic bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/20">
          «{activeTrackObj.description}»
        </div>
      </div>

      {/* Controls & Volume */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
        <button
          onClick={handleToggle}
          className={`px-5 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
            isPlaying
              ? 'bg-gradient-to-r from-rose-500 to-amber-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
              : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-110 ring-1 ring-white/30'
          }`}
        >
          <span className="text-base">{isPlaying ? '⏸️' : '▶️'}</span>
          <span>{isPlaying ? 'Pause Musikk' : 'Start Pausemusikk'}</span>
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <span className="text-xs text-amber-300">🔊</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 sm:w-28 accent-amber-400 cursor-pointer h-1.5 bg-amber-950/80 rounded-lg"
            title={`Lydstyrke: ${volume}%`}
          />
          <span className="text-2xs font-mono text-amber-300/80 w-7 text-right">{volume}%</span>
        </div>
      </div>
    </div>
  );
};
