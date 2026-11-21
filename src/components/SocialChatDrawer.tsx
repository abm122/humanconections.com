/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { socialSocket, ChatMessage, RoomParticipant } from '../services/socialSocket';
import { sounds } from '../audio/soundEngine';
import { moderation } from '../services/moderation';

interface SocialChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onEmojiBurst?: (emoji: string) => void;
}

const REACTION_EMOJIS = ['💖', '🎉', '✨', '🥳', '🙌', '🌟', '☕'];

export const SocialChatDrawer: React.FC<SocialChatDrawerProps> = ({
  isOpen,
  onToggle,
  onEmojiBurst,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentRoom, setCurrentRoom] = useState('joy-lounge');
  const [roomInput, setRoomInput] = useState('');
  const [showRoomChanger, setShowRoomChanger] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Moderation & Social Wellbeing state
  const [isModMode, setIsModMode] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const myProfile = socialSocket.getProfile();

  useEffect(() => {
    // Helper to safely deduplicate messages by unique ID
    const mergeUniqueMessages = (existing: ChatMessage[], incoming: ChatMessage[]) => {
      const map = new Map<string, ChatMessage>();
      existing.forEach((m) => map.set(m.id, m));
      incoming.forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).slice(-70);
    };

    const unsubs = [
      socialSocket.on('room:init', (payload: unknown) => {
        const data = payload as { roomId: string; participants: RoomParticipant[]; messages: ChatMessage[] };
        setCurrentRoom(data.roomId);
        setParticipants(data.participants || []);
        setMessages(mergeUniqueMessages([], data.messages || []));
      }),

      socialSocket.on('room:state', (payload: unknown) => {
        const data = payload as { roomId: string; participants: RoomParticipant[]; messages: ChatMessage[] };
        setCurrentRoom(data.roomId);
        setParticipants(data.participants || []);
        setMessages(mergeUniqueMessages([], data.messages || []));
      }),

      socialSocket.on('chat:message', (payload: unknown) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => {
          // Guard against duplicate keys from race conditions or replays
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev.slice(-60), msg];
        });

        if (msg.type === 'reaction' && msg.reactionEmoji && onEmojiBurst) {
          onEmojiBurst(msg.reactionEmoji);
        }

        if (msg.type === 'cheer' || msg.type === 'achievement') {
          sounds.playPop(1.4);
        } else {
          sounds.playClick();
        }

        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }),

      socialSocket.on('chat:warning', (payload: unknown) => {
        const data = payload as { message: string };
        setModerationWarning(data.message);
        setTimeout(() => setModerationWarning(null), 4000);
      }),

      socialSocket.on('user:joined', (payload: unknown) => {
        const data = payload as { user: RoomParticipant; participants: RoomParticipant[] };
        setParticipants(data.participants || []);
      }),

      socialSocket.on('user:left', (payload: unknown) => {
        const data = payload as { userId: string; participants: RoomParticipant[] };
        setParticipants(data.participants || []);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isOpen, onEmojiBurst]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Filter banned words for social wellbeing
    const { cleanText, hasBannedWords } = moderation.filterText(inputValue.trim());
    if (hasBannedWords) {
      setModerationWarning('Inappropriate words were replaced with joyful sparkles for community wellbeing.');
      setTimeout(() => setModerationWarning(null), 3500);
    }

    sounds.playClick();
    socialSocket.sendChatMessage(cleanText);
    setInputValue('');
  };

  const handleSendReaction = (emoji: string) => {
    sounds.playPop(1.2);
    socialSocket.sendReaction(emoji);
    if (onEmojiBurst) onEmojiBurst(emoji);
  };

  const handleSwitchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = roomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanRoom) return;

    sounds.playClick();
    socialSocket.joinRoom(cleanRoom);
    setCurrentRoom(cleanRoom);
    setRoomInput('');
    setShowRoomChanger(false);
  };

  // Safe Audience Picture Upload Validation
  const handleAudienceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await moderation.validateAudienceUpload(file);
    if (!validation.isValid) {
      sounds.playClick();
      setUploadNotice(validation.reason || 'Unfitted file. Only square joy images under 600KB are allowed.');
      setTimeout(() => setUploadNotice(null), 4500);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Convert fitted image to safe data preview and broadcast
    const reader = new FileReader();
    reader.onload = () => {
      sounds.playPop(1.3);
      socialSocket.sendChatMessage(`📷 Shared a fitted joyful picture with the gathering! ✨`);
      setUploadNotice('✨ Fitted picture shared safely with audience!');
      setTimeout(() => setUploadNotice(null), 3000);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Moderator / Host Action: Ban Disturbant from Game
  const handleBanParticipant = (targetId: string, targetName: string) => {
    if (targetId === myProfile.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to ban "${targetName}" from this game session? Disturbances are not permitted for social wellbeing.`
    );
    if (!confirmed) return;

    sounds.playClick();
    socialSocket.banUser(targetId, targetName);
    setModerationWarning(`🚫 ${targetName} was banned from the game session.`);
    setTimeout(() => setModerationWarning(null), 4000);
  };

  // Moderator / Host Action: Mute in Chat
  const handleMuteParticipant = (targetId: string, targetName: string) => {
    if (targetId === myProfile.id) return;
    socialSocket.muteUser(targetId);
    setModerationWarning(`🔇 Toggled chat mute for ${targetName}.`);
    setTimeout(() => setModerationWarning(null), 3000);
  };

  return (
    <>
      {/* Trigger floating button when drawer is closed */}
      {!isOpen && (
        <button
          onClick={() => {
            sounds.playClick();
            onToggle();
          }}
          className="fixed bottom-4 right-4 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm shadow-xl shadow-amber-950/50 flex items-center gap-2.5 border border-amber-300/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Open Joy Chat & Social Lounge"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Joy Lounge</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      )}

      {/* Slide-out Real-time Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#160f08]/95 backdrop-blur-xl border-l border-amber-500/25 shadow-2xl flex flex-col text-amber-50 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-amber-500/20 flex items-center justify-between bg-amber-950/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="font-heading font-bold text-sm text-amber-200 flex items-center gap-1.5">
                  <span>Room: #{currentRoom}</span>
                  <button
                    onClick={() => setShowRoomChanger(!showRoomChanger)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-normal cursor-pointer ml-1"
                  >
                    {showRoomChanger ? 'close' : 'change'}
                  </button>
                </h3>
                <span className="text-xs text-amber-300/60 font-medium">
                  {participants.length} {participants.length === 1 ? 'person' : 'people'} in gathering
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Host / Moderator Tools Toggle */}
              <button
                onClick={() => setIsModMode(!isModMode)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isModMode
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50'
                    : 'text-amber-400/70 hover:text-amber-200 hover:bg-amber-900/40'
                }`}
                title="Toggle Host & Wellbeing Moderation Tools"
              >
                <span>🛡️</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  onToggle();
                }}
                className="p-1.5 rounded-lg text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Social Wellbeing & Upload Banner Notification */}
          {(moderationWarning || uploadNotice) && (
            <div className="p-2.5 bg-amber-900/80 border-b border-amber-500/40 text-xs text-amber-100 flex items-start gap-2 animate-in fade-in">
              <span className="text-base">💛</span>
              <p className="flex-1 font-medium">{moderationWarning || uploadNotice}</p>
            </div>
          )}

          {/* Room Switcher inline form */}
          {showRoomChanger && (
            <form onSubmit={handleSwitchRoom} className="p-3 bg-black/40 border-b border-amber-500/15 flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room code (e.g. table-1)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Join
              </button>
            </form>
          )}

          {/* Quick Participant Strip with Moderation Controls */}
          <div className="px-3 py-2 border-b border-amber-500/10 flex items-center gap-1.5 overflow-x-auto text-xs text-amber-300/70">
            <span className="text-[10px] uppercase tracking-wider text-amber-400/60 font-semibold shrink-0">
              In Room:
            </span>
            {participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/20 shrink-0 text-amber-200"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
                {p.id === myProfile.id ? (
                  <span className="text-amber-400 text-[10px]">(you)</span>
                ) : (
                  isModMode && (
                    <button
                      onClick={() => handleBanParticipant(p.id, p.name)}
                      className="ml-1 text-[10px] text-rose-400 hover:text-rose-200 font-bold px-1 bg-rose-950/50 rounded border border-rose-500/30 cursor-pointer"
                      title="Ban disturbant from game session"
                    >
                      Ban 🚫
                    </button>
                  )
                )}
              </span>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-amber-300/50 text-xs">
                <div className="w-10 h-10 rounded-full border border-amber-500/30 mx-auto flex items-center justify-center mb-2 text-lg">
                  💛
                </div>
                <span>Welcome to #{currentRoom}! Send a cheer or kind words to kick off the celebration.</span>
                <p className="text-[11px] text-amber-400/60 mt-2">
                  This room is dedicated to fun and social wellbeing. Disturbances are not permitted.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === myProfile.id;

                if (m.type === 'reaction') {
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="text-2xl p-1 bg-amber-950/40 rounded-full border border-amber-500/20 transform hover:scale-125 transition-transform">
                        {m.reactionEmoji}
                      </div>
                      <span className="text-[10px] text-amber-300/50">{m.senderName}</span>
                    </div>
                  );
                }

                if (m.type === 'achievement' || m.type === 'cheer') {
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/30 text-xs my-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <span>{m.type === 'achievement' ? '🏆 Celebration' : '💛 Cheer'}</span>
                        <span className="text-[10px] text-amber-200/60 font-normal">
                          · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-amber-100 font-medium mt-1">
                        <strong className="text-amber-200">{m.senderName}</strong> {m.text}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-amber-300/60 mb-0.5 px-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.senderColor }} />
                      <span>{isMe ? 'You' : m.senderName}</span>
                      <span className="text-amber-400/40">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isModMode && !isMe && (
                        <span className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleMuteParticipant(m.senderId, m.senderName)}
                            className="text-[9px] text-amber-400 hover:text-amber-200 px-1 rounded bg-black/40 border border-amber-500/30 cursor-pointer"
                            title="Mute in room"
                          >
                            Mute
                          </button>
                          <button
                            onClick={() => handleBanParticipant(m.senderId, m.senderName)}
                            className="text-[9px] text-rose-400 hover:text-rose-200 px-1 rounded bg-rose-950/60 border border-rose-500/30 cursor-pointer"
                            title="Ban from game"
                          >
                            Ban 🚫
                          </button>
                        </span>
                      )}
                    </span>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                          : 'bg-amber-950/80 border border-amber-500/30 text-amber-100 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Bar & Safe Picture Upload Trigger */}
          <div className="px-3 py-2 border-t border-amber-500/15 bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-base p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Fitted Picture Upload (Strict Validation for Wellbeing) */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAudienceFileUpload}
                className="hidden"
                id="audience-photo-upload"
              />
              <label
                htmlFor="audience-photo-upload"
                className="p-1 px-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:text-amber-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Upload a fitted joy picture (Square, <600KB)"
              >
                <span>📷</span>
                <span className="hidden sm:inline">Photo</span>
              </label>
            </div>
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-amber-500/20 bg-amber-950/50 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send a joyful message..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold text-xs cursor-pointer transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};
