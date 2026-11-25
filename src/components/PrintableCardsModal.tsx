/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BingoTheme, CardDisplayMode } from '../types/bingo';
import { THEMES, JOYFUL_BALLS_MAP, shuffleArray } from '../data/prompts';
import { MUSIC_BINGO_SONGS, generateMusicBingoCard } from '../data/musicBingoSongs';
import { sounds } from '../audio/soundEngine';

export type PrintableMode = CardDisplayMode | 'music_bingo';

interface PrintableCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTheme?: BingoTheme;
  initialMode?: PrintableMode;
  initialCount?: number;
}

export const PrintableCardsModal: React.FC<PrintableCardsModalProps> = ({
  isOpen,
  onClose,
  defaultTheme = 'classic_joy',
  initialMode,
  initialCount,
}) => {
  const [theme] = useState<BingoTheme>(defaultTheme);
  const [cardCount, setCardCount] = useState<number>(initialCount || 50);
  const [displayMode, setDisplayMode] = useState<PrintableMode>(initialMode || 'music_bingo');
  const [includeHostChecklist, setIncludeHostChecklist] = useState<boolean>(true);
  const [seed, setSeed] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      if (initialMode) setDisplayMode(initialMode);
      if (initialCount) setCardCount(initialCount);
    }
  }, [isOpen, initialMode, initialCount]);

  if (!isOpen) return null;

  const currentTheme = THEMES[theme];
  const allPrompts = currentTheme.prompts.length > 0
    ? currentTheme.prompts
    : THEMES.heartfelt.prompts;

  // Generate distinct randomized numerical 75-ball or prompt cards
  const generateSingleCardData = () => {
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
            text: 'FRI GLEDE',
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

  const numberCards =
    displayMode !== 'music_bingo'
      ? Array.from({ length: cardCount }).map((_, cardIdx) => ({
          cardId: cardIdx + 1,
          grid: generateSingleCardData(),
        }))
      : [];

  const musicCards =
    displayMode === 'music_bingo'
      ? Array.from({ length: cardCount }).map((_, cardIdx) =>
          generateMusicBingoCard(cardIdx + 1, seed)
        )
      : [];

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleShuffle = () => {
    sounds.playPop(1.2);
    setSeed((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 print:static print:inset-auto print:block print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="relative w-full max-w-4xl bg-[#171009] border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-amber-50 max-h-[92vh] flex flex-col print:static print:max-w-none print:max-h-none print:h-auto print:overflow-visible print:bg-white print:text-black print:border-0 print:shadow-none print:p-0 print:block">
        {/* Modal Controls Bar (Hidden during actual print) */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-amber-500/20 gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-amber-200">
              🖨️ Skriv ut Bingobrett (Stor sal 50+ · Musikkbingo &amp; Tallbingo)
            </h2>
            <p className="text-xs text-amber-300/75">
              Lag opptil 100 unike brett med stor, tydelig skrift for eldre og forsamlinger på papir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format: Music Bingo vs Numbers vs Prompts */}
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as PrintableMode)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs font-bold text-amber-100 focus:outline-none"
            >
              <option value="music_bingo">🎵 Musikkbingo (Eldre / 50+ sal)</option>
              <option value="numbers">🎱 Tallbingo (B1–O75)</option>
              <option value="both">✨ Tall + Oppmuntring</option>
              <option value="prompts">💬 Kun Samtale-ruter</option>
            </select>

            {/* Count including 50–100 hall packs */}
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs font-bold text-amber-100 focus:outline-none"
            >
              <option value={4}>4 brett</option>
              <option value={12}>12 brett</option>
              <option value={24}>24 brett</option>
              <option value={50}>50 brett (Storsal 50+)</option>
              <option value={60}>60 brett (Storsal)</option>
              <option value={75}>75 brett (Storsal)</option>
              <option value={100}>100 brett (Storsal Maks)</option>
            </select>

            {displayMode === 'music_bingo' && (
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs font-bold text-amber-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHostChecklist}
                  onChange={(e) => setIncludeHostChecklist(e.target.checked)}
                />
                <span>Ta med vertens sangliste</span>
              </label>
            )}

            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:text-amber-100 cursor-pointer"
              title="Stokk alle brett på nytt"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Skriv ut {cardCount} brett</span>
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
        <div key={`${displayMode}-${cardCount}-${seed}`} className="flex-1 overflow-y-auto py-4 space-y-8 pr-1 print:overflow-visible print:p-0 print:space-y-6">
          {displayMode === 'music_bingo' && includeHostChecklist && (
            <div className="printable-card p-6 rounded-2xl bg-white text-slate-900 border-2 border-slate-800 shadow-xl max-w-2xl mx-auto">
              <div className="pb-3 border-b-2 border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                    Human-connection · Arrangørens Sjekkliste
                  </span>
                  <h3 className="font-display text-xl font-black text-slate-900">
                    🎵 Alle {MUSIC_BINGO_SONGS.length} sanger i Musikkbingo-bunken
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  Kryss av etter hvert som du spiller
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs">
                {MUSIC_BINGO_SONGS.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 border-b border-slate-200 py-1">
                    <span className="w-4 h-4 border border-slate-700 rounded-sm inline-block shrink-0" />
                    <span className="font-bold text-slate-900 truncate">
                      {idx + 1}. {s.title}
                    </span>
                    <span className="text-slate-600 truncate">— {s.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayMode === 'music_bingo' &&
            musicCards.map((card) => (
              <div
                key={`music-${card.cardId}`}
                className="printable-card p-5 sm:p-6 rounded-2xl bg-white text-slate-900 border-2 border-slate-800 shadow-xl max-w-2xl mx-auto"
              >
                <div className="text-center pb-3 border-b-2 border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-800 uppercase tracking-wider">
                      Human-connection · Musikkbingo Brett #{card.cardId}
                    </span>
                    <span className="text-slate-700">
                      Navn / Bord: ______________________
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-slate-950 mt-1">
                    🎵 Musikkbingo — Gode Minner &amp; Allsang
                  </h3>
                  <p className="text-xs text-slate-700 font-semibold">
                    Kryss av sangen når du hører lydklippet! 5 på rad (vannrett, loddrett eller diagonalt) = BINGO!
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mt-3">
                  {card.grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      if (cell.isCenter) {
                        return (
                          <div
                            key={`mprint-${rIdx}-${cIdx}`}
                            className="aspect-square p-2 bg-amber-100 border-2 border-slate-800 rounded-lg flex flex-col items-center justify-center text-center"
                          >
                            <span className="text-xl">🎵</span>
                            <span className="text-xs font-black text-slate-950 uppercase">
                              FRI RUTE
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">
                              Allsang!
                            </span>
                          </div>
                        );
                      }
                      const song = cell.song!;
                      return (
                        <div
                          key={`mprint-${rIdx}-${cIdx}`}
                          className="aspect-square p-1.5 bg-white border-2 border-slate-700 rounded-lg flex flex-col justify-between text-left"
                        >
                          <div className="text-xs sm:text-[13px] font-black text-slate-950 leading-tight break-words">
                            {song.title}
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 leading-tight mt-0.5">
                            {song.artist}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-center text-[11px] text-slate-600 font-semibold pt-3 border-t border-slate-300 mt-3 flex justify-between">
                  <span>Regel: 1 rekke = Premie · Fullt brett = Hovedpremie!</span>
                  <span>Human-connection · Brett #{card.cardId}</span>
                </div>
              </div>
            ))}

          {displayMode !== 'music_bingo' &&
            numberCards.map((card) => (
              <div
                key={card.cardId}
                className="printable-card p-6 rounded-2xl bg-white text-slate-900 border-2 border-amber-600/40 shadow-xl max-w-2xl mx-auto"
              >
                {/* Card Header */}
                <div className="text-center pb-3 border-b-2 border-amber-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                      Human-connection Bingo · Brett #{card.cardId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Spiller: ______________________
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-black text-amber-900 mt-1">
                    {displayMode === 'numbers' ? 'Klassisk 75-kuler Bingo' : currentTheme.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {displayMode === 'numbers'
                      ? 'Kryss av oppleste tall (B1-15, I16-30, N31-45, G46-60, O61-75) og nyt fellesskapet!'
                      : 'Finn noen som passer til ruten, hør historien deres, og skriv initialer!'}
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
                              FRI GLEDE
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
                            <div className="text-2xl font-black text-slate-900 tabular-nums">
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
                            <span className="text-3xs text-slate-400">Navn: ___</span>
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
                            Navn: _____
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer instruction line */}
                <div className="text-center text-3xs text-slate-500 pt-3 border-t border-slate-200 mt-3 flex justify-between">
                  <span>Regler: 5 på rad vannrett, loddrett eller diagonalt = BINGO!</span>
                  <span>Human-connection · Brett #{card.cardId}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
