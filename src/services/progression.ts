/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  badgeIcon: string;
  unlockedDauber: string;
  perk: string;
}

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: 'Joy Seeker',
    minPoints: 0,
    maxPoints: 300,
    badgeIcon: '🌱',
    unlockedDauber: 'sun',
    perk: 'Classic Golden Sun Dauber',
  },
  {
    level: 2,
    title: 'Warmth Spreader',
    minPoints: 300,
    maxPoints: 800,
    badgeIcon: '✨',
    unlockedDauber: 'heart',
    perk: 'Gleaming Rose Heart Dauber',
  },
  {
    level: 3,
    title: 'Kindness Catalyst',
    minPoints: 800,
    maxPoints: 1600,
    badgeIcon: '💛',
    unlockedDauber: 'sparkle',
    perk: 'Prismatic Starburst Dauber',
  },
  {
    level: 4,
    title: 'Story Weaver',
    minPoints: 1600,
    maxPoints: 2800,
    badgeIcon: '📖',
    unlockedDauber: 'lotus',
    perk: 'Peaceful Lotus Token',
  },
  {
    level: 5,
    title: 'Joy Ambassador',
    minPoints: 2800,
    maxPoints: 4500,
    badgeIcon: '🕊️',
    unlockedDauber: 'crown',
    perk: 'Golden Crown of Compassion',
  },
  {
    level: 6,
    title: 'Radiant Luminary',
    minPoints: 4500,
    maxPoints: 99999,
    badgeIcon: '☀️',
    unlockedDauber: 'celestial',
    perk: 'Celestial Radiant Glow Effect',
  },
];

export type QuestCategory = 'daub' | 'story' | 'line' | 'bingo' | 'cheer' | 'roll' | 'cards' | 'mixer';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  icon: string;
  target: number;
  progress: number;
  rewardPoints: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface StoredDailyQuests {
  dateKey: string;
  quests: DailyQuest[];
  allCompletedBonusClaimed: boolean;
}

const QUEST_TEMPLATES: Omit<DailyQuest, 'progress' | 'isCompleted' | 'isClaimed'>[] = [
  {
    id: 'quest_daub_10',
    title: 'Spark the Board',
    description: 'Daub 10 joyful or numbered tiles on your cards',
    category: 'daub',
    icon: '✨',
    target: 10,
    rewardPoints: 200,
  },
  {
    id: 'quest_story_2',
    title: 'Heartfelt Storyteller',
    description: 'Record 2 personal reflection notes or friend connections',
    category: 'story',
    icon: '📖',
    target: 2,
    rewardPoints: 250,
  },
  {
    id: 'quest_line_2',
    title: 'Line of Connection',
    description: 'Complete 2 full horizontal, vertical, or diagonal lines',
    category: 'line',
    icon: '🌟',
    target: 2,
    rewardPoints: 300,
  },
  {
    id: 'quest_cheer_3',
    title: 'Joy Ambassador',
    description: 'Send 3 warm cheers or friend invitations in chat',
    category: 'cheer',
    icon: '💛',
    target: 3,
    rewardPoints: 180,
  },
  {
    id: 'quest_roll_5',
    title: 'Master Ball Caller',
    description: 'Roll and draw 5 affirmation balls from the cage',
    category: 'roll',
    icon: '🎲',
    target: 5,
    rewardPoints: 220,
  },
  {
    id: 'quest_bingo_1',
    title: 'Triumphant BINGO',
    description: 'Achieve a glorious BINGO victory in any game mode',
    category: 'bingo',
    icon: '🏆',
    target: 1,
    rewardPoints: 500,
  },
  {
    id: 'quest_cards_15',
    title: 'Multi-Card Virtuoso',
    description: 'Daub 15 tiles while playing multiple cards simultaneously',
    category: 'cards',
    icon: '📑',
    target: 15,
    rewardPoints: 350,
  },
  {
    id: 'quest_mixer_1',
    title: 'Cage Agitator',
    description: 'Agitate and mix the ball cage in the Mixer Station',
    category: 'mixer',
    icon: '🎛️',
    target: 1,
    rewardPoints: 150,
  },
];

export interface PlayerStats {
  points: number;
  hostCredits: number;
  daubsCount: number;
  storiesShared: number;
  bingosAchieved: number;
  cheersSent: number;
  activeDauber: string;
}

const STORAGE_KEY = 'joypulse_progression_v1';
const QUESTS_KEY = 'joypulse_daily_quests_v1';

class ProgressionService {
  private stats: PlayerStats = {
    points: 120, // Starting bonus
    hostCredits: 50,
    daubsCount: 0,
    storiesShared: 0,
    bingosAchieved: 0,
    cheersSent: 0,
    activeDauber: 'sun',
  };

  private dailyData: StoredDailyQuests = {
    dateKey: '',
    quests: [],
    allCompletedBonusClaimed: false,
  };

  private listeners: Set<(stats: PlayerStats, leveledUp?: LevelInfo, completedQuest?: DailyQuest) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.stats = { ...this.stats, ...JSON.parse(saved) };
        } catch {
          // ignore corrupted data
        }
      }
      this.initDailyQuests();
    }
  }

  private getTodayDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private initDailyQuests() {
    const today = this.getTodayDateKey();
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(QUESTS_KEY);
    if (saved) {
      try {
        const parsed: StoredDailyQuests = JSON.parse(saved);
        if (parsed.dateKey === today && Array.isArray(parsed.quests) && parsed.quests.length === 3) {
          this.dailyData = parsed;
          return;
        }
      } catch {
        // regenerate
      }
    }

    // Generate 3 random distinct daily quests for today
    this.dailyData = {
      dateKey: today,
      quests: this.generateThreeQuests(),
      allCompletedBonusClaimed: false,
    };
    this.saveQuests();
  }

  private generateThreeQuests(): DailyQuest[] {
    const pool = [...QUEST_TEMPLATES];
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, 3).map((template) => ({
      ...template,
      progress: 0,
      isCompleted: false,
      isClaimed: false,
    }));
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    }
  }

  private saveQuests() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUESTS_KEY, JSON.stringify(this.dailyData));
    }
  }

  public getDailyQuests(): DailyQuest[] {
    this.initDailyQuests();
    return [...this.dailyData.quests];
  }

  public isDailyBonusClaimed(): boolean {
    this.initDailyQuests();
    return this.dailyData.allCompletedBonusClaimed;
  }

  public getStats(): PlayerStats {
    return { ...this.stats };
  }

  public getLevelInfo(pts: number = this.stats.points): LevelInfo {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (pts >= LEVELS[i].minPoints) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  public addPoints(amount: number, reason?: string, isHostAction: boolean = false): { newTotal: number; leveledUp?: LevelInfo } {
    const prevLevel = this.getLevelInfo();
    this.stats.points += amount;
    if (isHostAction) {
      this.stats.hostCredits += Math.round(amount * 0.5);
    }

    this.save();
    const newLevel = this.getLevelInfo();
    const leveledUp = newLevel.level > prevLevel.level ? newLevel : undefined;

    this.notify(leveledUp);
    return { newTotal: this.stats.points, leveledUp };
  }

  private notify(leveledUp?: LevelInfo, completedQuest?: DailyQuest) {
    this.listeners.forEach((cb) => cb({ ...this.stats }, leveledUp, completedQuest));
  }

  private advanceQuest(category: QuestCategory, count: number = 1) {
    this.initDailyQuests();
    let justCompleted: DailyQuest | undefined;

    this.dailyData.quests.forEach((q) => {
      if (q.category === category && !q.isCompleted) {
        q.progress = Math.min(q.target, q.progress + count);
        if (q.progress >= q.target) {
          q.isCompleted = true;
          justCompleted = q;
        }
      }
    });

    if (justCompleted) {
      this.saveQuests();
      this.notify(undefined, justCompleted);
    } else {
      this.saveQuests();
    }
  }

  public claimQuestReward(questId: string): number {
    this.initDailyQuests();
    const quest = this.dailyData.quests.find((q) => q.id === questId);
    if (!quest || !quest.isCompleted || quest.isClaimed) return 0;

    quest.isClaimed = true;
    this.saveQuests();
    this.addPoints(quest.rewardPoints, `Completed Daily Quest: ${quest.title}`);
    return quest.rewardPoints;
  }

  public claimDailyBonus(): number {
    this.initDailyQuests();
    const allDone = this.dailyData.quests.every((q) => q.isCompleted);
    if (!allDone || this.dailyData.allCompletedBonusClaimed) return 0;

    this.dailyData.allCompletedBonusClaimed = true;
    this.saveQuests();
    const bonus = 500;
    this.addPoints(bonus, 'Completed All 3 Daily Joyful Quests Grand Bonus');
    return bonus;
  }

  public recordDaub(hasMultipleCards: boolean = false) {
    this.stats.daubsCount += 1;
    this.advanceQuest('daub', 1);
    if (hasMultipleCards) {
      this.advanceQuest('cards', 1);
    }
    return this.addPoints(50, 'Daubed a tile');
  }

  public recordStoryNote() {
    this.stats.storiesShared += 1;
    this.advanceQuest('story', 1);
    return this.addPoints(100, 'Recorded reflection story');
  }

  public recordLineWin() {
    this.advanceQuest('line', 1);
    return this.addPoints(250, 'Completed a Joy Line');
  }

  public recordBingoWin() {
    this.stats.bingosAchieved += 1;
    this.advanceQuest('bingo', 1);
    return this.addPoints(1000, 'Triumphant BINGO');
  }

  public recordCheerSent() {
    this.stats.cheersSent += 1;
    this.advanceQuest('cheer', 1);
    return this.addPoints(35, 'Sent warm cheer to friend');
  }

  public recordHostBallDrawn() {
    this.advanceQuest('roll', 1);
    return this.addPoints(40, 'Managed and rolled ball cage', true);
  }

  public recordMixerAgitate() {
    this.advanceQuest('mixer', 1);
  }

  public setDauber(dauberId: string) {
    this.stats.activeDauber = dauberId;
    this.save();
    this.notify();
  }

  public subscribe(cb: (stats: PlayerStats, leveledUp?: LevelInfo, completedQuest?: DailyQuest) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const progression = new ProgressionService();
