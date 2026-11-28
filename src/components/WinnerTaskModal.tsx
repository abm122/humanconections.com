/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WinnerTask } from '../data/winnerTasks';
import { sounds } from '../audio/soundEngine';
import { GoldenCoinLogo } from './GoldenCoinLogo';
import { useTranslation } from '../services/i18n';
import { formatMilestoneLabel, getBingoUiTexts } from '../services/bingoUiI18n';

interface WinnerTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string;
  linesCount: number;
  isFullHouse?: boolean;
  task: WinnerTask;
  onCompleteTask?: () => void;
}

export const WinnerTaskModal: React.FC<WinnerTaskModalProps> = ({
  isOpen,
  onClose,
  winnerName,
  linesCount,
  isFullHouse = false,
  task,
  onCompleteTask,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);

  if (!isOpen) return null;

  const tierLabel = formatMilestoneLabel(
    isFullHouse ? 'fullbrett' : linesCount >= 3 ? 'line3' : 'line1',
    lang
  );

  const handleDone = () => {
    sounds.playLineComplete();
    if (onCompleteTask) onCompleteTask();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#24170d] via-[#1a1109] to-[#0f0a05] border-2 border-amber-400 rounded-3xl shadow-2xl p-6 sm:p-8 text-amber-50 text-center overflow-hidden">
        {/* Radiant golden backdrop glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Golden Sun Coin Logo Emblem */}
        <div className="relative z-10 flex flex-col items-center mb-4">
          <div className="relative mb-2">
            <GoldenCoinLogo size="xl" showGlow />
            <span className="absolute -bottom-1 -right-1 text-2xl animate-bounce">
              {task.icon}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-2xs uppercase tracking-widest mt-1">
            <span>✨</span>
            <span>{tierLabel.toUpperCase()}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 mt-2">
            {winnerName} — {tierLabel}!
          </h2>
        </div>

        {/* Winner Task Highlight Box */}
        <div className="relative z-10 my-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/70 via-black/60 to-rose-950/50 border-2 border-amber-400/60 shadow-xl text-center space-y-2">
          <div className="text-2xs sm:text-xs font-black uppercase tracking-wider text-rose-300 flex items-center justify-center gap-1.5">
            <span>💖</span>
            <span>{ui.winnerTaskBadge}</span>
            <span>💖</span>
          </div>
          <div className="font-heading font-black text-lg sm:text-2xl text-amber-100 leading-snug drop-shadow-sm">
            «{task.task}»
          </div>
          <div className="text-2xs text-amber-300/80 pt-1">
            {task.headline}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleDone}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-heading font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <span>❤️</span>
            <span>{ui.winnerTaskDoneBtn} (+{task.sparkReward} {ui.winnerTaskRewardLabel})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black/60 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all cursor-pointer"
          >
            {ui.winnerTaskContinueBtn} ➔
          </button>
        </div>
      </div>
    </div>
  );
};
