/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { socialSocket } from '../services/socialSocket';
import { progression } from '../services/progression';
import { sounds } from '../audio/soundEngine';
import { moderation } from '../services/moderation';

interface CustomCardCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardCreated?: (cardTitle: string, items: string[]) => void;
}

const TEMPLATES: Record<string, { title: string; theme: string; items: string[] }> = {
  friends: {
    title: 'Lifelong Friends Reunion',
    theme: 'heartfelt',
    items: [
      "Still remembers our inside joke from years ago",
      "Sang loudly on a road trip with you",
      "Cooked dinner together in college/school",
      "Knows your most embarrassing funny moment",
      "Has stayed up past 3am talking about life with you",
      "Helped you move furniture or pack boxes",
      "Shared a cry of deep gratitude with you",
      "Sent you a funny video that made your whole day",
      "Brought you medicine or soup when you were sick",
      "Remembers your favorite beverage order by heart",
      "Took an unforgettable trip or vacation with you",
      "Watched an entire movie series together in one weekend",
      "Cheered the loudest at your graduation or milestone",
      "Knows your parents or siblings like their own",
      "Forgave an accidental mishap and hugged it out",
      "Knows what song will immediately make you dance",
      "Always gives honest, constructive advice with love",
      "Took a photo of you that you still use as profile pic",
      "Lent you their favorite jacket or book and never asked for it back",
      "Shared an unexpected secret only you know",
      "Can tell when you're overwhelmed just by your tone",
      "Has baked or cooked something especially for you",
      "Still has an old keepsake from our adventures",
      "Believes in your biggest dreams even when you doubt"
    ]
  },
  wedding: {
    title: 'Joyful Wedding & Gathering',
    theme: 'heartfelt',
    items: [
      "Traveled the furthest distance to be here today",
      "Cried happy tears during the ceremony",
      "Known the couple since childhood or grade school",
      "Tears up when hearing the couple's love story",
      "First person on the dance floor tonight",
      "Has been happily married for over 25 years",
      "Gave a toast that made everyone laugh and cry",
      "Wearing something that matches the wedding colors",
      "Can show off a killer swing or waltz dance step",
      "Caught the bouquet or boutonniere in the past",
      "Helped with wedding decorations or setup",
      "Shares a sweet memory of the couple meeting",
      "Took a photo with grandparents or elders today",
      "Knows how to whistle to cheer the newlyweds",
      "Has known one of the partners since college",
      "Dressed up in their favorite festive outfit",
      "Has a piece of golden marriage advice to share",
      "Signed the guestbook with a heartfelt handwritten paragraph",
      "Sang along to the couple's first dance song",
      "Shared a slice of wedding cake with someone new",
      "Hugs with the warmth of a long-lost family member",
      "Traveled with the couple on an adventure before",
      "Can do a silly pose in the photo booth",
      "Smiles radiantly every time they look at the couple"
    ]
  }
};

export const CustomCardCreatorModal: React.FC<CustomCardCreatorModalProps> = ({
  isOpen,
  onClose,
  onCardCreated,
}) => {
  const [title, setTitle] = useState('Our Joyful Gathering');
  const [theme, setTheme] = useState('heartfelt');
  const [items, setItems] = useState<string[]>(TEMPLATES.friends.items);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleItemChange = (index: number, value: string) => {
    const copy = [...items];
    copy[index] = value;
    setItems(copy);
  };

  const loadTemplate = (key: 'friends' | 'wedding') => {
    sounds.playPop(1.1);
    setTitle(TEMPLATES[key].title);
    setTheme(TEMPLATES[key].theme);
    setItems(TEMPLATES[key].items);
  };

  const handleSaveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    sounds.playClick();

    try {
      // Filter banned words for social wellbeing
      const sanitizedTitle = moderation.filterText(title.trim()).cleanText;
      const sanitizedItems = items.map((it) => moderation.filterText(it).cleanText);

      // Broadcast to WebSocket and server
      socialSocket.createCustomCard(sanitizedTitle, theme, sanitizedItems);
      progression.addPoints(200, 'Created custom joyful community card', true);

      if (onCardCreated) {
        onCardCreated(sanitizedTitle, sanitizedItems);
      }
      sounds.playLineComplete();
      onClose();
    } catch {
      // fail silent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#171009] border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-amber-50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
          <div>
            <h2 className="font-heading text-lg font-bold text-amber-200">
              Create Custom Joy Bingo Card
            </h2>
            <p className="text-xs text-amber-300/60 mt-0.5">
              Personalize 24 joyful prompts for your party, team, or gathering (+200 Joy Points)
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-900/40 rounded-lg cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template Quick Loads */}
        <div className="flex items-center justify-between py-3 border-b border-amber-500/15">
          <span className="text-2xs uppercase tracking-wider text-amber-300/70 font-semibold">
            Inspiration Presets:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => loadTemplate('friends')}
              className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-xs text-amber-200 cursor-pointer"
            >
              Friends Reunion
            </button>
            <button
              onClick={() => loadTemplate('wedding')}
              className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 text-xs text-amber-200 cursor-pointer"
            >
              Wedding & Celebration
            </button>
          </div>
        </div>

        {/* Title & Theme Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
              Card Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's 80th Joy Bingo"
              className="w-full px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-amber-300/80 block mb-1">
              Category
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            >
              <option value="heartfelt">Heartfelt Connections</option>
              <option value="laughter">Laughter & Quirks</option>
              <option value="kindness">Kindness & Community</option>
              <option value="gratitude">Wisdom & Gratitude</option>
            </select>
          </div>
        </div>

        {/* Tabs: Edit vs Preview */}
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            Edit Prompts (24)
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            Preview 5x5 Card
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-3">
          {activeTab === 'edit' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-black/30 border border-amber-500/15">
                  <span className="w-5 text-2xs font-bold text-amber-400/70 tabular-nums text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(idx, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-amber-100 focus:outline-none"
                    placeholder={`Prompt #${idx + 1}...`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-500/25">
              <div className="text-center mb-3">
                <h4 className="font-heading font-bold text-base text-amber-300">{title}</h4>
                <p className="text-2xs text-amber-200/60">Center is Free Joy Space</p>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {['B', 'I', 'N', 'G', 'O'].map((l) => (
                  <div key={l} className="py-1 bg-amber-500 text-slate-950 font-black text-xs rounded">
                    {l}
                  </div>
                ))}
                {/* 25 tiles preview */}
                {Array.from({ length: 25 }).map((_, idx) => {
                  if (idx === 12) {
                    return (
                      <div key={idx} className="p-2 aspect-square flex flex-col items-center justify-center bg-amber-500/20 border border-amber-400 rounded text-2xs font-bold text-amber-300">
                        <span>☀️</span>
                        <span>FREE</span>
                      </div>
                    );
                  }
                  const itemIndex = idx > 12 ? idx - 1 : idx;
                  return (
                    <div key={idx} className="p-1.5 aspect-square flex items-center justify-center bg-black/40 border border-amber-500/20 rounded text-3xs text-amber-100/90 leading-tight overflow-hidden">
                      {items[itemIndex] || `Prompt ${itemIndex + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-200/80 hover:text-amber-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndPublish}
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-heading font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Save & Share with Room</span>
            <span>✨</span>
          </button>
        </div>
      </div>
    </div>
  );
};
