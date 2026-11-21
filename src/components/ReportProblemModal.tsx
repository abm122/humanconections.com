/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { problemReports, ProblemCategory } from '../services/problemReports';
import { sounds } from '../audio/soundEngine';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: ProblemCategory; label: string; icon: string; desc: string }[] = [
  { id: 'technical', label: 'Teknisk feil', icon: '🐞', desc: 'Appen hakker, tall registreres feil, eller lyd/visning svikter' },
  { id: 'rules', label: 'Bingoregler', icon: '🎲', desc: 'Spørsmål eller uklarheter rundt vinnerrekker eller mønster' },
  { id: 'payment', label: 'Betaling & Tjeneste', icon: '💳', desc: 'Spørsmål om kortbetaling, Apple Pay, Google Pay eller lisens' },
  { id: 'conduct', label: 'Upassende oppførsel', icon: '🛡️', desc: 'Upassende ordbruk, forstyrrende deltakere eller moderasjon' },
  { id: 'feedback', label: 'Forslag & Idé', icon: '💡', desc: 'Nye oppgaver, temaer, forbedringer eller funksjoner' },
  { id: 'other', label: 'Annet', icon: '📝', desc: 'Generelle henvendelser eller tilbakemeldinger' },
];

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState<'new_report' | 'owner_replies'>('new_report');
  const [allReports, setAllReports] = useState(problemReports.getReports());
  const [category, setCategory] = useState<ProblemCategory>('technical');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const unsub = problemReports.subscribe(() => {
      setAllReports(problemReports.getReports());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const answeredReports = allReports.filter((r) => r.ownerReply && r.ownerReply.trim().length > 0);

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage('Vennligst beskriv problemet litt mer detaljert (minst 5 tegn).');
      return;
    }

    sounds.playLineComplete();

    problemReports.submitReport({
      category,
      categoryLabel: selectedCategoryObj.label,
      message: message.trim(),
      isAnonymous,
      reporterName: isAnonymous ? undefined : reporterName.trim(),
      reporterEmail: isAnonymous ? undefined : reporterEmail.trim(),
    });

    setIsSubmitted(true);
  };

  const handleOpenMailto = () => {
    sounds.playClick();
    const url = problemReports.createMailtoUrl({
      categoryLabel: selectedCategoryObj.label,
      message: message.trim() || 'Ingen tekst oppgitt',
      isAnonymous,
      reporterName,
      reporterEmail,
    });
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setMessage('');
    setIsSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#140c06] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-amber-50 animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-[#221309] to-rose-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-xl shadow-lg ring-2 ring-white/20">
              💬
            </div>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-amber-200">
                Rapporter problem / Tilbakemelding
              </h2>
              <p className="text-2xs sm:text-xs text-amber-300/80">
                Sendes konfidensielt og direkte til spillets eier
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
            title="Lukk"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs: Send rapport / Svar fra eier */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black/40 border-b border-amber-500/20 text-xs">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveView('new_report');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'new_report'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>📝</span>
            <span>Send tilbakemelding</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveView('owner_replies');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'owner_replies'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <span>📬</span>
            <span>Svar fra eier ({answeredReports.length})</span>
            {answeredReports.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* VIEW 2: SVAR FRA EIER */}
        {activeView === 'owner_replies' ? (
          <div className="p-4 sm:p-5 space-y-3 max-h-[75vh] overflow-y-auto">
            {answeredReports.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-black/40 rounded-2xl border border-amber-500/20">
                <div className="text-3xl">📭</div>
                <div className="font-heading font-black text-sm text-amber-200">
                  Ingen svar publisert ennå
                </div>
                <p className="text-xs text-amber-300/70 max-w-sm mx-auto leading-relaxed">
                  Når eieren svarer på henvendelser og tilbakemeldinger i appen, vil svarene vises her for alle deltakere.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('new_report')}
                  className="px-4 py-2 rounded-xl bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold hover:bg-amber-500/40 cursor-pointer"
                >
                  Send en tilbakemelding nå
                </button>
              </div>
            ) : (
              answeredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between gap-2 text-2xs">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 font-bold uppercase tracking-wider">
                      {rep.categoryLabel}
                    </span>
                    <span className="text-amber-400/60 font-mono">
                      {new Date(rep.timestamp).toLocaleDateString('nb-NO')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/10 text-xs text-amber-200/90 leading-relaxed italic">
                    «{rep.message}»
                  </div>

                  {/* Eierens svar */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-black/60 border border-emerald-500/40 text-emerald-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-2xs text-emerald-300 font-bold">
                      <span className="flex items-center gap-1">
                        <span>👑</span>
                        <span>Offisielt svar fra eier:</span>
                      </span>
                      {rep.ownerRepliedAt && (
                        <span className="font-mono text-emerald-400/70">
                          {new Date(rep.ownerRepliedAt).toLocaleString('nb-NO')}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-emerald-100 whitespace-pre-wrap leading-relaxed">
                      {rep.ownerReply}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : isSubmitted ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-3xl shadow-xl animate-bounce">
              ✅
            </div>
            <h3 className="font-heading font-black text-xl text-emerald-300">
              Takk for tilbakemeldingen!
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 max-w-md mx-auto leading-relaxed">
              Problemet ditt er registrert og oversendt direkte til eier.
              {isAnonymous ? (
                <span className="block mt-2 text-2xs text-amber-300/80">
                  Rapporten ble sendt <strong>100% anonymt</strong> uten personopplysninger.
                </span>
              ) : (
                <span className="block mt-2 text-2xs text-emerald-300">
                  Ditt navn og e-post er vedlagt slik at eier kan følge opp saken med deg.
                </span>
              )}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleOpenMailto}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Send også en kopi via din egen e-postklient"
              >
                <span>✉️</span>
                <span>Send også via e-post</span>
              </button>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-black shadow-lg hover:from-emerald-400 hover:to-emerald-500 transition-all cursor-pointer"
              >
                Lukk og fortsett spillet
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
                1. Velg Hva problemet gjelder
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSel = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setCategory(cat.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-gradient-to-br from-amber-500/30 to-rose-500/20 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400/50'
                          : 'bg-black/40 border-amber-500/20 text-amber-200/70 hover:border-amber-400/40 hover:text-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{cat.icon}</span>
                        <span className="font-heading font-black text-xs">{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-amber-300/60 line-clamp-2 mt-1 leading-tight">
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  2. Beskriv problemet eller tilbakemeldingen
                </label>
                <span className="text-2xs text-amber-400/60 font-mono">
                  {message.length} tegn
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                rows={4}
                placeholder="Fortell hva som skjedde, hva du opplevde, eller hva som bør forbedres..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs placeholder-amber-200/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all resize-none leading-relaxed"
              />
              {errorMessage && (
                <div className="text-2xs text-rose-400 font-bold mt-1">
                  ⚠️ {errorMessage}
                </div>
              )}
            </div>

            {/* Anonymity Choice */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-black/60 to-amber-950/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isAnonymous ? '🕶️' : '👤'}</span>
                  <div>
                    <div className="font-heading font-black text-xs text-amber-200">
                      Send anonymt
                    </div>
                    <div className="text-2xs text-amber-300/70">
                      {isAnonymous
                        ? 'Ditt navn og e-post holdes helt skjult for eier'
                        : 'Oppgi navn og e-post slik at eier kan svare deg'}
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      sounds.playClick();
                      setIsAnonymous(e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Optional Name and Email if NOT anonymous */}
              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-500/20 animate-fadeIn">
                  <div>
                    <label className="block text-2xs font-bold text-amber-300/90 mb-1">
                      Ditt Navn
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="F.eks. Kari Nordmann"
                      className="w-full px-3 py-2 rounded-xl bg-black/70 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-amber-300/90 mb-1">
                      Din E-postadresse (for svar)
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="din.epost@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-black/70 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confidentiality note */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-start gap-2.5 text-2xs text-amber-200/80 leading-relaxed">
              <span className="text-sm shrink-0">🔒</span>
              <span>
                <strong>Konfidensiell behandling:</strong> Rapporten oversendes direkte til eiers innboks. Bingoverten eller andre deltakere kan ikke se det du rapporterer.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenMailto}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Åpne ferdigskrevet e-post i e-postprogrammet ditt"
              >
                <span>✉️</span>
                <span>Send direkte via e-post</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 text-xs font-black shadow-lg hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer ring-1 ring-white/30 transform hover:scale-[1.02]"
              >
                <span>🚀</span>
                <span>Send rapport til eier</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
