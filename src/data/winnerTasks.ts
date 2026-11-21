/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WinnerTask {
  id: string;
  type: 'line1' | 'line2' | 'bingo';
  headline: string;
  task: string;
  icon: string;
  sparkReward: number;
}

export const WINNER_TASKS_LINE_1: WinnerTask[] = [
  {
    id: 'l1-hug',
    type: 'line1',
    headline: '1. Rekke Fullført!',
    task: 'Gi en god og varm klem til den som fortjener det aller mest!',
    icon: '🤗',
    sparkReward: 150,
  },
  {
    id: 'l1-highfive',
    type: 'line1',
    headline: '1. Rekke Fullført!',
    task: 'Gå bort og gi noen i rommet en skikkelig "I ❤️ IT" high-five eller tommel-opp!',
    icon: '🙌',
    sparkReward: 150,
  },
  {
    id: 'l1-appreciation',
    type: 'line1',
    headline: '1. Rekke Fullført!',
    task: 'Nevn én ting du oppriktig setter pris på ved personen nærmest deg.',
    icon: '💖',
    sparkReward: 150,
  },
  {
    id: 'l1-memory',
    type: 'line1',
    headline: '1. Rekke Fullført!',
    task: 'Fortell et lite, lunt minne som alltid får deg til å smile.',
    icon: '☀️',
    sparkReward: 150,
  },
  {
    id: 'l1-coffee',
    type: 'line1',
    headline: '1. Rekke Fullført!',
    task: 'Gjør en vennlig gest: Tilby et glass vann, kaffe eller en hyggelig hilsen til en venn.',
    icon: '☕',
    sparkReward: 150,
  },
];

export const WINNER_TASKS_LINE_2: WinnerTask[] = [
  {
    id: 'l2-applause',
    type: 'line2',
    headline: '3. Rekker Fullført!',
    task: 'Få med hele rommet på et felles gledesrop eller en stor felles applaus for alle!',
    icon: '👏',
    sparkReward: 300,
  },
  {
    id: 'l2-rolemodel',
    type: 'line2',
    headline: '3. Rekker Fullført!',
    task: 'Fortell om en person som har vært et godt og kjært forbilde for deg i livet.',
    icon: '🌟',
    sparkReward: 300,
  },
  {
    id: 'l2-laugh',
    type: 'line2',
    headline: '3. Rekker Fullført!',
    task: 'Del en morsom historie eller en liten flause som alle kan le godt av sammen.',
    icon: '😄',
    sparkReward: 300,
  },
  {
    id: 'l2-message',
    type: 'line2',
    headline: '3. Rekker Fullført!',
    task: 'Send en hyggelig "tenker på deg"-melding til en venn du ikke har snakket med på en stund.',
    icon: '💌',
    sparkReward: 300,
  },
];

export const WINNER_TASKS_BINGO: WinnerTask[] = [
  {
    id: 'bingo-celebrate',
    type: 'bingo',
    headline: 'BINGO Triumf!',
    task: 'KRONING: Reis deg opp, rop et rungende BINGO, og del ut en varm klem og seierssmil til hele rommet!',
    icon: '👑',
    sparkReward: 1000,
  },
  {
    id: 'bingo-toast',
    type: 'bingo',
    headline: 'BINGO Triumf!',
    task: 'Hold en 10-sekunders hedersskål for det gode fellesskapet og alle som har deltatt!',
    icon: '🥂',
    sparkReward: 1000,
  },
  {
    id: 'bingo-caller',
    type: 'bingo',
    headline: 'BINGO Triumf!',
    task: 'Velg en medspiller som skal få æren av å trekke de neste lykkekulene fra trommelen!',
    icon: '🎲',
    sparkReward: 1000,
  },
];

export function getWinnerTaskForLines(lines: number, isFullHouse: boolean = false): WinnerTask {
  try {
    const raw = localStorage.getItem('joypulse_owner_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (lines === 1 && !isFullHouse && parsed.customWinnerTaskLine1) {
        return {
          id: 'custom-line-1',
          type: 'line1',
          headline: '1. Rekke Fullført!',
          task: parsed.customWinnerTaskLine1,
          icon: '🤗',
          sparkReward: 150,
        };
      }
      if (lines >= 3 && !isFullHouse && parsed.customWinnerTaskLine2) {
        return {
          id: 'custom-line-3',
          type: 'line2',
          headline: '3. Rekker Fullført!',
          task: parsed.customWinnerTaskLine2,
          icon: '👏',
          sparkReward: 300,
        };
      }
      if (isFullHouse && parsed.customWinnerTaskBingo) {
        return {
          id: 'custom-bingo',
          type: 'bingo',
          headline: 'BINGO Triumf!',
          task: parsed.customWinnerTaskBingo,
          icon: '👑',
          sparkReward: 1000,
        };
      }
    }
  } catch {
    // Fall back to built-in presets
  }

  if (isFullHouse) {
    return WINNER_TASKS_BINGO[Math.floor(Math.random() * WINNER_TASKS_BINGO.length)];
  } else if (lines >= 3) {
    return WINNER_TASKS_LINE_2[Math.floor(Math.random() * WINNER_TASKS_LINE_2.length)];
  } else {
    return WINNER_TASKS_LINE_1[Math.floor(Math.random() * WINNER_TASKS_LINE_1.length)];
  }
}
