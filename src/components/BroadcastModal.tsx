/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ownerControl, SystemAnnouncement } from '../services/ownerControl';
import { authService } from '../services/authService';
import { sounds } from '../audio/soundEngine';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MESSAGES = [
  { text: '☕ Kaffepause i 5 minutter – strekk på beina og hent kaffe!', icon: '☕', type: 'pause' as const },
  { text: '🎉 Gjør dere klare, neste bingorunde starter nå!', icon: '🎉', type: 'celebration' as const },
  { text: '🎵 Allsang og musikkpause – syng med av full hals!', icon: '🎵', type: 'info' as const },
  { text: '⭐ Noen i salen mangler kun 1 tall for BINGO!', icon: '⭐', type: 'alert' as const },
  { text: '❤️ Gratulerer til vinneren og fantastisk lagånd fra alle!', icon: '❤️', type: 'celebration' as const },
  { text: '📢 Velkommen til alle nye spillere som har koblet seg på!', icon: '📢', type: 'info' as const },
];

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(ownerControl.getAnnouncements());
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SystemAnnouncement['type']>('info');
  const [sentSuccess, setSentSuccess] = useState(false);

  const authUser = authService.getCurrentUser();
  const authorName = authUser.isAuthenticated
    ? `${authUser.name} (${authUser.role === 'owner' ? 'Eier' : authUser.role === 'host' ? 'Vert' : 'Spiller'})`
    : 'Bingovert';

  useEffect(() => {
    const unsub = ownerControl.subscribe(() => {
      setAnnouncements(ownerControl.getAnnouncements());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    sounds.playLineComplete();
    ownerControl.broadcastMessage(message.trim(), type, authorName);
    setMessage('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleApplyPreset = (preset: typeof PRESET_MESSAGES[0]) => {
    sounds.playClick();
    setMessage(preset.text);
    setType(preset.type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1b1008] via-[#140b05] to-black border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/20">
              📢
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-amber-200">
                Kringkasting & Fellesskapsbeskjeder
              </h2>
              <p className="text-xs text-amber-300/80">
                Send levende meldinger og heiarop til alle deltakere og storskjermen
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-amber-300 hover:text-white hover:bg-amber-900/40 cursor-pointer transition-all"
            title="Lukk kringkasting"
          >
            ✕
          </button>
        </div>

        {/* Sender Form */}
        <form onSubmit={handleSend} className="space-y-3 p-4 rounded-2xl bg-black/40 border border-amber-500/25">
          <div className="flex items-center justify-between">
            <label htmlFor="broadcast-input" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>✍️</span>
              <span>Skriv ny beskjed som {authorName}:</span>
            </label>
            <div className="flex items-center gap-1">
              {(['info', 'celebration', 'pause', 'alert'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setType(t);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    type === t
                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                      : 'bg-black/50 text-amber-200/60 hover:text-amber-100'
                  }`}
                >
                  {t === 'info' && '📢 Info'}
                  {t === 'celebration' && '🎉 Feiring'}
                  {t === 'pause' && '☕ Pause'}
                  {t === 'alert' && '⚠️ Viktig'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              id="broadcast-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="F.eks: 'Husk kaffe i pausen!' eller 'Allsang om 2 minutter!'"
              className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-500/40 text-xs sm:text-sm outline-none focus:border-amber-300"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-heading font-black text-xs sm:text-sm cursor-pointer shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Send</span>
              <span>🚀</span>
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70 mb-1.5">
              Hurtig-beskjeder (trykk for å fylle inn):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-2xs bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/25 text-amber-200 text-left cursor-pointer transition-all flex items-center gap-1"
                >
                  <span>{preset.icon}</span>
                  <span className="truncate max-w-[200px] sm:max-w-xs">{preset.text}</span>
                </button>
              ))}
            </div>
          </div>

          {sentSuccess && (
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>✅</span>
              <span>Beskjeden er kringkastet til storskjermen og alle spillere!</span>
            </div>
          )}
        </form>

        {/* Live Announcements Stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-amber-300">
              Tidligere Kringkastinger ({announcements.length}):
            </h3>
            {announcements.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  ownerControl.clearAnnouncements();
                  setAnnouncements([]);
                }}
                className="text-[10px] text-amber-400/60 hover:text-amber-300 cursor-pointer underline"
              >
                Tøm logg
              </button>
            )}
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 text-center text-amber-300/50 text-xs rounded-2xl bg-black/30 border border-amber-500/10">
              Ingen beskjeder er kringkastet ennå. Bruk feltet over for å sende et heiarop eller pausebeskjed!
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    ann.type === 'celebration'
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-100'
                      : ann.type === 'pause'
                      ? 'bg-blue-500/15 border-blue-400/40 text-blue-100'
                      : ann.type === 'alert'
                      ? 'bg-rose-500/15 border-rose-400/40 text-rose-100'
                      : 'bg-black/50 border-amber-500/20 text-amber-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs sm:text-sm">{ann.message}</div>
                    <div className="text-[10px] text-amber-300/70">
                      Av: <strong>{ann.author}</strong> · {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="text-base shrink-0">
                    {ann.type === 'celebration' && '🎉'}
                    {ann.type === 'pause' && '☕'}
                    {ann.type === 'alert' && '⚠️'}
                    {ann.type === 'info' && '📢'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-500/20 flex justify-end">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-950/80 border border-amber-500/30 hover:border-amber-400 text-amber-200 font-bold text-xs cursor-pointer transition-all"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
