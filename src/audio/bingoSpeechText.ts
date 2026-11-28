/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLanguage } from '../services/i18n';

const LETTER_WORDS: Record<SupportedLanguage, Record<string, string>> = {
  nb: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  en: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  sv: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  de: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  es: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  fr: { B: 'B', I: 'I', N: 'N', G: 'G', O: 'O' },
  ar: { B: 'باء', I: 'آي', N: 'إن', G: 'جي', O: 'أو' },
  ti: { B: 'ቢ', I: 'ኣይ', N: 'ኤን', G: 'ጂ', O: 'ኦ' },
};

function numberToNorwegianWords(n: number): string {
  const ones = [
    '', 'én', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni',
    'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten',
  ];
  const tens = ['', '', 'tjue', 'tretti', 'førti', 'femti', 'seksti', 'sytti'];
  if (n < 20) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${tens[t]}${ones[u]}`;
}

function numberToSwedishWords(n: number): string {
  const ones = [
    '', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio',
    'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton',
  ];
  const tens = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio'];
  if (n < 20) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${tens[t]}${ones[u]}`;
}

function numberToEnglishWords(n: number): string {
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy'];
  if (n < 20) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${tens[t]}-${ones[u]}`;
}

function numberToGermanWords(n: number): string {
  const ones = [
    '', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
    'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn',
  ];
  const unitJoin = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig'];
  if (n < 20) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${unitJoin[u]}und${tens[t]}`;
}

function numberToSpanishWords(n: number): string {
  const special: Record<number, string> = {
    1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
    6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco',
    26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve',
  };
  if (special[n]) return special[n];
  const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta'];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${tens[t]} y ${special[u]}`;
}

function numberToFrenchWords(n: number): string {
  const ones = [
    '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
  ];
  if (n < 20) return ones[n] || String(n);
  if (n >= 70) {
    const rem = n - 60;
    if (rem === 11) return 'soixante et onze';
    return `soixante-${ones[rem]}`;
  }
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return tens[t];
  if (u === 1) return `${tens[t]} et un`;
  return `${tens[t]}-${ones[u]}`;
}

function numberToArabicWords(n: number): string {
  const ones = [
    '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
  ];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون'];
  if (n < 20) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? tens[t] : `${ones[u]} و${tens[t]}`;
}

function numberToTigrinyaWords(n: number): string {
  const ones = [
    '', 'ሓደ', 'ክልተ', 'ሰለስተ', 'ኣርባዕተ', 'ሓሙሽተ', 'ሽዱሽተ', 'ሸውዓተ', 'ሸሞንተ', 'ትሽዓተ',
  ];
  const tens = ['', 'ዓሰርተ', 'ዒስራ', 'ሰላሳ', 'ኣርብዓ', 'ሓምሳ', 'ሱሳ', 'ሰብዓ'];
  if (n < 10) return ones[n] || String(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return tens[t];
  if (t === 1) return `ዓሰርተ ${ones[u]}`;
  return `${tens[t]}ን ${ones[u]}ን`;
}

export function formatBingoBallSpeech(letter: string, number: number, lang: SupportedLanguage): string {
  const cleanLetter = String(letter || '').trim().toUpperCase();
  const localizedLetter = LETTER_WORDS[lang]?.[cleanLetter] || cleanLetter;
  const num = Math.trunc(Number(number));
  if (!Number.isInteger(num) || num < 1 || num > 75) {
    return `${localizedLetter}. ${number}`;
  }

  let numberWord = String(num);
  switch (lang) {
    case 'nb':
      numberWord = numberToNorwegianWords(num);
      break;
    case 'sv':
      numberWord = numberToSwedishWords(num);
      break;
    case 'en':
      numberWord = numberToEnglishWords(num);
      break;
    case 'de':
      numberWord = numberToGermanWords(num);
      break;
    case 'es':
      numberWord = numberToSpanishWords(num);
      break;
    case 'fr':
      numberWord = numberToFrenchWords(num);
      break;
    case 'ar':
      numberWord = numberToArabicWords(num);
      break;
    case 'ti':
      numberWord = numberToTigrinyaWords(num);
      break;
  }

  if (lang === 'ar' || lang === 'ti') {
    return `${localizedLetter}، ${numberWord}`;
  }
  return `${localizedLetter}. ${numberWord}`;
}
