/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { progression, DailyQuest } from '../services/progression';
import { sounds } from '../audio/soundEngine';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (amount: number) => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>(progression.getDailyQuests());
  const [bonusClaimed, setBonusClaimed] = useState<boolean>(progression.isDailyBonusClaimed());
  const [timeLeft, setTimeLeft] = useState<string>('');

  const refreshState = () => {
    setQuests(progression.getDailyQuests());
    setBonusClaimed(progression.isDailyBonusClaimed());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  // Compute countdown until midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleClaimQuest = (questId: string) => {
    sounds.playLineComplete();
    const awarded = progression.claimQuestReward(questId);
    refreshState();
    if (onRewardClaimed) onRewardClaimed(awarded);
  };

  const handleClaimGrandBonus = () => {
    sounds.playBingoWin();
    const awarded = progression.claimDailyBonus();
    refreshState();
    if (onRewardClaimed) onRewardClaimed(awarded);
  };

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const allCompleted = completedCount === quests.length && quests.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#181109] border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 text-amber-50 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg">
              🎯
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-amber-200">
                Daily Joy Quests
              </h2>
              <p className="text-2xs text-amber-300/60 font-medium">
                3 fresh joyful challenges every day · Resets in {timeLeft}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 rounded-xl cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Daily Progress Overview Strip */}
        <div className="my-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Today&apos;s Progress:
            </span>
            <span className="text-sm font-black text-amber-400 tabular-nums">
              {completedCount} / 3 Completed
            </span>
          </div>

          <div className="w-32 bg-black/50 h-2.5 rounded-full overflow-hidden border border-amber-500/30">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* 3 Quests List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  q.isClaimed
                    ? 'bg-black/30 border-amber-500/15 opacity-70'
                    : q.isCompleted
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border-amber-400 ring-2 ring-amber-300/60 shadow-lg'
                    : 'bg-amber-950/30 border-amber-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{q.icon}</span>
                    <div>
                      <div className="font-heading font-bold text-sm text-amber-100 flex items-center gap-2">
                        <span>{q.title}</span>
                        {q.isClaimed && (
                          <span className="text-3xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            Claimed
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-amber-200/70 mt-0.5 leading-snug">
                        {q.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-heading font-bold text-xs text-amber-300">
                      +{q.rewardPoints}
                    </span>
                    <span className="text-3xs uppercase tracking-wider text-amber-200/60 block">
                      Sparks
                    </span>
                  </div>
                </div>

                {/* Progress bar & Claim button */}
                <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-3xs font-mono text-amber-300/70 mb-1">
                      <span>Progress</span>
                      <span>
                        {q.progress} / {q.target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-amber-500/20">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          q.isCompleted ? 'bg-amber-400' : 'bg-amber-500/80'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {q.isCompleted && !q.isClaimed && (
                    <button
                      onClick={() => handleClaimQuest(q.id)}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-bold text-xs rounded-xl shadow-md cursor-pointer animate-pulse"
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand 3/3 Bonus Banner */}
        <div className="mt-4 pt-3 border-t border-amber-500/20">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌟</span>
              <div>
                <div className="font-heading font-bold text-xs text-amber-200">
                  Daily Trio Completion Bonus
                </div>
                <div className="text-2xs text-amber-300/70">
                  Complete all 3 quests for an extra +500 Joy Sparks!
                </div>
              </div>
            </div>

            {bonusClaimed ? (
              <span className="text-2xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                Bonus Claimed ✓
              </span>
            ) : allCompleted ? (
              <button
                onClick={handleClaimGrandBonus}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-heading font-black text-xs rounded-xl shadow-lg cursor-pointer animate-bounce"
              >
                Claim +500 Sparks!
              </button>
            ) : (
              <span className="text-2xs font-medium text-amber-300/50">
                {3 - completedCount} more to unlock
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
