/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { socialSocket } from '../services/socialSocket';
import { progression } from '../services/progression';
import { sounds } from '../audio/soundEngine';
import { GoldenCoinLogo } from './GoldenCoinLogo';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievementTitle?: string;
  cardTitle?: string;
  stats?: {
    connectionsMade: number;
    pointsEarned: number;
    linesCompleted: number;
  };
}

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  isOpen,
  onClose,
  achievementTitle = 'Heartfelt Joyful BINGO Triumph',
  cardTitle = 'Heartfelt Connection Bingo',
  stats = { connectionsMade: 5, pointsEarned: 1250, linesCompleted: 2 },
}) => {
  const [copied, setCopied] = useState(false);
  const myProfile = socialSocket.getProfile();
  const currentLevel = progression.getLevelInfo();

  if (!isOpen) return null;

  const shareText = `🌟 I just completed "${achievementTitle}" playing JoyPulse Bingo! Connected with ${stats.connectionsMade} friends & earned ${stats.pointsEarned} Joy Points. Play a round with me! 💛✨`;
  const shareUrl = window.location.origin;

  const handleCopyLink = () => {
    sounds.playPop(1.4);
    navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    sounds.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'JoyPulse Bingo Achievement',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    sounds.playClick();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    sounds.playClick();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${shareUrl}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBroadcastToRoom = () => {
    sounds.playLineComplete();
    socialSocket.broadcastAchievement(achievementTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181109] border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-amber-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="font-heading text-lg font-bold text-amber-200">Share Joy & Achievement</h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 rounded-lg cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visual Achievement Keepsake Badge Preview */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-b from-amber-950/60 via-[#27190d] to-black border-2 border-amber-400/40 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-center mb-2">
            <GoldenCoinLogo size="lg" showGlow />
          </div>

          <span className="text-2xs font-extrabold uppercase tracking-widest text-amber-400/90 block">
            {currentLevel.title} · Level {currentLevel.level}
          </span>
          <h3 className="font-display text-xl font-bold text-amber-100 mt-1">
            {achievementTitle}
          </h3>
          <p className="text-xs text-amber-200/70 mt-1 font-medium">{cardTitle}</p>

          <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-base font-extrabold text-amber-300 tabular-nums">
                +{stats.pointsEarned}
              </div>
              <div className="text-3xs uppercase tracking-wider text-amber-200/60">Joy Sparks</div>
            </div>
            <div>
              <div className="text-base font-extrabold text-amber-300 tabular-nums">
                {stats.connectionsMade}
              </div>
              <div className="text-3xs uppercase tracking-wider text-amber-200/60">Stories</div>
            </div>
            <div>
              <div className="text-base font-extrabold text-amber-300 tabular-nums">
                {stats.linesCompleted}
              </div>
              <div className="text-3xs uppercase tracking-wider text-amber-200/60">Lines Won</div>
            </div>
          </div>
          <div className="mt-3 text-2xs text-amber-400/60 font-medium">
            Player: {myProfile.name}
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2 mt-1">
          <button
            onClick={handleBroadcastToRoom}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Celebrate in Joy Lounge Chat</span>
            <span>🎉</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleNativeShare}
              className="py-2 px-3 rounded-xl bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-xs text-amber-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-xs text-emerald-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="py-2 px-3 rounded-xl bg-sky-950/60 border border-sky-500/30 hover:border-sky-400 text-xs text-sky-200 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>X / Post</span>
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-2 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-500/40 text-xs text-amber-300 font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{copied ? 'Link Copied to Clipboard! ✨' : 'Copy Shareable Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
