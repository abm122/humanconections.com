/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { sounds } from '../audio/soundEngine';
import { GoldenCoinLogo } from './GoldenCoinLogo';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#211409] via-[#1a0f08] to-[#0c0804] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-amber-50">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-300 flex items-center justify-center text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3">
            <GoldenCoinLogo size="lg" showGlow />
            <span className="absolute -bottom-1 -right-1 text-xl">🍎</span>
          </div>

          <h2 className="font-heading font-black text-xl text-amber-200">
            Bruk Human-connection på iPhone & iPad (iOS)
          </h2>
          <p className="text-xs text-amber-200/80 mt-1 max-w-xs">
            Appen fungerer 100% på alle Apple-enheter! For den aller beste opplevelsen i fullskjerm uten nettleserfelt, legg den til på Hjem-skjermen:
          </p>
        </div>

        <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-2xl border border-amber-500/25">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-400/40">
              1
            </div>
            <div className="text-xs text-amber-100">
              <span className="font-bold text-amber-200">Trykk på Del-knappen</span> nederst i Safari på iPhone (eller øverst på iPad):
              <div className="mt-1 flex items-center gap-1.5 font-bold text-amber-300">
                <span className="text-base">⎋</span>
                <span>(Firkant med pil opp)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-amber-500/15">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-400/40">
              2
            </div>
            <div className="text-xs text-amber-100">
              <span className="font-bold text-amber-200">Rull litt ned og velg</span>:
              <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-300">
                <span className="text-base">➕</span>
                <span>«Legg til på Hjem-skjerm» (Add to Home Screen)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-amber-500/15">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-400/40">
              ✓
            </div>
            <div className="text-xs text-amber-100">
              Trykk <span className="font-bold text-white">«Legg til»</span> øverst til høyre. Nå har du Human-connection som en ekte app med det varme klem-symbolet på hjemskjermen!
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black text-sm hover:from-amber-400 hover:to-amber-300 transition-all cursor-pointer shadow-lg"
        >
          Forstått – Fortsett til spillet!
        </button>
      </div>
    </div>
  );
};
