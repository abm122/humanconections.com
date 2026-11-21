/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, SupportedLanguage } from '../services/i18n';
import { sounds } from '../audio/soundEngine';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { lang, setLanguage, currentInfo, supportedLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    sounds.playClick();
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen)}
        }
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 hover:text-amber-100 hover:border-amber-300 transition-all text-xs font-bold cursor-pointer shadow-sm select-none"
        title={`${t('switch_language')} (${currentInfo.name})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentInfo.flag}</span>
        {variant === 'full' ? (
          <span className="hidden sm:inline font-medium">{currentInfo.name}</span>
        ) : (
          <span className="uppercase text-[11px] font-mono tracking-wider">{currentInfo.code}</span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-amber-400/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-gradient-to-b from-[#211409] to-[#120a04] border border-amber-500/50 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          role="listbox"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/70 border-b border-amber-500/20 mb-1 flex items-center justify-between">
            <span>{t('switch_language')}</span>
            <span className="text-[10px] text-amber-200/50">8 {t('language').toLowerCase()}</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {supportedLanguages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-400/40 shadow-xs'
                      : 'text-amber-100/80 hover:bg-amber-900/40 hover:text-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base leading-none shrink-0">{item.flag}</span>
                    <div className="flex flex-col truncate">
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-amber-300/50 font-normal leading-tight">
                        {item.englishName}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <svg className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
