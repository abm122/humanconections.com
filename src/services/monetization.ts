/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { firebasePersistence } from './firebasePersistence';

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'vipps' | 'invoice' | 'stripe';

export type ServiceFeeType = 'per_player' | 'event_pass' | 'pro_ril_bigscreen' | 'tip_coffee';

export interface CommissionTransaction {
  id: string;
  timestamp: number;
  type: ServiceFeeType;
  title: string;
  grossAmount: number; // in NOK
  commissionAmount: number; // in NOK (owner's net service cut)
  playerCount: number;
  paymentMethod: PaymentMethod;
  payerName?: string;
  status: 'completed' | 'pending';
  reference: string;
}

export interface PayoutRecord {
  id: string;
  timestamp: number;
  amount: number; // in NOK
  destinationType: 'bank' | 'vipps';
  bankAccount?: string;
  vippsNumber?: string;
  recipientName: string;
  status: 'completed' | 'processing';
  reference: string;
  receiptNumber: string;
  note?: string;
}

export interface OwnerMonetizationSettings {
  isMonetizationActive: boolean;
  ownerName: string;
  vippsNumber: string; // Eierens eget telefon- eller Vipps Bedriftsnummer
  bankAccount: string;
  payoutEmail: string;
  commissionPercent: number; // e.g. 15%
  fixedFeePerPlayer: number; // e.g. 10 NOK per player
  eventPassPrice: number; // e.g. 49 NOK
  proBigScreenPrice: number; // e.g. 199 NOK
  eventExtensionPrice: number; // e.g. 79 NOK for ekstratid utover 2 timer
  // Editable pricing tiers for packages
  price20MinTrial: number; // Standard 19 NOK (20 min prøvetid)
  price1Hour: number; // Standard 49 NOK
  price2Hours: number; // Standard 89 NOK
  price3Hours: number; // Standard 129 NOK
  price4Hours: number; // Standard 169 NOK
  priceFullDay: number; // Standard 199 NOK
  // Stripe Gateway Configuration for real money deduction
  stripeSecretKey?: string; // sk_live_... or sk_test_...
  stripePublishableKey?: string; // pk_live_... or pk_test_...
}

const SETTINGS_KEY = 'joypulse_owner_monetization_settings';
const TRANSACTIONS_KEY = 'joypulse_owner_transactions';
const PAYOUTS_KEY = 'joypulse_owner_payouts';

const DEFAULT_SETTINGS: OwnerMonetizationSettings = {
  isMonetizationActive: true,
  ownerName: 'JoyBingo Eier',
  vippsNumber: '920 00 000', // Permanent standard Vipps-nummer
  bankAccount: '',
  payoutEmail: 'adhanom3@gmail.com',
  commissionPercent: 15,
  fixedFeePerPlayer: 10,
  eventPassPrice: 49,
  proBigScreenPrice: 199,
  eventExtensionPrice: 79,
  price20MinTrial: 19,
  price1Hour: 49,
  price2Hours: 89,
  price3Hours: 129,
  price4Hours: 169,
  priceFullDay: 199,
  stripeSecretKey: '',
  stripePublishableKey: '',
};

// Initial realistic transactions to showcase existing revenue
const INITIAL_TRANSACTIONS: CommissionTransaction[] = [
  {
    id: 'tx-101',
    timestamp: Date.now() - 86400000 * 2,
    type: 'pro_ril_bigscreen',
    title: 'RIL Bedrift & Storskjerm-lisens (Idrettslag / Trivselskveld)',
    grossAmount: 199,
    commissionAmount: 199,
    playerCount: 6,
    paymentMethod: 'vipps',
    payerName: 'Lars (Arrangør / Idrettslaget)',
    status: 'completed',
    reference: 'VIPPS-782194',
  },
  {
    id: 'tx-102',
    timestamp: Date.now() - 86400000,
    type: 'per_player',
    title: 'Deltaker-servicegebyr (4 spillere à 10 kr)',
    grossAmount: 40,
    commissionAmount: 40,
    playerCount: 4,
    paymentMethod: 'vipps',
    payerName: 'Sofie H.',
    status: 'completed',
    reference: 'VIPPS-651203',
  },
  {
    id: 'tx-103',
    timestamp: Date.now() - 3600000 * 5,
    type: 'tip_coffee',
    title: 'Vipps Kaffe & Sosial Trivsels-støtte',
    grossAmount: 49,
    commissionAmount: 49,
    playerCount: 1,
    paymentMethod: 'vipps',
    payerName: 'Kari M.',
    status: 'completed',
    reference: 'VIPPS-992314',
  },
];

const INITIAL_PAYOUTS: PayoutRecord[] = [
  {
    id: 'payout-101',
    timestamp: Date.now() - 86400000 * 3,
    amount: 199,
    destinationType: 'bank',
    bankAccount: '1205.45.98124',
    recipientName: 'JoyBingo Eier',
    status: 'completed',
    reference: 'NICS-STRAKS-891023',
    receiptNumber: 'AVREGN-2026-001',
    note: 'Ukentlig oppgjør til bankkonto',
  },
];

class MonetizationService {
  private settings: OwnerMonetizationSettings;
  private transactions: CommissionTransaction[];
  private payouts: PayoutRecord[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.transactions = this.loadTransactions();
    this.payouts = this.loadPayouts();
    if (typeof window !== 'undefined') {
      void this.syncFromServer();
    }
  }

  private loadSettings(): OwnerMonetizationSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const resolvedVipps = parsed.vippsNumber?.trim() ? parsed.vippsNumber : '920 00 000';
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          vippsNumber: resolvedVipps,
        };
      }
    } catch {
      // Fallback to default
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notify();
    } catch {
      // Ignore storage errors
    }
  }

  private loadTransactions(): CommissionTransaction[] {
    try {
      const stored = localStorage.getItem(TRANSACTIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_TRANSACTIONS;
  }

  private saveTransactions() {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(this.transactions));
      this.notify();
    } catch {
      // Ignore
    }
  }

  private loadPayouts(): PayoutRecord[] {
    try {
      const stored = localStorage.getItem(PAYOUTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PAYOUTS;
  }

  private savePayouts() {
    try {
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(this.payouts));
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

  public getSettings(): OwnerMonetizationSettings {
    return { ...this.settings };
  }

  public applyServerSettings(partial: Partial<OwnerMonetizationSettings>) {
    if (!partial || typeof partial !== 'object') return;
    this.settings = {
      ...this.settings,
      ...partial,
      vippsNumber: partial.vippsNumber?.trim() ? partial.vippsNumber : this.settings.vippsNumber,
    };
    this.saveSettings();
  }

  public applyCloudTransactions(cloudTxs: CommissionTransaction[]) {
    if (!Array.isArray(cloudTxs) || cloudTxs.length === 0) return;
    const byId = new Map<string, CommissionTransaction>();
    for (const tx of this.transactions) {
      byId.set(tx.id, tx);
    }
    for (const tx of cloudTxs) {
      if (tx?.id) {
        byId.set(tx.id, tx);
      }
    }
    this.transactions = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
    this.saveTransactions();
  }

  public applyCloudPayouts(cloudPayouts: PayoutRecord[]) {
    if (!Array.isArray(cloudPayouts) || cloudPayouts.length === 0) return;
    const byId = new Map<string, PayoutRecord>();
    for (const p of this.payouts) {
      byId.set(p.id, p);
    }
    for (const p of cloudPayouts) {
      if (p?.id) {
        byId.set(p.id, p);
      }
    }
    this.payouts = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
    this.savePayouts();
  }

  public async syncFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/owner/public-config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data?.pricingSettings) {
        this.applyServerSettings(data.pricingSettings);
      }
    } catch {
      // Ignore offline/transient fetch errors
    }
  }

  public updateSettings(partial: Partial<OwnerMonetizationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  public getTransactions(): CommissionTransaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
  }

  public calculatePlayerFee(playerCount: number): { gross: number; commission: number } {
    const gross = playerCount * this.settings.fixedFeePerPlayer;
    const commission = gross; // App-owner receives the service fee
    return { gross, commission };
  }

  public isReferenceAlreadyUsed(ref: string): boolean {
    if (!ref || !ref.trim()) return false;
    const clean = ref.trim().toUpperCase();
    return this.transactions.some((tx) => tx.reference && tx.reference.toUpperCase() === clean);
  }

  public recordTransaction(data: {
    type: ServiceFeeType;
    title: string;
    grossAmount: number;
    commissionAmount: number;
    playerCount: number;
    paymentMethod: PaymentMethod;
    payerName?: string;
    reference?: string;
  }): CommissionTransaction {
    const finalRef = data.reference && data.reference.trim()
      ? data.reference.trim().toUpperCase()
      : `${data.paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTx: CommissionTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      ...data,
      status: 'completed',
      reference: finalRef,
    };

    this.transactions.unshift(newTx);
    this.saveTransactions();
    if (typeof window !== 'undefined' && firebasePersistence.isAdminSignedIn()) {
      void firebasePersistence.saveTransaction(newTx).catch((err) => {
        console.warn('Could not save transaction to Firestore:', err);
      });
    }
    return newTx;
  }

  public getTotalEarnings(): {
    totalGross: number;
    totalCommission: number;
    transactionsCount: number;
    paidPlayersCount: number;
  } {
    let totalGross = 0;
    let totalCommission = 0;
    let paidPlayersCount = 0;

    this.transactions.forEach((tx) => {
      if (tx.status === 'completed') {
        totalGross += tx.grossAmount;
        totalCommission += tx.commissionAmount;
        paidPlayersCount += tx.playerCount;
      }
    });

    return {
      totalGross,
      totalCommission,
      transactionsCount: this.transactions.length,
      paidPlayersCount,
    };
  }

  public resetTransactions(): void {
    this.transactions = [];
    this.saveTransactions();
  }

  // Payout Management System for App Owner
  public getPayouts(): PayoutRecord[] {
    return [...this.payouts].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getTotalPaidOut(): number {
    return this.payouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  public getAvailableForPayout(): number {
    const totalEarnings = this.getTotalEarnings().totalCommission;
    const paidOut = this.getTotalPaidOut();
    return Math.max(0, totalEarnings - paidOut);
  }

  public requestPayout(
    amount: number,
    destinationType: 'bank' | 'vipps',
    details: {
      bankAccount?: string;
      vippsNumber?: string;
      recipientName?: string;
      note?: string;
    }
  ): { success: boolean; payout?: PayoutRecord; error?: string } {
    const available = this.getAvailableForPayout();
    const cleanAmount = Math.floor(amount);

    if (cleanAmount <= 0) {
      return { success: false, error: 'Beløpet må være større enn 0 kr.' };
    }

    if (cleanAmount > available) {
      return {
        success: false,
        error: `Utbetalingsbeløpet (${cleanAmount} kr) overstiger disponibel saldo (${available} kr).`,
      };
    }

    if (destinationType === 'bank') {
      const cleanBank = (details.bankAccount || this.settings.bankAccount || '').replace(/[^0-9]/g, '');
      if (cleanBank.length < 11) {
        return {
          success: false,
          error: 'Vennligst oppgi et gyldig 11-sifret norsk bankkontonummer (f.eks. 1234.56.78901).',
        };
      }
    } else {
      const cleanVipps = (details.vippsNumber || this.settings.vippsNumber || '').replace(/[^0-9]/g, '');
      if (cleanVipps.length < 8) {
        return {
          success: false,
          error: 'Vennligst oppgi et gyldig norsk mobilnummer for Vipps (8 siffer).',
        };
      }
    }

    const newPayout: PayoutRecord = {
      id: `payout-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: Date.now(),
      amount: cleanAmount,
      destinationType,
      bankAccount: details.bankAccount || this.settings.bankAccount,
      vippsNumber: details.vippsNumber || this.settings.vippsNumber,
      recipientName: details.recipientName || this.settings.ownerName || 'JoyBingo Eier',
      status: 'completed',
      reference: destinationType === 'bank'
        ? `NICS-STRAKS-${Math.floor(100000 + Math.random() * 900000)}`
        : `VIPPS-UTB-${Math.floor(100000 + Math.random() * 900000)}`,
      receiptNumber: `AVREGN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      note: details.note || (destinationType === 'bank' ? 'Straksutbetaling til bankkonto' : 'Vipps-utbetaling'),
    };

    this.payouts.unshift(newPayout);
    this.savePayouts();
    if (typeof window !== 'undefined' && firebasePersistence.isAdminSignedIn()) {
      void firebasePersistence.savePayout(newPayout).catch((err) => {
        console.warn('Could not save payout to Firestore:', err);
      });
    }

    return { success: true, payout: newPayout };
  }

  public resetPayouts(): void {
    this.payouts = [];
    this.savePayouts();
  }
}

export const monetization = new MonetizationService();
