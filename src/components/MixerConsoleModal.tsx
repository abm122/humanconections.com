import React, { useState } from 'react';
import { CalledBall } from '../types/bingo';
import { sounds } from '../audio/soundEngine';

interface MixerConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAgitateMix: (speed: number) => void;
  onShuffleBalls: () => void;
  onRefillDrum?: () => void;
  ballsRemaining: number;
  calledBalls?: CalledBall[];
  currentBall?: CalledBall | null;
  onDrawBall?: () => void;
}

export const MixerConsoleModal: React.FC<MixerConsoleModalProps> = ({
  isOpen,
  onClose,
  onTriggerAgitateMix,
  onShuffleBalls,
  onRefillDrum,
  ballsRemaining,
  calledBalls = [],
  currentBall = null,
  onDrawBall,
}) => {
  // Audio Mixer Channels
  const [masterVol, setMasterVol] = useState(sounds.getMasterVolume());
  const [sfxVol, setSfxVol] = useState(sounds.getSfxVolume());
  const [ambientVol, setAmbientVol] = useState(sounds.getAmbientVolume());
  const [speechVol, setSpeechVol] = useState(sounds.getSpeechVolume());
  const [speechRate, setSpeechRate] = useState(sounds.getSpeechRate());
  const [isSpeechOn, setIsSpeechOn] = useState(sounds.getSpeechEnabled());

  // Physical Mixer speed settings
  const [mixSpeed, setMixSpeed] = useState<number>(50); // 20 to 100
  const [isAgitating, setIsAgitating] = useState(false);

  if (!isOpen) return null;

  const handleMasterChange = (v: number) => {
    setMasterVol(v);
    sounds.setMasterVolume(v);
  };

  const handleSfxChange = (v: number) => {
    setSfxVol(v);
    sounds.setSfxVolume(v);
  };

  const handleAmbientChange = (v: number) => {
    setAmbientVol(v);
    sounds.setAmbientVolume(v);
  };

  const handleSpeechChange = (v: number) => {
    setSpeechVol(v);
    sounds.setSpeechVolume(v);
  };

  const handleRateChange = (r: number) => {
    setSpeechRate(r);
    sounds.setSpeechRate(r);
  };

  const handleToggleSpeech = () => {
    const next = !isSpeechOn;
    setIsSpeechOn(next);
    sounds.setSpeechEnabled(next);
  };

  const handleQuickAgitate = (multiplier: number = 1.0) => {
    setIsAgitating(true);
    sounds.playCageTumble(1.4);
    onTriggerAgitateMix(mixSpeed * multiplier);
    setTimeout(() => setIsAgitating(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#191109] border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 text-amber-50 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-amber-200">
                Joy Mixer & Cage Control Station
              </h2>
              <p className="text-2xs text-amber-300/60 font-medium">
                Physical ball agitation, spin physics, sound levels & atmosphere mixer
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 rounded-xl cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Mixer Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* SECTION 0: AKTIV KULE & ORD I BLENDEREN (TERNINGKAST) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 via-black/80 to-amber-950/60 border-2 border-amber-400/50 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎲</span>
                <div>
                  <h3 className="font-heading font-black text-sm text-amber-200">
                    Aktiv Kule & Ord i Blenderen
                  </h3>
                  <p className="text-[11px] text-amber-300/60 font-medium">
                    Trukket ball, tall og gledesord fra trommelen
                  </p>
                </div>
              </div>

              {ballsRemaining === 0 && onRefillDrum ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop(1.2);
                    onRefillDrum();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔄</span>
                  <span>Bland trommel på nytt (75 kuler)</span>
                </button>
              ) : onDrawBall ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onDrawBall();
                  }}
                  disabled={ballsRemaining === 0}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>🎲</span>
                  <span>Terningkast / Trekk Kule</span>
                </button>
              ) : null}
            </div>

            {/* Current Ball Spotlight */}
            {currentBall ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-black/60 border border-amber-500/30">
                <div
                  className="w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-white shadow-xl border-2 border-white/80 shrink-0 transform hover:scale-105 transition-transform"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentBall.color || '#f59e0b'} 55%, #0f172a 100%)`,
                    boxShadow: `0 0 24px ${currentBall.color || '#f59e0b'}88`,
                  }}
                >
                  <span className="text-[11px] leading-none opacity-90">{currentBall.letter}</span>
                  <span className="text-2xl leading-none font-black">{currentBall.number}</span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                      {currentBall.letter}-{currentBall.number}
                    </span>
                    <span className="text-2xs text-amber-300/60">
                      Kule #{calledBalls.length} av 75
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-heading font-extrabold text-amber-100 mt-1 leading-snug">
                    &ldquo;{currentBall.affirmation}&rdquo;
                  </h4>
                  <p className="text-[11px] text-amber-300/70 mt-0.5">
                    Spillerne skanner kortene sine og bekrefter dette tallet eller ordet fysisk!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-black/40 border border-dashed border-amber-500/30 text-center">
                <p className="text-xs text-amber-200/80 font-medium">
                  Ingen kule er trukket fra blenderen ennå.
                </p>
                <p className="text-2xs text-amber-300/60 mt-1">
                  Trykk på &ldquo;Terningkast / Trekk Kule&rdquo; for å rulle frem første tall og ord.
                </p>
              </div>
            )}

            {/* Recent History Tray */}
            {calledBalls.length > 1 && (
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/60 block mb-1.5">
                  Tidligere trukket fra blenderen:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {calledBalls
                    .slice(0, -1)
                    .slice(-5)
                    .reverse()
                    .map((b, idx) => (
                      <div
                        key={`${b.letter}-${b.number}-${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/20 flex items-center gap-1.5 shrink-0"
                      >
                        <span
                          className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                          style={{ backgroundColor: b.color || '#f59e0b' }}
                        >
                          {b.number}
                        </span>
                        <span className="text-xs font-bold text-amber-200">
                          {b.letter}-{b.number}
                        </span>
                        <span className="text-[10px] text-amber-300/70 max-w-[90px] truncate">
                          {b.affirmation}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: PHYSICAL BALL MIXER & CAGE CONTROLS */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🌪️</span>
                <h3 className="font-heading font-bold text-sm text-amber-200">
                  Fysisk Blender & Virvelkontroll
                </h3>
              </div>
              <span className="text-2xs font-mono text-amber-400 bg-black/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                {ballsRemaining} Kuler i Trommelen
              </span>
            </div>

            {/* Agitate Quick Triggers */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <button
                onClick={() => handleQuickAgitate(0.6)}
                disabled={isAgitating}
                className="py-2 px-3 rounded-xl bg-black/50 border border-amber-500/30 hover:border-amber-400 text-xs font-bold text-amber-200 transition-all cursor-pointer flex flex-col items-center gap-0.5 active:scale-95"
              >
                <span>Gentle Tumble</span>
                <span className="text-3xs text-amber-400/60 font-normal">25 RPM</span>
              </button>

              <button
                onClick={() => handleQuickAgitate(1.0)}
                disabled={isAgitating}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 active:scale-95 ${
                  isAgitating
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-400 text-amber-100 hover:bg-amber-500/30'
                }`}
              >
                <span>Cyclone Whirl</span>
                <span className="text-3xs text-amber-300/80 font-normal">50 RPM</span>
              </button>

              <button
                onClick={() => handleQuickAgitate(1.8)}
                disabled={isAgitating}
                className="py-2 px-3 rounded-xl bg-black/50 border border-amber-500/30 hover:border-amber-400 text-xs font-bold text-amber-200 transition-all cursor-pointer flex flex-col items-center gap-0.5 active:scale-95"
              >
                <span>Turbo Agitate</span>
                <span className="text-3xs text-amber-400/60 font-normal">90 RPM</span>
              </button>
            </div>

            {/* Custom Speed Slider */}
            <div className="mt-3 pt-3 border-t border-amber-500/15">
              <div className="flex items-center justify-between text-2xs font-semibold text-amber-300 mb-1">
                <span>Mixer Motor Velocity</span>
                <span className="font-mono text-amber-400">{mixSpeed} RPM</span>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                value={mixSpeed}
                onChange={(e) => setMixSpeed(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-amber-300/40 mt-0.5">
                <span>Slow Roll</span>
                <span>Balanced Whirl</span>
                <span>Maximum Agitation</span>
              </div>
            </div>

            {/* Reshuffle Hopper Button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  sounds.playCageTumble(1.2);
                  onShuffleBalls();
                }}
                className="px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/30 hover:border-amber-400 text-2xs font-bold text-amber-300 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reshuffle Remaining Hopper Balls</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: AUDIO & SOUNDSCAPE MIXER CHANNELS */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🎛️</span>
                <h3 className="font-heading font-bold text-sm text-amber-200">
                  Audio & Ambience Channels
                </h3>
              </div>
              <button
                onClick={() => sounds.playDaub(2, 2)}
                className="text-3xs text-amber-400 hover:text-amber-200 underline cursor-pointer"
              >
                Test Chime Sound
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Channel 1: Master Volume */}
              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-amber-200 mb-1.5">
                  <span>Master Output</span>
                  <span className="font-mono text-amber-400">{Math.round(masterVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVol}
                  onChange={(e) => handleMasterChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Channel 2: SFX & Ball Clack */}
              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-amber-200 mb-1.5">
                  <span>Ball Clatter & Chimes</span>
                  <span className="font-mono text-amber-400">{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  onChange={(e) => handleSfxChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Channel 3: Ambient Hearth Pad */}
              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-amber-200 mb-1.5">
                  <span>Warm Hearth Ambience</span>
                  <span className="font-mono text-amber-400">
                    {ambientVol > 0 ? `${Math.round(ambientVol * 100)}%` : 'Muted'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVol}
                  onChange={(e) => handleAmbientChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Channel 4: Voice Speech Announcer */}
              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-amber-200 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>Voice Caller</span>
                    <button
                      onClick={handleToggleSpeech}
                      className={`text-3xs px-1.5 py-0.5 rounded cursor-pointer ${
                        isSpeechOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {isSpeechOn ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <span className="font-mono text-amber-400">{Math.round(speechVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={speechVol}
                  onChange={(e) => handleSpeechChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Speech Rate Adjustment */}
            <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center justify-between text-2xs text-amber-300">
              <span>Caller Speech Tempo:</span>
              <div className="flex items-center gap-2">
                {[0.9, 1.05, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                      speechRate === rate
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-black/40 text-amber-200 hover:bg-black/60 border border-amber-500/20'
                    }`}
                  >
                    {rate === 0.9 ? 'Calm (0.9x)' : rate === 1.05 ? 'Normal (1.0x)' : 'Brisk (1.25x)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tale følger språkmenyen */}
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-300">
                  Stemme for opprop (Tale følger språkmenyen):
                </span>
                <span className="text-2xs font-bold text-emerald-400">
                  ● Automatisk synkronisert
                </span>
              </div>
              <p className="text-2xs text-amber-200/70 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                Oppropet følger språket du har valgt i språkmenyen (flagg-ikonet). Hvis siden er på engelsk spilles talen på engelsk, og hvis siden er på norsk leses tall og bekreftelser på norsk.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Apply & Close Mixer
          </button>
        </div>
      </div>
    </div>
  );
};
