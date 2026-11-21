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
  quizLabel: string;
  quizTitle: string;
  familyQuizLabel: string;
  familyQuizTitle: string;
  christmasQuizLabel: string;
  christmasQuizTitle: string;
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
  quizLabel: 'QUIZ',
  quizTitle: 'Valg 3: Kultur-, Musikk- & Fanquiz (QUIZ)',
  familyQuizLabel: 'Familiequiz',
  familyQuizTitle: 'Valg 4: Familie- & Barnequiz (Kultur, Musikk & Ordlek)',
  christmasQuizLabel: 'JuleQuiz',
  christmasQuizTitle: 'Valg 5: JuleQuiz (300 spørsmål i tilfeldig rekkefølge + 80 Mimelek)',
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
  drumDescTrial: '5 minutters gratis prøvespill er åpent — test spillet nå eller betal som arrangør for alle 6 spill & koblingskode!',
  drumDescGuest: 'Forhåndsvisning av 60fps trekningstrommel — prøv 5 min gratis eller logg inn som arrangør!',
  try5MinFree: 'Prøv 5 min gratis',
  choose4Games: 'Velg mellom alle 6 spill',
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

  trialBannerTitle: '5 Minutter Gratis Prøvespill er Åpen!',
  trialBannerDesc: 'Test Bingo-opplevelsen gratis i 5 min. Betal spilletidspakke for å få koblingskode til Avstandsbingo, QUIZ, Familiequiz, JuleQuiz og Memory!',
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

  resume5MinTrial: 'Fortsett 5-min prøvespill',
  startPrefix: 'Start',
  all4FormatsBtn: 'Alle 6 Spillformater (Bingo, Quiz & Memory)',
  helperLockedTitle: 'Obligatorisk innlogging & betaling:',
  helperLockedDesc: 'Logg inn og betal spilletid i feltet over (eller prøv 5 min gratis ved live-trommelen). Automatisk utlogging skjer når pakketiden utløper.',
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
  quizLabel: 'QUIZ',
  quizTitle: 'Option 3: Culture, Music & Fan QUIZ',
  familyQuizLabel: 'Family Quiz',
  familyQuizTitle: 'Option 4: Family & Kids Quiz (Culture, Music & Wordplay)',
  christmasQuizLabel: 'Christmas Quiz',
  christmasQuizTitle: 'Option 5: Christmas Quiz (300 Questions in Random Order + 80 Mime Words)',
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
  drumDescTrial: '5-minute free trial is open — test the game now or pay as organizer for all 6 games & room code!',
  drumDescGuest: 'Preview of 60fps ball tumbler — try 5 min free or sign in as organizer!',
  try5MinFree: 'Try 5 min free',
  choose4Games: 'Choose among all 6 games',
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

  trialBannerTitle: '5-Minute Free Trial Is Open!',
  trialBannerDesc: 'Try the Bingo experience free for 5 minutes. Purchase a playtime pass to unlock room codes for Remote Bingo, QUIZ, Family Quiz & Christmas Quiz!',
  resumeTrialBtn: '▶ Resume Trial',
  buyFullTimeBtn: '💳 Buy Full Playtime ➔',

  ownerModeActiveTitle: 'Owner Mode Active — Unlimited Access!',
  paidPackageActiveTitle: 'Event Pass Active & Paid!',
  ownerInfiniteBadge: '∞ Owner',
  freeFlowBadge: 'Free Switch',
  activePlaytimeLabel: 'Active playtime:',
  paidPackageDescSuffix: 'You can switch freely between Big Screen Bingo, Remote Bingo, QUIZ, Family Quiz and Christmas Quiz without paying again!',
  openOwnerPanel: 'Open Owner Panel',
  all4Games: 'All 5 Games',

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

  resume5MinTrial: 'Continue 5-min trial',
  startPrefix: 'Start',
  all4FormatsBtn: 'All 6 Game Formats (Bingo, QUIZ & Memory)',
  helperLockedTitle: 'Mandatory Sign In & Payment:',
  helperLockedDesc: 'Sign in and pay playtime in the box above (or try 5 min free on the live drum). Auto-logout occurs when your package expires.',
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
  quizLabel: 'QUIZ',
  quizTitle: 'ምርጫ 3፡ ባህሊ፣ ሙዚቃን QUIZን',
  familyQuizLabel: 'ናይ ስድራ QUIZ',
  familyQuizTitle: 'ምርጫ 4፡ ናይ ስድራቤትን ቆልዑን QUIZ',
  christmasQuizLabel: 'ናይ ልደት QUIZ',
  christmasQuizTitle: 'ምርጫ 5፡ ናይ ልደት QUIZ (ደርፊ ልደት፣ ባህልን ሕንቅልሕንቅሊተይን)',
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
  drumDescTrial: 'ናይ 5 ደቒቕ ነጻ ፈተነ ክፉት እዩ — ሕጂ ቢንጎ ፈትን ወይ ንኩሎም 5 ጸወታታትን ኮድን ክፈል!',
  drumDescGuest: 'ናይ 60fps ኵዕሶ ከበሮ ቅድመ-ምርኢት — 5 ደቒቕ ብነጻ ፈትን ወይ ንምሉእ ኣገልግሎት እቶን ክፈልን!',
  try5MinFree: '5 ደቒቕ ብነጻ ፈትን',
  choose4Games: 'ካብ ኩሎም 5 ጸወታታት ምረጽ',
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

  trialBannerTitle: 'ናይ 5 ደቒቕ ነጻ ፈተነ ክፉት እዩ!',
  trialBannerDesc: 'ን 5 ደቒቕ ቢንጎ ብነጻ ፈትን። ንርሑቕ ቢንጎ፣ QUIZ፣ ናይ ስድራቤትን ናይ ልደትን QUIZ መተኣሳሰሪ ኮድ ንምርካብ ፓኬጅ ግዛእ!',
  resumeTrialBtn: '▶ ፈተነ ቀጽል',
  buyFullTimeBtn: '💳 ምሉእ ግዜ ጸወታ ግዛእ ➔',

  ownerModeActiveTitle: 'ናይ ዋና ኩነት ንጡፍ — ደረት ዘይብሉ ኣገልግሎት!',
  paidPackageActiveTitle: 'ናይ ምድላው ፓኬጅ ንጡፍን ተኸፊሉን!',
  ownerInfiniteBadge: '∞ ዋና',
  freeFlowBadge: 'ናጻ ምስግጋር',
  activePlaytimeLabel: 'ንጡፍ ግዜ ጸወታ:',
  paidPackageDescSuffix: 'ብዘይ ተወሳኺ ክፍሊት ኣብ መንጎ ዓቢ ስክሪን ቢንጎ፣ ናይ ርሑቕ ቢንጎ፣ QUIZ፣ ናይ ስድራ QUIZን ናይ ልደት QUIZን ብናጻ ክትመላለስ ትኽእል!',
  openOwnerPanel: 'ናይ ዋና ፓነል ክፈት',
  all4Games: 'ኩሎም 5 ጸወታታት',

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

  resume5MinTrial: 'ናይ 5 ደቒቕ ፈተነ ቀጽል',
  startPrefix: 'ጀምር',
  all4FormatsBtn: 'ኩሎም 5 ቅድታት ጸወታ (ቢንጎን QUIZን)',
  helperLockedTitle: 'ግዴታዊ መእተውን ክፍሊትን:',
  helperLockedDesc: 'ኣብ ላዕለዋይ ሳጹን እቶን ክፈልን (ወይ ኣብ ቀጥታዊ ከበሮ 5 ደቒቕ ብነጻ ፈትን)። ግዜ ፓኬጅ ምስ ተወድአ ብባዕሉ ይወጽእ።',
  helperUnpaidEnd: 'ኩሎም 5 ቅድታት ጸወታ ንምኽፋት ኣብ «ንምጅማር ግዴታዊ ክፍሊት» ክፍሊት ወድእ።',
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
  ...NB_TEXTS,
  unlimitedOwner: 'Obegränsad (Ägare)',
  iosApp: 'iOS App',
  participants: 'Deltagare',
  broadcast: 'Sändning',
  remoteBingo: 'Distansbingo',
  bigScreen: 'Storbild',
  familyQuizLabel: 'Familjequiz',
  christmasQuizLabel: 'JulQuiz',
  christmasQuizTitle: 'Val 5: JulQuiz (Julmusik, Traditioner, Julfilmer & Gåtor)',
  mixer: 'Mixer',
  quests: 'Uppdrag',
  schedule: 'Dagsplan',
  report: 'Rapportera',
  ownerPanel: 'Ägarpanel',
  editStartPanel: 'Redigera startpanel',
  doneEditing: 'Klar med redigering',
  try5MinFree: 'Prova 5 min gratis',
  choose4Games: 'Välj bland alla 5 spel',
  lockBannerTitle: 'Obligatorisk Inloggning & Betalning',
  loginAndPayBtn: 'Logga in & Betala ➔',
  sec2Title: '2. Spelläge:',
  sec3Title: '3. Kortformat på brickan:',
  sec4Title: '4. Antal spelare & Namn:',
  cardsPerPlayerLabel: 'Brickor per spelare:',
  screenLabel: 'Skärm:',
  joinQuizBtn: 'Gå med i Quiz',
  all4FormatsBtn: 'Alla 5 Spelformat (Bingo & QUIZ)',
};

const DE_TEXTS: TitleScreenTexts = {
  ...EN_TEXTS,
  unlimitedOwner: 'Unbegrenzt (Eigentümer)',
  expiredLabel: 'Abgelaufen',
  participants: 'Teilnehmer',
  broadcast: 'Übertragung',
  remoteBingo: 'Fern-Bingo',
  bigScreen: 'Großbild',
  familyQuizLabel: 'Familienquiz',
  christmasQuizLabel: 'Weihnachtsquiz',
  christmasQuizTitle: 'Option 5: Weihnachtsquiz (Musik, Traditionen & Filme)',
  quests: 'Quests',
  schedule: 'Tagesplan',
  report: 'Melden',
  ownerPanel: 'Eigentümer-Panel',
  editStartPanel: 'Startseite bearbeiten',
  doneEditing: 'Bearbeitung beenden',
  printCards: 'Karten drucken',
  heroBadge: 'Soziale Freude',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Verbundenheit, Quiz, Memory & Teamgeist für Vereine & Familie',
  try5MinFree: '5 Min kostenlos testen',
  choose4Games: 'Alle 5 Spiele wählen',
  lockBannerTitle: 'Pflichtanmeldung & Zahlung',
  lockBadge: 'Gesperrt',
  loginAndPayBtn: 'Anmelden & Bezahlen ➔',
  chooseAndPayBtn: 'Spielzeit wählen & bezahlen ➔',
  sec2Title: '2. Spielmodus:',
  sec3Title: '3. Kartenformat:',
  sec4Title: '4. Spieleranzahl & Namen:',
  cardsPerPlayerLabel: 'Karten pro Spieler:',
  screenLabel: 'Bildschirm:',
  screenMobile: '📱 Mobil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Großbild',
  joinQuizBtn: 'Quiz beitreten',
  startPrefix: 'Starten',
  all4FormatsBtn: 'Alle 5 Spielformate (Bingo & QUIZ)',
};

const ES_TEXTS: TitleScreenTexts = {
  ...EN_TEXTS,
  unlimitedOwner: 'Ilimitado (Propietario)',
  expiredLabel: 'Expirado',
  participants: 'Participantes',
  broadcast: 'Transmisión',
  remoteBingo: 'Bingo Remoto',
  bigScreen: 'Pantalla Grande',
  familyQuizLabel: 'Quiz Familiar',
  christmasQuizLabel: 'Quiz de Navidad',
  christmasQuizTitle: 'Opción 5: Quiz de Navidad (Música, Tradiciones y Películas)',
  mixer: 'Mezclador',
  quests: 'Misiones',
  schedule: 'Horario',
  report: 'Reportar',
  ownerPanel: 'Panel Propietario',
  editStartPanel: 'Editar Inicio',
  doneEditing: 'Finalizar Edición',
  printCards: 'Imprimir Cartones',
  heroBadge: 'Bienestar Social',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Conexión, música, equipo y alegría para asociaciones y amigos',
  try5MinFree: 'Prueba 5 min gratis',
  choose4Games: 'Elegir entre los 5 juegos',
  lockBannerTitle: 'Inicio de Sesión y Pago Obligatorios',
  lockBadge: 'Bloqueado',
  loginAndPayBtn: 'Iniciar Sesión y Pagar ➔',
  chooseAndPayBtn: 'Elegir y Pagar Tiempo ➔',
  sec2Title: '2. Modo de Juego:',
  sec3Title: '3. Formato del Cartón:',
  sec4Title: '4. Número de Jugadores y Nombres:',
  cardsPerPlayerLabel: 'Cartones por jugador:',
  screenLabel: 'Pantalla:',
  screenMobile: '📱 Móvil',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Pantalla Grande',
  joinQuizBtn: 'Unirse al Quiz',
  startPrefix: 'Iniciar',
  all4FormatsBtn: 'Los 5 Formatos (Bingo y QUIZ)',
};

const FR_TEXTS: TitleScreenTexts = {
  ...EN_TEXTS,
  unlimitedOwner: 'Illimité (Propriétaire)',
  expiredLabel: 'Expiré',
  participants: 'Participants',
  broadcast: 'Diffusion',
  remoteBingo: 'Bingo à Distance',
  bigScreen: 'Grand Écran',
  familyQuizLabel: 'Quiz Famille',
  christmasQuizLabel: 'Quiz de Noël',
  christmasQuizTitle: 'Option 5 : Quiz de Noël (Chansons, Traditions & Films)',
  mixer: 'Mixeur',
  quests: 'Quêtes',
  schedule: 'Planning',
  report: 'Signaler',
  ownerPanel: 'Panel Propriétaire',
  editStartPanel: 'Modifier l’accueil',
  doneEditing: 'Terminer',
  printCards: 'Imprimer les grilles',
  heroBadge: 'Joie Sociale',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — Liens, chansons, mémoire et convivialité pour clubs et amis',
  try5MinFree: 'Essai gratuit 5 min',
  choose4Games: 'Choisir parmi les 5 jeux',
  lockBannerTitle: 'Connexion & Paiement Obligatoires',
  lockBadge: 'Verrouillé',
  loginAndPayBtn: 'Se connecter & Payer ➔',
  chooseAndPayBtn: 'Choisir & Payer le temps ➔',
  sec2Title: '2. Mode de jeu :',
  sec3Title: '3. Format des grilles :',
  sec4Title: '4. Joueurs & Noms :',
  cardsPerPlayerLabel: 'Grilles par joueur :',
  screenLabel: 'Écran :',
  screenMobile: '📱 Mobile',
  screenDesktop: '💻 PC',
  screenBigScreen: '📺 Grand Écran',
  joinQuizBtn: 'Rejoindre le Quiz',
  startPrefix: 'Démarrer',
  all4FormatsBtn: 'Les 5 Formats (Bingo & QUIZ)',
};

const AR_TEXTS: TitleScreenTexts = {
  ...EN_TEXTS,
  unlimitedOwner: 'غير محدود (المالك)',
  expiredLabel: 'منتهي',
  participants: 'المشاركون',
  broadcast: 'البث',
  remoteBingo: 'بينغو عن بُعد',
  bigScreen: 'الشاشة الكبيرة',
  familyQuizLabel: 'مسابقة العائلة',
  christmasQuizLabel: 'مسابقة الميلاد',
  christmasQuizTitle: 'الخيار 5: مسابقة عيد الميلاد',
  mixer: 'لوحة التحكم',
  quests: 'المهام',
  schedule: 'الجدول اليومي',
  report: 'إبلاغ',
  ownerPanel: 'لوحة المالك',
  editStartPanel: 'تعديل لوحة البداية',
  doneEditing: 'إنهاء التعديل',
  printCards: 'طباعة البطاقات',
  heroBadge: 'الفرح الاجتماعي',
  heroSubtitle: 'Enjoy Bingo · Enjoy Together — التواصل واللعب الجماعي وروح الفريق للعائلة والأصدقاء',
  try5MinFree: 'جرّب 5 دقائق مجانًا',
  choose4Games: 'اختر من بين الألعاب الخمس',
  lockBannerTitle: 'تسجيل الدخول والدفع إلزاميان',
  lockBadge: 'مقفل',
  loginAndPayBtn: 'تسجيل الدخول والدفع ➔',
  chooseAndPayBtn: 'اختر وادفع وقت اللعب ➔',
  sec2Title: '2. وضع اللعب:',
  sec3Title: '3. تنسيق البطاقة:',
  sec4Title: '4. عدد اللاعبين والأسماء:',
  cardsPerPlayerLabel: 'بطاقات لكل لاعب:',
  screenLabel: 'الشاشة:',
  screenMobile: '📱 جوال',
  screenDesktop: '💻 كمبيوتر',
  screenBigScreen: '📺 شاشة كبيرة',
  joinQuizBtn: 'انضم إلى QUIZ',
  startPrefix: 'ابدأ',
  all4FormatsBtn: 'جميع الألعاب الخمس (بينغو و QUIZ)',
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
