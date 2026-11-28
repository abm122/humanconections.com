/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ownerControl } from './ownerControl';
import { sessionTimer } from './sessionTimer';

export type UserRole = 'owner' | 'host' | 'player';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  avatarColor: string;
  isAuthenticated: boolean;
  lastLoginAt: number;
  vippsNumber?: string;
}

const AUTH_STORAGE_KEY = 'joypulse_auth_session';
const AUTH_OWNER_TAB_KEY = 'joypulse_auth_owner_tab_session';

// Default session for players and hosts: regular guest with zero exposed owner details
const DEFAULT_GUEST_USER: AuthUser = {
  id: 'usr-guest-default',
  name: 'Gjest',
  email: '',
  role: 'player',
  avatar: '👤',
  avatarColor: '#64748b',
  isAuthenticated: false,
  lastLoginAt: Date.now(),
};

class AuthService {
  private currentUser: AuthUser;
  private listeners: Set<() => void> = new Set();
  private loginListeners: Set<(user: AuthUser) => void> = new Set();

  constructor() {
    this.currentUser = this.loadSession();

    // If ownerControl is already unlocked (e.g. tab sessionStorage or verified Firebase admin), sync authUser
    if (ownerControl.isUnlocked() && this.currentUser.role !== 'owner') {
      this.applyOwnerUserFromProfile();
    } else if (this.currentUser.role === 'owner' && this.currentUser.isAuthenticated) {
      ownerControl.unlockAdmin();
      sessionTimer.grantOwnerAccess();
    }

    ownerControl.subscribe(() => {
      const unlocked = ownerControl.isUnlocked();
      if (unlocked && this.currentUser.role !== 'owner') {
        this.applyOwnerUserFromProfile();
        sessionTimer.grantOwnerAccess();
      } else if (!unlocked && this.currentUser.role === 'owner') {
        this.currentUser = { ...DEFAULT_GUEST_USER, lastLoginAt: Date.now() };
        this.saveSession();
      }
    });
  }

  private buildOwnerUser(): AuthUser {
    const profile = ownerControl.getProfile();
    return {
      id: 'usr-owner-active',
      name: profile.name || 'Eier (Admin)',
      email: profile.email || 'adhanom3@gmail.com',
      role: 'owner',
      avatar: '👑',
      avatarColor: '#f59e0b',
      isAuthenticated: true,
      lastLoginAt: Date.now(),
      vippsNumber: profile.phoneOrVipps || '920 00 000',
    };
  }

  private applyOwnerUserFromProfile() {
    const prevWasOwner = this.currentUser.isAuthenticated && this.currentUser.role === 'owner';
    this.currentUser = this.buildOwnerUser();
    this.saveSession();
    if (!prevWasOwner) {
      this.emitLoginEvent();
    }
  }

  private loadSession(): AuthUser {
    try {
      if (typeof window !== 'undefined') {
        const tabOwnerRaw = window.sessionStorage.getItem(AUTH_OWNER_TAB_KEY);
        if (tabOwnerRaw) {
          const parsed = JSON.parse(tabOwnerRaw);
          if (parsed && parsed.role === 'owner' && parsed.isAuthenticated) {
            return parsed;
          }
        }
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.name) {
            // Migrate any pre-existing localStorage owner session into tab-scoped sessionStorage
            if (parsed.role === 'owner' && parsed.isAuthenticated) {
              window.sessionStorage.setItem(AUTH_OWNER_TAB_KEY, JSON.stringify(parsed));
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
            return parsed;
          }
        }
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_GUEST_USER };
  }

  private saveSession() {
    try {
      if (typeof window !== 'undefined') {
        if (this.currentUser.role === 'owner' && this.currentUser.isAuthenticated) {
          window.sessionStorage.setItem(AUTH_OWNER_TAB_KEY, JSON.stringify(this.currentUser));
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          window.sessionStorage.removeItem(AUTH_OWNER_TAB_KEY);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
        }
      }
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

  public onLogin(cb: (user: AuthUser) => void): () => void {
    this.loginListeners.add(cb);
    return () => this.loginListeners.delete(cb);
  }

  private emitLoginEvent() {
    const snapshot = this.getCurrentUser();
    this.loginListeners.forEach((cb) => cb(snapshot));
  }

  public getCurrentUser(): AuthUser {
    return { ...this.currentUser };
  }

  public isOwnerAuthenticated(): boolean {
    return (this.currentUser.isAuthenticated && this.currentUser.role === 'owner') || ownerControl.isUnlocked();
  }

  public verifyOwnerPin(pin: string): boolean {
    return ownerControl.verifyPin(pin);
  }

  public async verifyOwnerPinAsync(pin: string): Promise<boolean> {
    return ownerControl.verifyPinAsync(pin);
  }

  public async loginWithPinAsync(pin: string, name?: string, email?: string, vipps?: string): Promise<AuthUser | null> {
    const valid = await this.verifyOwnerPinAsync(pin);
    if (!valid) {
      return null;
    }

    const profile = ownerControl.getProfile();
    this.currentUser = {
      id: 'usr-owner-active',
      name: name?.trim() || profile.name || 'Eier (Admin)',
      email: email?.trim() || profile.email || 'adhanom3@gmail.com',
      role: 'owner',
      avatar: '👑',
      avatarColor: '#f59e0b',
      isAuthenticated: true,
      lastLoginAt: Date.now(),
      vippsNumber: vipps?.trim() || profile.phoneOrVipps || '920 00 000',
    };
    ownerControl.unlockAdmin();
    sessionTimer.grantOwnerAccess();
    this.saveSession();
    this.emitLoginEvent();
    return this.currentUser;
  }

  public loginWithPin(pin: string, name?: string, email?: string, vipps?: string): AuthUser | null {
    if (!this.verifyOwnerPin(pin)) {
      return null;
    }

    const profile = ownerControl.getProfile();
    this.currentUser = {
      id: 'usr-owner-active',
      name: name?.trim() || profile.name || 'Eier (Admin)',
      email: email?.trim() || profile.email || 'adhanom3@gmail.com',
      role: 'owner',
      avatar: '👑',
      avatarColor: '#f59e0b',
      isAuthenticated: true,
      lastLoginAt: Date.now(),
      vippsNumber: vipps?.trim() || profile.phoneOrVipps || '920 00 000',
    };
    ownerControl.unlockAdmin();
    sessionTimer.grantOwnerAccess();
    this.saveSession();
    this.emitLoginEvent();
    return this.currentUser;
  }

  public loginAsHost(name: string, email?: string): AuthUser {
    ownerControl.lockAdmin(); // Kun eier har tilgang til eierpanelet
    // Behold eksisterende betalt spilletid dersom brukeren allerede har betalt!
    this.currentUser = {
      id: `usr-host-${Date.now()}`,
      name: name.trim() || 'Bingovert',
      email: email?.trim() || '',
      role: 'host',
      avatar: '🎤',
      avatarColor: '#7c3aed',
      isAuthenticated: true,
      lastLoginAt: Date.now(),
    };
    this.saveSession();
    this.emitLoginEvent();
    return this.currentUser;
  }

  public loginAsPlayer(name: string, avatar = '🌸', color = '#059669', email?: string): AuthUser {
    ownerControl.lockAdmin(); // Kun eier har tilgang til eierpanelet
    // Behold eksisterende betalt spilletid dersom brukeren allerede har betalt!
    this.currentUser = {
      id: `usr-player-${Date.now()}`,
      name: name.trim() || 'Spiller',
      email: email?.trim() || '',
      role: 'player',
      avatar,
      avatarColor: color,
      isAuthenticated: true,
      lastLoginAt: Date.now(),
    };
    this.saveSession();
    this.emitLoginEvent();
    return this.currentUser;
  }

  public updateUserName(newName: string): AuthUser {
    const clean = newName.trim();
    if (!clean) return this.currentUser;
    this.currentUser = {
      ...this.currentUser,
      name: clean,
      isAuthenticated: true,
    };
    this.saveSession();
    return this.currentUser;
  }

  public ensureAuthenticatedFromPayment(name?: string, email?: string): AuthUser {
    if (this.currentUser.isAuthenticated) {
      // If user is already logged in with a generic name and gave a real name, keep existing unless generic
      return this.currentUser;
    }
    return this.loginAsHost(name?.trim() || 'Arrangør', email);
  }

  public logout(): void {
    const wasOwner = this.currentUser.role === 'owner' || ownerControl.isUnlocked();
    if (!this.currentUser.isAuthenticated && !wasOwner) {
      return;
    }
    if (wasOwner && ownerControl.getCloudStatus().isSignedIn) {
      void ownerControl.signOutGoogleAdmin();
    }
    ownerControl.lockAdmin(); // Kun eier har tilgang til eierpanelet
    this.currentUser = {
      id: `usr-guest-${Date.now()}`,
      name: 'Gjest',
      email: '',
      role: 'player',
      avatar: '👤',
      avatarColor: '#64748b',
      isAuthenticated: false,
      lastLoginAt: Date.now(),
    };
    this.saveSession();
    sessionTimer.resetToUnpaid();
  }
}

export const authService = new AuthService();
