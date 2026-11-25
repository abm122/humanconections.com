/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ADULT_QUIZ_QUESTIONS as ADULT_MC_QUESTIONS } from './quizQuestionsAdult';
import { ADULT_OPEN_TEXT_QUESTIONS } from './quizQuestionsAdultOpen';
import { ADULT_EXTRA_QUESTIONS } from './quizQuestionsAdultExtra';
import { FAMILY_QUIZ_QUESTIONS as FAMILY_MC_QUESTIONS } from './quizQuestionsFamily';
import { FAMILY_OPEN_TEXT_QUESTIONS } from './quizQuestionsFamilyOpen';
import { FAMILY_EXTRA_QUESTIONS } from './quizQuestionsFamilyExtra';
import { CHRISTMAS_MC_QUESTIONS } from './quizQuestionsChristmas';
import { CHRISTMAS_OPEN_TEXT_QUESTIONS } from './quizQuestionsChristmasOpen';
import { CHRISTMAS_EXTRA_QUESTIONS } from './quizQuestionsChristmasExtra';
import { CHRISTMAS_MIME_CARDS, QuizMimeCard } from './quizMimeWordsChristmas';
import { SENIOR_QUIZ_QUESTIONS as SENIOR_MC_AND_OPEN_QUESTIONS } from './quizQuestionsSenior';
import { SENIOR_MUSIC_QUIZ_QUESTIONS } from './quizQuestionsSeniorMusic';

export type QuizEdition = 'adult' | 'family' | 'christmas' | 'senior';

export type QuizCategory =
  | 'Musikk'
  | 'Musikk-gjetting'
  | 'Kultur'
  | 'Fans & Popkultur'
  | 'Ordlek & Humor'
  | 'Ungdomsminner'
  | 'Grenland & Skien'
  | 'Allmennkunnskap';

export type QuizQuestionType = 'multiple_choice' | 'open_text';

export interface QuizQuestion {
  id: string;
  edition: QuizEdition;
  category: QuizCategory;
  questionType?: QuizQuestionType;
  musicSongId?: string;
  musicHint?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  acceptedAnswers?: string[];
  samplePlaceholder?: string;
  wordplayJoke: string;
  hostAnswerNote: string;
}

function normalizeEditionPool(raw: QuizQuestion[], edition: QuizEdition): QuizQuestion[] {
  return raw
    .filter((q) => q.edition === edition)
    .map((q) => ({
      ...q,
      questionType: q.questionType || ('multiple_choice' as const),
    }));
}

export const ADULT_QUIZ_QUESTIONS: QuizQuestion[] = normalizeEditionPool(
  [...ADULT_MC_QUESTIONS, ...ADULT_OPEN_TEXT_QUESTIONS, ...ADULT_EXTRA_QUESTIONS],
  'adult'
);

export const FAMILY_QUIZ_QUESTIONS: QuizQuestion[] = normalizeEditionPool(
  [...FAMILY_MC_QUESTIONS, ...FAMILY_OPEN_TEXT_QUESTIONS, ...FAMILY_EXTRA_QUESTIONS],
  'family'
);

export const CHRISTMAS_QUIZ_QUESTIONS: QuizQuestion[] = normalizeEditionPool(
  [...CHRISTMAS_MC_QUESTIONS, ...CHRISTMAS_OPEN_TEXT_QUESTIONS, ...CHRISTMAS_EXTRA_QUESTIONS],
  'christmas'
);

export const SENIOR_QUIZ_QUESTIONS: QuizQuestion[] = normalizeEditionPool(
  [...SENIOR_MUSIC_QUIZ_QUESTIONS, ...SENIOR_MC_AND_OPEN_QUESTIONS],
  'senior'
);

export {
  ADULT_MC_QUESTIONS,
  ADULT_OPEN_TEXT_QUESTIONS,
  ADULT_EXTRA_QUESTIONS,
  FAMILY_MC_QUESTIONS,
  FAMILY_OPEN_TEXT_QUESTIONS,
  FAMILY_EXTRA_QUESTIONS,
  CHRISTMAS_MC_QUESTIONS,
  CHRISTMAS_OPEN_TEXT_QUESTIONS,
  CHRISTMAS_EXTRA_QUESTIONS,
  CHRISTMAS_MIME_CARDS,
  SENIOR_MUSIC_QUIZ_QUESTIONS,
};
export type { QuizMimeCard };

/**
 * Strictly returns ONLY questions belonging to the specified edition (never mixes between quizzes).
 */
export function getQuestionsForEdition(edition: QuizEdition): QuizQuestion[] {
  if (edition === 'christmas') return CHRISTMAS_QUIZ_QUESTIONS;
  if (edition === 'family') return FAMILY_QUIZ_QUESTIONS;
  if (edition === 'senior') return SENIOR_QUIZ_QUESTIONS;
  return ADULT_QUIZ_QUESTIONS;
}

/**
 * Unbiased Fisher-Yates shuffle returning a new array.
 */
export function shuffleQuizItems<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DRAWN_STORAGE_PREFIX = 'joybingo_quiz_drawn_ids_v2_';

/**
 * Reads persistent drawn question IDs strictly scoped to one quiz edition,
 * so replaying the same quiz multiple times continues through unseen questions
 * without mixing across editions.
 */
export function loadDrawnIdsForEdition(edition: QuizEdition): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const validIds = new Set(getQuestionsForEdition(edition).map((q) => q.id));
    const raw = window.localStorage.getItem(`${DRAWN_STORAGE_PREFIX}${edition}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
}

export function saveDrawnIdsForEdition(edition: QuizEdition, ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const validIds = new Set(getQuestionsForEdition(edition).map((q) => q.id));
    const cleaned = Array.from(new Set(ids)).filter((id) => validIds.has(id));
    window.localStorage.setItem(`${DRAWN_STORAGE_PREFIX}${edition}`, JSON.stringify(cleaned));
  } catch {
    // Ignore storage quota issues
  }
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  if (question.questionType === 'open_text') {
    return { ...question };
  }
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const newOptions: [string, string, string, string] = [
    question.options[indices[0]],
    question.options[indices[1]],
    question.options[indices[2]],
    question.options[indices[3]],
  ];
  const newCorrectIndex = indices.indexOf(question.correctIndex) as 0 | 1 | 2 | 3;
  const letter = LETTERS[newCorrectIndex];
  const updatedNote = question.hostAnswerNote.replace(
    /^Fasit:\s*[A-D]\)/i,
    `Fasit: ${letter})`
  );
  return {
    ...question,
    options: newOptions,
    correctIndex: newCorrectIndex,
    hostAnswerNote: updatedNote,
  };
}

export function normalizeQuizText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[«»"'.,!?():;]/g, '')
    .replace(/\s+/g, ' ');
}

export function isOpenTextAnswerCorrect(
  submittedText: string,
  acceptedAnswers: string[] = []
): boolean {
  const norm = normalizeQuizText(submittedText);
  if (!norm) return false;
  return acceptedAnswers.some((ans) => {
    const cleanAns = normalizeQuizText(ans);
    if (!cleanAns) return false;
    return norm === cleanAns || norm.includes(cleanAns) || (cleanAns.length >= 4 && cleanAns === norm);
  });
}
