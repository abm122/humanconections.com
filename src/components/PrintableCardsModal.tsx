/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BingoTheme, CardDisplayMode } from '../types/bingo';
import { THEMES, JOYFUL_BALLS_MAP, shuffleArray } from '../data/prompts';
import { sounds } from '../audio/soundEngine';

interface PrintableCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTheme?: BingoTheme;
}

export const PrintableCardsModal: React.FC<PrintableCardsModalProps> = ({
  isOpen,
  onClose,
  defaultTheme = 'classic_joy',
}) => {
  const [theme, setTheme] = useState<BingoTheme>(defaultTheme);
  const [cardCount, setCardCount] = useState<number>(4);
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>('numbers');
  const [seed, setSeed] = useState<number>(1);

  if (!isOpen) return null;

  const currentTheme = THEMES[theme];
  const allPrompts = currentTheme.prompts.length > 0 
    ? currentTheme.prompts 
    : THEMES.heartfelt.prompts;

  // Generate distinct randomized numerical 75-ball or prompt cards
  const generateSingleCardData = () => {
    // Generate Column B (1-15), I (16-30), N (31-45), G (46-60), O (61-75)
    const bPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 1)).slice(0, 5);
    const iPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 16)).slice(0, 5);
    const nPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 31)).slice(0, 4);
    const gPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 46)).slice(0, 5);
    const oPool = shuffleArray(Array.from({ length: 15 }, (_, i) => i + 61)).slice(0, 5);

    const promptsShuffled = shuffleArray(allPrompts);

    const grid = [];
    let pIdx = 0;
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 5; c++) {
        const isCenter = r === 2 && c === 2;
        if (isCenter) {
          row.push({
            isCenter: true,
            num: 0,
            text: 'FREE JOY',
            letter: 'N',
          });
        } else {
          let num = 0;
          let letter: 'B' | 'I' | 'N' | 'G' | 'O' = 'B';
          if (c === 0) { num = bPool[r]; letter = 'B'; }
          else if (c === 1) { num = iPool[r]; letter = 'I'; }
          else if (c === 2) { num = nPool[r > 2 ? r - 1 : r]; letter = 'N'; }
          else if (c === 3) { num = gPool[r]; letter = 'G'; }
          else { num = oPool[r]; letter = 'O'; }

          const ballAffirmation = JOYFUL_BALLS_MAP.find((b) => b.number === num)?.affirmation || '';
          const promptText = promptsShuffled[pIdx % promptsShuffled.length];
          pIdx++;

          row.push({
            isCenter: false,
            num,
            letter,
            affirmation: ballAffirmation,
            promptText,
          });
        }
      }
      grid.push(row);
    }
    return grid;
  };

  const cards = Array.from({ length: cardCount }).map((_, cardIdx) => ({
    cardId: cardIdx + 1,
    grid: generateSingleCardData(),
  }));

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleShuffle = () => {
    sounds.playPop(1.2);
    setSeed((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#171009] border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-amber-50 max-h-[92vh] flex flex-col">
        {/* Modal Controls Bar (Hidden during actual print) */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-amber-500/20 gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-amber-200">
              Printable Bingo Cards (Numerous & Numerical)
            </h2>
            <p className="text-xs text-amber-300/60">
              Generate numerous randomized cards with standard 1-75 numbers or social prompts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format: Numbers vs Prompts */}
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as CardDisplayMode)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs text-amber-100 focus:outline-none"
            >
              <option value="numbers">Numbers (B1-O75)</option>
              <option value="both">Numbers + Meaning</option>
              <option value="prompts">Prompts Only</option>
            </select>

            {/* Numerous count */}
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs text-amber-100 focus:outline-none"
            >
              <option value={1}>1 Card</option>
              <option value={2}>2 Cards</option>
              <option value={4}>4 Cards</option>
              <option value={8}>8 Cards</option>
              <option value={12}>12 Cards (Party Pack)</option>
              <option value={24}>24 Cards (Crowd Pack)</option>
            </select>

            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:text-amber-100 cursor-pointer"
              title="Shuffle numbers on all cards"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print {cardCount} Cards</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 text-amber-300 hover:text-amber-100 rounded-lg cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Cards Scroll Area */}
        <div key={seed} className="flex-1 overflow-y-auto py-4 space-y-8 pr-1">
          {cards.map((card) => (
            <div
              key={card.cardId}
              className="printable-card p-6 rounded-2xl bg-white text-slate-900 border-2 border-amber-600/40 shadow-xl max-w-2xl mx-auto"
            >
              {/* Card Header */}
              <div className="text-center pb-3 border-b-2 border-amber-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                    JoyPulse Bingo · Card #{card.cardId}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Player Name: ______________________
                  </span>
                </div>
                <h3 className="font-display text-2xl font-black text-amber-900 mt-1">
                  {displayMode === 'numbers' ? 'Classic 75-Ball Joy Bingo' : currentTheme.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {displayMode === 'numbers'
                    ? 'Match the called numbers (B1-15, I16-30, N31-45, G46-60, O61-75) and celebrate joyful affirmations!'
                    : 'Find someone who matches each prompt, hear their story, and write their initials!'}
                </p>
              </div>

              {/* B-I-N-G-O Letters with ranges */}
              <div className="grid grid-cols-5 gap-1 text-center my-2">
                {[
                  { l: 'B', r: '1-15' },
                  { l: 'I', r: '16-30' },
                  { l: 'N', r: '31-45' },
                  { l: 'G', r: '46-60' },
                  { l: 'O', r: '61-75' },
                ].map((item) => (
                  <div key={item.l} className="py-1 bg-amber-500 text-slate-950 font-black text-sm rounded flex flex-col items-center">
                    <span>{item.l}</span>
                    <span className="text-3xs font-mono font-normal opacity-90">{item.r}</span>
                  </div>
                ))}
              </div>

              {/* 5x5 Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {card.grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    if (cell.isCenter) {
                      return (
                        <div
                          key={`print-${rIdx}-${cIdx}`}
                          className="aspect-square p-2 bg-amber-100 border-2 border-amber-500 rounded-lg flex flex-col items-center justify-center text-center"
                        >
                          <span className="text-lg">☀️</span>
                          <span className="text-2xs font-black text-amber-800 tracking-wider">
                            FREE JOY
                          </span>
                        </div>
                      );
                    }

                    if (displayMode === 'numbers') {
                      return (
                        <div
                          key={`print-${rIdx}-${cIdx}`}
                          className="aspect-square p-1.5 bg-amber-50/70 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-center"
                        >
                          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                            {cell.num}
                          </div>
                          <div className="text-3xs text-amber-800 font-semibold truncate w-full mt-0.5">
                            {cell.affirmation}
                          </div>
                        </div>
                      );
                    }

                    if (displayMode === 'both') {
                      return (
                        <div
                          key={`print-${rIdx}-${cIdx}`}
                          className="aspect-square p-1 bg-amber-50/70 border border-slate-300 rounded-lg flex flex-col justify-between text-left"
                        >
                          <span className="text-2xs font-black text-slate-900 tabular-nums">
                            {cell.letter}-{cell.num}
                          </span>
                          <span className="text-3xs text-slate-800 font-medium leading-tight line-clamp-2">
                            {cell.promptText || cell.affirmation}
                          </span>
                          <span className="text-3xs text-slate-400">Initials: ___</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`print-${rIdx}-${cIdx}`}
                        className="aspect-square p-1.5 bg-amber-50/70 border border-slate-300 rounded-lg flex flex-col justify-between text-left"
                      >
                        <span className="text-3xs text-slate-800 font-medium leading-tight">
                          {cell.promptText}
                        </span>
                        <div className="text-3xs text-slate-400 border-t border-slate-200 pt-0.5 mt-0.5">
                          Initials: _____
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer instruction line */}
              <div className="text-center text-3xs text-slate-500 pt-3 border-t border-slate-200 mt-3 flex justify-between">
                <span>Rules: 5 in a row horizontally, vertically, or diagonally = BINGO!</span>
                <span>JoyPulse Bingo Game · High Quality Print</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
