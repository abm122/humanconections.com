/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  dailySchedule,
  OWNER_REWARD_PRESETS,
  STAR_REWARD_TARGET,
  StarRewardRecord,
  ScheduleParticipant,
  PARTICIPANT_COLORS,
} from '../services/schedule';
import { progression } from '../services/progression';
import { sounds } from '../audio/soundEngine';

interface StarRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  starData: StarRewardRecord & { currentCompleted: number };
  onCelebrate?: () => void;
  targetParticipant?: ScheduleParticipant | null;
}

export const StarRewardModal: React.FC<StarRewardModalProps> = ({
  isOpen,
  onClose,
  starData,
  onCelebrate,
  targetParticipant,
}) => {
  const participants = dailySchedule.getParticipants();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    targetParticipant?.id || participants[0]?.id || ''
  );
  const activeParticipant = participants.find((p) => p.id === selectedParticipantId) || targetParticipant || participants[0];

  const [recipient, setRecipient] = useState(
    targetParticipant ? targetParticipant.name : starData.recipientName || participants[0]?.name || 'Dagens Innsatshelt'
  );
  const [awardedBy, setAwardedBy] = useState(starData.awardedBy || 'Forelder / Eier');
  const [selectedPresetId, setSelectedPresetId] = useState(OWNER_REWARD_PRESETS[0].id);
  const [customRewardText, setCustomRewardText] = useState('');
  const [customNote, setCustomNote] = useState(starData.customNote || 'Fantastisk innsats med 15 fullførte oppgaver i dag!');
  const [showCertificateView, setShowCertificateView] = useState(starData.isClaimed);

  useEffect(() => {
    if (targetParticipant) {
      setSelectedParticipantId(targetParticipant.id);
      setRecipient(targetParticipant.name);
    }
  }, [targetParticipant]);

  if (!isOpen) return null;

  const isUnlocked = starData.currentCompleted >= STAR_REWARD_TARGET;
  const progressRatio = Math.min(1, starData.currentCompleted / STAR_REWARD_TARGET);

  const selectedPreset = OWNER_REWARD_PRESETS.find((p) => p.id === selectedPresetId) || OWNER_REWARD_PRESETS[0];

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) return;

    sounds.playBingoWin();
    const finalRewardTitle =
      selectedPresetId === 'egendefinert' && customRewardText.trim()
        ? `✨ ${customRewardText.trim()}`
        : selectedPreset.title;

    const res = dailySchedule.claimStarReward(
      recipient,
      awardedBy,
      finalRewardTitle,
      customNote
    );

    if (res.success) {
      progression.addPoints(res.bonusSparks, `🌟 Dagens Stjerne-Belønning: 15 fullførte oppgaver!`);
      setShowCertificateView(true);
      if (onCelebrate) onCelebrate();
    }
  };

  const handlePrintCertificate = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="printable-schedule relative w-full max-w-2xl bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400/50 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 flex flex-col gap-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              ⭐
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-serif tracking-tight flex items-center gap-2">
                <span>Stjerne-Eier Belønning</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 font-sans font-bold">
                  15 Oppgaver / Dag
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Eierens hedersbelønning til den som fullfører minst 15 gjøremål i dagsplanen!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Lukk"
          >
            ✕
          </button>
        </div>

        {/* 1. Progress Banner (if under 15 tasks) */}
        {!isUnlocked && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Dagens fremgang mot Stjernen:</span>
              <span className="font-bold text-amber-300">
                {starData.currentCompleted} av {STAR_REWARD_TARGET} oppgaver fullført
              </span>
            </div>

            {/* Star progress track */}
            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>

            {/* Glowing stars row */}
            <div className="flex justify-between px-1 text-sm">
              {Array.from({ length: 15 }, (_, i) => (
                <span
                  key={i}
                  className={`transition-all ${
                    i < starData.currentCompleted
                      ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                      : 'text-slate-600 opacity-40'
                  }`}
                  title={`Oppgave ${i + 1}`}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                Fullfør <strong>{STAR_REWARD_TARGET - starData.currentCompleted} flere oppgaver</strong> i dagsplanen i dag for å låse opp eierens gullstjerne-diplom, +300 Sparks og en valgfri belønning!
              </span>
            </div>
          </div>
        )}

        {/* 2. Certificate View (Shown when claimed or viewing certificate) */}
        {showCertificateView ? (
          <div className="flex flex-col gap-4">
            {/* The Official Star Diploma Card */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-50 via-amber-100 to-amber-50 text-slate-950 border-4 border-amber-600 shadow-2xl flex flex-col items-center text-center">
              {/* Ornamental border outline */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-500/60 rounded-xl pointer-events-none" />

              <div className="text-4xl mb-1 filter drop-shadow">⭐ 🏆 ⭐</div>
              
              <div className="text-[11px] uppercase tracking-widest font-black text-amber-800 mb-1">
                Offisielt Hederstegn & Stjernebevis
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black font-serif text-amber-950 mb-2">
                GULLSTJERNE-DIPLOM
              </h3>
              
              <p className="text-xs text-amber-900/80 mb-3 max-w-md">
                Tildeles herved med ære og beundring til:
              </p>

              <div className="flex items-center gap-2 mb-3">
                {activeParticipant && (
                  <span className="text-3xl filter drop-shadow">
                    {activeParticipant.avatar}
                  </span>
                )}
                <div className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-950 px-6 py-1.5 border-b-2 border-amber-600 bg-amber-200/50 rounded-lg">
                  {starData.recipientName || recipient}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed max-w-lg mb-4">
                for å ha utvist strålende pågangsmot og strukturert gjennomført{' '}
                <strong>15 gode gjøremål og oppgaver</strong> i dagsplanen!
              </p>

              {/* Awarded Perk Box */}
              <div className="w-full max-w-md p-3.5 rounded-xl bg-amber-200/70 border border-amber-400 text-amber-950 mb-4 shadow-inner">
                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800 mb-0.5">
                  Avtalt belønning fra eieren:
                </div>
                <div className="text-base font-black flex items-center justify-center gap-2">
                  <span>{starData.chosenRewardTitle}</span>
                </div>
                {starData.customNote && (
                  <div className="text-xs italic text-amber-900 mt-1">
                    "{starData.customNote}"
                  </div>
                )}
              </div>

              {/* Signatures & Date */}
              <div className="w-full max-w-md flex items-center justify-between pt-3 border-t border-amber-400/60 text-xs text-amber-900 font-serif">
                <div className="text-left">
                  <div className="font-bold text-[10px] uppercase text-amber-800">Utdelt av eier:</div>
                  <div className="font-bold text-sm italic">{starData.awardedBy || awardedBy}</div>
                </div>

                <div className="text-2xl">🌟</div>

                <div className="text-right">
                  <div className="font-bold text-[10px] uppercase text-amber-800">Dato & tid:</div>
                  <div className="font-bold">{starData.claimedAt ? `I dag, kl. ${starData.claimedAt}` : 'I dag'}</div>
                </div>
              </div>
            </div>

            {/* Actions for Certificate */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setShowCertificateView(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                ✏️ Endre belønning / Oppdater
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Skriv ut diplom</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 3. Award Configuration Form (Available when unlocked) */
          isUnlocked && (
            <form onSubmit={handleClaim} className="flex flex-col gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-bold text-amber-300 text-sm">
                    Målet er nådd! 15 oppgaver fullført i dag!
                  </div>
                  <div>
                    Som eier / forelder / vert kan du nå tildele dagens stjernebelønning og gi +300 Joy Sparks.
                  </div>
                </div>
              </div>

              {/* Recipient & Awarded By inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    Hvem mottar stjernen? (Velg deltager eller skriv navn)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {participants.map((p) => {
                      const cDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
                      const isSelected = selectedParticipantId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedParticipantId(p.id);
                            setRecipient(p.name);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? `${cDef.badgeClass} ring-2 ${cDef.ringClass}`
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{p.avatar}</span>
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="F.eks. Oliver, Emma, Mamma..."
                    required
                    maxLength={35}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    Hvem tildeler belønningen? (Eier / Vert)
                  </label>
                  <input
                    type="text"
                    value={awardedBy}
                    onChange={(e) => setAwardedBy(e.target.value)}
                    placeholder="F.eks. Mamma & Pappa, Spillvert..."
                    required
                    maxLength={35}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>
              </div>

              {/* Reward Choice Grid */}
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1.5">
                  Hva skal eieren gi i belønning for 15 oppgaver?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {OWNER_REWARD_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedPresetId(preset.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xl shrink-0">{preset.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight">{preset.title}</span>
                          <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {preset.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom reward input if selected */}
              {selectedPresetId === 'egendefinert' && (
                <div>
                  <label className="text-xs font-bold text-amber-200 block mb-1">
                    Skriv inn din egen stjerne-belønning:
                  </label>
                  <input
                    type="text"
                    value={customRewardText}
                    onChange={(e) => setCustomRewardText(e.target.value)}
                    placeholder="F.eks. Tur til Tusenfryd, overnatte hos besteforeldre, ny fotball..."
                    maxLength={60}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400 text-sm text-slate-100 focus:outline-none font-semibold"
                  />
                </div>
              )}

              {/* Encouragement Note */}
              <div>
                <label className="text-xs font-bold text-amber-200 block mb-1">
                  Hyggelig hilsen på diplomet (valgfritt):
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="F.eks. Superbra jobbet! Du er en ekte stjerne i dag!"
                  maxLength={90}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <span>🌟</span>
                  <span>Tildel Stjerne & Lag Diplom (+300 Sparks!)</span>
                </button>
              </div>
            </form>
          )
        )}

      </div>
    </div>
  );
};
