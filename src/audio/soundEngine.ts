/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  constructor() {
    // Initialized cleanly
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
   * Helper to determine active UI language:
   * Returns 'en' if English is selected, otherwise Norwegian ('nb').
   */
  public getActiveLanguage(): 'nb' | 'en' {
    if (typeof window !== 'undefined') {
      try {
        const lang = localStorage.getItem('joypulse_language');
        if (lang === 'en') return 'en';
      } catch {
        // ignore
      }
    }
    return 'nb';
  }

  /**
   * Speak ball announcement using speech synthesis:
   * Tale følger språkmenyen direkte:
   * - Engelsk aktiv: Roper kule på engelsk (f.eks. "B 12") med amerikansk/britisk uttale.
   * - Norsk aktiv: Roper kule og bekreftende tanke på norsk (f.eks. "B 12. Varm klem og omtanke").
   */
  public speakBall(letter: string, number: number, affirmation: string) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const currentLang = this.getActiveLanguage();

      if (currentLang === 'en') {
        const englishText = `${letter} ${number}`;
        const uEng = new SpeechSynthesisUtterance(englishText);
        uEng.lang = 'en-US';
        uEng.rate = this.speechRate;
        uEng.pitch = 1.05;
        uEng.volume = this.speechVol * this.masterVol;
        window.speechSynthesis.speak(uEng);
      } else {
        const norwegianText = `${letter} ${number}. ${affirmation}`;
        const uNor = new SpeechSynthesisUtterance(norwegianText);
        uNor.lang = 'nb-NO';
        uNor.rate = this.speechRate;
        uNor.pitch = 1.05;
        uNor.volume = this.speechVol * this.masterVol;
        window.speechSynthesis.speak(uNor);
      }
    } catch {
      // speech fail silent
    }
  }

  /**
   * Voice celebration announcement for Bingo / Line win:
   * Tale følger språkmenyen direkte:
   * - Engelsk aktiv: "BINGO! Congratulations!" / "Line complete!"
   * - Norsk aktiv: "BINGO! Gratulerer med seieren!" / "Fullført linje!"
   */
  public speakWin(isBingo: boolean) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const currentLang = this.getActiveLanguage();

      if (currentLang === 'en') {
        const uEng = new SpeechSynthesisUtterance(
          isBingo ? 'BINGO! Congratulations!' : 'Line complete!'
        );
        uEng.lang = 'en-US';
        uEng.rate = 1.0;
        uEng.pitch = 1.2;
        uEng.volume = this.speechVol * this.masterVol;
        window.speechSynthesis.speak(uEng);
      } else {
        const uNor = new SpeechSynthesisUtterance(
          isBingo ? 'BINGO! Gratulerer med seieren!' : 'Fullført linje!'
        );
        uNor.lang = 'nb-NO';
        uNor.rate = 1.0;
        uNor.pitch = 1.2;
        uNor.volume = this.speechVol * this.masterVol;
        window.speechSynthesis.speak(uNor);
      }
    } catch {
      // speech fail silent
    }
  }
}

export const sounds = new SoundEngine();
