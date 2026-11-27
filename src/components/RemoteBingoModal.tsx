/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { sounds } from '../audio/soundEngine';
import { remoteBingo, RemoteParticipant, HostActivityNotification } from '../services/remoteBingo';
import { moderation } from '../services/moderation';
import { sessionTimer } from '../services/sessionTimer';
import { ownerControl, BannedParticipant } from '../services/ownerControl';
import { socialSocket } from '../services/socialSocket';
import { authService, AuthUser } from '../services/authService';
import { musicBingoService } from '../services/musicBingoService';
import { DigitalMusicBingoBoard } from './DigitalMusicBingoBoard';

export interface HostMessageItem {
  id: string;
  senderId?: string;
  senderName: string;
  senderColor?: string;
  text: string;
  timestamp: number;
  isHostReply?: boolean;
}

interface RemoteBingoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHostPlaying?: boolean;
  initialJoinCode?: string;
  onJoinedAsRemotePlayer?: (code: string, name: string) => void;
  onOpenVippsModal?: () => void;
  onSwitchToBigScreen?: () => void;
  onOpenTvMode?: (game: 'bingo' | 'quiz', code: string) => void;
  onStartNewRound?: () => void;
}

export const RemoteBingoModal: React.FC<RemoteBingoModalProps> = ({
  isOpen,
  onClose,
  isHostPlaying = false,
  initialJoinCode,
  onJoinedAsRemotePlayer,
  onOpenVippsModal,
  onSwitchToBigScreen,
  onOpenTvMode,
  onStartNewRound,
}) => {
  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const isOwnerNow = ownerControl.isUnlocked();
  const [hasPaid, setHasPaid] = useState<boolean>(
    () => !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || isOwnerNow)
  );
  const [activeTab, setActiveTab] = useState<'join' | 'host' | 'messages'>(
    !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || isOwnerNow)
      ? 'host'
      : 'join'
  );
  const [inputCode, setInputCode] = useState(initialJoinCode || '');
  const [inputName, setInputName] = useState(remoteBingo.getPlayerName() || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTvLink, setCopiedTvLink] = useState(false);
  const [showCodeOnBigScreen, setShowCodeOnBigScreen] = useState<boolean>(() =>
    remoteBingo.isShowCodeOnBigScreen()
  );
  const [maskCodeOnHostScreen, setMaskCodeOnHostScreen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>(() => remoteBingo.getConnectedRemotePlayers());
  const [roundNumber, setRoundNumber] = useState<number>(() => remoteBingo.getRoundNumber());
  const [hostCode, setHostCode] = useState(remoteBingo.getHostCode());
  const [serverSynced, setServerSynced] = useState(() => remoteBingo.isRoomActiveOnServer());
  const [cloudSynced, setCloudSynced] = useState(() => remoteBingo.isCloudRoomSynced());
  const [regError, setRegError] = useState<string | null>(() => remoteBingo.getRegistrationError());
  const [isCodeLocked, setIsCodeLocked] = useState(() => remoteBingo.isCodeLockedForRound());
  const [bannedList, setBannedList] = useState<BannedParticipant[]>(() => ownerControl.getBannedParticipants());
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const [isEditingHostName, setIsEditingHostName] = useState(false);
  const [hostNameDraft, setHostNameDraft] = useState('');
  const [hostNotifications, setHostNotifications] = useState<HostActivityNotification[]>(() =>
    remoteBingo.getHostNotifications()
  );
  const [unreadHostAlerts, setUnreadHostAlerts] = useState<number>(() =>
    remoteBingo.getUnreadNotificationCount()
  );
  const [liveHostAlert, setLiveHostAlert] = useState<{
    id: string;
    type: 'join' | 'bingo';
    text: string;
  } | null>(null);
  const [musicParticipants, setMusicParticipants] = useState(() =>
    musicBingoService.getSnapshot().participants || []
  );

  // Participant & Host messaging
  const [messages, setMessages] = useState<HostMessageItem[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [participantBoardMode, setParticipantBoardMode] = useState<'numbers' | 'music_bingo'>('numbers');

  const isRemote = remoteBingo.getIsRemotePlayer() && !ownerControl.isUnlocked();
  const canHost = !isRemote && hasPaid;
  const currentRoom = remoteBingo.getCurrentRoomCode();
  const hostDisplayName =
    (authUser.isAuthenticated && authUser.name && authUser.name !== 'Gjest' ? authUser.name : '') ||
    remoteBingo.getHostName() ||
    'Arrangør';

  useEffect(() => {
    if (isOpen) {
      const currentU = authService.getCurrentUser();
      const isOwner = currentU.role === 'owner' || ownerControl.isUnlocked();
      const isRemoteNow = remoteBingo.getIsRemotePlayer() && !isOwner;
      const paidNow = !isRemoteNow && ((currentU.isAuthenticated && sessionTimer.hasPaidAccess()) || isOwner);
      setHasPaid(paidNow);
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      setAuthUser(currentU);
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setServerSynced(remoteBingo.isRoomActiveOnServer());
      if (initialJoinCode && initialJoinCode.trim()) {
        setInputCode(initialJoinCode.trim().toUpperCase());
        setErrorMessage(null);
        setActiveTab('join');
      } else if (paidNow && !isRemoteNow) {
        setActiveTab('host');
        remoteBingo.activateHostSession(undefined, hostDisplayName);
        setHostCode(remoteBingo.getHostCode());
        setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      } else {
        setActiveTab('join');
      }
    }
  }, [isOpen, isHostPlaying, initialJoinCode]);

  useEffect(() => {
    if (isHostPlaying && !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked())) {
      setActiveTab('host');
    }
  }, [isHostPlaying]);

  useEffect(() => {
    const unsubRemote = remoteBingo.subscribe(() => {
      setParticipants([...remoteBingo.getConnectedRemotePlayers()]);
      setRoundNumber(remoteBingo.getRoundNumber());
      setHostCode(remoteBingo.getHostCode());
      setServerSynced(remoteBingo.isRoomActiveOnServer());
      setCloudSynced(remoteBingo.isCloudRoomSynced());
      setRegError(remoteBingo.getRegistrationError());
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setShowCodeOnBigScreen(remoteBingo.isShowCodeOnBigScreen());
      setHostNotifications(remoteBingo.getHostNotifications());
      setUnreadHostAlerts(remoteBingo.getUnreadNotificationCount());
    });

    const unsubJoinAlert = remoteBingo.onParticipantJoined((p, total) => {
      if (remoteBingo.getIsRemotePlayer() || !remoteBingo.canActAsHost()) return;
      sounds.playPop(1.25);
      const id = `join-${Date.now()}`;
      setLiveHostAlert({
        id,
        type: 'join',
        text: `👋 ${p.name} ble med i rommet (${p.game || 'Avstandsbingo'})! Totalt ${total} tilkoblet.`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 6500);
    });

    const unsubClaimAlert = remoteBingo.onClaim((claim) => {
      const tier =
        claim.milestone ||
        (claim.isFullHouse || /fullbrett/i.test(claim.pattern)
          ? 'fullbrett'
          : /3\s*\.?\s*rekke/i.test(claim.pattern)
          ? 'line3'
          : 'line1');
      const tierLabel = tier === 'fullbrett' ? 'Fullt brett' : tier === 'line3' ? '3. rekker' : '1. rekke';
      const nextText =
        tier === 'fullbrett'
          ? 'Ny runde starter!'
          : tier === 'line3'
          ? 'Spillet fortsetter til Full brett!'
          : 'Spillet fortsetter til 3. rekker!';
      sounds.playLineComplete();
      const id = `claim-${Date.now()}`;
      setLiveHostAlert({
        id,
        type: 'bingo',
        text: `🏆 ${claim.playerName} har fylt ${tierLabel} og trykket BINGO! ➡️ ${nextText}`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 8000);
    });

    const unsubMusic = musicBingoService.subscribe(() => {
      setMusicParticipants([...(musicBingoService.getSnapshot().participants || [])]);
      setHostNotifications(remoteBingo.getHostNotifications());
    });

    const unsubMusicClaim = musicBingoService.onClaim((mClaim) => {
      sounds.playLineComplete();
      const isFull = /fullt?\s*brett/i.test(mClaim.pattern);
      const nextText = isFull
        ? 'Ny runde kan startes!'
        : /3\s*\.?\s*rekke/i.test(mClaim.pattern)
        ? 'Spillet fortsetter til Fullt brett!'
        : 'Spillet fortsetter til 3. rekker!';
      const id = `mclaim-${Date.now()}`;
      setLiveHostAlert({
        id,
        type: 'bingo',
        text: `🎵 ${mClaim.playerName} fylte ${mClaim.pattern} og trykket MUSIKKBINGO! ➡️ ${nextText}`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 8000);
    });

    const unsubSession = sessionTimer.subscribe(() => {
      const u = authService.getCurrentUser();
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
      setSessionRemaining(sessionTimer.getFormattedRemaining());
    });

    const unsubAuth = authService.subscribe(() => {
      const u = authService.getCurrentUser();
      setAuthUser(u);
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
    });

    const unsubOwner = ownerControl.subscribe(() => {
      const u = authService.getCurrentUser();
      setBannedList(ownerControl.getBannedParticipants());
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
    });

    // Listen for participant messages to host and replies
    const unsubHostMsg = socialSocket.on('host:message_received', (payload: any) => {
      if (payload && payload.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: payload.id || `msg-${Date.now()}`,
            senderId: payload.senderId,
            senderName: payload.senderName || 'Deltaker',
            senderColor: payload.senderColor || '#06b6d4',
            text: payload.text,
            timestamp: payload.timestamp || Date.now(),
            isHostReply: false,
          },
        ]);
      }
    });

    const unsubHostReply = socialSocket.on('host:reply_received', (payload: any) => {
      if (payload && payload.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: payload.id || `rep-${Date.now()}`,
            senderName: payload.hostName || hostDisplayName || 'Bingovert / Arrangør',
            senderColor: '#f59e0b',
            text: payload.text,
            timestamp: payload.timestamp || Date.now(),
            isHostReply: true,
          },
        ]);
      }
    });

    return () => {
      unsubRemote();
      unsubJoinAlert();
      unsubClaimAlert();
      unsubMusic();
      unsubMusicClaim();
      unsubSession();
      unsubAuth();
      unsubOwner();
      unsubHostMsg();
      unsubHostReply();
    };
  }, []);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    sounds.playClick();
    setErrorMessage(null);
    const modCheck = moderation.filterText(inputName.trim());
    if (modCheck.hasBannedWords) {
      setErrorMessage('Vennligst velg et hyggelig og familievennlig kallenavn.');
      return;
    }
    const safeNick = modCheck.cleanText || inputName.trim();
    setIsJoining(true);

    const res = await remoteBingo.validateAndJoinAsRemotePlayer(inputCode, safeNick);
    setIsJoining(false);
    if (!res.success) {
      sounds.playClick();
      setErrorMessage(res.error || 'Kunne ikke koble til rommet.');
      return;
    }

    sounds.playLineComplete();
    setSuccessNotice(`🎉 Tilkoblet rom ${inputCode.toUpperCase()} som ${safeNick}! Kulene synkroniseres direkte fra verten.`);
    if (onJoinedAsRemotePlayer) {
      onJoinedAsRemotePlayer(inputCode.toUpperCase(), safeNick);
    }

    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1500);
  };

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(hostCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJoinLink = () => {
    sounds.playClick();
    const shareUrl = `${window.location.origin}/?spill=bingo&kode=${encodeURIComponent(hostCode)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyTvLink = () => {
    sounds.playClick();
    const tvUrl = `${window.location.origin}/?tv=1&spill=bingo&kode=${encodeURIComponent(hostCode)}`;
    navigator.clipboard?.writeText(tvUrl).catch(() => {});
    setCopiedTvLink(true);
    setTimeout(() => setCopiedTvLink(false), 2200);
  };

  const handleRegenerateCode = () => {
    if (!canHost) return;
    sounds.playClick();
    if (remoteBingo.isCodeLockedForRound()) {
      setErrorMessage('Koden genereres kun 1 gang per aktive runde. Start en ny runde for å generere ny kode.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    const newCode = remoteBingo.generateNewHostCode();
    if (newCode) {
      setHostCode(newCode);
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setSuccessNotice(`Ny spillkode generert for runden: ${newCode}`);
      setTimeout(() => setSuccessNotice(null), 2500);
    }
  };

  const handleStartNewRoundCode = () => {
    if (!canHost) return;
    sounds.playClick();
    const confirmNew = window.confirm(
      'Starte ny runde? Dette nullstiller trukne kuler og genererer 1 ny spillkode for den nye runden.'
    );
    if (!confirmNew) return;
    if (onStartNewRound) onStartNewRound();
    const newCode = remoteBingo.startNewRound();
    if (newCode) {
      setHostCode(newCode);
      setIsCodeLocked(true);
      setSuccessNotice(`Ny runde startet! Én ny spillkode ble generert: ${newCode}`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleKickParticipant = (p: RemoteParticipant) => {
    sounds.playClick();
    const confirmKick = window.confirm(
      `Er du sikker på at du vil utestenge ${p.name} i 10 minutter for å opprettholde sosial trivsel? Utestengelsen opphører automatisk etter 10 minutter, eller du kan oppheve den manuelt.`
    );
    if (confirmKick) {
      remoteBingo.kickParticipant(p.id, p.name);
      ownerControl.banParticipant(p.name, 'Forstyrrelse av fellesskapet (10 min auto-utestengelse)');
      setBannedList(ownerControl.getBannedParticipants());
      setSuccessNotice(`🚫 ${p.name} ble utestengt i 10 minutter for å bevare sosial trivsel.`);
      setTimeout(() => setSuccessNotice(null), 3500);
    }
  };

  const handleUnban = (banned: BannedParticipant) => {
    sounds.playClick();
    ownerControl.unbanParticipant(banned.name);
    socialSocket.unbanUser(banned.id);
    setBannedList(ownerControl.getBannedParticipants());
    setSuccessNotice(`✅ Utestengelse av ${banned.name} ble opphevet. Spilleren kan nå delta igjen!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    sounds.playClick();
    const isHost = activeTab === 'host' || !isRemote;
    if (isHost) {
      // Host sends reply or announcement with actual arrangør profile name
      const senderLabel = `${hostDisplayName} (Arrangør)`;
      socialSocket.replyHostMessage(replyTarget || 'all', msgInput.trim(), senderLabel);
      setMessages((prev) => [
        ...prev,
        {
          id: `rep-${Date.now()}`,
          senderName: senderLabel,
          senderColor: '#f59e0b',
          text: msgInput.trim(),
          timestamp: Date.now(),
          isHostReply: true,
        },
      ]);
      setReplyTarget(null);
    } else {
      // Participant sends message to host
      socialSocket.sendHostMessage(msgInput.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          senderName: inputName || remoteBingo.getPlayerName() || 'Deg',
          senderColor: '#06b6d4',
          text: msgInput.trim(),
          timestamp: Date.now(),
          isHostReply: false,
        },
      ]);
    }
    setMsgInput('');
  };

  const handleLeaveRemote = () => {
    sounds.playClick();
    remoteBingo.leaveRemoteSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full bg-gradient-to-b from-[#26150a] via-[#1a0f08] to-[#0d0804] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden flex flex-col max-h-[92vh] transition-all ${
          activeTab === 'join' && participantBoardMode === 'music_bingo' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 text-2xl flex items-center justify-center shadow-md">
              📡
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-amber-200">
                Avstandsbingo & Fellesskap
              </h2>
              <p className="text-xs text-amber-300/80">
                Spill sammen på avstand fra mobil, PC eller storskjerm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPaid && onSwitchToBigScreen && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSwitchToBigScreen();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow flex items-center gap-1.5"
                title="Bytt fritt til Storskjerm uten ny betaling eller innlogging"
              >
                <span>📺</span>
                <span className="hidden sm:inline">Bytt til Storskjerm</span>
              </button>
            )}
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-black/40 rounded-xl border border-amber-500/20">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('join');
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>📱</span>
            <span>Spiller</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('host');
              remoteBingo.markHostNotificationsRead();
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'host'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>👑</span>
            <span>Arrangør / Vert</span>
            {!hasPaid && <span className="text-[10px] bg-rose-900/80 text-rose-200 px-1.5 py-0.2 rounded-full border border-rose-500/40">Låst</span>}
            {hasPaid && unreadHostAlerts > 0 && activeTab !== 'host' && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black">
                {unreadHostAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('messages');
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'messages'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>💬</span>
            <span>Meldinger</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Host Alert Banner inside Modal */}
        {liveHostAlert && (
          <div
            className={`mb-3 p-3 rounded-xl border-2 text-xs font-black flex items-center justify-between gap-2 shadow-lg animate-fadeIn ${
              liveHostAlert.type === 'bingo'
                ? 'bg-gradient-to-r from-amber-500/30 to-emerald-500/30 border-amber-300 text-amber-100'
                : 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
            }`}
          >
            <span>{liveHostAlert.text}</span>
            <button
              type="button"
              onClick={() => setLiveHostAlert(null)}
              className="text-white/80 hover:text-white font-black cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notices */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-medium animate-fadeIn">
            ⚠️ {errorMessage}
          </div>
        )}

        {successNotice && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-medium animate-fadeIn">
            {successNotice}
          </div>
        )}

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: JOIN AS PARTICIPANT */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              {isRemote && currentRoom ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-center space-y-3">
                    <span className="text-3xl">🟢</span>
                    <div className="font-heading font-black text-lg text-amber-200">
                      Du er tilkoblet rom: <span className="text-amber-400 underline font-mono">{currentRoom}</span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      Spillernavn: <strong className="text-white">{remoteBingo.getPlayerName()}</strong>.
                      Velg om du vil spille vanlig Tallbingo eller Digitalt Musikkbingo-brett!
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setParticipantBoardMode('numbers');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                          participantBoardMode === 'numbers'
                            ? 'bg-amber-400 text-slate-950 border-white shadow'
                            : 'bg-black/45 text-amber-200 border-amber-500/30 hover:bg-black/65'
                        }`}
                      >
                        🎱 Vanlig Tallbingo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setParticipantBoardMode('music_bingo');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                          participantBoardMode === 'music_bingo'
                            ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 border-white shadow'
                            : 'bg-black/45 text-rose-200 border-rose-400/40 hover:bg-black/65'
                        }`}
                      >
                        🎵 Musikkbingo-brett
                      </button>
                    </div>

                    <div className="pt-1 flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>💬</span>
                        <span>Send melding til arrangør</span>
                      </button>
                      <button
                        onClick={handleLeaveRemote}
                        className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-200 text-xs font-bold cursor-pointer transition-all"
                      >
                        Koble fra / Forlat rommet
                      </button>
                    </div>
                  </div>

                  {participantBoardMode === 'music_bingo' && (
                    <DigitalMusicBingoBoard
                      roomCode={currentRoom}
                      playerName={remoteBingo.getPlayerName() || inputName || 'Deltaker'}
                    />
                  )}
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5">
                        Vertens 4-sifrede spillkode:
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="f.eks. 7842"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-amber-400/40 focus:border-amber-400 text-amber-100 placeholder-amber-400/30 font-mono font-black text-center text-2xl tracking-widest outline-none shadow-inner"
                      />
                      <span className="text-[11px] text-amber-300/70 mt-1 block">
                        Fås fra bingoverten, storskjermen eller publikumsvisningen.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5">
                        Kallenavn (ingen e-post eller innlogging):
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        placeholder="f.eks. Løve, Stjerne eller Familien Hansen"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-amber-400/40 focus:border-amber-400 text-amber-100 placeholder-amber-400/30 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-400/50 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
                    <span className="text-xl shrink-0">🎟️</span>
                    <div>
                      <strong className="text-white block font-bold mb-0.5">Kahoot-modus — Gratis for barn, familie & gjester:</strong>
                      Arrangøren har betalt for arrangementet. Du trenger ingen konto, ingen e-post og ingen betaling — tast bare koden og et kallenavn!
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                    ✨ <strong>Sosial trivsel:</strong> Appen er kun for glede og sosialt samvær. Upassende ord eller forstyrrelser tolereres ikke og fører til automatisk 10-minutters utestengelse.
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>🚀</span>
                    <span>{isJoining ? 'Kobler til aktivt spillrom...' : 'Koble til vertens spillrom (Gratis med kode)'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: HOST CONTROLS (STRICT PAYMENT REQUIREMENT & NEVER FOR PARTICIPANTS) */}
          {activeTab === 'host' && (
            <div className="space-y-4">
              {/* STRICT PAYMENT & HOST GATE */}
              {!canHost ? (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-rose-950/70 via-black/60 to-black/80 border-2 border-rose-500/60 text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl shadow-lg">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-rose-200">
                      {isRemote
                        ? 'Kun arrangøren styrer spillrommet og spillkoden'
                        : 'Arrangørpass kreves for Avstandsbingo & Storskjerm'}
                    </h3>
                    <p className="text-xs text-amber-100/80 mt-1 max-w-md mx-auto leading-relaxed">
                      {isRemote
                        ? 'Du deltar som spiller. Bare arrangøren kan generere spillkoder (1 per runde), trekke kuler og styre rommet.'
                        : 'For å opprette spillrom, få spillkode og arrangere avstandsbingo eller storskjermbingo må verten betale for spilletiden med Visa, Mastercard, Apple Pay eller Google Pay.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-left text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> Sikker betaling med Visa, Mastercard, Apple Pay eller Google Pay
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> 1 unik spillkode per betalte spilletid
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> Alle dine deltakere spiller helt gratis med koden din
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> Deltakere kan sende meldinger direkte til deg som vert
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onOpenVippsModal) {
                        onOpenVippsModal();
                      }
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-900/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <span className="text-base">💳</span>
                    <span>Betal arrangørpass (Kort / Apple Pay / Google Pay)</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Arrangør-profil (navn & rolle) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-black/60 to-amber-950/50 border border-purple-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow border border-white/30 shrink-0"
                        style={{ backgroundColor: authUser.isAuthenticated ? authUser.avatarColor : '#7c3aed' }}
                      >
                        {authUser.isAuthenticated ? authUser.avatar : '🎤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-black text-purple-300">
                            Arrangørprofil
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black">
                            ✓ Aktiv & Betalt
                          </span>
                        </div>
                        {isEditingHostName ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!hostNameDraft.trim()) return;
                              sounds.playLineComplete();
                              const updated = authService.updateUserName(hostNameDraft.trim());
                              remoteBingo.setHostName(updated.name);
                              setIsEditingHostName(false);
                              setSuccessNotice(`Arrangørnavn oppdatert til ${updated.name}!`);
                              setTimeout(() => setSuccessNotice(null), 2500);
                            }}
                            className="flex items-center gap-1.5 mt-1"
                          >
                            <input
                              type="text"
                              value={hostNameDraft}
                              onChange={(e) => setHostNameDraft(e.target.value)}
                              placeholder="Skriv arrangørnavn..."
                              maxLength={30}
                              autoFocus
                              className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-400 text-xs text-white font-bold outline-none"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                            >
                              Lagre
                            </button>
                          </form>
                        ) : (
                          <div className="font-heading font-black text-sm sm:text-base text-white flex items-center gap-2">
                            <span>{hostDisplayName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setHostNameDraft(hostDisplayName);
                                setIsEditingHostName(true);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold cursor-pointer"
                              title="Endre arrangørnavn"
                            >
                              ✏️ Endre navn
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {onSwitchToBigScreen && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          onSwitchToBigScreen();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <span>📺</span>
                        <span>Bytt til Storskjerm</span>
                      </button>
                    )}
                  </div>

                  {/* Host Code & Controls */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black/40 to-black/60 border-2 border-amber-400/60 text-center space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-widest px-1">
                      <span>Spillkode · Arrangør: {hostDisplayName}</span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        ⏱️ {sessionRemaining.includes('Ubegrenset') ? sessionRemaining : `${sessionRemaining} igjen`}
                      </span>
                    </div>

                    <div className="inline-block px-8 py-3 rounded-2xl bg-black/80 border-2 border-amber-400 shadow-2xl">
                      <span className="font-mono font-black text-3xl sm:text-4xl text-amber-200 tracking-widest select-all">
                        {maskCodeOnHostScreen ? '••••' : hostCode}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          serverSynced || cloudSynced
                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                            : regError
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                            : 'bg-amber-500/20 border-amber-400/50 text-amber-200 animate-pulse'
                        }`}
                      >
                        {cloudSynced
                          ? '☁️ Åpen overalt (Server + Google-sky aktiv)'
                          : serverSynced
                          ? '🟢 Aktivert på server for mobil (Bingo & Quiz)'
                          : regError
                          ? `⚠️ ${regError}`
                          : '⏳ Synkroniserer rom med server...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          const active = remoteBingo.reactivateCurrentHostCode();
                          if (active) {
                            setSuccessNotice(`🔄 Spillkode ${active} synkronisert og aktivert for alle deltakere på mobil!`);
                            setTimeout(() => setSuccessNotice(null), 2500);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-bold text-amber-200 cursor-pointer"
                      >
                        🔄 Aktiver på nytt
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={handleCopyCode}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>📋</span>
                        <span>{copied ? 'Kopiert!' : 'Kopier kode'}</span>
                      </button>

                      <button
                        onClick={handleCopyJoinLink}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>🔗</span>
                        <span>{copiedLink ? '✓ Lenke kopiert!' : 'Deltakerlenke'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyTvLink}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/50 text-purple-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        title="Åpne denne lenken på TV eller prosjektor uten vertsknapper og med kode skjult til du deler den"
                      >
                        <span>📺</span>
                        <span>{copiedTvLink ? '✓ TV-lenke kopiert!' : 'TV / Prosjektor-lenke'}</span>
                      </button>

                      {onOpenTvMode && hostCode && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onClose();
                            onOpenTvMode('bingo', hostCode);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>🖥️</span>
                          <span>Ren TV-visning</span>
                        </button>
                      )}

                      {isCodeLocked ? (
                        <button
                          type="button"
                          onClick={handleStartNewRoundCode}
                          className="px-3.5 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                          title="Koden genereres kun 1 gang per runde av arrangøren. Start en ny runde for å generere ny kode."
                        >
                          <span>🔄</span>
                          <span>Ny runde (1 ny kode)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRegenerateCode}
                          className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                          title="Generer kode for denne runden (maks 1 per runde)"
                        >
                          <span>🎲</span>
                          <span>Generer kode</span>
                        </button>
                      )}
                    </div>

                    {/* Storskjerm / TV Personvern-brytere */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          remoteBingo.toggleCodeOnBigScreen(!showCodeOnBigScreen);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                          showCodeOnBigScreen
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                            : 'bg-black/60 border-white/20 text-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {showCodeOnBigScreen
                          ? '📡 Deltakerkode ÅPEN på alle skjermer'
                          : '🔒 Deltakerkode SKJULT på TV (Klikk for å åpne)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMaskCodeOnHostScreen((v) => !v);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                          maskCodeOnHostScreen
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-black/60 border-white/20 text-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {maskCodeOnHostScreen ? '🙈 Kode skjult på min skjerm' : '🙈 Skjul på min skjerm'}
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-amber-300/80">
                      📡 Romkoden deles åpent på alle skjermer · Arrangørens private innloggingskode & fasit er alltid skjult
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed text-left">
                      💡 <strong>Del kode eller lenke (Kahoot-modus):</strong> Del koden <strong>{maskCodeOnHostScreen ? '••••' : hostCode}</strong> eller klikk <em>Deltakerlenke</em>. Bruk <em>TV / Prosjektor-lenke</em> på storskjermen så kode og fasit holdes skjult til du deler aktivt.
                    </div>
                  </div>

                  {/* Live Organizer Notifications: Who joined & BINGO claims */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-black/45 to-amber-950/35 border border-emerald-400/40 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      <span>🔔 Varsler til arrangør — Hvem som ble med &amp; Bingorop ({hostNotifications.length})</span>
                      {unreadHostAlerts > 0 && (
                        <button
                          type="button"
                          onClick={() => remoteBingo.markHostNotificationsRead()}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-[10px] font-black text-emerald-100 cursor-pointer"
                        >
                          ✓ Marker lest
                        </button>
                      )}
                    </div>

                    {hostNotifications.length === 0 ? (
                      <div className="p-3 rounded-xl bg-black/35 border border-dashed border-emerald-400/25 text-xs text-slate-300/80 text-center">
                        Ingen hendelser registrert ennå. Så snart en deltaker blir med med koden eller roper BINGO, dukker varselet opp her og som lyd/pop-up!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {hostNotifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                              item.type === 'bingo'
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-100 font-bold'
                                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.type === 'bingo' ? '🏆' : '👋'}</span>
                                <span className="font-black">{item.detail}</span>
                              </div>
                              <div className="text-[10px] text-amber-200/70">
                                {item.gameLabel} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected participants list */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <span>Tilkoblede deltakere ({participants.length + musicParticipants.filter((mp) => !participants.some((rp) => rp.id === mp.id)).length}) · Runde {roundNumber}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        Sanntid
                      </span>
                    </div>

                    {participants.length === 0 && musicParticipants.length === 0 ? (
                      <div className="p-4 rounded-xl bg-black/30 border border-dashed border-amber-500/20 text-center text-xs text-amber-300/60">
                        Ingen mobildeltakere tilkoblet ennå. Del koden eller lenken over så dukker navnene opp her og på Storskjermen med en gang!
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: p.color || '#f59e0b' }}
                              />
                              <span className="font-bold text-amber-100">{p.name}</span>
                              {p.game && (
                                <span className="text-[10px] text-cyan-300/80 font-semibold">· {p.game}</span>
                              )}
                            </div>

                            <button
                              onClick={() => handleKickParticipant(p)}
                              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer transition-all"
                              title="Fjern forstyrrende spiller (10 min utestengelse)"
                            >
                              🚫 Kast ut (10 min)
                            </button>
                          </div>
                        ))}
                        {musicParticipants
                          .filter((mp) => !participants.some((rp) => rp.id === mp.id))
                          .map((mp) => (
                            <div
                              key={`mp-${mp.id}`}
                              className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-100">{mp.name}</span>
                                <span className="text-[10px] text-amber-300 font-semibold">
                                  · Musikkbingo ({mp.markedCount} kryss · {mp.linesCompleted} rekker)
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Banned participants management (10-minute auto-expiry or manual unban) */}
                  {bannedList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-300 uppercase tracking-wider">
                        <span>🛡️ Midlertidig utestengte ({bannedList.length})</span>
                        <span className="text-[10px] text-rose-200/70">10 min auto-opphør</span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {bannedList.map((b) => {
                          const remainingMs = Math.max(0, (b.bannedUntil || 0) - Date.now());
                          const remainingMins = Math.ceil(remainingMs / (60 * 1000));
                          return (
                            <div
                              key={b.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-rose-500/20 text-xs"
                            >
                              <div>
                                <span className="font-bold text-rose-200">{b.name}</span>
                                <span className="text-[10px] text-rose-300/60 block">
                                  {remainingMs > 0 ? `Utestengt i ${remainingMins} min til` : 'Utløpt'} • {b.reason}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnban(b)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-all"
                                title="Opphev utestengelse nå"
                              >
                                ✓ Opphev
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANT <-> HOST MESSAGING */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <strong>Direktemeldinger med arrangør:</strong> Spillere kan sende spørsmål eller hilse til bingoverten. Verten ser alle meldinger og kan svare direkte.
                </div>
              </div>

              {/* Message list */}
              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 h-64 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-amber-300/50 p-4">
                    <span>Ingen meldinger ennå.</span>
                    <span className="text-[11px] mt-1">Send et spørsmål, hilsen eller be om en allsang til bingoverten!</span>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        m.isHostReply
                          ? 'bg-amber-500/20 border border-amber-400/40 ml-4'
                          : 'bg-white/5 border border-white/10 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${m.isHostReply ? 'text-amber-300' : 'text-cyan-300'}`}>
                          {m.isHostReply ? '👑 ' : '👤 '}
                          {m.senderName}
                        </span>
                        <span className="text-[10px] text-amber-200/50">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-amber-100 text-xs break-words">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  maxLength={160}
                  placeholder={
                    !isRemote
                      ? 'Svar som bingovert til rommet...'
                      : 'Skriv en melding eller hilsen til bingoverten...'
                  }
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-amber-400/40 text-amber-100 placeholder-amber-400/30 text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <span>Send</span>
                  <span>➔</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-amber-500/20 text-center text-[11px] text-amber-300/60 flex items-center justify-between">
          <span>JoyBingo Avstandsbingo • Sanntidssynkronisering</span>
          <span className="text-amber-400 font-mono">
            {hasPaid && hostCode
              ? maskCodeOnHostScreen
                ? 'Kode: ••••'
                : `Kode: ${hostCode}`
              : currentRoom
              ? `Rom: ${currentRoom}`
              : 'Kode genereres etter betaling'}
          </span>
        </div>
      </div>
    </div>
  );
};
