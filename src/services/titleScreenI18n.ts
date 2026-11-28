/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BingoTheme } from '../types/bingo';
import { SupportedLanguage } from './i18n';

export interface CategoryTranslation {
  label: string;
  subcategory: string;
  description: string;
}

export interface TitleScreenTexts {
  unlimitedOwner: string;
  unlimitedOwnerTitle: string;
  expiredLabel: string;
  iosApp: string;
  participants: string;
  broadcast: string;
  remoteBingo: string;
  bigScreen: string;
  quizAndMemory: string;
  quizAndMemoryTitle: string;
  screenMobileShort: string;
  screenDesktopShort: string;
  screenBigScreenShort: string;
  toolsBtn: string;
  toolsBtnTitle: string;
  quizLabel: string;
  quizTitle: string;
  familyQuizLabel: string;
  familyQuizTitle: string;
  christmasQuizLabel: string;
  christmasQuizTitle: string;
  seniorQuizLabel: string;
  seniorQuizTitle: string;
  memoryLabel: string;
  memoryTitle: string;
  mixer: string;
  quests: string;
  schedule: string;
  report: string;
  ownerPanel: string;
  editStartPanel: string;
  doneEditing: string;
  printCards: string;
  soundOn: string;
  soundOff: string;

  timeWarningTitlePrefix: string;
  timeWarningTitleSuffix: string;
  timeWarningDesc: string;
  extendPlaytime: string;

  heroBadge: string;
  heroSubtitle: string;

  drumTitle: string;
  drumBadge: string;
  drumDescPaid: string;
  drumDescTrial: string;
  drumDescGuest: string;
  try5MinFree: string;
  choose4Games: string;
  drumHint: string;
  drumMeta: string;

  lockBannerTitle: string;
  lockBadge: string;
  lockBannerDesc: string;
  loginAndPayBtn: string;

  payBannerTitle: string;
  payMethodBadge: string;
  payLoggedInAs: string;
  payRoleHost: string;
  payRolePlayer: string;
  payBannerTextAfterRole: string;
  chooseAndPayBtn: string;

  trialBannerTitle: string;
  trialBannerDesc: string;
  resumeTrialBtn: string;
  buyFullTimeBtn: string;

  ownerModeActiveTitle: string;
  paidPackageActiveTitle: string;
  ownerInfiniteBadge: string;
  freeFlowBadge: string;
  activePlaytimeLabel: string;
  paidPackageDescSuffix: string;
  openOwnerPanel: string;
  all4Games: string;

  ownerEditBannerTitle: string;
  ownerEditBannerDesc: string;
  saveStartPanelBtn: string;
  savingBtn: string;
  openFullOwnerModalBtn: string;
  editAppTitleLabel: string;
  editAppSubtitleLabel: string;
  editModulesLabel: string;
  showLiveDrumToggle: string;
  setAsFavorite1: string;
  isFavorite1: string;
  moveUp: string;
  moveDown: string;
  savedDefaultsSuccess: string;

  sec1Title: string;
  sec1Sub: string;
  favorite1Tag: string;
  activeCategoryBadge: string;
  musicSongActive: string;
  categories: Record<BingoTheme, CategoryTranslation>;

  sec2Title: string;
  modeAllTitle: string;
  modeAllDesc: string;
  modeBoardTitle: string;
  modeBoardDesc: string;
  modeCallerTitle: string;
  modeCallerDesc: string;
  modePassTitle: string;
  modePassDesc: string;

  sec3Title: string;
  fmtBothShort: string;
  fmtNumbersShort: string;
  fmtPromptsShort: string;
  fmtBothLabel: string;
  fmtNumbersLabel: string;
  fmtPromptsLabel: string;

  sec4Title: string;
  playerSingular: string;
  playerPlural: string;
  setCountLabel: string;
  soloLabel: string;
  pcsSuffix: string;
  playerPlaceholder: string;
  removePlayer: string;
  addOnePlayer: string;
  useScheduleNames: string;

  cardsPerPlayerLabel: string;
  screenLabel: string;
  screenMobile: string;
  screenDesktop: string;
  screenBigScreen: string;

  remoteTitle: string;
  remoteBadge: string;
  remoteDesc: string;
  remoteBtn: string;
  joinQuizBtn: string;

  activeRoomCodeTitle: string;
  openEverywhereBadge: string;
  openForMobileTvBadge: string;
  activatingBadge: string;
  roomCodeOpenInfo: string;
  copyCodeBtn: string;
  copiedBtn: string;
  copyInviteLinkBtn: string;
  copiedLinkBtn: string;
  reactivateCodeBtn: string;

  resume5MinTrial: string;
  startPrefix: string;
  all4FormatsBtn: string;
  helperLockedTitle: string;
  helperLockedDesc: string;
  helperUnpaidEnd: string;
  helperActivePrefix: string;
  helperRemainingSuffix: string;

  kahootJoinTitle: string;
  kahootJoinBadge: string;
  kahootJoinDesc: string;
  kahootCodePlaceholder: string;
  kahootJoinQuizBtn: string;
  kahootJoinBingoBtn: string;
  kahootSafetyBadges: string;
  privacyBtn: string;

  footerCopy: string;
  footerShortcut: string;
  footerOptimized: string;
}

const NB_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Ubegrenset (Eier)',
  unlimitedOwnerTitle: 'Eier har ubegrenset spilletid — klikk for å åpne Eierpanel',
  expiredLabel: 'Utløpt',
  iosApp: 'iOS App',
  participants: 'Deltakere',
  broadcast: 'Kringkasting',
  remoteBingo: 'Avstandsbingo',
  bigScreen: 'Storskjerm',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Velg Quiz eller Memory (VoksenQuiz, FamilieQuiz, JuleQuiz, Senior Quiz, Memory)',
  screenMobileShort: 'Mobil',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Prosjektor',
  toolsBtn: 'Verktøy',
  toolsBtnTitle: 'Verktøy, deltakere, dagsplan og innstillinger',
  quizLabel: 'QUIZ',
  quizTitle: 'Valg 3: Kultur-, Musikk- & Fanquiz (QUIZ)',
  familyQuizLabel: 'Familiequiz',
  familyQuizTitle: 'Valg 4: Familie- & Barnequiz (Kultur, Musikk & Ordlek)',
  christmasQuizLabel: 'JuleQuiz',
  christmasQuizTitle: 'Valg 5: JuleQuiz (300 spørsmål i tilfeldig rekkefølge + 80 Mimelek)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Valg 7: Senior Grenland Quiz — Blandet Musikk-gjetting (lydklipp), Grenland & Skien, Ungdomsminner & Skriv-svar (4–5 per skjerm)',
  memoryLabel: 'Memory',
  memoryTitle: 'Valg 6: Memory — Minnespill for barn med 30 bildekort (15 par), lagspill & +/- poeng',
  mixer: 'Mikser',
  quests: 'Oppdrag',
  schedule: 'Dagsplan',
  report: 'Rapporter',
  ownerPanel: 'Eierpanel',
  editStartPanel: 'Rediger startpanel',
  doneEditing: 'Ferdig med redigering',
  printCards: 'Skriv ut kort',
  soundOn: 'Slå på lyd',
  soundOff: 'Slå av lyd',

  timeWarningTitlePrefix: 'Tidsvarsel: Kun',
  timeWarningTitleSuffix: 'igjen av spilletiden!',
  timeWarningDesc: 'Spillet og verten logges automatisk ut ved 00:00:00. Forleng med Visa, Mastercard eller Apple Pay for å unngå avbrudd.',
  extendPlaytime: 'Forleng spilletid ➔',

  heroBadge: 'Sosialt & Familievennlig',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quiz, familiehygge, memory & sosialt fellesskap for alle aldre',

  drumTitle: 'Live Trekningstrommel & Sosialt Spill',
  drumBadge: 'Aktiv Trommel',
  drumDescPaid: 'Din arrangementspakke er aktiv — snurr kulene eller veksle fritt mellom Storskjerm, Avstandsbingo, QUIZ, Familiequiz, JuleQuiz og Memory!',
  drumDescTrial: '10 minutters gratis prøvespill er åpent for alle spillene — test alle spill og koblingskode nå!',
  drumDescGuest: 'Forhåndsvisning av 60fps trekningstrommel — prøv alle spill 10 min gratis eller logg inn som arrangør!',
  try5MinFree: 'Prøv 10 min gratis (alle spill)',
  choose4Games: 'Velg mellom alle spill',
  drumHint: 'Test trommelen, dra i sveiven eller rist kulene for å oppleve fysikken og lyden.',
  drumMeta: '75 kuler (B-I-N-G-O) · 60 fps animasjon',

  lockBannerTitle: 'For Arrangør: Innlogging & Arrangementspass',
  lockBadge: 'Arrangør',
  lockBannerDesc: 'Arrangør/vert logger inn og betaler for å starte arrangementet og lage kode/deltakerlenke. Barn, familie og deltakere blir med GRATIS med kode uten konto!',
  loginAndPayBtn: 'Arrangør: Logg inn & Betal ➔',

  payBannerTitle: 'Arrangør: Velg spilletid for å starte',
  payMethodBadge: 'Kort, Apple Pay & GPay',
  payLoggedInAs: 'Innlogget arrangør:',
  payRoleHost: 'Arrangør / Vert',
  payRolePlayer: 'Arrangør',
  payBannerTextAfterRole: 'Betal trygt med Visa, Mastercard, Apple Pay eller Google Pay. Koblingskode og lenke genereres til deltakerne etter betaling.',
  chooseAndPayBtn: 'Velg & Betal Spilletid ➔',

  trialBannerTitle: '10 Minutter Gratis Prøvespill på Alle Spill!',
  trialBannerDesc: 'Prøv alle spillene fritt i 10 minutter — Storskjerm, Avstandsbingo, Musikkbingo, QUIZ, Familiequiz, JuleQuiz, Senior Grenland Quiz og Memory!',
  resumeTrialBtn: '▶ Fortsett Prøvespill',
  buyFullTimeBtn: '💳 Kjøp full spilletid ➔',

  ownerModeActiveTitle: 'Eiermodus Aktiv — Ubegrenset Tilgang!',
  paidPackageActiveTitle: 'Arrangementspakke Aktiv & Betalt!',
  ownerInfiniteBadge: '∞ Eier',
  freeFlowBadge: 'Fri flyt',
  activePlaytimeLabel: 'Spilletid aktiv:',
  paidPackageDescSuffix: 'Du kan fritt veksle mellom Storskjerm Bingo, Avstandsbingo, QUIZ, Familiequiz, JuleQuiz og Memory uten ny betaling!',
  openOwnerPanel: 'Åpne Eierpanel',
  all4Games: 'Alle 6 spill',

  ownerEditBannerTitle: 'Eierens Redigeringsmodus i Startpanelet',
  ownerEditBannerDesc: 'Endre tittel, synlige knapper, favorittkategori og standardoppsett nedenfor, og lagre til server og sky.',
  saveStartPanelBtn: 'Lagre oppsett (Server & Sky)',
  savingBtn: 'Lagrer...',
  openFullOwnerModalBtn: 'Fullt Eierpanel (Priser & PIN)',
  editAppTitleLabel: 'App-tittel:',
  editAppSubtitleLabel: 'Undertittel:',
  editModulesLabel: 'Synlige moduler & knapper:',
  showLiveDrumToggle: 'Live Bingotrommel på startside',
  setAsFavorite1: 'Sett som Favoritt #1',
  isFavorite1: 'Favoritt #1 ✓',
  moveUp: 'Opp',
  moveDown: 'Ned',
  savedDefaultsSuccess: 'Startpanelets oppsett er lagret permanent!',

  sec1Title: '1. Kategori & Innhold (Velg i rullegardin):',
  sec1Sub: 'Inkluderer Injoy Together & Underkategorier',
  favorite1Tag: '⭐ [Favoritt #1]',
  activeCategoryBadge: 'Aktiv Kategori',
  musicSongActive: '🎵 Sang & Musikk aktiv',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Klassisk Sosialt Spill)',
      subcategory: '75-tall brettspill & oppløftende hverdagsgnister',
      description: 'Det originale formatet som kombinerer trekning (1–75) med gode, hjertevarme samtale- og hverdagsgnister.',
    },
    ril: {
      label: 'RIL – Idrett, Sang & Musikk',
      subcategory: 'Allsang, musikkquiz, sangstrofer, lagånd & «I ❤️ IT»',
      description: 'Idretts- og foreningsbingo med morsomme sang- og musikkspørsmål, felles heiarop og lagbygging.',
    },
    heartfelt: {
      label: 'Hjertevarme & Nærhet',
      subcategory: 'Dype historier, varme og empati i fellesskapet',
      description: 'Finn medspillere som har rørt hjerter, delt gode minner og skapt ekte samhørighet.',
    },
    laughter: {
      label: 'Latter, Humor & Smil',
      subcategory: 'Morsomme påfunn, lekne øyeblikk & smil som smitter',
      description: 'Underholdende historier, rare vaner og fjas som garantert skaper latter i rommet.',
    },
    kindness: {
      label: 'Godhet & Omsorg',
      subcategory: 'Hverdagshjelp, nabolagsomsorg og raushet',
      description: 'Fokus på de små, gode gjerningene som gjør hverdagen litt lysere for alle rundt oss.',
    },
    gratitude: {
      label: 'Visdom & Takknemlighet',
      subcategory: 'Livserfaring, ro og ettertanke i hverdagen',
      description: 'Gode refleksjoner, takknemlighet og inspirerende livserfaringer.',
    },
    family_kids: {
      label: 'Familie & Barn (Spill med vert)',
      subcategory: 'Lekne oppgaver, dyrelyder, sang og high-fives med bingoverten',
      description: 'Familiebingo hvor barn og voksne spiller og ler sammen med bingoverten på en trygg og morsom måte.',
    },
  },

  sec2Title: '2. Spillmodus:',
  modeAllTitle: 'Alt-i-ett',
  modeAllDesc: 'Trommel + Brett sammen',
  modeBoardTitle: 'Kun Brett',
  modeBoardDesc: 'For spillere',
  modeCallerTitle: 'Vert / Trommel',
  modeCallerDesc: 'For opproper',
  modePassTitle: 'Spillkveld',
  modePassDesc: '2–8 rundt skjermen',

  sec3Title: '3. Kortformat på brettet:',
  fmtBothShort: 'Tall + Ord',
  fmtNumbersShort: 'Kun tall',
  fmtPromptsShort: 'Kun ord',
  fmtBothLabel: 'Tall + Ord (Kombinasjon)',
  fmtNumbersLabel: 'Kun Tall (1–75)',
  fmtPromptsLabel: 'Kun Ord & Gnister',

  sec4Title: '4. Antall spillere & Navn:',
  playerSingular: 'spiller',
  playerPlural: 'spillere',
  setCountLabel: 'Sett antall:',
  soloLabel: '1 Solo',
  pcsSuffix: 'stk',
  playerPlaceholder: 'Skriv inn navn for Spiller',
  removePlayer: 'Fjern spiller',
  addOnePlayer: 'Legg til én spiller',
  useScheduleNames: 'Bruk navn fra dagsplan',

  cardsPerPlayerLabel: 'Kort per spiller:',
  screenLabel: 'Skjerm:',
  screenMobile: '📱 Mobil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Storskjerm',

  remoteTitle: 'Spill sammen på avstand (Spillkode)',
  remoteBadge: 'Avstandsbingo',
  remoteDesc: 'Har arrangøren delt en koblingskode? Bli med gratis i Avstandsbingo eller Lagquiz med mobilen din!',
  remoteBtn: 'Avstandsbingo',
  joinQuizBtn: 'Bli med i Quiz',

  activeRoomCodeTitle: 'Din aktive deltakerkode for arrangementet:',
  openEverywhereBadge: '✓ Åpen overalt',
  openForMobileTvBadge: '✓ Åpen for mobil & TV',
  activatingBadge: '⏳ Aktiverer...',
  roomCodeOpenInfo: 'Deltakerkoden er åpen for alle mobiler og TV-er i arrangementet (kun din private innlogging og fasiter er skjult).',
  copyCodeBtn: '📋 Kopier kode',
  copiedBtn: '✓ Kopiert',
  copyInviteLinkBtn: '🔗 Deltakerlenke',
  copiedLinkBtn: '✓ Lenke kopiert',
  reactivateCodeBtn: 'Aktiver på nytt',

  resume5MinTrial: 'Fortsett 10-min prøvespill',
  startPrefix: 'Start',
  all4FormatsBtn: 'Alle Spillformater (Bingo, Quiz & Memory)',
  helperLockedTitle: 'Obligatorisk innlogging & betaling:',
  helperLockedDesc: 'Logg inn og betal spilletid i feltet over (eller prøv alle spill 10 min gratis). Automatisk utlogging skjer når tiden utløper.',
  helperUnpaidEnd: 'Fullfør betaling i feltet «Obligatorisk betaling for å starte» for å åpne alle 6 spillformater.',
  helperActivePrefix: '✓ Innlogget som',
  helperRemainingSuffix: 'gjenstår (automatisk utlogging ved 00:00:00)',

  kahootJoinTitle: 'Har du fått kode eller lenke fra arrangør? (Kahoot-modus)',
  kahootJoinBadge: 'Gratis for alle aldre',
  kahootJoinDesc: 'Barn, familie og gjester blir med uten konto, uten e-post og uten betaling. Tast inn koden fra arrangøren:',
  kahootCodePlaceholder: 'Skriv kode (f.eks. 4821)',
  kahootJoinQuizBtn: 'Bli med i Quiz',
  kahootJoinBingoBtn: 'Sosial Bingo',
  kahootSafetyBadges: 'Åpen for alle aldre · Ingen persondata for barn · Ingen pengespill eller pengegevinster',
  privacyBtn: 'Personvern & Barnetrygghet',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (uten pengespill)',
  footerShortcut: 'Space / Enter for å starte',
  footerOptimized: 'Én nettadresse for alle enheter',
};

const EN_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Unlimited (Owner)',
  unlimitedOwnerTitle: 'Owner has unlimited playtime — click to open Owner Panel',
  expiredLabel: 'Expired',
  iosApp: 'iOS App',
  participants: 'Participants',
  broadcast: 'Broadcast',
  remoteBingo: 'Remote Bingo',
  bigScreen: 'Big Screen',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Choose Quiz or Memory (Adult Quiz, Family Quiz, Christmas Quiz, Senior Quiz, Memory)',
  screenMobileShort: 'Mobile',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Projector',
  toolsBtn: 'Tools',
  toolsBtnTitle: 'Tools, participants, daily schedule & settings',
  quizLabel: 'QUIZ',
  quizTitle: 'Option 3: Culture, Music & Fan QUIZ',
  familyQuizLabel: 'Family Quiz',
  familyQuizTitle: 'Option 4: Family & Kids Quiz (Culture, Music & Wordplay)',
  christmasQuizLabel: 'Christmas Quiz',
  christmasQuizTitle: 'Option 5: Christmas Quiz (300 Questions in Random Order + 80 Mime Words)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Option 7: Senior Grenland Quiz — Mixed Music Guessing (audio clips), Grenland & Skien History, Youth Memories & Write-In Answers (4–5 per screen)',
  memoryLabel: 'Memory',
  memoryTitle: 'Option 6: Memory — Kids & Team Picture Matching (30 Cards / 15 Pairs, +/- Points & Prize)',
  mixer: 'Mixer',
  quests: 'Quests',
  schedule: 'Schedule',
  report: 'Report',
  ownerPanel: 'Owner Panel',
  editStartPanel: 'Edit Start Panel',
  doneEditing: 'Done Editing',
  printCards: 'Print Cards',
  soundOn: 'Turn Sound On',
  soundOff: 'Turn Sound Off',

  timeWarningTitlePrefix: 'Time Warning: Only',
  timeWarningTitleSuffix: 'left of playtime!',
  timeWarningDesc: 'The game and host are automatically logged out at 00:00:00. Extend with Visa, Mastercard or Apple Pay to avoid interruption.',
  extendPlaytime: 'Extend Playtime ➔',

  heroBadge: 'Family & Social',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quizzes, family fun, memory & social play for all ages',

  drumTitle: 'Live Number Tumbler & Social Game',
  drumBadge: 'Active Drum',
  drumDescPaid: 'Your event package is active — spin the balls or switch freely between Big Screen, Remote Bingo, QUIZ, Family Quiz, Christmas Quiz and Memory!',
  drumDescTrial: '10-minute free trial is open for all games — try every game & room code now!',
  drumDescGuest: 'Preview of 60fps ball tumbler — try all games 10 min free or sign in as organizer!',
  try5MinFree: 'Try 10 min free (all games)',
  choose4Games: 'Choose among all games',
  drumHint: 'Test the drum, turn the crank or scramble the balls to experience the physics and sound.',
  drumMeta: '75 balls (B-I-N-G-O) · 60 fps animation',

  lockBannerTitle: 'For Organizers: Sign In & Event Pass',
  lockBadge: 'Organizer',
  lockBannerDesc: 'Organizers/hosts sign in and pay to start the event and generate a code/invite link. Children, families & guests join FREE with code without an account!',
  loginAndPayBtn: 'Organizer: Sign In & Pay ➔',

  payBannerTitle: 'Organizer: Select Playtime to Start',
  payMethodBadge: 'Card, Apple Pay & GPay',
  payLoggedInAs: 'Signed in organizer:',
  payRoleHost: 'Organizer / Host',
  payRolePlayer: 'Organizer',
  payBannerTextAfterRole: 'Pay securely with Visa, Mastercard, Apple Pay or Google Pay. Room join code & link are generated after payment.',
  chooseAndPayBtn: 'Select & Pay Playtime ➔',

  trialBannerTitle: '10-Minute Free Trial Open for All Games!',
  trialBannerDesc: 'Try all games free for 10 minutes — Big Screen, Remote Bingo, Music Bingo, QUIZ, Family Quiz, Christmas Quiz, Senior Grenland Quiz & Memory!',
  resumeTrialBtn: '▶ Resume Trial',
  buyFullTimeBtn: '💳 Buy Full Playtime ➔',

  ownerModeActiveTitle: 'Owner Mode Active — Unlimited Access!',
  paidPackageActiveTitle: 'Event Pass Active & Paid!',
  ownerInfiniteBadge: '∞ Owner',
  freeFlowBadge: 'Free Switch',
  activePlaytimeLabel: 'Active playtime:',
  paidPackageDescSuffix: 'You can switch freely between Big Screen Bingo, Remote Bingo, QUIZ, Family Quiz and Christmas Quiz without paying again!',
  openOwnerPanel: 'Open Owner Panel',
  all4Games: 'All 6 Games',

  ownerEditBannerTitle: 'Owner Start Panel Edit Mode',
  ownerEditBannerDesc: 'Edit app title, visible buttons, favorite category order and default player setup below, then save to server & cloud.',
  saveStartPanelBtn: 'Save Setup (Server & Cloud)',
  savingBtn: 'Saving...',
  openFullOwnerModalBtn: 'Full Owner Panel (Prices & PIN)',
  editAppTitleLabel: 'App Title:',
  editAppSubtitleLabel: 'Subtitle:',
  editModulesLabel: 'Visible Modules & Buttons:',
  showLiveDrumToggle: 'Live Bingo Drum on Start Page',
  setAsFavorite1: 'Set as Favorite #1',
  isFavorite1: 'Favorite #1 ✓',
  moveUp: 'Up',
  moveDown: 'Down',
  savedDefaultsSuccess: 'Start panel setup saved permanently!',

  sec1Title: '1. Category & Content (Choose in dropdown):',
  sec1Sub: 'Includes Injoy Together & Subcategories',
  favorite1Tag: '⭐ [Favorite #1]',
  activeCategoryBadge: 'Active Category',
  musicSongActive: '🎵 Song & Music Active',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Classic Social Game)',
      subcategory: '75-ball game & heartwarming daily sparks',
      description: 'The original format combining number calls (1–75) with uplifting conversation and daily joy sparks.',
    },
    ril: {
      label: 'RIL – Sports, Song & Music',
      subcategory: 'Sing-alongs, music quiz, lyrics, team spirit & club pride',
      description: 'Sports & club bingo with fun music questions, group cheers and team building.',
    },
    heartfelt: {
      label: 'Warmth & Closeness',
      subcategory: 'Deep stories, kindness and community empathy',
      description: 'Connect with fellow players who have shared warm memories and genuine togetherness.',
    },
    laughter: {
      label: 'Laughter, Humor & Smiles',
      subcategory: 'Funny stories, playful moments & contagious smiles',
      description: 'Entertaining tales, quirky habits and lighthearted fun guaranteed to fill the room with laughter.',
    },
    kindness: {
      label: 'Kindness & Care',
      subcategory: 'Everyday help, neighborly care and generosity',
      description: 'Spotlight on the small acts of kindness that brighten everyday life for everyone around us.',
    },
    gratitude: {
      label: 'Wisdom & Gratitude',
      subcategory: 'Life experience, calm and thoughtful reflection',
      description: 'Meaningful reflections, gratitude and inspiring life stories.',
    },
    family_kids: {
      label: 'Family & Kids (Play with Host)',
      subcategory: 'Playful tasks, animal sounds, songs and high-fives with the host',
      description: 'Family bingo where kids and adults play and laugh together with the host safely.',
    },
  },

  sec2Title: '2. Game Mode:',
  modeAllTitle: 'All-in-One',
  modeAllDesc: 'Drum + Boards together',
  modeBoardTitle: 'Boards Only',
  modeBoardDesc: 'For players',
  modeCallerTitle: 'Host / Drum',
  modeCallerDesc: 'For caller',
  modePassTitle: 'Party Night',
  modePassDesc: '2–8 around screen',

  sec3Title: '3. Board Card Format:',
  fmtBothShort: 'Numbers + Words',
  fmtNumbersShort: 'Numbers only',
  fmtPromptsShort: 'Words only',
  fmtBothLabel: 'Numbers + Words (Combined)',
  fmtNumbersLabel: 'Numbers Only (1–75)',
  fmtPromptsLabel: 'Words & Prompts Only',

  sec4Title: '4. Number of Players & Names:',
  playerSingular: 'player',
  playerPlural: 'players',
  setCountLabel: 'Set count:',
  soloLabel: '1 Solo',
  pcsSuffix: 'players',
  playerPlaceholder: 'Enter name for Player',
  removePlayer: 'Remove player',
  addOnePlayer: 'Add one player',
  useScheduleNames: 'Use names from schedule',

  cardsPerPlayerLabel: 'Cards per player:',
  screenLabel: 'Screen:',
  screenMobile: '📱 Mobile',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Big Screen',

  remoteTitle: 'Play Together Remotely (Room Code)',
  remoteBadge: 'Remote Bingo',
  remoteDesc: 'Did the host share a room code? Join Remote Bingo or Team QUIZ for free on your phone!',
  remoteBtn: 'Remote Bingo',
  joinQuizBtn: 'Join QUIZ',

  activeRoomCodeTitle: 'Your Active Room Join Code for the Event:',
  openEverywhereBadge: '✓ Open Everywhere',
  openForMobileTvBadge: '✓ Open for Mobile & TV',
  activatingBadge: '⏳ Activating...',
  roomCodeOpenInfo: 'The join code is open for all phones and TVs in your event (only private organizer login and answers remain hidden).',
  copyCodeBtn: '📋 Copy Code',
  copiedBtn: '✓ Copied',
  copyInviteLinkBtn: '🔗 Invite Link',
  copiedLinkBtn: '✓ Link Copied',
  reactivateCodeBtn: 'Reactivate',

  resume5MinTrial: 'Continue 10-min trial',
  startPrefix: 'Start',
  all4FormatsBtn: 'All Game Formats (Bingo, QUIZ & Memory)',
  helperLockedTitle: 'Mandatory Sign In & Payment:',
  helperLockedDesc: 'Sign in and pay playtime in the box above (or try all games 10 min free). Auto-logout occurs when your time expires.',
  helperUnpaidEnd: 'Complete payment in «Mandatory Payment to Start» to unlock all 6 game formats.',
  helperActivePrefix: '✓ Signed in as',
  helperRemainingSuffix: 'remaining (auto-logout at 00:00:00)',

  kahootJoinTitle: 'Got a code or link from the organizer? (Kahoot Mode)',
  kahootJoinBadge: 'Free for all ages',
  kahootJoinDesc: 'Children, families and guests join with zero account, zero email, and zero payment. Enter the organizer code:',
  kahootCodePlaceholder: 'Enter code (e.g. 4821)',
  kahootJoinQuizBtn: 'Join Quiz',
  kahootJoinBingoBtn: 'Social Bingo',
  kahootSafetyBadges: 'Open for all ages · No personal data for kids · No gambling or cash prizes',
  privacyBtn: 'Privacy & Child Safety',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (no gambling)',
  footerShortcut: 'Space / Enter to start',
  footerOptimized: 'Single URL for all devices',
};

const TI_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'ደረት ዘይብሉ (ዋና)',
  unlimitedOwnerTitle: 'ዋና ደረት ዘይብሉ ግዜ ጸወታ ኣለዎ — ናይ ዋና ፓነል ንምኽፋት ጠውቕ',
  expiredLabel: 'ግዜኡ ወዲኡ',
  iosApp: 'iOS ኣፕ',
  participants: 'ተሳተፍቲ',
  broadcast: 'መልእኽቲ',
  remoteBingo: 'ናይ ርሑቕ ቢንጎ',
  bigScreen: 'ዓቢ ስክሪን',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Quiz ወይ Memory ምረጽ',
  screenMobileShort: 'ሞባይል',
  screenDesktopShort: 'ኮምፒዩተር',
  screenBigScreenShort: 'ቲቪ / ፕሮጀክተር',
  toolsBtn: 'መሳርሒታት',
  toolsBtnTitle: 'መሳርሒታት፣ ተሳተፍቲ፣ መደብ መዓልቲ',
  quizLabel: 'QUIZ',
  quizTitle: 'ምርጫ 3፡ ባህሊ፣ ሙዚቃን QUIZን',
  familyQuizLabel: 'ናይ ስድራ QUIZ',
  familyQuizTitle: 'ምርጫ 4፡ ናይ ስድራቤትን ቆልዑን QUIZ',
  christmasQuizLabel: 'ናይ ልደት QUIZ',
  christmasQuizTitle: 'ምርጫ 5፡ ናይ ልደት QUIZ (ደርፊ ልደት፣ ባህልን ሕንቅልሕንቅሊተይን)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'ምርጫ 7፡ Senior Grenland Quiz (ዝተሓወሰ ናይ ሙዚቃ ግምትን ታሪኽ ከባቢ Grenland/Skienን QUIZ)',
  memoryLabel: 'Memory',
  memoryTitle: 'ምርጫ 6፡ Memory — ናይ ቆልዑን ጋንታን ጸወታ ስእሊ (30 ካርድታት / 15 ጽምዲ)',
  mixer: 'ሚክሰር',
  quests: 'ዕማማት',
  schedule: 'መደብ መዓልቲ',
  report: 'ጸብጻብ',
  ownerPanel: 'ናይ ዋና ፓነል',
  editStartPanel: 'መበገሲ ገጽ ኣዐሪ',
  doneEditing: 'ምዕራይ ወዲአ',
  printCards: 'ካርዶች ኣሕትም',
  soundOn: 'ድምጺ ኣብርህ',
  soundOff: 'ድምጺ ኣጥፍእ',

  timeWarningTitlePrefix: 'መጠንቀቕታ ግዜ፡ ጥራይ',
  timeWarningTitleSuffix: 'ካብ ግዜ ጸወታ ተሪፉ!',
  timeWarningDesc: 'ኣብ 00:00:00 ጸወታን ኣዳላውን ብባዕሉ ይወጽእ። ብ Visa, Mastercard ወይ Apple Pay ግዜ ወስኽ።',
  extendPlaytime: 'ግዜ ጸወታ ኣናውሕ ➔',

  heroBadge: 'ማሕበራዊ ሓጐስ',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — ርክብ፣ ሓባራዊ ደርፊ፣ ናይ ጉጅለ መንፈስን ፍቕርን ንማሕበራትን ፈተውትን',

  drumTitle: 'ቀጥታዊ ናይ ቢንጎ ከበሮን ምንቅስቓስ ኵዕሶታትን',
  drumBadge: 'ንጡፍ ከበሮ',
  drumDescPaid: 'ናይ ምድላው ፓኬጅካ ንጡፍ እዩ — ኵዕሶታት ኣዝውር ወይ ብናጻ ናብ ዓቢ ስክሪን፣ ናይ ርሑቕ ቢንጎን QUIZታትን ተሰጋገር!',
  drumDescTrial: 'ናይ 10 ደቒቕ ነጻ ፈተነ ንኹሎም ጸወታታት ክፉት እዩ — ሕጂ ኩሎም ጸወታታትን ኮድን ፈትን!',
  drumDescGuest: 'ናይ 60fps ኵዕሶ ከበሮ ቅድመ-ምርኢት — ንኹሎም ጸወታታት 10 ደቒቕ ብነጻ ፈትን ወይ እቶን ክፈልን!',
  try5MinFree: '10 ደቒቕ ብነጻ ፈትን (ኩሎም ጸወታታት)',
  choose4Games: 'ካብ ኩሎም ጸወታታት ምረጽ',
  drumHint: 'ነቲ ከበሮ ፈትኖ፣ መዘውር ስሓብ ወይ ኵዕሶታት ነቅንቕ።',
  drumMeta: '75 ኵዕሶታት (B-I-N-G-O) · 60 fps ምንቅስቓስ',

  lockBannerTitle: 'ግዴታዊ መእተውን ክፍሊትን',
  lockBadge: 'ዕጹው',
  lockBannerDesc: 'ኩሎም ተጻወትትን ኣዳለውትን ምሉእ ኣገልግሎትን መተኣሳሰሪ ኮድን ንምርካብ ክኣትዉን ክኸፍሉን ኣለዎም። ብኮድ ዝኣትዉ ብነጻ ይጻወቱ።',
  loginAndPayBtn: 'እቶን ክፈልን ➔',

  payBannerTitle: 'ንምጅማር ግዴታዊ ክፍሊት',
  payMethodBadge: 'ካርድ፣ Apple Pay & GPay',
  payLoggedInAs: 'ዝኣተኻሉ ስም፡',
  payRoleHost: 'ኣዳላዊ ቢንጎ',
  payRolePlayer: 'ተጻዋታይ',
  payBannerTextAfterRole: 'ብ Visa, Mastercard, Apple Pay ወይ Google Pay ብውሑስ መንገዲ ክፈል። ድሕሪ ክፍሊት መተኣሳሰሪ ኮድ ይፍጠር።',
  chooseAndPayBtn: 'ግዜ ጸወታ ምረጽን ክፈልን ➔',

  trialBannerTitle: 'ናይ 10 ደቒቕ ነጻ ፈተነ ንኹሎም ጸወታታት ክፉት እዩ!',
  trialBannerDesc: 'ን 10 ደቒቕ ኩሎም ጸወታታት ብነጻ ፈትን — ዓቢ ስክሪን፣ ናይ ርሑቕ ቢንጎ፣ QUIZ፣ ናይ ስድራቤት፣ ናይ ልደት፣ Senior Quizን Memoryን!',
  resumeTrialBtn: '▶ ፈተነ ቀጽል',
  buyFullTimeBtn: '💳 ምሉእ ግዜ ጸወታ ግዛእ ➔',

  ownerModeActiveTitle: 'ናይ ዋና ኩነት ንጡፍ — ደረት ዘይብሉ ኣገልግሎት!',
  paidPackageActiveTitle: 'ናይ ምድላው ፓኬጅ ንጡፍን ተኸፊሉን!',
  ownerInfiniteBadge: '∞ ዋና',
  freeFlowBadge: 'ናጻ ምስግጋር',
  activePlaytimeLabel: 'ንጡፍ ግዜ ጸወታ:',
  paidPackageDescSuffix: 'ብዘይ ተወሳኺ ክፍሊት ኣብ መንጎ ዓቢ ስክሪን ቢንጎ፣ ናይ ርሑቕ ቢንጎ፣ QUIZ፣ ናይ ስድራ QUIZን ናይ ልደት QUIZን ብናጻ ክትመላለስ ትኽእል!',
  openOwnerPanel: 'ናይ ዋና ፓነል ክፈት',
  all4Games: 'ኩሎም 6 ጸወታታት',

  ownerEditBannerTitle: 'ናይ ዋና መዓረዪ መበገሲ ገጽ (Startpanelet)',
  ownerEditBannerDesc: 'ኣርእስቲ፣ ዝረኣዩ መጠውቒታት፣ ቀዳማይ ዓውድን ቀዋሚ ቅጥዕን ኣብ ታሕቲ ቀይር እሞ ኣብ ሰርቨርን ደመናን ኣቐምጥ።',
  saveStartPanelBtn: 'ቅጥዒ ኣቐምጥ (ሰርቨርን ደመናን)',
  savingBtn: 'ይቕመጥ ኣሎ...',
  openFullOwnerModalBtn: 'ምሉእ ናይ ዋና ፓነል (ዋጋታትን PINን)',
  editAppTitleLabel: 'ስም ኣፕ:',
  editAppSubtitleLabel: 'ንኡስ ኣርእስቲ:',
  editModulesLabel: 'ዝረኣዩ ክፍልታትን መጠውቒታትን:',
  showLiveDrumToggle: 'ቀጥታዊ ናይ ቢንጎ ከበሮ ኣብ መበገሲ ገጽ',
  setAsFavorite1: 'ቀዳማይ ተፈታዊ (#1) ግበር',
  isFavorite1: 'ተፈታዊ #1 ✓',
  moveUp: 'ንላዕሊ',
  moveDown: 'ንታሕቲ',
  savedDefaultsSuccess: 'ቅጥዒ መበገሲ ገጽ ብቐዋሚነት ተቐሚጡ ኣሎ!',

  sec1Title: '1. ዓውድን ትሕዝቶን (ካብ ዝርዝር ምረጽ):',
  sec1Sub: 'Joy Bingoን ንኡሳን ዓውድታትን የጠቓልል',
  favorite1Tag: '⭐ [ተፈታዊ #1]',
  activeCategoryBadge: 'ንጡፍ ዓውዲ',
  musicSongActive: '🎵 ደርፍን ሙዚቃን ንጡፍ',
  categories: {
    classic_joy: {
      label: 'Joy Bingo (ልሙድ ሓጐስ)',
      subcategory: '75-ኵዕሶ ቢንጎን መሃርቲ ናይ ዕለት ሓሳባትን',
      description: 'ቁጽሪ (1–75) ምስ ጽቡቕ ዕላልን ናይ ሓጐስ ቃላትን ዘወሃህድ ቀንዲ ቅዲ።',
    },
    ril: {
      label: 'RIL – ስፖርት፣ ደርፍን ሙዚቃን',
      subcategory: 'ሓባራዊ ደርፊ፣ ናይ ሙዚቃ QUIZ፣ ግጥምን ናይ ጋንታ መንፈስን',
      description: 'ናይ ስፖርትን ማሕበርን ቢንጎ ምስ መዘናግዒ ሕቶታት ሙዚቃን ሓባራዊ ደገፍን።',
    },
    heartfelt: {
      label: 'ፍቕርን ቅርበትን',
      subcategory: 'ዓሚቝ ታሪኻት፣ ርህራሄን ሓባራዊ ፍቕርን',
      description: 'ጽቡቕ ተዘክሮታትን ሓቀኛ ሕውነትን ምስ ዘካፈሉ ተጻወትቲ ተራኸብ።',
    },
    laughter: {
      label: 'ሰሓቕ፣ ዋዛን ፍሽኽታን',
      subcategory: 'ዘስሕቑ ታሪኻት፣ ጸወታታትን ዘይምለስ ፍሽኽታን',
      description: 'ነቲ ክፍሊ ብሰሓቕ ዝመልኡ መዘናግዕቲ ዛንታታትን ፍሉያት ልምድታትን።',
    },
    kindness: {
      label: 'ለውሃትን ሓልዮትን',
      subcategory: 'መዓልታዊ ሓገዝ፣ ናይ ጎረቤት ሓልዮትን ልግስን',
      description: 'ነቶም ናብራና ዘብርሁ ንኣሽቱ ሰናይ ተግባራት ኣትኵሮ ይገብር።',
    },
    gratitude: {
      label: 'ጥበብን ምስጋናን',
      subcategory: 'ናይ ህይወት ተመኩሮ፣ ሰላምን ኣስተንትኖን',
      description: 'ጠቐምቲ ሓሳባት፣ ምስጋናን ዘነቓቕሑ ናይ ህይወት ተመኩሮታትን።',
    },
    family_kids: {
      label: 'ስድራቤትን ቆልዑን (ምስ ኣዳላዊ)',
      subcategory: 'መዘናግዒ ዕማማት፣ ድምጺ እንስሳታት፣ ደርፍን ምስ ኣዳላዊ ጸወታን',
      description: 'ቆልዑን ዓበይትን ብሓባር ብውሑስን ዘሐጕስን መንገዲ ምስ ኣዳላዊ ዝጻወትሉ ናይ ስድራ ቢንጎ።',
    },
  },

  sec2Title: '2. ቅዲ ጸወታ:',
  modeAllTitle: 'ኩሉ ብሓደ',
  modeAllDesc: 'ከበሮ + ሰሌዳ ብሓደ',
  modeBoardTitle: 'ሰሌዳ ጥራይ',
  modeBoardDesc: 'ንተጻወትቲ',
  modeCallerTitle: 'ኣዳላዊ / ከበሮ',
  modeCallerDesc: 'ንመጸውዒ',
  modePassTitle: 'ናይ ምሸት ጸወታ',
  modePassDesc: '2–8 ኣብ ሓደ ስክሪን',

  sec3Title: '3. ቅዲ ካርድ ኣብ ሰሌዳ:',
  fmtBothShort: 'ቁጽሪ + ቃላት',
  fmtNumbersShort: 'ቁጽሪ ጥራይ',
  fmtPromptsShort: 'ቃላት ጥራይ',
  fmtBothLabel: 'ቁጽሪ + ቃላት (ውሁድ)',
  fmtNumbersLabel: 'ቁጽሪ ጥራይ (1–75)',
  fmtPromptsLabel: 'ቃላትን ሓሳባትን ጥራይ',

  sec4Title: '4. ብዝሒ ተጻወትትን ኣስማትን:',
  playerSingular: 'ተጻዋታይ',
  playerPlural: 'ተጻወትቲ',
  setCountLabel: 'ብዝሒ ኣቐምጥ:',
  soloLabel: '1 በይኑ',
  pcsSuffix: 'ሰብ',
  playerPlaceholder: 'ስም ተጻዋታይ ጽሓፍ',
  removePlayer: 'ተጻዋታይ ኣልግስ',
  addOnePlayer: 'ሓደ ተጻዋታይ ወስኽ',
  useScheduleNames: 'ካብ መደብ መዓልቲ ኣስማት ተጠቐም',

  cardsPerPlayerLabel: 'ካርድ ንነፍሲ ወከፍ:',
  screenLabel: 'ስክሪን:',
  screenMobile: '📱 ሞባይል',
  screenDesktop: '💻 ኮምፒዩተር',
  screenBigScreen: '📺 ዓቢ ስክሪን',

  remoteTitle: 'ብርሑቕ ብሓባር ተጻወቱ (ኮድ ጸወታ)',
  remoteBadge: 'ናይ ርሑቕ ቢንጎ',
  remoteDesc: 'ኣዳላዊ መተኣሳሰሪ ኮድ ኣካፊሉካ ድዩ? ብሞባይልካ ብነጻ ኣብ ናይ ርሑቕ ቢንጎ ወይ ናይ ጋንታ QUIZ ተሳተፍ!',
  remoteBtn: 'ናይ ርሑቕ ቢንጎ',
  joinQuizBtn: 'ኣብ QUIZ ተሳተፍ',

  activeRoomCodeTitle: 'ንጡፍ ናይ መተኣሳሰሪ ኮድካ:',
  openEverywhereBadge: '✓ ኣብ ኩሉ ክፉት',
  openForMobileTvBadge: '✓ ንሞባይልን ቲቪን ክፉት',
  activatingBadge: '⏳ ይኽፈት ኣሎ...',
  roomCodeOpenInfo: 'እቲ ኮድ ንኹሎም ሞባይላትን ቲቪታትን ክፉት እዩ።',
  copyCodeBtn: '📋 ኮድ ቅዳሕ',
  copiedBtn: '✓ ተቐዲሑ',
  copyInviteLinkBtn: '🔗 ናይ ተሳታፊ ሊንክ',
  copiedLinkBtn: '✓ ሊንክ ተቐዲሑ',
  reactivateCodeBtn: 'ዳግማይ ኣብርህ',

  resume5MinTrial: 'ናይ 10 ደቒቕ ፈተነ ቀጽል',
  startPrefix: 'ጀምር',
  all4FormatsBtn: 'ኩሎም ቅድታት ጸወታ (ቢንጎ፣ QUIZ & Memory)',
  helperLockedTitle: 'ግዴታዊ መእተውን ክፍሊትን:',
  helperLockedDesc: 'ኣብ ላዕለዋይ ሳጹን እቶን ክፈልን (ወይ ኩሎም ጸወታታት 10 ደቒቕ ብነጻ ፈትን)። ግዜ ምስ ተወድአ ብባዕሉ ይወጽእ።',
  helperUnpaidEnd: 'ኩሎም 6 ቅድታት ጸወታ ንምኽፋት ኣብ «ንምጅማር ግዴታዊ ክፍሊት» ክፍሊት ወድእ።',
  helperActivePrefix: '✓ ብስም ዝኣተኻሉ',
  helperRemainingSuffix: 'ተሪፉ ኣሎ (ኣብ 00:00:00 ብባዕሉ ይወጽእ)',

  kahootJoinTitle: 'ካብ ኣዳላዊ ኮድ ወይ ሊንክ ረኺብካ ዲኻ? (Kahoot ኩነት)',
  kahootJoinBadge: 'ንኹሉ ዕድመ ብነጻ',
  kahootJoinDesc: 'ቆልዑን ስድራቤታትን ብዘይ ኣካውንት፣ ብዘይ ኢመይልን ብዘይ ክፍሊትን ብኮድ ይሳተፉ:',
  kahootCodePlaceholder: 'ኮድ ኣእቱ (ንኣብነት 4821)',
  kahootJoinQuizBtn: 'ኣብ Quiz ተሳተፍ',
  kahootJoinBingoBtn: 'ማሕበራዊ ቢንጎ',
  kahootSafetyBadges: 'ንኹሉ ዕድመ ክፉት · ንቆልዑ ውልቃዊ ሓበሬታ ኣይሕተትን · ናይ ገንዘብ ቁማር የለን',
  privacyBtn: 'ውልቃዊ ሓለዋን ድሕነት ቆልዑን',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together',
  footerShortcut: 'ንምጅማር Space / Enter ጠውቕ',
  footerOptimized: 'ን iOSን PCን ዝተዳለወ',
};

const SV_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Obegränsad (Ägare)',
  unlimitedOwnerTitle: 'Ägaren har obegränsad speltid — klicka för att öppna Ägarpanel',
  expiredLabel: 'Utgått',
  iosApp: 'iOS App',
  participants: 'Deltagare',
  broadcast: 'Sändning',
  remoteBingo: 'Distansbingo',
  bigScreen: 'Storbild',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Välj Quiz eller Memory (Vuxenquiz, Familjequiz, JulQuiz, Seniorquiz, Memory)',
  screenMobileShort: 'Mobil',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Projektor',
  toolsBtn: 'Verktyg',
  toolsBtnTitle: 'Verktyg, deltagare, dagsplan och inställningar',
  quizLabel: 'QUIZ',
  quizTitle: 'Val 3: Kultur-, Musik- & Fanquiz (QUIZ)',
  familyQuizLabel: 'Familjequiz',
  familyQuizTitle: 'Val 4: Familje- & Barnquiz (Kultur, Musik & Ordlek)',
  christmasQuizLabel: 'JulQuiz',
  christmasQuizTitle: 'Val 5: JulQuiz (300 frågor i slumpad ordning + 80 charader)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Val 7: Senior Grenland Quiz — Musikgissning, lokalhistoria & minnen',
  memoryLabel: 'Memory',
  memoryTitle: 'Val 6: Memory — Bildspel med 30 kort (15 par), lagspel & poäng',
  mixer: 'Mixer',
  quests: 'Uppdrag',
  schedule: 'Dagsplan',
  report: 'Rapportera',
  ownerPanel: 'Ägarpanel',
  editStartPanel: 'Redigera startpanel',
  doneEditing: 'Klar med redigering',
  printCards: 'Skriv ut brickor',
  soundOn: 'Slå på ljud',
  soundOff: 'Stäng av ljud',

  timeWarningTitlePrefix: 'Tidvarning: Endast',
  timeWarningTitleSuffix: 'kvar av speltiden!',
  timeWarningDesc: 'Spelet och värden loggas ut automatiskt vid 00:00:00. Förläng med Visa, Mastercard eller Apple Pay.',
  extendPlaytime: 'Förläng speltid ➔',

  heroBadge: 'Socialt & Familjevänligt',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quiz, familjemys, memory & social gemenskap för alla åldrar',

  drumTitle: 'Live Dragningstrumma & Socialt Spel',
  drumBadge: 'Aktiv Trumma',
  drumDescPaid: 'Ditt evenemangspaket är aktivt — snurra kulorna eller växla fritt mellan Storbild, Distansbingo, QUIZ, Familjequiz, JulQuiz och Memory!',
  drumDescTrial: '10 minuters gratis provspel är öppet för alla spel — testa alla spel och rumskod nu!',
  drumDescGuest: 'Förhandsvisning av 60fps dragningstrumma — prova alla spel 10 min gratis eller logga in som arrangör!',
  try5MinFree: 'Prova 10 min gratis (alla spel)',
  choose4Games: 'Välj bland alla spel',
  drumHint: 'Testa trumman, dra i veven eller blanda kulorna för att uppleva fysiken och ljudet.',
  drumMeta: '75 bollar (B-I-N-G-O) · 60 fps animation',

  lockBannerTitle: 'För Arrangör: Inloggning & Evenemangspass',
  lockBadge: 'Arrangör',
  lockBannerDesc: 'Arrangören loggar in och betalar för att starta evenemanget och skapa kod/länk. Barn, familj och gäster går med GRATIS med kod utan konto!',
  loginAndPayBtn: 'Arrangör: Logga in & Betala ➔',

  payBannerTitle: 'Arrangör: Välj speltid för att starta',
  payMethodBadge: 'Kort, Apple Pay & GPay',
  payLoggedInAs: 'Inloggad arrangör:',
  payRoleHost: 'Arrangör / Värd',
  payRolePlayer: 'Arrangör',
  payBannerTextAfterRole: 'Betala tryggt med Visa, Mastercard, Apple Pay eller Google Pay. Rumskod och länk skapas efter betalning.',
  chooseAndPayBtn: 'Välj & Betala Speltid ➔',

  trialBannerTitle: '10 Minuter Gratis Provspel på Alla Spel!',
  trialBannerDesc: 'Prova alla spel fritt i 10 minuter — Storbild, Distansbingo, Musikbingo, QUIZ, Familjequiz, JulQuiz, Senior Quiz och Memory!',
  resumeTrialBtn: '▶ Fortsätt Provspel',
  buyFullTimeBtn: '💳 Köp full speltid ➔',

  ownerModeActiveTitle: 'Ägarläge Aktivt — Obegränsad Tillgång!',
  paidPackageActiveTitle: 'Evenemangspaket Aktivt & Betalt!',
  ownerInfiniteBadge: '∞ Ägare',
  freeFlowBadge: 'Fritt byte',
  activePlaytimeLabel: 'Speltid aktiv:',
  paidPackageDescSuffix: 'Du kan fritt växla mellan Storbild Bingo, Distansbingo, QUIZ, Familjequiz, JulQuiz och Memory utan ny betalning!',
  openOwnerPanel: 'Öppna Ägarpanel',
  all4Games: 'Alla 6 spel',

  ownerEditBannerTitle: 'Ägarens Redigeringsläge i Startpanelen',
  ownerEditBannerDesc: 'Ändra titel, synliga knappar, favoritkategori och standardinställningar nedan och spara till server och moln.',
  saveStartPanelBtn: 'Spara inställningar (Server & Moln)',
  savingBtn: 'Sparar...',
  openFullOwnerModalBtn: 'Full Ägarpanel (Priser & PIN)',
  editAppTitleLabel: 'App-titel:',
  editAppSubtitleLabel: 'Undertitel:',
  editModulesLabel: 'Synliga moduler & knappar:',
  showLiveDrumToggle: 'Live Bingotrumma på startsidan',
  setAsFavorite1: 'Sätt som Favorit #1',
  isFavorite1: 'Favorit #1 ✓',
  moveUp: 'Upp',
  moveDown: 'Ner',
  savedDefaultsSuccess: 'Startpanelens inställningar har sparats permanent!',

  sec1Title: '1. Kategori & Innehåll (Välj i listan):',
  sec1Sub: 'Inkluderar Injoy Together & Underkategorier',
  favorite1Tag: '⭐ [Favorit #1]',
  activeCategoryBadge: 'Aktiv Kategori',
  musicSongActive: '🎵 Sång & Musik aktiv',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Klassiskt Socialt Spel)',
      subcategory: '75-bollars spel & upplyftande vardagsgnistor',
      description: 'Originalformatet som kombinerar nummerdragning (1–75) med varma samtalsämnen och vardagsglädje.',
    },
    ril: {
      label: 'RIL – Idrott, Sång & Musik',
      subcategory: 'Allsång, musikquiz, sångtexter, laganda & klubbglädje',
      description: 'Idrotts- och föreningsbingo med roliga musikfrågor, hejarop och lagkänsla.',
    },
    heartfelt: {
      label: 'Hjärtevärme & Närhet',
      subcategory: 'Djupa berättelser, värme och empati i gemenskapen',
      description: 'Hitta medspelare som delat fina minnen och skapat äkta samhörighet.',
    },
    laughter: {
      label: 'Skratt, Humor & Leenden',
      subcategory: 'Roliga upptåg, lekfulla ögonblick & smittande leenden',
      description: 'Underhållande historier och tokiga vanor som garanterat skapar skratt i rummet.',
    },
    kindness: {
      label: 'Godhet & Omsorg',
      subcategory: 'Vardagshjälp, grannomsorg och generositet',
      description: 'Fokus på de små goda gärningarna som gör vardagen ljusare för alla runt omkring oss.',
    },
    gratitude: {
      label: 'Visdom & Tacksamhet',
      subcategory: 'Livserfarenhet, lugn och eftertanke i vardagen',
      description: 'Fina reflektioner, tacksamhet och inspirerande livserfarenheter.',
    },
    family_kids: {
      label: 'Familj & Barn (Spela med värd)',
      subcategory: 'Lekfulla uppdrag, djurläten, sång och high-fives med bingovärden',
      description: 'Familjebingo där barn och vuxna spelar och skrattar tillsammans med bingovärden.',
    },
  },

  sec2Title: '2. Spelläge:',
  modeAllTitle: 'Allt-i-ett',
  modeAllDesc: 'Trumma + Brickor ihop',
  modeBoardTitle: 'Endast Brickor',
  modeBoardDesc: 'För spelare',
  modeCallerTitle: 'Värd / Trumma',
  modeCallerDesc: 'För utropare',
  modePassTitle: 'Spelkväll',
  modePassDesc: '2–8 runt skärmen',

  sec3Title: '3. Kortformat på brickan:',
  fmtBothShort: 'Siffror + Ord',
  fmtNumbersShort: 'Endast siffror',
  fmtPromptsShort: 'Endast ord',
  fmtBothLabel: 'Siffror + Ord (Kombination)',
  fmtNumbersLabel: 'Endast Siffror (1–75)',
  fmtPromptsLabel: 'Endast Ord & Gnistor',

  sec4Title: '4. Antal spelare & Namn:',
  playerSingular: 'spelare',
  playerPlural: 'spelare',
  setCountLabel: 'Ange antal:',
  soloLabel: '1 Solo',
  pcsSuffix: 'st',
  playerPlaceholder: 'Skriv namn för Spelare',
  removePlayer: 'Ta bort spelare',
  addOnePlayer: 'Lägg till en spelare',
  useScheduleNames: 'Använd namn från dagsplan',

  cardsPerPlayerLabel: 'Brickor per spelare:',
  screenLabel: 'Skärm:',
  screenMobile: '📱 Mobil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Storbild',

  remoteTitle: 'Spela tillsammans på distans (Spelkod)',
  remoteBadge: 'Distansbingo',
  remoteDesc: 'Har arrangören delat en rumskod? Gå med gratis i Distansbingo eller Lagquiz med mobilen!',
  remoteBtn: 'Distansbingo',
  joinQuizBtn: 'Gå med i Quiz',

  activeRoomCodeTitle: 'Din aktiva deltagarkod för evenemanget:',
  openEverywhereBadge: '✓ Öppen överallt',
  openForMobileTvBadge: '✓ Öppen för mobil & TV',
  activatingBadge: '⏳ Aktiverar...',
  roomCodeOpenInfo: 'Deltagarkoden är öppen för alla mobiler och TV-skärmar i evenemanget.',
  copyCodeBtn: '📋 Kopiera kod',
  copiedBtn: '✓ Kopierad',
  copyInviteLinkBtn: '🔗 Deltagarlänk',
  copiedLinkBtn: '✓ Länk kopierad',
  reactivateCodeBtn: 'Aktivera igen',

  resume5MinTrial: 'Fortsätt 10-min provspel',
  startPrefix: 'Starta',
  all4FormatsBtn: 'Alla Spelformat (Bingo, QUIZ & Memory)',
  helperLockedTitle: 'Obligatorisk inloggning & betalning:',
  helperLockedDesc: 'Logga in och betala speltid ovan (eller prova alla spel 10 min gratis). Automatisk utloggning sker när tiden går ut.',
  helperUnpaidEnd: 'Slutför betalning ovan för att låsa upp alla 6 spelformat.',
  helperActivePrefix: '✓ Inloggad som',
  helperRemainingSuffix: 'återstår (automatisk utloggning vid 00:00:00)',

  kahootJoinTitle: 'Har du fått kod eller länk av arrangören? (Kahoot-läge)',
  kahootJoinBadge: 'Gratis för alla åldrar',
  kahootJoinDesc: 'Barn, familj och gäster går med utan konto, utan e-post och utan betalning. Ange arrangörens kod:',
  kahootCodePlaceholder: 'Skriv kod (t.ex. 4821)',
  kahootJoinQuizBtn: 'Gå med i Quiz',
  kahootJoinBingoBtn: 'Social Bingo',
  kahootSafetyBadges: 'Öppet för alla åldrar · Inga personuppgifter för barn · Inget spel om pengar',
  privacyBtn: 'Integritet & Barnsäkerhet',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (utan penningspel)',
  footerShortcut: 'Space / Enter för att starta',
  footerOptimized: 'En webbadress för alla enheter',
};

const DE_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Unbegrenzt (Eigentümer)',
  unlimitedOwnerTitle: 'Eigentümer hat unbegrenzte Spielzeit — klicken zum Öffnen',
  expiredLabel: 'Abgelaufen',
  iosApp: 'iOS App',
  participants: 'Teilnehmer',
  broadcast: 'Übertragung',
  remoteBingo: 'Fern-Bingo',
  bigScreen: 'Großbild',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Quiz oder Memory wählen (Erwachsenen-, Familien-, Weihnachts-, Seniorenquiz, Memory)',
  screenMobileShort: 'Mobil',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Beamer',
  toolsBtn: 'Werkzeuge',
  toolsBtnTitle: 'Werkzeuge, Teilnehmer, Tagesplan und Einstellungen',
  quizLabel: 'QUIZ',
  quizTitle: 'Option 3: Kultur-, Musik- & Fanquiz (QUIZ)',
  familyQuizLabel: 'Familienquiz',
  familyQuizTitle: 'Option 4: Familien- & Kinderquiz (Kultur, Musik & Wortspiele)',
  christmasQuizLabel: 'Weihnachtsquiz',
  christmasQuizTitle: 'Option 5: Weihnachtsquiz (300 Fragen + 80 Pantomime-Karten)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Option 7: Senior Grenland Quiz — Musikraten, Lokalgeschichte & Erinnerungen',
  memoryLabel: 'Memory',
  memoryTitle: 'Option 6: Memory — Bilderspiel (30 Karten / 15 Paare, Teamwertung)',
  mixer: 'Mixer',
  quests: 'Aufgaben',
  schedule: 'Tagesplan',
  report: 'Melden',
  ownerPanel: 'Eigentümer-Panel',
  editStartPanel: 'Startseite bearbeiten',
  doneEditing: 'Bearbeitung beenden',
  printCards: 'Karten drucken',
  soundOn: 'Ton einschalten',
  soundOff: 'Ton ausschalten',

  timeWarningTitlePrefix: 'Zeitwarnung: Nur noch',
  timeWarningTitleSuffix: 'Spielzeit übrig!',
  timeWarningDesc: 'Spiel und Leiter werden bei 00:00:00 automatisch abgemeldet. Verlängere mit Visa, Mastercard oder Apple Pay.',
  extendPlaytime: 'Spielzeit verlängern ➔',

  heroBadge: 'Sozial & Familienfreundlich',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quiz, Familienspaß, Memory & Gemeinschaft für jedes Alter',

  drumTitle: 'Live-Ziehungstrommel & Gesellschaftsspiel',
  drumBadge: 'Aktive Trommel',
  drumDescPaid: 'Dein Event-Paket ist aktiv — drehe die Kugeln oder wechsle frei zwischen Großbild, Fern-Bingo, QUIZ und Memory!',
  drumDescTrial: '10 Minuten kostenloser Test für alle Spiele — probiere jetzt alle Spiele und den Raumcode aus!',
  drumDescGuest: 'Vorschau der 60fps Ziehungstrommel — teste alle Spiele 10 Min kostenlos oder melde dich an!',
  try5MinFree: '10 Min kostenlos testen (alle Spiele)',
  choose4Games: 'Alle Spiele wählen',
  drumHint: 'Teste die Trommel, drehe die Kurbel oder mische die Kugeln für Physik & Sound.',
  drumMeta: '75 Kugeln (B-I-N-G-O) · 60 fps Animation',

  lockBannerTitle: 'Für Veranstalter: Anmeldung & Event-Pass',
  lockBadge: 'Veranstalter',
  lockBannerDesc: 'Veranstalter melden sich an und zahlen für das Event. Kinder, Familie und Gäste spielen KOSTENLOS mit Code ohne Konto mit!',
  loginAndPayBtn: 'Veranstalter: Anmelden & Bezahlen ➔',

  payBannerTitle: 'Veranstalter: Spielzeit zum Starten wählen',
  payMethodBadge: 'Karte, Apple Pay & GPay',
  payLoggedInAs: 'Angemeldeter Veranstalter:',
  payRoleHost: 'Veranstalter / Leiter',
  payRolePlayer: 'Veranstalter',
  payBannerTextAfterRole: 'Bezahle sicher mit Visa, Mastercard, Apple Pay oder Google Pay. Raumcode & Link werden sofort erstellt.',
  chooseAndPayBtn: 'Spielzeit wählen & bezahlen ➔',

  trialBannerTitle: '10 Minuten Kostenloser Test für Alle Spiele!',
  trialBannerDesc: 'Teste alle Spiele 10 Minuten frei — Großbild, Fern-Bingo, Musikbingo, QUIZ, Familienquiz, Weihnachtsquiz & Memory!',
  resumeTrialBtn: '▶ Test fortsetzen',
  buyFullTimeBtn: '💳 Volle Spielzeit kaufen ➔',

  ownerModeActiveTitle: 'Eigentümermodus Aktiv — Unbegrenzter Zugang!',
  paidPackageActiveTitle: 'Event-Paket Aktiv & Bezahlt!',
  ownerInfiniteBadge: '∞ Eigentümer',
  freeFlowBadge: 'Freier Wechsel',
  activePlaytimeLabel: 'Aktive Spielzeit:',
  paidPackageDescSuffix: 'Du kannst frei zwischen Großbild Bingo, Fern-Bingo, QUIZ, Familienquiz, Weihnachtsquiz & Memory wechseln!',
  openOwnerPanel: 'Eigentümer-Panel öffnen',
  all4Games: 'Alle 6 Spiele',

  ownerEditBannerTitle: 'Startseiten-Bearbeitungsmodus',
  ownerEditBannerDesc: 'Bearbeite Titel, sichtbare Module, Favoriten und Standardwerte unten und speichere in Server & Cloud.',
  saveStartPanelBtn: 'Setup speichern (Server & Cloud)',
  savingBtn: 'Speichert...',
  openFullOwnerModalBtn: 'Volles Eigentümer-Panel (Preise & PIN)',
  editAppTitleLabel: 'App-Titel:',
  editAppSubtitleLabel: 'Untertitel:',
  editModulesLabel: 'Sichtbare Module & Tasten:',
  showLiveDrumToggle: 'Live-Bingotrommel auf Startseite',
  setAsFavorite1: 'Als Favorit #1 setzen',
  isFavorite1: 'Favorit #1 ✓',
  moveUp: 'Hoch',
  moveDown: 'Runter',
  savedDefaultsSuccess: 'Startseiten-Setup dauerhaft gespeichert!',

  sec1Title: '1. Kategorie & Inhalt (Auswahlmenü):',
  sec1Sub: 'Enthält Injoy Together & Unterkategorien',
  favorite1Tag: '⭐ [Favorit #1]',
  activeCategoryBadge: 'Aktive Kategorie',
  musicSongActive: '🎵 Gesang & Musik aktiv',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Klassisches Gesellschaftsspiel)',
      subcategory: '75-Kugeln-Spiel & herzliche Alltagsfunken',
      description: 'Das Originalformat mit Zahlenziehung (1–75) und warmherzigen Gesprächsimpulsen.',
    },
    ril: {
      label: 'RIL – Sport, Gesang & Musik',
      subcategory: 'Mitsingen, Musikquiz, Liedzeilen & Teamgeist',
      description: 'Sport- und Vereinsbingo mit tollen Musikfragen, gemeinsamen Jubelrufen und Teamgeist.',
    },
    heartfelt: {
      label: 'Herzenswärme & Nähe',
      subcategory: 'Tiefe Geschichten, Wärme und Empathie',
      description: 'Verbinde dich mit Mitspielern durch schöne Erinnerungen und echtes Miteinander.',
    },
    laughter: {
      label: 'Lachen, Humor & Lächeln',
      subcategory: 'Lustige Geschichten, witzige Momente & gute Laune',
      description: 'Unterhaltsame Anekdoten und lustige Gewohnheiten für garantiertes Lachen.',
    },
    kindness: {
      label: 'Güte & Fürsorge',
      subcategory: 'Alltagshilfe, Nachbarschaft und Großzügigkeit',
      description: 'Fokus auf die kleinen guten Taten, die den Alltag heller machen.',
    },
    gratitude: {
      label: 'Weisheit & Dankbarkeit',
      subcategory: 'Lebenserfahrung, Ruhe und Reflexion',
      description: 'Wertvolle Gedanken, Dankbarkeit und inspirierende Lebenserfahrungen.',
    },
    family_kids: {
      label: 'Familie & Kinder (Mit Spielleiter)',
      subcategory: 'Spielerische Aufgaben, Tierlaute, Lieder & High-Fives',
      description: 'Familienbingo, bei dem Kinder und Erwachsene gemeinsam lachen und spielen.',
    },
  },

  sec2Title: '2. Spielmodus:',
  modeAllTitle: 'Alles-in-einem',
  modeAllDesc: 'Trommel + Karten zusammen',
  modeBoardTitle: 'Nur Karten',
  modeBoardDesc: 'Für Spieler',
  modeCallerTitle: 'Leiter / Trommel',
  modeCallerDesc: 'Für Ansager',
  modePassTitle: 'Spieleabend',
  modePassDesc: '2–8 am Bildschirm',

  sec3Title: '3. Kartenformat auf dem Brett:',
  fmtBothShort: 'Zahlen + Wörter',
  fmtNumbersShort: 'Nur Zahlen',
  fmtPromptsShort: 'Nur Wörter',
  fmtBothLabel: 'Zahlen + Wörter (Kombiniert)',
  fmtNumbersLabel: 'Nur Zahlen (1–75)',
  fmtPromptsLabel: 'Nur Wörter & Impulse',

  sec4Title: '4. Spieleranzahl & Namen:',
  playerSingular: 'Spieler',
  playerPlural: 'Spieler',
  setCountLabel: 'Anzahl wählen:',
  soloLabel: '1 Solo',
  pcsSuffix: 'Pers.',
  playerPlaceholder: 'Namen eingeben für Spieler',
  removePlayer: 'Spieler entfernen',
  addOnePlayer: 'Spieler hinzufügen',
  useScheduleNames: 'Namen aus Tagesplan nutzen',

  cardsPerPlayerLabel: 'Karten pro Spieler:',
  screenLabel: 'Bildschirm:',
  screenMobile: '📱 Mobil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Großbild',

  remoteTitle: 'Gemeinsam aus der Ferne spielen (Raumcode)',
  remoteBadge: 'Fern-Bingo',
  remoteDesc: 'Hat der Veranstalter einen Raumcode geteilt? Tritt kostenlos per Handy bei!',
  remoteBtn: 'Fern-Bingo',
  joinQuizBtn: 'Quiz beitreten',

  activeRoomCodeTitle: 'Dein aktiver Teilnehmercode für das Event:',
  openEverywhereBadge: '✓ Überall offen',
  openForMobileTvBadge: '✓ Offen für Mobil & TV',
  activatingBadge: '⏳ Aktiviert...',
  roomCodeOpenInfo: 'Der Code ist für alle Handys und TVs des Events offen (private Leiterdaten bleiben geschützt).',
  copyCodeBtn: '📋 Code kopieren',
  copiedBtn: '✓ Kopiert',
  copyInviteLinkBtn: '🔗 Einladungslink',
  copiedLinkBtn: '✓ Link kopiert',
  reactivateCodeBtn: 'Erneut aktivieren',

  resume5MinTrial: '10-Min-Test fortsetzen',
  startPrefix: 'Starten',
  all4FormatsBtn: 'Alle Spielformate (Bingo, QUIZ & Memory)',
  helperLockedTitle: 'Pflichtanmeldung & Zahlung:',
  helperLockedDesc: 'Melde dich oben an (oder teste alle Spiele 10 Min kostenlos). Automatische Abmeldung bei Zeitablauf.',
  helperUnpaidEnd: 'Schließe oben die Zahlung ab, um alle 6 Spielformate freizuschalten.',
  helperActivePrefix: '✓ Angemeldet als',
  helperRemainingSuffix: 'übrig (automatische Abmeldung bei 00:00:00)',

  kahootJoinTitle: 'Code oder Link vom Veranstalter erhalten? (Kahoot-Modus)',
  kahootJoinBadge: 'Kostenlos für alle',
  kahootJoinDesc: 'Kinder, Familien und Gäste treten ohne Konto, E-Mail und Zahlung bei:',
  kahootCodePlaceholder: 'Code eingeben (z. B. 4821)',
  kahootJoinQuizBtn: 'Quiz beitreten',
  kahootJoinBingoBtn: 'Sozial-Bingo',
  kahootSafetyBadges: 'Für alle Altersgruppen · Keine Kinderdaten · Kein Glücksspiel',
  privacyBtn: 'Datenschutz & Kindersicherheit',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (kein Glücksspiel)',
  footerShortcut: 'Space / Enter zum Starten',
  footerOptimized: 'Eine Adresse für alle Geräte',
};

const ES_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Ilimitado (Propietario)',
  unlimitedOwnerTitle: 'Acceso ilimitado de propietario — haz clic para abrir el panel',
  expiredLabel: 'Expirado',
  iosApp: 'App iOS',
  participants: 'Participantes',
  broadcast: 'Transmisión',
  remoteBingo: 'Bingo Remoto',
  bigScreen: 'Pantalla Grande',
  quizAndMemory: 'Quiz y Memory',
  quizAndMemoryTitle: 'Elegir Quiz o Memory (Adultos, Familiar, Navidad, Senior, Memory)',
  screenMobileShort: 'Móvil',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Proyector',
  toolsBtn: 'Herramientas',
  toolsBtnTitle: 'Herramientas, participantes, horario y ajustes',
  quizLabel: 'QUIZ',
  quizTitle: 'Opción 3: Cultura, Música y Fanquiz (QUIZ)',
  familyQuizLabel: 'Quiz Familiar',
  familyQuizTitle: 'Opción 4: Quiz Familiar e Infantil',
  christmasQuizLabel: 'Quiz de Navidad',
  christmasQuizTitle: 'Opción 5: Quiz de Navidad (300 preguntas + 80 mímica)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Opción 7: Senior Grenland Quiz — Música, historia local y recuerdos',
  memoryLabel: 'Memory',
  memoryTitle: 'Opción 6: Memory — Juego de memoria (30 cartas / 15 parejas)',
  mixer: 'Mezclador',
  quests: 'Misiones',
  schedule: 'Horario',
  report: 'Reportar',
  ownerPanel: 'Panel Propietario',
  editStartPanel: 'Editar Inicio',
  doneEditing: 'Finalizar Edición',
  printCards: 'Imprimir Cartones',
  soundOn: 'Activar sonido',
  soundOff: 'Silenciar',

  timeWarningTitlePrefix: 'Aviso de tiempo: Solo queda',
  timeWarningTitleSuffix: 'de juego!',
  timeWarningDesc: 'El juego se cerrará automáticamente a las 00:00:00. Amplía con Visa, Mastercard o Apple Pay.',
  extendPlaytime: 'Ampliar tiempo ➔',

  heroBadge: 'Social y Familiar',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quiz, alegría en familia, memoria y unión social para todas las edades',

  drumTitle: 'Bombo en Vivo y Juego Social',
  drumBadge: 'Bombo Activo',
  drumDescPaid: 'Tu paquete de evento está activo — ¡gira las bolas o cambia libremente entre Pantalla Grande, Bingo Remoto, QUIZ y Memory!',
  drumDescTrial: 'Prueba gratuita de 10 minutos abierta para todos los juegos — ¡pruébalos ahora!',
  drumDescGuest: 'Vista previa del bombo 60fps — ¡prueba todos los juegos 10 min gratis o inicia sesión!',
  try5MinFree: 'Prueba 10 min gratis (todos)',
  choose4Games: 'Elegir entre todos los juegos',
  drumHint: 'Prueba el bombo, gira la manivela o mezcla las bolas.',
  drumMeta: '75 bolas (B-I-N-G-O) · Animación 60 fps',

  lockBannerTitle: 'Para Organizadores: Acceso y Pase de Evento',
  lockBadge: 'Organizador',
  lockBannerDesc: 'El organizador inicia sesión y paga para crear el código. ¡Niños, familias e invitados entran GRATIS con el código sin cuenta!',
  loginAndPayBtn: 'Organizador: Entrar y Pagar ➔',

  payBannerTitle: 'Organizador: Elige el tiempo para comenzar',
  payMethodBadge: 'Tarjeta, Apple Pay y GPay',
  payLoggedInAs: 'Organizador conectado:',
  payRoleHost: 'Organizador',
  payRolePlayer: 'Organizador',
  payBannerTextAfterRole: 'Paga de forma segura con Visa, Mastercard, Apple Pay o Google Pay.',
  chooseAndPayBtn: 'Elegir y Pagar Tiempo ➔',

  trialBannerTitle: '¡10 Minutos de Prueba Gratis en Todos los Juegos!',
  trialBannerDesc: 'Prueba todos los juegos gratis durante 10 minutos: Pantalla Grande, Bingo Remoto, Bingo Musical, QUIZ y Memory.',
  resumeTrialBtn: '▶ Continuar Prueba',
  buyFullTimeBtn: '💳 Comprar tiempo completo ➔',

  ownerModeActiveTitle: 'Modo Propietario Activo — ¡Acceso Ilimitado!',
  paidPackageActiveTitle: '¡Pase de Evento Activo y Pagado!',
  ownerInfiniteBadge: '∞ Propietario',
  freeFlowBadge: 'Cambio Libre',
  activePlaytimeLabel: 'Tiempo activo:',
  paidPackageDescSuffix: '¡Puedes alternar libremente entre todos los formatos sin pagar de nuevo!',
  openOwnerPanel: 'Abrir Panel Propietario',
  all4Games: 'Los 6 Juegos',

  ownerEditBannerTitle: 'Modo de Edición del Panel Inicial',
  ownerEditBannerDesc: 'Cambia título, botones visibles, categoría favorita y valores por defecto abajo.',
  saveStartPanelBtn: 'Guardar Ajuste (Servidor y Nube)',
  savingBtn: 'Guardando...',
  openFullOwnerModalBtn: 'Panel Completo (Precios y PIN)',
  editAppTitleLabel: 'Título:',
  editAppSubtitleLabel: 'Subtítulo:',
  editModulesLabel: 'Módulos visibles:',
  showLiveDrumToggle: 'Bombo en vivo en portada',
  setAsFavorite1: 'Marcar Favorito #1',
  isFavorite1: 'Favorito #1 ✓',
  moveUp: 'Subir',
  moveDown: 'Bajar',
  savedDefaultsSuccess: '¡Ajustes guardados permanentemente!',

  sec1Title: '1. Categoría y Contenido (Elegir):',
  sec1Sub: 'Incluye Injoy Together y Subcategorías',
  favorite1Tag: '⭐ [Favorito #1]',
  activeCategoryBadge: 'Categoría Activa',
  musicSongActive: '🎵 Canción y Música activa',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Juego Social Clásico)',
      subcategory: 'Juego de 75 bolas e chispas cotidianas',
      description: 'El formato original que combina extracción (1–75) con cálidas conversaciones.',
    },
    ril: {
      label: 'RIL – Deporte, Canto y Música',
      subcategory: 'Canto, quiz musical, letras y espíritu de equipo',
      description: 'Bingo deportivo y cultural con preguntas musicales y alegría compartida.',
    },
    heartfelt: {
      label: 'Calidez y Cercanía',
      subcategory: 'Historias profundas, empatía y unión',
      description: 'Conecta con compañeros que comparten recuerdos entrañables.',
    },
    laughter: {
      label: 'Risas, Humor y Sonrisas',
      subcategory: 'Anécdotas divertidas y momentos alegres',
      description: 'Historias entretenidas garantizadas para llenar la sala de risas.',
    },
    kindness: {
      label: 'Bondad y Cuidado',
      subcategory: 'Ayuda cotidiana y generosidad',
      description: 'Enfoque en pequeños gestos bondadosos que iluminan el día.',
    },
    gratitude: {
      label: 'Sabiduría y Gratitud',
      subcategory: 'Experiencia de vida y reflexión',
      description: 'Reflexiones valiosas, gratitud y aprendizajes inspiradores.',
    },
    family_kids: {
      label: 'Familia y Niños (Con presentador)',
      subcategory: 'Retos divertidos, sonidos y canciones',
      description: 'Bingo familiar donde niños y adultos disfrutan juntos con seguridad.',
    },
  },

  sec2Title: '2. Modo de Juego:',
  modeAllTitle: 'Todo-en-Uno',
  modeAllDesc: 'Bombo + Cartones juntos',
  modeBoardTitle: 'Solo Cartones',
  modeBoardDesc: 'Para jugadores',
  modeCallerTitle: 'Anfitrión / Bombo',
  modeCallerDesc: 'Para cantor',
  modePassTitle: 'Noche de Juegos',
  modePassDesc: '2–8 en pantalla',

  sec3Title: '3. Formato del Cartón:',
  fmtBothShort: 'Números + Texto',
  fmtNumbersShort: 'Solo números',
  fmtPromptsShort: 'Solo texto',
  fmtBothLabel: 'Números + Texto (Combinado)',
  fmtNumbersLabel: 'Solo Números (1–75)',
  fmtPromptsLabel: 'Solo Frases de Alegría',

  sec4Title: '4. Número de Jugadores y Nombres:',
  playerSingular: 'jugador',
  playerPlural: 'jugadores',
  setCountLabel: 'Cantidad:',
  soloLabel: '1 Solo',
  pcsSuffix: 'jug.',
  playerPlaceholder: 'Nombre del jugador',
  removePlayer: 'Quitar jugador',
  addOnePlayer: 'Añadir jugador',
  useScheduleNames: 'Usar nombres del horario',

  cardsPerPlayerLabel: 'Cartones por jugador:',
  screenLabel: 'Pantalla:',
  screenMobile: '📱 Móvil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Pantalla Grande',

  remoteTitle: 'Jugar Juntos a Distancia (Código)',
  remoteBadge: 'Bingo Remoto',
  remoteDesc: '¿Te compartieron un código? ¡Únete gratis al Bingo Remoto o Quiz con tu móvil!',
  remoteBtn: 'Bingo Remoto',
  joinQuizBtn: 'Unirse al Quiz',

  activeRoomCodeTitle: 'Tu código activo para el evento:',
  openEverywhereBadge: '✓ Abierto en todas partes',
  openForMobileTvBadge: '✓ Abierto para móvil y TV',
  activatingBadge: '⏳ Activando...',
  roomCodeOpenInfo: 'El código está abierto para todos los móviles y pantallas de TV del evento.',
  copyCodeBtn: '📋 Copiar código',
  copiedBtn: '✓ Copiado',
  copyInviteLinkBtn: '🔗 Enlace de invitación',
  copiedLinkBtn: '✓ Enlace copiado',
  reactivateCodeBtn: 'Reactivar',

  resume5MinTrial: 'Continuar prueba de 10 min',
  startPrefix: 'Iniciar',
  all4FormatsBtn: 'Todos los Formatos (Bingo, QUIZ y Memory)',
  helperLockedTitle: 'Acceso y Pago Obligatorios:',
  helperLockedDesc: 'Inicia sesión arriba o prueba todos los juegos 10 min gratis.',
  helperUnpaidEnd: 'Completa el pago arriba para desbloquear los 6 juegos.',
  helperActivePrefix: '✓ Conectado como',
  helperRemainingSuffix: 'restantes (cierre automático a las 00:00:00)',

  kahootJoinTitle: '¿Tienes código o enlace del organizador? (Modo Kahoot)',
  kahootJoinBadge: 'Gratis para todas las edades',
  kahootJoinDesc: 'Niños, familias e invitados entran sin cuenta ni pago. Introduce el código:',
  kahootCodePlaceholder: 'Código (ej. 4821)',
  kahootJoinQuizBtn: 'Unirse al Quiz',
  kahootJoinBingoBtn: 'Bingo Social',
  kahootSafetyBadges: 'Para todas las edades · Sin datos de menores · Sin apuestas',
  privacyBtn: 'Privacidad y Seguridad Infantil',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (sin dinero real)',
  footerShortcut: 'Space / Enter para iniciar',
  footerOptimized: 'Una sola dirección para todos los dispositivos',
};

const FR_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'Illimité (Propriétaire)',
  unlimitedOwnerTitle: 'Accès illimité propriétaire — cliquer pour ouvrir',
  expiredLabel: 'Expiré',
  iosApp: 'App iOS',
  participants: 'Participants',
  broadcast: 'Diffusion',
  remoteBingo: 'Bingo à Distance',
  bigScreen: 'Grand Écran',
  quizAndMemory: 'Quiz & Memory',
  quizAndMemoryTitle: 'Choisir un Quiz ou Memory',
  screenMobileShort: 'Mobile',
  screenDesktopShort: 'PC',
  screenBigScreenShort: 'TV / Projecteur',
  toolsBtn: 'Outils',
  toolsBtnTitle: 'Outils, participants, planning et paramètres',
  quizLabel: 'QUIZ',
  quizTitle: 'Option 3 : Culture, Musique & Fanquiz',
  familyQuizLabel: 'Quiz Famille',
  familyQuizTitle: 'Option 4 : Quiz Famille & Enfants',
  christmasQuizLabel: 'Quiz de Noël',
  christmasQuizTitle: 'Option 5 : Quiz de Noël (300 questions + 80 mimes)',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'Option 7 : Senior Grenland Quiz — Musique & souvenirs',
  memoryLabel: 'Memory',
  memoryTitle: 'Option 6 : Memory — Jeu d’association (30 cartes / 15 paires)',
  mixer: 'Mixeur',
  quests: 'Quêtes',
  schedule: 'Planning',
  report: 'Signaler',
  ownerPanel: 'Panel Propriétaire',
  editStartPanel: 'Modifier l’accueil',
  doneEditing: 'Terminer',
  printCards: 'Imprimer les grilles',
  soundOn: 'Activer le son',
  soundOff: 'Couper le son',

  timeWarningTitlePrefix: 'Alerte temps : Plus que',
  timeWarningTitleSuffix: 'restantes !',
  timeWarningDesc: 'Déconnexion automatique à 00:00:00. Prolongez avec Visa, Mastercard ou Apple Pay.',
  extendPlaytime: 'Prolonger le temps ➔',

  heroBadge: 'Social & Familial',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Quiz, moments en famille, mémoire et convivialité pour tous',

  drumTitle: 'Boulier en Direct & Jeu Social',
  drumBadge: 'Boulier Actif',
  drumDescPaid: 'Votre forfait événement est actif — passez librement du Grand Écran au Bingo à Distance, QUIZ et Memory !',
  drumDescTrial: 'Essai gratuit de 10 minutes ouvert sur tous les jeux — testez maintenant !',
  drumDescGuest: 'Aperçu du boulier 60fps — essayez tous les jeux 10 min gratuitement !',
  try5MinFree: 'Essai gratuit 10 min (tous jeux)',
  choose4Games: 'Choisir parmi tous les jeux',
  drumHint: 'Testez le boulier, tournez la manivelle ou mélangez les boules.',
  drumMeta: '75 boules (B-I-N-G-O) · Animation 60 fps',

  lockBannerTitle: 'Organisateurs : Connexion & Pass Événement',
  lockBadge: 'Organisateur',
  lockBannerDesc: 'L’organisateur se connecte pour lancer la salle et générer le code. Enfants et invités rejoignent GRATUITEMENT sans compte !',
  loginAndPayBtn: 'Organisateur : Connexion & Paiement ➔',

  payBannerTitle: 'Organisateur : Choisir la durée de jeu',
  payMethodBadge: 'Carte, Apple Pay & GPay',
  payLoggedInAs: 'Organisateur connecté :',
  payRoleHost: 'Organisateur',
  payRolePlayer: 'Organisateur',
  payBannerTextAfterRole: 'Payez en toute sécurité par Visa, Mastercard, Apple Pay ou Google Pay.',
  chooseAndPayBtn: 'Choisir & Payer le temps ➔',

  trialBannerTitle: 'Essai Gratuit de 10 Minutes sur Tous les Jeux !',
  trialBannerDesc: 'Essayez tous les jeux pendant 10 minutes : Grand Écran, Bingo à Distance, Bingo Musical, QUIZ & Memory !',
  resumeTrialBtn: '▶ Reprendre l’essai',
  buyFullTimeBtn: '💳 Acheter du temps complet ➔',

  ownerModeActiveTitle: 'Mode Propriétaire Actif — Accès Illimité !',
  paidPackageActiveTitle: 'Pass Événement Actif & Payé !',
  ownerInfiniteBadge: '∞ Propriétaire',
  freeFlowBadge: 'Accès Libre',
  activePlaytimeLabel: 'Temps actif :',
  paidPackageDescSuffix: 'Basculez librement entre tous les jeux sans repayer !',
  openOwnerPanel: 'Ouvrir Panel Propriétaire',
  all4Games: 'Les 6 Jeux',

  ownerEditBannerTitle: 'Mode Édition de l’Accueil',
  ownerEditBannerDesc: 'Modifiez titre, boutons visibles, favoris et options par défaut ci-dessous.',
  saveStartPanelBtn: 'Enregistrer (Serveur & Cloud)',
  savingBtn: 'Enregistrement...',
  openFullOwnerModalBtn: 'Panel Complet (Tarifs & PIN)',
  editAppTitleLabel: 'Titre de l’app :',
  editAppSubtitleLabel: 'Sous-titre :',
  editModulesLabel: 'Modules visibles :',
  showLiveDrumToggle: 'Boulier en direct sur l’accueil',
  setAsFavorite1: 'Définir Favori #1',
  isFavorite1: 'Favori #1 ✓',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  savedDefaultsSuccess: 'Configuration enregistrée !',

  sec1Title: '1. Catégorie & Contenu :',
  sec1Sub: 'Inclut Injoy Together & Sous-catégories',
  favorite1Tag: '⭐ [Favori #1]',
  activeCategoryBadge: 'Catégorie Active',
  musicSongActive: '🎵 Chant & Musique actif',
  categories: {
    classic_joy: {
      label: 'Injoy Together (Jeu Social Classique)',
      subcategory: 'Jeu à 75 boules & moments de joie',
      description: 'Le format original associant tirage (1–75) et échanges chaleureux.',
    },
    ril: {
      label: 'RIL – Sport, Chant & Musique',
      subcategory: 'Chants, quiz musical & esprit d’équipe',
      description: 'Bingo sportif et associatif avec questions musicales et fous rires.',
    },
    heartfelt: {
      label: 'Chaleur & Proximité',
      subcategory: 'Souvenirs précieux, empathie & partage',
      description: 'Retrouvez vos proches autour d’histoires touchantes.',
    },
    laughter: {
      label: 'Rires, Humour & Sourires',
      subcategory: 'Moments ludiques & bonne humeur',
      description: 'Anecdotes amusantes garantissant une ambiance joyeuse.',
    },
    kindness: {
      label: 'Bienveillance & Entraide',
      subcategory: 'Petits gestes quotidiens & générosité',
      description: 'Célébrez les belles attentions du quotidien.',
    },
    gratitude: {
      label: 'Sagesse & Gratitude',
      subcategory: 'Expérience de vie & sérénité',
      description: 'Réflexions inspirantes et gratitude partagée.',
    },
    family_kids: {
      label: 'Famille & Enfants (Avec animateur)',
      subcategory: 'Défis ludiques, chansons & high-fives',
      description: 'Bingo familial sûr et joyeux pour petits et grands.',
    },
  },

  sec2Title: '2. Mode de jeu :',
  modeAllTitle: 'Tout-en-un',
  modeAllDesc: 'Boulier + Grilles ensemble',
  modeBoardTitle: 'Grilles Seules',
  modeBoardDesc: 'Pour joueurs',
  modeCallerTitle: 'Animateur / Boulier',
  modeCallerDesc: 'Pour tirage',
  modePassTitle: 'Soirée Jeux',
  modePassDesc: '2–8 sur l’écran',

  sec3Title: '3. Format des grilles :',
  fmtBothShort: 'Numéros + Mots',
  fmtNumbersShort: 'Numéros seuls',
  fmtPromptsShort: 'Mots seuls',
  fmtBothLabel: 'Numéros + Mots (Combiné)',
  fmtNumbersLabel: 'Numéros Seuls (1–75)',
  fmtPromptsLabel: 'Mots & Thèmes Seuls',

  sec4Title: '4. Nombre de joueurs & Noms :',
  playerSingular: 'joueur',
  playerPlural: 'joueurs',
  setCountLabel: 'Nombre :',
  soloLabel: '1 Solo',
  pcsSuffix: 'pers.',
  playerPlaceholder: 'Nom du joueur',
  removePlayer: 'Retirer',
  addOnePlayer: 'Ajouter un joueur',
  useScheduleNames: 'Utiliser noms du planning',

  cardsPerPlayerLabel: 'Grilles par joueur :',
  screenLabel: 'Écran :',
  screenMobile: '📱 Mobile',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Grand Écran',

  remoteTitle: 'Jouer Ensemble à Distance (Code)',
  remoteBadge: 'Bingo à Distance',
  remoteDesc: 'Un code vous a été partagé ? Rejoignez gratuitement depuis votre mobile !',
  remoteBtn: 'Bingo à Distance',
  joinQuizBtn: 'Rejoindre le Quiz',

  activeRoomCodeTitle: 'Votre code de salle actif pour l’événement :',
  openEverywhereBadge: '✓ Ouvert partout',
  openForMobileTvBadge: '✓ Ouvert Mobile & TV',
  activatingBadge: '⏳ Activation...',
  roomCodeOpenInfo: 'Le code est ouvert à tous les téléphones et TV participants.',
  copyCodeBtn: '📋 Copier le code',
  copiedBtn: '✓ Copié',
  copyInviteLinkBtn: '🔗 Lien participant',
  copiedLinkBtn: '✓ Lien copié',
  reactivateCodeBtn: 'Réactiver',

  resume5MinTrial: 'Continuer l’essai 10 min',
  startPrefix: 'Démarrer',
  all4FormatsBtn: 'Tous les Formats (Bingo, QUIZ & Memory)',
  helperLockedTitle: 'Connexion & Paiement Obligatoires :',
  helperLockedDesc: 'Connectez-vous ci-dessus ou testez tous les jeux gratuitement 10 min.',
  helperUnpaidEnd: 'Finalisez le paiement pour débloquer les 6 jeux.',
  helperActivePrefix: '✓ Connecté en tant que',
  helperRemainingSuffix: 'restantes (déconnexion auto à 00:00:00)',

  kahootJoinTitle: 'Vous avez un code ou un lien ? (Mode Kahoot)',
  kahootJoinBadge: 'Gratuit pour tous âges',
  kahootJoinDesc: 'Enfants, familles et invités rejoignent sans compte ni paiement :',
  kahootCodePlaceholder: 'Entrez le code (ex. 4821)',
  kahootJoinQuizBtn: 'Rejoindre Quiz',
  kahootJoinBingoBtn: 'Bingo Social',
  kahootSafetyBadges: 'Tout public · Aucune donnée enfant · Sans jeu d’argent',
  privacyBtn: 'Confidentialité & Sécurité Enfant',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together (sans argent réel)',
  footerShortcut: 'Espace / Entrée pour démarrer',
  footerOptimized: 'Une seule adresse pour tous appareils',
};

const AR_TEXTS: TitleScreenTexts = {
  unlimitedOwner: 'غير محدود (المالك)',
  unlimitedOwnerTitle: 'للمالك وقت لعب غير محدود — انقر لفتح لوحة المالك',
  expiredLabel: 'منتهي',
  iosApp: 'تطبيق iOS',
  participants: 'المشاركون',
  broadcast: 'البث',
  remoteBingo: 'بينغو عن بُعد',
  bigScreen: 'الشاشة الكبيرة',
  quizAndMemory: 'Quiz و Memory',
  quizAndMemoryTitle: 'اختر مسابقة أو لعبة الذاكرة',
  screenMobileShort: 'جوال',
  screenDesktopShort: 'كمبيوتر',
  screenBigScreenShort: 'تلفاز / بروجكتر',
  toolsBtn: 'الأدوات',
  toolsBtnTitle: 'الأدوات، المشاركون، الجدول والإعدادات',
  quizLabel: 'QUIZ',
  quizTitle: 'الخيار 3: مسابقة الثقافة والموسيقى',
  familyQuizLabel: 'مسابقة العائلة',
  familyQuizTitle: 'الخيار 4: مسابقة العائلة والأطفال',
  christmasQuizLabel: 'مسابقة الميلاد',
  christmasQuizTitle: 'الخيار 5: مسابقة الأعياد والألغاز',
  seniorQuizLabel: 'Senior Grenland Quiz',
  seniorQuizTitle: 'الخيار 7: مسابقة كبار السن والموسيقى والتاريخ',
  memoryLabel: 'Memory',
  memoryTitle: 'الخيار 6: لعبة الذاكرة (30 بطاقة / 15 زوجًا)',
  mixer: 'لوحة التحكم',
  quests: 'المهام',
  schedule: 'الجدول اليومي',
  report: 'إبلاغ',
  ownerPanel: 'لوحة المالك',
  editStartPanel: 'تعديل لوحة البداية',
  doneEditing: 'إنهاء التعديل',
  printCards: 'طباعة البطاقات',
  soundOn: 'تشغيل الصوت',
  soundOff: 'كتم الصوت',

  timeWarningTitlePrefix: 'تنبيه الوقت: تبقى',
  timeWarningTitleSuffix: 'فقط من وقت اللعب!',
  timeWarningDesc: 'يتم تسجيل الخروج تلقائيًا عند 00:00:00. مدّد الوقت عبر البطاقة أو Apple Pay.',
  extendPlaytime: 'تمديد وقت اللعب ➔',

  heroBadge: 'الفرح الاجتماعي والعائلي',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — مسابقات، ترفيه عائلي ولعبة الذاكرة لجميع الأعمار',

  drumTitle: 'وعاء السحب المباشر واللعب الاجتماعي',
  drumBadge: 'الوعاء نشط',
  drumDescPaid: 'حزمة الفعالية نشطة — أدر الكرات أو تنقّل بحرية بين جميع الألعاب!',
  drumDescTrial: 'التجربة المجانية لمدة 10 دقائق مفتوحة لجميع الألعاب — جرّب الآن!',
  drumDescGuest: 'معاينة وعاء السحب — جرّب جميع الألعاب مجانًا لمدة 10 دقائق أو سجّل دخولك!',
  try5MinFree: 'جرّب 10 دقائق مجانًا (جميع الألعاب)',
  choose4Games: 'اختر من بين جميع الألعاب',
  drumHint: 'جرّب الوعاء أو اسحب الكرات لتجربة الحركة والصوت.',
  drumMeta: '75 كرة (B-I-N-G-O) · حركة سلسة 60fps',

  lockBannerTitle: 'للمنظمين: تسجيل الدخول وتصريح الفعالية',
  lockBadge: 'المنظم',
  lockBannerDesc: 'يسجّل المنظم الدخول ويدفع لإنشاء الرمز. ينضم الأطفال والضيوف مجانًا بالرمز دون حساب!',
  loginAndPayBtn: 'المنظم: دخول ودفع ➔',

  payBannerTitle: 'المنظم: اختر مدة اللعب للبدء',
  payMethodBadge: 'بطاقة، Apple Pay و GPay',
  payLoggedInAs: 'المنظم المسجل:',
  payRoleHost: 'المنظم',
  payRolePlayer: 'المنظم',
  payBannerTextAfterRole: 'ادفع بأمان عبر Visa أو Mastercard أو Apple Pay أو Google Pay.',
  chooseAndPayBtn: 'اختر وادفع وقت اللعب ➔',

  trialBannerTitle: '10 دقائق تجربة مجانية لجميع الألعاب!',
  trialBannerDesc: 'جرّب جميع الألعاب مجانًا لمدة 10 دقائق: الشاشة الكبيرة، البينغو عن بُعد، بينغو الموسيقى، المسابقات والذاكرة!',
  resumeTrialBtn: '▶ متابعة التجربة',
  buyFullTimeBtn: '💳 شراء وقت كامل ➔',

  ownerModeActiveTitle: 'وضع المالك نشط — وصول غير محدود!',
  paidPackageActiveTitle: 'باقة الفعالية نشطة ومدفوعة!',
  ownerInfiniteBadge: '∞ المالك',
  freeFlowBadge: 'تنقل حر',
  activePlaytimeLabel: 'الوقت النشط:',
  paidPackageDescSuffix: 'يمكنك التنقل بحرية بين جميع الألعاب دون دفع إضافي!',
  openOwnerPanel: 'فتح لوحة المالك',
  all4Games: 'جميع الألعاب الستة',

  ownerEditBannerTitle: 'وضع تعديل صفحة البداية',
  ownerEditBannerDesc: 'عدّل العنوان والأزرار والترتيب أدناه ثم احفظ.',
  saveStartPanelBtn: 'حفظ الإعدادات',
  savingBtn: 'جاري الحفظ...',
  openFullOwnerModalBtn: 'لوحة المالك الكاملة',
  editAppTitleLabel: 'عنوان التطبيق:',
  editAppSubtitleLabel: 'العنوان الفرعي:',
  editModulesLabel: 'الأقسام الظاهرة:',
  showLiveDrumToggle: 'وعاء السحب في البداية',
  setAsFavorite1: 'تعيين كمفضل #1',
  isFavorite1: 'المفضل #1 ✓',
  moveUp: 'أعلى',
  moveDown: 'أسفل',
  savedDefaultsSuccess: 'تم حفظ الإعدادات بنجاح!',

  sec1Title: '1. الفئة والمحتوى:',
  sec1Sub: 'يتضمن Injoy Together والفئات الفرعية',
  favorite1Tag: '⭐ [المفضل #1]',
  activeCategoryBadge: 'الفئة النشطة',
  musicSongActive: '🎵 الغناء والموسيقى نشط',
  categories: {
    classic_joy: {
      label: 'Injoy Together (اللعبة الاجتماعية الكلاسيكية)',
      subcategory: 'لعبة 75 كرة وشرارات يومية دافئة',
      description: 'النسخة الأصلية التي تجمع بين الأرقام (1–75) والأحاديث الدافئة.',
    },
    ril: {
      label: 'RIL – الرياضة والأغاني والموسيقى',
      subcategory: 'غناء جماعي، مسابقات موسيقية وروح الفريق',
      description: 'بينغو رياضي وثقافي مع أسئلة موسيقية ممتعة.',
    },
    heartfelt: {
      label: 'الدفء والقرب',
      subcategory: 'قصص دافئة وتعاطف جماعي',
      description: 'تواصل مع اللاعبين عبر الذكريات الجميلة.',
    },
    laughter: {
      label: 'الضحك والمرح والابتسامة',
      subcategory: 'مواقف مضحكة ولحظات مرحة',
      description: 'قصص مسلية تملأ الغرفة بالضحك.',
    },
    kindness: {
      label: 'اللطف والرعاية',
      subcategory: 'المساعدة اليومية والكرم',
      description: 'التركيز على الأفعال الطيبة الصغيرة التي تضيء يومنا.',
    },
    gratitude: {
      label: 'الحكمة والامتنان',
      subcategory: 'تجارب الحياة والتأمل الهادئ',
      description: 'تأملات عميقة وامتنان وتجارب ملهمة.',
    },
    family_kids: {
      label: 'العائلة والأطفال (مع المنظم)',
      subcategory: 'مهام مرحة وأصوات وأغانٍ',
      description: 'بينغو عائلي ممتع وآمن للأطفال والكبار معًا.',
    },
  },

  sec2Title: '2. وضع اللعب:',
  modeAllTitle: 'شامل',
  modeAllDesc: 'الوعاء + البطاقات معًا',
  modeBoardTitle: 'البطاقات فقط',
  modeBoardDesc: 'للاعبين',
  modeCallerTitle: 'المنظم / السحب',
  modeCallerDesc: 'للمنادي',
  modePassTitle: 'سهرة ألعاب',
  modePassDesc: '2–8 حول الشاشة',

  sec3Title: '3. تنسيق البطاقة:',
  fmtBothShort: 'أرقام + كلمات',
  fmtNumbersShort: 'أرقام فقط',
  fmtPromptsShort: 'كلمات فقط',
  fmtBothLabel: 'أرقام + كلمات (مدمج)',
  fmtNumbersLabel: 'أرقام فقط (1–75)',
  fmtPromptsLabel: 'كلمات وشرارات فقط',

  sec4Title: '4. عدد اللاعبين والأسماء:',
  playerSingular: 'لاعب',
  playerPlural: 'لاعبين',
  setCountLabel: 'تحديد العدد:',
  soloLabel: '1 فردي',
  pcsSuffix: 'أشخاص',
  playerPlaceholder: 'أدخل اسم اللاعب',
  removePlayer: 'إزالة لاعب',
  addOnePlayer: 'إضافة لاعب',
  useScheduleNames: 'استخدام أسماء الجدول',

  cardsPerPlayerLabel: 'بطاقات لكل لاعب:',
  screenLabel: 'الشاشة:',
  screenMobile: '📱 جوال',
  screenDesktop: '💻 كمبيوتر',
  screenBigScreen: '📺 شاشة كبيرة',

  remoteTitle: 'العبوا معًا عن بُعد (رمز الغرفة)',
  remoteBadge: 'بينغو عن بُعد',
  remoteDesc: 'هل شارك المنظم رمز غرفة؟ انضم مجانًا من جوالك!',
  remoteBtn: 'بينغو عن بُعد',
  joinQuizBtn: 'انضم إلى QUIZ',

  activeRoomCodeTitle: 'رمز المشاركة النشط للفعالية:',
  openEverywhereBadge: '✓ مفتوح في كل مكان',
  openForMobileTvBadge: '✓ مفتوح للجوال والتلفاز',
  activatingBadge: '⏳ جاري التفعيل...',
  roomCodeOpenInfo: 'الرمز مفتوح لجميع الهواتف وشاشات التلفاز في الفعالية.',
  copyCodeBtn: '📋 نسخ الرمز',
  copiedBtn: '✓ تم النسخ',
  copyInviteLinkBtn: '🔗 رابط المشاركة',
  copiedLinkBtn: '✓ تم نسخ الرابط',
  reactivateCodeBtn: 'إعادة التفعيل',

  resume5MinTrial: 'متابعة تجربة 10 دقائق',
  startPrefix: 'ابدأ',
  all4FormatsBtn: 'جميع الألعاب (بينغو و QUIZ و Memory)',
  helperLockedTitle: 'تسجيل الدخول والدفع إلزاميان:',
  helperLockedDesc: 'سجّل الدخول أعلاه أو جرّب جميع الألعاب مجانًا لمدة 10 دقائق.',
  helperUnpaidEnd: 'أكمل الدفع أعلاه لفتح جميع الألعاب الستة.',
  helperActivePrefix: '✓ تم تسجيل الدخول باسم',
  helperRemainingSuffix: 'متبقية (خروج تلقائي عند 00:00:00)',

  kahootJoinTitle: 'هل لديك رمز أو رابط من المنظم؟',
  kahootJoinBadge: 'مجاني لجميع الأعمار',
  kahootJoinDesc: 'ينضم الأطفال والعائلة والضيوف بدون حساب أو دفع. أدخل الرمز:',
  kahootCodePlaceholder: 'أدخل الرمز (مثل 4821)',
  kahootJoinQuizBtn: 'انضم للمسابقة',
  kahootJoinBingoBtn: 'بينغو اجتماعي',
  kahootSafetyBadges: 'مفتوح للجميع · لا بيانات للأطفال · بدون مقامرة',
  privacyBtn: 'الخصوصية وسلامة الأطفال',

  footerCopy: '© Human-connection · Enjoy Bingo · Enjoy Together',
  footerShortcut: 'Space / Enter للبدء',
  footerOptimized: 'رابط واحد لجميع الأجهزة',
};

export const TITLE_SCREEN_TRANSLATIONS: Record<SupportedLanguage, TitleScreenTexts> = {
  nb: NB_TEXTS,
  en: EN_TEXTS,
  ti: TI_TEXTS,
  sv: SV_TEXTS,
  de: DE_TEXTS,
  es: ES_TEXTS,
  fr: FR_TEXTS,
  ar: AR_TEXTS,
};

export function getTitleScreenTexts(lang: SupportedLanguage): TitleScreenTexts {
  return TITLE_SCREEN_TRANSLATIONS[lang] || NB_TEXTS;
}
