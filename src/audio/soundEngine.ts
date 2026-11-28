/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n, SupportedLanguage, SUPPORTED_LANGUAGES } from '../services/i18n';
import { formatBingoBallSpeech } from './bingoSpeechText';

export interface PauseTrack {
  id: string;
  name: string;
  description: string;
  tempo: number; // BPM
}

export const RIL_PAUSE_TRACKS: PauseTrack[] = [
  {
    id: 'ril_fanfare',
    name: '🎺 RIL Trivsel & Fanfare',
    description: 'Oppløftende horn og glade toner for fellesskap og latter',
    tempo: 120,
  },
  {
    id: 'coffee_break',
    name: '☕ Kaffepause & Hygge',
    description: 'Varm, rolig og behagelig klang for kaffekoppen og gode samtaler',
    tempo: 96,
  },
  {
    id: 'community_march',
    name: '🥁 Fellesmarsj & Allsang',
    description: 'Taktfast og lystig stemning som vekker humøret',
    tempo: 112,
  },
  {
    id: 'warm_chords',
    name: '🌿 Harmonisk Pauseklang',
    description: 'Avslappende harmonier for en fredelig pustepause',
    tempo: 80,
  },
  {
    id: 'jubilee_waltz',
    name: '💃 Seiersvals & Livsglede',
    description: 'Feiende flott 3/4-takt som inviterer til smil og trivsel',
    tempo: 132,
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSpeechEnabled: boolean = true;

  // Channel volumes
  private masterVol: number = 0.85;
  private sfxVol: number = 0.9;
  private speechVol: number = 0.9;
  private speechRate: number = 1.05;
  private ambientVol: number = 0.0; // off by default, controlled via Mixer
  private pauseMusicVol: number = 0.7;

  // Ambient sound nodes
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];

  // RIL Pause Music Synthesis state
  private isPlayingPauseMusicState: boolean = false;
  private currentPauseTrackId: string = 'ril_fanfare';
  private pauseMusicInterval: number | null = null;
  private pauseMusicGain: GainNode | null = null;
  private pauseMusicStep: number = 0;

  // Web Speech Synthesis reliability & voice matching state
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private failedVoiceURIs: Set<string> = new Set();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechDispatchTimer: number | null = null;
  private speechSequence: number = 0;
  private lastSpokenBallKey: string = '';
  private lastSpokenBallAt: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const refreshVoices = () => {
        try {
          const loaded = window.speechSynthesis.getVoices();
          if (loaded && loaded.length > 0) {
            this.cachedVoices = loaded;
          }
        } catch {
          // ignore
        }
      };
      refreshVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
    }

    try {
      i18n.subscribe(() => {
        this.cancelSpeech();
      });
    } catch {
      // ignore
    }
  }

  public cancelSpeech() {
    this.lastSpokenBallKey = '';
    this.lastSpokenBallAt = 0;
    this.speechSequence++;
    if (this.speechDispatchTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.speechDispatchTimer);
      this.speechDispatchTimer = null;
    }
    this.currentUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (this.speechDispatchTimer !== null) {
          window.clearTimeout(this.speechDispatchTimer);
          this.speechDispatchTimer = null;
        }
        this.speechSequence++;
        window.speechSynthesis.cancel();
        this.currentUtterance = null;
      } catch {
        // ignore
      }
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : this.ambientVol * this.masterVol, this.ctx?.currentTime || 0);
    }
    if (this.pauseMusicGain) {
      this.pauseMusicGain.gain.setValueAtTime(muted ? 0 : this.pauseMusicVol * this.masterVol * 0.22, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMasterVolume(v: number) {
    this.masterVol = Math.max(0, Math.min(1, v));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.ambientVol * this.masterVol, this.ctx.currentTime);
    }
    if (this.pauseMusicGain && this.ctx) {
      this.pauseMusicGain.gain.setValueAtTime(this.isMuted ? 0 : this.pauseMusicVol * this.masterVol * 0.22, this.ctx.currentTime);
    }
  }

  public getMasterVolume() { return this.masterVol; }

  public setSfxVolume(v: number) {
    this.sfxVol = Math.max(0, Math.min(1, v));
  }
  public getSfxVolume() { return this.sfxVol; }

  public setSpeechVolume(v: number) {
    this.speechVol = Math.max(0, Math.min(1, v));
  }
  public getSpeechVolume() { return this.speechVol; }

  public setSpeechRate(r: number) {
    this.speechRate = Math.max(0.6, Math.min(1.6, r));
  }
  public getSpeechRate() { return this.speechRate; }

  public setSpeechEnabled(enabled: boolean) {
    this.isSpeechEnabled = enabled;
  }
  public getSpeechEnabled(): boolean {
    return this.isSpeechEnabled;
  }

  /**
   * Procedural Warm Ambient Hearth & Gentle Pad
   */
  public setAmbientVolume(v: number) {
    this.ambientVol = Math.max(0, Math.min(1, v));
    this.initCtx();
    if (!this.ctx) return;

    if (this.ambientVol > 0.01 && this.ambientOscs.length === 0) {
      try {
        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.ambientVol * this.masterVol * 0.15, now + 1.2);
        gain.connect(this.ctx.destination);
        this.ambientGain = gain;

        // Triad drone in C major (C3, G3, E4)
        const freqs = [130.81, 196.00, 329.63];
        freqs.forEach((f) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.connect(gain);
          osc.start(now);
          this.ambientOscs.push(osc);
        });
      } catch {
        // fail silent
      }
    } else if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.ambientVol * this.masterVol * 0.15, this.ctx.currentTime);
    }
  }
  public getAmbientVolume() { return this.ambientVol; }

  /**
   * RIL PAUSE MUSIC PROCEDURAL SYNTHESIZER
   * Generates warm, melodious, cheerful pause music directly via Web Audio API.
   * No external MP3 downloads required.
   */
  public getPauseTracks(): PauseTrack[] {
    return RIL_PAUSE_TRACKS;
  }

  public getCurrentPauseTrack(): string {
    return this.currentPauseTrackId;
  }

  public isPauseMusicPlaying(): boolean {
    return this.isPlayingPauseMusicState;
  }

  public setPauseMusicVolume(v: number) {
    this.pauseMusicVol = Math.max(0, Math.min(1, v));
    if (this.pauseMusicGain && this.ctx) {
      this.pauseMusicGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.pauseMusicVol * this.masterVol * 0.22,
        this.ctx.currentTime
      );
    }
  }

  public getPauseMusicVolume(): number {
    return this.pauseMusicVol;
  }

  public playPauseMusic(trackId?: string) {
    this.initCtx();
    if (!this.ctx) return;

    if (trackId) {
      this.currentPauseTrackId = trackId;
    }

    if (this.isPlayingPauseMusicState) {
      this.stopPauseMusic();
    }

    this.isPlayingPauseMusicState = true;
    this.pauseMusicStep = 0;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(
      this.isMuted ? 0 : this.pauseMusicVol * this.masterVol * 0.22,
      now + 0.5
    );
    gain.connect(this.ctx.destination);
    this.pauseMusicGain = gain;

    // Musical scales for procedural compositions
    const C_PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const F_WARM = [174.61, 220.00, 261.63, 349.23, 440.00, 523.25];
    const G_MARCH = [196.00, 246.94, 293.66, 392.00, 493.88, 587.33];
    const AMBIENT_PAD = [130.81, 164.81, 196.00, 246.94, 293.66, 329.63];
    const WALTZ_NOTES = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00];

    const stepInterval = this.currentPauseTrackId === 'warm_chords' ? 450 : 250;

    this.pauseMusicInterval = window.setInterval(() => {
      if (!this.ctx || !this.pauseMusicGain || !this.isPlayingPauseMusicState) return;

      try {
        const t = this.ctx.currentTime;
        const step = this.pauseMusicStep;
        this.pauseMusicStep = (this.pauseMusicStep + 1) % 32;

        let noteFreq = 440;
        let isChord = false;

        switch (this.currentPauseTrackId) {
          case 'ril_fanfare': {
            // Bright cheerful arpeggiated fanfare
            const mel = [0, 2, 4, 7, 4, 2, 0, 4, 7, 9, 7, 4, 2, 4, 7, 5];
            const idx = mel[step % mel.length] % C_PENTATONIC.length;
            noteFreq = C_PENTATONIC[idx];
            isChord = step % 4 === 0;
            break;
          }
          case 'coffee_break': {
            // Gentle mellow acoustic chords
            const idx = (step * 2) % F_WARM.length;
            noteFreq = F_WARM[idx];
            isChord = step % 8 === 0;
            break;
          }
          case 'community_march': {
            // Upbeat bouncy rhythm
            const pattern = [0, 0, 2, 3, 2, 0, 3, 4];
            noteFreq = G_MARCH[pattern[step % pattern.length] % G_MARCH.length];
            isChord = step % 2 === 0;
            break;
          }
          case 'warm_chords': {
            // Soothing relaxing pad
            noteFreq = AMBIENT_PAD[step % AMBIENT_PAD.length];
            isChord = true;
            break;
          }
          case 'jubilee_waltz': {
            // 3/4 waltz rhythm: Root on beat 1, chords on beats 2 & 3
            const beat = step % 3;
            if (beat === 0) {
              noteFreq = WALTZ_NOTES[0] / 2; // Deep bass
            } else {
              noteFreq = WALTZ_NOTES[(beat + (step % 6)) % WALTZ_NOTES.length];
              isChord = true;
            }
            break;
          }
          default:
            noteFreq = C_PENTATONIC[step % C_PENTATONIC.length];
        }

        // Main melody voice
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = this.currentPauseTrackId === 'warm_chords' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(noteFreq, t);

        const dur = this.currentPauseTrackId === 'warm_chords' ? 0.6 : 0.28;
        noteGain.gain.setValueAtTime(0.12, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(noteGain);
        noteGain.connect(this.pauseMusicGain);
        osc.start(t);
        osc.stop(t + dur + 0.05);

        // Soft harmonic resonance for full sound
        if (isChord) {
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(noteFreq * 1.5, t);
          gain2.gain.setValueAtTime(0.06, t);
          gain2.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.2);
          osc2.connect(gain2);
          gain2.connect(this.pauseMusicGain);
          osc2.start(t);
          osc2.stop(t + dur * 1.2 + 0.05);
        }
      } catch {
        // audio step fail silent
      }
    }, stepInterval);
  }

  public stopPauseMusic() {
    this.isPlayingPauseMusicState = false;
    if (this.pauseMusicInterval) {
      clearInterval(this.pauseMusicInterval);
      this.pauseMusicInterval = null;
    }
    if (this.pauseMusicGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.pauseMusicGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        setTimeout(() => {
          this.pauseMusicGain = null;
        }, 350);
      } catch {
        this.pauseMusicGain = null;
      }
    }
  }

  public togglePauseMusic(trackId?: string): boolean {
    if (this.isPlayingPauseMusicState) {
      this.stopPauseMusic();
      return false;
    } else {
      this.playPauseMusic(trackId);
      return true;
    }
  }

  /**
   * Tactile click sound
   */
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.12 * this.sfxVol * this.masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fail silent
    }
  }

  /**
   * Joyful bubble pop when marking a square
   */
  public playPop(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 380 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.07);

      gain.gain.setValueAtTime(0.15 * this.sfxVol * this.masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio fail silent
    }
  }

  /**
   * Golden Sun Dauber harmonic chime
   */
  public playDaub(row: number = 2, col: number = 2) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
      const noteIndex = (row + col) % scale.length;
      const freq = scale[noteIndex];

      const now = this.ctx.currentTime;

      // Primary bell
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2 * this.sfxVol * this.masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);

      // Sparkle overtone
      const sparkle = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();
      sparkle.type = 'triangle';
      sparkle.frequency.setValueAtTime(freq * 2, now);
      sparkleGain.gain.setValueAtTime(0.08 * this.sfxVol * this.masterVol, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      sparkle.connect(sparkleGain);
      sparkleGain.connect(this.ctx.destination);

      sparkle.start(now);
      sparkle.stop(now + 0.22);
    } catch {
      // fail silent
    }
  }

  /**
   * Cage spinning metallic rattle & clack
   */
  public playCageTumble(intensity: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const count = Math.max(2, Math.round(4 * intensity));
      for (let i = 0; i < count; i++) {
        const offset = i * 0.035 + Math.random() * 0.02;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 520, now + offset);

        gain.gain.setValueAtTime(0.06 * this.sfxVol * this.masterVol * intensity, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.045);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      }
    } catch {
      // fail silent
    }
  }

  /**
   * Ball rolls down the chute
   */
  public playBallDrop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.25 * this.sfxVol * this.masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // fail silent
    }
  }

  /**
   * Line Complete Fanfare
   */
  public playLineComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18 * this.sfxVol * this.masterVol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.42);
      });
    } catch {
      // fail silent
    }
  }

  /**
   * Triumphant BINGO Victory Celebration
   */
  public playBingoWin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const melody = [
        { f: 523.25, t: 0.00, d: 0.12 },
        { f: 659.25, t: 0.12, d: 0.12 },
        { f: 783.99, t: 0.24, d: 0.12 },
        { f: 1046.5, t: 0.36, d: 0.35 },
        { f: 880.00, t: 0.72, d: 0.15 },
        { f: 1046.5, t: 0.88, d: 0.65 },
      ];

      const now = this.ctx.currentTime;
      melody.forEach((m) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + m.t;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(m.f, startTime);

        gain.gain.setValueAtTime(0.24 * this.sfxVol * this.masterVol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + m.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + m.d + 0.05);
      });
    } catch {
      // fail silent
    }
  }

  /**
   * Returns the exact active UI language selected in the language menu.
   */
  public getActiveLanguage(): SupportedLanguage {
    try {
      return i18n.getLanguage();
    } catch {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('joypulse_language') as SupportedLanguage | null;
        if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
          return saved;
        }
      }
      return 'nb';
    }
  }

  private getSpeechLocale(lang: SupportedLanguage): string {
    return SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.speechLocale || 'nb-NO';
  }

  private getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    try {
      const freshVoices = window.speechSynthesis.getVoices();
      if (freshVoices && freshVoices.length > 0) {
        this.cachedVoices = freshVoices;
        return freshVoices;
      }
      return this.cachedVoices;
    } catch {
      return this.cachedVoices;
    }
  }

  private selectVoiceForLanguage(lang: SupportedLanguage, speechLocale: string): {
    voice: SpeechSynthesisVoice | null;
    voicesLoaded: boolean;
  } {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) {
      return { voice: null, voicesLoaded: false };
    }

    const exactCandidates: Record<SupportedLanguage, string[]> = {
      nb: ['nb-no', 'no-no', 'nn-no', 'nb', 'no', 'nn', 'nob-nor', 'nor-nor', 'nno-nor', 'nob', 'nor', 'nno'],
      en: ['en-us', 'en-gb', 'en-au', 'en-ca', 'en-ie', 'en-nz', 'en', 'eng-usa', 'eng-gbr', 'eng'],
      sv: ['sv-se', 'sv-fi', 'sv', 'swe-swe', 'swe'],
      de: ['de-de', 'de-at', 'de-ch', 'de', 'deu-deu', 'deu', 'ger'],
      es: ['es-es', 'es-mx', 'es-us', 'es-419', 'es', 'spa-esp', 'spa'],
      fr: ['fr-fr', 'fr-ca', 'fr-be', 'fr-ch', 'fr', 'fra-fra', 'fra', 'fre'],
      ar: ['ar-sa', 'ar-eg', 'ar-ae', 'ar-ma', 'ar-jo', 'ar-lb', 'ar', 'ara-sau', 'ara'],
      ti: ['ti-et', 'ti-er', 'ti', 'tir-eth', 'tir-eri', 'tir'],
    };

    const prefixCandidates: Record<SupportedLanguage, string[]> = {
      nb: ['nb', 'no', 'nn', 'nob', 'nor', 'nno'],
      en: ['en', 'eng'],
      sv: ['sv', 'swe'],
      de: ['de', 'deu', 'ger'],
      es: ['es', 'spa'],
      fr: ['fr', 'fra', 'fre'],
      ar: ['ar', 'ara'],
      ti: ['ti', 'tir'],
    };

    const usableVoices = voices.filter((v) => !this.failedVoiceURIs.has(v.voiceURI));
    const pool = usableVoices.length > 0 ? usableVoices : voices;

    // Prefer dedicated single-language voices over "Multilingual" voices (which auto-switch languages mid-sentence)
    const orderedPool = [
      ...pool.filter((v) => !/multilingual/i.test(v.name || '')),
      ...pool.filter((v) => /multilingual/i.test(v.name || '')),
    ];

    const normalizeTag = (raw: string) => raw.trim().toLowerCase().replace(/_/g, '-');
    const exactList = [normalizeTag(speechLocale), ...(exactCandidates[lang] || [])];

    for (const candidate of exactList) {
      const match = orderedPool.find((v) => normalizeTag(v.lang) === candidate);
      if (match) return { voice: match, voicesLoaded: true };
    }

    const prefixes = prefixCandidates[lang] || [lang];
    for (const prefix of prefixes) {
      const match = orderedPool.find((v) => {
        const vl = normalizeTag(v.lang);
        return vl === prefix || vl.startsWith(`${prefix}-`);
      });
      if (match) return { voice: match, voicesLoaded: true };
    }

    // Secondary check: match voice name ONLY if its lang tag is empty/undetermined (never override another explicit foreign language)
    const nameHints: Record<SupportedLanguage, RegExp> = {
      nb: /\b(norwegian|norsk|bokm[aå]l|nynorsk)\b/i,
      en: /\b(english)\b/i,
      sv: /\b(swedish|svensk|svenska)\b/i,
      de: /\b(german|deutsch)\b/i,
      es: /\b(spanish|espa[nñ]ol)\b/i,
      fr: /\b(french|fran[cç]ais)\b/i,
      ar: /\b(arabic|العربية)\b/i,
      ti: /\b(tigrinya|ትግርኛ)\b/i,
    };
    const nameMatch = orderedPool.find((v) => {
      const vl = normalizeTag(v.lang || '');
      const isNeutralTag = !vl || vl === 'und' || vl === 'unknown';
      return isNeutralTag && nameHints[lang].test(v.name || '');
    });

    return { voice: nameMatch || null, voicesLoaded: true };
  }

  private dispatchSpeech(
    text: string,
    lang: SupportedLanguage,
    opts?: { rate?: number; pitch?: number }
  ) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const seq = ++this.speechSequence;
    if (this.speechDispatchTimer !== null) {
      window.clearTimeout(this.speechDispatchTimer);
      this.speechDispatchTimer = null;
    }

    const executeSpeak = () => {
      if (seq !== this.speechSequence || this.isMuted || !this.isSpeechEnabled) return;
      // Always re-verify the active language right before speaking
      if (this.getActiveLanguage() !== lang) return;

      try {
        const synth = window.speechSynthesis;
        const speechLocale = this.getSpeechLocale(lang);
        const { voice: matchedVoice, voicesLoaded } = this.selectVoiceForLanguage(lang, speechLocale);

        // STRICT GUARD: If the device has loaded voices and NONE match the selected menu language,
        // NEVER let the browser fall back to a voice of a different language (e.g. English).
        if (voicesLoaded && !matchedVoice) {
          return;
        }

        const u = new SpeechSynthesisUtterance(text);
        u.lang = matchedVoice?.lang || speechLocale;
        if (matchedVoice) {
          u.voice = matchedVoice;
        }
        u.rate = opts?.rate ?? this.speechRate;
        u.pitch = opts?.pitch ?? 1.04;
        u.volume = this.speechVol * this.masterVol;
        u.onend = () => {
          if (this.currentUtterance === u) {
            this.currentUtterance = null;
          }
        };
        u.onerror = () => {
          if (matchedVoice?.voiceURI) {
            this.failedVoiceURIs.add(matchedVoice.voiceURI);
          }
          if (this.currentUtterance === u) {
            this.currentUtterance = null;
          }
        };

        if (synth.paused) {
          synth.resume();
        }

        if (synth.speaking || synth.pending) {
          synth.cancel();
          this.speechDispatchTimer = window.setTimeout(() => {
            this.speechDispatchTimer = null;
            if (seq !== this.speechSequence || this.isMuted || !this.isSpeechEnabled) return;
            if (this.getActiveLanguage() !== lang) return;
            try {
              if (synth.paused) synth.resume();
              this.currentUtterance = u;
              synth.speak(u);
            } catch {
              // fail silent
            }
          }, 65);
        } else {
          this.currentUtterance = u;
          synth.speak(u);
        }
      } catch {
        // speech fail silent
      }
    };

    const initialVoices = this.getAvailableVoices();
    if (initialVoices.length === 0) {
      // Wait briefly once for Chromium async voice list hydration before deciding
      this.speechDispatchTimer = window.setTimeout(() => {
        this.speechDispatchTimer = null;
        executeSpeak();
      }, 140);
      return;
    }

    executeSpeak();
  }

  /**
   * Speak ball announcement strictly in the currently selected menu language.
   * Uses full localized number words + exact voice binding so drawn numbers are NEVER spoken in another language.
   */
  public speakBall(letter: string, number: number, _affirmation?: string) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const currentLang = this.getActiveLanguage();
    const dedupKey = `${currentLang}:${letter}-${number}`;
    const now = Date.now();
    if (this.lastSpokenBallKey === dedupKey && now - this.lastSpokenBallAt < 450) {
      return;
    }
    this.lastSpokenBallKey = dedupKey;
    this.lastSpokenBallAt = now;

    const spokenText = formatBingoBallSpeech(letter, number, currentLang);
    this.dispatchSpeech(spokenText, currentLang, { rate: Math.min(this.speechRate, 1.02), pitch: 1.04 });
  }

  /**
   * Voice celebration announcement for Bingo / Line win in the active menu language.
   */
  public speakWin(isBingo: boolean) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const currentLang = this.getActiveLanguage();
    const winPhrases: Record<SupportedLanguage, { bingo: string; line: string }> = {
      nb: { bingo: 'BINGO! Gratulerer med seieren!', line: 'Fullført rekke!' },
      en: { bingo: 'BINGO! Congratulations!', line: 'Line complete!' },
      sv: { bingo: 'BINGO! Grattis till vinsten!', line: 'Fullbordad rad!' },
      de: { bingo: 'BINGO! Herzlichen Glückwunsch!', line: 'Reihe komplett!' },
      es: { bingo: 'BINGO! Felicidades!', line: 'Línea completa!' },
      fr: { bingo: 'BINGO! Félicitations!', line: 'Ligne complète!' },
      ar: { bingo: 'بينجو! مبروك الفوز!', line: 'تم إكمال الصف!' },
      ti: { bingo: 'BINGO!', line: '1 Line!' },
    };

    const phrase = winPhrases[currentLang] || winPhrases.nb;
    this.dispatchSpeech(isBingo ? phrase.bingo : phrase.line, currentLang, {
      rate: 1.0,
      pitch: 1.15,
    });
  }
}

export const sounds = new SoundEngine();
