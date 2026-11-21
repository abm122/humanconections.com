/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  monetization,
  CommissionTransaction,
  OwnerMonetizationSettings,
  ServiceFeeType,
  PaymentMethod,
} from '../services/monetization';
import { sounds } from '../audio/soundEngine';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayerCount?: number;
  onPaymentSuccess?: (tx: CommissionTransaction) => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  activePlayerCount = 4,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pay' | 'dashboard' | 'settings'>('pay');
  const [settings, setSettings] = useState<OwnerMonetizationSettings>(monetization.getSettings());
  const [transactions, setTransactions] = useState<CommissionTransaction[]>(monetization.getTransactions());
  const [earnings, setEarnings] = useState(monetization.getTotalEarnings());

  // Payment form state
  const [selectedFeeType, setSelectedFeeType] = useState<ServiceFeeType>('per_player');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [payerName, setPayerName] = useState<string>('Deltager / Vert');
  const [customTipAmount, setCustomTipAmount] = useState<number>(49);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Settings form state
  const [editVipps, setEditVipps] = useState(settings.vippsNumber);
  const [editBank, setEditBank] = useState(settings.bankAccount);
  const [editFeePerPlayer, setEditFeePerPlayer] = useState(settings.fixedFeePerPlayer);
  const [editEventPassPrice, setEditEventPassPrice] = useState(settings.eventPassPrice);
  const [editProPrice, setEditProPrice] = useState(settings.proBigScreenPrice);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    const unsub = monetization.subscribe(() => {
      setSettings(monetization.getSettings());
      setTransactions(monetization.getTransactions());
      setEarnings(monetization.getTotalEarnings());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // Compute calculated sum based on selected type
  const calculateTotal = (): { gross: number; commission: number; title: string } => {
    if (selectedFeeType === 'per_player') {
      const gross = activePlayerCount * settings.fixedFeePerPlayer;
      return {
        gross,
        commission: gross,
        title: `Deltaker-servicegebyr (${activePlayerCount} spillere à ${settings.fixedFeePerPlayer} kr)`,
      };
    } else if (selectedFeeType === 'event_pass') {
      return {
        gross: settings.eventPassPrice,
        commission: settings.eventPassPrice,
        title: `Vertspass Helkveld (${settings.eventPassPrice} kr)`,
      };
    } else if (selectedFeeType === 'pro_ril_bigscreen') {
      return {
        gross: settings.proBigScreenPrice,
        commission: settings.proBigScreenPrice,
        title: `RIL Bedrift & Storskjerm-lisens (${settings.proBigScreenPrice} kr)`,
      };
    } else {
      return {
        gross: customTipAmount,
        commission: customTipAmount,
        title: `Vipps Kaffe & Sosial Trivselsstøtte (${customTipAmount} kr)`,
      };
    }
  };

  const currentTotal = calculateTotal();

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playLineComplete();

    const tx = monetization.recordTransaction({
      type: selectedFeeType,
      title: currentTotal.title,
      grossAmount: currentTotal.gross,
      commissionAmount: currentTotal.commission,
      playerCount: selectedFeeType === 'per_player' ? activePlayerCount : 1,
      paymentMethod: selectedMethod,
      payerName: payerName.trim() || 'Deltager',
    });

    setPaymentSuccessMsg(`Betaling fullført! ${currentTotal.gross} kr er registrert via ${selectedMethod.toUpperCase()} (Ref: ${tx.reference}).`);
    if (onPaymentSuccess) {
      onPaymentSuccess(tx);
    }

    setTimeout(() => {
      setPaymentSuccessMsg(null);
    }, 4500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    monetization.updateSettings({
      vippsNumber: editVipps.trim(),
      bankAccount: editBank.trim(),
      fixedFeePerPlayer: Number(editFeePerPlayer) || 10,
      eventPassPrice: Number(editEventPassPrice) || 49,
      proBigScreenPrice: Number(editProPrice) || 199,
    });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#180f08] via-[#120a05] to-black border-2 border-amber-400/50 shadow-2xl p-4 sm:p-7 text-amber-50">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/25">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl">
              💰
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-black text-amber-200">
                  Kommisjon & Inntjening
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  Servicegebyr & Vipps
                </span>
              </div>
              <p className="text-2xs sm:text-xs text-amber-300/70 font-medium">
                Tjen penger på hver spiller, runder og arrangementer · Eier: {settings.ownerName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-amber-300 hover:text-white hover:bg-amber-900/40 cursor-pointer transition-all"
            title="Lukk"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 my-4 p-1 rounded-2xl bg-black/60 border border-amber-500/25">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('pay');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pay'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            <span>💳</span>
            <span>Betal Servicegebyr (Kort / Apple Pay)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('dashboard');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            <span>📊</span>
            <span>Eierens Inntekt ({earnings.totalCommission} kr)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('settings');
            }}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Priser & Oppsett</span>
          </button>
        </div>

        {/* Success Toast */}
        {paymentSuccessMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-emerald-100 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in">
            <span className="text-xl">✅</span>
            <span>{paymentSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: PAY SERVICE FEE (VIPPS / CARD / INVOICE) */}
        {activeTab === 'pay' && (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400/80 block mb-2">
                1. Velg Tjenestepakke & Kommisjon:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option A: Per Player Fee */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFeeType('per_player');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedFeeType === 'per_player'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-black text-sm text-amber-300">
                      Spillergebyr ({settings.fixedFeePerPlayer} kr / spiller)
                    </span>
                    <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                      {activePlayerCount * settings.fixedFeePerPlayer} kr
                    </span>
                  </div>
                  <p className="text-2xs text-amber-200/70 leading-snug">
                    Standard service for denne runden ({activePlayerCount} aktive spillere).
                  </p>
                </button>

                {/* Option B: Event Pass */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFeeType('event_pass');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedFeeType === 'event_pass'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-black text-sm text-amber-300">
                      Vertspass Helkveld
                    </span>
                    <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                      {settings.eventPassPrice} kr
                    </span>
                  </div>
                  <p className="text-2xs text-amber-200/70 leading-snug">
                    Ubegrensede runder for vennegjengen eller bursdagen i kveld.
                  </p>
                </button>

                {/* Option C: RIL Bedrift / Storskjerm */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFeeType('pro_ril_bigscreen');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedFeeType === 'pro_ril_bigscreen'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-black text-sm text-amber-300">
                      🏆 Klubb & Bedrift RIL-Pass
                    </span>
                    <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                      {settings.proBigScreenPrice} kr
                    </span>
                  </div>
                  <p className="text-2xs text-amber-200/70 leading-snug">
                    Storskjerm for opptil 50 deltagere, idrettslag, bedriftsfest og seminar.
                  </p>
                </button>

                {/* Option D: Tips / Kaffe */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFeeType('tip_coffee');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedFeeType === 'tip_coffee'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-black text-sm text-amber-300">
                      ☕ Vipps Kaffe / Frivillig Støtte
                    </span>
                    <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                      {customTipAmount} kr
                    </span>
                  </div>
                  <p className="text-2xs text-amber-200/70 leading-snug">
                    Frivillig tips for sosial trivsel og videre app-utvikling.
                  </p>
                </button>
              </div>

              {selectedFeeType === 'tip_coffee' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">Velg beløp:</span>
                  {[29, 49, 99, 149].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomTipAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        customTipAmount === amt
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-black/50 text-amber-200 border border-amber-500/20'
                      }`}
                    >
                      {amt} kr
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Betalingsmetode */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400/80 block mb-2">
                2. Velg Betalingsmåte:
              </span>

              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMethod('apple_pay');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'apple_pay'
                      ? 'bg-neutral-900 border-white text-white ring-2 ring-white/50 shadow-md font-bold'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:bg-black/60'
                  }`}
                >
                  <div className="text-base font-black text-white"> Pay / GPay</div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">1-klikk digital lommebok</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMethod('card');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'card'
                      ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:bg-black/60'
                  }`}
                >
                  <div className="text-base font-bold">Bankkort / Stripe</div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">Visa / Mastercard</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMethod('invoice');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedMethod === 'invoice'
                      ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                      : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:bg-black/60'
                  }`}
                >
                  <div className="text-base font-bold">Bedriftsfaktura</div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">For klubber & firma</div>
                </button>
              </div>

              {selectedMethod === 'apple_pay' && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-black flex items-center justify-center text-sm border border-white/20">
                      
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Digital hurtigkasse: <strong>Apple Pay / Google Pay</strong>
                      </div>
                      <div className="text-2xs text-amber-300/70">
                        Trygg betaling med Touch ID, Face ID eller enhetskode
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-300">Aktiv</span>
                </div>
              )}
            </div>

            {/* Navn & Bekreftelsesknapp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-auto flex-1">
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Ditt navn eller klubbens navn..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-heading font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Fullfør Betaling ({currentTotal.gross} kr)</span>
                <span>➔</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: OWNER'S REVENUE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25 text-center">
                <div className="text-2xs uppercase tracking-wider text-amber-300/70 font-bold mb-1">
                  Opptjent Kommisjon
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-amber-300">
                  {earnings.totalCommission} kr
                </div>
                <div className="text-3xs text-emerald-400 font-bold mt-1">100% din fortjeneste</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25 text-center">
                <div className="text-2xs uppercase tracking-wider text-amber-300/70 font-bold mb-1">
                  Brutto Omsetning
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-amber-100">
                  {earnings.totalGross} kr
                </div>
                <div className="text-3xs text-amber-300/60 font-medium mt-1">Gjennom appen</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25 text-center">
                <div className="text-2xs uppercase tracking-wider text-amber-300/70 font-bold mb-1">
                  Betalende Spillere
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-amber-200">
                  {earnings.paidPlayersCount}
                </div>
                <div className="text-3xs text-amber-300/60 font-medium mt-1">Totalt i spill</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/25 text-center">
                <div className="text-2xs uppercase tracking-wider text-amber-300/70 font-bold mb-1">
                  Transaksjoner
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-amber-200">
                  {earnings.transactionsCount}
                </div>
                <div className="text-3xs text-emerald-400 font-bold mt-1">Fullført</div>
              </div>
            </div>

            {/* Payout Information */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-black/60 to-amber-950/50 border border-emerald-400/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 text-xl font-black shrink-0">
                  🏦
                </div>
                <div>
                  <div className="font-heading font-black text-sm text-emerald-200">
                    Klar til utbetaling: {earnings.totalCommission} NOK
                  </div>
                  <div className="text-2xs text-amber-200/80">
                    Bankkonto for utbetaling: <strong>{settings.bankAccount || 'Oppgitt i Eierpanel'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playLineComplete();
                  setPaymentSuccessMsg(`Utbetalingsforespørsel på ${earnings.totalCommission} kr er registrert til bankkonto ${settings.bankAccount || 'din oppgitte konto'}!`);
                  setTimeout(() => setPaymentSuccessMsg(null), 5000);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow cursor-pointer whitespace-nowrap"
              >
                Be om Utbetaling ➔
              </button>
            </div>

            {/* Transaction Log */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/15">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
                  Siste Innbetalinger & Kommisjoner:
                </span>
                <span className="text-2xs font-mono text-amber-400">
                  {transactions.length} registrert
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-amber-300/50">
                    Ingen transaksjoner registrert ennå.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-black/45 border border-amber-500/15 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-amber-100 truncate">{tx.title}</div>
                        <div className="text-3xs text-amber-300/60 flex items-center gap-2 mt-0.5">
                          <span>{new Date(tx.timestamp).toLocaleDateString('no-NO')}</span>
                          <span>·</span>
                          <span>Fra: {tx.payerName || 'Deltager'}</span>
                          <span>·</span>
                          <span className="uppercase font-mono">{tx.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-amber-300 text-sm">+{tx.commissionAmount} kr</div>
                        <div className="text-3xs text-emerald-400 font-bold uppercase">Kommisjon</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS (PRICES & VIPPS NUMBER) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400/80 block">
                Eierens Betalingsdetaljer (Hvor pengene sendes):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 block mb-1">
                    Vipps-nummer eller Bedriftsnummer:
                  </label>
                  <input
                    type="text"
                    value={editVipps}
                    onChange={(e) => setEditVipps(e.target.value)}
                    placeholder="F.eks. 92000000 eller 6-sifret Vipps..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 block mb-1">
                    Bankkontonummer for utbetaling:
                  </label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    placeholder="1234.56.78901"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400/80 block">
                Priser & Kommisjonssatser:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 block mb-1">
                    Gebyre per spiller (NOK):
                  </label>
                  <input
                    type="number"
                    value={editFeePerPlayer}
                    onChange={(e) => setEditFeePerPlayer(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 block mb-1">
                    Vertspass Helkveld (NOK):
                  </label>
                  <input
                    type="number"
                    value={editEventPassPrice}
                    onChange={(e) => setEditEventPassPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/70 block mb-1">
                    Klubb / Bedrift RIL-Pass (NOK):
                  </label>
                  <input
                    type="number"
                    value={editProPrice}
                    onChange={(e) => setEditProPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs font-bold text-center animate-in fade-in">
                Innstillinger lagret! Eierens Vipps og priser er oppdatert.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all"
              >
                Lagre Innstillinger ➔
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
