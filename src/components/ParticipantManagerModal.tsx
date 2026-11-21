/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  dailySchedule,
  ScheduleParticipant,
  ParticipantColorId,
  PARTICIPANT_COLORS,
  STAR_REWARD_TARGET,
} from '../services/schedule';
import { moderation } from '../services/moderation';
import { sounds } from '../audio/soundEngine';

interface ParticipantManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRewardCandidate?: (participant: ScheduleParticipant) => void;
}

const AVATAR_OPTIONS = [
  '🌸', '🚀', '🦁', '⭐', '⚽', '🎨', '🦊', '👑',
  '🦄', '🎸', '🏀', '🧁', '🐶', '🐱', '🐬', '🌈',
  '🚴', '🎮', '📚', '🌻'
];

export const ParticipantManagerModal: React.FC<ParticipantManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectRewardCandidate,
}) => {
  const [participants, setParticipants] = useState<ScheduleParticipant[]>(dailySchedule.getParticipants());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🌸');
  const [colorId, setColorId] = useState<ParticipantColorId>('rose');
  const [role, setRole] = useState('Deltager');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick manual add states
  const [quickName, setQuickName] = useState('');
  const [quickAvatar, setQuickAvatar] = useState('🌸');
  const [quickColor, setQuickColor] = useState<ParticipantColorId>('emerald');
  const [quickError, setQuickError] = useState<string | null>(null);

  // Inline name editing states
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  if (!isOpen) return null;

  const rewardStatuses = dailySchedule.getWhoDeservesReward();

  const handleOpenAdd = () => {
    sounds.playClick();
    setName('');
    const usedColors = participants.map((p) => p.colorId);
    const availableColor = (Object.keys(PARTICIPANT_COLORS) as ParticipantColorId[]).find(
      (c) => !usedColors.includes(c)
    ) || 'emerald';

    setColorId(availableColor);
    setAvatar(AVATAR_OPTIONS[(participants.length * 3) % AVATAR_OPTIONS.length]);
    setRole('Deltager');
    setErrorMsg(null);
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (p: ScheduleParticipant) => {
    sounds.playClick();
    setName(p.name);
    setAvatar(p.avatar);
    setColorId(p.colorId);
    setRole(p.role || 'Deltager');
    setErrorMsg(null);
    setEditingId(p.id);
    setIsAdding(true);
  };

  // Quick manual name addition
  const handleQuickAddName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickName.trim();
    if (!trimmed) {
      setQuickError('Vennligst skriv inn et navn først');
      return;
    }

    const modResult = moderation.filterText(trimmed);
    if (modResult.hasBannedWords) {
      setQuickError('Vennligst bruk et hyggelig og passende navn');
      return;
    }

    sounds.playClick();
    dailySchedule.addParticipant(modResult.cleanText, quickAvatar, quickColor, 'Deltager');
    setParticipants(dailySchedule.getParticipants());
    setQuickName('');
    setQuickError(null);
    
    // Cycle avatar and color for next quick add
    const nextIdx = (AVATAR_OPTIONS.indexOf(quickAvatar) + 1) % AVATAR_OPTIONS.length;
    setQuickAvatar(AVATAR_OPTIONS[nextIdx]);
    const colorKeys = Object.keys(PARTICIPANT_COLORS) as ParticipantColorId[];
    const nextColorIdx = (colorKeys.indexOf(quickColor) + 1) % colorKeys.length;
    setQuickColor(colorKeys[nextColorIdx]);
  };

  // Inline fast name editing
  const handleStartInlineEdit = (p: ScheduleParticipant) => {
    sounds.playClick();
    setInlineEditingId(p.id);
    setInlineName(p.name);
    setInlineError(null);
  };

  const handleSaveInlineName = (id: string) => {
    const trimmed = inlineName.trim();
    if (!trimmed) {
      setInlineError('Navnet kan ikke være tomt');
      return;
    }

    const modResult = moderation.filterText(trimmed);
    if (modResult.hasBannedWords) {
      setInlineError('Vennligst bruk et passende navn');
      return;
    }

    sounds.playClick();
    dailySchedule.updateParticipant(id, { name: modResult.cleanText });
    setParticipants(dailySchedule.getParticipants());
    setInlineEditingId(null);
    setInlineName('');
    setInlineError(null);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Vennligst oppgi et navn');
      return;
    }

    const modResult = moderation.filterText(trimmed);
    if (modResult.hasBannedWords) {
      setErrorMsg('Vennligst bruk et hyggelig og passende navn');
      return;
    }

    sounds.playClick();

    if (editingId) {
      dailySchedule.updateParticipant(editingId, {
        name: modResult.cleanText,
        avatar,
        colorId,
        role,
      });
    } else {
      dailySchedule.addParticipant(modResult.cleanText, avatar, colorId, role);
    }

    setParticipants(dailySchedule.getParticipants());
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string, pName: string) => {
    if (participants.length <= 1) {
      alert('Du må ha minst én registrert deltager i dagsplanen.');
      return;
    }

    if (window.confirm(`Er du sikker på at du vil fjerne ${pName}?`)) {
      sounds.playClick();
      dailySchedule.deleteParticipant(id);
      setParticipants(dailySchedule.getParticipants());
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-amber-500/20 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner">
              👥
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-serif tracking-tight flex items-center gap-2">
                <span>Deltagere & Farger</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 font-sans font-bold">
                  {participants.length} {participants.length === 1 ? 'deltager' : 'deltagere'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Administrer hvem som deltar, tildel egne farger og se hvem som fortjener stjernebelønning!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>➕</span>
                <span>Legg til deltager</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Lukk"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Quick Manual Name Addition Bar */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>➕</span>
                <span>Legg til navn manuelt:</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Skriv inn et navn her for å legge til direkte
              </span>
            </div>

            <form onSubmit={handleQuickAddName} className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Skriv inn navn manuelt (f.eks. Emma, Oliver, Pappa...)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Avatar Picker Select */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 shrink-0">
                <span className="text-sm">{quickAvatar}</span>
                <select
                  value={quickAvatar}
                  onChange={(e) => setQuickAvatar(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 cursor-pointer outline-none"
                  title="Velg avatar-ikon"
                >
                  {AVATAR_OPTIONS.map((av) => (
                    <option key={av} value={av} className="bg-slate-900 text-slate-100">
                      {av}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Picker Select */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: PARTICIPANT_COLORS[quickColor]?.hex || '#10b981' }}
                />
                <select
                  value={quickColor}
                  onChange={(e) => setQuickColor(e.target.value as ParticipantColorId)}
                  className="bg-transparent text-xs text-slate-200 font-semibold cursor-pointer outline-none"
                  title="Velg deltagerfarge"
                >
                  {(Object.keys(PARTICIPANT_COLORS) as ParticipantColorId[]).map((cKey) => (
                    <option key={cKey} value={cKey} className="bg-slate-900 text-slate-100">
                      {PARTICIPANT_COLORS[cKey].name.split('/')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>Legg til</span>
              </button>
            </form>

            {quickError && (
              <div className="mt-2 text-xs text-rose-300 font-medium">
                ⚠️ {quickError}
              </div>
            )}
          </div>

          {/* Add / Edit Form Modal inside */}
          {isAdding && (
            <form onSubmit={handleSaveParticipant} className="p-5 rounded-2xl bg-slate-950/80 border-2 border-amber-400/50 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <span>{editingId ? '✏️ Rediger deltagerdetaljer' : '➕ Ny deltager'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Avbryt
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Navn / Kallenavn:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="F.eks. Emma, Oliver, Pappa..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 text-sm outline-none transition-all"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Rolle / Tittel (valgfritt):
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="F.eks. Deltager, Elev, Storebror..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Velg Ikon / Avatar:
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                        avatar === av
                          ? 'bg-amber-400 text-slate-950 scale-110 shadow-md ring-2 ring-amber-300'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Velg Deltagerfarge (Lag farger for deltagere):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(PARTICIPANT_COLORS) as ParticipantColorId[]).map((cKey) => {
                    const cDef = PARTICIPANT_COLORS[cKey];
                    const isSelected = colorId === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setColorId(cKey)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? `${cDef.bgClass} ${cDef.borderClass} ring-2 ${cDef.ringClass} shadow-md`
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cDef.hex }}
                        />
                        <span className={`text-xs font-bold truncate ${isSelected ? cDef.textClass : 'text-slate-300'}`}>
                          {cDef.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Forhåndsvisning:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                      PARTICIPANT_COLORS[colorId].badgeClass
                    }`}
                  >
                    <span>{avatar}</span>
                    <span>{name || 'Navn'}</span>
                    <span className="text-[10px] opacity-75">({role})</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md cursor-pointer"
                  >
                    Lagre deltager
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Participant Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Registrerte Deltagere ({participants.length})</span>
              <span className="text-amber-400">Stjerne-Mål: 15 oppgaver/dag</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participants.map((p) => {
                const cDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
                const status = rewardStatuses.find((s) => s.participant.id === p.id);
                const count = status ? status.todayCompletedCount : 0;
                const isDeserving = count >= STAR_REWARD_TARGET;
                const pct = Math.min(100, Math.round((count / STAR_REWARD_TARGET) * 100));
                const isInlineEditing = inlineEditingId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                      isDeserving
                        ? 'border-amber-400 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 shadow-amber-500/20'
                        : `${cDef.borderClass} bg-slate-900/80`
                    }`}
                  >
                    {/* Top Identity Row */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border shrink-0"
                            style={{
                              backgroundColor: `${cDef.hex}25`,
                              borderColor: `${cDef.hex}50`,
                            }}
                          >
                            {p.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isInlineEditing ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={inlineName}
                                    onChange={(e) => setInlineName(e.target.value)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-950 border-2 border-amber-400 text-slate-100 text-sm font-bold focus:outline-none w-full max-w-[170px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineName(p.id);
                                      if (e.key === 'Escape') setInlineEditingId(null);
                                    }}
                                    placeholder="Rediger navn..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineName(p.id)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                                    title="Lagre navn"
                                  >
                                    Lagre
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineEditingId(null)}
                                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                                    title="Avbryt"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {inlineError && (
                                  <span className="text-[10px] text-rose-300 block">{inlineError}</span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-base text-slate-100 truncate">{p.name}</h4>
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: cDef.hex }}
                                    title={`Farge: ${cDef.name}`}
                                  />
                                  <button
                                    onClick={() => handleStartInlineEdit(p)}
                                    className="text-xs text-amber-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 font-semibold cursor-pointer"
                                    title="Rediger navnet direkte"
                                  >
                                    ✏️ Rediger
                                  </button>
                                </div>
                                <span className="text-xs text-slate-400">{p.role || 'Deltager'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Edit / Delete actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all text-xs cursor-pointer"
                            title="Endre alle detaljer (farge, ikon, rolle)"
                          >
                            ⚙️
                          </button>
                          {participants.length > 1 && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all text-xs cursor-pointer"
                              title="Fjern deltager"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress to Star Reward (15 tasks) */}
                      <div className="space-y-1.5 my-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">Oppgaver i dag:</span>
                          <span className="font-bold font-mono">
                            <span className={count > 0 ? cDef.textClass : 'text-slate-400'}>{count}</span>
                            <span className="text-slate-500"> / {STAR_REWARD_TARGET}</span>
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isDeserving ? '#fbbf24' : cDef.hex,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status / Reward Qualification */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
                      {isDeserving ? (
                        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black animate-pulse">
                          <span>🌟</span>
                          <span>Fortjener Belønning!</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          <span>{STAR_REWARD_TARGET - count} oppgaver igjen til stjerne</span>
                        </div>
                      )}

                      {onSelectRewardCandidate && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onSelectRewardCandidate(p);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isDeserving
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300'
                              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-200'
                          }`}
                        >
                          <span>⭐</span>
                          <span>{isDeserving ? 'Tildel Stjerne' : 'Se Belønning'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Alle oppgaver som utføres registreres med deltagerens unike farge og navn.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Ferdig
          </button>
        </div>
      </div>
    </div>
  );
};
