/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { GameMode, BingoTheme, CardDisplayMode, CalledBall } from '../types/bingo';
import type { QuizEdition } from '../data/quizQuestions';
import { sounds } from '../audio/soundEngine';
import { useTranslation } from '../services/i18n';
import { getTitleScreenTexts } from '../services/titleScreenI18n';
import { getBingoUiTexts } from '../services/bingoUiI18n';
import { getTitleExtraTexts } from '../services/titleExtraI18n';
import { LanguageSelector } from './LanguageSelector';
import { GoldenCoinLogo } from './GoldenCoinLogo';
import { BallCageCanvas } from './BallCageCanvas';
import { dailySchedule } from '../services/schedule';
import { authService, AuthUser } from '../services/authService';
import {
  DEFAULT_CATEGORY_ORDER,
  DEFAULT_LAYOUT_PREFS,
  DEFAULT_START_PANEL_DEFAULTS,
  ownerControl,
  OwnerLayoutPrefs,
  OwnerProfile,
} from '../services/ownerControl';
import { sessionTimer } from '../services/sessionTimer';
import { monetization, OwnerMonetizationSettings } from '../services/monetization';
import { remoteBingo } from '../services/remoteBingo';
import { quizService } from '../services/quizService';

interface TitleScreenProps {
  onStartGame: (
    mode: GameMode,
    theme: BingoTheme,
    playerCount: number,
    numCardsPerPlayer: number,
    displayMode: CardDisplayMode,
    playerNames?: string[],
    targetScreenDevice?: 'mobile' | 'desktop' | 'big_screen'
  ) => void;
  onOpenPrintModal: () => void;
  onOpenAudience?: () => void;
  onOpenMixer?: () => void;
  onOpenQuests?: () => void;
  onOpenSchedule?: () => void;
  onOpenMonetization?: () => void;
  onOpenOwnerControl?: () => void;
  onOpenVippsModal?: () => void;
  onOpenAuth?: () => void;
  onOpenReportProblem?: () => void;
  onOpenIosInstall?: () => void;
  onOpenEventTimeout?: () => void;
  onOpenBroadcast?: () => void;
  onOpenParticipants?: () => void;
  onOpenRemoteBingo?: () => void;
  onOpenSecretOwnerLogin?: () => void;
  onOpenGameSelector?: () => void;
  onOpenQuiz?: (edition: QuizEdition, tab?: 'host' | 'big_screen' | 'team_play' | 'join') => void;
  onOpenMemory?: () => void;
  onOpenPrivacy?: () => void;
  onQuickJoinWithCode?: (code: string, target: 'quiz' | 'bingo') => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const DEFAULT_NORWEGIAN_SUBTITLE = 'Enjoy Bingo · Enjoy Together';
const LEGACY_NORWEGIAN_SUBTITLE = 'Sosial Trivsel & Fellesskap for Foreninger, Lag, Familie og Venner';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenPrintModal,
  onOpenAudience,
  onOpenMixer,
  onOpenQuests,
  onOpenSchedule,
  onOpenOwnerControl,
  onOpenVippsModal,
  onOpenAuth,
  onOpenReportProblem,
  onOpenIosInstall,
  onOpenEventTimeout,
  onOpenBroadcast,
  onOpenParticipants,
  onOpenRemoteBingo,
  onOpenSecretOwnerLogin,
  onOpenGameSelector,
  onOpenQuiz,
  onOpenMemory,
  onOpenPrivacy,
  onQuickJoinWithCode,
  isMuted,
  onToggleMute,
}) => {
  const { t, lang } = useTranslation();
  const ts = getTitleScreenTexts(lang);
  const ui = getBingoUiTexts(lang);
  const tx = getTitleExtraTexts(lang);
  const [quickJoinCode, setQuickJoinCode] = useState<string>('');
  const [activeHostCode, setActiveHostCode] = useState<string>(() => remoteBingo.getHostCode());
  const [isServerActive, setIsServerActive] = useState<boolean>(() => remoteBingo.isRoomActiveOnServer());
  const [copiedHostCode, setCopiedHostCode] = useState<boolean>(false);
  const [copiedHostLink, setCopiedHostLink] = useState<boolean>(false);

  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(() => ownerControl.getProfile());
  const [monetizationSettings, setMonetizationSettings] = useState<OwnerMonetizationSettings>(() =>
    monetization.getSettings()
  );
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(() => sessionTimer.isExpired());
  const [canShowTrial, setCanShowTrial] = useState<boolean>(() => sessionTimer.canStartFreeTrial());
  const [isTrialActive, setIsTrialActive] = useState<boolean>(
    () => sessionTimer.isTrialSession() && sessionTimer.hasPaidAccess()
  );

  const initialDefaults = ownerProfile.startPanelDefaults || DEFAULT_START_PANEL_DEFAULTS;
  const userEditedSetupRef = useRef(false);

  const [selectedMode, setSelectedMode] = useState<GameMode>(initialDefaults.defaultMode || 'ALL_IN_ONE');
  const [selectedTheme, setSelectedTheme] = useState<BingoTheme>(() => {
    const order = ownerControl.getCategoryOrder();
    return order[0] || 'ril';
  });
  const [numCardsPerPlayer, setNumCardsPerPlayer] = useState<number>(initialDefaults.defaultCardsPerPlayer || 1);
  const [cardDisplayMode, setCardDisplayMode] = useState<CardDisplayMode>(
    initialDefaults.defaultCardDisplayMode || 'both'
  );
  const detectDeviceFromWidth = (): 'mobile' | 'desktop' | 'big_screen' => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth >= 1600) return 'big_screen';
    return 'desktop';
  };
  const userPickedScreenRef = useRef<boolean>(false);
  const [screenDevice, setScreenDevice] = useState<'mobile' | 'desktop' | 'big_screen'>(() => {
    if (initialDefaults.defaultScreenDevice) {
      return initialDefaults.defaultScreenDevice;
    }
    return detectDeviceFromWidth();
  });
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const [isQuizMenuOpen, setIsQuizMenuOpen] = useState<boolean>(false);
  const quizMenuRef = useRef<HTMLDivElement | null>(null);
  const [isScreenMenuOpen, setIsScreenMenuOpen] = useState<boolean>(false);
  const screenMenuRef = useRef<HTMLDivElement | null>(null);

  const DEFAULT_NAMES = [
    'Emma', 'Oliver', 'Lucas', 'Nora', 'Filip', 'Sofie', 'Jakob', 'Ella',
    'Noah', 'Maja', 'Emil', 'Ingrid', 'Liam', 'Ida', 'Aksel', 'Sara',
  ];

  const buildNamesForCount = (count: number, current: string[] = []): string[] => {
    const clamped = Math.max(1, Math.min(100, count));
    const updated = [...current];
    if (clamped > updated.length) {
      for (let i = updated.length; i < clamped; i++) {
        updated.push(DEFAULT_NAMES[i % DEFAULT_NAMES.length] || `${ui.player} ${i + 1}`);
      }
    } else if (clamped < updated.length) {
      updated.length = clamped;
    }
    return updated;
  };

  // Manual player names list
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const targetCount = initialDefaults.defaultPlayerCount || 2;
    const parts = dailySchedule.getParticipants();
    if (parts.length > 0 && targetCount === 2) {
      return parts.slice(0, 2).map((p) => p.name);
    }
    return buildNamesForCount(targetCount, []);
  });

  const [customCountInput, setCustomCountInput] = useState<string>(() => String(playerNames.length));

  const ALL_LEFT_DEFAULT = ['hero', 'host_code', 'kahoot_join', 'drum'];
  const ALL_RIGHT_DEFAULT = [
    'status_banner',
    'category',
    'mode',
    'card_format',
    'players',
    'cards_screen',
    'remote_strip',
    'start_actions',
  ];

  const normalizeLayoutPrefs = (raw?: Partial<OwnerLayoutPrefs> | null): OwnerLayoutPrefs => {
    const base = { ...DEFAULT_LAYOUT_PREFS, ...(raw || {}) };
    const knownAll = new Set([...ALL_LEFT_DEFAULT, ...ALL_RIGHT_DEFAULT]);
    const left = Array.isArray(base.leftSectionOrder)
      ? base.leftSectionOrder.filter((id) => knownAll.has(id))
      : [...ALL_LEFT_DEFAULT];
    const right = Array.isArray(base.rightSectionOrder)
      ? base.rightSectionOrder.filter((id) => knownAll.has(id) && !left.includes(id))
      : [...ALL_RIGHT_DEFAULT];
    for (const id of ALL_LEFT_DEFAULT) {
      if (!left.includes(id) && !right.includes(id)) left.push(id);
    }
    for (const id of ALL_RIGHT_DEFAULT) {
      if (!left.includes(id) && !right.includes(id)) right.push(id);
    }
    return {
      ...base,
      leftSectionOrder: left,
      rightSectionOrder: right,
      collapsedSections: Array.isArray(base.collapsedSections)
        ? base.collapsedSections.filter((id) => knownAll.has(id))
        : [],
    };
  };

  // Owner direct inline start-panel editing state
  const [isOwnerEditMode, setIsOwnerEditMode] = useState<boolean>(false);
  const [editAppTitle, setEditAppTitle] = useState<string>(ownerProfile.appTitle || 'Human-connection');
  const [editAppSubtitle, setEditAppSubtitle] = useState<string>(ownerProfile.appSubtitle || DEFAULT_NORWEGIAN_SUBTITLE);
  const [editCategoryOrder, setEditCategoryOrder] = useState<BingoTheme[]>(
    ownerProfile.categoryOrder && ownerProfile.categoryOrder.length > 0
      ? ownerProfile.categoryOrder
      : DEFAULT_CATEGORY_ORDER
  );
  const [editVisibleModules, setEditVisibleModules] = useState<OwnerProfile['visibleModules']>(
    ownerProfile.visibleModules
  );
  const [editShowLiveDrum, setEditShowLiveDrum] = useState<boolean>(
    ownerProfile.startPanelDefaults?.showLiveDrum ?? true
  );
  const [editLayoutPrefs, setEditLayoutPrefs] = useState<OwnerLayoutPrefs>(() =>
    normalizeLayoutPrefs(ownerProfile.layoutPrefs)
  );
  const userToggledCollapseRef = useRef<boolean>(false);
  const [localCollapsedSections, setLocalCollapsedSections] = useState<string[]>(() =>
    normalizeLayoutPrefs(ownerProfile.layoutPrefs).collapsedSections
  );
  const [isSavingOwnerSetup, setIsSavingOwnerSetup] = useState<boolean>(false);
  const [ownerEditFeedback, setOwnerEditFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Interactive Live Drum state
  const [previewUncalled, setPreviewUncalled] = useState<CalledBall[]>(() => {
    const letters: ('B' | 'I' | 'N' | 'G' | 'O')[] = ['B', 'I', 'N', 'G', 'O'];
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    const affirmations = [
      'Glede & varme', 'Lagånd & heiarop', 'Et vennlig smil',
      'Allsang & musikk', 'Hjertevarme', 'Hverdagsgnist',
    ];
    const list: CalledBall[] = [];
    for (let i = 1; i <= 75; i++) {
      const col = Math.floor((i - 1) / 15);
      list.push({
        number: i,
        letter: letters[col],
        color: colors[col],
        affirmation: affirmations[i % affirmations.length],
        timestamp: Date.now(),
      });
    }
    return list;
  });
  const [previewCalled, setPreviewCalled] = useState<CalledBall[]>([]);
  const [isPreviewAuto, setIsPreviewAuto] = useState<boolean>(false);
  const [previewScrambleTrigger, setPreviewScrambleTrigger] = useState<number>(0);

  const handlePreviewBallDrawn = (ball: CalledBall) => {
    setPreviewCalled((prev) => [...prev, ball]);
    setPreviewUncalled((prev) => prev.filter((b) => b.number !== ball.number));
  };

  useEffect(() => {
    const refreshAccessState = () => {
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      setIsSessionExpired(sessionTimer.isExpired());
      setCanShowTrial(sessionTimer.canStartFreeTrial());
      setIsTrialActive(sessionTimer.isTrialSession() && sessionTimer.hasPaidAccess());
      setActiveHostCode(remoteBingo.getHostCode());
      setIsServerActive(remoteBingo.isRoomActiveOnServer());
    };
    const unsubAuth = authService.subscribe(() => {
      setAuthUser(authService.getCurrentUser());
      refreshAccessState();
    });
    const unsubOwner = ownerControl.subscribe(() => {
      const nextProfile = ownerControl.getProfile();
      setOwnerProfile(nextProfile);
      refreshAccessState();

      if (!isOwnerEditMode) {
        setEditAppTitle(nextProfile.appTitle || 'Human-connection');
        setEditAppSubtitle(nextProfile.appSubtitle || DEFAULT_NORWEGIAN_SUBTITLE);
        setEditCategoryOrder(
          nextProfile.categoryOrder && nextProfile.categoryOrder.length > 0
            ? nextProfile.categoryOrder
            : DEFAULT_CATEGORY_ORDER
        );
        setEditVisibleModules(nextProfile.visibleModules);
        setEditShowLiveDrum(nextProfile.startPanelDefaults?.showLiveDrum ?? true);
        const normalizedLayout = normalizeLayoutPrefs(nextProfile.layoutPrefs);
        setEditLayoutPrefs(normalizedLayout);
        if (!userToggledCollapseRef.current) {
          setLocalCollapsedSections(normalizedLayout.collapsedSections);
        }
      }

      if (!userEditedSetupRef.current && nextProfile.startPanelDefaults) {
        const d = nextProfile.startPanelDefaults;
        setSelectedMode(d.defaultMode || 'ALL_IN_ONE');
        setCardDisplayMode(d.defaultCardDisplayMode || 'both');
        setNumCardsPerPlayer(d.defaultCardsPerPlayer || 1);
        if (d.defaultScreenDevice) {
          setScreenDevice(d.defaultScreenDevice);
        }
        if (nextProfile.categoryOrder && nextProfile.categoryOrder.length > 0) {
          setSelectedTheme(nextProfile.categoryOrder[0]);
        }
        if (d.defaultPlayerCount) {
          setPlayerNames((prev) => buildNamesForCount(d.defaultPlayerCount, prev));
          setCustomCountInput(String(d.defaultPlayerCount));
        }
      }
    });
    const unsubMonetization = monetization.subscribe(() => {
      setMonetizationSettings(monetization.getSettings());
    });
    const unsubSession = sessionTimer.subscribe(refreshAccessState);
    const unsubRemote = remoteBingo.subscribe(() => {
      setActiveHostCode(remoteBingo.getHostCode());
      setIsServerActive(remoteBingo.isRoomActiveOnServer() || remoteBingo.isCloudRoomSynced());
    });

    if (remoteBingo.canActAsHost() && !remoteBingo.getIsRemotePlayer() && !quizService.getIsRemoteParticipant()) {
      const ensured = remoteBingo.activateHostSession();
      if (ensured) {
        setActiveHostCode(ensured);
      }
      setIsServerActive(remoteBingo.isRoomActiveOnServer() || remoteBingo.isCloudRoomSynced());
    }

    return () => {
      unsubAuth();
      unsubOwner();
      unsubMonetization();
      unsubSession();
      unsubRemote();
    };
  }, [isOwnerEditMode]);

  useEffect(() => {
    const handleResize = () => {
      if (!userPickedScreenRef.current) {
        setScreenDevice(detectDeviceFromWidth());
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
      if (quizMenuRef.current && !quizMenuRef.current.contains(e.target as Node)) {
        setIsQuizMenuOpen(false);
      }
      if (screenMenuRef.current && !screenMenuRef.current.contains(e.target as Node)) {
        setIsScreenMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const secretClickCountRef = useRef(0);
  const secretTimerRef = useRef<number | null>(null);

  const handleLogoSecretClick = () => {
    if (remoteBingo.getIsRemotePlayer() || quizService.getIsRemoteParticipant()) {
      return;
    }
    secretClickCountRef.current += 1;
    if (secretClickCountRef.current >= 5) {
      sounds.playLineComplete();
      secretClickCountRef.current = 0;
      if (onOpenSecretOwnerLogin) onOpenSecretOwnerLogin();
      return;
    }

    if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
    secretTimerRef.current = window.setTimeout(() => {
      secretClickCountRef.current = 0;
    }, 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if (
        isTyping ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        remoteBingo.getIsRemotePlayer() ||
        quizService.getIsRemoteParticipant()
      ) {
        return;
      }

      if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        sounds.playLineComplete();
        if (onOpenSecretOwnerLogin) onOpenSecretOwnerLogin();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      const params = new URLSearchParams(window.location.search);
      const hasInviteCode = params.has('kode') || params.has('code') || params.has('join');
      if (
        !hasInviteCode &&
        !remoteBingo.getIsRemotePlayer() &&
        !quizService.getIsRemoteParticipant() &&
        (window.location.search.includes('eier=true') || window.location.search.includes('admin=2026'))
      ) {
        if (onOpenSecretOwnerLogin) onOpenSecretOwnerLogin();
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [onOpenSecretOwnerLogin]);

  const handleSetPlayerCount = (targetCount: number) => {
    sounds.playClick();
    userEditedSetupRef.current = true;
    const clamped = Math.max(1, Math.min(100, targetCount));
    const updated = buildNamesForCount(clamped, playerNames);
    setPlayerNames(updated);
    setCustomCountInput(String(clamped));
  };

  const isOwnerUser = (authUser.isAuthenticated && authUser.role === 'owner') || ownerProfile.isUnlocked;
  const hasFullPaid = (authUser.isAuthenticated && sessionTimer.hasFullPaidAccess()) || isOwnerUser;
  const hasPaidSession = (authUser.isAuthenticated && sessionTimer.hasPaidAccess()) || isOwnerUser;

  useEffect(() => {
    if (!isOwnerUser && isOwnerEditMode) {
      setIsOwnerEditMode(false);
    }
  }, [isOwnerUser, isOwnerEditMode]);

  const handleToggleOwnerEditMode = () => {
    sounds.playClick();
    if (!isOwnerEditMode) {
      setEditAppTitle(ownerProfile.appTitle || 'Human-connection');
      setEditAppSubtitle(ownerProfile.appSubtitle || DEFAULT_NORWEGIAN_SUBTITLE);
      setEditCategoryOrder(
        ownerProfile.categoryOrder && ownerProfile.categoryOrder.length > 0
          ? ownerProfile.categoryOrder
          : DEFAULT_CATEGORY_ORDER
      );
      setEditVisibleModules(ownerProfile.visibleModules);
      setEditShowLiveDrum(ownerProfile.startPanelDefaults?.showLiveDrum ?? true);
      const normalizedLayout = normalizeLayoutPrefs(ownerProfile.layoutPrefs);
      setEditLayoutPrefs(normalizedLayout);
      setOwnerEditFeedback(null);
      setIsOwnerEditMode(true);
    } else {
      setIsOwnerEditMode(false);
    }
  };

  const handleMoveLayoutSection = (sectionId: string, direction: 'up' | 'down' | 'swap') => {
    sounds.playClick();
    setEditLayoutPrefs((prev) => {
      const normalized = normalizeLayoutPrefs(prev);
      const left = [...normalized.leftSectionOrder];
      const right = [...normalized.rightSectionOrder];
      const inLeft = left.includes(sectionId);
      if (direction === 'swap') {
        if (inLeft) {
          return {
            ...normalized,
            leftSectionOrder: left.filter((id) => id !== sectionId),
            rightSectionOrder: [...right, sectionId],
          };
        }
        return {
          ...normalized,
          leftSectionOrder: [...left, sectionId],
          rightSectionOrder: right.filter((id) => id !== sectionId),
        };
      }
      const list = inLeft ? left : right;
      const idx = list.indexOf(sectionId);
      if (idx === -1) return normalized;
      if (direction === 'up' && idx > 0) {
        [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      } else if (direction === 'down' && idx < list.length - 1) {
        [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      }
      return inLeft
        ? { ...normalized, leftSectionOrder: list }
        : { ...normalized, rightSectionOrder: list };
    });
  };

  const handleToggleDefaultCollapseSection = (sectionId: string) => {
    sounds.playClick();
    setEditLayoutPrefs((prev) => {
      const exists = prev.collapsedSections.includes(sectionId);
      const nextCollapsed = exists
        ? prev.collapsedSections.filter((id) => id !== sectionId)
        : [...prev.collapsedSections, sectionId];
      setLocalCollapsedSections(nextCollapsed);
      return { ...prev, collapsedSections: nextCollapsed };
    });
  };

  const handleToggleLocalCollapseSection = (sectionId: string) => {
    sounds.playClick();
    userToggledCollapseRef.current = true;
    setLocalCollapsedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleResetLayoutPrefs = () => {
    sounds.playClick();
    setEditLayoutPrefs(normalizeLayoutPrefs(DEFAULT_LAYOUT_PREFS));
    setLocalCollapsedSections([]);
  };

  const handleMoveCategory = (catKey: BingoTheme, direction: 'top' | 'up' | 'down') => {
    sounds.playClick();
    const list = [...editCategoryOrder];
    const idx = list.indexOf(catKey);
    if (idx === -1) return;
    if (direction === 'top') {
      const updated = [catKey, ...list.filter((k) => k !== catKey)];
      setEditCategoryOrder(updated);
      setSelectedTheme(catKey);
      return;
    }
    if (direction === 'up' && idx > 0) {
      [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      setEditCategoryOrder(list);
      if (idx - 1 === 0) setSelectedTheme(catKey);
    } else if (direction === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      setEditCategoryOrder(list);
    }
  };

  const handleSaveStartPanelSetup = async () => {
    if (!isOwnerUser) return;
    sounds.playClick();
    setIsSavingOwnerSetup(true);
    setOwnerEditFeedback(null);

    const nextDefaults = {
      defaultMode: selectedMode,
      defaultCardDisplayMode: cardDisplayMode,
      defaultCardsPerPlayer: Math.max(1, Math.min(6, numCardsPerPlayer)),
      defaultScreenDevice: screenDevice,
      defaultPlayerCount: Math.max(1, Math.min(100, playerNames.length)),
      showLiveDrum: editShowLiveDrum,
    };

    const cleanLayout = normalizeLayoutPrefs(editLayoutPrefs);

    const res = await ownerControl.saveAllToServer({
      appTitle: editAppTitle.trim() || 'Human-connection',
      appSubtitle: editAppSubtitle.trim(),
      categoryOrder: editCategoryOrder,
      visibleModules: editVisibleModules,
      startPanelDefaults: nextDefaults,
      layoutPrefs: cleanLayout,
    });

    setIsSavingOwnerSetup(false);
    if (res.success) {
      sounds.playLineComplete();
      userEditedSetupRef.current = false;
      setOwnerEditFeedback({
        type: 'success',
        text: res.savedToCloud
          ? `${ts.savedDefaultsSuccess} (Server + Firebase Firestore)`
          : ts.savedDefaultsSuccess,
      });
    } else {
      setOwnerEditFeedback({
        type: 'error',
        text: res.error || tx.saveErrorFallback,
      });
    }
  };

  const handleStartTrialGame = () => {
    sounds.playClick();
    const activated = sessionTimer.activateTrialSession(10);
    if (!activated) return;
    const trialHostName = playerNames[0] || tx.trialPlayerFallback;
    if (!authService.getCurrentUser().isAuthenticated) {
      authService.loginAsPlayer(trialHostName, '🎮', '#f59e0b');
    }
    remoteBingo.activateHostSession(undefined, trialHostName);
    setCanShowTrial(sessionTimer.canStartFreeTrial());
    setIsTrialActive(sessionTimer.isTrialSession() && sessionTimer.hasPaidAccess());
    if (onOpenGameSelector) {
      onOpenGameSelector();
    } else {
      onStartGame(
        selectedMode,
        selectedTheme,
        playerNames.length,
        numCardsPerPlayer,
        cardDisplayMode,
        playerNames,
        screenDevice
      );
    }
  };

  const handleStartGameClick = () => {
    sounds.playClick();
    onStartGame(
      selectedMode,
      selectedTheme,
      playerNames.length,
      numCardsPerPlayer,
      cardDisplayMode,
      playerNames,
      screenDevice
    );
  };

  // Keyboard shortcut to start: Enter or Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        handleStartGameClick();
      } else if (e.key === 'm' || e.key === 'M') {
        onToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMode, selectedTheme, playerNames, numCardsPerPlayer, cardDisplayMode, screenDevice, authUser, hasPaidSession, onToggleMute]);

  const CATEGORY_DETAILS: Record<BingoTheme, { label: string; subcategory: string; icon: string; description: string }> = {
    classic_joy: { ...ts.categories.classic_joy, icon: '🌟' },
    ril: { ...ts.categories.ril, icon: '🏆' },
    heartfelt: { ...ts.categories.heartfelt, icon: '🫂' },
    laughter: { ...ts.categories.laughter, icon: '😄' },
    kindness: { ...ts.categories.kindness, icon: '🤝' },
    gratitude: { ...ts.categories.gratitude, icon: '🌅' },
    family_kids: { ...ts.categories.family_kids, icon: '🧸' },
  };

  const currentCategory = CATEGORY_DETAILS[selectedTheme] || CATEGORY_DETAILS.classic_joy;
  const activeCategoryOrder = isOwnerEditMode
    ? editCategoryOrder
    : ownerProfile.categoryOrder && ownerProfile.categoryOrder.length > 0
    ? ownerProfile.categoryOrder
    : DEFAULT_CATEGORY_ORDER;

  const modules = isOwnerEditMode
    ? editVisibleModules
    : ownerProfile.visibleModules || {
        showIosInstall: false,
        showSchedule: false,
        showBigScreen: true,
        showMixer: true,
        showQuests: true,
        showPrint: true,
        showReport: true,
        showBroadcast: true,
        showParticipants: true,
        showDrumOnMobile: true,
        familyKidsMode: true,
      };

  const activeTitleRaw = isOwnerEditMode ? editAppTitle : ownerProfile.appTitle;
  const activeSubtitleRaw = isOwnerEditMode ? editAppSubtitle : ownerProfile.appSubtitle;
  const normalizedTitle = (activeTitleRaw || '').trim().toLowerCase();
  const isDefaultTitle =
    !activeTitleRaw ||
    normalizedTitle === 'joybingo' ||
    normalizedTitle === 'joy bingo' ||
    normalizedTitle === 'injoy together' ||
    normalizedTitle === 'human-connection' ||
    normalizedTitle === 'human connection';
  const normalizedSubtitle = (activeSubtitleRaw || '').trim();
  const isDefaultSubtitle =
    !activeSubtitleRaw ||
    normalizedSubtitle === DEFAULT_NORWEGIAN_SUBTITLE ||
    normalizedSubtitle === LEGACY_NORWEGIAN_SUBTITLE;

  const displayedAppTitle = isDefaultTitle ? t('app_title') : activeTitleRaw;
  const displayedAppSubtitle = isDefaultSubtitle ? ts.heroSubtitle : activeSubtitleRaw;

  const showDrumCard = isOwnerEditMode || (ownerProfile.startPanelDefaults?.showLiveDrum ?? true);

  const containerWidthClass =
    screenDevice === 'mobile'
      ? 'max-w-lg'
      : screenDevice === 'big_screen'
      ? 'max-w-[1880px]'
      : 'max-w-[1520px]';

  const selectScreenPreset = (preset: 'mobile' | 'desktop' | 'big_screen') => {
    sounds.playClick();
    userPickedScreenRef.current = true;
    if (!isOwnerEditMode) userEditedSetupRef.current = true;
    setScreenDevice(preset);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start px-3 py-2.5 sm:px-5 sm:py-3.5 lg:px-6 overflow-x-clip pb-24 sm:pb-10 bg-gradient-to-b from-[#130d07] via-[#211409] to-[#0c0804] text-amber-50">
      {/* Ambient background with generated table texture */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity filter blur-xs pointer-events-none"
        style={{ backgroundImage: `url('/joyful_bingo_backdrop.jpg')` }}
      />
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/85 pointer-events-none" />

      {/* UNIFIED STUDIO TOP BAR — Compact Cohesive Bar (Zero Gaps Between Headings) */}
      <header
        className="relative z-30 w-fit max-w-full mx-auto mb-3.5 px-3 sm:px-4 py-2 rounded-2xl bg-black/55 backdrop-blur-md border border-amber-500/25 shadow-xl flex flex-wrap items-center justify-center gap-2"
      >
        {/* Left Zone: Brand Identity + Subtle Hairline Divider + Primary Nav tightly grouped */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <GoldenCoinLogo size="sm" onClick={handleLogoSecretClick} />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-heading font-black text-sm sm:text-base text-amber-100 tracking-wide truncate">
                {displayedAppTitle}
              </span>
              <span className="text-amber-500/40 shrink-0" aria-hidden="true">·</span>
              <button
                onClick={() => {
                  sounds.playClick();
                  if (isOwnerUser && onOpenOwnerControl) {
                    onOpenOwnerControl();
                  } else if (onOpenEventTimeout) {
                    onOpenEventTimeout();
                  }
                }}
                title={isOwnerUser ? ts.unlimitedOwnerTitle : sessionTimer.getPackageLabel()}
                className={`text-[11px] font-mono tabular-nums font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  isOwnerUser
                    ? 'text-emerald-300 hover:text-emerald-200'
                    : isSessionExpired
                    ? 'text-rose-400 animate-pulse'
                    : 'text-amber-300/90 hover:text-amber-100'
                }`}
              >
                {isOwnerUser
                  ? `∞ ${ts.unlimitedOwner}`
                  : isSessionExpired
                  ? `${sessionTimer.getPackageLabel()} ${ts.expiredLabel}`
                  : `${sessionRemaining}`}
              </button>
            </div>
          </div>

          <span className="hidden sm:block h-5 w-px bg-amber-500/25 shrink-0" aria-hidden="true" />

          {/* Primary Game Actions + Quiz & Memory Rullegardin */}
          <nav
            aria-label={tx.navAriaLabel}
            className="flex flex-wrap items-center gap-1.5"
          >
            {onOpenRemoteBingo && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenRemoteBingo();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-400/45 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>📡</span>
                <span>{ts.remoteBingo}</span>
              </button>
            )}

            {modules.showBigScreen && onOpenAudience && (
              <button
                onClick={() => {
                  sounds.playClick();
                  if (!hasPaidSession) {
                    if (!authUser.isAuthenticated && onOpenAuth) {
                      onOpenAuth();
                      return;
                    }
                    if (onOpenVippsModal) {
                      onOpenVippsModal();
                      return;
                    }
                  }
                  onOpenAudience();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-400/45 text-amber-200 hover:text-white hover:border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>📺</span>
                <span>{ts.bigScreen}</span>
              </button>
            )}

            {(onOpenQuiz || onOpenMemory) && (
              <div className="relative" ref={quizMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsQuizMenuOpen((v) => !v);
                    setIsScreenMenuOpen(false);
                    setIsToolsMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    isQuizMenuOpen
                      ? 'bg-purple-400 text-slate-950 border-purple-300 font-black'
                      : 'bg-purple-950/80 border-purple-400/50 text-purple-100 hover:border-purple-300'
                  }`}
                  title={ts.quizAndMemoryTitle}
                >
                  <span>🎭</span>
                  <span>{ts.quizAndMemory}</span>
                  <span className="text-[10px]">{isQuizMenuOpen ? '▲' : '▼'}</span>
                </button>

                {isQuizMenuOpen && (
                  <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-[#181009] border border-purple-400/50 shadow-2xl p-2 z-50 space-y-1 text-left">
                    {onOpenQuiz && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setIsQuizMenuOpen(false);
                            onOpenQuiz('adult', hasPaidSession ? 'host' : 'join');
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/25 flex items-center gap-2 cursor-pointer"
                          title={ts.quizTitle}
                        >
                          <span>🎭</span>
                          <span>{ts.quizLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setIsQuizMenuOpen(false);
                            onOpenQuiz('family', hasPaidSession ? 'host' : 'join');
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-100 hover:bg-emerald-500/25 flex items-center gap-2 cursor-pointer"
                          title={ts.familyQuizTitle}
                        >
                          <span>🎈</span>
                          <span>{ts.familyQuizLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setIsQuizMenuOpen(false);
                            onOpenQuiz('christmas', hasPaidSession ? 'host' : 'join');
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-100 hover:bg-rose-500/25 flex items-center gap-2 cursor-pointer"
                          title={ts.christmasQuizTitle}
                        >
                          <span>🎄</span>
                          <span>{ts.christmasQuizLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setIsQuizMenuOpen(false);
                            onOpenQuiz('senior', hasPaidSession ? 'host' : 'join');
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-black text-amber-200 hover:bg-amber-500/25 flex items-center gap-2 cursor-pointer"
                          title={ts.seniorQuizTitle}
                        >
                          <span>👵</span>
                          <span>{ts.seniorQuizLabel}</span>
                        </button>
                      </>
                    )}
                    {onOpenMemory && (
                      <>
                        <div className="h-px bg-purple-400/25 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setIsQuizMenuOpen(false);
                            onOpenMemory();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-black text-sky-100 hover:bg-sky-500/25 flex items-center gap-2 cursor-pointer"
                          title={ts.memoryTitle}
                        >
                          <span>🧩</span>
                          <span>{ts.memoryLabel}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <span className="hidden lg:block h-5 w-px bg-amber-500/25 shrink-0" aria-hidden="true" />

        {/* Screen Size Rullegardin + Auth/Owner + Tools Dropdown + Language & Sound */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {/* Skjermstørrelse Rullegardin (Mobil / PC / TV & Prosjektor) */}
          <div className="relative" ref={screenMenuRef}>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsScreenMenuOpen((v) => !v);
                setIsQuizMenuOpen(false);
                setIsToolsMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isScreenMenuOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-black/60 border-amber-500/35 text-amber-200 hover:border-amber-400'
              }`}
              title={tx.screenSizeMenuTitle}
            >
              <span>{screenDevice === 'mobile' ? '📱' : screenDevice === 'big_screen' ? '📺' : '💻'}</span>
              <span>
                {screenDevice === 'mobile' ? ts.screenMobileShort : screenDevice === 'big_screen' ? ts.screenBigScreenShort : ts.screenDesktopShort}
              </span>
              <span className="text-[10px]">{isScreenMenuOpen ? '▲' : '▼'}</span>
            </button>

            {isScreenMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#181009] border border-amber-400/50 shadow-2xl p-2 z-50 space-y-1 text-left">
                {([
                  { id: 'mobile', icon: '📱', label: ts.screenMobile.replace(/^📱\s*/, '') },
                  { id: 'desktop', icon: '💻', label: ts.screenDesktop.replace(/^💻\s*/, '') },
                  { id: 'big_screen', icon: '📺', label: ts.screenBigScreen.replace(/^📺\s*/, '') },
                ] as const).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      selectScreenPreset(d.id);
                      setIsScreenMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 cursor-pointer ${
                      screenDevice === d.id
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-amber-100 hover:bg-amber-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </span>
                    {screenDevice === d.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onOpenAuth && authUser.isAuthenticated && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuth();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-black/50 border border-emerald-400/50 text-white hover:border-emerald-300 whitespace-nowrap"
              title={authUser.name}
            >
              <span>{authUser.avatar}</span>
              <span className="max-w-[100px] truncate font-bold">{authUser.name}</span>
            </button>
          )}

          {onOpenOwnerControl && isOwnerUser && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenOwnerControl();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title={ts.openOwnerPanel}
            >
              <span>👑</span>
              <span className="hidden sm:inline">{ts.ownerPanel}</span>
            </button>
          )}

          {/* Consolidated Tools Dropdown (prevents multi-row clutter on top-right) */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsToolsMenuOpen((v) => !v);
                setIsQuizMenuOpen(false);
                setIsScreenMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isToolsMenuOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-amber-950/70 border-amber-500/35 text-amber-200 hover:border-amber-400'
              }`}
              title={ts.toolsBtnTitle}
            >
              <span>⚙️</span>
              <span>{ts.toolsBtn}</span>
              <span className="text-[10px]">{isToolsMenuOpen ? '▲' : '▼'}</span>
            </button>

            {isToolsMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#181009] border border-amber-400/50 shadow-2xl p-2 z-50 space-y-1 text-left">
                {modules.showParticipants !== false && onOpenParticipants && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenParticipants();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-100 hover:bg-amber-500/20 flex items-center justify-between cursor-pointer"
                  >
                    <span>👥 {ts.participants}</span>
                    <span className="font-mono text-amber-300">{playerNames.length}</span>
                  </button>
                )}

                {modules.showBroadcast !== false && onOpenBroadcast && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenBroadcast();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-blue-200 hover:bg-blue-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📢</span>
                    <span>{ts.broadcast}</span>
                  </button>
                )}

                {modules.showMixer && onOpenMixer && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenMixer();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🎛️</span>
                    <span>{ts.mixer}</span>
                  </button>
                )}

                {modules.showQuests && onOpenQuests && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenQuests();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🎯</span>
                    <span>{ts.quests}</span>
                  </button>
                )}

                {modules.showSchedule && onOpenSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenSchedule();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📅</span>
                    <span>{ts.schedule}</span>
                  </button>
                )}

                {modules.showPrint !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenPrintModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🖨️</span>
                    <span>{ts.printCards}</span>
                  </button>
                )}

                {modules.showIosInstall && onOpenIosInstall && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenIosInstall();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>🍎</span>
                    <span>{ts.iosApp}</span>
                  </button>
                )}

                {modules.showReport !== false && onOpenReportProblem && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsToolsMenuOpen(false);
                      onOpenReportProblem();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>{ts.report}</span>
                  </button>
                )}

                {isOwnerUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      handleToggleOwnerEditMode();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-black text-emerald-200 hover:bg-emerald-500/20 flex items-center gap-2 cursor-pointer border-t border-white/10 mt-1 pt-2"
                  >
                    <span>{isOwnerEditMode ? '✅' : '✏️'}</span>
                    <span>{isOwnerEditMode ? ts.doneEditing : ts.editStartPanel}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <LanguageSelector variant="compact" />

          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            aria-label={isMuted ? ts.soundOn : ts.soundOff}
            className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-200 hover:border-amber-400 transition-all cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* TIDSVARSEL FØR SPILLETID ER UTLØPT */}
      {!isSessionExpired &&
        hasPaidSession &&
        !isOwnerUser &&
        sessionTimer.getRemainingMs() <= 5 * 60 * 1000 &&
        sessionTimer.getRemainingMs() > 0 && (
          <div className={`relative z-20 ${containerWidthClass} mx-auto w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/95 via-amber-950/95 to-rose-950/95 border-2 border-rose-500 shadow-xl flex items-center justify-between gap-3 text-left animate-pulse`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <div className="font-heading font-black text-xs sm:text-sm text-rose-200">
                  {ts.timeWarningTitlePrefix} {sessionRemaining} {ts.timeWarningTitleSuffix}
                </div>
                <p className="text-[11px] text-amber-200/90 leading-tight">{ts.timeWarningDesc}</p>
              </div>
            </div>
            {onOpenVippsModal && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenVippsModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow"
              >
                {ts.extendPlaytime}
              </button>
            )}
          </div>
        )}

      {/* EIERENS DIREKTE REDIGERINGSPANEL FOR STARTPANELET & LAYOUT */}
      {isOwnerUser && isOwnerEditMode && (
        <div className={`relative z-20 w-full ${containerWidthClass} mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-[#151f19] to-black/95 border-2 border-emerald-400 shadow-2xl space-y-3.5 text-left animate-fadeIn`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2.5">
            <div>
              <div className="font-heading font-black text-sm text-emerald-200 flex items-center gap-1.5">
                <span>👑</span>
                <span>{ts.ownerEditBannerTitle}</span>
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-0.5">
                {ts.ownerEditBannerDesc} {tx.ownerEditLayoutHint}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSavingOwnerSetup}
                onClick={() => void handleSaveStartPanelSetup()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center gap-1.5 disabled:opacity-60"
              >
                <span>💾</span>
                <span>{isSavingOwnerSetup ? ts.savingBtn : ts.saveStartPanelBtn}</span>
              </button>
              {onOpenOwnerControl && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenOwnerControl();
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs cursor-pointer"
                >
                  ⚙️ {ts.openFullOwnerModalBtn}
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleOwnerEditMode}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-bold text-xs cursor-pointer"
              >
                ✅ {ts.doneEditing}
              </button>
            </div>
          </div>

          {ownerEditFeedback && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold border ${
                ownerEditFeedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-400/50 text-rose-200'
              }`}
            >
              {ownerEditFeedback.type === 'success' ? '✅ ' : '⚠️ '}
              {ownerEditFeedback.text}
            </div>
          )}

          {/* App-tittel & Undertittel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-emerald-200 block mb-1">
                {ts.editAppTitleLabel}
              </label>
              <input
                type="text"
                value={editAppTitle}
                onChange={(e) => setEditAppTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/70 border border-emerald-500/40 text-xs text-amber-100 font-bold outline-none focus:border-emerald-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-emerald-200 block mb-1">
                {ts.editAppSubtitleLabel}
              </label>
              <input
                type="text"
                value={editAppSubtitle}
                onChange={(e) => setEditAppSubtitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/70 border border-emerald-500/40 text-xs text-amber-100 font-bold outline-none focus:border-emerald-300"
              />
            </div>
          </div>

          {/* Synlige moduler & knapper direkte på startpanelet */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-200">{ts.editModulesLabel}</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'showBigScreen', label: `📺 ${ts.bigScreen}` },
                { key: 'showParticipants', label: `👥 ${ts.participants}` },
                { key: 'showBroadcast', label: `📢 ${ts.broadcast}` },
                { key: 'showMixer', label: `🎛️ ${ts.mixer}` },
                { key: 'showQuests', label: `🎯 ${ts.quests}` },
                { key: 'showSchedule', label: `📅 ${ts.schedule}` },
                { key: 'showReport', label: `💬 ${ts.report}` },
                { key: 'showPrint', label: `🖨️ ${ts.printCards}` },
                { key: 'showIosInstall', label: `🍎 ${ts.iosApp}` },
                { key: 'showDrumOnMobile', label: tx.toggleDrumMobile },
                { key: 'familyKidsMode', label: tx.toggleFamilyKids },
              ].map((mod) => {
                const active = Boolean(editVisibleModules[mod.key as keyof typeof editVisibleModules]);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setEditVisibleModules((prev) => ({
                        ...prev,
                        [mod.key]: !active,
                      }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                      active
                        ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100'
                        : 'bg-black/60 border-rose-500/30 text-rose-300/80 line-through'
                    }`}
                  >
                    {active ? '✓ ' : '✕ '}
                    {mod.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setEditShowLiveDrum((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                  editShowLiveDrum
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100'
                    : 'bg-black/60 border-rose-500/30 text-rose-300/80 line-through'
                }`}
              >
                {editShowLiveDrum ? '✓ ' : '✕ '}🎰 {ts.showLiveDrumToggle}
              </button>
            </div>
          </div>

          {/* Layout, Kolonne-bytte & Quiz-dashboard standardinnstillinger */}
          <div className="pt-2.5 border-t border-emerald-500/25 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setEditLayoutPrefs((prev) => ({ ...prev, swapColumns: !prev.swapColumns }));
                }}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-all ${
                  editLayoutPrefs.swapColumns
                    ? 'bg-amber-400 text-slate-950 border-white font-black'
                    : 'bg-black/60 border-emerald-400/40 text-emerald-100 hover:bg-white/10'
                }`}
              >
                ⇄ {tx.swapColumnsBtn} {editLayoutPrefs.swapColumns ? tx.swappedTag : ''}
              </button>

              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-emerald-500/30">
                <span className="text-emerald-200 font-bold px-1">{tx.quizSizeLabel}</span>
                {[
                  { id: 'compact' as const, label: tx.quizCompact },
                  { id: 'standard' as const, label: tx.quizStandard },
                  { id: 'expanded' as const, label: tx.quizExpanded },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setEditLayoutPrefs((prev) => ({ ...prev, quizDefaultSize: sz.id }));
                    }}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      editLayoutPrefs.quizDefaultSize === sz.id
                        ? 'bg-emerald-400 text-slate-950 font-black'
                        : 'text-emerald-100 hover:bg-white/10'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-emerald-500/30">
                <span className="text-emerald-200 font-bold px-1">{tx.quizSideLabel}</span>
                {[
                  { id: 'left' as const, label: tx.sideLeft },
                  { id: 'center' as const, label: tx.sideCenter },
                  { id: 'right' as const, label: tx.sideRight },
                ].map((dk) => (
                  <button
                    key={dk.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setEditLayoutPrefs((prev) => ({ ...prev, quizDefaultDock: dk.id }));
                    }}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      editLayoutPrefs.quizDefaultDock === dk.id
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-emerald-100 hover:bg-white/10'
                    }`}
                  >
                    {dk.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setEditLayoutPrefs((prev) => ({ ...prev, quizSwapColumns: !prev.quizSwapColumns }));
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer border ${
                  editLayoutPrefs.quizSwapColumns
                    ? 'bg-amber-400 text-slate-950 border-white font-black'
                    : 'bg-black/60 border-emerald-500/30 text-emerald-100 hover:bg-white/10'
                }`}
              >
                ⇄ {tx.quizColumnsLabel} {editLayoutPrefs.quizSwapColumns ? tx.swappedTag.replace(/[()]/g, '') : tx.standardTag}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetLayoutPrefs}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold cursor-pointer"
            >
              {tx.resetLayoutBtn}
            </button>
          </div>
        </div>
      )}

      {/* ADAPTIVE MULTI-SCREEN WORKSPACE: Single Column on Mobile, Swappable & Reorderable 12-Col Cockpit on PC / TV / Projector */}
      {(() => {
        const activeLayout = isOwnerEditMode
          ? editLayoutPrefs
          : normalizeLayoutPrefs(ownerProfile.layoutPrefs);

        const SECTION_META: Record<string, { label: string; collapsible?: boolean }> = {
          hero: { label: tx.secHero, collapsible: false },
          host_code: { label: tx.secHostCode, collapsible: true },
          kahoot_join: { label: tx.secKahootJoin, collapsible: true },
          drum: { label: tx.secDrum, collapsible: true },
          status_banner: { label: tx.secStatusBanner, collapsible: false },
          category: { label: `📂 ${ts.sec1Title}`, collapsible: true },
          mode: { label: `✨ ${ts.sec2Title}`, collapsible: true },
          card_format: { label: `🌟 ${ts.sec3Title}`, collapsible: true },
          players: { label: `👥 ${ts.sec4Title}`, collapsible: true },
          cards_screen: { label: tx.secCardsScreen, collapsible: true },
          remote_strip: { label: `📡 ${ts.remoteTitle}`, collapsible: true },
          start_actions: { label: tx.secStartActions, collapsible: false },
        };

        const renderWrappedSection = (
          sectionId: string,
          colIdx: number,
          colLen: number,
          isInRightContainer: boolean,
          content: React.ReactNode
        ) => {
          const meta = SECTION_META[sectionId] || { label: sectionId, collapsible: true };
          const isCollapsed = localCollapsedSections.includes(sectionId);
          const isDefaultCollapsed = editLayoutPrefs.collapsedSections.includes(sectionId);
          const showControls = isOwnerEditMode || meta.collapsible !== false;
          const cardWrapClass = isInRightContainer
            ? ''
            : ALL_RIGHT_DEFAULT.includes(sectionId)
              ? 'p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/30 shadow-xl'
              : '';

          return (
            <div key={sectionId} className={`space-y-1 ${cardWrapClass}`}>
              {showControls && (
                <div
                  className={`flex items-center justify-between gap-2 px-2 py-1 rounded-xl text-[11px] ${
                    isOwnerEditMode
                      ? 'bg-emerald-950/75 border border-emerald-400/50 text-emerald-100'
                      : 'bg-black/25 border border-amber-500/15 text-amber-200/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleLocalCollapseSection(sectionId)}
                    className="flex items-center gap-1.5 font-bold hover:text-white cursor-pointer truncate"
                    title={isCollapsed ? tx.expandSectionTitle : tx.collapseSectionTitle}
                  >
                    <span>{isCollapsed ? '▸' : '▾'}</span>
                    <span className="truncate">{meta.label}</span>
                    {isCollapsed && (
                      <span className="text-[10px] text-amber-300/75 font-normal">{tx.collapsedTag}</span>
                    )}
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {isOwnerEditMode && (
                      <>
                        <button
                          type="button"
                          disabled={colIdx === 0}
                          onClick={() => handleMoveLayoutSection(sectionId, 'up')}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                          title={tx.moveUpTitle}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={colIdx === colLen - 1}
                          onClick={() => handleMoveLayoutSection(sectionId, 'down')}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                          title={tx.moveDownTitle}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLayoutSection(sectionId, 'swap')}
                          className="px-1.5 py-0.5 rounded bg-amber-400/25 hover:bg-amber-400/40 text-amber-200 text-[10px] font-bold cursor-pointer"
                          title={tx.swapColTitle}
                        >
                          ⇄
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDefaultCollapseSection(sectionId)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            isDefaultCollapsed
                              ? 'bg-emerald-400 text-slate-950 font-black'
                              : 'bg-white/10 hover:bg-white/20 text-slate-200'
                          }`}
                          title={tx.defaultCollapseTitle}
                        >
                          📦 {isDefaultCollapsed ? tx.hiddenDefaultTag : tx.openDefaultTag}
                        </button>
                      </>
                    )}
                    {!isOwnerEditMode && meta.collapsible !== false && (
                      <button
                        type="button"
                        onClick={() => handleToggleLocalCollapseSection(sectionId)}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-bold text-amber-200/80 cursor-pointer"
                      >
                        {isCollapsed ? tx.expandShort : tx.minimizeShort}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!isCollapsed && content}
            </div>
          );
        };

        const renderHeroSection = () => (
          <div className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl bg-black/35 border border-amber-500/20">
            <GoldenCoinLogo size="lg" showGlow onClick={handleLogoSecretClick} />
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 leading-none">
                  {displayedAppTitle}
                </h1>
                <span className="text-xs font-bold text-emerald-300">· {ts.heroBadge}</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/85 leading-snug mt-1">
                {displayedAppSubtitle}
              </p>
            </div>
          </div>
        );

        const renderHostCodeSection = () => {
          if (!(hasPaidSession && !remoteBingo.getIsRemotePlayer() && !quizService.getIsRemoteParticipant())) {
            return null;
          }
          return (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-[#2a1909] to-amber-950/85 border border-amber-400/60 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  <span className="text-xs font-black text-amber-100 uppercase tracking-wider">
                    {ts.activeRoomCodeTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/80 border border-amber-400 font-mono font-black text-base text-amber-300 tracking-widest select-all">
                    {activeHostCode || '----'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-300">
                  {remoteBingo.isCloudRoomSynced()
                    ? ts.openEverywhereBadge
                    : isServerActive
                    ? ts.openForMobileTvBadge
                    : ts.activatingBadge}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-snug">
                {ts.roomCodeOpenInfo}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const code = activeHostCode || remoteBingo.ensurePaidHostCode();
                    if (code) {
                      navigator.clipboard?.writeText(code).catch(() => {});
                      setCopiedHostCode(true);
                      setTimeout(() => setCopiedHostCode(false), 1800);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow transition-all"
                >
                  {copiedHostCode ? ts.copiedBtn : ts.copyCodeBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const code = activeHostCode || remoteBingo.ensurePaidHostCode();
                    if (code) {
                      const link = `${window.location.origin}/?kode=${encodeURIComponent(code)}`;
                      navigator.clipboard?.writeText(link).catch(() => {});
                      setCopiedHostLink(true);
                      setTimeout(() => setCopiedHostLink(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 font-bold text-xs cursor-pointer transition-all"
                >
                  {copiedHostLink ? ts.copiedLinkBtn : ts.copyInviteLinkBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    remoteBingo.reactivateCurrentHostCode();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 font-bold text-xs cursor-pointer transition-all"
                  title={ts.reactivateCodeBtn}
                >
                  🔄 {ts.reactivateCodeBtn}
                </button>
              </div>
            </div>
          );
        };

        const renderKahootJoinSection = () => (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#0d241c] to-cyan-950/85 border border-emerald-400/60 shadow-xl space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-slate-950 flex items-center justify-center text-lg font-black shadow shrink-0">
                🎯
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading font-black text-xs sm:text-sm text-white">
                    {ts.kahootJoinTitle}
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-300">
                    · {ts.kahootJoinBadge}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/85 mt-0.5 leading-snug">
                  {ts.kahootJoinDesc}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                placeholder={ts.kahootCodePlaceholder}
                className="w-full sm:w-32 px-3 py-2 rounded-xl bg-black/70 border border-emerald-400/50 focus:border-emerald-300 text-xs sm:text-sm font-mono font-black tracking-wider text-amber-200 placeholder-emerald-200/40 outline-none text-center"
              />
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onQuickJoinWithCode) {
                    onQuickJoinWithCode(quickJoinCode.trim(), 'quiz');
                  } else if (onOpenQuiz) {
                    onOpenQuiz('family', 'join');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                🎯 {ts.kahootJoinQuizBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onQuickJoinWithCode) {
                    onQuickJoinWithCode(quickJoinCode.trim(), 'bingo');
                  } else if (onOpenRemoteBingo) {
                    onOpenRemoteBingo();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                🎲 {ts.kahootJoinBingoBtn}
              </button>
            </div>

            <div className="pt-2 border-t border-emerald-400/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-200/90">
              <span className="font-semibold">🛡️ {ts.kahootSafetyBadges}</span>
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenPrivacy();
                  }}
                  className="underline font-bold text-amber-200 hover:text-white cursor-pointer"
                >
                  📜 {ts.privacyBtn}
                </button>
              )}
            </div>
          </div>
        );

        const renderDrumSection = () => {
          if (!showDrumCard) return null;
          return (
            <div className="bg-gradient-to-b from-[#24150b] via-[#1a0f08] to-[#120a05] border border-amber-400/50 rounded-2xl p-3.5 sm:p-4 shadow-2xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">🎰</span>
                  <div className="min-w-0">
                    <h2 className="font-heading font-black text-xs sm:text-sm text-amber-100 truncate">
                      {ts.drumTitle} · <span className="text-emerald-300 font-semibold">{ts.drumBadge}</span>
                    </h2>
                    <p className="text-[11px] text-amber-200/75 truncate">
                      {hasFullPaid ? ts.drumDescPaid : isTrialActive ? ts.drumDescTrial : ts.drumDescGuest}
                    </p>
                  </div>
                </div>

                {!hasPaidSession ? (
                  canShowTrial ? (
                    <button
                      type="button"
                      onClick={handleStartTrialGame}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <span>🎮</span>
                      <span>{ts.try5MinFree}</span>
                    </button>
                  ) : null
                ) : (
                  onOpenGameSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onOpenGameSelector();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <span>🎲</span>
                      <span>{ts.choose4Games}</span>
                    </button>
                  )
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-black/50 shadow-inner">
                <BallCageCanvas
                  calledBalls={previewCalled}
                  uncalledBalls={previewUncalled}
                  onBallDrawn={handlePreviewBallDrawn}
                  isAutoCalling={isPreviewAuto}
                  onToggleAuto={() => setIsPreviewAuto(!isPreviewAuto)}
                  scrambleTrigger={previewScrambleTrigger}
                  onScramble={() => setPreviewScrambleTrigger((p) => p + 1)}
                  canDraw={!remoteBingo.getIsRemotePlayer()}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-200/80">
                <span className="font-semibold">✨ {ts.drumHint}</span>
                <span className="font-mono text-amber-400 font-bold">{ts.drumMeta}</span>
              </div>
            </div>
          );
        };

        const renderSectionById = (sectionId: string, idx: number, len: number, inRightContainer: boolean) => {
          let node: React.ReactNode = null;
          if (sectionId === 'hero') node = renderHeroSection();
          else if (sectionId === 'host_code') node = renderHostCodeSection();
          else if (sectionId === 'kahoot_join') node = renderKahootJoinSection();
          else if (sectionId === 'drum') node = renderDrumSection();
          else if (sectionId === 'status_banner') node = renderStatusBannerSection();
          else if (sectionId === 'category') node = renderCategorySection();
          else if (sectionId === 'mode') node = renderModeSection();
          else if (sectionId === 'card_format') node = renderCardFormatSection();
          else if (sectionId === 'players') node = renderPlayersSection();
          else if (sectionId === 'cards_screen') node = renderCardsScreenSection();
          else if (sectionId === 'remote_strip') node = renderRemoteStripSection();
          else if (sectionId === 'start_actions') node = renderStartActionsSection();

          if (!node) return null;
          return renderWrappedSection(sectionId, idx, len, inRightContainer, node);
        };

        // OBLIGATORISK INNLOGGING & BETALINGSBANNER
        const renderStatusBannerSection = () => (
        !authUser.isAuthenticated ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#25101e] to-black/90 border-2 border-purple-500 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-lg ring-2 ring-white/20">
                🔒
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm sm:text-base text-purple-200 uppercase tracking-wide">
                    {ts.lockBannerTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[10px] font-black uppercase">
                    {ts.lockBadge}
                  </span>
                </div>
                <p className="text-2xs sm:text-xs text-purple-200/90 leading-relaxed mt-1">{ts.lockBannerDesc}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canShowTrial && (
                <button
                  type="button"
                  onClick={handleStartTrialGame}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>🎮</span>
                  <span>{ts.try5MinFree}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-500 hover:brightness-110 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>🔑</span>
                <span>{ts.loginAndPayBtn}</span>
              </button>
            </div>
          </div>
        ) : !hasPaidSession ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#241308] to-black/90 border-2 border-amber-400 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg ring-2 ring-white/30">
                💳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm sm:text-base text-white tracking-wide">
                    {ts.payBannerTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 text-[10px] font-black uppercase">
                    {ts.payMethodBadge}
                  </span>
                </div>
                <p className="text-2xs sm:text-xs text-amber-200/90 leading-relaxed mt-1">
                  {ts.payLoggedInAs} <strong>{authUser.name}</strong> (
                  {authUser.role === 'host' ? ts.payRoleHost : ts.payRolePlayer}). {ts.payBannerTextAfterRole} (
                  {monetizationSettings.price20MinTrial ?? 19},- / {monetizationSettings.price1Hour ?? 49},- /{' '}
                  {monetizationSettings.price2Hours ?? 89},-)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canShowTrial && (
                <button
                  type="button"
                  onClick={handleStartTrialGame}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-xl transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>🎮</span>
                  <span>{ts.try5MinFree}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenVippsModal) onOpenVippsModal();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shrink-0 cursor-pointer shadow-xl transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>💳</span>
                <span>{ts.chooseAndPayBtn}</span>
              </button>
            </div>
          </div>
        ) : !hasFullPaid ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-[#2a1708] to-black/90 border-2 border-amber-400 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg ring-2 ring-amber-200">
                🎮
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm sm:text-base text-amber-100 tracking-wide">
                    {ts.trialBannerTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 text-[10px] font-black font-mono">
                    {sessionRemaining}
                  </span>
                </div>
                <p className="text-2xs sm:text-xs text-amber-200/90 leading-relaxed mt-1">{ts.trialBannerDesc}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenGameSelector && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenGameSelector();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  <span>🎲</span>
                  <span>{ts.choose4Games}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleStartGameClick}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-100 font-black text-xs cursor-pointer shadow-lg"
              >
                {ts.resumeTrialBtn}
              </button>
              {onOpenVippsModal && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenVippsModal();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
                >
                  {ts.buyFullTimeBtn}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0a2016] to-black/90 border-2 border-emerald-400 shadow-2xl flex flex-col gap-3 text-left overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg ring-2 ring-emerald-300">
                  🎉
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-black text-sm sm:text-base text-white tracking-wide">
                      {isOwnerUser ? ts.ownerModeActiveTitle : ts.paidPackageActiveTitle}
                    </span>
                    <span className="text-[11px] font-black uppercase text-emerald-300 font-mono tabular-nums">
                      · {isOwnerUser ? ts.ownerInfiniteBadge : ts.freeFlowBadge}
                    </span>
                  </div>
                  <p className="text-2xs sm:text-xs text-emerald-200/90 leading-relaxed mt-1">
                    {ts.payLoggedInAs} <strong>{authUser.name}</strong> · {ts.activePlaytimeLabel}{' '}
                    <strong>{isOwnerUser ? ts.unlimitedOwner : sessionRemaining}</strong>. {ts.paidPackageDescSuffix}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                {isOwnerUser && (
                  <button
                    type="button"
                    onClick={handleToggleOwnerEditMode}
                    className={`px-3 py-2 rounded-xl font-black text-xs cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-1.5 border whitespace-nowrap ${
                      isOwnerEditMode
                        ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                        : 'bg-white/10 hover:bg-white/20 text-emerald-100 border-emerald-400/50'
                    }`}
                  >
                    <span>{isOwnerEditMode ? '✅' : '✏️'}</span>
                    <span>{isOwnerEditMode ? ts.doneEditing : ts.editStartPanel}</span>
                  </button>
                )}
                {isOwnerUser && onOpenOwnerControl && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onOpenOwnerControl();
                    }}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-1.5 ring-1 ring-amber-200/70 whitespace-nowrap"
                    title={ts.openOwnerPanel}
                  >
                    <span>👑</span>
                    <span>{ts.openOwnerPanel}</span>
                  </button>
                )}
                {onOpenGameSelector && (
                  <button
                    type="button"
                    onClick={() => onOpenGameSelector()}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>🎲</span>
                    <span>{ts.all4Games}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ));

        // 1. KATEGORI & INNHOLD SOM RULLEGARDIN
        const renderCategorySection = () => (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label htmlFor="theme-select" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>📂</span>
              <span>{ts.sec1Title}</span>
            </label>
            <span className="text-2xs text-amber-300/70 font-semibold">{ts.sec1Sub}</span>
          </div>

          <div className="relative">
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={(e) => {
                sounds.playClick();
                if (!isOwnerEditMode) userEditedSetupRef.current = true;
                setSelectedTheme(e.target.value as BingoTheme);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border-2 border-amber-400/60 focus:border-amber-300 text-xs sm:text-sm text-amber-100 font-bold outline-none cursor-pointer shadow-lg appearance-none pr-10"
            >
              {activeCategoryOrder.map((catKey, idx) => {
                const item = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS.classic_joy;
                return (
                  <option key={catKey} value={catKey}>
                    {idx === 0 ? `${ts.favorite1Tag} ` : ''}
                    {item.icon} {item.label} — {item.subcategory}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-300 font-bold text-xs">
              ▼
            </div>
          </div>

          {/* Aktiv kategori-sammendrag boks */}
          <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl shrink-0">{currentCategory.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-black text-amber-200">{currentCategory.label}</span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-bold">
                    {ts.activeCategoryBadge}
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/70 leading-snug">
                  {currentCategory.subcategory} — {currentCategory.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedTheme === 'ril' && (
                <span className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold shrink-0">
                  {ts.musicSongActive}
                </span>
              )}
              {isOwnerUser && isOwnerEditMode && (
                <button
                  type="button"
                  onClick={() => handleMoveCategory(selectedTheme, 'top')}
                  disabled={activeCategoryOrder[0] === selectedTheme}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[10px] font-black cursor-pointer disabled:opacity-50"
                >
                  {activeCategoryOrder[0] === selectedTheme ? ts.isFavorite1 : `⭐ ${ts.setAsFavorite1}`}
                </button>
              )}
            </div>
          </div>

          {/* Eier: direkte kategorirekkefølge i redigeringsmodus */}
          {isOwnerUser && isOwnerEditMode && (
            <div className="mt-2 p-2.5 rounded-xl bg-black/50 border border-emerald-500/30 space-y-1.5">
              {editCategoryOrder.map((catKey, idx) => {
                const item = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS.classic_joy;
                return (
                  <div
                    key={catKey}
                    className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/20 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-emerald-300 font-bold">#{idx + 1}</span>
                      <span>{item.icon}</span>
                      <span className="font-bold text-amber-100 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveCategory(catKey, 'up')}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                      >
                        ▲ {ts.moveUp}
                      </button>
                      <button
                        type="button"
                        disabled={idx === editCategoryOrder.length - 1}
                        onClick={() => handleMoveCategory(catKey, 'down')}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                      >
                        ▼ {ts.moveDown}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );

        // 2. SPILLMODUS
        const renderModeSection = () => (
        <div className="pt-2 border-t border-amber-500/15">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-1.5 text-left">
            {ts.sec2Title}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'ALL_IN_ONE', title: ts.modeAllTitle, desc: ts.modeAllDesc, icon: '✨' },
              { id: 'HUMAN_BINGO', title: ts.modeBoardTitle, desc: ts.modeBoardDesc, icon: '📋' },
              { id: 'CALLER_CAGE', title: ts.modeCallerTitle, desc: ts.modeCallerDesc, icon: '🎲' },
              { id: 'PASS_PLAY', title: ts.modePassTitle, desc: ts.modePassDesc, icon: '🤝' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (!isOwnerEditMode) userEditedSetupRef.current = true;
                  setSelectedMode(m.id as GameMode);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white shadow-md'
                    : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span>{m.icon}</span>
                  <span>{m.title}</span>
                </div>
                <div className={`text-[10px] leading-tight ${selectedMode === m.id ? 'text-slate-950/80' : 'text-amber-200/60'}`}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
        );

        // 3. KORTFORMAT PÅ BRETTET
        const renderCardFormatSection = () => (
        <div className="pt-2 border-t border-amber-500/15">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">{ts.sec3Title}</span>
            <span className="text-2xs text-amber-400 font-mono font-bold">
              {cardDisplayMode === 'both'
                ? ts.fmtBothShort
                : cardDisplayMode === 'numbers'
                ? ts.fmtNumbersShort
                : ts.fmtPromptsShort}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'both', label: ts.fmtBothLabel, icon: '🌟' },
              { id: 'numbers', label: ts.fmtNumbersLabel, icon: '🔢' },
              { id: 'prompts', label: ts.fmtPromptsLabel, icon: '🔤' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (!isOwnerEditMode) userEditedSetupRef.current = true;
                  setCardDisplayMode(fmt.id as CardDisplayMode);
                }}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                  cardDisplayMode === fmt.id
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black ring-2 ring-white shadow-md'
                    : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-black/60'
                }`}
              >
                <span className="mr-1">{fmt.icon}</span>
                <span>{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>
        );

        // 4. ANTALL SPILLERE & NAVN
        const renderPlayersSection = () => {
          if (selectedMode === 'CALLER_CAGE') return null;
          return (
          <div className="pt-2 border-t border-amber-500/15">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300/90">{ts.sec4Title}</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-black">
                  {playerNames.length} {playerNames.length === 1 ? ts.playerSingular : ts.playerPlural}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-xl border border-amber-500/30">
                <span className="text-2xs text-amber-300 font-bold">{ts.setCountLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customCountInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCustomCountInput(raw);
                    const n = parseInt(raw, 10);
                    if (!isNaN(n) && n > 0 && n <= 100) {
                      handleSetPlayerCount(n);
                    }
                  }}
                  className="w-14 px-1.5 py-0.5 rounded-lg bg-black/80 border border-amber-500/50 text-center font-mono font-bold text-xs text-amber-200 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2.5">
              {[1, 2, 4, 6, 8, 12, 16, 25].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleSetPlayerCount(cnt)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    playerNames.length === cnt
                      ? 'bg-amber-400 text-slate-950 font-black ring-1 ring-white shadow'
                      : 'bg-black/40 text-amber-200/80 hover:bg-black/60 border border-amber-500/20'
                  }`}
                >
                  {cnt === 1 ? ts.soloLabel : `${cnt} ${ts.pcsSuffix}`}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 bg-black/30 p-2 rounded-xl border border-amber-500/15">
              {playerNames.map((pName, idx) => {
                const colors = ['#f59e0b', '#059669', '#7c3aed', '#0284c7', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md font-bold text-white text-[10px] flex items-center justify-center shrink-0 shadow"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    >
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => {
                        const updated = [...playerNames];
                        updated[idx] = e.target.value;
                        setPlayerNames(updated);
                      }}
                      placeholder={`${ts.playerPlaceholder} ${idx + 1}...`}
                      className="flex-1 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/30 focus:border-amber-400 text-xs text-amber-100 font-bold outline-none"
                    />
                    {playerNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          userEditedSetupRef.current = true;
                          const updated = playerNames.filter((_, i) => i !== idx);
                          setPlayerNames(updated);
                          setCustomCountInput(String(updated.length));
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 text-xs cursor-pointer"
                        title={ts.removePlayer}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  userEditedSetupRef.current = true;
                  const updated = [...playerNames, `${ui.player} ${playerNames.length + 1}`];
                  setPlayerNames(updated);
                  setCustomCountInput(String(updated.length));
                }}
                className="text-xs font-bold text-amber-300 hover:text-amber-100 cursor-pointer flex items-center gap-1"
              >
                <span>➕</span>
                <span>{ts.addOnePlayer}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  const parts = dailySchedule.getParticipants();
                  if (parts.length > 0) {
                    const names = parts.map((p) => p.name);
                    setPlayerNames(names);
                    setCustomCountInput(String(names.length));
                  }
                }}
                className="text-[11px] text-amber-300/80 hover:text-amber-200 underline cursor-pointer"
              >
                {ts.useScheduleNames}
              </button>
            </div>
          </div>
          );
        };

        // 5. ANTALL KORT & SKJERMFORMAT
        const renderCardsScreenSection = () => (
        <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
              {ts.cardsPerPlayerLabel}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    if (!isOwnerEditMode) userEditedSetupRef.current = true;
                    setNumCardsPerPlayer(cnt);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                    numCardsPerPlayer === cnt
                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                      : 'bg-black/40 text-amber-200/80 border border-amber-500/20'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">{ts.screenLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectScreenPreset('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  screenDevice === 'mobile'
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-black/40 text-amber-200/80 border border-amber-500/20'
                }`}
              >
                {ts.screenMobile}
              </button>
              <button
                type="button"
                onClick={() => selectScreenPreset('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  screenDevice === 'desktop'
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-black/40 text-amber-200/80 border border-amber-500/20'
                }`}
              >
                {ts.screenDesktop}
              </button>
              <button
                type="button"
                onClick={() => selectScreenPreset('big_screen')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  screenDevice === 'big_screen'
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-black/40 text-amber-200/80 border border-amber-500/20'
                }`}
              >
                {ts.screenBigScreen}
              </button>
            </div>
          </div>
        </div>
        );

        // AVSTANDSBINGO: DELTA FRA MOBILEN MED SPILLKODE
        const renderRemoteStripSection = () => {
          if (!onOpenRemoteBingo) return null;
          return (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-[#0a202d] to-black/80 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xl flex items-center justify-center shrink-0">
                📡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xs sm:text-sm text-cyan-200">{ts.remoteTitle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold">
                    {ts.remoteBadge}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-200/80 leading-tight mt-0.5">{ts.remoteDesc}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenRemoteBingo();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>📡</span>
                <span>{ts.remoteBtn}</span>
              </button>
              {onOpenQuiz && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenQuiz('adult', 'join');
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>🎯</span>
                  <span>{ts.joinQuizBtn}</span>
                </button>
              )}
            </div>
          </div>
          );
        };

        // STOR START-KNAPP (KUN NÅR PRØVETID ELLER BETALING ER AKTIV)
        const renderStartActionsSection = () => (
        <div className="pt-2 space-y-2">
          {!hasPaidSession ? null : !hasFullPaid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleStartGameClick}
                className="py-3.5 sm:py-4 px-4 font-heading font-black text-sm sm:text-base rounded-xl shadow-xl transform hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-white/50 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-950/70"
              >
                <span>▶</span>
                <span>
                  {ts.resume5MinTrial} ({playerNames.length} {playerNames.length === 1 ? ts.playerSingular : ts.playerPlural})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenGameSelector) {
                    onOpenGameSelector();
                  } else if (onOpenAudience) {
                    onOpenAudience();
                  }
                }}
                className="py-3.5 sm:py-4 px-4 font-heading font-black text-sm sm:text-base rounded-xl shadow-xl transform hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 shadow-emerald-950/70"
              >
                <span>🎭 / 🎈 / 📺</span>
                <span>{ts.all4FormatsBtn}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleStartGameClick}
                className="py-3.5 sm:py-4 px-4 font-heading font-black text-sm sm:text-base rounded-xl shadow-xl transform hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-white/50 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-950/70"
              >
                <span>▶</span>
                <span>
                  {ts.startPrefix} {currentCategory.label} ({playerNames.length}{' '}
                  {playerNames.length === 1 ? ts.playerSingular : ts.playerPlural})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenGameSelector) {
                    onOpenGameSelector();
                  } else if (onOpenAudience) {
                    onOpenAudience();
                  }
                }}
                className="py-3.5 sm:py-4 px-4 font-heading font-black text-sm sm:text-base rounded-xl shadow-xl transform hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 shadow-emerald-950/70"
              >
                <span>🎭 / 🎈 / 📺</span>
                <span>{ts.all4FormatsBtn}</span>
              </button>
            </div>
          )}

          {/* Hjelpetekst under knappen */}
          <div className="text-center text-2xs text-amber-300/80 font-medium">
            {!authUser.isAuthenticated ? (
              <span className="text-amber-200">
                🔒 <strong>{ts.helperLockedTitle}</strong> {ts.helperLockedDesc}
              </span>
            ) : !hasPaidSession ? (
              <span className="text-amber-200">
                💳 {ts.payLoggedInAs} <strong>{authUser.name}</strong>. {ts.helperUnpaidEnd}
              </span>
            ) : (
              <span className="text-emerald-300 font-semibold">
                {ts.helperActivePrefix} {authUser.name} · {ts.activePlaytimeLabel}{' '}
                {isOwnerUser ? ts.unlimitedOwner : `${sessionRemaining} ${ts.helperRemainingSuffix}`}
              </span>
            )}
          </div>
        </div>
        );

        const leftColumnNode = (
          <div
            key="start-col-left"
            className={screenDevice === 'mobile' ? 'space-y-3 w-full' : 'lg:col-span-5 space-y-3.5 w-full'}
          >
            {activeLayout.leftSectionOrder.map((sid, idx) =>
              renderSectionById(sid, idx, activeLayout.leftSectionOrder.length, false)
            )}
          </div>
        );

        const rightColumnNode = (
          <div
            key="start-col-right"
            className={`${
              screenDevice === 'mobile' ? 'w-full' : 'lg:col-span-7 w-full'
            } bg-amber-950/60 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3.5 sm:p-5 shadow-2xl space-y-3.5`}
          >
            {activeLayout.rightSectionOrder.map((sid, idx) =>
              renderSectionById(sid, idx, activeLayout.rightSectionOrder.length, true)
            )}
          </div>
        );

        return (
          <div
            className={`relative z-10 w-full ${containerWidthClass} mx-auto flex-1 ${
              screenDevice === 'mobile'
                ? 'flex flex-col gap-3'
                : 'grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-start'
            }`}
          >
            {activeLayout.swapColumns
              ? [rightColumnNode, leftColumnNode]
              : [leftColumnNode, rightColumnNode]}
          </div>
        );
      })()}

      {/* FOOTER */}
      <footer className={`relative z-10 w-full ${containerWidthClass} mx-auto text-center text-[11px] text-amber-300/65 font-medium py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1`}>
        <span>{ts.footerCopy}</span>
        <span>·</span>
        {onOpenPrivacy && (
          <>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenPrivacy();
              }}
              className="underline hover:text-amber-100 cursor-pointer font-bold text-emerald-300"
            >
              🛡️ {ts.privacyBtn}
            </button>
            <span>·</span>
          </>
        )}
        <span>{ts.footerShortcut}</span>
        <span>·</span>
        <span>{ts.footerOptimized}</span>
      </footer>
    </div>
  );
};
