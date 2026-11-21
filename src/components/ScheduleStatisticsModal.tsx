/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  dailySchedule,
  ScheduleParticipant,
  PARTICIPANT_COLORS,
  STAR_REWARD_TARGET,
  SCHEDULE_CATEGORIES,
  ScheduleCategory,
  AggregatedStatsResult,
} from '../services/schedule';
import { sounds } from '../audio/soundEngine';

interface ScheduleStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardParticipant?: (participant: ScheduleParticipant) => void;
}

export const ScheduleStatisticsModal: React.FC<ScheduleStatisticsModalProps> = ({
  isOpen,
  onClose,
  onRewardParticipant,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [activeParticipantFilter, setActiveParticipantFilter] = useState<string>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const stats: AggregatedStatsResult = dailySchedule.getWeeklyMonthlyStats(timeframe);
  const rewardStatuses = dailySchedule.getWhoDeservesReward();
  const participants = dailySchedule.getParticipants();

  // Filter recent activity log
  const filteredActivity = stats.recentActivity.filter((item) => {
    const matchesParticipant =
      activeParticipantFilter === 'all' || item.participantId === activeParticipantFilter;
    const matchesCategory =
      activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
    return matchesParticipant && matchesCategory;
  });

  // Calculate highest count for bar chart scaling
  const maxCompleted = Math.max(1, ...stats.participantsData.map((p) => p.completedCount));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="printable-schedule relative w-full max-w-5xl bg-gradient-to-b from-slate-900 via-amber-950/15 to-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-amber-500/20 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-amber-300 font-serif tracking-tight">
                  Statistikk, Innsats & Belønninger
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200">
                  {timeframe === 'today' ? 'I dag' : timeframe === 'week' ? 'Siste 7 dager' : 'Siste 30 dager'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Oversikt over hvem som har gjort hva, hvem som fortjener belønning og ukentlig/månedlig utvikling.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Timeframe Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-950/80 border border-slate-700/80 rounded-xl">
              <button
                onClick={() => {
                  sounds.playClick();
                  setTimeframe('today');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'today'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                I dag
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setTimeframe('week');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'week'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Uke (7d)
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setTimeframe('month');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'month'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Måned (30d)
              </button>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                window.print();
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
              title="Skriv ut rapport"
            >
              🖨️
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Lukk"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

          {/* Section 1: Hvem fortjener belønning? (Reward Spotlight) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-400/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <h3 className="text-base font-black text-amber-200 font-serif">
                    Hvem fortjener belønning i dag?
                  </h3>
                  <span className="text-xs text-amber-300/80">
                    Krav: Minst 15 utførte oppgaver per dag gir rett til eierens Gullstjerne & Diplom!
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-amber-400 font-mono">
                  Mål: 15 oppgaver
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {rewardStatuses.map((stat) => {
                const cDef = PARTICIPANT_COLORS[stat.participant.colorId] || PARTICIPANT_COLORS.emerald;
                return (
                  <div
                    key={stat.participant.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      stat.isDeserving
                        ? 'bg-amber-400/15 border-amber-400 shadow-md ring-1 ring-amber-300/60'
                        : `${cDef.bgClass} ${cDef.borderClass}`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{stat.participant.avatar}</span>
                          <div>
                            <span className="font-bold text-sm text-slate-100 block">
                              {stat.participant.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{stat.participant.role || 'Deltager'}</span>
                          </div>
                        </div>

                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: cDef.hex }}
                          title={`Farge: ${cDef.name}`}
                        />
                      </div>

                      <div className="space-y-1 my-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">I dag:</span>
                          <span className="font-bold font-mono">
                            <span className={stat.isDeserving ? 'text-amber-300 text-sm' : cDef.textClass}>
                              {stat.todayCompletedCount}
                            </span>
                            <span className="text-slate-500"> / {STAR_REWARD_TARGET}</span>
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${stat.progressPercent}%`,
                              backgroundColor: stat.isDeserving ? '#fbbf24' : cDef.hex,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between mt-2">
                      {stat.isDeserving ? (
                        <span className="text-amber-300 text-xs font-black flex items-center gap-1">
                          <span>🌟</span>
                          <span>KVALIFISERT!</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Mangler {stat.remainingForStar} oppgaver
                        </span>
                      )}

                      {onRewardParticipant && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onRewardParticipant(stat.participant);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            stat.isDeserving
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <span>🏆</span>
                          <span>{stat.isDeserving ? 'Tildel Stjerne' : 'Diplom'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Sammenligning & Statistikk (Bar chart per participant with their colors) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>📊 Fullførte oppgaver per deltager</span>
                  <span className="text-xs text-amber-300 font-mono">
                    (Totalt: {stats.totalCompleted})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visuell sammenligning av innsatsen for valgt tidsrom ({timeframe === 'today' ? 'I dag' : timeframe === 'week' ? 'Siste uke' : 'Siste måned'}).
                </p>
              </div>

              {stats.topParticipant && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center gap-2 text-xs">
                  <span>👑</span>
                  <span className="text-amber-200 font-bold">Innsatshelt:</span>
                  <span className="text-amber-100 font-black">{stats.topParticipant.avatar} {stats.topParticipant.name}</span>
                </div>
              )}
            </div>

            {/* Horizontal Bar Chart styled with participants' unique colors */}
            <div className="space-y-3.5">
              {stats.participantsData.map((pData) => {
                const cDef = PARTICIPANT_COLORS[pData.participant.colorId] || PARTICIPANT_COLORS.emerald;
                const percentOfMax = Math.round((pData.completedCount / maxCompleted) * 100);

                return (
                  <div key={pData.participant.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pData.participant.avatar}</span>
                        <span className="font-bold text-slate-200">{pData.participant.name}</span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${cDef.hex}25`,
                            color: cDef.hex,
                            borderColor: `${cDef.hex}50`,
                          }}
                        >
                          {cDef.name}
                        </span>
                        {pData.starsEarned > 0 && (
                          <span className="text-[11px] text-amber-300 font-bold flex items-center gap-0.5">
                            ⭐ {pData.starsEarned} stjernedager
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-sm">
                        <span style={{ color: cDef.hex }}>{pData.completedCount}</span>
                        <span className="text-slate-400 text-xs"> oppgaver</span>
                      </div>
                    </div>

                    {/* Bar with participant's color */}
                    <div className="w-full h-4 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-950"
                        style={{
                          width: `${Math.max(6, percentOfMax)}%`,
                          backgroundColor: cDef.hex,
                        }}
                      >
                        {pData.completedCount > 0 && percentOfMax > 15 && `${pData.completedCount}`}
                      </div>
                    </div>

                    {/* Category mini pills for this participant */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px]">
                      {(Object.keys(pData.categoryCounts) as ScheduleCategory[]).map((catKey) => {
                        const count = pData.categoryCounts[catKey];
                        if (count === 0) return null;
                        const catMeta = SCHEDULE_CATEGORIES[catKey];
                        return (
                          <span
                            key={catKey}
                            className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 flex items-center gap-1"
                          >
                            <span>{catMeta.icon}</span>
                            <span>{catMeta.label.split(' ')[0]}:</span>
                            <span className="font-bold text-slate-100">{count}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Hvem har gjort hva? (Aktivitetslogg & Tidslinje) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>📋 Hvem har gjort hva? (Aktivitetslogg)</span>
                  <span className="text-xs text-slate-400">
                    ({filteredActivity.length} hendelser)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kronologisk logg over gjennomførte oppgaver, filtrert etter deltager og kategori.
                </p>
              </div>

              {/* Participant filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveParticipantFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeParticipantFilter === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Alle ({participants.length})
                </button>

                {participants.map((p) => {
                  const cDef = PARTICIPANT_COLORS[p.colorId];
                  const isSelected = activeParticipantFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveParticipantFilter(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                        isSelected
                          ? `${cDef.badgeClass} ring-2 ${cDef.ringClass}`
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity Table / Feed */}
            {filteredActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Ingen oppgaver registrert for valgt filter i dette tidsrommet.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredActivity.map((item) => {
                  const cDef = PARTICIPANT_COLORS[item.colorId] || PARTICIPANT_COLORS.emerald;
                  const catMeta = SCHEDULE_CATEGORIES[item.category] || SCHEDULE_CATEGORIES.gjoremal;

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category icon */}
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-base shrink-0">
                          {catMeta.icon}
                        </div>

                        {/* Title and category */}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-100 block truncate">
                            {item.taskTitle}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {catMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Participant Pill and Time */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="px-2.5 py-0.5 rounded-full font-bold text-xs border flex items-center gap-1 shadow-xs"
                          style={{
                            backgroundColor: `${cDef.hex}25`,
                            color: cDef.hex,
                            borderColor: `${cDef.hex}50`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cDef.hex }}
                          />
                          <span>{item.participantName}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.date} {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Stjernebelønning gis for 15 utførte oppgaver per dag per deltager.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Lukk statistikk
          </button>
        </div>
      </div>
    </div>
  );
};
