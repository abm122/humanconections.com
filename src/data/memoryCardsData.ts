/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MemoryCategory = 'mixed' | 'animals' | 'characters' | 'things';

export interface MemoryItemDef {
  id: string;
  label: string;
  emoji: string;
  category: Exclude<MemoryCategory, 'mixed'>;
  surfaceClass: string;
  ringClass: string;
}

export interface MemoryCardInstance {
  uid: string;
  itemId: string;
  label: string;
  emoji: string;
  category: Exclude<MemoryCategory, 'mixed'>;
  surfaceClass: string;
  ringClass: string;
  isMatched: boolean;
  matchedByTeamId?: string;
}

export const MEMORY_ITEMS: MemoryItemDef[] = [
  // DYR (Animals)
  {
    id: 'lion',
    label: 'Løve',
    emoji: '🦁',
    category: 'animals',
    surfaceClass: 'from-amber-100 to-orange-100 text-amber-950',
    ringClass: 'border-amber-400',
  },
  {
    id: 'elephant',
    label: 'Elefant',
    emoji: '🐘',
    category: 'animals',
    surfaceClass: 'from-sky-100 to-slate-100 text-slate-900',
    ringClass: 'border-sky-400',
  },
  {
    id: 'panda',
    label: 'Panda',
    emoji: '🐼',
    category: 'animals',
    surfaceClass: 'from-emerald-50 to-teal-100 text-emerald-950',
    ringClass: 'border-emerald-400',
  },
  {
    id: 'fox',
    label: 'Rev',
    emoji: '🦊',
    category: 'animals',
    surfaceClass: 'from-orange-100 to-rose-100 text-orange-950',
    ringClass: 'border-orange-400',
  },
  {
    id: 'penguin',
    label: 'Pingvin',
    emoji: '🐧',
    category: 'animals',
    surfaceClass: 'from-cyan-100 to-blue-100 text-slate-900',
    ringClass: 'border-cyan-400',
  },
  {
    id: 'rabbit',
    label: 'Kanin',
    emoji: '🐰',
    category: 'animals',
    surfaceClass: 'from-pink-100 to-rose-50 text-rose-950',
    ringClass: 'border-pink-400',
  },
  {
    id: 'frog',
    label: 'Frosk',
    emoji: '🐸',
    category: 'animals',
    surfaceClass: 'from-lime-100 to-emerald-100 text-emerald-950',
    ringClass: 'border-lime-500',
  },
  {
    id: 'owl',
    label: 'Ugle',
    emoji: '🦉',
    category: 'animals',
    surfaceClass: 'from-yellow-100 to-amber-100 text-amber-950',
    ringClass: 'border-amber-500',
  },
  {
    id: 'cat',
    label: 'Katt',
    emoji: '🐱',
    category: 'animals',
    surfaceClass: 'from-amber-50 to-yellow-100 text-amber-950',
    ringClass: 'border-yellow-400',
  },
  {
    id: 'dog',
    label: 'Hund',
    emoji: '🐶',
    category: 'animals',
    surfaceClass: 'from-stone-100 to-amber-100 text-stone-900',
    ringClass: 'border-amber-400',
  },
  {
    id: 'turtle',
    label: 'Skilpadde',
    emoji: '🐢',
    category: 'animals',
    surfaceClass: 'from-teal-100 to-emerald-100 text-teal-950',
    ringClass: 'border-teal-400',
  },
  {
    id: 'butterfly',
    label: 'Sommerfugl',
    emoji: '🦋',
    category: 'animals',
    surfaceClass: 'from-sky-100 to-indigo-100 text-indigo-950',
    ringClass: 'border-sky-400',
  },
  {
    id: 'whale',
    label: 'Hval',
    emoji: '🐳',
    category: 'animals',
    surfaceClass: 'from-blue-100 to-cyan-100 text-blue-950',
    ringClass: 'border-blue-400',
  },
  {
    id: 'monkey',
    label: 'Apekatt',
    emoji: '🐵',
    category: 'animals',
    surfaceClass: 'from-amber-100 to-stone-100 text-amber-950',
    ringClass: 'border-amber-500',
  },
  {
    id: 'ladybug',
    label: 'Marihøne',
    emoji: '🐞',
    category: 'animals',
    surfaceClass: 'from-rose-100 to-red-100 text-red-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'bee',
    label: 'Bie',
    emoji: '🐝',
    category: 'animals',
    surfaceClass: 'from-yellow-100 to-amber-100 text-amber-950',
    ringClass: 'border-yellow-500',
  },

  // FIGURER & EVENTYR (Characters & Shapes)
  {
    id: 'unicorn',
    label: 'Enhjørning',
    emoji: '🦄',
    category: 'characters',
    surfaceClass: 'from-fuchsia-100 to-pink-100 text-fuchsia-950',
    ringClass: 'border-fuchsia-400',
  },
  {
    id: 'dino',
    label: 'Dinosaur',
    emoji: '🦖',
    category: 'characters',
    surfaceClass: 'from-emerald-100 to-lime-100 text-emerald-950',
    ringClass: 'border-emerald-500',
  },
  {
    id: 'robot',
    label: 'Robot',
    emoji: '🤖',
    category: 'characters',
    surfaceClass: 'from-cyan-100 to-indigo-100 text-slate-900',
    ringClass: 'border-cyan-500',
  },
  {
    id: 'dragon',
    label: 'Drage',
    emoji: '🐉',
    category: 'characters',
    surfaceClass: 'from-red-100 to-orange-100 text-red-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'crown',
    label: 'Kongekrone',
    emoji: '👑',
    category: 'characters',
    surfaceClass: 'from-yellow-100 to-amber-200 text-amber-950',
    ringClass: 'border-amber-500',
  },
  {
    id: 'rainbow',
    label: 'Regnbue',
    emoji: '🌈',
    category: 'characters',
    surfaceClass: 'from-sky-100 to-rose-100 text-slate-900',
    ringClass: 'border-sky-400',
  },
  {
    id: 'alien',
    label: 'Romvesen',
    emoji: '👾',
    category: 'characters',
    surfaceClass: 'from-violet-100 to-purple-100 text-violet-950',
    ringClass: 'border-violet-400',
  },
  {
    id: 'snowman',
    label: 'Snømann',
    emoji: '⛄',
    category: 'characters',
    surfaceClass: 'from-blue-50 to-cyan-100 text-sky-950',
    ringClass: 'border-sky-400',
  },
  {
    id: 'trophy',
    label: 'Gullpokal',
    emoji: '🏆',
    category: 'characters',
    surfaceClass: 'from-amber-100 to-yellow-100 text-amber-950',
    ringClass: 'border-amber-500',
  },
  {
    id: 'star',
    label: 'Stjerne',
    emoji: '⭐',
    category: 'characters',
    surfaceClass: 'from-yellow-50 to-amber-100 text-amber-950',
    ringClass: 'border-yellow-500',
  },
  {
    id: 'heart',
    label: 'Hjerte',
    emoji: '❤️',
    category: 'characters',
    surfaceClass: 'from-rose-100 to-pink-100 text-rose-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'teddy',
    label: 'Bamse',
    emoji: '🧸',
    category: 'characters',
    surfaceClass: 'from-orange-100 to-amber-100 text-amber-950',
    ringClass: 'border-orange-400',
  },
  {
    id: 'mermaid',
    label: 'Havfrue',
    emoji: '🧜‍♀️',
    category: 'characters',
    surfaceClass: 'from-teal-100 to-cyan-100 text-teal-950',
    ringClass: 'border-teal-400',
  },
  {
    id: 'fairy',
    label: 'Alv',
    emoji: '🧚',
    category: 'characters',
    surfaceClass: 'from-purple-100 to-pink-100 text-purple-950',
    ringClass: 'border-purple-400',
  },
  {
    id: 'pirate',
    label: 'Sjørøver',
    emoji: '🏴‍☠️',
    category: 'characters',
    surfaceClass: 'from-slate-200 to-stone-100 text-slate-900',
    ringClass: 'border-slate-500',
  },
  {
    id: 'magic',
    label: 'Tryllehatt',
    emoji: '🎩',
    category: 'characters',
    surfaceClass: 'from-indigo-100 to-violet-100 text-indigo-950',
    ringClass: 'border-indigo-400',
  },

  // TING, KJØRETØY & MAT (Things & Objects)
  {
    id: 'firetruck',
    label: 'Brannbil',
    emoji: '🚒',
    category: 'things',
    surfaceClass: 'from-red-100 to-rose-100 text-red-950',
    ringClass: 'border-red-400',
  },
  {
    id: 'rocket',
    label: 'Rakett',
    emoji: '🚀',
    category: 'things',
    surfaceClass: 'from-indigo-100 to-sky-100 text-indigo-950',
    ringClass: 'border-indigo-400',
  },
  {
    id: 'sailboat',
    label: 'Seilbåt',
    emoji: '⛵',
    category: 'things',
    surfaceClass: 'from-cyan-100 to-sky-100 text-sky-950',
    ringClass: 'border-cyan-400',
  },
  {
    id: 'bicycle',
    label: 'Sykkel',
    emoji: '🚲',
    category: 'things',
    surfaceClass: 'from-emerald-100 to-cyan-100 text-emerald-950',
    ringClass: 'border-emerald-400',
  },
  {
    id: 'soccer',
    label: 'Fotball',
    emoji: '⚽',
    category: 'things',
    surfaceClass: 'from-green-100 to-emerald-100 text-green-950',
    ringClass: 'border-green-500',
  },
  {
    id: 'guitar',
    label: 'Gitar',
    emoji: '🎸',
    category: 'things',
    surfaceClass: 'from-amber-100 to-rose-100 text-amber-950',
    ringClass: 'border-amber-400',
  },
  {
    id: 'sun',
    label: 'Sol',
    emoji: '☀️',
    category: 'things',
    surfaceClass: 'from-yellow-100 to-orange-100 text-amber-950',
    ringClass: 'border-yellow-500',
  },
  {
    id: 'icecream',
    label: 'Iskrem',
    emoji: '🍦',
    category: 'things',
    surfaceClass: 'from-pink-100 to-amber-100 text-rose-950',
    ringClass: 'border-pink-400',
  },
  {
    id: 'apple',
    label: 'Eple',
    emoji: '🍎',
    category: 'things',
    surfaceClass: 'from-rose-100 to-red-100 text-red-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'cake',
    label: 'Kake',
    emoji: '🎂',
    category: 'things',
    surfaceClass: 'from-fuchsia-100 to-amber-100 text-fuchsia-950',
    ringClass: 'border-fuchsia-400',
  },
  {
    id: 'umbrella',
    label: 'Paraply',
    emoji: '☂️',
    category: 'things',
    surfaceClass: 'from-purple-100 to-sky-100 text-purple-950',
    ringClass: 'border-purple-400',
  },
  {
    id: 'balloon',
    label: 'Ballong',
    emoji: '🎈',
    category: 'things',
    surfaceClass: 'from-rose-100 to-orange-100 text-rose-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'train',
    label: 'Tog',
    emoji: '🚂',
    category: 'things',
    surfaceClass: 'from-emerald-100 to-amber-100 text-emerald-950',
    ringClass: 'border-emerald-500',
  },
  {
    id: 'plane',
    label: 'Fly',
    emoji: '✈️',
    category: 'things',
    surfaceClass: 'from-sky-100 to-blue-100 text-sky-950',
    ringClass: 'border-sky-400',
  },
  {
    id: 'watermelon',
    label: 'Vannmelon',
    emoji: '🍉',
    category: 'things',
    surfaceClass: 'from-rose-100 to-emerald-100 text-rose-950',
    ringClass: 'border-rose-400',
  },
  {
    id: 'gift',
    label: 'Gavepakke',
    emoji: '🎁',
    category: 'things',
    surfaceClass: 'from-amber-100 to-rose-100 text-amber-950',
    ringClass: 'border-amber-400',
  },
];

export function shuffleMemoryArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildShuffledMemoryDeck(
  category: MemoryCategory,
  pairCount: number
): MemoryCardInstance[] {
  const pool =
    category === 'mixed'
      ? MEMORY_ITEMS
      : MEMORY_ITEMS.filter((item) => item.category === category);

  const selected = shuffleMemoryArray(pool).slice(0, Math.min(pairCount, pool.length));
  const doubled: MemoryCardInstance[] = [];

  selected.forEach((item, idx) => {
    doubled.push({
      uid: `${item.id}-a-${idx}-${Date.now()}`,
      itemId: item.id,
      label: item.label,
      emoji: item.emoji,
      category: item.category,
      surfaceClass: item.surfaceClass,
      ringClass: item.ringClass,
      isMatched: false,
    });
    doubled.push({
      uid: `${item.id}-b-${idx}-${Date.now()}`,
      itemId: item.id,
      label: item.label,
      emoji: item.emoji,
      category: item.category,
      surfaceClass: item.surfaceClass,
      ringClass: item.ringClass,
      isMatched: false,
    });
  });

  return shuffleMemoryArray(doubled);
}
