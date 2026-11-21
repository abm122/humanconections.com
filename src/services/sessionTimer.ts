/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ownerControl } from './ownerControl';

export interface SessionInfo {
  startTime: number;
  maxDurationMinutes: number; // Dynamisk: 20 minutter, 1 time, 2 timer, etc.
  isExpired: boolean;
  isExtended: boolean;
  extendedByMinutes: number;
  hasPaidAccess: boolean; // Krever betaling for at spillere/vert kan starte
  isTrial?: boolean; // 5 minutters gratis prøvespill for nye spillere
  packageLabel?: string; // F.eks. "20 min prøvetid", "1 time", "2 timer"
  lastRenewalTime?: number;
  isPaused?: boolean;
  pausedAt?: number;
  totalPausedMs?: number;
  version?: string;
}

const CURRENT_VERSION = '2026.3.3_DYNAMIC_EXACT_DURATION';
const VERSION_LOCK_KEY = 'joypulse_version_lock';
const SESSION_STORAGE_KEY = 'joypulse_event_session';
const TRIAL_USED_KEY = 'joypulse_trial_used';
const DEFAULT_MAX_MINUTES = 60; // Standard 1 time hvis uspesifisert

class SessionTimerService {
  private session: SessionInfo;
  private timerInterval: number | null = null;
  private listeners: Set<() => void> = new Set();
  private remoteAccessGranted: boolean = false;
  private lastExpiredWasTrial: boolean = false;

  constructor() {
    this.session = this.loadSession();
    this.startTicker();
    ownerControl.subscribe(() => {
      this.notify();
    });
  }

  public isOwnerUnlimited(): boolean {
    return ownerControl.isUnlocked();
  }

  private loadSession(): SessionInfo {
    try {
      if (typeof window !== 'undefined') {
        const storedVer = localStorage.getItem(VERSION_LOCK_KEY);
        // Fryser ned alle gamle versjoner og nullstiller uautorisert/utdatert sesjon
        if (storedVer !== CURRENT_VERSION) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.setItem(VERSION_LOCK_KEY, CURRENT_VERSION);
        }

        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const totalMinutes = (parsed.maxDurationMinutes || DEFAULT_MAX_MINUTES) + (parsed.extendedByMinutes || 0);
          const totalAllowedMs = totalMinutes * 60 * 1000;
          const elapsed = Date.now() - (parsed.startTime || 0) - (parsed.totalPausedMs || 0);

          // Kun gyldig dersom det er registrert betaling eller aktiv prøveperiode (ikke gammel eier-økt når låst)
          const isStaleOwnerSession = parsed.packageLabel === 'Ubegrenset (Eier)' || parsed.maxDurationMinutes === 0;
          if (
            parsed.version === CURRENT_VERSION &&
            parsed.hasPaidAccess &&
            (!isStaleOwnerSession || ownerControl.isUnlocked()) &&
            elapsed < totalAllowedMs
          ) {
            return {
              ...parsed,
              version: CURRENT_VERSION,
              maxDurationMinutes: parsed.maxDurationMinutes || DEFAULT_MAX_MINUTES,
              extendedByMinutes: parsed.extendedByMinutes || 0,
              hasPaidAccess: true,
              isTrial: Boolean(parsed.isTrial),
              packageLabel: parsed.packageLabel,
              isExpired: false,
              isPaused: parsed.isPaused ?? false,
              pausedAt: parsed.pausedAt,
              totalPausedMs: parsed.totalPausedMs ?? 0,
            };
          }

          // Hvis en betalt sesjon eller prøvespill har utløpt mens fanen var lukket eller allerede merket utløpt
          if (
            parsed.version === CURRENT_VERSION &&
            (parsed.isExpired === true || (parsed.hasPaidAccess && elapsed >= totalAllowedMs))
          ) {
            this.lastExpiredWasTrial = Boolean(parsed.isTrial);
            const expiredSession: SessionInfo = {
              ...parsed,
              version: CURRENT_VERSION,
              maxDurationMinutes: parsed.maxDurationMinutes || DEFAULT_MAX_MINUTES,
              extendedByMinutes: parsed.extendedByMinutes || 0,
              hasPaidAccess: false,
              isExpired: true,
              isTrial: Boolean(parsed.isTrial),
              isPaused: false,
              pausedAt: undefined,
            };
            this.saveSession(expiredSession);
            return expiredSession;
          }
        }
      }
    } catch {
      // Ignore
    }

    // Standard tilstand: Spilletid er låst inntil Vipps-betaling er utført
    const newSession: SessionInfo = {
      startTime: Date.now(),
      maxDurationMinutes: DEFAULT_MAX_MINUTES,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: false, // Krever alltid Vipps-betaling
      isPaused: false,
      totalPausedMs: 0,
      version: CURRENT_VERSION,
    };
    this.saveSession(newSession);
    return newSession;
  }

  private saveSession(session: SessionInfo) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // Ignore
    }
  }

  private startTicker() {
    if (typeof window === 'undefined') return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = window.setInterval(() => {
      if (this.isOwnerUnlimited()) {
        this.notify();
        return;
      }
      // Don't advance expiry if paused
      if (this.session.isPaused) {
        this.notify();
        return;
      }
      const remaining = this.getRemainingMs();
      if (this.session.hasPaidAccess && remaining <= 0) {
        this.lastExpiredWasTrial = Boolean(this.session.isTrial);
        this.session.isExpired = true;
        this.session.hasPaidAccess = false;
        this.saveSession(this.session);
        this.notify();
      } else {
        this.notify();
      }
    }, 1000);
  }

  public getSession(): SessionInfo {
    return { ...this.session };
  }

  public getTotalAllowedMinutes(): number {
    if (this.isOwnerUnlimited()) return 0;
    return (this.session.maxDurationMinutes || 60) + (this.session.extendedByMinutes || 0);
  }

  public getPackageLabel(): string {
    if (this.isOwnerUnlimited()) return 'Ubegrenset (Eier)';
    if (this.session.packageLabel) return this.session.packageLabel;
    const mins = this.getTotalAllowedMinutes();
    if (mins >= 1440) return 'Hele dagen';
    if (mins < 60) return `${mins} min`;
    const hours = mins / 60;
    return Number.isInteger(hours) ? `${hours}t` : `${mins} min`;
  }

  public setRemoteAccessGranted(granted: boolean) {
    this.remoteAccessGranted = granted;
    this.notify();
  }

  public isRemoteAccessGranted(): boolean {
    return this.remoteAccessGranted;
  }

  public expireSession() {
    if (this.session.isExpired && !this.session.hasPaidAccess) {
      return;
    }
    this.lastExpiredWasTrial = Boolean(this.session.isTrial);
    this.session.isExpired = true;
    this.session.hasPaidAccess = false;
    this.saveSession(this.session);
    this.notify();
  }

  public getRemainingMs(): number {
    if (this.isOwnerUnlimited()) {
      return Number.MAX_SAFE_INTEGER;
    }
    if (this.remoteAccessGranted) {
      return 3600 * 1000; // Avstandsspillere følger vertens sesjon
    }
    if (!this.session.hasPaidAccess) {
      return 0; // 0 ms dersom ubetalt
    }
    const currentPauseMs =
      this.session.isPaused && this.session.pausedAt
        ? Date.now() - this.session.pausedAt
        : 0;
    const totalPaused = (this.session.totalPausedMs || 0) + currentPauseMs;
    const elapsed = Date.now() - this.session.startTime - totalPaused;
    const totalMinutes = (this.session.maxDurationMinutes || 60) + (this.session.extendedByMinutes || 0);
    const totalAllowedMs = totalMinutes * 60 * 1000;
    return Math.max(0, Math.min(totalAllowedMs, totalAllowedMs - elapsed));
  }

  /**
   * Returnerer true KUN når en aktiv betalt sesjon eller prøvespill faktisk har løpt ut til 00:00:00.
   * Returnerer false før brukeren har betalt/startet, slik at nyinnloggede brukere ikke logges ut før betaling.
   */
  public hasTimedOut(): boolean {
    if (this.isOwnerUnlimited()) {
      return false; // Eier er aldri tidsbegrenset
    }
    if (this.remoteAccessGranted) {
      return false; // Dekket av vertens rombetaling
    }
    if (this.session.isExpired === true) {
      return true;
    }
    if (this.session.hasPaidAccess && this.getRemainingMs() <= 0) {
      return true;
    }
    return false;
  }

  public isExpired(): boolean {
    return this.hasTimedOut();
  }

  public getFormattedRemaining(): string {
    if (this.isOwnerUnlimited()) {
      return '∞ Ubegrenset (Eier)';
    }
    if (this.remoteAccessGranted) {
      return 'Inkludert (Vertens rom)';
    }
    if (!this.session.hasPaidAccess) {
      return '00:00:00 (Krever betaling)';
    }
    const remainingMs = this.getRemainingMs();
    if (remainingMs <= 0) return '00:00:00 (Utløpt)';

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const base = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (this.session.isTrial) {
      return `${pad(minutes)}:${pad(seconds)} (Prøvespill)`;
    }
    return this.session.isPaused ? `${base} (⏸️ Pauset)` : base;
  }

  /**
   * True når bruker har aktiv betaling ELLER aktiv 5-min prøvetid (ikke for fjern-deltakere med kode).
   */
  public hasPaidAccess(): boolean {
    if (ownerControl.isUnlocked()) {
      return true; // Eier har alltid full tilgang med sin PIN
    }
    return (
      this.session.version === CURRENT_VERSION &&
      this.session.hasPaidAccess === true &&
      !this.isExpired()
    );
  }

  /**
   * True KUN når bruker har kjøpt en betalt pakke (eller er Eier) — IKKE for 5-min prøvespill og IKKE for deltakere med kode.
   * Kreves for å generere og vise koblingskode (Bingo & Quiz).
   */
  public hasFullPaidAccess(): boolean {
    if (ownerControl.isUnlocked()) {
      return true;
    }
    return (
      this.session.version === CURRENT_VERSION &&
      this.session.hasPaidAccess === true &&
      !this.session.isTrial &&
      !this.isExpired()
    );
  }

  public pauseSession() {
    if (this.session.isPaused) return;
    this.session.isPaused = true;
    this.session.pausedAt = Date.now();
    this.saveSession(this.session);
    this.notify();
  }

  public resumeSession() {
    if (!this.session.isPaused) return;
    if (this.session.pausedAt) {
      const pauseDuration = Date.now() - this.session.pausedAt;
      this.session.totalPausedMs = (this.session.totalPausedMs || 0) + pauseDuration;
    }
    this.session.isPaused = false;
    this.session.pausedAt = undefined;
    this.saveSession(this.session);
    this.notify();
  }

  public isPaused(): boolean {
    if (this.isOwnerUnlimited()) return false;
    return !!this.session.isPaused;
  }

  /**
   * Gi eier ubegrenset tilgang (uten å forvrenge arrangementsuret)
   */
  public grantOwnerAccess() {
    this.lastExpiredWasTrial = false;
    this.session = {
      startTime: Date.now(),
      maxDurationMinutes: 0,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: true,
      isTrial: false,
      packageLabel: 'Ubegrenset (Eier)',
      lastRenewalTime: Date.now(),
      isPaused: false,
      totalPausedMs: 0,
      version: CURRENT_VERSION,
    };
    this.saveSession(this.session);
    this.notify();
  }

  /**
   * Nullstill sesjonen til ubetalt tilstand (f.eks. ved innlogging som vert/spiller eller utlogging)
   */
  public resetToUnpaid() {
    this.session = {
      startTime: Date.now(),
      maxDurationMinutes: DEFAULT_MAX_MINUTES,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: false,
      isPaused: false,
      totalPausedMs: 0,
      version: CURRENT_VERSION,
    };
    this.saveSession(this.session);
    this.notify();
  }

  /**
   * Reset session timer to fresh hours (e.g. by owner override)
   */
  public resetSession(minutes: number = DEFAULT_MAX_MINUTES) {
    this.session = {
      startTime: Date.now(),
      maxDurationMinutes: minutes,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: true,
      version: CURRENT_VERSION,
    };
    this.saveSession(this.session);
    this.notify();
  }

  /**
   * Activate paid session via Vipps with exact purchased minutes and label
   */
  public activatePaidSession(minutes: number, packageLabel?: string) {
    const label = packageLabel || (minutes < 60 ? `${minutes} min` : `${minutes / 60}t`);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRIAL_USED_KEY, 'true');
    }
    this.lastExpiredWasTrial = false;
    this.session = {
      startTime: Date.now(),
      maxDurationMinutes: minutes,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: true,
      isTrial: false,
      packageLabel: label,
      lastRenewalTime: Date.now(),
      isPaused: false,
      totalPausedMs: 0,
      version: CURRENT_VERSION,
    };
    this.saveSession(this.session);
    this.notify();
  }

  public hasUsedTrial(): boolean {
    if (typeof window !== 'undefined' && localStorage.getItem(TRIAL_USED_KEY) === 'true') {
      return true;
    }
    return Boolean(this.session.isTrial) || this.lastExpiredWasTrial;
  }

  public canStartFreeTrial(): boolean {
    if (ownerControl.isUnlocked()) return false;
    if (this.hasFullPaidAccess()) return false;
    if (this.hasUsedTrial()) return false;
    return true;
  }

  public activateTrialSession(minutes: number = 5): boolean {
    if (this.hasUsedTrial() || this.hasFullPaidAccess()) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRIAL_USED_KEY, 'true');
    }
    this.lastExpiredWasTrial = false;
    this.session = {
      startTime: Date.now(),
      maxDurationMinutes: minutes,
      isExpired: false,
      isExtended: false,
      extendedByMinutes: 0,
      hasPaidAccess: true,
      isTrial: true,
      packageLabel: `${minutes} min prøvespill`,
      lastRenewalTime: Date.now(),
      isPaused: false,
      totalPausedMs: 0,
      version: CURRENT_VERSION,
    };
    this.saveSession(this.session);
    this.notify();
    return true;
  }

  public isTrialSession(): boolean {
    return Boolean(this.session.isTrial);
  }

  public wasLastExpiredTrial(): boolean {
    return Boolean(this.session.isTrial) || this.lastExpiredWasTrial;
  }

  /**
   * Extend the current session with extra minutes (e.g. after payment or owner override)
   */
  public extendSession(additionalMinutes: number = 60, packageLabel?: string) {
    this.session.extendedByMinutes = (this.session.extendedByMinutes || 0) + additionalMinutes;
    this.session.isExtended = true;
    this.session.hasPaidAccess = true;
    this.session.isExpired = false;
    if (packageLabel) this.session.packageLabel = packageLabel;
    this.session.lastRenewalTime = Date.now();
    this.session.version = CURRENT_VERSION;
    this.saveSession(this.session);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private isNotifying = false;

  private notify() {
    if (this.isNotifying) return;
    this.isNotifying = true;
    try {
      this.listeners.forEach((l) => l());
    } finally {
      this.isNotifying = false;
    }
  }
}

export const sessionTimer = new SessionTimerService();
