/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BingoCell, CardDisplayMode, CalledBall } from '../types/bingo';
import { sounds } from '../audio/soundEngine';
import { GoldenCoinLogo } from './GoldenCoinLogo';
import { useTranslation } from '../services/i18n';
import { getBingoUiTexts } from '../services/bingoUiI18n';

interface BingoBoardProps {
  card: BingoCell[][];
  onToggleCell: (row: number, col: number, storyPartner?: string, note?: string) => void;
  winningCoords?: { row: number; col: number }[];
  isInteractive?: boolean;
  playerName?: string;
  cardIndex?: number;
  totalCards?: number;
  displayMode?: CardDisplayMode;
  onChangeDisplayMode?: (mode: CardDisplayMode) => void;
  calledBalls?: CalledBall[];
  currentBall?: CalledBall | null;
  onPause?: () => void;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({
  card,
  onToggleCell,
  winningCoords = [],
  isInteractive = true,
  playerName,
  cardIndex = 0,
  totalCards = 1,
  displayMode = 'numbers',
  onChangeDisplayMode,
  calledBalls = [],
  currentBall = null,
  onPause,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);
  // Modal for story / reflection note on cell click
  const [selectedCell, setSelectedCell] = useState<BingoCell | null>(null);
  const [partnerInput, setPartnerInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const isWinningCell = (r: number, c: number) => {
    return winningCoords.some((coord) => coord.row === r && coord.col === c);
  };

  const isCellBallDrawn = (cell: BingoCell) =>
    calledBalls.some(
      (b) =>
        (b.letter === cell.letter && b.number === cell.number) ||
        (Boolean(b.affirmation) &&
          Boolean(cell.text) &&
          b.affirmation.trim().toLowerCase() === cell.text.trim().toLowerCase())
    );

  const handleCellClick = (cell: BingoCell) => {
    if (!isInteractive) return;

    if (cell.isFreeSpace) {
      // Free space is always daubed
      return;
    }

    if (cell.isMarked) {
      // Un-daub with click
      sounds.playPop(0.9);
      onToggleCell(cell.row, cell.col);
    } else {
      // Never open reflection modal if ball hasn't been drawn yet — delegate to parent rejection handler
      if (!isCellBallDrawn(cell)) {
        sounds.playClick();
        onToggleCell(cell.row, cell.col);
        return;
      }

      // If numbers mode without long prompts, direct daub with option to add story
      if (displayMode === 'numbers' && !cell.text.includes('?')) {
        sounds.playDaub(cell.row, cell.col);
        onToggleCell(cell.row, cell.col);
      } else {
        // Open story note dialog to record the connection
        sounds.playPop(1.1);
        setSelectedCell(cell);
        setPartnerInput(cell.markedBy || '');
        setNoteInput(cell.storyNote || '');
      }
    }
  };

  const handleConfirmDaub = (withStory: boolean) => {
    if (!selectedCell) return;

    sounds.playDaub(selectedCell.row, selectedCell.col);
    const partner = withStory ? partnerInput.trim() : undefined;
    const note = withStory ? noteInput.trim() : undefined;

    onToggleCell(selectedCell.row, selectedCell.col, partner, note);
    setSelectedCell(null);
    setPartnerInput('');
    setNoteInput('');
  };

  const headers = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Top Header: Player name, Card # and Display Mode Switcher */}
      <div className="flex items-center justify-between w-full mb-2 px-1">
        <div className="flex items-center gap-2">
          {playerName && (
            <span className="text-xs font-heading font-bold text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/30">
              {playerName}
            </span>
          )}
          {totalCards > 1 && (
            <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/40">
              {ui.cardNumberPrefix}{cardIndex + 1} / {totalCards}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Display Mode Switcher: Numbers vs Prompts vs Both */}
          {onChangeDisplayMode && (
          <div className="flex items-center gap-1 p-0.5 bg-black/50 border border-amber-500/20 rounded-lg">
            <button
              onClick={() => {
                sounds.playClick();
                onChangeDisplayMode('numbers');
              }}
              className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                displayMode === 'numbers'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
              title={ui.fmtNumbers}
            >
              {ui.fmtNumbers}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onChangeDisplayMode('both');
              }}
              className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                displayMode === 'both'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
              title={ui.fmtBoth}
            >
              {ui.fmtBoth}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onChangeDisplayMode('prompts');
              }}
              className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                displayMode === 'prompts'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
              title={ui.fmtPrompts}
            >
              {ui.fmtPrompts}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Blender Ball Callout Strip: Displays the latest ball & word rolled in the blender */}
      {currentBall && (
        <div className="w-full mb-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-black/80 border-2 border-amber-400/60 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 3D Ball Sphere */}
            <div
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center font-black text-white shadow-md border-2 border-white/70 shrink-0 transform transition-transform animate-bounce"
              style={{
                background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentBall.color || '#f59e0b'} 55%, #0f172a 100%)`,
                boxShadow: `0 0 16px ${currentBall.color || '#f59e0b'}88`,
              }}
            >
              <span className="text-[9px] leading-none opacity-90">{currentBall.letter}</span>
              <span className="text-sm leading-none font-black">{currentBall.number}</span>
            </div>

            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300/80">
                  {ui.lastFromDrum}
                </span>
                <span className="text-xs font-heading font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                  {currentBall.letter}-{currentBall.number}
                </span>
              </div>
              <span className="text-xs text-amber-100 font-bold truncate">
                &ldquo;{currentBall.affirmation}&rdquo;
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] sm:text-xs font-bold text-amber-200 flex items-center gap-1">
              <span>👀</span>
              <span className="hidden sm:inline">{ui.scanAndTap}</span>
              <span className="sm:hidden">{ui.physicalConfirmHint}</span>
            </span>
          </div>
        </div>
      )}

      {/* Card Header Strip: B - I - N - G - O with Number ranges */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full mb-1.5 sm:mb-2 text-center">
        {headers.map((letter, idx) => {
          const colors = ['#0284c7', '#7c3aed', '#059669', '#d97706', '#e11d48'];
          const ranges = ['1-15', '16-30', '31-45', '46-60', '61-75'];
          return (
            <div
              key={letter}
              className="py-1 sm:py-1.5 rounded-xl text-white font-heading font-black shadow-md transition-transform hover:scale-105 flex flex-col items-center justify-center"
              style={{
                backgroundColor: colors[idx],
                boxShadow: `0 4px 12px ${colors[idx]}44`,
              }}
            >
              <span className="text-base sm:text-lg leading-none">{letter}</span>
              <span className="text-3xs sm:text-2xs font-mono font-normal opacity-80 leading-none mt-0.5">
                {ranges[idx]}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5x5 Grid Board */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2.5 w-full bg-amber-950/40 p-1.5 sm:p-3 rounded-2xl border border-amber-500/25 backdrop-blur-md shadow-2xl">
        {card.map((rowCells, rIdx) =>
          rowCells.map((cell, cIdx) => {
            const isWin = isWinningCell(rIdx, cIdx);

            if (cell.isFreeSpace) {
              return (
                <div
                  key={`cell-${rIdx}-${cIdx}`}
                  className={`aspect-square relative p-1.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-default transition-all ${
                    isWin
                      ? 'bg-amber-400 border-amber-300 text-slate-950 ring-4 ring-amber-300/80 scale-105 shadow-xl'
                      : 'bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-black/50 border-amber-400/50 text-amber-200'
                  }`}
                >
                  <GoldenCoinLogo size="sm" />
                  <span className="font-heading font-extrabold text-2xs sm:text-xs text-amber-300 tracking-wider mt-0.5">
                    {ui.freeSpaceLabel}
                  </span>
                </div>
              );
            }

            const tooltipHAlign =
              cIdx === 0
                ? 'left-0'
                : cIdx === 4
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2';
            const tooltipVAlign = rIdx <= 1 ? 'top-full mt-1.5' : 'bottom-full mb-1.5';

            return (
              <button
                key={`cell-${rIdx}-${cIdx}`}
                type="button"
                onClick={() => handleCellClick(cell)}
                title={`${cell.letter ? `${cell.letter}-` : ''}${cell.number ?? ''}: ${cell.text}`}
                aria-label={`${cell.letter ? `${cell.letter}-` : ''}${cell.number ?? ''} ${cell.text}`}
                className={`group aspect-square relative rounded-xl border text-center transition-all duration-200 cursor-pointer active:scale-95 hover:z-30 focus-visible:z-30 ${
                  isWin
                    ? 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-200 text-slate-950 ring-4 ring-amber-300/90 shadow-2xl scale-105 z-10'
                    : cell.isMarked
                    ? 'bg-gradient-to-br from-amber-950/90 via-[#2f1f0e] to-black border-amber-400/60 shadow-lg'
                    : 'bg-black/40 hover:bg-black/60 border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                {/* Floating Hover/Focus Tooltip showing full untruncated word/prompt */}
                <div
                  role="tooltip"
                  className={`pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute ${tooltipVAlign} ${tooltipHAlign} z-50 w-44 sm:w-56 p-2.5 rounded-xl bg-[#120b06]/95 border border-amber-400/70 shadow-2xl text-left backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] font-mono font-black text-amber-300">
                      {cell.letter ? `${cell.letter}-${cell.number ?? ''}` : cell.number}
                    </span>
                    <span className="text-[10px] font-bold text-amber-200/75">
                      {cell.isMarked ? `✓ ${ui.connected}` : ui.scanAndTap}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white leading-snug break-words whitespace-normal">
                    {cell.text}
                  </div>
                </div>

                <div className="w-full h-full p-1 sm:p-2 rounded-xl overflow-hidden flex flex-col justify-between relative">
                  {/* Stamp Token Indicator when daubed */}
                  {cell.isMarked && (
                    <div className="absolute top-0.5 right-0.5 z-10 pointer-events-none">
                      <GoldenCoinLogo size="sm" />
                    </div>
                  )}

                  {/* Display Rendering based on displayMode */}
                  {displayMode === 'numbers' ? (
                    // Numerical Focus Mode: Large prominent number with joyful meaning
                    <div className="flex flex-col items-center justify-center w-full h-full my-auto">
                      <div
                        className={`font-heading font-black tabular-nums transition-transform ${
                          cell.number && cell.number > 9
                            ? 'text-xl sm:text-3xl'
                            : 'text-2xl sm:text-4xl'
                        } ${
                          isWin
                            ? 'text-slate-950'
                            : cell.isMarked
                            ? 'text-amber-400 drop-shadow'
                            : 'text-amber-100'
                        }`}
                      >
                        {cell.number ?? (rIdx * 15 + cIdx + 1)}
                      </div>
                      <div
                        className={`text-3xs line-clamp-1 font-semibold leading-tight mt-0.5 px-0.5 ${
                          isWin
                            ? 'text-slate-900'
                            : cell.isMarked
                            ? 'text-amber-300/90'
                            : 'text-amber-300/70'
                        }`}
                      >
                        {cell.text}
                      </div>
                    </div>
                  ) : displayMode === 'both' ? (
                    // Both: Number header badge + prompt text
                    <div className="flex flex-col justify-between w-full h-full text-left">
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[9px] sm:text-xs font-black tabular-nums px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded ${
                            isWin
                              ? 'bg-slate-950 text-amber-300'
                              : cell.isMarked
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {cell.letter}-{cell.number ?? (rIdx * 15 + cIdx + 1)}
                        </span>
                      </div>

                      <p
                        className={`text-[8px] sm:text-2xs line-clamp-2 leading-tight my-auto ${
                          isWin
                            ? 'text-slate-950 font-bold'
                            : cell.isMarked
                            ? 'text-amber-100 font-semibold'
                            : 'text-amber-100/90 font-normal'
                        }`}
                      >
                        {cell.text}
                      </p>

                      {cell.markedBy && (
                        <div className="text-3xs truncate px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-medium">
                          {ui.withLabel} {cell.markedBy}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Prompts Focus Mode
                    <div className="flex flex-col justify-between w-full h-full text-left">
                      <span className="text-3xs font-mono text-amber-400/50">
                        {cell.letter}-{cell.number ?? ''}
                      </span>
                      <p
                        className={`text-3xs sm:text-2xs line-clamp-3 leading-tight my-auto ${
                          isWin
                            ? 'text-slate-950 font-bold'
                            : cell.isMarked
                            ? 'text-amber-100 font-semibold'
                            : 'text-amber-100/80 font-normal'
                        }`}
                      >
                        {cell.text}
                      </p>
                      {cell.markedBy && (
                        <div className="text-3xs truncate px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-medium">
                          {ui.withLabel} {cell.markedBy}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Story & Reflection Modal when tapping a tile */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#191109] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-amber-50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">💛</span>
                <h3 className="font-heading font-bold text-base text-amber-200">
                  {ui.markConfirmTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 text-amber-300 hover:text-amber-100 cursor-pointer"
                title={ui.close}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-center">
              {selectedCell.letter && selectedCell.number && (
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  {selectedCell.letter}-{selectedCell.number}
                </div>
              )}
              <p className="font-heading font-semibold text-sm text-amber-100">
                &ldquo;{selectedCell.text}&rdquo;
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
                  {ui.partnerNameLabel}
                </label>
                <input
                  type="text"
                  value={partnerInput}
                  onChange={(e) => setPartnerInput(e.target.value)}
                  placeholder={ui.partnerPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
                  {ui.storyLabel}
                </label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={2}
                  placeholder={ui.storyPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => handleConfirmDaub(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/40 border border-amber-500/30 text-amber-200 hover:bg-black/60 cursor-pointer"
              >
                {ui.quickDaubBtn}
              </button>
              <button
                onClick={() => handleConfirmDaub(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>{ui.recordStoryBtn}</span>
                <span>✨</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
