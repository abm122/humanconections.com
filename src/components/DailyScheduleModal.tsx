/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  dailySchedule,
  PlannedTask,
  ScheduleCategory,
  SCHEDULE_CATEGORIES,
  WORD_BANK,
  WordBankItem,
  STAR_REWARD_TARGET,
  ScheduleParticipant,
  PARTICIPANT_COLORS,
  ParticipantColorId,
} from '../services/schedule';
import { StarRewardModal } from './StarRewardModal';
import { ParticipantManagerModal } from './ParticipantManagerModal';
import { ScheduleStatisticsModal } from './ScheduleStatisticsModal';
import { progression } from '../services/progression';
import { sounds } from '../audio/soundEngine';
import { useTranslation } from '../services/i18n';
import { moderation } from '../services/moderation';

interface DailyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCelebrate?: () => void;
}

type TimeFilter = 'all' | 'morning' | 'midday' | 'evening' | 'night';

export const DailyScheduleModal: React.FC<DailyScheduleModalProps> = ({
  isOpen,
  onClose,
  onCelebrate,
}) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [participants, setParticipants] = useState<ScheduleParticipant[]>(dailySchedule.getParticipants());
  const [selectedParticipantFilter, setSelectedParticipantFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ScheduleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  
  // Ribbon direct participant quick-add & rename states
  const [isQuickAddingRibbon, setIsQuickAddingRibbon] = useState(false);
  const [ribbonNewName, setRibbonNewName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');

  // Quick assign modal/popover state
  const [assigningWord, setAssigningWord] = useState<WordBankItem | null>(null);
  const [assignHour, setAssignHour] = useState<number>(new Date().getHours());
  const [assignParticipantId, setAssignParticipantId] = useState<string>(participants[0]?.id || '');
  const [markAsAlreadyDone, setMarkAsAlreadyDone] = useState<boolean>(false);

  // Custom word / task input
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<ScheduleCategory>('gjoremal');
  const [customHour, setCustomHour] = useState<number>(new Date().getHours());
  const [customParticipantId, setCustomParticipantId] = useState<string>(participants[0]?.id || '');
  const [customFeedback, setCustomFeedback] = useState<string | null>(null);

  // Direct hour adder state
  const [pickerForHour, setPickerForHour] = useState<number | null>(null);

  // Modals state
  const [isStarRewardOpen, setIsStarRewardOpen] = useState<boolean>(false);
  const [isParticipantManagerOpen, setIsParticipantManagerOpen] = useState<boolean>(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState<boolean>(false);
  const [rewardTargetParticipant, setRewardTargetParticipant] = useState<ScheduleParticipant | null>(null);

  // Subscribe to daily schedule and participant changes
  useEffect(() => {
    const unsubTasks = dailySchedule.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });

    const unsubParticipants = dailySchedule.subscribeParticipants((updatedParts) => {
      setParticipants(updatedParts);
      setAssignParticipantId((prev) => (prev ? prev : (updatedParts[0]?.id || '')));
      setCustomParticipantId((prev) => (prev ? prev : (updatedParts[0]?.id || '')));
    });

    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);

    return () => {
      unsubTasks();
      unsubParticipants();
      clearInterval(timer);
    };
  }, []);

  if (!isOpen) return null;

  // Filter words from bank
  const filteredWords = WORD_BANK.filter((w) => {
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalPointsFromSchedule = tasks.reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);

  // Hours array 0-23
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  // Filter hours based on timeFilter
  const visibleHours = hoursArray.filter((h) => {
    if (timeFilter === 'all') return true;
    if (timeFilter === 'morning') return h >= 6 && h < 12;
    if (timeFilter === 'midday') return h >= 12 && h < 17;
    if (timeFilter === 'evening') return h >= 17 && h < 22;
    if (timeFilter === 'night') return h >= 22 || h < 6;
    return true;
  });

  // Handlers
  const handleToggleComplete = (task: PlannedTask, explicitParticipantId?: string) => {
    sounds.playDaub();
    const activeParticipantId =
      explicitParticipantId ||
      (selectedParticipantFilter !== 'all' ? selectedParticipantFilter : undefined) ||
      task.assignedParticipantId ||
      participants[0]?.id;

    const result = dailySchedule.toggleComplete(task.id, activeParticipantId);
    if (result && result.pointsEarned > 0) {
      sounds.playLineComplete();
      progression.addPoints(result.pointsEarned, `Utført dagsplan-gjøremål: ${task.title}`);
      if (onCelebrate) onCelebrate();
    }
  };

  const handleOpenAssignModal = (word: WordBankItem) => {
    sounds.playClick();
    setAssigningWord(word);
    setAssignHour(word.suggestedHour ?? currentHour);
    setAssignParticipantId(
      selectedParticipantFilter !== 'all' ? selectedParticipantFilter : participants[0]?.id || ''
    );
    setMarkAsAlreadyDone(false);
  };

  const handleConfirmAssign = () => {
    if (!assigningWord) return;
    dailySchedule.addTask(
      assigningWord.title,
      assigningWord.category,
      assignHour,
      assigningWord.icon,
      markAsAlreadyDone,
      assignParticipantId || undefined
    );
    if (markAsAlreadyDone) {
      sounds.playLineComplete();
      progression.addPoints(35, `Utført gjøremål: ${assigningWord.title}`);
      if (onCelebrate) onCelebrate();
    } else {
      sounds.playClick();
    }
    setAssigningWord(null);
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    sounds.playClick();
    const created = dailySchedule.addTask(
      customTitle.trim(),
      customCategory,
      customHour,
      undefined,
      false,
      customParticipantId || (selectedParticipantFilter !== 'all' ? selectedParticipantFilter : undefined)
    );

    setCustomTitle('');
    setCustomFeedback(`Lagt til "${created.title}" i kl. ${String(customHour).padStart(2, '0')}:00!`);
    setTimeout(() => setCustomFeedback(null), 3000);
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleLoadPreset = (presetKey: 'skolehverdag' | 'helg' | 'rolig') => {
    sounds.playClick();
    dailySchedule.loadPreset(presetKey);
  };

  const handleClearAll = () => {
    if (window.confirm('Vil du tømme hele dagens plan?')) {
      sounds.playClick();
      dailySchedule.clearAll();
    }
  };

  // Direct manual participant add from ribbon
  const handleRibbonAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ribbonNewName.trim();
    if (!trimmed) return;
    const modResult = moderation.filterText(trimmed);
    if (modResult.hasBannedWords) {
      alert('Vennligst bruk et hyggelig og passende navn');
      return;
    }
    const colorKeys = Object.keys(PARTICIPANT_COLORS) as ParticipantColorId[];
    const usedColors = participants.map((p) => p.colorId);
    const availableColor = colorKeys.find((c) => !usedColors.includes(c)) || colorKeys[participants.length % colorKeys.length];
    const newP = dailySchedule.addParticipant(modResult.cleanText, '⭐', availableColor, 'Deltager');
    if (newP) {
      setSelectedParticipantFilter(newP.id);
      sounds.playPop(1.2);
    }
    setRibbonNewName('');
    setIsQuickAddingRibbon(false);
  };

  const handleStartRename = (p: ScheduleParticipant, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setEditingParticipantId(p.id);
    setEditingParticipantName(p.name);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editingParticipantName.trim();
    if (!trimmed) return;
    const modResult = moderation.filterText(trimmed);
    dailySchedule.updateParticipant(id, { name: modResult.cleanText });
    setEditingParticipantId(null);
    sounds.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="printable-schedule relative w-full max-w-6xl max-h-[94vh] bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-amber-300 tracking-tight font-serif">
                  {t('wellbeing_schedule')}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200">
                  24t / 24h
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  • Kl. {String(currentHour).padStart(2, '0')}:00
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('safe_community_notice')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Participants & Colors Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsParticipantManagerOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Administrer deltagere og velg unike farger (Lag farger for deltagere)"
            >
              <div className="flex -space-x-1.5 items-center mr-0.5">
                {participants.slice(0, 3).map((p) => {
                  const cDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
                  return (
                    <span
                      key={p.id}
                      className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center border border-slate-900"
                      style={{ backgroundColor: cDef.hex }}
                    >
                      {p.avatar}
                    </span>
                  );
                })}
              </div>
              <span>👥 Deltagere ({participants.length})</span>
            </button>

            {/* Week & Month Statistics Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsStatisticsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-950/80 to-indigo-950/80 border border-sky-500/40 hover:border-sky-300 text-sky-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Se statistikk for uke og måned, hvem som har gjort hva og hvem som fortjener belønning"
            >
              <span>📊</span>
              <span>Statistikk (Uke/Mnd)</span>
            </button>

            {/* 15 Tasks Star Reward Button */}
            <button
              onClick={() => {
                sounds.playClick();
                const deserving = dailySchedule.getWhoDeservesReward().find((s) => s.isDeserving);
                setRewardTargetParticipant(deserving ? deserving.participant : null);
                setIsStarRewardOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                completedTasks >= STAR_REWARD_TARGET
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 border border-amber-200 animate-pulse shadow-amber-500/40'
                  : 'bg-amber-950/80 border border-amber-500/40 text-amber-200 hover:border-amber-300'
              }`}
              title={t('star_reward_title')}
            >
              <span className="text-sm">⭐</span>
              <span>
                {completedTasks >= STAR_REWARD_TARGET
                  ? `🌟 ${t('star_reward_badge')} (15/15)`
                  : `⭐ ${completedTasks}/${STAR_REWARD_TARGET}`}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 hover:border-amber-400/60 text-slate-200 hover:text-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title={t('print')}
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">{t('print')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Participant Quick Filter & Quick Management Bar */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Deltagere:
            </span>
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedParticipantFilter('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedParticipantFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Alle ({tasks.length})
            </button>

            {participants.map((p) => {
              const cDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
              const isSelected = selectedParticipantFilter === p.id;
              const isRenaming = editingParticipantId === p.id;
              const pDoneCount = tasks.filter(
                (t) =>
                  t.isCompleted &&
                  (t.completedByParticipantId === p.id ||
                    (!t.completedByParticipantId && t.assignedParticipantId === p.id))
              ).length;
              const isStarReady = pDoneCount >= STAR_REWARD_TARGET;

              if (isRenaming) {
                return (
                  <form
                    key={p.id}
                    onSubmit={(e) => handleSaveRename(p.id, e)}
                    className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-xl border border-amber-400"
                  >
                    <input
                      type="text"
                      value={editingParticipantName}
                      onChange={(e) => setEditingParticipantName(e.target.value)}
                      className="px-1.5 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-slate-100 font-bold outline-none w-24"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingParticipantId(null);
                      }}
                    />
                    <button
                      type="submit"
                      className="px-1.5 py-0.5 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                    >
                      Lagre
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingParticipantId(null)}
                      className="px-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={p.id}
                  className={`group relative px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? `${cDef.badgeClass} ring-2 ${cDef.ringClass} shadow-md`
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedParticipantFilter(p.id);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isStarReady ? 'bg-amber-400 text-slate-950 font-black' : 'bg-black/40 text-slate-300'
                      }`}
                    >
                      {pDoneCount}/{STAR_REWARD_TARGET} {isStarReady ? '⭐' : ''}
                    </span>
                  </button>

                  {/* Inline rename pencil */}
                  <button
                    onClick={(e) => handleStartRename(p, e)}
                    className="opacity-70 group-hover:opacity-100 hover:text-amber-300 transition-opacity text-[11px] p-0.5 cursor-pointer"
                    title={`Rediger navnet til ${p.name}`}
                  >
                    ✏️
                  </button>
                </div>
              );
            })}

            {/* Quick Add Name Manually in ribbon */}
            {isQuickAddingRibbon ? (
              <form
                onSubmit={handleRibbonAddParticipant}
                className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-amber-400 shadow-sm"
              >
                <input
                  type="text"
                  value={ribbonNewName}
                  onChange={(e) => setRibbonNewName(e.target.value)}
                  placeholder="Skriv inn navn..."
                  className="px-2 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-bold outline-none w-28 focus:border-amber-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsQuickAddingRibbon(false);
                  }}
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Legg til
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingRibbon(false)}
                  className="px-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsQuickAddingRibbon(true);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Legg til et navn manuelt direkte i planen"
              >
                <span>➕</span>
                <span>Legg til navn</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                setIsParticipantManagerOpen(true);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
            >
              <span>🎨</span>
              <span>Endre farger & deltagere</span>
            </button>
          </div>
        </div>

        {/* Progress & Wellbeing Summary Ribbon */}
        <div className="px-5 py-3 bg-amber-950/30 border-b border-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Gjennomført i dag:</span>
              <span className="font-bold text-amber-300 text-sm">
                {completedTasks} av {totalTasks} ({completionPercent}%)
              </span>
            </div>
            
            {/* Visual Progress bar */}
            <div className="w-28 sm:w-40 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            {/* Star Goal 15 Tasks progress tag */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsStarRewardOpen(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer text-xs ${
                completedTasks >= STAR_REWARD_TARGET
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/50'
              }`}
              title="Klikk for å se Stjerne-Eier Belønningen for 15 fullførte oppgaver"
            >
              <span>⭐</span>
              <span>
                {completedTasks >= STAR_REWARD_TARGET ? (
                  <span className="text-amber-300 font-extrabold">15/15 Fullført! Lås opp eierens belønning 🎉</span>
                ) : (
                  <span>Stjerne-Mål: <strong>{completedTasks}/15</strong> fullført</span>
                )}
              </span>
            </button>

            {totalPointsFromSchedule > 0 && (
              <div className="flex items-center gap-1 text-emerald-300 font-bold hidden md:flex">
                <span>✨</span>
                <span>+{totalPointsFromSchedule} Joy Sparks opptjent</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
              Maler:
            </span>
            <button
              onClick={() => handleLoadPreset('skolehverdag')}
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:border-amber-300 transition-all cursor-pointer"
              title="Last inn balansert skolehverdag med lekser, måltider og lesing"
            >
              🎒 Skolehverdag
            </button>
            <button
              onClick={() => handleLoadPreset('helg')}
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:border-amber-300 transition-all cursor-pointer"
              title="Last inn aktiv helgedag med turer, baking og brettspill"
            >
              🚴 Aktiv Helg
            </button>
            <button
              onClick={() => handleLoadPreset('rolig')}
              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:border-amber-300 transition-all cursor-pointer"
              title="Last inn rolig dag med trivsel, høytlesing og hvile"
            >
              ☕ Rolig Trivsel
            </button>
            <button
              onClick={handleClearAll}
              className="px-2 py-1 rounded text-[11px] text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/50 transition-all cursor-pointer ml-1"
              title="Nullstill og tøm dagens plan"
            >
              Tøm
            </button>
          </div>
        </div>

        {/* Main Split Content Area */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Extensive Word Bank & Chores Library */}
          <div className="lg:col-span-5 p-4 flex flex-col gap-3.5 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📚</span>
                  <span>Ordbank for Gjøremål & Aktiviteter</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Velg ord eller gjøremål som kan legges i planen etter eller før utført oppgave
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {filteredWords.length} ord tilgjengelig
              </span>
            </div>

            {/* Category Filter Badges */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Alle ({WORD_BANK.length})
              </button>
              {(Object.keys(SCHEDULE_CATEGORIES) as ScheduleCategory[]).map((catKey) => {
                const meta = SCHEDULE_CATEGORIES[catKey];
                const count = WORD_BANK.filter((w) => w.category === catKey).length;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? `${meta.badgeBg} font-bold border-current shadow`
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label.split(' ')[0]}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk etter gjøremål, lekser, mat, aktivitet..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Word Bank Tile Grid */}
            <div className="flex-1 max-h-[380px] lg:max-h-[460px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredWords.map((word) => {
                const meta = SCHEDULE_CATEGORIES[word.category];
                return (
                  <div
                    key={word.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{word.icon}</span>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-200 leading-snug">
                            {word.title}
                          </span>
                        </div>
                      </div>
                      {word.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                          {word.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${meta.badgeBg}`}>
                        {meta.label.split(' ')[0]}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(word)}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                          title="Legg til i planen"
                        >
                          <span>+</span>
                          <span>Legg til</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Task Addition Form */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 mt-1">
              <div className="text-xs font-bold text-amber-200 mb-1.5 flex items-center gap-1.5">
                <span>✨</span>
                <span>Legg til eget gjøremål i planen</span>
              </div>
              <form onSubmit={handleAddCustomTask} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="F.eks. Lufte hunden i parken, brette klær..."
                  maxLength={65}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Kategori:</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as ScheduleCategory)}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    >
                      {(Object.keys(SCHEDULE_CATEGORIES) as ScheduleCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {SCHEDULE_CATEGORIES[cat].icon} {SCHEDULE_CATEGORIES[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Klokkeslett:</label>
                    <select
                      value={customHour}
                      onChange={(e) => setCustomHour(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    >
                      {hoursArray.map((h) => (
                        <option key={h} value={h}>
                          Kl. {String(h).padStart(2, '0')}:00 {h === currentHour ? '(Nå)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Deltager:</label>
                    <select
                      value={customParticipantId}
                      onChange={(e) => setCustomParticipantId(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    >
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.avatar} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  {customFeedback && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ {customFeedback}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!customTitle.trim()}
                    className="ml-auto px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    + Legg i tabellen
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: 24-Hour Schedule Timeline Table */}
          <div className="lg:col-span-7 p-4 flex flex-col gap-3 bg-slate-900/20">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⏱️</span>
                  <span>24-Timers Døgnplan (00:00 - 23:00)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Oversikt over gjøremål og rutiner time for time. Trykk av når utført!
                </p>
              </div>

              {/* Time of day filters */}
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { key: 'all', label: 'Hele døgnet (24t)' },
                    { key: 'morning', label: 'Morgen 06-12' },
                    { key: 'midday', label: 'Midt på dag 12-17' },
                    { key: 'evening', label: 'Kveld 17-22' },
                    { key: 'night', label: 'Natt 22-06' },
                  ] as { key: TimeFilter; label: string }[]
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTimeFilter(f.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      timeFilter === f.key
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 24-Hour Table */}
            <div className="flex-1 max-h-[560px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-700/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="py-2 px-3 w-28">Tidspunkt</th>
                    <th className="py-2 px-3">Gjøremål / Aktivitet</th>
                    <th className="py-2 px-3 w-28 text-center">Status</th>
                    <th className="py-2 px-2 w-16 text-right">Valg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {visibleHours.map((hour) => {
                    const hourTasks = tasks.filter((t) => {
                      if (t.hour !== hour) return false;
                      if (selectedParticipantFilter === 'all') return true;
                      return (
                        t.assignedParticipantId === selectedParticipantFilter ||
                        t.completedByParticipantId === selectedParticipantFilter
                      );
                    });
                    const isCurrent = hour === currentHour;
                    const hourLabel = `Kl. ${String(hour).padStart(2, '0')}:00`;

                    return (
                      <tr
                        key={hour}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Time slot column */}
                        <td className="py-2.5 px-3 align-top font-mono font-semibold text-slate-300">
                          <div className="flex flex-col">
                            <span className={isCurrent ? 'text-amber-300 font-bold' : ''}>
                              {hourLabel}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                                Nå
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Task list for this hour */}
                        <td className="py-2.5 px-3 align-top">
                          {hourTasks.length === 0 ? (
                            <div className="flex items-center justify-between text-slate-500 italic py-1">
                              <span className="text-[11px]">Ingen gjøremål planlagt</span>
                              <button
                                onClick={() => setPickerForHour(hour)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 hover:text-amber-200 hover:bg-slate-800 transition-all cursor-pointer not-italic flex items-center gap-1"
                              >
                                <span>+</span>
                                <span>Legg til</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {hourTasks.map((task) => {
                                const meta = SCHEDULE_CATEGORIES[task.category];
                                return (
                                  <div
                                    key={task.id}
                                    className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                      task.isCompleted
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                        : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                      <span className="text-base shrink-0">{task.icon}</span>
                                      <div className="flex flex-col truncate min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span
                                            className={`font-medium text-xs truncate ${
                                              task.isCompleted
                                                ? 'line-through text-emerald-300/80'
                                                : 'text-slate-100'
                                            }`}
                                          >
                                            {task.title}
                                          </span>

                                          {/* Participant badge in their custom color */}
                                          {task.assignedParticipantId && (() => {
                                            const p = dailySchedule.getParticipantById(task.assignedParticipantId);
                                            if (!p) return null;
                                            const cDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
                                            return (
                                              <span
                                                className="px-2 py-0.2 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 shadow-2xs"
                                                style={{
                                                  backgroundColor: `${cDef.hex}25`,
                                                  color: cDef.hex,
                                                  borderColor: `${cDef.hex}50`,
                                                }}
                                                title={`Tildelt: ${p.name}`}
                                              >
                                                <span>{p.avatar}</span>
                                                <span>{p.name}</span>
                                              </span>
                                            );
                                          })()}
                                        </div>

                                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                          <span>{meta.label.split(' ')[0]}</span>
                                          {task.completedAt && (
                                            <span className="text-emerald-400 font-medium">
                                              • Fullført {task.completedByName ? `av ${task.completedByName} ` : ''}kl. {task.completedAt}
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Participant selector & hour move dropdown */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <select
                                        value={task.assignedParticipantId || ''}
                                        onChange={(e) => {
                                          sounds.playClick();
                                          dailySchedule.assignTask(task.id, e.target.value || undefined);
                                        }}
                                        className="text-[10px] bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 cursor-pointer"
                                        title="Endre deltager"
                                      >
                                        <option value="">Ingen deltager</option>
                                        {participants.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.avatar} {p.name}
                                          </option>
                                        ))}
                                      </select>

                                      <select
                                        value={task.hour}
                                        onChange={(e) => {
                                          sounds.playClick();
                                          dailySchedule.moveTask(task.id, Number(e.target.value));
                                        }}
                                        className="text-[10px] bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-300"
                                        title="Flytt til annet klokkeslett"
                                      >
                                        {hoursArray.map((h) => (
                                          <option key={h} value={h}>
                                            Flytt: {String(h).padStart(2, '0')}:00
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Quick add more to this hour */}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setPickerForHour(hour)}
                                  className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>+</span>
                                  <span>Legg til flere</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status Checkbox / Action */}
                        <td className="py-2.5 px-3 align-top text-center">
                          {hourTasks.length > 0 && (
                            <div className="flex flex-col gap-2 items-center">
                              {hourTasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => handleToggleComplete(task)}
                                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                                    task.isCompleted
                                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                                      : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-slate-700 hover:border-amber-400/50'
                                  }`}
                                  title={task.isCompleted ? 'Merk som ikke utført' : 'Merk som utført (+35 Sparks!)'}
                                >
                                  <span>{task.isCompleted ? '✓' : '○'}</span>
                                  <span>{task.isCompleted ? 'Utført!' : 'Merk fullført'}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Delete action */}
                        <td className="py-2.5 px-2 align-top text-right">
                          {hourTasks.length > 0 && (
                            <div className="flex flex-col gap-2 items-end">
                              {hourTasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => {
                                    sounds.playClick();
                                    dailySchedule.deleteTask(task.id);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                                  title="Fjern fra planen"
                                  aria-label="Fjern gjøremål"
                                >
                                  ✕
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Assign Word Modal / Popover */}
        {assigningWord && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{assigningWord.icon}</span>
                <div>
                  <h4 className="text-base font-bold text-amber-300">{assigningWord.title}</h4>
                  <span className="text-xs text-slate-400">
                    {SCHEDULE_CATEGORIES[assigningWord.category].label}
                  </span>
                </div>
              </div>

              {assigningWord.description && (
                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-4">
                  {assigningWord.description}
                </p>
              )}

              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Velg klokkeslett i 24-timers dagsplan:
                  </label>
                  <select
                    value={assignHour}
                    onChange={(e) => setAssignHour(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                  >
                    {hoursArray.map((h) => (
                      <option key={h} value={h}>
                        Kl. {String(h).padStart(2, '0')}:00 {h === currentHour ? '(Nåværende time)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {participants.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">
                      Tildel til deltager:
                    </label>
                    <select
                      value={assignParticipantId}
                      onChange={(e) => setAssignParticipantId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="">Felles / Alle deltagere</option>
                      {participants.map((p) => {
                        const colorDef = PARTICIPANT_COLORS[p.colorId] || PARTICIPANT_COLORS.emerald;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.avatar} {p.name} ({p.role}) - {colorDef.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={markAsAlreadyDone}
                    onChange={(e) => setMarkAsAlreadyDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200">
                    Oppgaven er allerede utført (legg til som fullført og få +35 Sparks!)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setAssigningWord(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md"
                >
                  Legg til i planen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hour Picker Popover: when user clicked "+ Legg til" on an empty hour row */}
        {pickerForHour !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-amber-300">
                    Velg gjøremål for Kl. {String(pickerForHour).padStart(2, '0')}:00
                  </h4>
                  <p className="text-xs text-slate-400">
                    Klikk på et gjøremål for å plassere det i dette klokkeslettet
                  </p>
                </div>
                <button
                  onClick={() => setPickerForHour(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WORD_BANK.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      sounds.playClick();
                      dailySchedule.addTask(
                        w.title,
                        w.category,
                        pickerForHour,
                        w.icon,
                        false,
                        selectedParticipantFilter !== 'all' ? selectedParticipantFilter : undefined
                      );
                      setPickerForHour(null);
                    }}
                    className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400 text-left transition-all flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="text-lg">{w.icon}</span>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-200 truncate">
                        {w.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {SCHEDULE_CATEGORIES[w.category].label.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setPickerForHour(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Star Reward & Certificate Modal for 15 completed tasks */}
        <StarRewardModal
          isOpen={isStarRewardOpen}
          onClose={() => {
            setIsStarRewardOpen(false);
            setRewardTargetParticipant(null);
          }}
          starData={dailySchedule.getStarRewardData()}
          targetParticipant={rewardTargetParticipant}
          onCelebrate={() => {
            if (onCelebrate) onCelebrate();
          }}
        />

        {/* Participant Manager Modal: Add, edit, avatar, color palette, role */}
        <ParticipantManagerModal
          isOpen={isParticipantManagerOpen}
          onClose={() => setIsParticipantManagerOpen(false)}
          onSelectRewardCandidate={(p) => {
            setIsParticipantManagerOpen(false);
            setRewardTargetParticipant(p);
            setIsStarRewardOpen(true);
          }}
        />

        {/* Schedule Statistics Modal: Week & Month stats, who did what, who deserves reward */}
        <ScheduleStatisticsModal
          isOpen={isStatisticsModalOpen}
          onClose={() => setIsStatisticsModalOpen(false)}
          onRewardParticipant={(p) => {
            setIsStatisticsModalOpen(false);
            setRewardTargetParticipant(p);
            setIsStarRewardOpen(true);
          }}
        />

      </div>
    </div>
  );
};
