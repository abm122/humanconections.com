/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { authService, AuthUser } from '../services/authService';
import { sounds } from '../audio/soundEngine';
import { sessionTimer } from '../services/sessionTimer';
import { remoteBingo } from '../services/remoteBingo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: AuthUser) => void;
  onRequirePayment?: () => void;
  onOpenOwnerControl?: () => void;
  onQuickJoinQuiz?: () => void;
  onQuickJoinBingo?: () => void;
}

const AVATARS = ['🌸', '🚀', '🦁', '⭐', '🎨', '🦊', '👑', '🌻', '🐶', '🦄', '🎸', '⚽'];
const COLORS = ['#f59e0b', '#059669', '#7c3aed', '#0284c7', '#ec4899', '#14b8a6', '#f97316', '#e11d48'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRequirePayment,
  onOpenOwnerControl,
  onQuickJoinQuiz,
  onQuickJoinBingo,
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(authService.getCurrentUser());
  const [selectedRole, setSelectedRole] = useState<'player' | 'host'>('host');

  // Form states
  const [hostName, setHostName] = useState('');
  const [hostEmail, setHostEmail] = useState('');

  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('🌸');
  const [playerColor, setPlayerColor] = useState('#059669');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState<boolean>(() => sessionTimer.hasPaidAccess());
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const [maskPrivateProfile, setMaskPrivateProfile] = useState<boolean>(false);

  useEffect(() => {
    const unsub = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
    });
    const unsubSession = sessionTimer.subscribe(() => {
      setHasPaid(sessionTimer.hasPaidAccess());
      setSessionRemaining(sessionTimer.getFormattedRemaining());
    });
    return () => {
      unsub();
      unsubSession();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasPaid(sessionTimer.hasPaidAccess());
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      const u = authService.getCurrentUser();
      if (u.isAuthenticated && u.name && u.name !== 'Gjest') {
        if (u.role === 'host') setHostName(u.name);
        else if (u.role === 'player') setPlayerName(u.name);
      }
    }
  }, [isOpen]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLoginHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;
    sounds.playLineComplete();
    const user = authService.loginAsHost(hostName, hostEmail);
    remoteBingo.setHostName(user.name);
    if (onLoginSuccess) onLoginSuccess(user);
    if (!sessionTimer.hasPaidAccess()) {
      showToast(`Velkommen, ${user.name}! Betaling (Kort / Apple Pay) kreves for å starte spillet.`);
      setTimeout(() => {
        onClose();
        if (onRequirePayment) onRequirePayment();
      }, 600);
    } else {
      showToast(`Velkommen, ${user.name}! Din betalte spilletid er allerede aktiv.`);
      setTimeout(() => onClose(), 500);
    }
  };

  const handleLoginPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    sounds.playLineComplete();
    const user = authService.loginAsPlayer(playerName, playerAvatar, playerColor);
    if (onLoginSuccess) onLoginSuccess(user);
    if (!sessionTimer.hasPaidAccess()) {
      showToast(`Velkommen til Injoy Together, ${user.name}! Arrangementspass kreves for vert på egen enhet.`);
      setTimeout(() => {
        onClose();
        if (onRequirePayment) onRequirePayment();
      }, 600);
    } else {
      showToast(`Velkommen til Injoy Together, ${user.name}! Din spilletid er aktiv.`);
      setTimeout(() => onClose(), 500);
    }
  };

  const handleLogout = () => {
    sounds.playPop(0.9);
    authService.logout();
    showToast('Du er nå logget ut.');
  };

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
        className="relative w-full max-w-lg bg-[#140c06] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-amber-50 animate-fadeIn max-h-[94vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-[#26150b] to-emerald-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg ring-2 ring-white/20">
              🔑
            </div>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-amber-200">
                Arrangørinnlogging & Profil
              </h2>
              <div className="text-xs text-amber-300/80">
                {currentUser.isAuthenticated ? (
                  <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Innlogget som {currentUser.name} (
                    {currentUser.role === 'owner'
                      ? 'Eier & Admin'
                      : currentUser.role === 'host'
                      ? 'Vert'
                      : 'Spiller'}
                    )
                  </span>
                ) : (
                  <span className="text-amber-200/60">Gjest (Ikke innlogget)</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center gap-1.5 text-amber-200 hover:text-white transition-all text-xs font-bold cursor-pointer shrink-0"
            title="Avbryt og lukk"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Avbryt</span>
          </button>
        </div>

        {/* Toast Notice */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-400/40 py-2 px-4 text-center text-xs font-bold text-emerald-200 animate-fadeIn">
            ✨ {toastMessage}
          </div>
        )}

        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Profile Status Card if Authenticated */}
          {currentUser.isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-black/60 border-2 border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white/40 shrink-0"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {maskPrivateProfile ? '🙈' : currentUser.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="font-heading font-black text-base text-amber-100 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{maskPrivateProfile ? '•••••• (Skjult)' : currentUser.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/40">
                        {currentUser.role === 'owner'
                          ? '👑 Eier & Admin'
                          : currentUser.role === 'host'
                          ? '🎤 Arrangør'
                          : '🎮 Spiller'}
                      </span>
                    </div>
                    {currentUser.email && (
                      <div className="text-xs text-amber-200/70 font-mono truncate">
                        {maskPrivateProfile ? '••••@••••••.••' : currentUser.email}
                      </div>
                    )}
                    <div className="text-2xs text-amber-300/60 mt-0.5">
                      {maskPrivateProfile
                        ? 'Privat innloggingsinfo er maskert på din skjerm (kun synlig for deg når du trykker Vis).'
                        : currentUser.role === 'owner'
                        ? 'Full tilgang til eierkontroll, oppgjør og administrasjon'
                        : currentUser.role === 'host'
                        ? 'Tilgang til å styre kuler, miksebord og spill'
                        : 'Aktiv bingodeltaker'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setMaskPrivateProfile((v) => !v);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      maskPrivateProfile
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-black/50 hover:bg-black/70 border-amber-500/30 text-amber-200'
                    }`}
                    title="Skjul eller vis din private profil- og innloggingsinfo på denne skjermen"
                  >
                    {maskPrivateProfile ? '👁️ Vis profil' : '🙈 Skjul privat'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <span>🚪</span>
                    <span>Logg ut</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-2xs text-amber-300/60">
                <span>
                  {currentUser.role === 'owner'
                    ? 'Spilletid: ∞ Ubegrenset (Eier)'
                    : `Sesjon aktiv fra: ${new Date(currentUser.lastLoginAt).toLocaleTimeString('no-NO')}`}
                </span>
                <div className="flex items-center gap-2">
                  {currentUser.role === 'owner' && onOpenOwnerControl && (
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
                      <span>Åpne Eierpanel</span>
                    </button>
                  )}
                  <span className="text-emerald-400 font-semibold">● Tilkoblet</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(onQuickJoinQuiz || onQuickJoinBingo) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-cyan-950/70 border-2 border-emerald-400/50 space-y-2">
                  <div className="font-heading font-black text-xs sm:text-sm text-emerald-200 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Barn, familie & deltakere: Bli med GRATIS med kode!</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/85 leading-snug">
                    Skal du delta på et arrangement? Du trenger <strong>ikke</strong> logge inn, oppgi e-post eller betale!
                  </p>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {onQuickJoinQuiz && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          onQuickJoinQuiz();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer shadow transition-all"
                      >
                        🎯 Bli med i Quiz (Kode)
                      </button>
                    )}
                    {onQuickJoinBingo && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          onQuickJoinBingo();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer shadow transition-all"
                      >
                        🎲 Sosial Bingo (Kode)
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/85 text-center leading-relaxed">
                Innlogging nedenfor er for <strong>arrangører / verter</strong> som skal starte arrangementet og lage koblingskode.
              </div>
            </div>
          )}

          {/* Payment Status Notice for non-owners */}
          {(!currentUser.isAuthenticated || currentUser.role !== 'owner') && (
            hasPaid ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0a2016] to-black/70 border border-emerald-400/50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                    <span className="text-base">✓</span>
                    <span>Spilletid er Betalt & Aktiv ({sessionRemaining})</span>
                  </div>
                  <div className="text-2xs text-emerald-200/80 mt-0.5">
                    Fri veksling mellom Storskjerm, Avstandsbingo og Vertsbord uten ny betaling.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-amber-950/60 to-black/60 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span className="text-base">💳</span>
                    <span>Betaling med Kort / Apple Pay påkrevd</span>
                  </div>
                  <div className="text-2xs text-amber-200/80 mt-0.5">
                    Spilletid: 20 min prøvetid, 1 time eller 2 timer per runde (Visa, Mastercard, Pay).
                  </div>
                </div>
                {onRequirePayment && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      onRequirePayment();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1"
                  >
                    <span>Betal nå</span>
                    <span>➔</span>
                  </button>
                )}
              </div>
            )
          )}

          {/* Role Chooser Tabs */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-2">
              {currentUser.isAuthenticated ? 'Bytt arrangørprofil:' : 'Logg inn som:'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedRole('host');
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'host'
                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                    : 'bg-black/50 border border-amber-500/20 text-amber-200/80 hover:bg-black/70'
                }`}
              >
                <span className="text-lg">🎤</span>
                <span>Arrangør / Vert</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedRole('player');
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'player'
                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                    : 'bg-black/50 border border-amber-500/20 text-amber-200/80 hover:bg-black/70'
                }`}
              >
                <span className="text-lg">🎮</span>
                <span>Solo-arrangør</span>
              </button>
            </div>
          </div>

          {/* Form 1: PLAYER LOGIN */}
          {selectedRole === 'player' && (
            <form onSubmit={handleLoginPlayer} className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎮</span>
                <h3 className="font-heading font-black text-sm text-amber-200">
                  Spillerprofil
                </h3>
              </div>

              <div>
                <label className="block text-2xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Ditt spillernavn
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="F.eks. Nora, Filip, Lukas..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                  Velg din lykke-avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPlayerAvatar(av);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                        playerAvatar === av
                          ? 'bg-amber-400 scale-110 shadow-lg ring-2 ring-white'
                          : 'bg-black/40 hover:bg-black/60 border border-amber-500/20'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                  Velg din temafarge
                </label>
                <div className="flex items-center gap-2">
                  {COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPlayerColor(col);
                      }}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                        playerColor === col ? 'ring-3 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-black shadow-lg hover:from-emerald-400 hover:to-emerald-500 transition-all cursor-pointer"
              >
                Logg inn som Spiller
              </button>
            </form>
          )}

          {/* Form 2: HOST LOGIN */}
          {selectedRole === 'host' && (
            <form onSubmit={handleLoginHost} className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎤</span>
                <h3 className="font-heading font-black text-sm text-purple-200">
                  Bingovert Innlogging
                </h3>
              </div>

              <div>
                <label className="block text-2xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Vertsnavn
                </label>
                <input
                  type="text"
                  required
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="F.eks. Kveldsvert Ole..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  E-post (valgfritt)
                </label>
                <input
                  type="email"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  placeholder="vert@eksempel.no"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-2xs text-purple-200 leading-relaxed">
                Bingovert får full kontroll over kuletrekning, lydoppkall, storskjerm og pausemenyer.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black shadow-lg hover:from-purple-400 hover:to-indigo-500 transition-all cursor-pointer"
              >
                Logg inn som Bingovert
              </button>
            </form>
          )}
        </div>

        {/* Footer Back/Cancel Bar */}
        <div className="p-3 sm:px-5 bg-black/75 border-t border-amber-500/25 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-100 hover:text-white font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span>⇦</span>
            <span>Avbryt / Tilbake</span>
          </button>
        </div>
      </div>
    </div>
  );
};
