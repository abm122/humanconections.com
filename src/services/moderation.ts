/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Comprehensive banned and offensive words pattern list for social wellbeing
const BANNED_PATTERNS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cock', 'twat',
  'kill yourself', 'kys', 'hate you', 'die', 'nazi', 'hitler', 'terrorist',
  'pedophile', 'scam', 'spam', 'porn', 'nsfw', 'sex', 'boobs', 'penis', 'vagina'
];

export interface ModerationResult {
  cleanText: string;
  hasBannedWords: boolean;
  bannedWordsFound: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  reason?: string;
  width?: number;
  height?: number;
}

const CUSTOM_BANNED_KEY = 'joypulse_custom_banned_words';

class ModerationService {
  private bannedSet: Set<string>;
  private strictUploads: boolean = true;

  constructor() {
    this.bannedSet = new Set(BANNED_PATTERNS);
    this.loadCustomBanned();
  }

  private loadCustomBanned() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CUSTOM_BANNED_KEY);
        if (stored) {
          const list: string[] = JSON.parse(stored);
          list.forEach((w) => this.bannedSet.add(w.toLowerCase()));
        }
      }
    } catch {
      // Ignore
    }
  }

  public getBannedWords(): string[] {
    return Array.from(this.bannedSet).sort();
  }

  public addBannedWord(word: string): boolean {
    const clean = word.trim().toLowerCase();
    if (!clean || this.bannedSet.has(clean)) return false;
    this.bannedSet.add(clean);
    this.persistCustomWords();
    return true;
  }

  public removeBannedWord(word: string): boolean {
    const clean = word.trim().toLowerCase();
    if (!this.bannedSet.has(clean)) return false;
    this.bannedSet.delete(clean);
    this.persistCustomWords();
    return true;
  }

  private persistCustomWords() {
    try {
      if (typeof window !== 'undefined') {
        const custom = Array.from(this.bannedSet).filter((w) => !BANNED_PATTERNS.includes(w));
        localStorage.setItem(CUSTOM_BANNED_KEY, JSON.stringify(custom));
      }
    } catch {
      // Ignore
    }
  }

  public setStrictUploads(enabled: boolean) {
    this.strictUploads = enabled;
  }

  public isStrictUploads(): boolean {
    return this.strictUploads;
  }

  /**
   * Scans text for banned/inappropriate words, replacing them with sparkling joy symbols
   */
  public filterText(text: string): ModerationResult {
    if (!text) return { cleanText: '', hasBannedWords: false, bannedWordsFound: [] };

    let clean = text;
    const found: string[] = [];

    for (const word of this.bannedSet) {
      // Create word boundary regex, escaping special chars
      const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

      if (regex.test(clean)) {
        found.push(word);
        clean = clean.replace(regex, '✨💖✨');
      }
    }

    return {
      cleanText: clean,
      hasBannedWords: found.length > 0,
      bannedWordsFound: found,
    };
  }

  /**
   * Validates whether a file/image uploaded by audience or player fits strict wellbeing guidelines:
   * - Must be valid image (image/png, image/jpeg, image/webp)
   * - Must be under 600 KB
   * - Must be properly fitted (aspect ratio between 0.8 and 1.25, max 1024x1024px)
   */
  public async validateAudienceUpload(file: File): Promise<FileValidationResult> {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        reason: 'Unsupported file format. Only safe images (PNG, JPEG, WebP) are allowed.',
      };
    }

    const MAX_SIZE_BYTES = 600 * 1024; // 600 KB
    if (file.size > MAX_SIZE_BYTES) {
      return {
        isValid: false,
        reason: 'File size too large. Only fitted pictures under 600KB are allowed for social wellbeing.',
      };
    }

    // Verify dimensions & fitting aspect ratio
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          const aspectRatio = width / height;

          // Must be fitted (close to square avatar/sticker: 0.75 - 1.33)
          if (aspectRatio < 0.7 || aspectRatio > 1.4) {
            resolve({
              isValid: false,
              reason: `Unfitted picture dimensions (${width}x${height}). Pictures must be roughly square (aspect ratio ~1:1) to fit nicely on the community screen.`,
              width,
              height,
            });
            return;
          }

          if (width > 1200 || height > 1200) {
            resolve({
              isValid: false,
              reason: 'Picture resolution exceeds max 1200x1200px. Please upload a fitted display picture.',
              width,
              height,
            });
            return;
          }

          resolve({ isValid: true, width, height });
        };

        img.onerror = () => {
          resolve({
            isValid: false,
            reason: 'Could not parse image. The file appears corrupted or unfitted.',
          });
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        resolve({ isValid: false, reason: 'Failed to read upload file.' });
      };

      reader.readAsDataURL(file);
    });
  }
}

export const moderation = new ModerationService();
