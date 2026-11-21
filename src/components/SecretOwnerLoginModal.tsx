/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { ownerControl } from '../services/ownerControl';
import { authService } from '../services/authService';
import { sessionTimer } from '../services/sessionTimer';

interface SecretOwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SecretOwnerLoginModal: React.FC<SecretOwnerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [verifying, setVerifying] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    const cleanPin = pin.trim();
    setVerifying(true);
    setCloudError(null);
    try {
      const user = await authService.loginWithPinAsync(cleanPin);
      if (user) {
        sounds.playLineComplete();
        ownerControl.unlockAdmin();
        sessionTimer.grantOwnerAccess();
        setError(false);
        setPin('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        sounds.playClick();
        setError(true);
        setAttempts((prev) => prev + 1);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleUnlock = async () => {
    if (cloudLoading) return;
    setCloudLoading(true);
    setCloudError(null);
    sounds.playClick();
    try {
      const res = await ownerControl.signInWithGoogleAdmin(true);
      if (res.success) {
        sounds.playLineComplete();
        ownerControl.unlockAdmin();
        sessionTimer.grantOwnerAccess();
        setError(false);
        setPin('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setCloudError(res.error || 'Kunne ikke logge inn med Google.');
      }
    } finally {
      setCloudLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1c1108] via-[#120a04] to-[#080502] border-2 border-amber-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl text-amber-50 text-center">
        
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/30 flex items-center justify-center text-amber-300 text-sm font-bold cursor-pointer"
          title="Lukk"
        >
          ✕
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-2xl flex items-center justify-center shadow-lg mb-3">
          🔒
        </div>

        <h2 className="font-heading font-black text-xl text-amber-200">
          Hemmelig Eierinnlogging
        </h2>

        <p className="text-xs text-amber-300/80 mt-1 mb-4 leading-relaxed">
          Sikkerhetsadgang for systemeier. Dette panelet er utilgjengelig for publikum.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 text-center">
              Tast inn din Eier-PIN:
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••"
              className="w-full py-3 px-4 rounded-xl bg-black/80 border-2 border-amber-400/60 focus:border-amber-300 text-white font-mono font-black text-center text-2xl tracking-[0.4em] outline-none shadow-inner"
            />
            {error && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-center space-y-1">
                <p className="text-rose-300 text-xs font-bold">
                  ⚠️ Feil PIN-kode ({attempts} forsøk).
                </p>
                <p className="text-[11px] text-amber-200/80 leading-snug">
                  Har appen nettopp blitt oppdatert? Trykk «Logg inn med Google» nedenfor for å hente din lagrede PIN fra Firebase Firestore.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-heading font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
          >
            {verifying ? 'Verifiserer...' : 'Lås opp Eierpanel ➔'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-2">
          <div className="text-[11px] text-amber-200/80 font-semibold">
            Etter app-oppdatering eller på ny enhet:
          </div>
          <button
            type="button"
            disabled={cloudLoading}
            onClick={() => void handleGoogleUnlock()}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/50 text-emerald-200 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>☁️</span>
            <span>
              {cloudLoading
                ? 'Henter sky-PIN fra Google...'
                : 'Logg inn med Google (Eier) & hent sky-PIN'}
            </span>
          </button>
          {cloudError && (
            <div className="text-[11px] text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl p-2 font-semibold">
              ⚠️ {cloudError}
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-amber-500/15 text-[10px] text-amber-400/60 text-center">
          Hemmelig snarvei: Trykk 5 ganger på klem-logoen eller Shift+E på tastaturet.
        </div>
      </div>
    </div>
  );
};
