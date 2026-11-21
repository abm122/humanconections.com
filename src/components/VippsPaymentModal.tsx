/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { monetization } from '../services/monetization';
import { authService } from '../services/authService';

interface VippsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHours?: number;
  onPaymentSuccess?: () => void;
  onBackToAuth?: () => void;
}

interface DurationOption {
  minutes: number;
  label: string;
  price: number;
  badge?: string;
}

export const VippsPaymentModal: React.FC<VippsPaymentModalProps> = ({
  isOpen,
  onClose,
  onBackToAuth,
}) => {
  const [monetizationSettings, setMonetizationSettings] = useState(() => monetization.getSettings());
  const currentUser = authService.getCurrentUser();

  React.useEffect(() => {
    const unsub = monetization.subscribe(() => {
      setMonetizationSettings(monetization.getSettings());
    });
    return () => unsub();
  }, []);

  const durationOptions: DurationOption[] = [
    { minutes: 20, label: '20 minutter prøvetid', price: monetizationSettings.price20MinTrial ?? 19, badge: 'Prøv nå' },
    { minutes: 60, label: '1 time', price: monetizationSettings.price1Hour ?? 49 },
    { minutes: 120, label: '2 timer standard arrangementspakke', price: monetizationSettings.price2Hours ?? 89, badge: 'Mest valgt' },
    { minutes: 180, label: '3 timer forlenget arrangementskveld', price: monetizationSettings.price3Hours ?? 129 },
    { minutes: 240, label: '4 timer helaften / turnering', price: monetizationSettings.price4Hours ?? 169 },
    { minutes: 1440, label: 'Hele dagen (24 timer)', price: monetizationSettings.priceFullDay ?? 199, badge: 'Beste verdi' },
  ];

  const [selectedMinutes, setSelectedMinutes] = useState<number>(120);
  const [stripeStatus, setStripeStatus] = useState<{ configured: boolean; isLive: boolean; isTest: boolean; mode: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [stripeLoading, setStripeLoading] = useState<boolean>(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      void monetization.syncFromServer();
      setMonetizationSettings(monetization.getSettings());
      setStatusLoading(true);
      setStripeError(null);
      setStripeCheckoutUrl(null);
      fetch('/api/stripe/status')
        .then((res) => res.json())
        .then((data) => setStripeStatus(data))
        .catch(() => setStripeStatus(null))
        .finally(() => setStatusLoading(false));
    }
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setStripeError(null);
    setStripeCheckoutUrl(null);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sounds.playClick();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const currentOption = durationOptions.find((opt) => opt.minutes === selectedMinutes) || durationOptions[2];

  const handleInitiateStripeCheckout = async () => {
    sounds.playPop(1.1);
    setStripeLoading(true);
    setStripeError(null);
    setStripeCheckoutUrl(null);

    const authenticatedName =
      currentUser.isAuthenticated && currentUser.name && currentUser.name !== 'Gjest'
        ? currentUser.name.trim()
        : undefined;
    const authenticatedEmail =
      currentUser.isAuthenticated && currentUser.email && currentUser.email !== 'kunde@joybingo.no'
        ? currentUser.email.trim()
        : undefined;

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentOption.price,
          minutes: currentOption.minutes,
          packageLabel: currentOption.label,
          payerName: authenticatedName,
          payerEmail: authenticatedEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        const isEmbeddedInIframe = (() => {
          try {
            return window.self !== window.top;
          } catch {
            return true;
          }
        })();

        if (!isEmbeddedInIframe) {
          window.location.href = data.url;
          return;
        }

        // Inside iframe previews (Stripe blocks iframe framing via X-Frame-Options),
        // expose a direct top-level/new-tab link so checkout opens cleanly.
        setStripeCheckoutUrl(data.url);
        return;
      }

      setStripeError(data.error || 'Stripe API-nøkkel er ikke konfigurert av eier ennå.');
    } catch (err: any) {
      setStripeError(err?.message || 'Nettverksfeil ved tilkobling til Stripe.');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div
      onClick={() => {
        sounds.playClick();
        handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1c120c] via-[#140b06] to-[#0c0704] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-amber-50 animate-fadeIn my-auto max-h-[94vh]"
      >

        {/* Secure Checkout Header */}
        <div className="bg-gradient-to-r from-[#24150b] via-[#1a0e07] to-[#24150b] p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg sm:text-xl text-amber-100 tracking-wide">
                  Sikker Utsjekk & Betaling
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  Stripe 3D Secure
                </span>
              </div>
              <div className="text-xs text-amber-300/80 flex items-center gap-2 mt-0.5">
                <span>Visa</span>
                <span>•</span>
                <span>Mastercard</span>
                <span>•</span>
                <span>Apple Pay</span>
                <span>•</span>
                <span>Google Pay</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              handleClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 hover:text-white flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer transition-all border border-amber-500/30 shrink-0"
            title="Avbryt og lukk"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Avbryt</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* Trust Badge Bar */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 flex items-center justify-between text-2xs text-amber-200/80">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-emerald-400">🔒</span>
              <span>Ekte betaling verifisert av Stripe</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-amber-300">
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/40">VISA</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-200 border border-orange-400/40">MC</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">Pay</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">GPay</span>
            </div>
          </div>

          {/* Duration Options */}
          <div>
            <label className="text-xs font-bold text-amber-300 block mb-2">
              Velg spilletid for arrangør (Injoy Together):
            </label>
            <div className="space-y-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMinutes(opt.minutes);
                    setStripeCheckoutUrl(null);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    selectedMinutes === opt.minutes
                      ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-md'
                      : 'bg-black/40 border-amber-500/20 hover:border-amber-400/40 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                        selectedMinutes === opt.minutes
                          ? 'border-amber-400 bg-amber-400 text-slate-950 font-black'
                          : 'border-amber-400/50'
                      }`}
                    >
                      {selectedMinutes === opt.minutes ? '✓' : ''}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-100 flex items-center gap-2">
                        <span>{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-2xs uppercase">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-amber-300/70">
                        {opt.minutes} min arrangørtid · Alle deltakere og barn spiller gratis med kode/lenke
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-sm sm:text-base text-amber-200">
                      {opt.price} kr
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real Money Stripe Checkout Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0e2118] via-[#09150f] to-[#040a07] border-2 border-emerald-400/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                <span className="text-base">⚡</span>
                <span>Stripe Betalingsgateway:</span>
              </div>
              <div>
                {statusLoading ? (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-amber-200 border border-white/20 text-[10px] font-bold">
                    Sjekker...
                  </span>
                ) : stripeStatus?.isLive ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-[10px] font-black animate-pulse">
                    ● LIVE EKTE TREKK
                  </span>
                ) : stripeStatus?.isTest ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 text-[10px] font-black">
                    ● STRIPE TEST-MODUS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500 text-[10px] font-black">
                    ● STRIPE NØKKEL MANGLER
                  </span>
                )}
              </div>
            </div>

            {stripeStatus?.configured ? (
              <>
                {!stripeCheckoutUrl ? (
                  <button
                    type="button"
                    disabled={stripeLoading || statusLoading}
                    onClick={handleInitiateStripeCheckout}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span>🔒</span>
                    <span>
                      {stripeLoading
                        ? 'Klargjør sikker Stripe-utsjekk...'
                        : `Gå til betaling: ${currentOption.price} kr (Visa / Mastercard / Pay / GPay)`}
                    </span>
                    <span>➔</span>
                  </button>
                ) : (
                  <div className="space-y-2 animate-fadeIn">
                    <a
                      href={stripeCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all text-center"
                    >
                      <span>🔒</span>
                      <span>Åpne sikker Stripe-betaling ({currentOption.price} kr) i nytt vindu ↗</span>
                    </a>
                    <p className="text-[11px] text-emerald-200/80 text-center leading-snug">
                      Stripe krever et eget nettleservindu for kort, BankID, Apple Pay og Google Pay. Etter godkjent betaling blir spilletiden aktivert automatisk.
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Kortdetaljer, e-post og 3D Secure / BankID bekreftes direkte hos Stripe før spilletiden åpnes. Ingen kan åpne betalt tid uten ekte godkjent betaling.
                </p>
              </>
            ) : !statusLoading ? (
              <div className="p-3.5 rounded-2xl bg-black/80 border border-rose-500/50 space-y-1.5 text-xs text-amber-100">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Betaling er ikke aktivert på denne serveren ennå</span>
                </div>
                <p className="text-[11px] text-amber-100/85 leading-relaxed">
                  For at kunder skal kunne betale med Visa, Mastercard, Apple Pay eller Google Pay, må eier legge inn <strong>STRIPE_SECRET_KEY</strong> i Hemmeligheter (og publisere/oppdatere appen).
                </p>
              </div>
            ) : null}

            {stripeError && (
              <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/60 text-rose-200 font-bold text-xs animate-fadeIn">
                ⚠️ {stripeError}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions & Info */}
        <div className="p-3 sm:p-4 bg-black/75 border-t border-amber-500/25 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                handleClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>⇦</span>
              <span>Avbryt / Tilbake</span>
            </button>

            {onBackToAuth && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setStripeError(null);
                  setStripeCheckoutUrl(null);
                  onBackToAuth();
                }}
                className="py-2.5 px-4 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-500/30 text-amber-200/90 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>🔑</span>
                <span>Tilbake til innlogging</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-amber-300/60 flex items-center justify-between px-1">
            <span>Injoy Together Sikker Betaling</span>
            <span className="text-emerald-400 font-mono">Stripe · 3D Secure & BankID</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CardPaymentModal = VippsPaymentModal;
export const CheckoutModal = VippsPaymentModal;
