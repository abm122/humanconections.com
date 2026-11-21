/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { sounds } from '../audio/soundEngine';
import { useTranslation } from '../services/i18n';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sounds.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => {
        sounds.playClick();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#16100a] via-[#100a05] to-[#080502] border-2 border-emerald-400/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-amber-50 animate-fadeIn max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/90 via-[#122019] to-amber-950/80 border-b border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center text-2xl font-black shadow-lg shrink-0">
              🛡️
            </div>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-white">
                {isEn
                  ? 'Privacy Policy & Child Safety (Injoy Together)'
                  : 'Personvern & Barnetrygghet — Injoy Together'}
              </h2>
              <p className="text-xs text-emerald-200/85">
                {isEn
                  ? 'Open for all ages (Kahoot-style) · Social Quiz & Games without gambling'
                  : 'Åpen for alle aldre (Kahoot-modus) · Sosialt spill & quiz uten pengespill'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-emerald-400/30 text-emerald-200 hover:text-white text-xs font-bold cursor-pointer transition-all shrink-0"
          >
            ✕ {isEn ? 'Close' : 'Lukk'}
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm leading-relaxed text-amber-100/90">
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-400/40 space-y-1.5">
            <div className="font-heading font-black text-emerald-300 text-sm flex items-center gap-2">
              <span>🎉</span>
              <span>
                {isEn
                  ? '1. Pure Social Quiz & Event Game — No Gambling or Cash Prizes'
                  : '1. Rent sosialt spill & quiz — Ingen pengespill eller pengegevinster'}
              </span>
            </div>
            <p className="text-xs text-emerald-100/85">
              {isEn
                ? 'Injoy Together is a family-friendly social quiz, charades/mime, and connection board game for clubs, families, schools, churches, and social gatherings. There is never real-money betting, wagering, or monetary payouts.'
                : 'Injoy Together er et familievennlig sosialt quiz-, mime- og brettspill laget for familier, skoler, foreninger, kirker og vennegjenger. Appen inneholder aldri pengespill, innsats eller pengegevinster — kun lek, læring og sosial trivsel.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-500/25 space-y-1.5">
            <div className="font-heading font-black text-amber-200 text-sm flex items-center gap-2">
              <span>🧒</span>
              <span>
                {isEn
                  ? '2. No Personal Data for Children (Kahoot Mode)'
                  : '2. Ingen persondata for barn eller deltakere (Kahoot-modus)'}
              </span>
            </div>
            <p className="text-xs text-amber-100/85">
              {isEn
                ? 'Children, families, and event guests join games for free using only an organizer code or link and a playful nickname. We never require user accounts, email addresses, phone numbers, birthdates, or payments from children or participants.'
                : 'Barn, unge, familier og gjester deltar helt gratis med arrangørens koblingskode eller deltakerlenke og et valgfritt kallenavn. Det kreves aldri brukerkonto, innlogging, e-postadresse, telefonnummer, fødselsdato eller betaling fra barn eller deltakere.'}
            </p>
            <p className="text-xs text-emerald-300/90 font-semibold">
              {isEn
                ? 'Nicknames exist only in memory during the active game room and are deleted when the session ends.'
                : 'Kallenavnet brukes kun midlertidig i det aktive spillrommet og slettes automatisk når økten avsluttes.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-500/25 space-y-1.5">
            <div className="font-heading font-black text-amber-200 text-sm flex items-center gap-2">
              <span>🎤</span>
              <span>
                {isEn
                  ? '3. Organizers / Adults Handle Login & Event Payment'
                  : '3. Kun arrangør / voksen logger inn og betaler for arrangementet'}
              </span>
            </div>
            <p className="text-xs text-amber-100/85">
              {isEn
                ? 'Only the event organizer (host, parent, teacher, or leader) signs in and pays for playtime via Stripe (Visa, Mastercard, Apple Pay, Google Pay). One payment covers the entire event and lets all guests join for free.'
                : 'Kun den voksne arrangøren (vert, forelder, lærer eller leder) logger inn og betaler for arrangementspakken via sikker utsjekk (Visa, Mastercard, Apple Pay eller Google Pay). Når arrangøren har betalt, spiller alle deltakere og barn gratis på samme kode.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-500/25 space-y-1.5">
            <div className="font-heading font-black text-amber-200 text-sm flex items-center gap-2">
              <span>🛡️</span>
              <span>
                {isEn
                  ? '4. Safe Moderation, Zero Ads & Zero Third-Party Tracking'
                  : '4. Trygt språkfilter, ingen reklame og ingen sporing'}
              </span>
            </div>
            <p className="text-xs text-amber-100/85">
              {isEn
                ? 'All rooms enforce automatic profanity filtering, and the organizer can remove disruptive participants at any time. Injoy Together contains no third-party advertising, behavioral profiling, or data sales.'
                : 'Alle spillrom har automatisk filter mot upassende ord og banning, og arrangøren kan fjerne forstyrrende deltakere når som helst. Injoy Together har ingen reklame, ingen adferdssporing og selger aldri data til tredjeparter.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/20 text-[11px] text-amber-200/80">
            {isEn
              ? 'Built in accordance with Norwegian privacy principles (Personopplysningsloven / GDPR) for safe family, school, and community play across all ages.'
              : 'Utformet i tråd med norske personvernregler (Personopplysningsloven / GDPR) for trygg bruk av barn, familier, skoler og foreninger i alle aldre.'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-5 bg-black/75 border-t border-emerald-500/25 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>⇦</span>
            <span>{isEn ? 'Back to Injoy Together' : 'Tilbake til Injoy Together'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
