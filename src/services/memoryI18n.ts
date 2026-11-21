/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLanguage } from './i18n';

export interface MemoryTexts {
  title: string;
  subtitleCards: string;
  subtitlePairs: string;
  subtitleMode: string;
  playtimeLabel: string;
  startBtn: string;
  showingCardsBtn: string;
  hideNowBtn: string;
  peekBtn: string;
  shuffleBtn: string;
  winnerBtn: string;
  otherGamesBtn: string;
  fullscreenBtn: string;
  exitFullscreenBtn: string;
  closeBtn: string;
  soundOn: string;
  soundOff: string;

  scoreboardTitle: string;
  scoreboardHint: string;
  addTeamBtn: string;
  turnNow: string;
  giveTurnBtn: string;
  pairsUnit: string;
  nextTeamBtn: string;
  pointsUnit: string;
  teamAriaPrefix: string;
  pointsAriaPrefix: string;
  removeTeamTitle: string;

  hostSectionTitle: string;
  prizeLabel: string;
  prizePlaceholder: string;
  categoryLabel: string;
  boardSizeLabel: string;
  matchPointsLabel: string;
  mismatchPointsLabel: string;
  keepTurnLabel: string;
  peekShortBtn: string;
  resetScoresBtn: string;

  catMixed: string;
  catAnimals: string;
  catCharacters: string;
  catThings: string;

  size30: string;
  size24: string;
  size20: string;
  size16: string;

  turnPrefix: string;
  roundLabel: string;
  pairsLabel: string;
  movesLabel: string;

  waitingTitle: string;
  waitingDescStart: string;
  waitingDescSeconds: string;
  waitingBtn: string;

  previewTitle: string;
  previewCountdownPrefix: string;
  secondSingular: string;
  secondPlural: string;
  hideEarlyBtn: string;

  prizeBannerPrefix: string;
  prizeAudienceNote: string;
  cardReadyLabel: string;
  cardTapLabel: string;
  foundByPrefix: string;

  tieTitle: string;
  leadsMemorySuffix: string;
  hostPrizeHeading: string;
  newRoundKeepBtn: string;
  newGameResetBtn: string;
  backToBoardBtn: string;

  bannerInit: string;
  bannerPreviewMid: string;
  bannerPreviewStart: string;
  bannerActiveStart: string;
  bannerActiveShort: string;
  bannerReset: string;
  bannerNewRound: string;
  bannerMatch: string;
  bannerMismatch: string;

  defaultTeams: { name: string; mascot: string; colorHex: string }[];
  prizeSuggestions: string[];
}

const NB_MEMORY: MemoryTexts = {
  title: 'Memory',
  subtitleCards: 'kort',
  subtitlePairs: 'par',
  subtitleMode: 'Lagspill med pluss- & minuspoeng',
  playtimeLabel: 'Spilletid',
  startBtn: 'Start spillet (Vis kort i 10 sek)',
  showingCardsBtn: 'Viser kort',
  hideNowBtn: 'Skjul nå',
  peekBtn: 'Vis kort i 10 sek',
  shuffleBtn: 'Bland kortene / Ny runde',
  winnerBtn: 'Kår vinner & premie',
  otherGamesBtn: 'Andre spill',
  fullscreenBtn: 'Fullskjerm',
  exitFullscreenBtn: 'Lukk fullskjerm',
  closeBtn: 'Lukk',
  soundOn: 'Slå på lyd',
  soundOff: 'Slå av lyd',

  scoreboardTitle: 'Poengviser · Lagspill',
  scoreboardHint: 'Gi pluss- (+) eller minuspoeng (-), eller skriv poeng rett i feltet.',
  addTeamBtn: '+ Lag',
  turnNow: 'TUR NÅ',
  giveTurnBtn: 'Gi tur',
  pairsUnit: 'par',
  nextTeamBtn: 'Bytt til neste lag',
  pointsUnit: 'p',
  teamAriaPrefix: 'Navn for lag',
  pointsAriaPrefix: 'Poeng for',
  removeTeamTitle: 'Fjern lag',

  hostSectionTitle: 'Arrangør · Premie & Kortoppsett',
  prizeLabel: 'Premie (arrangør bestemmer selv):',
  prizePlaceholder: 'Skriv premien for laget eller barna...',
  categoryLabel: 'Bilder / tema:',
  boardSizeLabel: 'Antall kort på brettet:',
  matchPointsLabel: 'Riktig par:',
  mismatchPointsLabel: 'Minus ved feil par:',
  keepTurnLabel: 'Behold tur ved to like',
  peekShortBtn: 'Vis kort (10s)',
  resetScoresBtn: 'Nullstill poeng',

  catMixed: 'Blandet (Dyr, Figurer & Ting)',
  catAnimals: 'Dyr',
  catCharacters: 'Figurer & Eventyr',
  catThings: 'Ting & Kjøretøy',

  size30: '30 kort (15 par · Standard)',
  size24: '24 kort (12 par)',
  size20: '20 kort (10 par)',
  size16: '16 kort (8 par · Enkel)',

  turnPrefix: 'Tur nå:',
  roundLabel: 'Runde',
  pairsLabel: 'Par',
  movesLabel: 'Trekk',

  waitingTitle: 'Arrangøren bestemmer når spillet starter!',
  waitingDescStart: 'Når du trykker Start spillet, vises alle kortene åpne i 10 sekunder så barna og lagene kan huske hvor bildene ligger.',
  waitingDescSeconds: '10 sekunder',
  waitingBtn: 'Start spillet (Vis i 10 sek)',

  previewTitle: 'Husk hvor bildene ligger!',
  previewCountdownPrefix: 'Kortene snur seg automatisk om',
  secondSingular: 'sekund',
  secondPlural: 'sekunder',
  hideEarlyBtn: 'Skjul kortene nå',

  prizeBannerPrefix: 'Premie i spillet:',
  prizeAudienceNote: 'Riktige par blir stående synlige for publikum!',
  cardReadyLabel: 'Klar',
  cardTapLabel: 'Trykk',
  foundByPrefix: 'Funnet av',

  tieTitle: 'Uavgjort – Flott laginnsats!',
  leadsMemorySuffix: 'leder Memory!',
  hostPrizeHeading: 'Arrangørens premie',
  newRoundKeepBtn: 'Ny runde (behold poeng)',
  newGameResetBtn: 'Nytt spill (0 poeng)',
  backToBoardBtn: 'Tilbake til brettet',

  bannerInit: 'Arrangør trykker «Start spillet» for å vise kortene i 10 sekunder!',
  bannerPreviewMid: 'Arrangør viser alle kort i 10 sekunder!',
  bannerPreviewStart: 'Se nøye på alle kortene! Skjules om 10 sekunder...',
  bannerActiveStart: 'starter! Finn to like bilder for poeng.',
  bannerActiveShort: 'kan trykke på to like bilder!',
  bannerReset: 'Nytt spill klart! Kortene er blandet. Arrangør trykker «Start spillet».',
  bannerNewRound: 'Ny runde klar med blandede kort! Arrangør trykker «Start spillet».',
  bannerMatch: 'fant to like',
  bannerMismatch: 'Ikke helt lik',

  defaultTeams: [
    { name: 'Lag Løvene', mascot: '🦁', colorHex: '#f59e0b' },
    { name: 'Lag Stjernene', mascot: '⭐', colorHex: '#06b6d4' },
    { name: 'Lag Panda', mascot: '🐼', colorHex: '#10b981' },
    { name: 'Lag Rakett', mascot: '🚀', colorHex: '#ec4899' },
    { name: 'Lag Regnbue', mascot: '🌈', colorHex: '#8b5cf6' },
    { name: 'Lag Sol', mascot: '☀️', colorHex: '#ef4444' },
  ],
  prizeSuggestions: [
    '🥇 Gullmedalje & diplom til vinnerlaget',
    '🍦 Iskrem eller saftpinne til laget',
    '🎁 Liten premie / klistremerke til alle barna',
    '⭐ Vinnerlaget velger neste aktivitet',
  ],
};

const EN_MEMORY: MemoryTexts = {
  title: 'Memory',
  subtitleCards: 'cards',
  subtitlePairs: 'pairs',
  subtitleMode: 'Team play with plus & minus points',
  playtimeLabel: 'Playtime',
  startBtn: 'Start Game (Show cards 10s)',
  showingCardsBtn: 'Showing cards',
  hideNowBtn: 'Hide now',
  peekBtn: 'Show cards 10s',
  shuffleBtn: 'Shuffle Cards / New Round',
  winnerBtn: 'Crown Winner & Prize',
  otherGamesBtn: 'Other Games',
  fullscreenBtn: 'Fullscreen',
  exitFullscreenBtn: 'Exit Fullscreen',
  closeBtn: 'Close',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',

  scoreboardTitle: 'Scoreboard · Team Play',
  scoreboardHint: 'Award plus (+) or minus (-) points, or type points directly.',
  addTeamBtn: '+ Team',
  turnNow: 'YOUR TURN',
  giveTurnBtn: 'Set turn',
  pairsUnit: 'pairs',
  nextTeamBtn: 'Switch to next team',
  pointsUnit: 'pts',
  teamAriaPrefix: 'Team name',
  pointsAriaPrefix: 'Points for',
  removeTeamTitle: 'Remove team',

  hostSectionTitle: 'Organizer · Prize & Card Setup',
  prizeLabel: 'Prize (organizer decides):',
  prizePlaceholder: 'Enter the prize for the team or kids...',
  categoryLabel: 'Pictures / theme:',
  boardSizeLabel: 'Cards on board:',
  matchPointsLabel: 'Matching pair:',
  mismatchPointsLabel: 'Minus on mismatch:',
  keepTurnLabel: 'Keep turn on match',
  peekShortBtn: 'Show cards (10s)',
  resetScoresBtn: 'Reset scores',

  catMixed: 'Mixed (Animals, Characters & Things)',
  catAnimals: 'Animals',
  catCharacters: 'Characters & Fantasy',
  catThings: 'Things & Vehicles',

  size30: '30 cards (15 pairs · Standard)',
  size24: '24 cards (12 pairs)',
  size20: '20 cards (10 pairs)',
  size16: '16 cards (8 pairs · Easy)',

  turnPrefix: 'Turn:',
  roundLabel: 'Round',
  pairsLabel: 'Pairs',
  movesLabel: 'Moves',

  waitingTitle: 'The organizer decides when the game starts!',
  waitingDescStart: 'When you press Start Game, all cards appear face-up for 10 seconds so kids and teams can memorize where the pictures are.',
  waitingDescSeconds: '10 seconds',
  waitingBtn: 'Start Game (Show 10s)',

  previewTitle: 'Remember where the pictures are!',
  previewCountdownPrefix: 'Cards flip back in',
  secondSingular: 'second',
  secondPlural: 'seconds',
  hideEarlyBtn: 'Hide cards now',

  prizeBannerPrefix: 'Game prize:',
  prizeAudienceNote: 'Matched pairs stay visible for the audience!',
  cardReadyLabel: 'Ready',
  cardTapLabel: 'Tap',
  foundByPrefix: 'Found by',

  tieTitle: 'Tie Game – Great Teamwork!',
  leadsMemorySuffix: 'leads Memory!',
  hostPrizeHeading: 'Organizer Prize',
  newRoundKeepBtn: 'New Round (keep scores)',
  newGameResetBtn: 'New Game (0 pts)',
  backToBoardBtn: 'Back to Board',

  bannerInit: 'Organizer clicks «Start Game» to reveal all cards for 10 seconds!',
  bannerPreviewMid: 'Organizer is showing all cards for 10 seconds!',
  bannerPreviewStart: 'Watch closely! Cards flip back in 10 seconds...',
  bannerActiveStart: 'starts! Match two identical pictures for points.',
  bannerActiveShort: 'can tap two matching pictures!',
  bannerReset: 'New game ready! Cards shuffled. Organizer presses «Start Game».',
  bannerNewRound: 'New round ready with shuffled cards! Organizer presses «Start Game».',
  bannerMatch: 'matched',
  bannerMismatch: 'Not a match',

  defaultTeams: [
    { name: 'Team Lions', mascot: '🦁', colorHex: '#f59e0b' },
    { name: 'Team Stars', mascot: '⭐', colorHex: '#06b6d4' },
    { name: 'Team Panda', mascot: '🐼', colorHex: '#10b981' },
    { name: 'Team Rocket', mascot: '🚀', colorHex: '#ec4899' },
    { name: 'Team Rainbow', mascot: '🌈', colorHex: '#8b5cf6' },
    { name: 'Team Sun', mascot: '☀️', colorHex: '#ef4444' },
  ],
  prizeSuggestions: [
    '🥇 Gold medal & certificate for winning team',
    '🍦 Ice cream or popsicle for the team',
    '🎁 Small prize / sticker for all kids',
    '⭐ Winning team picks the next activity',
  ],
};

const SV_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'kort',
  subtitlePairs: 'par',
  subtitleMode: 'Lagspel med plus- & minuspoäng',
  playtimeLabel: 'Speltid',
  startBtn: 'Starta spelet (Visa kort 10 sek)',
  showingCardsBtn: 'Visar kort',
  hideNowBtn: 'Dölj nu',
  peekBtn: 'Visa kort 10 sek',
  shuffleBtn: 'Blanda korten / Ny runda',
  winnerBtn: 'Kora vinnare & pris',
  otherGamesBtn: 'Andra spel',
  fullscreenBtn: 'Helskärm',
  exitFullscreenBtn: 'Avsluta helskärm',
  closeBtn: 'Stäng',
  scoreboardTitle: 'Poängvisare · Lagspel',
  scoreboardHint: 'Ge plus- (+) eller minuspoäng (-), eller skriv direkt i fältet.',
  addTeamBtn: '+ Lag',
  turnNow: 'TUR NU',
  giveTurnBtn: 'Ge tur',
  pairsUnit: 'par',
  nextTeamBtn: 'Byt till nästa lag',
  pointsUnit: 'p',
  hostSectionTitle: 'Arrangör · Pris & Kortval',
  prizeLabel: 'Pris (arrangören bestämmer själv):',
  prizePlaceholder: 'Skriv priset för laget eller barnen...',
  categoryLabel: 'Bilder / tema:',
  boardSizeLabel: 'Antal kort:',
  matchPointsLabel: 'Rätt par:',
  mismatchPointsLabel: 'Minus vid fel:',
  keepTurnLabel: 'Behåll tur vid två lika',
  peekShortBtn: 'Visa kort (10s)',
  resetScoresBtn: 'Nollställ poäng',
  catMixed: 'Blandat (Djur, Figurer & Saker)',
  catAnimals: 'Djur',
  catCharacters: 'Figurer & Sagor',
  catThings: 'Saker & Fordon',
  size30: '30 kort (15 par · Standard)',
  size24: '24 kort (12 par)',
  size20: '20 kort (10 par)',
  size16: '16 kort (8 par · Enkel)',
  turnPrefix: 'Tur nu:',
  roundLabel: 'Runda',
  pairsLabel: 'Par',
  movesLabel: 'Drag',
  waitingTitle: 'Arrangören bestämmer när spelet startar!',
  waitingDescStart: 'När du trycker Starta spelet visas alla kort öppna i 10 sekunder så barnen kan komma ihåg var bilderna ligger.',
  waitingBtn: 'Starta spelet (Visa 10 sek)',
  previewTitle: 'Kom ihåg var bilderna ligger!',
  previewCountdownPrefix: 'Korten vänds tillbaka om',
  secondSingular: 'sekund',
  secondPlural: 'sekunder',
  hideEarlyBtn: 'Dölj korten nu',
  prizeBannerPrefix: 'Pris i spelet:',
  prizeAudienceNote: 'Rätt gissade par förblir synliga för publiken!',
  cardReadyLabel: 'Redo',
  cardTapLabel: 'Tryck',
  tieTitle: 'Oavgjort – Bra lagarbete!',
  leadsMemorySuffix: 'leder Memory!',
  hostPrizeHeading: 'Arrangörens pris',
  newRoundKeepBtn: 'Ny runda (behåll poäng)',
  newGameResetBtn: 'Nytt spel (0 poäng)',
  backToBoardBtn: 'Tillbaka till brädet',
  defaultTeams: [
    { name: 'Lag Lejonen', mascot: '🦁', colorHex: '#f59e0b' },
    { name: 'Lag Stjärnorna', mascot: '⭐', colorHex: '#06b6d4' },
    { name: 'Lag Panda', mascot: '🐼', colorHex: '#10b981' },
    { name: 'Lag Raket', mascot: '🚀', colorHex: '#ec4899' },
    { name: 'Lag Regnbåge', mascot: '🌈', colorHex: '#8b5cf6' },
    { name: 'Lag Sol', mascot: '☀️', colorHex: '#ef4444' },
  ],
  prizeSuggestions: [
    '🥇 Guldmedalj & diplom till vinnarlaget',
    '🍦 Glass till vinnande laget',
    '🎁 Litet pris till alla barn',
    '⭐ Vinnarlaget väljer nästa lek',
  ],
};

const DE_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'Karten',
  subtitlePairs: 'Paare',
  subtitleMode: 'Teamspiel mit Plus- & Minuspunkten',
  playtimeLabel: 'Spielzeit',
  startBtn: 'Spiel starten (10 Sek. zeigen)',
  showingCardsBtn: 'Karten sichtbar',
  hideNowBtn: 'Jetzt verdecken',
  peekBtn: '10 Sek. zeigen',
  shuffleBtn: 'Karten mischen / Neue Runde',
  winnerBtn: 'Sieger & Preis zeigen',
  otherGamesBtn: 'Andere Spiele',
  fullscreenBtn: 'Vollbild',
  exitFullscreenBtn: 'Vollbild beenden',
  closeBtn: 'Schließen',
  scoreboardTitle: 'Punktestand · Teamspiel',
  scoreboardHint: 'Plus- (+) oder Minuspunkte (-) geben oder direkt eingeben.',
  addTeamBtn: '+ Team',
  turnNow: 'AM ZUG',
  giveTurnBtn: 'Zug geben',
  pairsUnit: 'Paare',
  nextTeamBtn: 'Nächstes Team',
  pointsUnit: 'Pkt',
  hostSectionTitle: 'Leiter · Preis & Karten-Setup',
  prizeLabel: 'Preis (Leiter legt fest):',
  categoryLabel: 'Bilder / Thema:',
  boardSizeLabel: 'Kartenanzahl:',
  matchPointsLabel: 'Richtiges Paar:',
  mismatchPointsLabel: 'Minus bei Fehler:',
  keepTurnLabel: 'Bei Treffer weiterspielen',
  peekShortBtn: 'Zeigen (10s)',
  resetScoresBtn: 'Punkte zurücksetzen',
  catMixed: 'Gemischt (Tiere, Figuren & Dinge)',
  catAnimals: 'Tiere',
  catCharacters: 'Figuren & Fantasie',
  catThings: 'Dinge & Fahrzeuge',
  size30: '30 Karten (15 Paare · Standard)',
  size24: '24 Karten (12 Paare)',
  size20: '20 Karten (10 Paare)',
  size16: '16 Karten (8 Paare · Einfach)',
  waitingTitle: 'Der Spielleiter startet die Runde!',
  waitingDescStart: 'Nach Start werden alle Karten 10 Sekunden lang aufgedeckt, damit sich Kinder die Bilder merken können.',
  waitingBtn: 'Spiel starten (10s zeigen)',
  previewTitle: 'Merkt euch die Bilder!',
  previewCountdownPrefix: 'Karten werden verdeckt in',
  secondSingular: 'Sekunde',
  secondPlural: 'Sekunden',
  hideEarlyBtn: 'Jetzt verdecken',
  prizeBannerPrefix: 'Preis:',
  prizeAudienceNote: 'Gefundene Paare bleiben für alle sichtbar!',
  cardReadyLabel: 'Bereit',
  cardTapLabel: 'Tippen',
  backToBoardBtn: 'Zurück zum Brett',
};

const ES_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'cartas',
  subtitlePairs: 'parejas',
  subtitleMode: 'Juego por equipos con puntos + / -',
  playtimeLabel: 'Tiempo',
  startBtn: 'Iniciar juego (Ver 10 seg)',
  shuffleBtn: 'Barajar cartas / Nueva ronda',
  winnerBtn: 'Ver ganador y premio',
  otherGamesBtn: 'Otros juegos',
  fullscreenBtn: 'Pantalla completa',
  closeBtn: 'Cerrar',
  scoreboardTitle: 'Marcador · Equipos',
  addTeamBtn: '+ Equipo',
  turnNow: 'TURNO',
  pairsUnit: 'parejas',
  nextTeamBtn: 'Siguiente equipo',
  catMixed: 'Mixto (Animales, Figuras y Cosas)',
  catAnimals: 'Animales',
  catCharacters: 'Figuras y Fantasía',
  catThings: 'Cosas y Vehículos',
  size30: '30 cartas (15 parejas · Estándar)',
  waitingTitle: '¡El organizador decide cuándo empezar!',
  waitingBtn: 'Iniciar juego (10s)',
  previewTitle: '¡Recuerda dónde están las imágenes!',
  cardReadyLabel: 'Listo',
  cardTapLabel: 'Tocar',
  backToBoardBtn: 'Volver al tablero',
};

const FR_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'cartes',
  subtitlePairs: 'paires',
  subtitleMode: 'Jeu en équipe avec points + / -',
  playtimeLabel: 'Temps',
  startBtn: 'Démarrer (Voir 10 sec)',
  shuffleBtn: 'Mélanger / Nouvelle manche',
  winnerBtn: 'Gagnant & Prix',
  otherGamesBtn: 'Autres jeux',
  fullscreenBtn: 'Plein écran',
  closeBtn: 'Fermer',
  scoreboardTitle: 'Scores · Équipes',
  addTeamBtn: '+ Équipe',
  turnNow: 'TOUR',
  pairsUnit: 'paires',
  nextTeamBtn: 'Équipe suivante',
  catMixed: 'Mixte (Animaux, Personnages & Objets)',
  catAnimals: 'Animaux',
  catCharacters: 'Personnages & Magie',
  catThings: 'Objets & Véhicules',
  size30: '30 cartes (15 paires · Standard)',
  waitingTitle: "L'organisateur lance la partie !",
  waitingBtn: 'Démarrer (10s)',
  previewTitle: 'Mémorisez les emplacements !',
  cardReadyLabel: 'Prêt',
  cardTapLabel: 'Toucher',
  backToBoardBtn: 'Retour au plateau',
};

const TI_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'ካርድታት',
  subtitlePairs: 'ጽምዲ',
  subtitleMode: 'ናይ ጋንታ ጸወታ (+ / - ነጥቢ)',
  playtimeLabel: 'ግዜ ጸወታ',
  startBtn: 'ጸወታ ጀምር (10 ካልኢት ርኣዩ)',
  shuffleBtn: 'ካርድታት ሓውስ / ሓድሽ ዙር',
  winnerBtn: 'ሰዓሪ & ሽልማት ኣርኢ',
  otherGamesBtn: 'ካልኦት ጸወታታት',
  fullscreenBtn: 'ምሉእ ስክሪን',
  closeBtn: 'ዕጾ',
  scoreboardTitle: 'ነጥቢ ጋንታታት',
  addTeamBtn: '+ ጋንታ',
  turnNow: 'ተራ ሕጂ',
  giveTurnBtn: 'ተራ ሃብ',
  pairsUnit: 'ጽምዲ',
  nextTeamBtn: 'ናብ ዝቕጽል ጋንታ',
  pointsUnit: 'ነ',
  hostSectionTitle: 'ኣዳላዊ · ሽልማት & ካርድታት',
  prizeLabel: 'ሽልማት (ኣዳላዊ ይውስን):',
  categoryLabel: 'ስእልታት / ኣርእስቲ:',
  boardSizeLabel: 'ብዝሒ ካርድታት:',
  catMixed: 'ሕውስዋስ (እንስሳታት፣ ቅርጽታት & ኣቕሑ)',
  catAnimals: 'እንስሳታት',
  catCharacters: 'ቅርጽታት & ዛንታ',
  catThings: 'ኣቕሑ & መካይን',
  size30: '30 ካርድታት (15 ጽምዲ)',
  waitingTitle: 'ኣዳላዊ መዓስ ከም ዝጅምር ይውስን!',
  waitingBtn: 'ጸወታ ጀምር (10 ካልኢት)',
  previewTitle: 'ስእልታት ኣበይ ከም ዘለዉ ዘክሩ!',
  cardReadyLabel: 'ድሉው',
  cardTapLabel: 'ጠውቕ',
  backToBoardBtn: 'ናብ ጸወታ ተመለስ',
};

const AR_MEMORY: MemoryTexts = {
  ...EN_MEMORY,
  subtitleCards: 'بطاقة',
  subtitlePairs: 'أزواج',
  subtitleMode: 'لعب جماعي مع نقاط +/-',
  playtimeLabel: 'وقت اللعب',
  startBtn: 'بدء اللعبة (عرض 10 ثوانٍ)',
  showingCardsBtn: 'عرض البطاقات',
  hideNowBtn: 'إخفاء الآن',
  peekBtn: 'عرض 10 ثوانٍ',
  shuffleBtn: 'خلط البطاقات / جولة جديدة',
  winnerBtn: 'تتويج الفائز والجائزة',
  otherGamesBtn: 'ألعاب أخرى',
  fullscreenBtn: 'ملء الشاشة',
  exitFullscreenBtn: 'إنهاء ملء الشاشة',
  closeBtn: 'إغلاق',
  scoreboardTitle: 'لوحة النقاط · الفرق',
  scoreboardHint: 'أضف (+) أو اطرح (-) نقاطًا مباشرة.',
  addTeamBtn: '+ فريق',
  turnNow: 'الدور الآن',
  giveTurnBtn: 'منح الدور',
  pairsUnit: 'أزواج',
  nextTeamBtn: 'الفريق التالي',
  pointsUnit: 'ن',
  hostSectionTitle: 'المنظم · الجائزة وإعداد البطاقات',
  prizeLabel: 'الجائزة (يحددها المنظم):',
  categoryLabel: 'الصور / الموضوع:',
  boardSizeLabel: 'عدد البطاقات:',
  catMixed: 'متنوع (حيوانات، شخصيات وأشياء)',
  catAnimals: 'حيوانات',
  catCharacters: 'شخصيات وخيال',
  catThings: 'أشياء ومركبات',
  size30: '30 بطاقة (15 زوجًا · قياسي)',
  waitingTitle: 'المنظم يحدد متى تبدأ اللعبة!',
  waitingBtn: 'بدء اللعبة (عرض 10 ثوانٍ)',
  previewTitle: 'تذكر أماكن الصور!',
  previewCountdownPrefix: 'تُقلب البطاقات بعد',
  secondSingular: 'ثانية',
  secondPlural: 'ثوانٍ',
  hideEarlyBtn: 'إخفاء الآن',
  prizeBannerPrefix: 'الجائزة:',
  cardReadyLabel: 'جاهز',
  cardTapLabel: 'اضغط',
  backToBoardBtn: 'العودة للوحة',
  defaultTeams: [
    { name: 'فريق الأسود', mascot: '🦁', colorHex: '#f59e0b' },
    { name: 'فريق النجوم', mascot: '⭐', colorHex: '#06b6d4' },
    { name: 'فريق الباندا', mascot: '🐼', colorHex: '#10b981' },
    { name: 'فريق الصاروخ', mascot: '🚀', colorHex: '#ec4899' },
    { name: 'فريق قوس قزح', mascot: '🌈', colorHex: '#8b5cf6' },
    { name: 'فريق الشمس', mascot: '☀️', colorHex: '#ef4444' },
  ],
};

const MEMORY_TEXTS_MAP: Record<SupportedLanguage, MemoryTexts> = {
  nb: NB_MEMORY,
  en: EN_MEMORY,
  ti: TI_MEMORY,
  sv: SV_MEMORY,
  de: DE_MEMORY,
  es: ES_MEMORY,
  fr: FR_MEMORY,
  ar: AR_MEMORY,
};

export function getMemoryTexts(lang: SupportedLanguage): MemoryTexts {
  return MEMORY_TEXTS_MAP[lang] || NB_MEMORY;
}

const CARD_LABELS: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  lion: { nb: 'Løve', en: 'Lion', sv: 'Lejon', de: 'Löwe', es: 'León', fr: 'Lion', ti: 'ኣንበሳ', ar: 'أسد' },
  elephant: { nb: 'Elefant', en: 'Elephant', sv: 'Elefant', de: 'Elefant', es: 'Elefante', fr: 'Éléphant', ti: 'ሓርማዝ', ar: 'فيل' },
  panda: { nb: 'Panda', en: 'Panda', sv: 'Panda', de: 'Panda', es: 'Panda', fr: 'Panda', ti: 'ፓንዳ', ar: 'باندا' },
  fox: { nb: 'Rev', en: 'Fox', sv: 'Räv', de: 'Fuchs', es: 'Zorro', fr: 'Renard', ti: 'ወኻርያ', ar: 'ثعلب' },
  penguin: { nb: 'Pingvin', en: 'Penguin', sv: 'Pingvin', de: 'Pinguin', es: 'Pingüino', fr: 'Pingouin', ti: 'ፒንግዊን', ar: 'بطريق' },
  rabbit: { nb: 'Kanin', en: 'Rabbit', sv: 'Kanin', de: 'Hase', es: 'Conejo', fr: 'Lapin', ti: 'ማንቲለ', ar: 'أرنب' },
  frog: { nb: 'Frosk', en: 'Frog', sv: 'Groda', de: 'Frosch', es: 'Rana', fr: 'Grenouille', ti: 'ቁርዖብ', ar: 'ضفدع' },
  owl: { nb: 'Ugle', en: 'Owl', sv: 'Uggla', de: 'Eule', es: 'Búho', fr: 'Hibou', ti: 'ጉጉ', ar: 'بومة' },
  cat: { nb: 'Katt', en: 'Cat', sv: 'Katt', de: 'Katze', es: 'Gato', fr: 'Chat', ti: 'ድሙ', ar: 'قطة' },
  dog: { nb: 'Hund', en: 'Dog', sv: 'Hund', de: 'Hund', es: 'Perro', fr: 'Chien', ti: 'ከልቢ', ar: 'كلب' },
  turtle: { nb: 'Skilpadde', en: 'Turtle', sv: 'Sköldpadda', de: 'Schildkröte', es: 'Tortuga', fr: 'Tortue', ti: 'ጎብየ', ar: 'سلحفاة' },
  butterfly: { nb: 'Sommerfugl', en: 'Butterfly', sv: 'Fjäril', de: 'Schmetterling', es: 'Mariposa', fr: 'Papillon', ti: 'ጽምብላሊዕ', ar: 'فراشة' },
  whale: { nb: 'Hval', en: 'Whale', sv: 'Val', de: 'Wal', es: 'Ballena', fr: 'Baleine', ti: 'ዓሳ ነባሪ', ar: 'حوت' },
  monkey: { nb: 'Apekatt', en: 'Monkey', sv: 'Apa', de: 'Affe', es: 'Mono', fr: 'Singe', ti: 'ህበይ', ar: 'قرد' },
  ladybug: { nb: 'Marihøne', en: 'Ladybug', sv: 'Nyckelpiga', de: 'Marienkäfer', es: 'Mariquita', fr: 'Coccinelle', ti: 'ሓሰኻ', ar: 'دعسوقة' },
  bee: { nb: 'Bie', en: 'Bee', sv: 'Bi', de: 'Biene', es: 'Abeja', fr: 'Abeille', ti: 'ንህቢ', ar: 'نحلة' },
  unicorn: { nb: 'Enhjørning', en: 'Unicorn', sv: 'Enhörning', de: 'Einhorn', es: 'Unicornio', fr: 'Licorne', ti: 'ዩኒኮርን', ar: 'وحيد القرن' },
  dino: { nb: 'Dinosaur', en: 'Dinosaur', sv: 'Dinosaurie', de: 'Dinosaurier', es: 'Dinosaurio', fr: 'Dinosaure', ti: 'ዳይኖሶር', ar: 'ديناصور' },
  robot: { nb: 'Robot', en: 'Robot', sv: 'Robot', de: 'Roboter', es: 'Robot', fr: 'Robot', ti: 'ሮቦት', ar: 'روبوت' },
  dragon: { nb: 'Drage', en: 'Dragon', sv: 'Drake', de: 'Drache', es: 'Dragón', fr: 'Dragon', ti: 'ድራጎን', ar: 'تنين' },
  crown: { nb: 'Kongekrone', en: 'Crown', sv: 'Krona', de: 'Krone', es: 'Corona', fr: 'Couronne', ti: 'ዘውዲ', ar: 'تاج' },
  rainbow: { nb: 'Regnbue', en: 'Rainbow', sv: 'Regnbåge', de: 'Regenbogen', es: 'Arcoíris', fr: 'Arc-en-ciel', ti: 'ቀስተ ደመና', ar: 'قوس قزح' },
  alien: { nb: 'Romvesen', en: 'Alien', sv: 'Utomjording', de: 'Alien', es: 'Marciano', fr: 'Alien', ti: 'ኤልየን', ar: 'فضائي' },
  snowman: { nb: 'Snømann', en: 'Snowman', sv: 'Snögubbe', de: 'Schneemann', es: 'Muñeco', fr: 'Bonhomme', ti: 'ሰብ በረድ', ar: 'رجل الثلج' },
  trophy: { nb: 'Gullpokal', en: 'Trophy', sv: 'Pokal', de: 'Pokal', es: 'Trofeo', fr: 'Trophée', ti: 'ዋንጫ', ar: 'كأس' },
  star: { nb: 'Stjerne', en: 'Star', sv: 'Stjärna', de: 'Stern', es: 'Estrella', fr: 'Étoile', ti: 'ኮኾብ', ar: 'نجمة' },
  heart: { nb: 'Hjerte', en: 'Heart', sv: 'Hjärta', de: 'Herz', es: 'Corazón', fr: 'Cœur', ti: 'ልቢ', ar: 'قلب' },
  teddy: { nb: 'Bamse', en: 'Teddy', sv: 'Nalle', de: 'Teddy', es: 'Osito', fr: 'Nounours', ti: 'ባምሰ', ar: 'دبدوب' },
  mermaid: { nb: 'Havfrue', en: 'Mermaid', sv: 'Sjöjungfru', de: 'Meerjungfrau', es: 'Sirena', fr: 'Sirène', ti: 'ጓል ባሕሪ', ar: 'حورية' },
  fairy: { nb: 'Alv', en: 'Fairy', sv: 'Älva', de: 'Fee', es: 'Hada', fr: 'Fée', ti: 'መልኣኽ', ar: 'جنية' },
  pirate: { nb: 'Sjørøver', en: 'Pirate', sv: 'Pirat', de: 'Pirat', es: 'Pirata', fr: 'Pirate', ti: 'ፓይሬት', ar: 'قرصان' },
  magic: { nb: 'Tryllehatt', en: 'Magic Hat', sv: 'Trollhatt', de: 'Zauberhut', es: 'Sombrero', fr: 'Chapeau', ti: 'ቆቢዕ', ar: 'قبعة سحرية' },
  firetruck: { nb: 'Brannbil', en: 'Fire Truck', sv: 'Brandbil', de: 'Feuerwehr', es: 'Bomberos', fr: 'Pompier', ti: 'መኪና ሓዊ', ar: 'إطفاء' },
  rocket: { nb: 'Rakett', en: 'Rocket', sv: 'Raket', de: 'Rakete', es: 'Cohete', fr: 'Fusée', ti: 'ሮኬት', ar: 'صاروخ' },
  sailboat: { nb: 'Seilbåt', en: 'Sailboat', sv: 'Segelbåt', de: 'Segelboot', es: 'Velero', fr: 'Voilier', ti: 'ጃልባ', ar: 'قارب' },
  bicycle: { nb: 'Sykkel', en: 'Bicycle', sv: 'Cykel', de: 'Fahrrad', es: 'Bicicleta', fr: 'Vélo', ti: 'ብሽክለታ', ar: 'دراجة' },
  soccer: { nb: 'Fotball', en: 'Soccer', sv: 'Fotboll', de: 'Fußball', es: 'Fútbol', fr: 'Football', ti: 'ኩዕሶ እግሪ', ar: 'كرة قدم' },
  guitar: { nb: 'Gitar', en: 'Guitar', sv: 'Gitarr', de: 'Gitarre', es: 'Guitarra', fr: 'Guitare', ti: 'ጊታር', ar: 'غيتار' },
  sun: { nb: 'Sol', en: 'Sun', sv: 'Sol', de: 'Sonne', es: 'Sol', fr: 'Soleil', ti: 'ጸሓይ', ar: 'شمس' },
  icecream: { nb: 'Iskrem', en: 'Ice Cream', sv: 'Glass', de: 'Eis', es: 'Helado', fr: 'Glace', ti: 'ጀላቶ', ar: 'آيس كريم' },
  apple: { nb: 'Eple', en: 'Apple', sv: 'Äpple', de: 'Apfel', es: 'Manzana', fr: 'Pomme', ti: 'ቱፋሕ', ar: 'تفاحة' },
  cake: { nb: 'Kake', en: 'Cake', sv: 'Tårta', de: 'Kuchen', es: 'Pastel', fr: 'Gâteau', ti: 'ኬክ', ar: 'كعكة' },
  umbrella: { nb: 'Paraply', en: 'Umbrella', sv: 'Paraply', de: 'Schirm', es: 'Paraguas', fr: 'Parapluie', ti: 'ጽላል', ar: 'مظلة' },
  balloon: { nb: 'Ballong', en: 'Balloon', sv: 'Ballong', de: 'Ballon', es: 'Globo', fr: 'Ballon', ti: 'ፍሕኛ', ar: 'بالون' },
  train: { nb: 'Tog', en: 'Train', sv: 'Tåg', de: 'Zug', es: 'Tren', fr: 'Train', ti: 'ባቡር', ar: 'قطار' },
  plane: { nb: 'Fly', en: 'Plane', sv: 'Flygplan', de: 'Flugzeug', es: 'Avión', fr: 'Avion', ti: 'ነፋሪት', ar: 'طائرة' },
  watermelon: { nb: 'Vannmelon', en: 'Watermelon', sv: 'Vattenmelon', de: 'Melone', es: 'Sandía', fr: 'Pastèque', ti: 'ብርቱኳን', ar: 'بطيخ' },
  gift: { nb: 'Gavepakke', en: 'Gift', sv: 'Present', de: 'Geschenk', es: 'Regalo', fr: 'Cadeau', ti: 'ህያብ', ar: 'هدية' },
};

export function getMemoryCardLabel(
  itemId: string,
  fallbackNb: string,
  lang: SupportedLanguage
): string {
  const entry = CARD_LABELS[itemId];
  if (!entry) return fallbackNb;
  return entry[lang] || entry.en || entry.nb || fallbackNb;
}
