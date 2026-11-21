/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../audio/soundEngine';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerNames: string[];
  onUpdatePlayerNames: (names: string[]) => void;
}

const DEFAULT_AVATARS = ['🌸', '⭐', '🦁', '🚀', '🎨', '🦊', '👑', '🌈', '🎸', '⚽', '🧁', '🐬'];

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  playerNames,
  onUpdatePlayerNames,
}) => {
  const [newName, setNewName] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    sounds.playClick();
    onUpdatePlayerNames([...playerNames, trimmed]);
    setNewName('');
  };

  const handleRemovePlayer = (idx: number) => {
    sounds.playClick();
    if (playerNames.length <= 1) return;
    const updated = playerNames.filter((_, i) => i !== idx);
    onUpdatePlayerNames(updated);
  };

  const handleStartEditing = (idx: number, current: string) => {
    sounds.playClick();
    setEditingIdx(idx);
    setEditingName(current);
  };

  const handleSaveEdit = (idx: number) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingIdx(null);
      return;
    }
    sounds.playClick();
    const updated = [...playerNames];
    updated[idx] = trimmed;
    onUpdatePlayerNames(updated);
    setEditingIdx(null);
  };

  const handleSetQuickCount = (count: number) => {
    sounds.playClick();
    const updated = [...playerNames];
    if (count > updated.length) {
      for (let i = updated.length; i < count; i++) {
        updated.push(`Spiller ${i + 1}`);
      }
    } else if (count < updated.length) {
      updated.length = count;
    }
    onUpdatePlayerNames(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1c1108] via-[#140b05] to-black border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/20">
              👥
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-amber-200">
                Deltakere & Antall
              </h2>
              <p className="text-xs text-amber-300/80">
                {playerNames.length} {playerNames.length === 1 ? 'deltaker' : 'deltakere'} registrert for runden
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-amber-300 hover:text-white hover:bg-amber-900/40 cursor-pointer transition-all"
            title="Lukk deltakere"
          >
            ✕
          </button>
        </div>

        {/* Quick Count Selector */}
        <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Hurtigvalg antall deltakere:
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {playerNames.length} aktive
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 4, 6, 8, 12, 16, 20, 30, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSetQuickCount(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  playerNames.length === num
                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white shadow-md'
                    : 'bg-amber-950/60 border border-amber-500/30 text-amber-200/80 hover:bg-amber-900/60 hover:text-white'
                }`}
              >
                {num} {num === 1 ? 'spiller' : 'spillere'}
              </button>
            ))}
          </div>
        </div>

        {/* Add New Participant Form */}
        <form onSubmit={handleAddPlayer} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Navn på ny spiller eller lag (f.eks: 'Kari' eller 'Lag Blå')..."
            className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-500/40 text-xs sm:text-sm outline-none focus:border-amber-300"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-heading font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+ Legg til</span>
          </button>
        </form>

        {/* Participant List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-amber-300">
              Registrerte Spillere ({playerNames.length}):
            </h3>
            <span className="text-2xs text-amber-300/60">Trykk ✎ for å endre navn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {playerNames.map((name, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length]}
                  </span>

                  {editingIdx === idx ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx)}
                        className="px-2 py-1 rounded bg-black border border-amber-400 text-xs text-white outline-none w-full"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-2xs font-bold cursor-pointer"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-amber-100 truncate">
                      {name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {editingIdx !== idx && (
                    <button
                      type="button"
                      onClick={() => handleStartEditing(idx, name)}
                      className="p-1 rounded text-amber-400/80 hover:text-amber-200 text-2xs cursor-pointer"
                      title="Rediger navn"
                    >
                      ✎
                    </button>
                  )}
                  {playerNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      className="p-1 rounded text-rose-400/80 hover:text-rose-200 text-2xs cursor-pointer"
                      title="Fjern spiller"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
          <div className="text-2xs text-amber-300/70">
            Endringer oppdateres automatisk for neste bingorunde.
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-heading font-black text-xs cursor-pointer shadow-md transition-all"
          >
            Ferdig ✓
          </button>
        </div>
      </div>
    </div>
  );
};
