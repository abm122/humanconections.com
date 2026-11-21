/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sounds } from '../audio/soundEngine';
import { sessionTimer } from '../services/sessionTimer';
import { authService } from '../services/authService';
import {
  ADULT_QUIZ_QUESTIONS,
  CHRISTMAS_MIME_CARDS,
  CHRISTMAS_QUIZ_QUESTIONS,
  FAMILY_QUIZ_QUESTIONS,
} from '../data/quizQuestions';

interface GameModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOwnerControl?: () => void;
  onSelectBigScreen: () => void;
  onSelectRemoteBingo: () => void;
  onSelectAdultQuiz?: () => void;
  onSelectFamilyQuiz?: () => void;
  onSelectChristmasQuiz?: () => void;
  onSelectMemory?: () => void;
  onSelectClassicBoard: () => void;
}

export const GameModeSelectorModal: React.FC<GameModeSelectorModalProps> = ({
  isOpen,
  onClose,
  onOpenOwnerControl,
  onSelectBigScreen,
  onSelectRemoteBingo,
  onSelectAdultQuiz,
  onSelectFamilyQuiz,
  onSelectChristmasQuiz,
  onSelectMemory,
  onSelectClassicBoard,
}) => {
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const currentUser = authService.getCurrentUser();
  const isOwner = authService.isOwnerAuthenticated();

  useEffect(() => {
    const unsub = sessionTimer.subscribe(() => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-[#1b1109] via-[#120a05] to-[#0a0502] border-2 border-amber-400 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-amber-50 my-auto max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2a170b] via-[#1c0f06] to-[#2a170b] p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-2 ring-white/20 shrink-0">
              🎉
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base sm:text-xl text-white tracking-wide">
                  Velg Spill for Arrangementet (6 Valgalternativer)
                </h3>
              </div>
              <p className="text-2xs sm:text-xs text-amber-200/80 mt-0.5">
                Innlogget som <strong>{currentUser.name || 'Arrangør'}</strong> · Én betaling gir fri veksling mellom alle spill!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && onOpenOwnerControl && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenOwnerControl();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:brightness-110 transition-all flex items-center gap-1"
              >
                <span>👑</span>
                <span>Eierpanel</span>
              </button>
            )}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 text-amber-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-all border border-amber-500/30"
              title="Lukk"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left">
          
          {/* Active Spilletid Status Strip */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-black/60 to-emerald-950/80 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-bold text-emerald-200">
              Aktiv spilletid gjelder for alle 6 spillene:
            </div>
            <div className="font-mono tabular-nums font-black text-base sm:text-lg text-emerald-300">
              {sessionRemaining}
            </div>
          </div>

          <div className="text-xs font-bold text-amber-300">
            Velg spill (du kan gå fritt frem og tilbake innenfor betalt tid):
          </div>

          {/* 6 Main Game Choices + Classic Table (1-col Mobile, 2-col PC/TV) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            
            {/* OPTION 1: STORSKJERM BINGO */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#241508] to-black/80 border-2 border-amber-500/50 hover:border-amber-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center text-2xl shrink-0">
                  📺
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm sm:text-base text-amber-100">
                    1. Storskjerm Bingo
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                    Projektor / TV · 3D-trommel, kuleoppleser, stor talltavle, musikk og vinnerfeiringer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectBigScreen();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Åpne Storskjerm</span>
                <span>➔</span>
              </button>
            </div>

            {/* OPTION 2: AVSTANDSBINGO */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c1f1b] to-black/80 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center text-2xl shrink-0">
                  📡
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm sm:text-base text-cyan-100">
                    2. Avstandsbingo (Online / Hybrid)
                  </h4>
                  <p className="text-xs text-cyan-100/80 mt-0.5 leading-relaxed">
                    Mobil for deltakere · Spill sammen på avstand med romkode, digitale brett og BINGO-rop.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectRemoteBingo();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Åpne Vertspanel</span>
                <span>➔</span>
              </button>
            </div>

            {/* OPTION 3: QUIZ — KULTUR- & MUSIKKQUIZ */}
            {onSelectAdultQuiz && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#24132b] to-black/80 border-2 border-purple-500/50 hover:border-purple-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/50 text-purple-200 flex items-center justify-center text-2xl shrink-0">
                    🎭
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm sm:text-base text-purple-100">
                      3. QUIZ — Kultur-, Musikk- & Fanquiz
                    </h4>
                    <p className="text-xs text-purple-100/80 mt-0.5 leading-relaxed">
                      {ADULT_QUIZ_QUESTIONS.length} spørsmål (200 A–D + 100 Skriv-svar i tilfeldig rekkefølge uten gjentakelser) · Kun voksenquiz-spørsmål · Lagspill · 60 sek svartid · Arrangør styrer med fasit og koblingskode.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onSelectAdultQuiz();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-fuchsia-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Start QUIZ</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            {/* OPTION 4: FAMILIE- & BARNEQUIZ */}
            {onSelectFamilyQuiz && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#102618] to-black/80 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 flex items-center justify-center text-2xl shrink-0">
                    🎈
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm sm:text-base text-emerald-100">
                      4. Familie- & Barnequiz (Kultur, Musikk & Ordlek)
                    </h4>
                    <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
                      {FAMILY_QUIZ_QUESTIONS.length} spørsmål (200 A–D + 100 Skriv-svar i tilfeldig rekkefølge uten gjentakelser) · Kun familie- & barnespørsmål · Lagspill · 60 sek svartid · Storskjerm + mobil per lag.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onSelectFamilyQuiz();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Start Familiequiz</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            {/* OPTION 5: JULEQUIZ */}
            {onSelectChristmasQuiz && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2c0d14] via-[#1a0a0d] to-black/80 border-2 border-rose-500/60 hover:border-rose-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 flex items-center justify-center text-2xl shrink-0">
                    🎄
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm sm:text-base text-rose-100">
                      5. JuleQuiz — Katolsk Familiequiz & {CHRISTMAS_MIME_CARDS.length} Mimelek
                    </h4>
                    <p className="text-xs text-rose-100/80 mt-0.5 leading-relaxed">
                      {CHRISTMAS_QUIZ_QUESTIONS.length} katolske julespørsmål (200 A–D + 100 Skriv-svar i tilfeldig rekkefølge uten gjentakelser) + {CHRISTMAS_MIME_CARDS.length} katolske Mimelek-ord i lag · 60 sek svartid.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onSelectChristmasQuiz();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Start JuleQuiz</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            {/* OPTION 6: MEMORY */}
            {onSelectMemory && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0e2038] via-[#0c182c] to-black/80 border-2 border-sky-400/60 hover:border-sky-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/50 text-sky-200 flex items-center justify-center text-2xl shrink-0">
                    🧩
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm sm:text-base text-sky-100">
                      6. Memory
                    </h4>
                    <p className="text-xs text-sky-100/80 mt-0.5 leading-relaxed">
                      30 berøringskort (15 par) med dyr, figurer og ting for barn · Arrangør starter spillet, viser kort i 10 sek, blander kort, gir + / - poeng og bestemmer premie selv.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                    onSelectMemory();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Start Memory</span>
                  <span>➔</span>
                </button>
              </div>
            )}

            {/* CLASSIC BOARD OPTION */}
            <div className="lg:col-span-2 p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 hover:border-amber-400/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 flex items-center justify-center text-xl shrink-0">
                  🎲
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-amber-100">
                    Klassisk Vertsbord & Fellesoppleser (1–6 Brett)
                  </h4>
                  <p className="text-[11px] text-amber-200/75 mt-0.5">
                    Tradisjonelt bingobord på denne enheten med kulemikser og vinnerrekker.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectClassicBoard();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100 font-bold text-xs shrink-0 cursor-pointer transition-all whitespace-nowrap"
              >
                Start Bordspill ➔
              </button>
            </div>
          </div>

          {/* Peace of Mind Reassurance Box */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 text-2xs text-amber-200/90 leading-relaxed space-y-1">
            <div className="font-bold text-amber-300">
              💡 Én betaling dekker alle 6 spillene!
            </div>
            <p>
              Man betaler én pakke og går fritt frem og tilbake mellom <strong>Storskjerm Bingo</strong>, <strong>Avstandsbingo</strong>, <strong>QUIZ</strong>, <strong>Familie- & Barnequiz</strong>, <strong>JuleQuiz</strong> og <strong>Memory</strong> innenfor samme aktive spilletid ({sessionRemaining}).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-amber-500/20 text-center text-2xs text-amber-300/60 flex items-center justify-between px-5">
          <span>Human-connection · Enjoy Bingo · Enjoy Together</span>
          <span className="text-emerald-400 font-mono">1 Betaling · Alle 6 Spill</span>
        </div>
      </div>
    </div>
  );
};
