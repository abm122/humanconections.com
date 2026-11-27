/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { sessionTimer } from '../services/sessionTimer';
import { monetization } from '../services/monetization';

interface EventTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionExtended?: () => void;
  onOpenVippsPayment?: () => void;
}

export const EventTimeoutModal: React.FC<EventTimeoutModalProps> = ({
  isOpen,
  onClose,
  onOpenVippsPayment,
}) => {
  const [settings, setSettings] = useState(() => monetization.getSettings());

  React.useEffect(() => {
    const unsub = monetization.subscribe(() => {
      setSettings(monetization.getSettings());
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      void monetization.syncFromServer();
      setSettings(monetization.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTrialFinished = sessionTimer.wasLastExpiredTrial();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#2a1309] via-[#1a0f08] to-[#0c0804] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-amber-50">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
          title="Lukk / Tilbake"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400 text-3xl flex items-center justify-center mb-3 shadow-lg">
            {isTrialFinished ? '🎮' : '⏱️'}
          </div>
          <h2 className="font-heading font-black text-2xl text-amber-200">
            {isTrialFinished ? '10 minutter gratis prøvespill er fullført!' : 'Pakketiden er utløpt'}
          </h2>
          <span className="px-3 py-0.5 rounded-full text-xs font-bold mt-1 bg-rose-500/30 text-rose-200">
            Automatisk utlogging utført
          </span>
          <p className="text-xs text-amber-100/90 mt-2 max-w-md leading-relaxed">
            {isTrialFinished
              ? 'Håper du likte å prøve alle spillene! De 10 minuttene med gratis prøvespill er brukt opp og nå skjult. Logg inn på nytt og kjøp spilletid med Visa, Mastercard, Apple Pay eller Google Pay for å fortsette med ubegrensede runder og koblingskode.'
              : 'Den betalte spilletiden for arrangementet er over, og du er logget ut automatisk. For å spille videre i Bingo eller Quiz må du logge inn på nytt og betale en ny spilletidspakke med Visa, Mastercard, Apple Pay eller Google Pay.'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Mandatory Login + Real Stripe Payment */}
          {onOpenVippsPayment && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-heading font-bold text-sm text-emerald-200 flex items-center gap-1.5">
                  <span className="text-base">💳</span>
                  <span>Logg inn & Betal ny spilletid (Stripe)</span>
                </div>
                <div className="text-xs text-amber-200/80 mt-0.5">
                  20 min ({settings.price20MinTrial ?? 19},-), 1t ({settings.price1Hour ?? 49},-), 2t ({settings.price2Hours ?? 89},-) eller helaften · Visa, Mastercard, Pay, GPay
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenVippsPayment();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs cursor-pointer shadow-lg transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <span>Logg inn & Betal ➔</span>
              </button>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-500/40 text-amber-200 hover:text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <span>⇦</span>
              <span>Tilbake til startmenyen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
