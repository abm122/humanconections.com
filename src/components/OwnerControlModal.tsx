/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, BingoTheme } from '../types/bingo';
import { ownerControl, OwnerProfile, SystemAnnouncement, BannedParticipant } from '../services/ownerControl';
import { monetization, OwnerMonetizationSettings, PayoutRecord } from '../services/monetization';
import { moderation } from '../services/moderation';
import { problemReports, ProblemReport } from '../services/problemReports';
import { sounds } from '../audio/soundEngine';
import { sessionTimer } from '../services/sessionTimer';
import { authService } from '../services/authService';
import { remoteBingo, HostActivityNotification, RemoteParticipant } from '../services/remoteBingo';
import { VippsTestIntegrationModal } from './VippsTestIntegrationModal';

interface OwnerControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onDrawBall?: () => void;
  onAgitateMix?: () => void;
  onResetRound?: () => void;
  onSwitchScreenDevice?: (device: 'mobile' | 'desktop' | 'big_screen') => void;
  onBanPlayer?: (playerName: string, reason?: string) => void;
  onUpdatePlayers?: (newPlayerNames: string[]) => void;
  uncalledBallsCount?: number;
  calledBallsCount?: number;
}

type TabType = 'dashboard' | 'edit_app' | 'change_pin' | 'session_limit' | 'broadcast' | 'participants' | 'moderation' | 'monetization' | 'payout' | 'reports';

export const OwnerControlModal: React.FC<OwnerControlModalProps> = ({
  isOpen,
  onClose,
  players,
  onDrawBall,
  onAgitateMix,
  onResetRound,
  onSwitchScreenDevice,
  onBanPlayer,
  uncalledBallsCount = 75,
  calledBallsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [profile, setProfile] = useState<OwnerProfile>(ownerControl.getProfile());
  const [monetizationSettings, setMonetizationSettings] = useState<OwnerMonetizationSettings>(
    monetization.getSettings()
  );
  const [analytics, setAnalytics] = useState(ownerControl.getAnalytics());
  const [bannedList, setBannedList] = useState<BannedParticipant[]>(ownerControl.getBannedParticipants());
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(ownerControl.getAnnouncements());
  const [bannedWords, setBannedWords] = useState<string[]>(moderation.getBannedWords());
  const [reportsList, setReportsList] = useState<ProblemReport[]>(problemReports.getReports());
  const [reportFilter, setReportFilter] = useState<'all' | 'new' | 'resolved'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Input states
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastType, setBroadcastType] = useState<SystemAnnouncement['type']>('info');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // New banned word input
  const [newBannedWord, setNewBannedWord] = useState('');

  // Ban reason input for participant modal
  const [banReason, setBanReason] = useState('Forstyrrende oppførsel i fellesspillet');
  const [selectedPlayerToBan, setSelectedPlayerToBan] = useState<string | null>(null);

  // Editable fields for owner app settings
  const [editAppTitle, setEditAppTitle] = useState(profile.appTitle || 'JoyBingo');
  const [editAppSubtitle, setEditAppSubtitle] = useState(profile.appSubtitle || '');
  const [editLine1Task, setEditLine1Task] = useState(profile.customWinnerTaskLine1 || '');
  const [editLine2Task, setEditLine2Task] = useState(profile.customWinnerTaskLine2 || '');
  const [editBingoTask, setEditBingoTask] = useState(profile.customWinnerTaskBingo || '');
  const [editVippsNumber, setEditVippsNumber] = useState(monetizationSettings.vippsNumber || profile.phoneOrVipps || '');
  const [editBankAccount, setEditBankAccount] = useState(monetizationSettings.bankAccount || profile.bankAccount || '');
  const [categoryOrder, setCategoryOrder] = useState<BingoTheme[]>(() => ownerControl.getCategoryOrder());
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const hasUnsavedEditsRef = React.useRef(false);
  const wasOpenRef = React.useRef(false);

  const updateHasUnsavedEdits = (val: boolean) => {
    hasUnsavedEditsRef.current = val;
    setHasUnsavedEdits(val);
  };

  // Editable pricing tier states
  const [editPrice20MinTrial, setEditPrice20MinTrial] = useState<number>(monetizationSettings.price20MinTrial ?? 19);
  const [editPrice1Hour, setEditPrice1Hour] = useState<number>(monetizationSettings.price1Hour ?? 49);
  const [editPrice2Hours, setEditPrice2Hours] = useState<number>(monetizationSettings.price2Hours ?? 89);
  const [editPrice3Hours, setEditPrice3Hours] = useState<number>(monetizationSettings.price3Hours ?? 129);
  const [editPrice4Hours, setEditPrice4Hours] = useState<number>(monetizationSettings.price4Hours ?? 169);
  const [editPriceFullDay, setEditPriceFullDay] = useState<number>(monetizationSettings.priceFullDay ?? 199);
  const [editFeePerPlayer, setEditFeePerPlayer] = useState<number>(monetizationSettings.fixedFeePerPlayer ?? 10);
  const [editExtensionPrice, setEditExtensionPrice] = useState<number>(monetizationSettings.eventExtensionPrice ?? 79);
  const [editProBigScreenPrice, setEditProBigScreenPrice] = useState<number>(monetizationSettings.proBigScreenPrice ?? 199);
  const [savingEdits, setSavingEdits] = useState<boolean>(false);

  // Firebase Cloud Sync states
  const [cloudStatus, setCloudStatus] = useState(() => ownerControl.getCloudStatus());
  const [cloudActionLoading, setCloudActionLoading] = useState(false);
  const [cloudActionError, setCloudActionError] = useState<string | null>(null);

  // PIN change states
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Toast notice
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 2-hour session limit state
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(() => sessionTimer.isExpired());

  // Owner Payout states
  const [payoutsList, setPayoutsList] = useState<PayoutRecord[]>(() => monetization.getPayouts());
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutDestType, setPayoutDestType] = useState<'bank' | 'vipps'>('bank');
  const [payoutBank, setPayoutBank] = useState<string>(monetizationSettings.bankAccount || profile.bankAccount || '');
  const [payoutVipps, setPayoutVipps] = useState<string>(monetizationSettings.vippsNumber || profile.phoneOrVipps || '920 00 000');
  const [payoutRecipient, setPayoutRecipient] = useState<string>(profile.name || 'JoyBingo Eier');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PayoutRecord | null>(null);
  const [isVippsTestOpen, setIsVippsTestOpen] = useState<boolean>(false);
  const [showAdminInfo, setShowAdminInfo] = useState<boolean>(false);
  const [maskPrivateLoginInfo, setMaskPrivateLoginInfo] = useState<boolean>(false);
  const [hasServerToken, setHasServerToken] = useState<boolean>(() => ownerControl.hasServerAdminToken());

  // Stripe Gateway Configuration States
  const [stripeSecretKeyInput, setStripeSecretKeyInput] = useState<string>(monetizationSettings.stripeSecretKey || '');
  const [stripePublishableKeyInput, setStripePublishableKeyInput] = useState<string>(monetizationSettings.stripePublishableKey || '');
  const [stripeGatewayStatus, setStripeGatewayStatus] = useState<{ configured: boolean; isLive: boolean; isTest: boolean; mode: string; source?: string } | null>(null);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeSaveMsg, setStripeSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>(() =>
    remoteBingo.getConnectedRemotePlayers()
  );
  const [hostNotifications, setHostNotifications] = useState<HostActivityNotification[]>(() =>
    remoteBingo.getHostNotifications()
  );

  const loadStripeStatus = () => {
    fetch('/api/stripe/status')
      .then((res) => res.json())
      .then((data) => setStripeGatewayStatus(data))
      .catch(() => setStripeGatewayStatus(null));
  };

  const handleSaveStripeKeys = async () => {
    setStripeSaving(true);
    setStripeSaveMsg(null);
    sounds.playClick();

    try {
      const res = await fetch('/api/stripe/update-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: stripeSecretKeyInput.trim(),
          publishableKey: stripePublishableKeyInput.trim(),
          ownerToken: ownerControl.getOwnerToken(),
        }),
      });
      const data = await res.json();
      monetization.updateSettings({
        stripeSecretKey: stripeSecretKeyInput.trim(),
        stripePublishableKey: stripePublishableKeyInput.trim(),
      });
      setStripeGatewayStatus(data);
      sounds.playLineComplete();
      setStripeSaveMsg({
        type: 'success',
        text: data.message || 'Stripe API-nøkler er oppdatert og aktive på serveren!',
      });
      showToast('Stripe-nøkler lagret!');
    } catch (err: any) {
      setStripeSaveMsg({
        type: 'error',
        text: err?.message || 'Feil ved lagring av Stripe-nøkler til server.',
      });
    } finally {
      setStripeSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStripeStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubOwner = ownerControl.subscribe(() => {
      const p = ownerControl.getProfile();
      setProfile(p);
      setAnalytics(ownerControl.getAnalytics());
      setBannedList(ownerControl.getBannedParticipants());
      setAnnouncements(ownerControl.getAnnouncements());
      setCloudStatus(ownerControl.getCloudStatus());
      setHasServerToken(ownerControl.hasServerAdminToken());
    });

    const unsubMonetization = monetization.subscribe(() => {
      setMonetizationSettings(monetization.getSettings());
      setPayoutsList(monetization.getPayouts());
    });

    const unsubReports = problemReports.subscribe(() => {
      setReportsList(problemReports.getReports());
    });

    const unsubSession = sessionTimer.subscribe(() => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      setIsSessionExpired(sessionTimer.isExpired());
    });

    const unsubRemote = remoteBingo.subscribe(() => {
      setRemoteParticipants([...remoteBingo.getConnectedRemotePlayers()]);
      setHostNotifications(remoteBingo.getHostNotifications());
    });

    const unsubRemoteJoin = remoteBingo.onParticipantJoined((p, total) => {
      if (remoteBingo.getIsRemotePlayer() || !remoteBingo.canActAsHost()) return;
      sounds.playPop(1.2);
      setToastMsg(`👋 ${p.name} ble med i rommet (${p.game || 'Avstandsbingo'})! (${total} tilkoblet)`);
      setTimeout(() => setToastMsg(null), 4500);
    });

    return () => {
      unsubOwner();
      unsubMonetization();
      unsubReports();
      unsubSession();
      unsubRemote();
      unsubRemoteJoin();
    };
  }, []);

  const syncFormFieldsFromStores = (p: OwnerProfile, m: OwnerMonetizationSettings) => {
    setEditAppTitle(p.appTitle || 'JoyBingo');
    setEditAppSubtitle(p.appSubtitle || '');
    setEditLine1Task(p.customWinnerTaskLine1 || '');
    setEditLine2Task(p.customWinnerTaskLine2 || '');
    setEditBingoTask(p.customWinnerTaskBingo || '');
    setEditVippsNumber(m.vippsNumber || p.phoneOrVipps || '');
    setEditBankAccount(m.bankAccount || p.bankAccount || '');
    setCategoryOrder(p.categoryOrder && p.categoryOrder.length > 0 ? [...p.categoryOrder] : ownerControl.getCategoryOrder());
    setEditPrice20MinTrial(m.price20MinTrial ?? 19);
    setEditPrice1Hour(m.price1Hour ?? 49);
    setEditPrice2Hours(m.price2Hours ?? 89);
    setEditPrice3Hours(m.price3Hours ?? 129);
    setEditPrice4Hours(m.price4Hours ?? 169);
    setEditPriceFullDay(m.priceFullDay ?? 199);
    setEditFeePerPlayer(m.fixedFeePerPlayer ?? 10);
    setEditExtensionPrice(m.eventExtensionPrice ?? 79);
    setEditProBigScreenPrice(m.proBigScreenPrice ?? 199);
  };

  // Sync edits ONLY when modal opens (or updates arrive externally while there are NO unsaved edits)
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!isOpen) {
      updateHasUnsavedEdits(false);
      return;
    }
    if (justOpened || !hasUnsavedEditsRef.current) {
      syncFormFieldsFromStores(profile, monetizationSettings);
    }
    if (justOpened) {
      void ownerControl.syncFromServer();
    }
  }, [profile, monetizationSettings, isOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isOpen) return null;

  const parseNonNegativePrice = (val: unknown, fallback: number): number => {
    if (val === '' || val === null || val === undefined) return fallback;
    const num = Number(val);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  };

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await authService.loginWithPinAsync(pinInput);
    if (user) {
      sounds.playLineComplete();
      sessionTimer.grantOwnerAccess();
      setPinError(false);
      setPinInput('');
      const freshProfile = ownerControl.getProfile();
      const freshMonetization = monetization.getSettings();
      setProfile(freshProfile);
      setMonetizationSettings(freshMonetization);
      syncFormFieldsFromStores(freshProfile, freshMonetization);
      updateHasUnsavedEdits(false);
      showToast('Eierkontroll låst opp! Du er logget inn som eier.');
    } else {
      sounds.playClick();
      setPinError(true);
    }
  };

  const handleSaveAppEdits = async () => {
    if (savingEdits) return;
    setSavingEdits(true);
    sounds.playLineComplete();
    try {
      const profileUpdate: Partial<OwnerProfile> = {
        appTitle: editAppTitle.trim() || 'JoyBingo',
        appSubtitle: editAppSubtitle.trim(),
        customWinnerTaskLine1: editLine1Task.trim(),
        customWinnerTaskLine2: editLine2Task.trim(),
        customWinnerTaskBingo: editBingoTask.trim(),
        phoneOrVipps: editVippsNumber.trim(),
        bankAccount: editBankAccount.trim(),
        categoryOrder: categoryOrder,
      };
      const pricingUpdate: Partial<OwnerMonetizationSettings> = {
        vippsNumber: editVippsNumber.trim(),
        bankAccount: editBankAccount.trim(),
        price20MinTrial: parseNonNegativePrice(editPrice20MinTrial, 19),
        price1Hour: parseNonNegativePrice(editPrice1Hour, 49),
        price2Hours: parseNonNegativePrice(editPrice2Hours, 89),
        price3Hours: parseNonNegativePrice(editPrice3Hours, 129),
        price4Hours: parseNonNegativePrice(editPrice4Hours, 169),
        priceFullDay: parseNonNegativePrice(editPriceFullDay, 199),
        fixedFeePerPlayer: parseNonNegativePrice(editFeePerPlayer, 10),
        eventExtensionPrice: parseNonNegativePrice(editExtensionPrice, 79),
        proBigScreenPrice: parseNonNegativePrice(editProBigScreenPrice, 199),
      };

      const res = await ownerControl.saveAllToServer(profileUpdate, pricingUpdate);
      updateHasUnsavedEdits(false);
      if (res.success) {
        if (res.savedToCloud) {
          showToast('☁️ Alle endringer og priser er lagret fast i Firebase Firestore og på serveren!');
        } else {
          showToast('💾 Lagret på serveren. Koble til Google øverst for varig skylagring i Firebase Firestore.');
        }
      } else {
        showToast(`⚠️ Lagret lokalt, men feil ved lagring: ${res.error}`);
      }
    } finally {
      setSavingEdits(false);
    }
  };

  const handleGoogleCloudConnect = async (unlockAfterSignIn = false) => {
    if (cloudActionLoading) return;
    setCloudActionLoading(true);
    setCloudActionError(null);
    sounds.playClick();
    try {
      const res = await ownerControl.signInWithGoogleAdmin(unlockAfterSignIn);
      if (res.success) {
        sounds.playLineComplete();
        if (unlockAfterSignIn) {
          sessionTimer.grantOwnerAccess();
          const freshProfile = ownerControl.getProfile();
          const freshMonetization = monetization.getSettings();
          setProfile(freshProfile);
          setMonetizationSettings(freshMonetization);
          syncFormFieldsFromStores(freshProfile, freshMonetization);
          updateHasUnsavedEdits(false);
          showToast('☁️ Innlogget med Google! Eierpanel låst opp og synkronisert med Firebase Firestore.');
        } else {
          showToast('☁️ Tilkoblet Firebase Firestore! Alle endringer lagres nå fast i skyen.');
        }
      } else {
        setCloudActionError(res.error || 'Kunne ikke logge inn med Google.');
      }
    } finally {
      setCloudActionLoading(false);
    }
  };

  const handleGoogleCloudDisconnect = async () => {
    sounds.playClick();
    setCloudActionLoading(true);
    setCloudActionError(null);
    try {
      await ownerControl.signOutGoogleAdmin();
      showToast('🔒 Logget ut av Google-skylagring på denne enheten.');
    } finally {
      setCloudActionLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput || newPinInput.length < 4) {
      sounds.playClick();
      setPinChangeMsg({ type: 'error', text: 'Ny PIN må bestå av minst 4 siffer.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      sounds.playClick();
      setPinChangeMsg({ type: 'error', text: 'Ny PIN og bekreftelsen er ikke like.' });
      return;
    }
    const res = await ownerControl.changePinAsync(currentPinInput, newPinInput);
    if (res.success) {
      sounds.playLineComplete();
      setPinChangeMsg({
        type: res.savedToCloud ? 'success' : 'warning',
        text: res.message,
      });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      showToast(
        res.savedToCloud
          ? '☁️ Ny eier-PIN er lagret permanent i Firebase Firestore og på serveren!'
          : '⚠️ PIN endret nå, men koble til Google for å lagre den permanent i skyen!'
      );
    } else {
      sounds.playClick();
      setPinChangeMsg({ type: 'error', text: res.message });
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    sounds.playLineComplete();
    ownerControl.broadcastMessage(broadcastText, broadcastType);
    setBroadcastText('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 2500);
    showToast('Kunngjøring sendt til alle skjermer!');
  };

  const handleAddBannedWord = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newBannedWord.trim();
    if (!word) return;
    if (moderation.addBannedWord(word)) {
      sounds.playClick();
      setBannedWords(moderation.getBannedWords());
      setNewBannedWord('');
      showToast(`«${word}» er lagt til som forbudt ord.`);
    } else {
      showToast('Ordet finnes allerede i listen.');
    }
  };

  const handleRemoveBannedWord = (word: string) => {
    sounds.playClick();
    moderation.removeBannedWord(word);
    setBannedWords(moderation.getBannedWords());
    showToast(`«${word}» er fjernet.`);
  };

  const handleBanConfirm = (playerName: string) => {
    sounds.playClick();
    ownerControl.banParticipant(playerName, banReason);
    if (onBanPlayer) {
      onBanPlayer(playerName, banReason);
    }
    setSelectedPlayerToBan(null);
    showToast(`Deltaker «${playerName}» er utestengt.`);
  };

  const handleUnban = (id: string, name: string) => {
    sounds.playClick();
    ownerControl.unbanParticipant(id);
    showToast(`Utestengelse av «${name}» er opphevet.`);
  };

  const handleCopyReport = () => {
    sounds.playClick();
    const report = ownerControl.generateExportReport();
    navigator.clipboard.writeText(report);
    showToast('Rapport kopiert til utklippstavlen!');
  };

  const handleSendReply = (reportId: string) => {
    const text = (replyDrafts[reportId] || '').trim();
    if (!text) {
      showToast('Vennligst skriv inn et svar først.');
      return;
    }
    sounds.playLineComplete();
    problemReports.addOwnerReply(reportId, text, 'Eier');
    setReportsList(problemReports.getReports());
    setReplyDrafts((prev) => ({ ...prev, [reportId]: '' }));
    showToast('📤 Svar sendt til brukeren i appen!');
  };

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setPayoutError(null);
    setPayoutSuccess(null);

    const numAmount = Number(payoutAmount);
    if (!numAmount || numAmount <= 0) {
      setPayoutError('Vennligst oppgi et gyldig beløp å ta ut.');
      return;
    }

    const available = monetization.getAvailableForPayout();
    if (numAmount > available) {
      setPayoutError(`Du kan maksimalt ta ut ${available} kr (disponibel saldo).`);
      return;
    }

    const res = monetization.requestPayout(numAmount, payoutDestType, {
      bankAccount: payoutDestType === 'bank' ? payoutBank : undefined,
      vippsNumber: payoutDestType === 'vipps' ? payoutVipps : undefined,
      recipientName: payoutRecipient,
      note: payoutNote,
    });

    if (!res.success) {
      setPayoutError(res.error || 'Kunne ikke gjennomføre utbetaling.');
      return;
    }

    sounds.playLineComplete();
    setPayoutSuccess(`✅ Utbetaling på ${numAmount} kr er overført! Referanse: ${res.payout?.reference}`);
    setPayoutAmount('');
    setPayoutsList(monetization.getPayouts());
    if (res.payout) {
      setActiveReceipt(res.payout);
    }
  };

  const totalEarnings = monetization.getTotalEarnings();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#140c06] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-amber-50">
        {/* Header with Owner Branding & Status */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-[#26150b] to-emerald-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-base sm:text-xl text-amber-200">
                  Eier- & Administratorpanel
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Privat Panel
                </span>
              </div>
              <div className="text-xs text-amber-300/80">
                Konfidensiell administrasjon · Kun tilgjengelig med eier-PIN
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.isUnlocked && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsVippsTestOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                title="Test betalingsflyt og saldotilførsel"
              >
                <span className="text-xs">💳</span>
                <span className="hidden sm:inline">Test Betalingsflyt</span>
                <span className="sm:hidden">Test</span>
              </button>
            )}

            {profile.isUnlocked ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMaskPrivateLoginInfo((prev) => !prev);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    maskPrivateLoginInfo
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                      : 'bg-black/50 hover:bg-black/70 text-amber-200 border-amber-500/35'
                  }`}
                  title="Skjul din private innloggingskode, e-post og profilinformasjon hvis andre ser på skjermen"
                >
                  <span>{maskPrivateLoginInfo ? '👁️ Vis privat' : '🙈 Skjul innlogging'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowAdminInfo((prev) => !prev);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    showAdminInfo
                      ? 'bg-emerald-500/30 text-emerald-100 border-emerald-300 ring-2 ring-emerald-400/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
                  }`}
                  title="Klikk for å se hva Admin-rettigheter og Test Betalingsflyt gjør"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Admin-rettigheter: Aktiv</span>
                  <span className="sm:hidden">Admin OK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    authService.logout();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer transition-all"
                  title="Lås eierpanelet og logg ut (anbefales på offentlig PC)"
                >
                  🔒 Lås & Logg ut
                </button>
              </>
            ) : (
              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-xl bg-amber-950/60 text-amber-300 text-xs font-bold border border-amber-500/30">
                Låst med PIN
              </span>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
              title="Lukk eierpanel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast message if active */}
        {toastMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-400/40 py-2 px-4 text-center text-xs font-bold text-emerald-200 animate-fadeIn">
            ✨ {toastMsg}
          </div>
        )}

        {!profile.isUnlocked ? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-xl ring-2 ring-white/20">
              🔒
            </div>
            <div className="max-w-md">
              <h3 className="font-heading font-black text-xl text-amber-200">
                Privat Eiertilgang & Redigering
              </h3>
              <p className="text-xs text-amber-300/80 mt-1.5 leading-relaxed">
                Dette området er eierens private eiendom. Skriv inn din personlige eier-PIN for å åpne kontrollpanelet, endre PIN og redigere appen.
              </p>
            </div>

            <form onSubmit={handleUnlockPin} className="w-full max-w-xs space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  placeholder="Tast inn eier-PIN..."
                  className="w-full px-4 py-3 rounded-2xl bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 text-center font-mono text-xl tracking-widest text-amber-100 outline-none shadow-inner"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-400 font-bold mt-1.5 animate-pulse">
                    ⚠️ Feil PIN-kode. Vennligst prøv igjen.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all"
              >
                Lås opp eierkontroll ➔
              </button>

              <div className="text-2xs text-amber-300/50 pt-1">
                Standard PIN ved første gangs oppstart: 2026. Du kan endre PIN-koden inne i panelet.
              </div>
            </form>

            <div className="w-full max-w-xs pt-2 border-t border-amber-500/20 space-y-2">
              <div className="text-[11px] text-amber-200/75 font-semibold">
                Har du endret PIN på en annen PC, eller vil du koble til skyen?
              </div>
              <button
                type="button"
                disabled={cloudActionLoading}
                onClick={() => void handleGoogleCloudConnect(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/50 text-emerald-200 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>☁️</span>
                <span>
                  {cloudActionLoading
                    ? 'Kobler til Google...'
                    : cloudStatus.isSignedIn
                    ? `Lås opp & synkroniser (${cloudStatus.email})`
                    : 'Logg inn med Google (Eier) & hent sky-PIN'}
                </span>
              </button>
              {cloudActionError && (
                <div className="text-[11px] text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl p-2 font-semibold">
                  ⚠️ {cloudActionError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Firebase Firestore Cloud Sync Banner */}
            <div
              className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                cloudStatus.isSignedIn
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-100'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{cloudStatus.isSignedIn ? '☁️' : '⚠️'}</span>
                <div className="min-w-0">
                  {cloudStatus.isSignedIn ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-emerald-300">Firebase Firestore skylagring aktiv</span>
                      <span className="text-[11px] text-emerald-200/80 font-mono truncate">
                        ({maskPrivateLoginInfo ? '••••@••••••.••' : cloudStatus.email})
                      </span>
                      {cloudStatus.isSyncing && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 animate-pulse">
                          Synkroniserer...
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-amber-200">Ikke koblet til Google-skylagring ennå</span>
                      <span className="text-[11px] text-amber-200/75 ml-1.5">
                        Koble til med eierens Google-konto for å synkronisere rom, PIN og priser på tvers av økter og lenker.
                      </span>
                    </div>
                  )}
                  {(cloudActionError || cloudStatus.lastError) && (
                    <div className="text-[11px] text-rose-300 font-semibold mt-0.5">
                      ⚠️ {cloudActionError || cloudStatus.lastError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {cloudStatus.isSignedIn ? (
                  <button
                    type="button"
                    disabled={cloudActionLoading}
                    onClick={() => void handleGoogleCloudDisconnect()}
                    className="px-3 py-1 rounded-lg bg-black/50 hover:bg-rose-950/70 border border-rose-400/40 text-rose-200 text-[11px] font-bold cursor-pointer transition-all"
                    title="Anbefales når du bruker en offentlig PC"
                  >
                    🚪 Logg ut av Google
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={cloudActionLoading}
                    onClick={() => void handleGoogleCloudConnect(false)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 text-[11px] font-black cursor-pointer shadow transition-all disabled:opacity-60"
                  >
                    {cloudActionLoading
                      ? 'Kobler til...'
                      : maskPrivateLoginInfo
                      ? '☁️ Koble til Google (Privat)'
                      : '☁️ Koble til Google (adhanom3@gmail.com)'}
                  </button>
                )}
              </div>
            </div>

            {maskPrivateLoginInfo && (
              <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-400/40 text-xs font-bold text-amber-200 flex items-center justify-between gap-2">
                <span>🙈 Privat innloggingsinfo og eier-epost er skjult på denne skjermen. Trykk «Vis privat» oppe til høyre for å se dem igjen.</span>
                <button
                  type="button"
                  onClick={() => setMaskPrivateLoginInfo(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer shrink-0"
                >
                  👁️ Vis privat
                </button>
              </div>
            )}

            {showAdminInfo && (
              <div className="px-4 py-3 bg-[#1c1008] border-b border-emerald-500/30 text-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-heading font-black text-emerald-300 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Funksjonsforklaring: Admin-rettigheter & Test Betalingsflyt</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminInfo(false)}
                    className="text-amber-300/70 hover:text-white text-xs font-bold cursor-pointer px-2 py-0.5 rounded bg-black/40"
                  >
                    Lukk ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30 space-y-1.5">
                    <div className="font-bold text-emerald-300 flex items-center justify-between">
                      <span>✓ Admin-rettigheter: Aktiv</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                        {hasServerToken || cloudStatus.isSignedIn ? 'Server + Lokal OK' : 'Lokal økt OK'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-100/80 leading-relaxed">
                      Gir deg full eierkontroll: ubegrenset spilletid (∞), endring av eier-PIN, appnavn, pakkepriser, Vipps/bankkonto, Stripe-nøkler, utestengelse/moderering og utbetaling (Admin Payout).
                    </p>
                    {!hasServerToken && !cloudStatus.isSignedIn && (
                      <button
                        type="button"
                        onClick={() => void handleGoogleCloudConnect(true)}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold cursor-pointer"
                      >
                        ☁️ Verifiser mot server / Google nå
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-amber-500/30 space-y-1.5">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>💳 Test Betalingsflyt</span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsVippsTestOpen(true);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer"
                      >
                        Åpne test ➔
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-100/80 leading-relaxed">
                      En trygg API-simulator som tester hele betalingsreisen (pakkevalg → betalingsforespørsel → popup-godkjenning → kvittering) uten å trekke ekte penger. Kan oppdatere saldoen for å teste Admin Payout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-2 bg-black/50 border-b border-amber-500/20 overflow-x-auto text-xs">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('dashboard');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>📊</span>
            <span>Oversikt</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('edit_app');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'edit_app'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>🎨</span>
            <span>Rediger App & Moduler</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('change_pin');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'change_pin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>🔐</span>
            <span>Endre PIN-kode</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('session_limit');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'session_limit'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>⏱️</span>
            <span>Spilletid ({sessionRemaining})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('monetization');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'monetization'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>💰</span>
            <span>Inntekt & Priser</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('payout');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payout'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-emerald-100 hover:bg-white/5'
            }`}
          >
            <span>💸</span>
            <span>Admin Payout</span>
            {monetization.getAvailableForPayout() > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-2xs">
                {monetization.getAvailableForPayout()} kr
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('participants');
              remoteBingo.markHostNotificationsRead();
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'participants'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>👥</span>
            <span>Deltakere & Antall ({players.length + remoteParticipants.length})</span>
            {bannedList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('broadcast');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>📢</span>
            <span>Kringkasting</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('moderation');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>🛡️</span>
            <span>Trivselsfilter</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('reports');
            }}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>💬</span>
            <span>Rapporter ({reportsList.length})</span>
            {reportsList.filter((r) => r.status === 'new').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-2xs animate-pulse">
                {reportsList.filter((r) => r.status === 'new').length} nye
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERSIKT & NØKKELTALL (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Primary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-black/50 border border-emerald-500/40">
                  <div className="text-2xs uppercase tracking-wider text-emerald-300 font-bold mb-1 flex items-center justify-between">
                    <span>Opptjent Inntekt</span>
                    <span>💰</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-emerald-300">
                    {totalEarnings.totalCommission} kr
                  </div>
                  <div className="text-[11px] text-emerald-200/70 mt-1">
                    Brutto: {totalEarnings.totalGross} kr ({totalEarnings.transactionsCount} tx)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-black/50 border border-amber-500/40">
                  <div className="text-2xs uppercase tracking-wider text-amber-300 font-bold mb-1 flex items-center justify-between">
                    <span>Spillere Totalt</span>
                    <span>👥</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-amber-200">
                    {analytics.totalPlayersEngaged}
                  </div>
                  <div className="text-[11px] text-amber-200/70 mt-1">
                    I aktiv sesjon: {players.length} spillere
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-black/50 border border-purple-500/40">
                  <div className="text-2xs uppercase tracking-wider text-purple-300 font-bold mb-1 flex items-center justify-between">
                    <span>Bingospill Arrangerte</span>
                    <span>🎯</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-purple-200">
                    {analytics.totalGamesHosted}
                  </div>
                  <div className="text-[11px] text-purple-200/70 mt-1">
                    Feiret: {analytics.totalBingosCelebrated} bingoer
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-black/50 border border-rose-500/40">
                  <div className="text-2xs uppercase tracking-wider text-rose-300 font-bold mb-1 flex items-center justify-between">
                    <span>Trygghet & Trivsel</span>
                    <span>🛡️</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-rose-300">
                    100% Trygt
                  </div>
                  <div className="text-[11px] text-rose-200/70 mt-1">
                    {bannedList.length} utestengte forstyrrere
                  </div>
                </div>
              </div>

              {/* Ready to Use Status Checklist */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/40 to-amber-950/40 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-black text-sm text-emerald-300 flex items-center gap-2">
                    <span>✅</span>
                    <span>Status: Appen er 100% klar til bruk i arrangementer</span>
                  </h3>
                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-200 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <span>📋</span>
                    <span>Kopier eierrapport</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">✔</span>
                    <div>
                      <span className="font-bold text-amber-100">75-Ball Bingotrommel & Lyd:</span>
                      <span className="text-amber-200/70 ml-1">Klar med animasjon og tale</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">✔</span>
                    <div>
                      <span className="font-bold text-amber-100">Vipps & Inntjening:</span>
                      <span className="text-amber-200/70 ml-1">Aktiv til {monetizationSettings.vippsNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">✔</span>
                    <div>
                      <span className="font-bold text-amber-100">RIL Storskjerm & TV:</span>
                      <span className="text-amber-200/70 ml-1">Optimalisert for prosjektor og mobil</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">✔</span>
                    <div>
                      <span className="font-bold text-amber-100">Trivselsfilter & Moderasjon:</span>
                      <span className="text-amber-200/70 ml-1">Forstyrrere kan utestenges</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Session Quick Glance */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-black text-sm text-amber-200">
                    Aktiv Bingosesjon (Nåværende bord)
                  </h3>
                  <span className="text-xs text-amber-300/80">
                    Trukket: {calledBallsCount} / 75 kuler · Gjenstår: {uncalledBallsCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-black/60 border border-amber-500/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                        >
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-amber-100 truncate">{p.name}</div>
                          <div className="text-[10px] text-amber-200/60">
                            {p.cards.length} {p.cards.length === 1 ? 'kort' : 'kort'} · {p.linesCompleted} linjer
                          </div>
                        </div>
                      </div>
                      {p.hasBingo && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          BINGO!
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: REDIGER APP, INNHOLD & MODULER */}
          {activeTab === 'edit_app' && (
            <div className="space-y-6">
              {/* Top Banner with Save Status */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-amber-500/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                    <span>👑</span>
                    <span>Eierens Redigeringsmodul</span>
                    {hasUnsavedEdits && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-2xs animate-pulse">
                        Ulagrede endringer
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-amber-300/80 mt-0.5">
                    Kun eier med gyldig PIN har tilgang til å endre tekster, vinneroppgaver, spilletid og betalingsoppsett.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAppEdits}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-heading font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all shrink-0 ring-2 ring-white/40"
                >
                  <span>💾</span>
                  <span>Lagre alle endringer</span>
                </button>
              </div>

              {/* Rediger App-tekster, Navn og Slagord */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                      <span>🎨</span>
                      <span>Rediger App-tekster, Navn og Slagord</span>
                    </h3>
                    <p className="text-2xs text-amber-200/70">
                      Endre appens navn og undertittel direkte. Dette oppdateres for alle spillere og verter når du klikker Lagre.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">App-tittel:</label>
                    <input
                      type="text"
                      value={editAppTitle}
                      onChange={(e) => {
                        setEditAppTitle(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. JoyBingo"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">Undertittel & Slagord:</label>
                    <input
                      type="text"
                      value={editAppSubtitle}
                      onChange={(e) => {
                        setEditAppSubtitle(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. Sosial Trivsel & Fellesskap for Foreninger, Lag og Venner"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Vinneroppgaver Redigering */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div>
                  <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                    <span>💖</span>
                    <span>Rediger Hyggelige Vinneroppgaver (1., 3. rekke & Fullbrett)</span>
                  </h3>
                  <p className="text-2xs text-amber-200/70">
                    Når en spiller bekrefter trukne tall og roper BINGO for 1. rekke, 3. rekker eller fullbrett, spretter denne gledesoppgaven opp for hele lokalet!
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Oppgave for 1. rekke fullført:
                    </label>
                    <input
                      type="text"
                      value={editLine1Task}
                      onChange={(e) => {
                        setEditLine1Task(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. Gi en god og varm klem til den som fortjener det aller mest!"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Oppgave for 3. rekker fullført:
                    </label>
                    <input
                      type="text"
                      value={editLine2Task}
                      onChange={(e) => {
                        setEditLine2Task(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. Få med hele rommet på et felles gledesrop eller en stor felles applaus!"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Oppgave for full BINGO triumf:
                    </label>
                    <input
                      type="text"
                      value={editBingoTask}
                      onChange={(e) => {
                        setEditBingoTask(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. KRONING: Reis deg opp, rop et rungende BINGO og del ut en varm klem og seierssmil!"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Betalingsoppsett og Bankkonto for Utbetaling */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div>
                  <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                    <span>🏦</span>
                    <span>Eierens Bankkonto & Betalingsoppsett (Admin Payout)</span>
                  </h3>
                  <p className="text-2xs text-amber-200/70">
                    Kundene betaler sikkert med Visa, Mastercard, Apple Pay og Google Pay. Ditt private nummer skjermes 100%. Inntektene overfører du direkte til din oppgitte bankkonto.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Bankkonto for utbetaling (11 siffer):
                    </label>
                    <input
                      type="text"
                      value={editBankAccount}
                      onChange={(e) => {
                        setEditBankAccount(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. 1234.56.78901"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Valgfritt internt telefonnummer (skjult):
                    </label>
                    <input
                      type="text"
                      value={editVippsNumber}
                      onChange={(e) => {
                        setEditVippsNumber(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="Kun internt, skjules for kunder"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-emerald-300/80 block mt-1">
                      🔒 100% anonymt: Kunder ser kun kortbetaling og digital lommebok.
                    </span>
                  </div>
                </div>
              </div>

              {/* Rediger Priser for Spilletid & Pakker */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                      <span>🏷️</span>
                      <span>Rediger Priser for Spilletid & Betalingspakker</span>
                    </h3>
                    <p className="text-2xs text-amber-200/70">
                      Bestem nøyaktig hva spillere og verter skal betale for hver pakke (Visa, Mastercard, Apple Pay & Google Pay).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setEditPrice20MinTrial(19);
                      setEditPrice1Hour(49);
                      setEditPrice2Hours(89);
                      setEditPrice3Hours(129);
                      setEditPrice4Hours(169);
                      setEditPriceFullDay(199);
                      setEditFeePerPlayer(10);
                      setEditExtensionPrice(79);
                      setEditProBigScreenPrice(199);
                      updateHasUnsavedEdits(true);
                      showToast('Standardpriser gjenopprettet (husk å klikke Lagre)!');
                    }}
                    className="text-2xs text-amber-300/80 hover:text-amber-100 underline cursor-pointer self-start sm:self-auto"
                  >
                    Nullstill til standardpriser
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/40 ring-1 ring-emerald-400/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-emerald-300">
                        20 min prøvetid:
                      </label>
                      <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 rounded">Prøv</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPrice20MinTrial}
                        onChange={(e) => {
                          setEditPrice20MinTrial(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-emerald-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      1 time spilletid:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPrice1Hour}
                        onChange={(e) => {
                          setEditPrice1Hour(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 ring-1 ring-amber-400/40">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-amber-300">
                        2 timer (Standard):
                      </label>
                      <span className="text-[9px] bg-amber-400/30 text-amber-200 px-1 rounded">Populær</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPrice2Hours}
                        onChange={(e) => {
                          setEditPrice2Hours(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      3 timer:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPrice3Hours}
                        onChange={(e) => {
                          setEditPrice3Hours(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      4 timer (Helaften):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPrice4Hours}
                        onChange={(e) => {
                          setEditPrice4Hours(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      Hele dagen / Ubegrenset:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editPriceFullDay}
                        onChange={(e) => {
                          setEditPriceFullDay(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-500/15">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      Servicegebyr per spiller:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editFeePerPlayer}
                        onChange={(e) => {
                          setEditFeePerPlayer(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      Ekstratid per time (utover 2t):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editExtensionPrice}
                        onChange={(e) => {
                          setEditExtensionPrice(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20">
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">
                      Storskjerm / Bedriftslisens:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={editProBigScreenPrice}
                        onChange={(e) => {
                          setEditProBigScreenPrice(Number(e.target.value));
                          updateHasUnsavedEdits(true);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-xs font-mono font-bold text-amber-100 outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">kr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endre Eier-PIN for innlogging */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-black/50 to-amber-950/40 border border-amber-500/40 space-y-4">
                <div>
                  <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                    <span>🔐</span>
                    <span>Endre PIN-kode for Eier-innlogging</span>
                  </h3>
                  <p className="text-2xs text-amber-200/70">
                    Bytt ut standard PIN-koden (2026) med en egen personlig PIN-kode for å sikre eierområdet ditt.
                  </p>
                </div>

                <form onSubmit={handleChangePin} className="space-y-3 max-w-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Nåværende PIN:</label>
                      <input
                        type="password"
                        maxLength={10}
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="Nåværende..."
                        className="w-full px-3 py-2 rounded-xl bg-black/70 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Ny PIN (min 4 siffer):</label>
                      <input
                        type="password"
                        maxLength={10}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="Ny PIN..."
                        className="w-full px-3 py-2 rounded-xl bg-black/70 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-amber-300 block mb-1">Gjenta ny PIN:</label>
                      <input
                        type="password"
                        maxLength={10}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Bekreft PIN..."
                        className="w-full px-3 py-2 rounded-xl bg-black/70 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {pinChangeMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                          : 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                      }`}
                    >
                      {pinChangeMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all"
                  >
                    🔐 Oppdater og lagre ny PIN-kode
                  </button>
                </form>
              </div>

              {/* Moduler & Visning */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-3">
                <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Modulstyring & Synlighet i Startmenyen</span>
                </h3>
                <p className="text-2xs text-amber-200/70">
                  Slå av eller på snarveier og moduler som vises øverst i appen:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'showIosInstall', label: '🍎 iOS / iPhone App snarvei', desc: 'Installasjonsveiledning for iPhone og iPad (skjulbar)' },
                    { key: 'showSchedule', label: '📅 24-timers Dagsplan', desc: 'Rutiner og dagsrytme tabell (skjulbar)' },
                    { key: 'showBigScreen', label: '📺 Storskjerm / TV knapp', desc: 'Lar verter åpne storskjermvisning' },
                    { key: 'showMixer', label: '🎛️ Kulemikser stasjon', desc: 'Lar verter åpne virtuell mikser' },
                    { key: 'showQuests', label: '🎯 Daglige Gledesoppdrag', desc: 'Daglige utfordringer og poeng' },
                    { key: 'showPrint', label: '🖨️ Skriv ut bingokort', desc: 'Utskrift av fysiske bingobrett for spillere' },
                    { key: 'showReport', label: '💬 Rapporter / Tilbakemelding', desc: 'Rapporteringsknapp for deltakere til eier' },
                    { key: 'showBroadcast', label: '📢 Kringkasting & Beskjeder', desc: 'Mulighet til å kringkaste meldinger og heiarop' },
                    { key: 'showParticipants', label: '👥 Deltakerliste & Antall', desc: 'Oversikt over spillere og deltakere' },
                    { key: 'showDrumOnMobile', label: '🎛️ 3D Trommel blender på mobil', desc: 'Vis 3D-trommel over bingokortene på mobil og små skjermer' },
                    { key: 'familyKidsMode', label: '🧸 Familie- & Barnemodus', desc: 'Gjør appen familievennlig hvor barn kan spille med verten' },
                  ].map((mod) => {
                    const isVis = profile.visibleModules ? profile.visibleModules[mod.key as keyof typeof profile.visibleModules] : true;
                    return (
                      <div key={mod.key} className="p-3 rounded-xl bg-black/60 border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-amber-200">{mod.label}</div>
                          <div className="text-[10px] text-amber-300/60">{mod.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            const updated = {
                              ...profile.visibleModules,
                              [mod.key]: !isVis,
                            };
                            ownerControl.updateProfile({ visibleModules: updated });
                            updateHasUnsavedEdits(true);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            isVis
                              ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          }`}
                        >
                          {isVis ? 'Synlig ✓' : 'Skjult ✕'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kategori-organisering: Favoritt-rekkefølge */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                    <span>🗂️</span>
                    <span>Organiser Kategorier (Favoritt-rekkefølge)</span>
                  </h3>
                  <span className="text-2xs text-amber-300/80 font-bold">
                    Øverste kategori blir standard favoritt #1 i appen
                  </span>
                </div>
                <p className="text-2xs text-amber-200/70">
                  Flytt opp eller ned for å bestemme rekkefølgen kategoriene vises i startmenyen og rullegardinen:
                </p>

                <div className="space-y-2">
                  {categoryOrder.map((catKey, idx) => {
                    const themeNames: Record<BingoTheme, { label: string; icon: string }> = {
                      ril: { label: 'RIL – Idrett, Sang & Musikk', icon: '🏆' },
                      classic_joy: { label: 'Joy Bingo (Klassisk Gledelig)', icon: '🌟' },
                      family_kids: { label: 'Familie & Barn – Spill med vert', icon: '🧸' },
                      heartfelt: { label: 'Hjertevarme & Nærhet', icon: '🫂' },
                      laughter: { label: 'Latter, Humor & Smil', icon: '😄' },
                      kindness: { label: 'Godhet & Omsorg', icon: '🤝' },
                      gratitude: { label: 'Visdom & Takknemlighet', icon: '🌅' },
                    };
                    const item = themeNames[catKey] || { label: catKey, icon: '🌟' };
                    return (
                      <div
                        key={catKey}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          idx === 0
                            ? 'bg-amber-500/20 border-amber-400/60 ring-1 ring-amber-300/40 shadow-sm'
                            : 'bg-black/50 border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-black/60 border border-amber-400/40 flex items-center justify-center text-xs font-black text-amber-300">
                            #{idx + 1}
                          </span>
                          <span className="text-base">{item.icon}</span>
                          <span className="text-xs font-bold text-amber-100">
                            {item.label}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase shadow">
                              ⭐ Favoritt #1
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                const updated = [...categoryOrder];
                                const temp = updated[idx];
                                updated[idx] = updated[idx - 1];
                                updated[idx - 1] = temp;
                                setCategoryOrder(updated);
                                updateHasUnsavedEdits(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-200 text-2xs font-bold hover:bg-amber-900/80 cursor-pointer"
                              title="Flytt opp"
                            >
                              ▲ Opp
                            </button>
                          )}
                          {idx < categoryOrder.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                const updated = [...categoryOrder];
                                const temp = updated[idx];
                                updated[idx] = updated[idx + 1];
                                updated[idx + 1] = temp;
                                setCategoryOrder(updated);
                                updateHasUnsavedEdits(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-200 text-2xs font-bold hover:bg-amber-900/80 cursor-pointer"
                              title="Flytt ned"
                            >
                              ▼ Ned
                            </button>
                          )}
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                const filtered = categoryOrder.filter((t) => t !== catKey);
                                setCategoryOrder([catKey, ...filtered]);
                                updateHasUnsavedEdits(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 text-2xs font-black hover:bg-amber-400 hover:text-slate-950 cursor-pointer"
                              title="Sett som øverste favoritt"
                            >
                              ⭐ Gjør til #1
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stor, synlig Lagre-knapp nederst i fanen */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-black/80 to-amber-950/60 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div>
                  <div className="font-heading font-black text-sm sm:text-base text-emerald-300 flex items-center gap-2">
                    <span>✅</span>
                    <span>Lagre alle endringer i JoyBingo</span>
                  </div>
                  <div className="text-2xs text-emerald-100/80">
                    Lagrer app-navn, slagord, hyggelige vinneroppgaver, Vipps-nummer og modulinnstillinger umiddelbart.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAppEdits}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 hover:from-emerald-300 hover:to-amber-200 text-slate-950 font-heading font-black text-sm cursor-pointer shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 ring-2 ring-white/50"
                >
                  <span>💾</span>
                  <span>Lagre alle endringer nå</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: ENDRE PIN-KODE */}
          {activeTab === 'change_pin' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 via-black/70 to-amber-950/40 border-2 border-amber-500/40 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/20">
                    🔐
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-amber-200">
                      Endre Eierens PIN-kode
                    </h3>
                    <p className="text-xs text-amber-300/80">
                      Sikre ditt private eierpanel. Kun du med denne PIN-koden får tilgang til administratorpanelet og redigering.
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                    cloudStatus.isSignedIn
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                      : 'bg-amber-950/50 border-amber-400/50 text-amber-100'
                  }`}
                >
                  {cloudStatus.isSignedIn ? (
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0">☁️</span>
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-300">
                          Permanent skylagring aktiv ({cloudStatus.email})
                        </div>
                        <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                          Når du endrer PIN-koden her, lagres den fast i Firebase Firestore. Den tilbakestilles ikke ved app-oppdateringer — ved ny publisering henter du den enkelt med «Logg inn med Google» eller automatisk på denne enheten.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">⚠️</span>
                        <div className="space-y-1">
                          <div className="font-bold text-amber-200">
                            Hvorfor tilbakestilles PIN ved oppdatering uten skylagring?
                          </div>
                          <p className="text-[11px] text-amber-200/85 leading-relaxed">
                            Uten Google-skylagring (eller hemmelig miljøvariabel <code className="px-1 py-0.5 rounded bg-black/50 text-amber-300">OWNER_PIN</code>) lagres PIN kun på serverens midlertidige disk, som slettes hver gang appen oppdateres. Koble til Google nå for å lagre PIN-en fast i Firebase Firestore.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={cloudActionLoading}
                        onClick={() => void handleGoogleCloudConnect(false)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow transition-all disabled:opacity-60"
                      >
                        {cloudActionLoading
                          ? 'Kobler til Google...'
                          : '☁️ Koble til Google (adhanom3@gmail.com) & lagre PIN i skyen'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 text-xs text-amber-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span>💡</span>
                    <span>Slik fungerer PIN-koden:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-2xs text-amber-300/80 leading-relaxed">
                    <li>PIN-koden må være minst 4 siffer (f.eks. 1234, 5678, 2026).</li>
                    <li>Med Google-skylagring aktiv lagres ny PIN i Firebase Firestore på tvers av alle oppdateringer.</li>
                    <li>Tips: Du kan også sette <code className="px-1 rounded bg-black/50">OWNER_PIN</code> i AI Studio Secrets hvis du vil at serveren alltid skal starte med din faste PIN uten Google-innlogging.</li>
                  </ul>
                </div>

                <form onSubmit={handleChangePin} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1.5">
                      1. Skriv inn nåværende PIN-kode:
                    </label>
                    <input
                      type="password"
                      maxLength={10}
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Nåværende PIN (f.eks. 2026)"
                      className="w-full px-4 py-3 rounded-2xl bg-black/70 border border-amber-500/40 text-center font-mono font-bold text-lg text-amber-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1.5">
                      2. Skriv inn NY ønsket PIN-kode (minst 4 siffer):
                    </label>
                    <input
                      type="password"
                      maxLength={10}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="Skriv inn ny PIN..."
                      className="w-full px-4 py-3 rounded-2xl bg-black/70 border border-amber-500/40 text-center font-mono font-bold text-lg text-amber-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1.5">
                      3. Gjenta og bekreft den NYE PIN-koden:
                    </label>
                    <input
                      type="password"
                      maxLength={10}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      placeholder="Gjenta ny PIN..."
                      className="w-full px-4 py-3 rounded-2xl bg-black/70 border border-amber-500/40 text-center font-mono font-bold text-lg text-amber-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {pinChangeMsg && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-bold animate-fadeIn space-y-2 ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                          : pinChangeMsg.type === 'warning'
                          ? 'bg-amber-500/20 text-amber-100 border border-amber-400/60'
                          : 'bg-rose-500/20 text-rose-200 border border-rose-400/50'
                      }`}
                    >
                      <div>{pinChangeMsg.text}</div>
                      {pinChangeMsg.type === 'warning' && !cloudStatus.isSignedIn && (
                        <button
                          type="button"
                          disabled={cloudActionLoading}
                          onClick={() => void handleGoogleCloudConnect(false)}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all"
                        >
                          {cloudActionLoading ? 'Synkroniserer...' : '☁️ Synkroniser ny PIN til Firebase Firestore nå'}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-heading font-black text-sm cursor-pointer shadow-xl transition-all flex items-center justify-center gap-2 ring-2 ring-white/40 transform hover:scale-[1.01]"
                  >
                    <span>💾</span>
                    <span>Lagre og aktiver ny PIN-kode nå</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: SPILLETID FOR FORENINGER OG LAG (UBGRENSET FOR EIER) */}
          {activeTab === 'session_limit' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-amber-950/50 border border-emerald-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-black text-sm text-emerald-300 flex items-center gap-2">
                    <span>👑</span>
                    <span>Eiermodus aktiv: ∞ Ubegrenset spilletid</span>
                  </div>
                  <p className="text-2xs text-emerald-100/85 mt-0.5 leading-relaxed">
                    Som innlogget eier teller aldri spilletiden ned for deg, og du logges ikke ut automatisk. Tidsbegrensningen nedenfor gjelder kun betalende gjester og bingoverter.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-mono font-black text-xs shrink-0">
                  {sessionRemaining}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                      <span>⏱️</span>
                      <span>Spilletid & Automatisk Vertsutlogging for Arrangementer</span>
                    </h3>
                    <p className="text-2xs text-amber-200/70 mt-0.5">
                      Spilletid for arrangementsbingo (lag og foreninger) følger valgt pakke. Vertsbingo logges automatisk ut når pakketiden utløper, mens eier har ubegrenset tilgang.
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-400/50 text-center shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Din eiertid:</div>
                    <div className={`font-mono text-lg sm:text-xl font-black ${isSessionExpired ? 'text-rose-400' : 'text-emerald-300'}`}>
                      {sessionRemaining}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      sessionTimer.resetSession(120);
                      showToast('Spilletid er nullstilt til 2 friske timer!');
                    }}
                    className="p-3 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/30 text-amber-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <span className="text-lg">🔄</span>
                    <span>Nullstill til 2 timer</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      sessionTimer.extendSession(60);
                      showToast('+60 minutter ekstra spilletid lagt til!');
                    }}
                    className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <span className="text-lg">⏳</span>
                    <span>+60 minutter ekstra</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      sessionTimer.extendSession(120);
                      showToast('+120 minutter (2 timer) lagt til!');
                    }}
                    className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <span className="text-lg">🌟</span>
                    <span>+120 minutter ekstra</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-amber-500/20">
                  <label className="text-xs font-bold text-amber-300 block mb-1">
                    Pris for arrangementsforlengelse utover 2 timer (NOK via Vipps):
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min={0}
                      value={editExtensionPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEditExtensionPrice(v);
                        updateHasUnsavedEdits(true);
                        monetization.updateSettings({ eventExtensionPrice: v });
                      }}
                      className="w-24 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                    <span className="text-xs text-amber-300/80 font-bold">kr per time</span>
                    <button
                      type="button"
                      onClick={handleSaveAppEdits}
                      disabled={savingEdits}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      {savingEdits ? 'Lagrer...' : 'Lagre pris'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KRINGKASTING & VERTSSSTYRING */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6">
              {/* Broadcast Notice Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-black/50 to-emerald-950/40 border border-amber-500/30">
                <h3 className="font-heading font-black text-sm text-amber-200 mb-1 flex items-center gap-2">
                  <span>📢</span>
                  <span>Kringkast direktemelding til alle spillere & storskjerm</span>
                </h3>
                <p className="text-xs text-amber-200/70 mb-4">
                  Meldingen popper opp umiddelbart på alles skjermer med ditt navn som vert.
                </p>

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="F.eks: 'Husk å ta kaffe i pausen ☕' eller 'Trekningen starter om 1 minutt!'"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 focus:border-amber-400 text-xs sm:text-sm text-amber-100 outline-none"
                    />
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as SystemAnnouncement['type'])}
                      className="px-3 py-2.5 rounded-xl bg-black/70 border border-amber-500/40 text-xs text-amber-200 font-bold outline-none"
                    >
                      <option value="info">ℹ️ Info</option>
                      <option value="celebration">🎉 Feiring</option>
                      <option value="pause">☕ Pause</option>
                      <option value="alert">⚠️ Viktig</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!broadcastText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all shrink-0"
                    >
                      Send Nå ➔
                    </button>
                  </div>

                  {/* Preset quick broadcasts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-amber-300/60 font-semibold mr-1">Hurtigtekster:</span>
                    {[
                      '🔔 Bingorunden starter nå! Gjør klar kortene!',
                      '☕ Pause i 5 minutter for prat og forfriskninger.',
                      '🏆 Vi har en BINGO-vinner! Gratulerer!',
                      '✨ Husk å holde en god og vennlig tone.',
                    ].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setBroadcastText(preset);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] text-amber-200/80 cursor-pointer"
                      >
                        {preset.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </form>

                {broadcastSuccess && (
                  <div className="mt-3 p-2 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-bold text-center border border-emerald-400/40 animate-fadeIn">
                    ✨ Melding sendt ut til hele lokalet!
                  </div>
                )}
              </div>

              {/* Live Host Direct Controls */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <h3 className="font-heading font-black text-sm text-amber-200 mb-3">
                  Vertsstyring & Hurtighandlinger
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onDrawBall) onDrawBall();
                      showToast('Ny kule trukket!');
                    }}
                    className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-400/40 text-amber-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow hover:border-amber-400 transition-all"
                  >
                    <span className="text-xl">🎲</span>
                    <span>Trekk Neste Kule</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onAgitateMix) onAgitateMix();
                      showToast('Trommelen roterer!');
                    }}
                    className="p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 transition-all"
                  >
                    <span className="text-xl">🌪️</span>
                    <span>Bland Kuler</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Vil du starte en helt ny runde og nullstille kulene?')) {
                        sounds.playClick();
                        if (onResetRound) onResetRound();
                        showToast('Ny runde startet!');
                      }
                    }}
                    className="p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 transition-all"
                  >
                    <span className="text-xl">🔄</span>
                    <span>Nullstill / Ny Runde</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onSwitchScreenDevice) onSwitchScreenDevice('big_screen');
                      showToast('Storskjermmodus aktivert!');
                    }}
                    className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-400/40 text-emerald-200 hover:text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow hover:border-emerald-300 transition-all"
                  >
                    <span className="text-xl">📺</span>
                    <span>Vis på Storskjerm / TV</span>
                  </button>
                </div>
              </div>

              {/* History of broadcasts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-300/80 uppercase tracking-wider">
                  Tidligere sendte meldinger:
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {ann.type === 'celebration'
                            ? '🎉'
                            : ann.type === 'pause'
                            ? '☕'
                            : ann.type === 'alert'
                            ? '⚠️'
                            : 'ℹ️'}
                        </span>
                        <span className="text-amber-100">{ann.message}</span>
                      </div>
                      <span className="text-[10px] text-amber-300/50">
                        {new Date(ann.timestamp).toLocaleTimeString('no-NO')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DELTAKERE & UTESTENGELSE (DISTURBANTS BANNING) */}
          {activeTab === 'participants' && (
            <div className="space-y-6">
              {/* Live Organizer Notifications: Who joined & BINGO claims */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-black/45 to-amber-950/30 border border-emerald-400/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-sm text-emerald-300">
                    🔔 Varsler til arrangør — Hvem som ble med &amp; Bingorop ({hostNotifications.length})
                  </h3>
                </div>
                {hostNotifications.length === 0 ? (
                  <div className="text-xs text-slate-300/80 py-2">
                    Ingen tilkoblings- eller bingovarsler ennå. Nye deltakere og bingorop vises automatisk her i sanntid.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {hostNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          item.type === 'bingo'
                            ? 'bg-amber-500/20 border-amber-400/60 text-amber-100 font-bold'
                            : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                        }`}
                      >
                        <div>
                          <span className="mr-1.5">{item.type === 'bingo' ? '🏆' : '👋'}</span>
                          <span>{item.detail}</span>
                        </div>
                        <span className="text-[10px] text-amber-200/70 shrink-0">
                          {item.gameLabel} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remote Connected Participants (Joined via Code) */}
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2.5">
                <h3 className="font-heading font-black text-sm text-cyan-200">
                  📱 Tilkoblede eksterne deltakere med kode ({remoteParticipants.length})
                </h3>
                {remoteParticipants.length === 0 ? (
                  <div className="text-xs text-slate-400">
                    Ingen eksterne mobildeltakere tilkoblet med romkode akkurat nå.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {remoteParticipants.map((rp) => (
                      <div
                        key={rp.id}
                        className="p-2.5 rounded-xl bg-cyan-950/35 border border-cyan-400/30 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: rp.color || '#06b6d4' }}
                          />
                          <span className="font-bold text-cyan-100">{rp.name}</span>
                          {rp.game && <span className="text-[10px] text-cyan-300/80">· {rp.game}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            remoteBingo.kickParticipant(rp.id, rp.name);
                            ownerControl.banParticipant(rp.name, 'Utestengt fra spillrom (10 min)');
                            showToast(`${rp.name} ble fjernet fra rommet.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-200 text-[11px] font-bold cursor-pointer"
                        >
                          🚫 Kast ut
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-200">
                      Aktive Spillere ({players.length})
                    </h3>
                    <p className="text-2xs text-amber-200/70">
                      Som spillets eier har du full kontroll til å administrere deltakere og utestenge forstyrrende oppførsel («Disturbants can be banned»).
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-black/60 border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center shrink-0 shadow"
                          style={{ backgroundColor: p.avatarColor }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-amber-100 flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.hasBingo && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                Vinner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-300/60">
                            {p.cards.length} {p.cards.length === 1 ? 'spillekort' : 'spillekort'} · {p.linesCompleted} fullførte linjer
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            ownerControl.broadcastMessage(
                              `Hei ${p.name}, en vennlig påminnelse fra verten om å følge trivselsreglene for spillet.`,
                              'alert'
                            );
                            showToast(`Advarsel sendt til ${p.name}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-bold cursor-pointer transition-all"
                        >
                          ⚠️ Send advarsel
                        </button>

                        <button
                          onClick={() => {
                            sounds.playClick();
                            setSelectedPlayerToBan(p.name);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-bold cursor-pointer transition-all"
                        >
                          🚫 Utesteng
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ban Confirmation Modal Dialog */}
              {selectedPlayerToBan && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-heading font-black text-sm">
                    <span>⚠️</span>
                    <span>Bekreft utestengelse av: «{selectedPlayerToBan}»</span>
                  </div>
                  <p className="text-xs text-rose-100/80">
                    Spilleren fjernes umiddelbart fra spillet for å opprettholde trygghet og god stemning for resten av fellesskapet.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-amber-200 block mb-1">Begrunnelse:</label>
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-rose-500/40 text-xs text-amber-100 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedPlayerToBan(null)}
                      className="px-3 py-1.5 rounded-xl bg-black/40 border border-amber-500/30 text-amber-200 text-xs font-bold cursor-pointer"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() => handleBanConfirm(selectedPlayerToBan)}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md"
                    >
                      Fullfør Utestengelse ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Banned Participants List */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <h3 className="font-heading font-black text-sm text-amber-200 mb-2">
                  Utestengte Deltakere ({bannedList.length})
                </h3>

                {bannedList.length === 0 ? (
                  <div className="text-xs text-amber-300/60 py-2 text-center italic">
                    Ingen deltakere er utestengt. Spillet forløper i harmoni og trivsel!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bannedList.map((ban) => (
                      <div
                        key={ban.id}
                        className="p-2.5 rounded-xl bg-black/60 border border-rose-500/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-rose-300 flex items-center gap-2">
                            <span>🚫 {ban.name}</span>
                            <span className="text-[10px] text-amber-200/50">
                              {new Date(ban.bannedAt).toLocaleDateString('no-NO')}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-200/70 italic">
                            Årsak: {ban.reason}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnban(ban.id, ban.name)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold cursor-pointer transition-all"
                        >
                          Opphev utestengelse
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TRIVSEL & ORDFILTER (MODERATION & BANNED WORDS) */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              {/* Add custom banned word */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25">
                <h3 className="font-heading font-black text-sm text-amber-200 mb-1 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Legg til uønsket ord i trivselsfilteret</span>
                </h3>
                <p className="text-xs text-amber-200/70 mb-3">
                  Ord i listen erstattes automatisk med glitrende trivselssymboler (✨💖✨) overalt i spillet.
                </p>

                <form onSubmit={handleAddBannedWord} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    placeholder="Skriv inn ord du vil blokkere..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 focus:border-amber-400 text-xs text-amber-100 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newBannedWord.trim()}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all shrink-0"
                  >
                    + Legg Til
                  </button>
                </form>
              </div>

              {/* Banned words tag cloud */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Aktive blokkerte ord ({bannedWords.length})
                  </h4>
                  <span className="text-[11px] text-amber-200/60">
                    Trykk på krysset for å fjerne et ord
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {bannedWords.map((word) => (
                    <span
                      key={word}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs font-mono flex items-center gap-1.5"
                    >
                      <span>{word}</span>
                      <button
                        onClick={() => handleRemoveBannedWord(word)}
                        className="text-rose-400 hover:text-white font-bold ml-1 cursor-pointer"
                        title="Fjern fra filter"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Upload Safety Settings */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25 flex items-center justify-between gap-4">
                <div>
                  <div className="font-heading font-black text-sm text-amber-200">
                    Streng bildekontroll for publikumsopplastinger
                  </div>
                  <div className="text-xs text-amber-200/70">
                    Avviser automatisk usømmelige eller feiltilpassede bilder (maks 600 KB, kvadratisk bildeformat).
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shrink-0">
                  Aktiv & Beskyttet
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ØKONOMI, BETALING & PRISER */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">
              {/* Explanation notice about Card & Wallet Payments */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-black/60 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-heading font-black text-sm">
                  <span>💳</span>
                  <span>Sikker Kortbetaling & Digitale Lommebøker (Alternativ 3)</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Vipps er fjernet som kundealternativ. Alle spillere og verter betaler nå trygt med <strong>Visa</strong>, <strong>Mastercard</strong>, <strong>Apple Pay</strong> og <strong>Google Pay</strong> med 3D Secure / BankID-verifisering. Ditt private telefonnummer er fullstendig skjermet og vises aldri til kundene. Alle inntekter registreres direkte i din app-saldo for utbetaling til din bankkonto.
                </p>
              </div>

              {/* Kort & Apple Pay Features Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/50 to-teal-950/30 border-2 border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center text-lg font-black shadow-md shrink-0 ring-1 ring-white/30">
                    💳
                  </div>
                  <div>
                    <div className="font-heading font-black text-xs sm:text-sm text-amber-200 flex items-center gap-2">
                      <span>Kort & Digital Wallet Betalingsflyt</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold">
                        Aktiv Integrasjon
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                      Sikker utsjekk med automatisk kortdeteksjon (Visa/Mastercard), 1-klikks Pay / Google Pay og BankID-godkjenning.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ekte Pengeoverføring & Stripe Gateway Integrasjon */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#121c17] via-[#0c1410] to-[#080d0b] border-2 border-emerald-500/50 shadow-xl space-y-4 text-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                      ⚡
                    </div>
                    <div>
                      <div className="font-heading font-black text-base text-white flex items-center gap-2">
                        <span>Ekte Penger & Stripe Betalingsgateway</span>
                      </div>
                      <div className="text-xs text-emerald-300/80">
                        Visa · Mastercard · Apple Pay · Google Pay · Direkte trekk fra kundens bank
                      </div>
                    </div>
                  </div>

                  {/* Gateway Status Badge */}
                  <div>
                    {stripeGatewayStatus?.isLive ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE EKTE PENGER AKTIVT
                      </span>
                    ) : stripeGatewayStatus?.isTest ? (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        TEST-MODUS AKTIV
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500 text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        VENTER PÅ STRIPE-NØKKEL
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Honest Legal/Technical Explanation */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs leading-relaxed space-y-2">
                  <div className="font-bold text-emerald-200 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Hvorfor krever ekte penger en godkjent betalingsformidler (Stripe)?</span>
                  </div>
                  <p className="text-emerald-100/90 text-[11px]">
                    Norsk lov, Finanstilsynet og internasjonale banksikkerhetsregler (PCI-DSS & 3D Secure) forbyr at en nettside trekker penger fra et bankkort eller Apple/Google Pay på egen hånd. Hvis en hvilken som helst app kunne trekke penger uten en godkjent bankavtale, ville det vært en enorm sikkerhetsrisiko.
                  </p>
                  <p className="text-emerald-100/90 text-[11px]">
                    Ved å legge inn din egen <strong>Stripe Secret Key</strong> nedenfor, kobles JoyBingo direkte til din egen Stripe-konto. Penger kunden betaler for spilletid trekkes <em>faktisk</em> fra kundens bankkonto, samles på din Stripe-saldo, og overføres automatisk til din oppgitte bankkonto.
                  </p>
                </div>

                {/* 3-Step Money Flow Infographic */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/25 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[11px] font-mono">1</span>
                      <span>Kunden betaler</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/80 leading-snug">
                      Arrangør eller spiller betaler i appen med Visa, Mastercard, Apple Pay eller Google Pay.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/25 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-[11px] font-mono">2</span>
                      <span>Inn på din Stripe-konto</span>
                    </div>
                    <p className="text-[11px] text-amber-100/80 leading-snug">
                      Pengene overføres umiddelbart til din egen Stripe-saldo. Appen mottar digital kvittering og åpner spillet.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/25 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-teal-300">
                      <span className="w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 flex items-center justify-center text-[11px] font-mono">3</span>
                      <span>Rett til din bankkonto</span>
                    </div>
                    <p className="text-[11px] text-teal-100/80 leading-snug">
                      Stripe utbetaler automatisk pengene (f.eks. daglig eller ukentlig) rett inn på din norske bankkonto (11 siffer)!
                    </p>
                  </div>
                </div>

                {/* Active via Hemmeligheter / Env Notice */}
                {stripeGatewayStatus?.source === 'env' && (
                  <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/50 text-xs text-emerald-100 flex items-start gap-2.5">
                    <span className="text-base leading-none">✅</span>
                    <div className="space-y-0.5">
                      <div className="font-black text-emerald-300">
                        Tilkoblet automatisk via Hemmeligheter (STRIPE_SECRET_KEY)
                      </div>
                      <p className="text-[11px] text-emerald-100/85">
                        Nøkkelen er allerede aktiv på serveren fra AI Studio Hemmeligheter. Du trenger <strong>ikke</strong> å lime den inn på nytt her.
                      </p>
                    </div>
                  </div>
                )}

                {/* Input Fields for Stripe Secret Key & Publishable Key */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-emerald-200 block mb-1">
                      Stripe Secret / Restricted Key (<span className="font-mono text-emerald-400">sk_live_ / rk_live_</span> eller <span className="font-mono text-amber-300">sk_test_ / rk_test_</span>):
                    </label>
                    <input
                      type="password"
                      value={stripeSecretKeyInput}
                      onChange={(e) => setStripeSecretKeyInput(e.target.value)}
                      placeholder={
                        stripeGatewayStatus?.source === 'env'
                          ? 'Allerede aktiv via STRIPE_SECRET_KEY i Hemmeligheter (la stå tom)'
                          : 'sk_live_... / rk_live_... eller sk_test_...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-emerald-500/40 focus:border-emerald-400 text-white font-mono text-xs outline-none shadow-inner"
                    />
                    <div className="text-[10px] text-emerald-300/70 mt-1 flex items-center justify-between">
                      <span>Hemmelig nøkkel lagres trygt på backend og sendes aldri til vanlige spillere.</span>
                      <a
                        href="https://dashboard.stripe.com/apikeys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:underline font-bold"
                      >
                        Hent nøkkel på stripe.com ↗
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-200 block mb-1">
                      Stripe Publishable Key (Offentlig nøkkel: <span className="font-mono text-emerald-400">pk_live_...</span> eller <span className="font-mono text-amber-300">pk_test_...</span>):
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKeyInput}
                      onChange={(e) => setStripePublishableKeyInput(e.target.value)}
                      placeholder="pk_live_51P... eller pk_test_51P..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-emerald-500/40 focus:border-emerald-400 text-white font-mono text-xs outline-none shadow-inner"
                    />
                  </div>

                  {stripeSaveMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold ${
                        stripeSaveMsg.type === 'success'
                          ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-200'
                          : 'bg-rose-950/90 border border-rose-400 text-rose-200'
                      }`}
                    >
                      {stripeSaveMsg.type === 'success' ? '✓ ' : '⚠️ '}
                      {stripeSaveMsg.text}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={stripeSaving}
                      onClick={handleSaveStripeKeys}
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      <span>{stripeSaving ? 'Lagrer til server...' : 'Lagre og aktiver Stripe Gateway'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={loadStripeStatus}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-black/50 hover:bg-black/70 border border-emerald-500/30 text-emerald-200 font-bold text-xs cursor-pointer transition-all text-center"
                    >
                      🔄 Test gateway-status
                    </button>
                  </div>
                </div>
              </div>

              {/* Owner Commission Settings Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/25 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-200 flex items-center gap-2">
                      <span>Priser, Bankkonto og Utbetalingsoppsett</span>
                      {hasUnsavedEdits && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-2xs animate-pulse">
                          Ulagrede endringer
                        </span>
                      )}
                    </h3>
                    <p className="text-2xs text-amber-200/70">
                      Endre prisene og klikk «Lagre priser til server» slik at alle spillere og betalinger bruker dine priser permanent.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingEdits}
                    onClick={handleSaveAppEdits}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                  >
                    <span>💾</span>
                    <span>{savingEdits ? 'Lagrer til server...' : 'Lagre priser til server'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Bankkontonummer for utbetaling (11 siffer):
                    </label>
                    <input
                      type="text"
                      value={editBankAccount}
                      onChange={(e) => {
                        setEditBankAccount(e.target.value);
                        updateHasUnsavedEdits(true);
                      }}
                      placeholder="f.eks. 1234.56.78901"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                    <span className="text-[10px] text-emerald-300/80 block mt-1">
                      🏦 Penger overføres direkte til din norske bankkonto ved Admin Payout.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Servicegebyr per spiller (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editFeePerPlayer}
                      onChange={(e) => {
                        setEditFeePerPlayer(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Forlengelse utover 2 timer (NOK per time):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editExtensionPrice}
                      onChange={(e) => {
                        setEditExtensionPrice(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      RIL Bedrift & Storskjerm-lisens (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editProBigScreenPrice}
                      onChange={(e) => {
                        setEditProBigScreenPrice(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      20 minutter prøvetid (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice20MinTrial}
                      onChange={(e) => {
                        setEditPrice20MinTrial(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      1 time spilletid (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice1Hour}
                      onChange={(e) => {
                        setEditPrice1Hour(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      2 timer standardpakke (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice2Hours}
                      onChange={(e) => {
                        setEditPrice2Hours(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      3 timer forlenget (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice3Hours}
                      onChange={(e) => {
                        setEditPrice3Hours(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      4 timer helaften (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPrice4Hours}
                      onChange={(e) => {
                        setEditPrice4Hours(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Hele dagen / Ubegrenset (NOK):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPriceFullDay}
                      onChange={(e) => {
                        setEditPriceFullDay(Number(e.target.value));
                        updateHasUnsavedEdits(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-100 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-emerald-300">
                    Netto klar til utbetaling: <span className="font-mono font-black text-sm">{totalEarnings.totalCommission} kr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingEdits}
                      onClick={handleSaveAppEdits}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all disabled:opacity-60"
                    >
                      💾 {savingEdits ? 'Lagrer...' : 'Lagre priser nå'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playLineComplete();
                        showToast(`Utbetalingsforespørsel på ${totalEarnings.totalCommission} kr er registrert til konto ${editBankAccount || monetizationSettings.bankAccount || '(konto angis)'}!`);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all"
                    >
                      Be om utbetaling nå ➔
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction history log */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Transaksjonshistorikk ({monetization.getTransactions().length})
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {monetization.getTransactions().map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-black/60 border border-amber-500/15 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-100">{tx.title}</div>
                        <div className="text-[10px] text-amber-300/60">
                          {tx.payerName || 'Deltaker'} · Ref: {tx.reference} · {new Date(tx.timestamp).toLocaleString('no-NO')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-300">+{tx.grossAmount} kr</div>
                        <div className="text-[10px] text-emerald-400/70 font-semibold">{tx.paymentMethod.toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMIN PAYOUT - UTBETALING TIL EIER */}
          {activeTab === 'payout' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0d2319] to-black/80 border-2 border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-2xl flex items-center justify-center shrink-0 shadow-md">
                    💸
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-emerald-200 flex items-center gap-2">
                      <span>Admin Payout & Utbetalingssentral</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                        Eierområde
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl leading-relaxed">
                      Her administrerer og overfører du opptjente arrangements- og spilleavgifter direkte til din norske bankkonto.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsVippsTestOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all shrink-0"
                    title="Simuler et faktisk betalingskall og test at saldoen øker"
                  >
                    <span className="text-xs">💳</span>
                    <span>Test Betaling & Saldo</span>
                  </button>

                  <div className="text-right shrink-0">
                    <div className="text-2xs uppercase tracking-wider text-emerald-400/80 font-bold">Disponibel saldo</div>
                    <div className="font-mono font-black text-2xl sm:text-3xl text-emerald-300">
                      {monetization.getAvailableForPayout()} kr
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/20">
                  <div className="text-2xs text-amber-400 uppercase tracking-wider font-bold">Total Inntekt (Brutto)</div>
                  <div className="font-mono font-black text-lg sm:text-xl text-amber-100 mt-1">
                    {totalEarnings.totalGross} kr
                  </div>
                  <div className="text-[10px] text-amber-300/60 mt-0.5 font-medium">
                    {totalEarnings.transactionsCount} innbetalinger registrert
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/20">
                  <div className="text-2xs text-amber-400 uppercase tracking-wider font-bold">Eierens Netto Provisjon</div>
                  <div className="font-mono font-black text-lg sm:text-xl text-emerald-300 mt-1">
                    {totalEarnings.totalCommission} kr
                  </div>
                  <div className="text-[10px] text-emerald-400/70 mt-0.5 font-medium">
                    Opptjent etter avgifter
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/20">
                  <div className="text-2xs text-amber-400 uppercase tracking-wider font-bold">Tidligere Utbetalt</div>
                  <div className="font-mono font-black text-lg sm:text-xl text-amber-200 mt-1">
                    {monetization.getTotalPaidOut()} kr
                  </div>
                  <div className="text-[10px] text-amber-300/60 mt-0.5 font-medium">
                    {payoutsList.length} utbetalinger gjennomført
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-black/60 border-2 border-emerald-500/40 shadow-md">
                  <div className="text-2xs text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Klar for Utbetaling</span>
                  </div>
                  <div className="font-mono font-black text-lg sm:text-xl text-emerald-200 mt-1">
                    {monetization.getAvailableForPayout()} kr
                  </div>
                  <div className="text-[10px] text-emerald-300/80 mt-0.5 font-medium">
                    Straksutbetaling tilgjengelig
                  </div>
                </div>
              </div>

              {/* Payout Request Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <h4 className="font-heading font-black text-sm text-emerald-200 flex items-center gap-2">
                    <span>🏦</span>
                    <span>Initier utbetalingsforespørsel (Admin Payout)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-400/90 font-medium">
                    Behandles umiddelbart via NICS / Vipps Straks
                  </span>
                </div>

                <form onSubmit={handleExecutePayout} className="space-y-3.5">
                  {/* Destination Toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutDestType('bank')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        payoutDestType === 'bank'
                          ? 'bg-emerald-600/30 border-emerald-400 text-white font-black shadow'
                          : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:bg-black/60'
                      }`}
                    >
                      <span>🏦</span>
                      <span>Bankkonto (NICS Straksbetaling)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutDestType('vipps')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        payoutDestType === 'vipps'
                          ? 'bg-[#ff5b24]/30 border-[#ff5b24] text-white font-black shadow'
                          : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:bg-black/60'
                      }`}
                    >
                      <span>📱</span>
                      <span>Vipps Straksutbetaling</span>
                    </button>
                  </div>

                  {/* Account number / Vipps input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {payoutDestType === 'bank' ? (
                      <div>
                        <label className="text-xs font-bold text-amber-300 block mb-1">
                          Norsk bankkontonummer (11 siffer): <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={payoutBank}
                          onChange={(e) => setPayoutBank(e.target.value)}
                          placeholder="f.eks. 1205.45.98124"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-100 font-mono font-bold text-sm outline-none focus:border-emerald-400"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-amber-300 block mb-1">
                          Vipps-nummer for utbetaling: <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={payoutVipps}
                          onChange={(e) => setPayoutVipps(e.target.value)}
                          placeholder="f.eks. 920 00 000"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-[#ff5b24]/50 text-amber-100 font-mono font-bold text-sm outline-none focus:border-[#ff5b24]"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-amber-300">
                          Beløp som skal utbetales (NOK): <span className="text-rose-400">*</span>
                        </label>
                        {monetization.getAvailableForPayout() > 0 && (
                          <button
                            type="button"
                            onClick={() => setPayoutAmount(String(monetization.getAvailableForPayout()))}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
                          >
                            Ta ut alt ({monetization.getAvailableForPayout()} kr)
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={monetization.getAvailableForPayout()}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="f.eks. 500"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-100 font-mono font-bold text-sm outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-amber-300 block mb-1">
                        Mottakers navn (Eier / Firma):
                      </label>
                      <input
                        type="text"
                        value={payoutRecipient}
                        onChange={(e) => setPayoutRecipient(e.target.value)}
                        placeholder="JoyBingo Eier"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-300 block mb-1">
                        Overføringsmerking / Notat:
                      </label>
                      <input
                        type="text"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                        placeholder="f.eks. Månedsoppgjør JoyBingo"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Feedback notices */}
                  {payoutError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-200 text-xs font-bold animate-fadeIn">
                      ⚠️ {payoutError}
                    </div>
                  )}

                  {payoutSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-xs font-bold animate-fadeIn">
                      {payoutSuccess}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-amber-300/70">
                      🔒 Overføringen kvitteres med offisielt avregningsbilag og trekkes fra disponibel saldo.
                    </div>
                    <button
                      type="submit"
                      disabled={monetization.getAvailableForPayout() <= 0}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>💸</span>
                      <span>Send utbetalingsforespørsel / Overfør nå</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Payout History Log */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-emerald-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <span>📋</span>
                    <span>Utbetalingshistorikk ({payoutsList.length})</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Totalt utbetalt: {monetization.getTotalPaidOut()} kr
                  </span>
                </div>

                {payoutsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/30 border border-dashed border-emerald-500/20 text-center text-xs text-emerald-300/60">
                    Ingen utbetalinger er gjennomført ennå. Fyll ut skjemaet over for å ta ut din første opptjening!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {payoutsList.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-black/60 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-emerald-100 flex items-center gap-2">
                            <span>{p.destinationType === 'bank' ? '🏦 Bankkonto:' : '📱 Vipps:'}</span>
                            <span className="font-mono text-emerald-300">
                              {p.destinationType === 'bank' ? p.bankAccount : p.vippsNumber}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                              Fullført
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-300/60 mt-0.5">
                            Ref: {p.reference} · Bilag: {p.receiptNumber} · {new Date(p.timestamp).toLocaleString('no-NO')}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="font-mono font-black text-emerald-300 text-sm">
                            - {p.amount} kr
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setActiveReceipt(p);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-2xs font-bold cursor-pointer transition-all flex items-center gap-1"
                          >
                            <span>📄</span>
                            <span>Vis bilag</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Receipt / Bilag Modal Popup */}
              {activeReceipt && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
                  <div className="w-full max-w-md bg-[#131f18] border-2 border-emerald-400/80 rounded-3xl p-5 shadow-2xl text-emerald-50 space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🧾</span>
                        <div>
                          <h4 className="font-heading font-black text-base text-emerald-200">
                            Offisielt Avregningsbilag
                          </h4>
                          <span className="text-2xs text-emerald-400/70 font-mono">
                            {activeReceipt.receiptNumber}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(null)}
                        className="w-8 h-8 rounded-xl bg-black/40 text-emerald-300 hover:text-white flex items-center justify-center font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-300/70">Utbetalingsbeløp:</span>
                        <span className="font-mono font-black text-base text-emerald-200">{activeReceipt.amount} kr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300/70">Mottaker:</span>
                        <span className="font-bold text-white">{activeReceipt.recipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300/70">Overført til:</span>
                        <span className="font-mono text-emerald-300">
                          {activeReceipt.destinationType === 'bank' ? `Bankkonto ${activeReceipt.bankAccount}` : `Vipps ${activeReceipt.vippsNumber}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300/70">NICS / Bank-referanse:</span>
                        <span className="font-mono font-bold text-emerald-400">{activeReceipt.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300/70">Dato & Tidspunkt:</span>
                        <span className="font-mono text-emerald-200">{new Date(activeReceipt.timestamp).toLocaleString('no-NO')}</span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-500/20 pt-1.5">
                        <span className="text-emerald-300/70">Status:</span>
                        <span className="font-bold text-emerald-300">✓ Overført via NICS Straks</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          window.print();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>🖨️</span>
                        <span>Skriv ut bilag</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(null)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                      >
                        Lukk
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INNBOKS: PROBLEMRAPPORTER FRA BRUKERE & VERTER */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-black/60 to-amber-950/40 border border-amber-500/30">
                <div>
                  <h3 className="font-heading font-black text-base text-amber-200 flex items-center gap-2">
                    <span>💬</span>
                    <span>Innboks: Problemrapporter & Tilbakemeldinger</span>
                  </h3>
                  <p className="text-2xs text-amber-300/80 mt-0.5">
                    Henvendelser sendt inn via appen. Brukere kan rapportere anonymt eller legge ved navn og e-post.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-amber-500/20 text-xs">
                  <button
                    onClick={() => setReportFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      reportFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    Alle ({reportsList.length})
                  </button>
                  <button
                    onClick={() => setReportFilter('new')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      reportFilter === 'new'
                        ? 'bg-rose-500 text-white shadow-sm font-black'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    <span>Nye ({reportsList.filter((r) => r.status === 'new').length})</span>
                  </button>
                  <button
                    onClick={() => setReportFilter('resolved')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      reportFilter === 'resolved'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                        : 'text-amber-200/70 hover:text-amber-100'
                    }`}
                  >
                    Løste ({reportsList.filter((r) => r.status === 'resolved').length})
                  </button>
                </div>
              </div>

              {/* Reports list */}
              {reportsList
                .filter((r) => (reportFilter === 'all' ? true : reportFilter === 'new' ? r.status === 'new' : r.status === 'resolved'))
                .length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-black/30 border border-amber-500/20 text-amber-200/60 text-xs space-y-2">
                  <span className="text-3xl block">📭</span>
                  <p>Ingen rapporter i denne visningen.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportsList
                    .filter((r) => (reportFilter === 'all' ? true : reportFilter === 'new' ? r.status === 'new' : r.status === 'resolved'))
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                          rep.status === 'new'
                            ? 'bg-black/70 border-rose-500/40 shadow-lg'
                            : rep.status === 'investigating'
                            ? 'bg-black/60 border-sky-500/40'
                            : 'bg-black/40 border-emerald-500/30 opacity-80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold text-2xs uppercase tracking-wider">
                              {rep.categoryLabel}
                            </span>
                            <span className="text-2xs text-amber-400/60 font-mono">
                              {new Date(rep.timestamp).toLocaleString('nb-NO')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {rep.status === 'new' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-2xs">
                                NY
                              </span>
                            )}
                            {rep.status === 'investigating' && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-black text-2xs">
                                UNDER BEHANDLING
                              </span>
                            )}
                            {rep.status === 'resolved' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-2xs">
                                LØST
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Avsender info */}
                        <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{rep.isAnonymous ? '🕶️' : '👤'}</span>
                            <div>
                              <div className="font-bold text-amber-100">
                                {rep.isAnonymous ? (
                                  <span className="text-amber-300 font-semibold">Anonym avsender</span>
                                ) : (
                                  <span>{rep.reporterName || 'Navngitt bruker'}</span>
                                )}
                              </div>
                              {!rep.isAnonymous && rep.reporterEmail && (
                                <div className="text-2xs text-sky-300 font-mono">
                                  {rep.reporterEmail}
                                </div>
                              )}
                            </div>
                          </div>

                          {!rep.isAnonymous && rep.reporterEmail && (
                            <a
                              href={`mailto:${rep.reporterEmail}?subject=Svar på JoyBingo tilbakemelding&body=Hei ${rep.reporterName || ''},\n\nTakk for din tilbakemelding:\n`}
                              className="px-2.5 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white font-bold text-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Send svar på e-post"
                            >
                              <span>✉️</span>
                              <span>Svar på e-post</span>
                            </a>
                          )}
                        </div>

                        {/* Melding */}
                        <div className="p-3 rounded-xl bg-black/60 border border-amber-500/20 text-amber-100 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                          {rep.message}
                        </div>

                        {/* Eventuelt svar fra eier sendt i appen */}
                        {rep.ownerReply && (
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 text-xs space-y-1">
                            <div className="flex items-center justify-between text-2xs text-emerald-300 font-bold">
                              <span>📬 Ditt svar sendt i appen ({rep.ownerRepliedBy || 'Eier'}):</span>
                              {rep.ownerRepliedAt && <span>{new Date(rep.ownerRepliedAt).toLocaleString('nb-NO')}</span>}
                            </div>
                            <p className="whitespace-pre-wrap text-emerald-200">{rep.ownerReply}</p>
                          </div>
                        )}

                        {/* Svar-felt i appen */}
                        <div className="p-3 rounded-xl bg-black/60 border border-amber-500/20 space-y-2">
                          <label className="text-2xs font-bold text-amber-300 block">
                            {rep.ownerReply ? '✏️ Oppdater svar til brukeren i appen:' : '💬 Skriv svar til brukeren i appen:'}
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <textarea
                              rows={2}
                              value={replyDrafts[rep.id] ?? ''}
                              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                              placeholder="Skriv svar her (f.eks. Takk for tipset! Dette er nå ordnet i siste oppdatering)..."
                              className="flex-1 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/30 text-xs text-amber-100 outline-none focus:border-amber-400 resize-none leading-relaxed"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendReply(rep.id)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-2xs cursor-pointer shadow flex items-center justify-center gap-1.5 shrink-0 sm:self-end transition-all"
                            >
                              <span>📤</span>
                              <span>Send svar i appen</span>
                            </button>
                          </div>
                        </div>

                        {/* Status endring & Slett */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/15">
                          <div className="text-2xs text-amber-400/60 font-mono">
                            Enhet: {rep.deviceInfo || 'Standard nettleser'}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {rep.status !== 'investigating' && (
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  problemReports.updateReportStatus(rep.id, 'investigating');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-200 hover:bg-sky-900 text-2xs font-bold transition-all cursor-pointer"
                              >
                                Under behandling
                              </button>
                            )}
                            {rep.status !== 'resolved' && (
                              <button
                                onClick={() => {
                                  sounds.playLineComplete();
                                  problemReports.updateReportStatus(rep.id, 'resolved');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900 text-2xs font-bold transition-all cursor-pointer"
                              >
                                ✓ Merk som løst
                              </button>
                            )}
                            <button
                              onClick={() => {
                                sounds.playClick();
                                problemReports.deleteReport(rep.id);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900 text-2xs font-bold transition-all cursor-pointer"
                              title="Slett rapport"
                            >
                              Slett
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Modal Footer with quick owner profile info */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300/80">
            <span>🛡️</span>
            <span>
              {profile.isUnlocked
                ? 'Innlogget med eier- og administratorrettigheter'
                : 'Beskyttet eierområde · PIN kreves'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {profile.isUnlocked && (
              <button
                onClick={() => {
                  sounds.playClick();
                  ownerControl.lockAdmin();
                  authService.logout();
                  showToast('Eierpanelet er nå låst.');
                }}
                className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                title="Lås eierpanelet igjen"
              >
                <span>🔒</span>
                <span>Lås panel</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md transition-all"
            >
              Lukk
            </button>
          </div>
        </div>
      </div>
      {/* Test Vipps-integrasjon Modal */}
      <VippsTestIntegrationModal
        isOpen={isVippsTestOpen}
        onClose={() => setIsVippsTestOpen(false)}
        onSuccess={() => {
          setPayoutsList(monetization.getPayouts());
          showToast('Vipps-integrasjonstest fullført! Saldoen ble oppdatert.');
        }}
      />
    </div>
  );
};
