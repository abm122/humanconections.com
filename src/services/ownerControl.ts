/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemAnnouncement {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  type: 'info' | 'celebration' | 'alert' | 'pause';
}

export interface BannedParticipant {
  id: string;
  name: string;
  reason: string;
  bannedAt: number;
  bannedUntil?: number; // Automatic 10-minute expiry (opphører etter 10 minutter)
  bannedBy: string;
}

import { BingoTheme } from '../types/bingo';
import { monetization, OwnerMonetizationSettings } from './monetization';
import { socialSocket } from './socialSocket';
import { firebasePersistence, CloudPublicConfig } from './firebasePersistence';

export interface StartPanelDefaults {
  defaultMode: 'ALL_IN_ONE' | 'HUMAN_BINGO' | 'CALLER_CAGE' | 'PASS_PLAY';
  defaultCardDisplayMode: 'both' | 'numbers' | 'prompts';
  defaultCardsPerPlayer: number;
  defaultScreenDevice: 'mobile' | 'desktop' | 'big_screen';
  defaultPlayerCount: number;
  showLiveDrum: boolean;
}

export interface OwnerProfile {
  name: string;
  email: string;
  role: string;
  pin: string;
  isUnlocked: boolean;
  phoneOrVipps: string; // Eierens eget Vipps- eller telefonnummer (permanent)
  bankAccount: string;
  appTitle: string;
  appSubtitle: string;
  customWinnerTaskLine1: string;
  customWinnerTaskLine2: string;
  customWinnerTaskBingo: string;
  categoryOrder?: BingoTheme[]; // Eierens favoritt-rekkefølge for kategorier
  startPanelDefaults?: StartPanelDefaults;
  visibleModules: {
    showBigScreen: boolean;
    showMixer: boolean;
    showSchedule: boolean;
    showQuests: boolean;
    showIosInstall: boolean;
    showPrint: boolean;
    showReport: boolean;
    showBroadcast: boolean;
    showParticipants: boolean;
    showDrumOnMobile: boolean;
    familyKidsMode: boolean;
  };
  createdAt: number;
}

const OWNER_PROFILE_KEY = 'joypulse_owner_profile';
const OWNER_TAB_UNLOCK_KEY = 'joypulse_owner_tab_unlocked';
const OWNER_TAB_TOKEN_KEY = 'joypulse_owner_tab_token';
const ANNOUNCEMENTS_KEY = 'joypulse_owner_announcements';
const BANNED_PARTICIPANTS_KEY = 'joypulse_banned_participants';
const OWNER_STATS_KEY = 'joypulse_owner_analytics';

export const DEFAULT_CATEGORY_ORDER: BingoTheme[] = [
  'ril',
  'classic_joy',
  'family_kids',
  'heartfelt',
  'laughter',
  'kindness',
  'gratitude',
];

export interface OwnerAnalytics {
  totalGamesHosted: number;
  totalBallsDrawn: number;
  totalBingosCelebrated: number;
  totalPlayersEngaged: number;
  totalWarningsIssued: number;
  lastSessionDate: number;
}

export const DEFAULT_START_PANEL_DEFAULTS: StartPanelDefaults = {
  defaultMode: 'ALL_IN_ONE',
  defaultCardDisplayMode: 'both',
  defaultCardsPerPlayer: 1,
  defaultScreenDevice: 'desktop',
  defaultPlayerCount: 2,
  showLiveDrum: true,
};

const DEFAULT_PROFILE: OwnerProfile = {
  name: 'Eier & Admin',
  email: 'adhanom3@gmail.com',
  role: 'Eier & Administrator',
  pin: '2026',
  isUnlocked: false,
  phoneOrVipps: '920 00 000', // Permanent standard Vipps-nummer som eier kan endre
  bankAccount: '',
  appTitle: 'Human-connection',
  appSubtitle: 'Enjoy Bingo · Enjoy Together',
  customWinnerTaskLine1: 'Gi en god og varm klem til den som fortjener det aller mest!',
  customWinnerTaskLine2: 'Få med hele rommet på et felles gledesrop eller applaus for alle!',
  customWinnerTaskBingo: 'KRONING: Reis deg, rop et rungende BINGO og del ut en varm klem og seierssmil!',
  categoryOrder: DEFAULT_CATEGORY_ORDER,
  startPanelDefaults: DEFAULT_START_PANEL_DEFAULTS,
  visibleModules: {
    showBigScreen: true,
    showMixer: true,
    showSchedule: false, // Skjult som standard etter eierens ønske (kan slås på i eierkontroll)
    showQuests: true,
    showIosInstall: false, // Skjult som standard etter eierens ønske (kan slås på i eierkontroll)
    showPrint: true,
    showReport: true,
    showBroadcast: true,
    showParticipants: true,
    showDrumOnMobile: true,
    familyKidsMode: true,
  },
  createdAt: Date.now() - 86400000 * 7,
};

const DEFAULT_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'ann-1',
    message: 'Velkommen til Human-connection — Enjoy Bingo · Enjoy Together! Ha en fantastisk og gledelig stund sammen.',
    author: 'Arrangøren',
    timestamp: Date.now() - 3600000 * 2,
    type: 'info',
  },
];

class OwnerControlService {
  private profile: OwnerProfile;
  private announcements: SystemAnnouncement[];
  private bannedParticipants: BannedParticipant[];
  private analytics: OwnerAnalytics;
  private activeAnnouncement: SystemAnnouncement | null = null;
  private listeners: Set<() => void> = new Set();
  private ownerToken: string | null = null;
  private isCloudSyncing = false;
  private cloudLastError: string | null = null;
  private cloudLastSyncedAt: number | null = null;
  private cloudSyncPromise: Promise<void> | null = null;
  private pinModifiedLocally = false;

  constructor() {
    this.profile = this.loadProfile();
    this.ownerToken = this.loadTabOwnerToken();
    this.announcements = this.loadAnnouncements();
    this.bannedParticipants = this.loadBanned();
    this.analytics = this.loadAnalytics();
    if (typeof window !== 'undefined') {
      void this.syncFromServer();
      firebasePersistence.startPublicConfigListener((cfg) => {
        this.applyCloudPublicConfig(cfg);
      });
      firebasePersistence.subscribeAuth(() => {
        void this.handleFirebaseAuthChange();
      });
      socialSocket.on('owner:config_updated', (payload: any) => {
        if (payload?.profilePublic) {
          this.applyServerProfile(payload.profilePublic);
        }
        if (payload?.pricingSettings) {
          monetization.applyServerSettings(payload.pricingSettings);
        }
      });
    }
  }

  private loadTabOwnerToken(): string | null {
    try {
      if (typeof window !== 'undefined' && this.profile.isUnlocked) {
        return window.sessionStorage.getItem(OWNER_TAB_TOKEN_KEY) || null;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private setTabOwnerToken(token: string | null) {
    this.ownerToken = token;
    try {
      if (typeof window !== 'undefined') {
        if (token) {
          window.sessionStorage.setItem(OWNER_TAB_TOKEN_KEY, token);
        } else {
          window.sessionStorage.removeItem(OWNER_TAB_TOKEN_KEY);
        }
      }
    } catch {
      // Ignore
    }
  }

  public getOwnerToken(): string | null {
    return this.ownerToken;
  }

  public hasServerAdminToken(): boolean {
    return Boolean(this.ownerToken);
  }

  public getCloudStatus(): {
    isSignedIn: boolean;
    email: string | null;
    isSyncing: boolean;
    lastError: string | null;
    lastSyncedAt: number | null;
  } {
    const user = firebasePersistence.getCurrentFirebaseUser();
    return {
      isSignedIn: firebasePersistence.isAdminSignedIn(),
      email: user?.email || null,
      isSyncing: this.isCloudSyncing,
      lastError: this.cloudLastError,
      lastSyncedAt: this.cloudLastSyncedAt,
    };
  }

  private applyCloudPublicConfig(cfg: CloudPublicConfig) {
    if (!cfg || typeof cfg !== 'object') return;
    this.applyServerProfile({
      appTitle: cfg.appTitle,
      appSubtitle: cfg.appSubtitle,
      customWinnerTaskLine1: cfg.customWinnerTaskLine1,
      customWinnerTaskLine2: cfg.customWinnerTaskLine2,
      customWinnerTaskBingo: cfg.customWinnerTaskBingo,
      categoryOrder: Array.isArray(cfg.categoryOrder)
        ? (cfg.categoryOrder as BingoTheme[])
        : this.profile.categoryOrder,
      startPanelDefaults: cfg.startPanelDefaults
        ? {
            ...DEFAULT_START_PANEL_DEFAULTS,
            ...cfg.startPanelDefaults,
          }
        : this.profile.startPanelDefaults,
      visibleModules: cfg.visibleModules,
    });
    monetization.applyServerSettings({
      isMonetizationActive: cfg.isMonetizationActive,
      commissionPercent: cfg.commissionPercent,
      fixedFeePerPlayer: cfg.fixedFeePerPlayer,
      eventPassPrice: cfg.eventPassPrice,
      proBigScreenPrice: cfg.proBigScreenPrice,
      eventExtensionPrice: cfg.eventExtensionPrice,
      price20MinTrial: cfg.price20MinTrial,
      price1Hour: cfg.price1Hour,
      price2Hours: cfg.price2Hours,
      price3Hours: cfg.price3Hours,
      price4Hours: cfg.price4Hours,
      priceFullDay: cfg.priceFullDay,
    });
  }

  private async handleFirebaseAuthChange(): Promise<void> {
    if (!firebasePersistence.isAdminSignedIn()) {
      this.cloudLastError = null;
      this.notify();
      return;
    }

    if (this.cloudSyncPromise) {
      return this.cloudSyncPromise;
    }

    this.cloudSyncPromise = (async () => {
      this.isCloudSyncing = true;
      this.cloudLastError = null;
      this.notify();

    try {
      const [secrets, cloudPayouts, cloudTxs] = await Promise.all([
        firebasePersistence.loadOwnerSecrets(),
        firebasePersistence.loadPayouts(),
        firebasePersistence.loadTransactions(),
      ]);

      if (cloudPayouts.length > 0) {
        monetization.applyCloudPayouts(cloudPayouts);
      }
      if (cloudTxs.length > 0) {
        monetization.applyCloudTransactions(cloudTxs);
      }

      if (this.pinModifiedLocally && this.profile.pin && this.profile.pin.trim().length >= 4) {
        const curSettings = monetization.getSettings();
        const pushedPin = this.profile.pin.trim();
        await firebasePersistence.saveOwnerSecrets({
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: curSettings.payoutEmail,
          pin: pushedPin,
        });
        await firebasePersistence.savePublicConfig(this.profile, curSettings);
        this.pinModifiedLocally = false;
        await this.syncSecretsToBackendServer({
          ownerUid: firebasePersistence.getCurrentFirebaseUser()?.uid || '',
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: curSettings.payoutEmail,
          pin: pushedPin,
        });
      } else if (secrets) {
        this.profile = {
          ...this.profile,
          name: secrets.ownerName || this.profile.name,
          email: secrets.email || this.profile.email,
          phoneOrVipps: secrets.phoneOrVipps ?? this.profile.phoneOrVipps,
          bankAccount: secrets.bankAccount ?? this.profile.bankAccount,
          pin: secrets.pin || this.profile.pin,
        };
        monetization.applyServerSettings({
          ownerName: secrets.ownerName || this.profile.name,
          vippsNumber: secrets.phoneOrVipps ?? '',
          bankAccount: secrets.bankAccount ?? '',
          payoutEmail: secrets.payoutEmail || this.profile.email,
        });
        this.saveProfile();
        await this.syncSecretsToBackendServer(secrets);
      } else if (this.profile.isUnlocked) {
        // First-ever cloud connection by unlocked owner: seed Firestore with current config & records
        const curSettings = monetization.getSettings();
        await firebasePersistence.savePublicConfig(this.profile, curSettings);
        await firebasePersistence.saveOwnerSecrets({
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: curSettings.payoutEmail,
          pin: this.profile.pin || '2026',
        });
        for (const p of monetization.getPayouts()) {
          await firebasePersistence.savePayout(p);
        }
        for (const tx of monetization.getTransactions()) {
          await firebasePersistence.saveTransaction(tx);
        }
        await this.syncSecretsToBackendServer({
          ownerUid: firebasePersistence.getCurrentFirebaseUser()?.uid || '',
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: curSettings.payoutEmail,
          pin: this.profile.pin,
        });
      } else {
        await this.syncSecretsToBackendServer({
          ownerUid: firebasePersistence.getCurrentFirebaseUser()?.uid || '',
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: monetization.getSettings().payoutEmail,
          pin: this.profile.pin,
        });
      }

      // Verified Firebase owner (adhanom3@gmail.com) succeeded Firestore check -> ensure owner panel is unlocked
      this.profile.isUnlocked = true;
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(OWNER_TAB_UNLOCK_KEY, 'true');
        }
      } catch {
        // ignore
      }
      this.cloudLastSyncedAt = Date.now();
    } catch (err) {
      this.cloudLastError = err instanceof Error ? err.message : 'Kunne ikke synkronisere med Firestore.';
    } finally {
      this.isCloudSyncing = false;
      this.cloudSyncPromise = null;
      this.notify();
    }
    })();

    return this.cloudSyncPromise;
  }

  private async syncSecretsToBackendServer(secrets: {
    ownerUid?: string;
    ownerName: string;
    email: string;
    phoneOrVipps: string;
    bankAccount: string;
    payoutEmail: string;
    pin: string;
  }): Promise<void> {
    const idToken = await firebasePersistence.getIdToken();
    if (!idToken) return;
    try {
      const m = monetization.getSettings();
      const res = await fetch('/api/owner/sync-from-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          secrets,
          publicConfig: {
            appTitle: this.profile.appTitle,
            appSubtitle: this.profile.appSubtitle,
            customWinnerTaskLine1: this.profile.customWinnerTaskLine1,
            customWinnerTaskLine2: this.profile.customWinnerTaskLine2,
            customWinnerTaskBingo: this.profile.customWinnerTaskBingo,
            categoryOrder: this.profile.categoryOrder,
            startPanelDefaults: this.profile.startPanelDefaults || DEFAULT_START_PANEL_DEFAULTS,
            visibleModules: this.profile.visibleModules,
            isMonetizationActive: m.isMonetizationActive,
            commissionPercent: m.commissionPercent,
            fixedFeePerPlayer: m.fixedFeePerPlayer,
            eventPassPrice: m.eventPassPrice,
            proBigScreenPrice: m.proBigScreenPrice,
            eventExtensionPrice: m.eventExtensionPrice,
            price20MinTrial: m.price20MinTrial,
            price1Hour: m.price1Hour,
            price2Hours: m.price2Hours,
            price3Hours: m.price3Hours,
            price4Hours: m.price4Hours,
            priceFullDay: m.priceFullDay,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ownerToken) {
          this.setTabOwnerToken(data.ownerToken);
          this.notify();
        }
      }
    } catch {
      // Transient backend sync errors ignored
    }
  }

  public async signInWithGoogleAdmin(unlockAfterSignIn = false): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (unlockAfterSignIn && firebasePersistence.isAdminSignedIn()) {
      this.profile.isUnlocked = true;
      await this.handleFirebaseAuthChange();
      if (this.cloudLastError) {
        this.profile.isUnlocked = false;
        this.saveProfile();
        return { success: false, error: this.cloudLastError };
      }
      this.profile.isUnlocked = true;
      this.saveProfile();
      return { success: true };
    }

    const wasUnlocked = this.profile.isUnlocked;
    if (unlockAfterSignIn) {
      this.profile.isUnlocked = true;
    }
    const res = await firebasePersistence.signInOwnerWithGoogle();
    if (!res.success) {
      this.profile.isUnlocked = wasUnlocked;
      return { success: false, error: res.error };
    }
    await this.handleFirebaseAuthChange();
    if (this.cloudLastError) {
      if (unlockAfterSignIn) {
        this.profile.isUnlocked = wasUnlocked;
        this.saveProfile();
      }
      return { success: false, error: this.cloudLastError };
    }
    if (unlockAfterSignIn) {
      this.profile.isUnlocked = true;
      this.saveProfile();
    }
    return { success: true };
  }

  public async signOutGoogleAdmin(): Promise<void> {
    await firebasePersistence.signOutOwner();
    this.cloudLastError = null;
    this.cloudLastSyncedAt = null;
    this.notify();
  }

  public applyServerProfile(partial: Partial<OwnerProfile>) {
    if (!partial || typeof partial !== 'object') return;
    this.profile = {
      ...this.profile,
      ...partial,
      visibleModules: {
        ...this.profile.visibleModules,
        ...(partial.visibleModules || {}),
      },
      startPanelDefaults: partial.startPanelDefaults
        ? {
            ...DEFAULT_START_PANEL_DEFAULTS,
            ...(this.profile.startPanelDefaults || {}),
            ...partial.startPanelDefaults,
          }
        : this.profile.startPanelDefaults || DEFAULT_START_PANEL_DEFAULTS,
      categoryOrder: Array.isArray(partial.categoryOrder) && partial.categoryOrder.length > 0
        ? (partial.categoryOrder as BingoTheme[])
        : this.profile.categoryOrder,
    };
    this.saveProfile();
  }

  public async syncFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/owner/public-config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        if (data.profilePublic) {
          this.applyServerProfile(data.profilePublic);
        }
        if (data.pricingSettings) {
          monetization.applyServerSettings(data.pricingSettings);
        }
      }
    } catch {
      // Keep local fallback when server unreachable
    }
  }

  private loadProfile(): OwnerProfile {
    let tabUnlocked = false;
    try {
      if (typeof window !== 'undefined') {
        tabUnlocked = window.sessionStorage.getItem(OWNER_TAB_UNLOCK_KEY) === 'true';
      }
    } catch {
      // Ignore
    }
    try {
      const stored = localStorage.getItem(OWNER_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const resolvedPhone = parsed.phoneOrVipps?.trim() ? parsed.phoneOrVipps : '920 00 000';
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          isUnlocked: tabUnlocked, // Safe on public PCs: only preserved in current browser tab sessionStorage
          phoneOrVipps: resolvedPhone,
          visibleModules: {
            ...DEFAULT_PROFILE.visibleModules,
            ...(parsed.visibleModules || {}),
          },
          startPanelDefaults: {
            ...DEFAULT_START_PANEL_DEFAULTS,
            ...(parsed.startPanelDefaults || {}),
          },
        };
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_PROFILE, isUnlocked: tabUnlocked };
  }

  private saveProfile() {
    try {
      if (typeof window !== 'undefined') {
        if (this.profile.isUnlocked) {
          window.sessionStorage.setItem(OWNER_TAB_UNLOCK_KEY, 'true');
        } else {
          window.sessionStorage.removeItem(OWNER_TAB_UNLOCK_KEY);
        }
      }
      // Never store isUnlocked: true in localStorage so other tabs/users on public PCs don't inherit it
      const toStore = { ...this.profile, isUnlocked: false };
      localStorage.setItem(OWNER_PROFILE_KEY, JSON.stringify(toStore));
      this.notify();
    } catch {
      // Ignore
    }
  }

  private loadAnnouncements(): SystemAnnouncement[] {
    try {
      const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return DEFAULT_ANNOUNCEMENTS;
  }

  private saveAnnouncements() {
    try {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(this.announcements));
      this.notify();
    } catch {
      // Ignore
    }
  }

  private loadBanned(): BannedParticipant[] {
    try {
      const stored = localStorage.getItem(BANNED_PARTICIPANTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private saveBanned() {
    try {
      localStorage.setItem(BANNED_PARTICIPANTS_KEY, JSON.stringify(this.bannedParticipants));
      this.notify();
    } catch {
      // Ignore
    }
  }

  private loadAnalytics(): OwnerAnalytics {
    try {
      const stored = localStorage.getItem(OWNER_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return {
      totalGamesHosted: 14,
      totalBallsDrawn: 286,
      totalBingosCelebrated: 18,
      totalPlayersEngaged: 42,
      totalWarningsIssued: 1,
      lastSessionDate: Date.now(),
    };
  }

  private saveAnalytics() {
    try {
      localStorage.setItem(OWNER_STATS_KEY, JSON.stringify(this.analytics));
      this.notify();
    } catch {
      // Ignore
    }
  }

  private isNotifying = false;

  private notify() {
    if (this.isNotifying) return;
    this.isNotifying = true;
    try {
      this.listeners.forEach((cb) => cb());
    } finally {
      this.isNotifying = false;
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  // Profile & Authentication
  public getProfile(): OwnerProfile {
    return { ...this.profile };
  }

  public updateProfile(partial: Partial<OwnerProfile>) {
    this.profile = { ...this.profile, ...partial };
    this.saveProfile();
  }

  public async verifyPinAsync(enteredPin: string): Promise<boolean> {
    const trimmed = (enteredPin || '').trim();
    if (!trimmed) return false;
    if (this.cloudSyncPromise) {
      try {
        await this.cloudSyncPromise;
      } catch {
        // ignore
      }
    } else if (firebasePersistence.isAdminSignedIn() && !this.cloudLastSyncedAt) {
      try {
        await this.handleFirebaseAuthChange();
      } catch {
        // ignore
      }
    }
    try {
      const res = await fetch('/api/owner/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.valid) {
          this.setTabOwnerToken(data.ownerToken || null);
          if (data.profile) {
            this.profile = {
              ...this.profile,
              ...data.profile,
              pin: trimmed,
              isUnlocked: true,
              visibleModules: {
                ...this.profile.visibleModules,
                ...(data.profile.visibleModules || {}),
              },
            };
          } else {
            this.profile.pin = trimmed;
            this.profile.isUnlocked = true;
          }
          if (data.pricingSettings) {
            monetization.applyServerSettings(data.pricingSettings);
          }
          this.saveProfile();
          return true;
        }
        return false;
      }
    } catch {
      // Fallback to local verification only if server cannot be reached
    }
    return this.verifyPin(trimmed);
  }

  public verifyPin(enteredPin: string): boolean {
    const trimmed = (enteredPin || '').trim();
    if (trimmed === this.profile.pin || (!this.profile.pin && trimmed === '2026')) {
      this.profile.isUnlocked = true;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public async changePinAsync(
    currentPin: string,
    newPin: string
  ): Promise<{ success: boolean; savedToCloud?: boolean; message: string }> {
    const trimmedCurrent = (currentPin || '').trim();
    const trimmedNew = (newPin || '').trim();

    if (trimmedNew.length < 4) {
      return { success: false, message: 'Ny PIN-kode må bestå av minst 4 siffer.' };
    }

    try {
      const res = await fetch('/api/owner/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: trimmedCurrent,
          newPin: trimmedNew,
          ownerToken: this.ownerToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        return {
          success: false,
          message: data?.message || 'Kunne ikke oppdatere PIN-koden på serveren.',
        };
      }
      if (data.ownerToken) {
        this.setTabOwnerToken(data.ownerToken);
      }
      this.profile.pin = trimmedNew;
      this.profile.isUnlocked = true;
      this.saveProfile();

      let savedToCloud = false;
      let cloudErrorMsg = '';
      if (firebasePersistence.isAdminSignedIn()) {
        try {
          const curSettings = monetization.getSettings();
          await firebasePersistence.saveOwnerSecrets({
            ownerName: this.profile.name,
            email: this.profile.email,
            phoneOrVipps: this.profile.phoneOrVipps,
            bankAccount: this.profile.bankAccount,
            payoutEmail: curSettings.payoutEmail,
            pin: trimmedNew,
          });
          await firebasePersistence.savePublicConfig(this.profile, curSettings);
          this.pinModifiedLocally = false;
          this.cloudLastSyncedAt = Date.now();
          savedToCloud = true;
          this.notify();
        } catch (cloudErr) {
          this.pinModifiedLocally = true;
          cloudErrorMsg = cloudErr instanceof Error ? cloudErr.message : 'Kunne ikke lagre i Firestore.';
        }
      } else {
        this.pinModifiedLocally = true;
      }

      return {
        success: true,
        savedToCloud,
        message: savedToCloud
          ? 'PIN-koden er oppdatert og lagret permanent i Firebase Firestore og på serveren!'
          : cloudErrorMsg
          ? `PIN ble oppdatert lokalt på serveren, men skylagring til Firestore feilet: ${cloudErrorMsg}`
          : 'PIN er endret i denne økten, men IKKE lagret i skyen ennå. Koble til Google (adhanom3@gmail.com) så den ikke tilbakestilles ved neste app-oppdatering.',
      };
    } catch {
      return {
        success: false,
        message: 'Nettverksfeil: Kunne ikke oppdatere PIN-koden.',
      };
    }
  }

  public changePin(currentPin: string, newPin: string): { success: boolean; message: string } {
    const trimmedCurrent = (currentPin || '').trim();
    const trimmedNew = (newPin || '').trim();

    // If currentPin was entered or if admin is locked, verify it
    if (!this.profile.isUnlocked || trimmedCurrent) {
      const activePin = this.profile.pin || '2026';
      if (trimmedCurrent !== activePin) {
        return { success: false, message: 'Nåværende PIN-kode er feil.' };
      }
    }

    if (trimmedNew.length < 4) {
      return { success: false, message: 'Ny PIN-kode må bestå av minst 4 siffer.' };
    }

    this.profile.pin = trimmedNew;
    this.profile.isUnlocked = true;
    this.saveProfile();
    return { success: true, message: `PIN-koden er oppdatert og lagret permanent!` };
  }

  public async saveAllToServer(
    profilePartial?: Partial<OwnerProfile>,
    pricingPartial?: Partial<OwnerMonetizationSettings>
  ): Promise<{ success: boolean; savedToCloud?: boolean; error?: string }> {
    if (profilePartial) {
      this.profile = { ...this.profile, ...profilePartial };
      this.saveProfile();
    }
    if (pricingPartial) {
      monetization.updateSettings(pricingPartial);
    }

    try {
      const currentSettings = monetization.getSettings();
      const res = await fetch('/api/owner/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerToken: this.ownerToken,
          pin: this.profile.pin,
          profile: this.profile,
          pricingSettings: currentSettings,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || data?.message || 'Kunne ikke lagre endringene på serveren.',
        };
      }
      if (data.profilePublic) {
        this.applyServerProfile(data.profilePublic);
      }
      if (data.pricingSettings) {
        monetization.applyServerSettings(data.pricingSettings);
      }

      let savedToCloud = false;
      if (firebasePersistence.isAdminSignedIn()) {
        const latestSettings = monetization.getSettings();
        await firebasePersistence.savePublicConfig(this.profile, latestSettings);
        await firebasePersistence.saveOwnerSecrets({
          ownerName: this.profile.name,
          email: this.profile.email,
          phoneOrVipps: this.profile.phoneOrVipps,
          bankAccount: this.profile.bankAccount,
          payoutEmail: latestSettings.payoutEmail,
          pin: this.profile.pin || '2026',
        });
        this.cloudLastSyncedAt = Date.now();
        savedToCloud = true;
        this.notify();
      }

      return { success: true, savedToCloud };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nettverksfeil ved lagring til server/sky.';
      return {
        success: false,
        error: msg,
      };
    }
  }

  public lockAdmin() {
    this.setTabOwnerToken(null);
    this.profile.isUnlocked = false;
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(OWNER_TAB_UNLOCK_KEY);
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  public unlockAdmin() {
    this.profile.isUnlocked = true;
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(OWNER_TAB_UNLOCK_KEY, 'true');
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  public isUnlocked(): boolean {
    return this.profile.isUnlocked;
  }

  // Announcements / Direct Broadcaster
  public getAnnouncements(): SystemAnnouncement[] {
    return [...this.announcements].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getActiveAnnouncement(): SystemAnnouncement | null {
    return this.activeAnnouncement;
  }

  public dismissActiveAnnouncement() {
    this.activeAnnouncement = null;
    this.notify();
  }

  public broadcastMessage(
    message: string,
    type: SystemAnnouncement['type'] = 'info',
    author?: string
  ): SystemAnnouncement {
    const announcement: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      message: message.trim(),
      author: author || `${this.profile.name} (Eier)`,
      timestamp: Date.now(),
      type,
    };

    this.announcements.unshift(announcement);
    if (this.announcements.length > 20) {
      this.announcements = this.announcements.slice(0, 20);
    }
    this.activeAnnouncement = announcement;
    this.saveAnnouncements();
    this.notify();
    return announcement;
  }

  public clearAnnouncements() {
    this.announcements = [];
    this.activeAnnouncement = null;
    this.saveAnnouncements();
    this.notify();
  }

  // Banned / Disturbant Management (Utestengelse opphører automatisk etter 10 minutter)
  public getBannedParticipants(): BannedParticipant[] {
    const now = Date.now();
    const active = this.bannedParticipants.filter((p) => {
      const expiresAt = p.bannedUntil || (p.bannedAt + 10 * 60 * 1000);
      return now < expiresAt;
    });

    if (active.length !== this.bannedParticipants.length) {
      this.bannedParticipants = active;
      this.saveBanned();
    }

    return [...this.bannedParticipants];
  }

  public isParticipantBanned(name: string): boolean {
    const clean = name.trim().toLowerCase();
    const activeList = this.getBannedParticipants();
    return activeList.some((p) => p.name.trim().toLowerCase() === clean);
  }

  public banParticipant(name: string, reason: string): BannedParticipant {
    const cleanName = name.trim();
    // Check if already active
    const activeList = this.getBannedParticipants();
    const existing = activeList.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const banned: BannedParticipant = {
      id: `ban-${Date.now()}`,
      name: cleanName,
      reason: reason || 'Forstyrrende oppførsel mot fellesskapet',
      bannedAt: Date.now(),
      bannedUntil: Date.now() + 10 * 60 * 1000, // Opphører automatisk etter 10 minutter
      bannedBy: this.profile.name,
    };

    this.bannedParticipants.unshift(banned);
    this.analytics.totalWarningsIssued += 1;
    this.saveBanned();
    this.saveAnalytics();
    return banned;
  }

  public unbanParticipant(nameOrId: string) {
    this.bannedParticipants = this.bannedParticipants.filter(
      (p) => p.id !== nameOrId && p.name.toLowerCase() !== nameOrId.toLowerCase()
    );
    this.saveBanned();
  }

  // Analytics
  public getAnalytics(): OwnerAnalytics {
    return { ...this.analytics };
  }

  public recordGameStarted(playerCount: number) {
    this.analytics.totalGamesHosted += 1;
    this.analytics.totalPlayersEngaged += playerCount;
    this.analytics.lastSessionDate = Date.now();
    this.saveAnalytics();
  }

  public recordBallDrawn() {
    this.analytics.totalBallsDrawn += 1;
    this.saveAnalytics();
  }

  public recordBingoWon() {
    this.analytics.totalBingosCelebrated += 1;
    this.saveAnalytics();
  }

  // Export Financial & Session Report
  public generateExportReport(): string {
    const lines = [
      `=== JOYPULSE BINGO - EIER & VERTSKONTROLL RAPPORT ===`,
      `Generert: ${new Date().toLocaleString('no-NO')}`,
      `Eier: ${this.profile.name} (${this.profile.email})`,
      `Vipps: ${this.profile.phoneOrVipps} | Bankkonto: ${this.profile.bankAccount}`,
      ``,
      `--- AKTIVITET & STATISTIKK ---`,
      `Totalt antall bingospill arrangert: ${this.analytics.totalGamesHosted}`,
      `Totalt antall kuler trukket: ${this.analytics.totalBallsDrawn}`,
      `Totalt antall BINGO-seire: ${this.analytics.totalBingosCelebrated}`,
      `Utestengte forstyrrende deltakere: ${this.bannedParticipants.length}`,
      ``,
      `--- SISTE KUNNGJØRINGER ---`,
      ...this.announcements.slice(0, 5).map((a) => `[${new Date(a.timestamp).toLocaleTimeString('no-NO')}] (${a.author}): ${a.message}`),
      ``,
      `Status: Systemet er 100% klart og operativt.`,
    ];
    return lines.join('\n');
  }

  // Category ordering
  public getCategoryOrder(): BingoTheme[] {
    return this.profile.categoryOrder && this.profile.categoryOrder.length > 0
      ? [...this.profile.categoryOrder]
      : [...DEFAULT_CATEGORY_ORDER];
  }

  public updateCategoryOrder(newOrder: BingoTheme[]) {
    this.updateProfile({ categoryOrder: newOrder });
  }

  public setFavoriteCategory(theme: BingoTheme) {
    const current = this.getCategoryOrder();
    const filtered = current.filter((t) => t !== theme);
    this.updateCategoryOrder([theme, ...filtered]);
  }
}

export const ownerControl = new OwnerControlService();
