/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SupportedLanguage } from '../services/i18n';

export interface WinnerTask {
  id: string;
  type: 'line1' | 'line2' | 'bingo';
  headline: string;
  task: string;
  icon: string;
  sparkReward: number;
}

const TASKS_BY_LANG: Record<
  SupportedLanguage,
  { line1: WinnerTask[]; line2: WinnerTask[]; bingo: WinnerTask[] }
> = {
  nb: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1. Rekke Fullført!', task: 'Gi en god og varm klem til den som fortjener det aller mest!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1. Rekke Fullført!', task: 'Gå bort og gi noen i rommet en skikkelig high-five eller tommel-opp!', icon: '🙌', sparkReward: 150 },
      { id: 'l1-appreciation', type: 'line1', headline: '1. Rekke Fullført!', task: 'Nevn én ting du oppriktig setter pris på ved personen nærmest deg.', icon: '💖', sparkReward: 150 },
      { id: 'l1-memory', type: 'line1', headline: '1. Rekke Fullført!', task: 'Fortell et lite, lunt minne som alltid får deg til å smile.', icon: '☀️', sparkReward: 150 },
      { id: 'l1-coffee', type: 'line1', headline: '1. Rekke Fullført!', task: 'Gjør en vennlig gest: Tilby et glass vann, kaffe eller en hyggelig hilsen til en venn.', icon: '☕', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3. Rekker Fullført!', task: 'Få med hele rommet på et felles gledesrop eller en stor felles applaus for alle!', icon: '👏', sparkReward: 300 },
      { id: 'l2-rolemodel', type: 'line2', headline: '3. Rekker Fullført!', task: 'Fortell om en person som har vært et godt og kjært forbilde for deg i livet.', icon: '🌟', sparkReward: 300 },
      { id: 'l2-laugh', type: 'line2', headline: '3. Rekker Fullført!', task: 'Del en morsom historie eller en liten flause som alle kan le godt av sammen.', icon: '😄', sparkReward: 300 },
      { id: 'l2-message', type: 'line2', headline: '3. Rekker Fullført!', task: 'Send en hyggelig «tenker på deg»-melding til en venn du ikke har snakket med på en stund.', icon: '💌', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'BINGO Triumf!', task: 'KRONING: Reis deg opp, rop et rungende BINGO, og del ut en varm klem og seierssmil til hele rommet!', icon: '👑', sparkReward: 1000 },
      { id: 'bingo-toast', type: 'bingo', headline: 'BINGO Triumf!', task: 'Hold en 10-sekunders hedersskål for det gode fellesskapet og alle som har deltatt!', icon: '🥂', sparkReward: 1000 },
      { id: 'bingo-caller', type: 'bingo', headline: 'BINGO Triumf!', task: 'Velg en medspiller som skal få æren av å trekke de neste lykkekulene fra trommelen!', icon: '🎲', sparkReward: 1000 },
    ],
  },
  en: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1st Line Completed!', task: 'Give a warm hug or kind word to someone who deserves it today!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1st Line Completed!', task: 'Give someone in the room a cheerful high-five or thumbs up!', icon: '🙌', sparkReward: 150 },
      { id: 'l1-appreciation', type: 'line1', headline: '1st Line Completed!', task: 'Share one thing you genuinely appreciate about the person nearest you.', icon: '💖', sparkReward: 150 },
      { id: 'l1-memory', type: 'line1', headline: '1st Line Completed!', task: 'Tell a short, heartwarming memory that always makes you smile.', icon: '☀️', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3 Lines Completed!', task: 'Lead the whole room in a big cheer or warm round of applause!', icon: '👏', sparkReward: 300 },
      { id: 'l2-rolemodel', type: 'line2', headline: '3 Lines Completed!', task: 'Tell everyone about a person who has been a wonderful role model for you.', icon: '🌟', sparkReward: 300 },
      { id: 'l2-laugh', type: 'line2', headline: '3 Lines Completed!', task: 'Share a funny story everyone can enjoy and laugh about together.', icon: '😄', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'BINGO Triumph!', task: 'CROWN MOMENT: Stand up, shout BINGO, and share a big smile with the whole room!', icon: '👑', sparkReward: 1000 },
      { id: 'bingo-toast', type: 'bingo', headline: 'BINGO Triumph!', task: 'Give a joyful 10-second toast to everyone playing together!', icon: '🥂', sparkReward: 1000 },
    ],
  },
  sv: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1 rad klar!', task: 'Ge en varm kram eller vänligt ord till någon som förtjänar det!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1 rad klar!', task: 'Ge någon i rummet en glad high-five eller tummen upp!', icon: '🙌', sparkReward: 150 },
      { id: 'l1-appreciation', type: 'line1', headline: '1 rad klar!', task: 'Nämn en sak du uppskattar hos personen bredvid dig.', icon: '💖', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3 rader klara!', task: 'Få med hela rummet på en stor gemensam applåd!', icon: '👏', sparkReward: 300 },
      { id: 'l2-laugh', type: 'line2', headline: '3 rader klara!', task: 'Dela ett roligt minne som får alla att le tillsammans.', icon: '😄', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'BINGO Triumf!', task: 'KRÖNING: Res dig, ropa BINGO och ge ett stort segerleende till alla!', icon: '👑', sparkReward: 1000 },
      { id: 'bingo-toast', type: 'bingo', headline: 'BINGO Triumf!', task: 'Utbringa en glad skål för gemenskapen och alla spelare!', icon: '🥂', sparkReward: 1000 },
    ],
  },
  de: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1. Reihe vollständig!', task: 'Schenke jemandem ein herzliches Lächeln oder eine Umarmung!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1. Reihe vollständig!', task: 'Gib einem Mitspieler ein fröhliches High-Five!', icon: '🙌', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3 Reihen vollständig!', task: 'Stimme gemeinsam mit allen einen großen Applaus an!', icon: '👏', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'BINGO Triumph!', task: 'Steh auf, rufe laut BINGO und feiere gemeinsam mit der ganzen Runde!', icon: '👑', sparkReward: 1000 },
    ],
  },
  es: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '¡1.ª Línea completada!', task: '¡Regala una sonrisa cálida o un abrazo a quien esté cerca de ti!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '¡1.ª Línea completada!', task: '¡Choca esos cinco con alguien en la sala!', icon: '🙌', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '¡3 Líneas completadas!', task: '¡Anima a toda la sala a dar un gran aplauso juntos!', icon: '👏', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: '¡Triunfo BINGO!', task: 'Levántate, grita ¡BINGO! y comparte una gran sonrisa con todos.', icon: '👑', sparkReward: 1000 },
    ],
  },
  fr: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1re Ligne complétée !', task: 'Offrez un sourire chaleureux ou un compliment à votre voisin !', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1re Ligne complétée !', task: 'Faites un joyeux check à un autre joueur !', icon: '🙌', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3 Lignes complétées !', task: 'Lancez de grands applaudissements pour toute la salle !', icon: '👏', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'Triomphe BINGO !', task: 'Levez-vous, criez BINGO et célébrez avec tout le groupe !', icon: '👑', sparkReward: 1000 },
    ],
  },
  ti: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: '1ይ መስመር ተወዲኡ!', task: 'ንዝቐረበካ ሰብ ጽቡቕ ፍሽኽታ ወይ ምስጋና ሃብ!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: '1ይ መስመር ተወዲኡ!', task: 'ምስ ሓደ ተጻዋታይ ብሓጐስ ኢድካ ተጣቓዕ!', icon: '🙌', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: '3 መስመራት ተወዲኦም!', task: 'ምስ ኩሉ ክፍሊ ብሓባር ዓቢ ጣቕዒት ግበሩ!', icon: '👏', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'BINGO ዓወት!', task: 'ተንስእ፣ BINGO በል እሞ ምስ ኩሎም ተሓጐስ!', icon: '👑', sparkReward: 1000 },
    ],
  },
  ar: {
    line1: [
      { id: 'l1-hug', type: 'line1', headline: 'اكتمل الخط الأول!', task: 'قدّم ابتسامة دافئة أو كلمة طيبة لمن يجلس بجانبك!', icon: '🤗', sparkReward: 150 },
      { id: 'l1-highfive', type: 'line1', headline: 'اكتمل الخط الأول!', task: 'شارك صديقًا تصفيقًا أو تحية حارة!', icon: '🙌', sparkReward: 150 },
    ],
    line2: [
      { id: 'l2-applause', type: 'line2', headline: 'اكتملت 3 خطوط!', task: 'شارك الجميع تصفيقًا حارًا احتفالاً بالفرح الجماعي!', icon: '👏', sparkReward: 300 },
    ],
    bingo: [
      { id: 'bingo-celebrate', type: 'bingo', headline: 'انتصار بينغو!', task: 'قف وصِح بينغو وشارك الجميع فرحة الفوز!', icon: '👑', sparkReward: 1000 },
    ],
  },
};

export const WINNER_TASKS_LINE_1: WinnerTask[] = TASKS_BY_LANG.nb.line1;
export const WINNER_TASKS_LINE_2: WinnerTask[] = TASKS_BY_LANG.nb.line2;
export const WINNER_TASKS_BINGO: WinnerTask[] = TASKS_BY_LANG.nb.bingo;

export function getWinnerTaskForLines(
  lines: number,
  isFullHouse: boolean = false,
  lang: SupportedLanguage = 'nb'
): WinnerTask {
  if (lang === 'nb') {
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
  }

  const bank = TASKS_BY_LANG[lang] || TASKS_BY_LANG.nb;
  if (isFullHouse) {
    return bank.bingo[Math.floor(Math.random() * bank.bingo.length)];
  } else if (lines >= 3) {
    return bank.line2[Math.floor(Math.random() * bank.line2.length)];
  } else {
    return bank.line1[Math.floor(Math.random() * bank.line1.length)];
  }
}
