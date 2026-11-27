/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AUTHORIZED_OWNER_EMAIL,
  FIREBASE_PROJECT_ID,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import type { OwnerLayoutPrefs, OwnerProfile, StartPanelDefaults } from './ownerControl';
import type {
  CommissionTransaction,
  OwnerMonetizationSettings,
  PayoutRecord,
} from './monetization';

const PUBLIC_CONFIG_PATH = 'publicConfig/app';
const OWNER_SECRETS_PATH = 'ownerSecrets/settings';

export interface CloudOwnerSecrets {
  ownerUid: string;
  ownerName: string;
  email: string;
  phoneOrVipps: string;
  bankAccount: string;
  payoutEmail: string;
  pin: string;
}

export interface CloudPublicConfig {
  appTitle: string;
  appSubtitle: string;
  customWinnerTaskLine1: string;
  customWinnerTaskLine2: string;
  customWinnerTaskBingo: string;
  categoryOrder: string[];
  visibleModules: OwnerProfile['visibleModules'];
  startPanelDefaults?: StartPanelDefaults;
  layoutPrefs?: OwnerLayoutPrefs;
  isMonetizationActive: boolean;
  commissionPercent: number;
  fixedFeePerPlayer: number;
  eventPassPrice: number;
  proBigScreenPrice: number;
  eventExtensionPrice: number;
  price20MinTrial: number;
  price1Hour: number;
  price2Hours: number;
  price3Hours: number;
  price4Hours: number;
  priceFullDay: number;
}

function sanitizeNonNeg(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function sanitizeDocId(raw: string): string {
  const clean = (raw || '').replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return clean || `id-${Date.now()}`;
}

export function isAuthorizedFirebaseAdmin(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()
  );
}

class FirebasePersistenceService {
  private currentUser: User | null = null;
  private authReady = false;
  private authListeners: Set<() => void> = new Set();
  private publicSnapshotUnsub: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.authReady = true;
        this.notifyAuth();
      });
    }
  }

  private notifyAuth() {
    this.authListeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore listener errors
      }
    });
  }

  public subscribeAuth(cb: () => void): () => void {
    this.authListeners.add(cb);
    return () => this.authListeners.delete(cb);
  }

  public isAuthReady(): boolean {
    return this.authReady;
  }

  public getCurrentFirebaseUser(): User | null {
    return this.currentUser;
  }

  public isAdminSignedIn(): boolean {
    return isAuthorizedFirebaseAdmin(this.currentUser);
  }

  public formatFirebaseError(err: unknown): string {
    const rawMsg = err instanceof Error ? err.message : String(err || 'Ukjent Firebase-feil');
    const rawCode =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code || '')
        : '';
    const codeMatch = rawMsg.match(/\((auth\/[a-z0-9-]+)\)/i);
    const code = rawCode || (codeMatch ? codeMatch[1] : '');
    const host = typeof window !== 'undefined' ? window.location.hostname : '';

    if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
      return `Domenet «${host || 'denne adressen'}» er ikke godkjent i Firebase-prosjektet «${FIREBASE_PROJECT_ID}» (${code || 'auth/unauthorized-domain'}). Legg til «${host}» under Authentication → Settings → Authorized domains i Firebase Console for prosjektet «${FIREBASE_PROJECT_ID}».`;
    }
    if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
      return `Nettleseren blokkerte Google-innloggingsvinduet (${code || 'auth/popup-blocked'}). Tillat sprettoppvinduer (pop-ups) for denne siden, eller åpne appen i en egen fane og prøv igjen.`;
    }
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      rawMsg.includes('popup-closed-by-user')
    ) {
      return `Innloggingsvinduet ble lukket før Google-påloggingen ble fullført (${code || 'auth/popup-closed-by-user'}). Prøv igjen og fullfør innloggingen.`;
    }
    if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
      return `Google-innlogging er ikke skrudd på i Firebase-prosjektet «${FIREBASE_PROJECT_ID}» (${code || 'auth/operation-not-allowed'}). Gå til Authentication → Sign-in method i Firebase Console og aktiver Google.`;
    }
    if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
      return `Nettverksfeil mot Firebase (${code || 'auth/network-request-failed'}). Sjekk internettforbindelsen eller om nettleserutvidelser blokkerer Google/Firebase.`;
    }
    if (rawMsg.toLowerCase().includes('missing or insufficient permissions') || rawMsg.toLowerCase().includes('permission-denied')) {
      return `Manglende Firestore-rettigheter i prosjektet «${FIREBASE_PROJECT_ID}» (permission-denied). Kontroller at du er logget inn som ${AUTHORIZED_OWNER_EMAIL} og at databasereglene er publisert.`;
    }
    return `${rawMsg} [Prosjekt: ${FIREBASE_PROJECT_ID}${host ? `, domene: ${host}` : ''}]`;
  }

  public async signInOwnerWithGoogle(): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!isAuthorizedFirebaseAdmin(user)) {
        await signOut(auth);
        return {
          success: false,
          error: `Kun autorisert eier (${AUTHORIZED_OWNER_EMAIL}) med bekreftet e-post har admin-tilgang til sky-databasen.`,
        };
      }
      // Ensure the fresh verified ID token is minted and available to Firestore before reads/writes
      await user.getIdToken(true);
      this.currentUser = user;
      this.authReady = true;
      this.notifyAuth();
      return { success: true, user };
    } catch (err: unknown) {
      return { success: false, error: this.formatFirebaseError(err) };
    }
  }

  public async signOutOwner(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyAuth();
    } catch {
      // ignore
    }
  }

  public startPublicConfigListener(onData: (cfg: CloudPublicConfig) => void): () => void {
    if (this.publicSnapshotUnsub) {
      this.publicSnapshotUnsub();
    }
    const ref = doc(db, 'publicConfig', 'app');

    // Initial server fetch so fresh loads get latest Firestore prices right away
    void getDocFromServer(ref)
      .then((snap) => {
        if (snap.exists()) {
          onData(snap.data() as CloudPublicConfig);
        }
      })
      .catch(() => {
        // Fallback to snapshot listener or server REST
      });

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          onData(snap.data() as CloudPublicConfig);
        }
      },
      (error) => {
        // Ignore offline/unavailable errors silently; surface permission errors via handleFirestoreError
        if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
          handleFirestoreError(error, OperationType.GET, PUBLIC_CONFIG_PATH);
        }
      }
    );

    this.publicSnapshotUnsub = unsub;
    return unsub;
  }

  public async loadOwnerSecrets(): Promise<CloudOwnerSecrets | null> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user)) return null;

    const ref = doc(db, 'ownerSecrets', 'settings');
    try {
      let snap;
      try {
        snap = await getDocFromServer(ref);
      } catch {
        snap = await getDoc(ref);
      }
      if (!snap.exists()) return null;
      return snap.data() as CloudOwnerSecrets;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, OWNER_SECRETS_PATH);
    }
  }

  public async savePublicConfig(
    profile: OwnerProfile,
    pricing: OwnerMonetizationSettings
  ): Promise<void> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return;

    const ref = doc(db, 'publicConfig', 'app');
    const vm = profile.visibleModules;
    const payload = {
      appTitle: (profile.appTitle || 'Human-connection').trim().slice(0, 100) || 'Human-connection',
      appSubtitle: (profile.appSubtitle || '').trim().slice(0, 250),
      customWinnerTaskLine1: (profile.customWinnerTaskLine1 || '').trim().slice(0, 300),
      customWinnerTaskLine2: (profile.customWinnerTaskLine2 || '').trim().slice(0, 300),
      customWinnerTaskBingo: (profile.customWinnerTaskBingo || '').trim().slice(0, 300),
      categoryOrder:
        Array.isArray(profile.categoryOrder) && profile.categoryOrder.length > 0
          ? profile.categoryOrder.slice(0, 12).map((c) => String(c).slice(0, 40))
          : ['ril', 'classic_joy', 'family_kids', 'heartfelt', 'laughter', 'kindness', 'gratitude'],
      visibleModules: {
        showBigScreen: Boolean(vm?.showBigScreen ?? true),
        showMixer: Boolean(vm?.showMixer ?? true),
        showSchedule: Boolean(vm?.showSchedule ?? false),
        showQuests: Boolean(vm?.showQuests ?? true),
        showIosInstall: Boolean(vm?.showIosInstall ?? false),
        showPrint: Boolean(vm?.showPrint ?? true),
        showReport: Boolean(vm?.showReport ?? true),
        showBroadcast: Boolean(vm?.showBroadcast ?? true),
        showParticipants: Boolean(vm?.showParticipants ?? true),
        showDrumOnMobile: Boolean(vm?.showDrumOnMobile ?? true),
        familyKidsMode: Boolean(vm?.familyKidsMode ?? true),
      },
      startPanelDefaults: {
        defaultMode: (['ALL_IN_ONE', 'HUMAN_BINGO', 'CALLER_CAGE', 'PASS_PLAY'] as const).includes(
          profile.startPanelDefaults?.defaultMode as any
        )
          ? profile.startPanelDefaults!.defaultMode
          : 'ALL_IN_ONE',
        defaultCardDisplayMode: (['both', 'numbers', 'prompts'] as const).includes(
          profile.startPanelDefaults?.defaultCardDisplayMode as any
        )
          ? profile.startPanelDefaults!.defaultCardDisplayMode
          : 'both',
        defaultCardsPerPlayer: Math.max(
          1,
          Math.min(6, Math.round(Number(profile.startPanelDefaults?.defaultCardsPerPlayer) || 1))
        ),
        defaultScreenDevice: (['mobile', 'desktop', 'big_screen'] as const).includes(
          profile.startPanelDefaults?.defaultScreenDevice as any
        )
          ? profile.startPanelDefaults!.defaultScreenDevice
          : 'desktop',
        defaultPlayerCount: Math.max(
          1,
          Math.min(100, Math.round(Number(profile.startPanelDefaults?.defaultPlayerCount) || 2))
        ),
        showLiveDrum: Boolean(profile.startPanelDefaults?.showLiveDrum ?? true),
      },
      layoutPrefs: {
        swapColumns: Boolean(profile.layoutPrefs?.swapColumns ?? false),
        leftSectionOrder: Array.isArray(profile.layoutPrefs?.leftSectionOrder)
          ? profile.layoutPrefs!.leftSectionOrder.slice(0, 12).map((s) => String(s).slice(0, 40))
          : ['hero', 'host_code', 'kahoot_join', 'drum'],
        rightSectionOrder: Array.isArray(profile.layoutPrefs?.rightSectionOrder)
          ? profile.layoutPrefs!.rightSectionOrder.slice(0, 12).map((s) => String(s).slice(0, 40))
          : [
              'status_banner',
              'category',
              'mode',
              'card_format',
              'players',
              'cards_screen',
              'remote_strip',
              'start_actions',
            ],
        collapsedSections: Array.isArray(profile.layoutPrefs?.collapsedSections)
          ? profile.layoutPrefs!.collapsedSections.slice(0, 12).map((s) => String(s).slice(0, 40))
          : [],
        quizSwapColumns: Boolean(profile.layoutPrefs?.quizSwapColumns ?? false),
        quizDefaultSize: (['compact', 'standard', 'expanded'] as const).includes(
          profile.layoutPrefs?.quizDefaultSize as any
        )
          ? profile.layoutPrefs!.quizDefaultSize
          : 'standard',
        quizDefaultDock: (['center', 'left', 'right', 'top_left', 'top_right'] as const).includes(
          profile.layoutPrefs?.quizDefaultDock as any
        )
          ? profile.layoutPrefs!.quizDefaultDock
          : 'center',
        quizCollapsedPanels: Array.isArray(profile.layoutPrefs?.quizCollapsedPanels)
          ? profile.layoutPrefs!.quizCollapsedPanels.slice(0, 12).map((s) => String(s).slice(0, 40))
          : [],
      },
      isMonetizationActive: Boolean(pricing.isMonetizationActive ?? true),
      commissionPercent: sanitizeNonNeg(pricing.commissionPercent, 15),
      fixedFeePerPlayer: sanitizeNonNeg(pricing.fixedFeePerPlayer, 10),
      eventPassPrice: sanitizeNonNeg(pricing.eventPassPrice, 49),
      proBigScreenPrice: sanitizeNonNeg(pricing.proBigScreenPrice, 199),
      eventExtensionPrice: sanitizeNonNeg(pricing.eventExtensionPrice, 79),
      price20MinTrial: sanitizeNonNeg(pricing.price20MinTrial, 19),
      price1Hour: sanitizeNonNeg(pricing.price1Hour, 49),
      price2Hours: sanitizeNonNeg(pricing.price2Hours, 89),
      price3Hours: sanitizeNonNeg(pricing.price3Hours, 129),
      price4Hours: sanitizeNonNeg(pricing.price4Hours, 169),
      priceFullDay: sanitizeNonNeg(pricing.priceFullDay, 199),
      updatedByUid: user.uid,
    };

    try {
      const existingSnap = await getDoc(ref);
      if (!existingSnap.exists()) {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, PUBLIC_CONFIG_PATH);
    }
  }

  public async saveOwnerSecrets(secrets: {
    ownerName: string;
    email: string;
    phoneOrVipps: string;
    bankAccount: string;
    payoutEmail: string;
    pin: string;
  }): Promise<void> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return;

    const cleanPin = (secrets.pin || '').trim();
    if (cleanPin.length < 4) return;

    const ref = doc(db, 'ownerSecrets', 'settings');
    const cleanFields = {
      ownerName: (secrets.ownerName || 'Eier & Admin').trim().slice(0, 100) || 'Eier & Admin',
      email: (secrets.email || AUTHORIZED_OWNER_EMAIL).trim().slice(0, 150),
      phoneOrVipps: (secrets.phoneOrVipps || '').trim().slice(0, 40),
      bankAccount: (secrets.bankAccount || '').trim().slice(0, 40),
      payoutEmail: (secrets.payoutEmail || AUTHORIZED_OWNER_EMAIL).trim().slice(0, 150),
      pin: cleanPin.slice(0, 20),
    };

    try {
      const existingSnap = await getDoc(ref);
      if (!existingSnap.exists()) {
        await setDoc(ref, {
          ownerUid: user.uid,
          ...cleanFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          ...cleanFields,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, OWNER_SECRETS_PATH);
    }
  }

  public async savePayout(payout: PayoutRecord): Promise<void> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return;
    const docId = sanitizeDocId(payout.id);
    const path = `payouts/${docId}`;
    const docRef = doc(db, 'payouts', docId);
    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) return;
      await setDoc(docRef, {
        id: docId,
        ownerUid: user.uid,
        timestamp: sanitizeNonNeg(payout.timestamp, Date.now()),
        amount: sanitizeNonNeg(payout.amount, 0),
        destinationType: payout.destinationType === 'vipps' ? 'vipps' : 'bank',
        ...(payout.bankAccount ? { bankAccount: payout.bankAccount.slice(0, 40) } : {}),
        ...(payout.vippsNumber ? { vippsNumber: payout.vippsNumber.slice(0, 40) } : {}),
        recipientName: (payout.recipientName || 'JoyBingo Eier').slice(0, 100),
        status: payout.status === 'processing' ? 'processing' : 'completed',
        reference: (payout.reference || `REF-${Date.now()}`).slice(0, 80),
        receiptNumber: (payout.receiptNumber || `AVREGN-${Date.now()}`).slice(0, 80),
        ...(payout.note ? { note: payout.note.slice(0, 200) } : {}),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public async loadPayouts(): Promise<PayoutRecord[]> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return [];
    const path = 'payouts';
    try {
      const q = query(collection(db, 'payouts'), where('ownerUid', '==', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as PayoutRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  public async saveTransaction(tx: CommissionTransaction): Promise<void> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return;
    const docId = sanitizeDocId(tx.id);
    const path = `transactions/${docId}`;
    const docRef = doc(db, 'transactions', docId);
    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) return;
      await setDoc(docRef, {
        id: docId,
        ownerUid: user.uid,
        timestamp: sanitizeNonNeg(tx.timestamp, Date.now()),
        type: tx.type,
        title: (tx.title || 'Transaksjon').slice(0, 200),
        grossAmount: sanitizeNonNeg(tx.grossAmount, 0),
        commissionAmount: sanitizeNonNeg(tx.commissionAmount, 0),
        playerCount: sanitizeNonNeg(tx.playerCount, 1),
        paymentMethod: tx.paymentMethod,
        ...(tx.payerName ? { payerName: tx.payerName.slice(0, 100) } : {}),
        status: tx.status === 'pending' ? 'pending' : 'completed',
        reference: (tx.reference || `TX-${Date.now()}`).slice(0, 80),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public async loadTransactions(): Promise<CommissionTransaction[]> {
    const user = auth.currentUser;
    if (!isAuthorizedFirebaseAdmin(user) || !user) return [];
    const path = 'transactions';
    try {
      const q = query(collection(db, 'transactions'), where('ownerUid', '==', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as CommissionTransaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  public isHostCloudCapable(): boolean {
    const user = auth.currentUser;
    return Boolean(user && user.emailVerified);
  }

  public async syncActiveRoom(params: {
    roomCode: string;
    hostName: string;
    activeGame?: 'bingo' | 'quiz';
    hasBingo?: boolean;
    hasQuiz?: boolean;
    edition?: 'adult' | 'family' | 'christmas' | 'senior';
    calledBallNumbers?: number[];
    playersSummary?: Array<{ name: string; linesCompleted: number; hasBingo: boolean }>;
    quizState?: Record<string, unknown> | null;
    showCodeOnScreen?: boolean;
    ttlMs?: number;
  }): Promise<{ ok: boolean; conflict?: boolean }> {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return { ok: false };
    const cleanCode = (params.roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    if (!/^[A-Z0-9]{3,16}$/.test(cleanCode)) return { ok: false };

    const cleanBalls = Array.from(
      new Set(
        (Array.isArray(params.calledBallNumbers) ? params.calledBallNumbers : [])
          .map((n) => Math.trunc(Number(n)))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 75)
      )
    ).slice(0, 75);

    const activeGame: 'bingo' | 'quiz' = params.activeGame === 'quiz' ? 'quiz' : 'bingo';
    const edition: 'adult' | 'family' | 'christmas' | 'senior' =
      params.edition === 'family' || params.edition === 'christmas' || params.edition === 'senior'
        ? params.edition
        : 'adult';
    const cleanHostName = (params.hostName || 'Arrangør').trim().slice(0, 60) || 'Arrangør';
    const ttl = Math.max(60_000, Number(params.ttlMs) || 24 * 60 * 60 * 1000);
    const expiresAtMs = Date.now() + ttl;
    const cleanSummary = Array.isArray(params.playersSummary)
      ? params.playersSummary.slice(0, 50).map((p) => ({
          name: String(p.name || 'Spiller').slice(0, 40),
          linesCompleted: Math.max(0, Math.trunc(Number(p.linesCompleted) || 0)),
          hasBingo: Boolean(p.hasBingo),
        }))
      : undefined;

    const ref = doc(db, 'activeRooms', cleanCode);
    try {
      const existingSnap = await getDoc(ref);
      const baseFields: Record<string, unknown> = {
        hostName: cleanHostName,
        activeGame,
        hasBingo: Boolean(params.hasBingo ?? true),
        hasQuiz: Boolean(params.hasQuiz ?? true),
        edition,
        calledBallNumbers: cleanBalls,
        showCodeOnScreen: Boolean(params.showCodeOnScreen ?? true),
        expiresAtMs,
        updatedAt: serverTimestamp(),
      };
      if (cleanSummary) {
        baseFields.playersSummary = cleanSummary;
      }
      if (params.quizState && typeof params.quizState === 'object') {
        baseFields.quizState = params.quizState;
      }

      if (!existingSnap.exists()) {
        await setDoc(ref, {
          roomCode: cleanCode,
          ownerUid: user.uid,
          ...baseFields,
          createdAt: serverTimestamp(),
        });
      } else {
        const existingData = existingSnap.data();
        if (
          existingData?.ownerUid &&
          existingData.ownerUid !== user.uid &&
          !isAuthorizedFirebaseAdmin(user)
        ) {
          return { ok: false, conflict: true };
        }
        await updateDoc(ref, baseFields);
      }
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.toLowerCase().includes('permission')) {
        return { ok: false, conflict: true };
      }
      console.warn('Could not sync active room to Firestore:', error);
      return { ok: false };
    }
  }

  public async getActiveRoomFromFirestore(roomCode: string): Promise<{
    roomCode: string;
    hostName: string;
    activeGame: 'bingo' | 'quiz';
    hasBingo: boolean;
    hasQuiz: boolean;
    edition: 'adult' | 'family' | 'christmas' | 'senior';
    calledBallNumbers: number[];
    playersSummary?: Array<{
      id?: string;
      name: string;
      avatarColor?: string;
      linesCompleted: number;
      hasBingo: boolean;
    }>;
    quizState?: Record<string, unknown> | null;
    showCodeOnScreen: boolean;
    expiresAtMs: number;
    updatedAt: number;
  } | null> {
    const cleanCode = (roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    if (!/^[A-Z0-9]{3,16}$/.test(cleanCode)) return null;
    const ref = doc(db, 'activeRooms', cleanCode);
    try {
      let snap;
      try {
        snap = await getDocFromServer(ref);
      } catch {
        snap = await getDoc(ref);
      }
      if (!snap.exists()) return null;
      const d = snap.data() as Record<string, any>;
      const expiresAtMs = Number(d.expiresAtMs || 0);
      if (expiresAtMs > 0 && Date.now() > expiresAtMs) return null;
      const updatedAt =
        typeof d.updatedAt?.toMillis === 'function'
          ? Number(d.updatedAt.toMillis())
          : Number(d.updatedAt || Date.now());
      return {
        roomCode: cleanCode,
        hostName: String(d.hostName || 'Arrangør'),
        activeGame: d.activeGame === 'quiz' ? 'quiz' : 'bingo',
        hasBingo: d.hasBingo !== false,
        hasQuiz: d.hasQuiz !== false,
        edition:
          d.edition === 'family' || d.edition === 'christmas' || d.edition === 'senior'
            ? d.edition
            : 'adult',
        calledBallNumbers: Array.isArray(d.calledBallNumbers)
          ? d.calledBallNumbers.map((n: unknown) => Math.trunc(Number(n))).filter((n: number) => n >= 1 && n <= 75)
          : [],
        playersSummary: Array.isArray(d.playersSummary) ? d.playersSummary : undefined,
        quizState: d.quizState && typeof d.quizState === 'object' ? d.quizState : null,
        showCodeOnScreen: d.showCodeOnScreen !== false,
        expiresAtMs,
        updatedAt,
      };
    } catch {
      return null;
    }
  }

  public subscribeActiveRoom(
    roomCode: string,
    onData: (room: {
      roomCode: string;
      hostName: string;
      activeGame: 'bingo' | 'quiz';
      hasBingo: boolean;
      hasQuiz: boolean;
      edition: 'adult' | 'family' | 'christmas' | 'senior';
      calledBallNumbers: number[];
      playersSummary?: Array<{
        id?: string;
        name: string;
        avatarColor?: string;
        linesCompleted: number;
        hasBingo: boolean;
      }>;
      quizState?: Record<string, unknown> | null;
      showCodeOnScreen: boolean;
      expiresAtMs: number;
      updatedAt: number;
    } | null) => void
  ): () => void {
    const cleanCode = (roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    if (!/^[A-Z0-9]{3,16}$/.test(cleanCode)) return () => {};
    const ref = doc(db, 'activeRooms', cleanCode);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          onData(null);
          return;
        }
        const d = snap.data() as Record<string, any>;
        const expiresAtMs = Number(d.expiresAtMs || 0);
        if (expiresAtMs > 0 && Date.now() > expiresAtMs) {
          onData(null);
          return;
        }
        const updatedAt =
          typeof d.updatedAt?.toMillis === 'function'
            ? Number(d.updatedAt.toMillis())
            : Number(d.updatedAt || Date.now());
        onData({
          roomCode: cleanCode,
          hostName: String(d.hostName || 'Arrangør'),
          activeGame: d.activeGame === 'quiz' ? 'quiz' : 'bingo',
          hasBingo: d.hasBingo !== false,
          hasQuiz: d.hasQuiz !== false,
          edition:
            d.edition === 'family' || d.edition === 'christmas' || d.edition === 'senior'
              ? d.edition
              : 'adult',
          calledBallNumbers: Array.isArray(d.calledBallNumbers)
            ? d.calledBallNumbers.map((n: unknown) => Math.trunc(Number(n))).filter((n: number) => n >= 1 && n <= 75)
            : [],
          playersSummary: Array.isArray(d.playersSummary) ? d.playersSummary : undefined,
          quizState: d.quizState && typeof d.quizState === 'object' ? d.quizState : null,
          showCodeOnScreen: d.showCodeOnScreen !== false,
          expiresAtMs,
          updatedAt,
        });
      },
      () => {
        // Ignore transient offline listener warnings
      }
    );
  }

  public async deleteActiveRoom(roomCode: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return;
    const cleanCode = (roomCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    if (!/^[A-Z0-9]{3,16}$/.test(cleanCode)) return;
    try {
      await deleteDoc(doc(db, 'activeRooms', cleanCode));
    } catch {
      // Ignore if already deleted or offline
    }
  }

  public async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }
}

export const firebasePersistence = new FirebasePersistenceService();
