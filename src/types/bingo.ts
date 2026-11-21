/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export type GameMode = 'ALL_IN_ONE' | 'HUMAN_BINGO' | 'CALLER_CAGE' | 'PASS_PLAY';

export type BingoTheme = 
  | 'heartfelt'      // Deep connection, vulnerability, warmth
  | 'laughter'       // Playful quirks, silly fun, energetic memories
  | 'kindness'       // Acts of compassion, support, community
  | 'gratitude'      // Reflection, wisdom, appreciation
  | 'ril'            // RIL: Relasjon, Inkludering, Livsglede & Lek
  | 'classic_joy'    // 75 numbers paired with uplifting affirmations
  | 'family_kids';   // Familie & Barn: Morsomme oppgaver og lek med verten

export interface BingoCell {
  id: string;
  row: number;
  col: number;
  text: string;
  letter?: 'B' | 'I' | 'N' | 'G' | 'O';
  number?: number;
  isFreeSpace?: boolean;
  isMarked: boolean;
  markedBy?: string; // Player name or story partner
  storyNote?: string;
  markedAt?: number;
}

export type CardDisplayMode = 'numbers' | 'prompts' | 'both';

export type BingoMilestone = 'line1' | 'line3' | 'fullbrett';

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  cards: BingoCell[][][]; // Supports 1, 2, or 4 simultaneous cards!
  activeCardIndex: number;
  linesCompleted: number;
  hasBingo: boolean;
  claimedMilestones?: BingoMilestone[];
}

export interface CalledBall {
  letter: 'B' | 'I' | 'N' | 'G' | 'O';
  number: number;
  affirmation: string;
  color: string;
  timestamp: number;
}

export interface WinPattern {
  name: string;
  description: string;
  coords: { row: number; col: number }[];
}
