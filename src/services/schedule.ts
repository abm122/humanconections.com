/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { moderation } from './moderation';

export type ScheduleCategory =
  | 'gjoremal'
  | 'maaltid'
  | 'aktivitet'
  | 'lekser'
  | 'lesing'
  | 'skjermtid'
  | 'sosialt';

export interface CategoryMeta {
  key: ScheduleCategory;
  label: string;
  subLabel: string;
  icon: string;
  color: string;
  badgeBg: string;
  borderCol: string;
}

export const SCHEDULE_CATEGORIES: Record<ScheduleCategory, CategoryMeta> = {
  gjoremal: {
    key: 'gjoremal',
    label: 'Gjøremål & Rutiner',
    subLabel: 'Plikter, rydding & personlig stell',
    icon: '🧹',
    color: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    borderCol: 'border-amber-500/40',
  },
  maaltid: {
    key: 'maaltid',
    label: 'Måltid & Næring',
    subLabel: 'Frokost, lunsj, middag & kveldsmat',
    icon: '🥗',
    color: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    borderCol: 'border-emerald-500/40',
  },
  aktivitet: {
    key: 'aktivitet',
    label: 'Aktivitet & Bevegelse',
    subLabel: 'Lek, sport, turer & frisk luft',
    icon: '🏃',
    color: 'text-orange-300',
    badgeBg: 'bg-orange-500/15 text-orange-200 border-orange-500/30',
    borderCol: 'border-orange-500/40',
  },
  lekser: {
    key: 'lekser',
    label: 'Lekser & Skole',
    subLabel: 'Oppgaver, øving & læring',
    icon: '📚',
    color: 'text-blue-300',
    badgeBg: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
    borderCol: 'border-blue-500/40',
  },
  lesing: {
    key: 'lesing',
    label: 'Lesing & Ro',
    subLabel: 'Bøker, tegneserier & høytlesing',
    icon: '📖',
    color: 'text-teal-300',
    badgeBg: 'bg-teal-500/15 text-teal-200 border-teal-500/30',
    borderCol: 'border-teal-500/40',
  },
  skjermtid: {
    key: 'skjermtid',
    label: 'Skjermtid & Balanse',
    subLabel: 'Spill, film, pauser & skjermfri',
    icon: '💻',
    color: 'text-indigo-300',
    badgeBg: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30',
    borderCol: 'border-indigo-500/40',
  },
  sosialt: {
    key: 'sosialt',
    label: 'Sosialt & Fellesskap',
    subLabel: 'Venner, familie, prat & omsorg',
    icon: '💛',
    color: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
    borderCol: 'border-rose-500/40',
  },
};

export type ParticipantColorId =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'orange'
  | 'indigo';

export interface ParticipantColorDef {
  id: ParticipantColorId;
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  ringClass: string;
  dotClass: string;
  lightBgClass: string;
}

export const PARTICIPANT_COLORS: Record<ParticipantColorId, ParticipantColorDef> = {
  emerald: {
    id: 'emerald',
    name: 'Smaragdgrønn',
    hex: '#10b981',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/50',
    badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50',
    ringClass: 'ring-emerald-400',
    dotClass: 'bg-emerald-400',
    lightBgClass: 'bg-emerald-950/70',
  },
  sky: {
    id: 'sky',
    name: 'Himmelblå',
    hex: '#0284c7',
    bgClass: 'bg-sky-500/20',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500/50',
    badgeClass: 'bg-sky-500/25 text-sky-200 border-sky-400/50',
    ringClass: 'ring-sky-400',
    dotClass: 'bg-sky-400',
    lightBgClass: 'bg-sky-950/70',
  },
  amber: {
    id: 'amber',
    name: 'Solgyllen',
    hex: '#f59e0b',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/50',
    badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/50',
    ringClass: 'ring-amber-400',
    dotClass: 'bg-amber-400',
    lightBgClass: 'bg-amber-950/70',
  },
  purple: {
    id: 'purple',
    name: 'Fiolett / Lilla',
    hex: '#8b5cf6',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500/50',
    badgeClass: 'bg-purple-500/25 text-purple-200 border-purple-400/50',
    ringClass: 'ring-purple-400',
    dotClass: 'bg-purple-400',
    lightBgClass: 'bg-purple-950/70',
  },
  rose: {
    id: 'rose',
    name: 'Bringebærrosa',
    hex: '#f43f5e',
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-500/50',
    badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
    ringClass: 'ring-rose-400',
    dotClass: 'bg-rose-400',
    lightBgClass: 'bg-rose-950/70',
  },
  teal: {
    id: 'teal',
    name: 'Turkis',
    hex: '#14b8a6',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-500/50',
    badgeClass: 'bg-teal-500/25 text-teal-200 border-teal-400/50',
    ringClass: 'ring-teal-400',
    dotClass: 'bg-teal-400',
    lightBgClass: 'bg-teal-950/70',
  },
  orange: {
    id: 'orange',
    name: 'Ildoransje',
    hex: '#f97316',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-500/50',
    badgeClass: 'bg-orange-500/25 text-orange-200 border-orange-400/50',
    ringClass: 'ring-orange-400',
    dotClass: 'bg-orange-400',
    lightBgClass: 'bg-orange-950/70',
  },
  indigo: {
    id: 'indigo',
    name: 'Kongeblå / Indigo',
    hex: '#6366f1',
    bgClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-300',
    borderClass: 'border-indigo-500/50',
    badgeClass: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50',
    ringClass: 'ring-indigo-400',
    dotClass: 'bg-indigo-400',
    lightBgClass: 'bg-indigo-950/70',
  },
};

export interface ScheduleParticipant {
  id: string;
  name: string;
  avatar: string; // Emoji
  colorId: ParticipantColorId;
  role?: string;
  createdAt: string;
}

export const DEFAULT_PARTICIPANTS: ScheduleParticipant[] = [
  { id: 'part-1', name: 'Emma', avatar: '🌸', colorId: 'rose', role: 'Deltager', createdAt: '2026-10-01' },
  { id: 'part-2', name: 'Oliver', avatar: '🚀', colorId: 'sky', role: 'Deltager', createdAt: '2026-10-01' },
  { id: 'part-3', name: 'Noah', avatar: '🦁', colorId: 'emerald', role: 'Deltager', createdAt: '2026-10-01' },
];

export interface TaskCompletionLogEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  category: ScheduleCategory;
  participantId: string;
  participantName: string;
  colorId: ParticipantColorId;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timestamp: number;
}

export interface PlannedTask {
  id: string;
  hour: number; // 0 - 23
  minute?: number; // 0, 15, 30, 45
  title: string;
  category: ScheduleCategory;
  icon: string;
  isCompleted: boolean;
  completedAt?: string;
  pointsAwarded?: number;
  assignedParticipantId?: string; // Who the task is assigned to
  completedByParticipantId?: string; // Who accomplished it
  completedByName?: string;
}

export interface WordBankItem {
  id: string;
  title: string;
  category: ScheduleCategory;
  icon: string;
  suggestedHour?: number;
  description?: string;
}

// 60+ pre-filled Norwegian task words/activities across the 7 requested categories
export const WORD_BANK: WordBankItem[] = [
  // --- GJØREMÅL ---
  { id: 'gjor-1', title: 'Rydde rommet og lekene', category: 'gjoremal', icon: '🧸', suggestedHour: 17, description: 'Legg leker og ting tilbake på plass' },
  { id: 'gjor-2', title: 'Re opp sengen pent', category: 'gjoremal', icon: '🛏️', suggestedHour: 7, description: 'Frisk start på en god dag' },
  { id: 'gjor-3', title: 'Pusse tenner morgen & kveld', category: 'gjoremal', icon: '🪥', suggestedHour: 8, description: 'Puss i minst 2 minutter med fluortannkrem' },
  { id: 'gjor-4', title: 'Sette inn / tømme oppvaskmaskin', category: 'gjoremal', icon: '🍽️', suggestedHour: 19, description: 'Hjelpe familien med kjøkkenet' },
  { id: 'gjor-5', title: 'Gå ut med søppel & resirkulering', category: 'gjoremal', icon: '♻️', suggestedHour: 16, description: 'Sortere papp, plast og restavfall' },
  { id: 'gjor-6', title: 'Brette og legge på plass tøy', category: 'gjoremal', icon: '👕', suggestedHour: 18, description: 'Hold skapet og klesskuffen i orden' },
  { id: 'gjor-7', title: 'Vaske hendene med såpe', category: 'gjoremal', icon: '🧼', suggestedHour: 12, description: 'Før måltider og etter utetid' },
  { id: 'gjor-8', title: 'Vanne blomster og stueplanter', category: 'gjoremal', icon: '🌱', suggestedHour: 15, description: 'Gi plantene litt frisk næring' },
  { id: 'gjor-9', title: 'Pakke skolesekken for i morgen', category: 'gjoremal', icon: '🎒', suggestedHour: 20, description: 'Bøker, pennal, drikkeflaske og gymtøy' },
  { id: 'gjor-10', title: 'Dusje og ta på rene klær', category: 'gjoremal', icon: '🚿', suggestedHour: 19, description: 'Herlig oppfriskning etter en aktiv dag' },
  { id: 'gjor-11', title: 'Lufte ut på soverommet', category: 'gjoremal', icon: '🪟', suggestedHour: 9, description: 'Fyll rommet med frisk kjølig luft' },
  { id: 'gjor-12', title: 'Tørke støv eller støvsuge', category: 'gjoremal', icon: '🧹', suggestedHour: 11, description: 'Hjelp til så fellesrommene skinner' },

  // --- MÅLTID ---
  { id: 'maal-1', title: 'Spise god og næringsrik frokost', category: 'maaltid', icon: '🥣', suggestedHour: 7, description: 'Havregryn, egg, knekkebrød eller yoghurt' },
  { id: 'maal-2', title: 'Drikke et stort glass vann', category: 'maaltid', icon: '💧', suggestedHour: 10, description: 'Hold kroppen hydrert og kvikk' },
  { id: 'maal-3', title: 'Spise skolelunsj / matpakke', category: 'maaltid', icon: '🥪', suggestedHour: 11, description: 'Nyt matpausen sammen med klassekamerater' },
  { id: 'maal-4', title: 'Fruktbit eller grønnsakssnacks', category: 'maaltid', icon: '🍎', suggestedHour: 14, description: 'Eplebåter, gulrøtter eller banan' },
  { id: 'maal-5', title: 'Hyggelig familiemiddag', category: 'maaltid', icon: '🍲', suggestedHour: 17, description: 'Varm og god mat samlet rundt bordet' },
  { id: 'maal-6', title: 'Spise rolig kveldsmat', category: 'maaltid', icon: '🍞', suggestedHour: 20, description: 'Kveldsmat gir ro i kroppen før natten' },
  { id: 'maal-7', title: 'Bake sammen (rundstykker/kake)', category: 'maaltid', icon: '🥐', suggestedHour: 15, description: 'Gøy å måle opp mel og kjenne duften' },
  { id: 'maal-8', title: 'Smøre matpakke for morgendagen', category: 'maaltid', icon: '🍱', suggestedHour: 21, description: 'Gjør alt klart i kjøleskapet i kveld' },
  { id: 'maal-9', title: 'Lage en frisk fruktsmoothie', category: 'maaltid', icon: '🥤', suggestedHour: 15, description: 'Bær, banan, melk og et dryss glede' },

  // --- AKTIVITET ---
  { id: 'akt-1', title: 'Sykkeltur eller sparkesykkel', category: 'aktivitet', icon: '🚲', suggestedHour: 15, description: 'Husk hjelm og opplev nabolaget' },
  { id: 'akt-2', title: 'Fotball eller ballspill ute', category: 'aktivitet', icon: '⚽', suggestedHour: 16, description: 'Trixe med ballen, sentre og score mål' },
  { id: 'akt-3', title: 'Gåtur i skog og natursti', category: 'aktivitet', icon: '🌲', suggestedHour: 14, description: 'Lukten av trær og fuglesang' },
  { id: 'akt-4', title: 'Turn, yoga eller morgentøyinger', category: 'aktivitet', icon: '🧘', suggestedHour: 8, description: 'Myk opp ryggen og finn balansen' },
  { id: 'akt-5', title: 'Svømming i basseng eller sjø', category: 'aktivitet', icon: '🏊', suggestedHour: 16, description: 'Gøy å dykke og svømme med venner' },
  { id: 'akt-6', title: 'Hoppe på trampoline / hinderløype', category: 'aktivitet', icon: '🤸', suggestedHour: 15, description: 'Brenn av masse energi med sprett' },
  { id: 'akt-7', title: 'Dansepause til favorittsang', category: 'aktivitet', icon: '💃', suggestedHour: 17, description: 'Sett på musikk og beveg kroppen i 10 minutter' },
  { id: 'akt-8', title: 'Lekeplass eller klatre i trær', category: 'aktivitet', icon: '🛝', suggestedHour: 16, description: 'Moro på huskene og i klatrestativet' },
  { id: 'akt-9', title: 'Gåtur i nabolaget med familie/hund', category: 'aktivitet', icon: '🐕', suggestedHour: 18, description: 'Koselig kveldstur i frisk kveldsluft' },
  { id: 'akt-10', title: 'Styrkeøvelser med egen kroppsvekt', category: 'aktivitet', icon: '💪', suggestedHour: 17, description: 'Armhevinger, knebøy og planke' },

  // --- LEKSER ---
  { id: 'lek-1', title: 'Gjøre mattestykker med godt mot', category: 'lekser', icon: '🔢', suggestedHour: 14, description: 'Pluss, minus, gange og smarte gåter' },
  { id: 'lek-2', title: 'Norsklekse & rettskriving', category: 'lekser', icon: '📝', suggestedHour: 15, description: 'Setningsbygging, substantiv og fin håndskrift' },
  { id: 'lek-3', title: 'Engelske gloser og uttale', category: 'lekser', icon: '🇬🇧', suggestedHour: 15, description: 'Lær 5 nye ord og si dem høyt' },
  { id: 'lek-4', title: 'Naturfag & samfunnsfagsoppgave', category: 'lekser', icon: '🔬', suggestedHour: 16, description: 'Lære om planeter, dyr eller historien' },
  { id: 'lek-5', title: 'Øve til prøve eller presentasjon', category: 'lekser', icon: '🎯', suggestedHour: 16, description: 'Repeter det viktigste med stikkord' },
  { id: 'lek-6', title: 'Sjekke ukeplanen i SkoleLink', category: 'lekser', icon: '📅', suggestedHour: 14, description: 'Få oversikt over frister og beskjeder' },
  { id: 'lek-7', title: 'Spørre om hjelp til vanskelige oppgaver', category: 'lekser', icon: '🙋', suggestedHour: 15, description: 'Det er smart og modig å be om hjelp' },
  { id: 'lek-8', title: 'Tegne eller lage illustrasjon til leksen', category: 'lekser', icon: '🎨', suggestedHour: 16, description: 'Fargelegg et kart eller tegn handlingen' },

  // --- LESING ---
  { id: 'les-1', title: 'Lese 20 minutter i favorittbok', category: 'lesing', icon: '📚', suggestedHour: 19, description: 'Synk inn i en spennende fortelling' },
  { id: 'les-2', title: 'Lese en morsom tegneserie', category: 'lesing', icon: '🦸', suggestedHour: 16, description: 'Donald, Asterix eller manga' },
  { id: 'les-3', title: 'Høytlesing sammen med familien', category: 'lesing', icon: '📖', suggestedHour: 20, description: 'En koselig felles stund før kvelden' },
  { id: 'les-4', title: 'Lytte til en spennende lydbok', category: 'lesing', icon: '🎧', suggestedHour: 21, description: 'Lukk øynene og lytt til stemmen og historien' },
  { id: 'les-5', title: 'Lese en faktabok om natur eller rommet', category: 'lesing', icon: '🪐', suggestedHour: 18, description: 'Fasinerende fakta om verden rundt oss' },
  { id: 'les-6', title: 'Besøke eller låne på biblioteket', category: 'lesing', icon: '🏛️', suggestedHour: 15, description: 'Finn nye skatter blant bokhyllene' },
  { id: 'les-7', title: 'Lese et kapittel på senga', category: 'lesing', icon: '🕯️', suggestedHour: 21, description: 'Den aller beste måten å roe hodet på' },
  { id: 'les-8', title: 'Lese gåter og vitser for andre', category: 'lesing', icon: '😄', suggestedHour: 18, description: 'Skap god latter og undring' },

  // --- SKJERMTID ---
  { id: 'skj-1', title: 'Lærerikt dataspill eller koding', category: 'skjermtid', icon: '💻', suggestedHour: 16, description: 'Scratch, Minecraft redstone eller mattespill' },
  { id: 'skj-2', title: 'Spille med en god venn på nett', category: 'skjermtid', icon: '🎮', suggestedHour: 17, description: 'Samarbeid og ha en hyggelig tone i voicechat' },
  { id: 'skj-3', title: 'Se en episode eller familiefilm sammen', category: 'skjermtid', icon: '🎬', suggestedHour: 19, description: 'Felles popkorn og underholdning' },
  { id: 'skj-4', title: '15-minutters pause fra skjerm', category: 'skjermtid', icon: '⏸️', suggestedHour: 17, description: 'Hvil øynene, strekk ryggen og drikk vann' },
  { id: 'skj-5', title: 'Digital tegning eller musikk-skaping', category: 'skjermtid', icon: '🎹', suggestedHour: 15, description: 'Kreativ bruk av nettbrett eller PC' },
  { id: 'skj-6', title: 'Skjermfri time før leggetid', category: 'skjermtid', icon: '🌙', suggestedHour: 21, description: 'Legg bort telefon og skjerm for dypere søvn' },
  { id: 'skj-7', title: 'Se en naturdokumentar', category: 'skjermtid', icon: '🐬', suggestedHour: 18, description: 'Lær om havdyr, vulkaner eller arktis' },
  { id: 'skj-8', title: 'Rydde i digitale mapper og bilder', category: 'skjermtid', icon: '📁', suggestedHour: 16, description: 'Slett unødvendige skjermbilder og filer' },

  // --- SOSIALT ---
  { id: 'sos-1', title: 'Ringe eller Facetime besteforeldre', category: 'sosialt', icon: '📱', suggestedHour: 18, description: 'Gled dem med å høre hvordan dagen har vært' },
  { id: 'sos-2', title: 'Spille brettspill eller kortspill', category: 'sosialt', icon: '🎲', suggestedHour: 19, description: 'Bingo, Ludo, Monopol eller Uno sammen' },
  { id: 'sos-3', title: 'Besøke eller få besøk av en venn', category: 'sosialt', icon: '🤝', suggestedHour: 15, description: 'Leke, prate og finne på noe morsomt' },
  { id: 'sos-4', title: 'Hyggelig prat rundt middagsbordet', category: 'sosialt', icon: '💬', suggestedHour: 17, description: 'Hva var det morsomste eller fineste i dag?' },
  { id: 'sos-5', title: 'Gi noen et varmt kompliment', category: 'sosialt', icon: '💖', suggestedHour: 12, description: 'Si noe hyggelig til en venn, lærer eller forelder' },
  { id: 'sos-6', title: 'Hjelpe en som trenger en hånd', category: 'sosialt', icon: '🤲', suggestedHour: 13, description: 'Åpne døren, bære en pose eller trøste noen' },
  { id: 'sos-7', title: 'Bygge Lego eller pusle puslespill', category: 'sosialt', icon: '🧩', suggestedHour: 18, description: 'Skap noe fint sammen i ro og fred' },
  { id: 'sos-8', title: 'Tegne et koselig kort til en venn', category: 'sosialt', icon: '💌', suggestedHour: 16, description: 'En håndlaget tegning varmer ekstra godt' },
  { id: 'sos-9', title: 'Familieråd: Planlegge helgen sammen', category: 'sosialt', icon: '🗓️', suggestedHour: 20, description: 'Alle får komme med et koselig ønske' },
];

export const STAR_REWARD_TARGET = 15;

export interface OwnerRewardOption {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
}

export const OWNER_REWARD_PRESETS: OwnerRewardOption[] = [
  {
    id: 'diplom',
    title: '🏆 Offisielt Gullstjerne-Diplom & Høytidelig Heder',
    category: 'Heder',
    description: 'Et vakkert diplom som beviser at 15 oppgaver er mesterlig fullført i dag!',
    icon: '🏆',
  },
  {
    id: 'middag',
    title: '🍕 Valgfri favorittmiddag for hele familien',
    category: 'Måltid',
    description: 'Stjerne-eieren bestemmer hva familien skal spise til middag i kveld eller i helgen.',
    icon: '🍕',
  },
  {
    id: 'spilltid',
    title: '🎮 30 minutter ekstra hyggetid / spilltid',
    category: 'Skjermtid & Fritid',
    description: 'Ekstra tid til favorittspill, video eller kreativ moro sammen.',
    icon: '🎮',
  },
  {
    id: 'film',
    title: '🎬 Velge kveldens familiefilm med popkorn',
    category: 'Sosialt',
    description: 'Få full kontroll over filmvalget og lag en koselig kinokveld i stua.',
    icon: '🍿',
  },
  {
    id: 'dessert',
    title: '🍦 Iskrem, smoothie eller valgfri kakedessert',
    category: 'Kos',
    description: 'Feir 15 fullførte oppgaver med en deilig forfriskning eller godbit.',
    icon: '🍨',
  },
  {
    id: 'utflukt',
    title: '🎡 Ønske-utflukt: Lekeplass, bowling, tur eller badeland',
    category: 'Aktivitet',
    description: 'Eieren og stjernespilleren drar på en morsom opplevelsestur sammen.',
    icon: '🎡',
  },
  {
    id: 'kaptein',
    title: '👑 Dagens Trivselskaptein / Stjerne-Leder',
    category: 'Fellesskap',
    description: 'Får stjernetittelen og leder neste brettspillkveld eller aktivitet.',
    icon: '👑',
  },
  {
    id: 'egendefinert',
    title: '✨ Egendefinert belønning fra eieren',
    category: 'Spesiell avtale',
    description: 'Skriv inn en helt unik gave eller koselig opplevelse avtalt med eieren.',
    icon: '🎁',
  },
];

export interface StarRewardRecord {
  target: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  claimedAt?: string;
  recipientName: string;
  awardedBy: string;
  chosenRewardTitle: string;
  customNote?: string;
  bonusSparksAwarded: number;
}

const STORAGE_KEY = 'joypulse_daily_schedule_v2';

export interface StoredScheduleData {
  tasks: PlannedTask[];
  lastUpdatedDate: string;
  starReward?: StarRewardRecord;
  lifetimeStarsCount?: number;
  participants?: ScheduleParticipant[];
  completionLog?: TaskCompletionLogEntry[];
}

export interface ParticipantRewardStatus {
  participant: ScheduleParticipant;
  todayCompletedCount: number;
  target: number;
  isDeserving: boolean;
  remainingForStar: number;
  progressPercent: number;
  isClaimedToday: boolean;
  claimedRewardTitle?: string;
}

export interface AggregatedStatsResult {
  timeframe: 'today' | 'week' | 'month';
  totalCompleted: number;
  participantsData: Array<{
    participant: ScheduleParticipant;
    completedCount: number;
    starsEarned: number;
    categoryCounts: Record<ScheduleCategory, number>;
    dailyActivity: Array<{ date: string; dayLabel: string; count: number }>;
  }>;
  categoryTotals: Record<ScheduleCategory, number>;
  topParticipant: ScheduleParticipant | null;
  recentActivity: TaskCompletionLogEntry[];
}

class DailyScheduleService {
  private tasks: PlannedTask[] = [];
  private participants: ScheduleParticipant[] = [...DEFAULT_PARTICIPANTS];
  private completionLog: TaskCompletionLogEntry[] = [];
  private starReward: StarRewardRecord = {
    target: STAR_REWARD_TARGET,
    isUnlocked: false,
    isClaimed: false,
    recipientName: '',
    awardedBy: 'Spillvert / Eier',
    chosenRewardTitle: OWNER_REWARD_PRESETS[0].title,
    bonusSparksAwarded: 0,
  };
  private lifetimeStarsCount: number = 0;
  private listeners: Set<(tasks: PlannedTask[]) => void> = new Set();
  private participantListeners: Set<(participants: ScheduleParticipant[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private getTodayDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredScheduleData = JSON.parse(raw);
        if (Array.isArray(parsed.tasks)) {
          this.tasks = parsed.tasks;
        }
        if (Array.isArray(parsed.participants) && parsed.participants.length > 0) {
          this.participants = parsed.participants;
        } else {
          this.participants = [...DEFAULT_PARTICIPANTS];
        }
        if (Array.isArray(parsed.completionLog)) {
          this.completionLog = parsed.completionLog;
        } else {
          this.seedInitialHistory();
        }
        if (parsed.starReward) {
          if (parsed.lastUpdatedDate === this.getTodayDateKey()) {
            this.starReward = parsed.starReward;
          }
        }
        if (typeof parsed.lifetimeStarsCount === 'number') {
          this.lifetimeStarsCount = parsed.lifetimeStarsCount;
        }
        return;
      } catch {
        // use default preset
      }
    }
    // First time setup
    this.participants = [...DEFAULT_PARTICIPANTS];
    this.seedInitialHistory();
    this.loadPreset('skolehverdag');
  }

  /**
   * Seed realistic historical task records across previous 30 days
   * so weekly and monthly views are immediately rich and visual.
   */
  private seedInitialHistory() {
    const categories: ScheduleCategory[] = [
      'gjoremal',
      'maaltid',
      'aktivitet',
      'lekser',
      'lesing',
      'skjermtid',
      'sosialt',
    ];
    const dummyTitles = [
      'Re opp seng',
      'Spise god frokost',
      'Pusse tenner',
      'Lekser & matte',
      'Lese i bok',
      'Utetid & fotball',
      'Rydde rommet',
      'Familiemiddag',
      'Spille brettspill',
      'Kveldsmat & ro',
    ];

    const seeded: TaskCompletionLogEntry[] = [];
    const now = new Date();

    // Generate entries for past 28 days
    for (let dayOffset = 28; dayOffset >= 1; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Distribute 8-18 completions among participants
      const countForDay = 8 + ((dayOffset * 7) % 10);
      for (let i = 0; i < countForDay; i++) {
        const participant = this.participants[i % this.participants.length];
        const cat = categories[(i + dayOffset) % categories.length];
        const title = dummyTitles[(i + dayOffset) % dummyTitles.length];
        const hour = 7 + (i % 14);
        const minute = (i * 15) % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        seeded.push({
          id: `seed-${dateStr}-${i}`,
          taskId: `seed-task-${i}`,
          taskTitle: title,
          category: cat,
          participantId: participant.id,
          participantName: participant.name,
          colorId: participant.colorId,
          date: dateStr,
          time: timeStr,
          timestamp: d.getTime() + (hour * 3600 + minute * 60) * 1000,
        });
      }
    }

    this.completionLog = seeded;
  }

  private save() {
    if (typeof window === 'undefined') return;
    const completedCount = this.getCompletedCount();
    this.starReward.isUnlocked = completedCount >= STAR_REWARD_TARGET;

    const data: StoredScheduleData = {
      tasks: this.tasks,
      lastUpdatedDate: this.getTodayDateKey(),
      starReward: this.starReward,
      lifetimeStarsCount: this.lifetimeStarsCount,
      participants: this.participants,
      completionLog: this.completionLog,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage quota handling
    }
    this.notify();
    this.notifyParticipants();
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.tasks]));
  }

  private notifyParticipants() {
    this.participantListeners.forEach((cb) => cb([...this.participants]));
  }

  public subscribe(cb: (tasks: PlannedTask[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.tasks]);
    return () => this.listeners.delete(cb);
  }

  public subscribeParticipants(cb: (participants: ScheduleParticipant[]) => void): () => void {
    this.participantListeners.add(cb);
    cb([...this.participants]);
    return () => this.participantListeners.delete(cb);
  }

  // --- PARTICIPANTS MANAGEMENT ---

  public getParticipants(): ScheduleParticipant[] {
    return [...this.participants];
  }

  public getParticipantById(id: string): ScheduleParticipant | undefined {
    return this.participants.find((p) => p.id === id);
  }

  public addParticipant(
    name: string,
    avatar: string,
    colorId: ParticipantColorId,
    role: string = 'Deltager'
  ): ScheduleParticipant | null {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const modResult = moderation.filterText(trimmed);
    const cleanName = modResult.cleanText || 'Deltager';

    const newParticipant: ScheduleParticipant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      avatar: avatar || '⭐',
      colorId: colorId || 'emerald',
      role: role.trim() || 'Deltager',
      createdAt: this.getTodayDateKey(),
    };

    this.participants.push(newParticipant);
    this.save();
    return newParticipant;
  }

  public updateParticipant(id: string, updates: Partial<ScheduleParticipant>): boolean {
    const p = this.participants.find((item) => item.id === id);
    if (!p) return false;

    if (updates.name) {
      const clean = moderation.filterText(updates.name.trim()).cleanText;
      if (clean) p.name = clean;
    }
    if (updates.avatar) p.avatar = updates.avatar;
    if (updates.colorId) p.colorId = updates.colorId;
    if (updates.role) p.role = updates.role;

    this.save();
    return true;
  }

  public deleteParticipant(id: string): boolean {
    if (this.participants.length <= 1) return false; // Keep at least one
    const prevCount = this.participants.length;
    this.participants = this.participants.filter((p) => p.id !== id);
    if (this.participants.length !== prevCount) {
      // Clear assignment from tasks
      this.tasks.forEach((t) => {
        if (t.assignedParticipantId === id) t.assignedParticipantId = undefined;
        if (t.completedByParticipantId === id) t.completedByParticipantId = undefined;
      });
      this.save();
      return true;
    }
    return false;
  }

  // --- TASK ASSIGNMENT ---

  public assignTask(taskId: string, participantId?: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;
    task.assignedParticipantId = participantId;
    this.save();
    return true;
  }

  // --- WHO DESERVES REWARD ---

  public getWhoDeservesReward(): ParticipantRewardStatus[] {
    const today = this.getTodayDateKey();

    return this.participants.map((p) => {
      // Count completions done by this participant today
      const todayCount = this.tasks.filter(
        (t) => t.isCompleted && (t.completedByParticipantId === p.id || (!t.completedByParticipantId && t.assignedParticipantId === p.id))
      ).length;

      const isDeserving = todayCount >= STAR_REWARD_TARGET;
      const remaining = Math.max(0, STAR_REWARD_TARGET - todayCount);
      const progressPercent = Math.min(100, Math.round((todayCount / STAR_REWARD_TARGET) * 100));

      const isClaimedToday = this.starReward.isClaimed && this.starReward.recipientName.toLowerCase().includes(p.name.toLowerCase());

      return {
        participant: p,
        todayCompletedCount: todayCount,
        target: STAR_REWARD_TARGET,
        isDeserving,
        remainingForStar: remaining,
        progressPercent,
        isClaimedToday,
        claimedRewardTitle: isClaimedToday ? this.starReward.chosenRewardTitle : undefined,
      };
    });
  }

  // --- STATISTICS: WEEK & MONTH ---

  public getWeeklyMonthlyStats(timeframe: 'today' | 'week' | 'month'): AggregatedStatsResult {
    const now = new Date();
    const todayStr = this.getTodayDateKey();
    let cutoffDays = 0;

    if (timeframe === 'today') cutoffDays = 0;
    else if (timeframe === 'week') cutoffDays = 6; // today + 6 past days = 7 days
    else cutoffDays = 29; // today + 29 past days = 30 days

    // Generate date keys for range
    const datesInRange: string[] = [];
    for (let i = cutoffDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      datesInRange.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      );
    }

    const dayLabelsShort = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

    // Combine current tasks done today with historical log
    const todayEntries: TaskCompletionLogEntry[] = this.tasks
      .filter((t) => t.isCompleted)
      .map((t) => {
        const p = this.participants.find(
          (part) => part.id === (t.completedByParticipantId || t.assignedParticipantId)
        ) || this.participants[0];
        return {
          id: `today-${t.id}`,
          taskId: t.id,
          taskTitle: t.title,
          category: t.category,
          participantId: p.id,
          participantName: p.name,
          colorId: p.colorId,
          date: todayStr,
          time: t.completedAt || '12:00',
          timestamp: Date.now(),
        };
      });

    // Merge: historical log (excluding today) + live today
    const allLogEntries = [
      ...this.completionLog.filter((e) => e.date !== todayStr),
      ...todayEntries,
    ];

    // Filter to range
    const filteredEntries = allLogEntries.filter((e) => datesInRange.includes(e.date));

    // Category totals
    const categoryTotals: Record<ScheduleCategory, number> = {
      gjoremal: 0,
      maaltid: 0,
      aktivitet: 0,
      lekser: 0,
      lesing: 0,
      skjermtid: 0,
      sosialt: 0,
    };

    filteredEntries.forEach((e) => {
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += 1;
      }
    });

    // Participant aggregations
    const participantsData = this.participants.map((p) => {
      const pEntries = filteredEntries.filter((e) => e.participantId === p.id);
      const catCounts: Record<ScheduleCategory, number> = {
        gjoremal: 0,
        maaltid: 0,
        aktivitet: 0,
        lekser: 0,
        lesing: 0,
        skjermtid: 0,
        sosialt: 0,
      };

      pEntries.forEach((e) => {
        if (catCounts[e.category] !== undefined) {
          catCounts[e.category] += 1;
        }
      });

      // Daily trend
      const dailyActivity = datesInRange.map((dStr) => {
        const count = pEntries.filter((e) => e.date === dStr).length;
        const dObj = new Date(dStr);
        const dayLabel = dayLabelsShort[dObj.getDay()];
        return {
          date: dStr,
          dayLabel,
          count,
        };
      });

      // Stars earned: count days where participant did >= 15 tasks
      const daysMeetingStar = datesInRange.filter((dStr) => {
        return pEntries.filter((e) => e.date === dStr).length >= STAR_REWARD_TARGET;
      }).length;

      return {
        participant: p,
        completedCount: pEntries.length,
        starsEarned: daysMeetingStar,
        categoryCounts: catCounts,
        dailyActivity,
      };
    });

    // Top participant
    const sorted = [...participantsData].sort((a, b) => b.completedCount - a.completedCount);
    const topParticipant = sorted.length > 0 && sorted[0].completedCount > 0 ? sorted[0].participant : null;

    // Recent activity list
    const recentActivity = [...filteredEntries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);

    return {
      timeframe,
      totalCompleted: filteredEntries.length,
      participantsData,
      categoryTotals,
      topParticipant,
      recentActivity,
    };
  }

  // --- GENERAL METHODS ---

  public getCompletedCount(): number {
    return this.tasks.filter((t) => t.isCompleted).length;
  }

  public getStarRewardData(): StarRewardRecord & { currentCompleted: number } {
    const currentCompleted = this.getCompletedCount();
    return {
      ...this.starReward,
      isUnlocked: currentCompleted >= STAR_REWARD_TARGET,
      currentCompleted,
    };
  }

  public getLifetimeStars(): number {
    return this.lifetimeStarsCount;
  }

  public claimStarReward(
    recipientName: string,
    awardedBy: string,
    chosenRewardTitle: string,
    customNote?: string
  ): { success: boolean; bonusSparks: number } {
    const currentCompleted = this.getCompletedCount();
    if (currentCompleted < STAR_REWARD_TARGET) {
      return { success: false, bonusSparks: 0 };
    }

    const cleanRecipient = moderation.filterText(recipientName.trim()).cleanText || 'Dagens Stjerne-Mester';
    const cleanAwardedBy = moderation.filterText(awardedBy.trim()).cleanText || 'Eieren';
    const cleanReward = moderation.filterText(chosenRewardTitle.trim()).cleanText || OWNER_REWARD_PRESETS[0].title;
    const cleanNote = customNote ? moderation.filterText(customNote.trim()).cleanText : undefined;

    const bonusSparks = 300;
    this.starReward = {
      target: STAR_REWARD_TARGET,
      isUnlocked: true,
      isClaimed: true,
      claimedAt: new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
      recipientName: cleanRecipient,
      awardedBy: cleanAwardedBy,
      chosenRewardTitle: cleanReward,
      customNote: cleanNote,
      bonusSparksAwarded: bonusSparks,
    };

    this.lifetimeStarsCount += 1;
    this.save();

    return { success: true, bonusSparks };
  }

  public getTasks(): PlannedTask[] {
    return [...this.tasks];
  }

  public getTasksForHour(hour: number): PlannedTask[] {
    return this.tasks.filter((t) => t.hour === hour);
  }

  /**
   * Adds a task to a specific hour slot with optional participant assignment
   */
  public addTask(
    title: string,
    category: ScheduleCategory,
    hour: number,
    icon?: string,
    markCompletedDirectly: boolean = false,
    assignedParticipantId?: string
  ): PlannedTask {
    const modResult = moderation.filterText(title.trim());
    const cleanTitle = modResult.cleanText || 'Hyggelig gjøremål';
    const categoryMeta = SCHEDULE_CATEGORIES[category] || SCHEDULE_CATEGORIES.gjoremal;
    const finalIcon = icon || categoryMeta.icon;

    const chosenParticipant = assignedParticipantId
      ? this.getParticipantById(assignedParticipantId)
      : this.participants[0];

    const newTask: PlannedTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      hour: Math.max(0, Math.min(23, hour)),
      minute: 0,
      title: cleanTitle,
      category,
      icon: finalIcon,
      isCompleted: markCompletedDirectly,
      completedAt: markCompletedDirectly
        ? new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
        : undefined,
      pointsAwarded: markCompletedDirectly ? 35 : 0,
      assignedParticipantId: chosenParticipant?.id,
      completedByParticipantId: markCompletedDirectly ? chosenParticipant?.id : undefined,
      completedByName: markCompletedDirectly ? chosenParticipant?.name : undefined,
    };

    this.tasks.push(newTask);
    this.save();
    return newTask;
  }

  /**
   * Toggle task completion status with participant tracking
   */
  public toggleComplete(
    taskId: string,
    completerParticipantId?: string
  ): { task: PlannedTask; pointsEarned: number } | null {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    task.isCompleted = !task.isCompleted;
    let pointsEarned = 0;

    if (task.isCompleted) {
      const activeParticipant = completerParticipantId
        ? this.getParticipantById(completerParticipantId)
        : task.assignedParticipantId
        ? this.getParticipantById(task.assignedParticipantId)
        : this.participants[0];

      task.completedAt = new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
      task.completedByParticipantId = activeParticipant?.id;
      task.completedByName = activeParticipant?.name;
      pointsEarned = 35;
      task.pointsAwarded = (task.pointsAwarded || 0) + pointsEarned;

      // Add to today completion log
      if (activeParticipant) {
        this.completionLog.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          participantId: activeParticipant.id,
          participantName: activeParticipant.name,
          colorId: activeParticipant.colorId,
          date: this.getTodayDateKey(),
          time: task.completedAt,
          timestamp: Date.now(),
        });
      }
    } else {
      task.completedAt = undefined;
      task.completedByParticipantId = undefined;
      task.completedByName = undefined;
      // Remove from today log if present
      const todayStr = this.getTodayDateKey();
      this.completionLog = this.completionLog.filter(
        (e) => !(e.taskId === task.id && e.date === todayStr)
      );
    }

    this.save();
    return { task, pointsEarned };
  }

  /**
   * Move task to another hour
   */
  public moveTask(taskId: string, targetHour: number): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;
    task.hour = Math.max(0, Math.min(23, targetHour));
    this.save();
    return true;
  }

  /**
   * Delete a task from schedule
   */
  public deleteTask(taskId: string): boolean {
    const beforeCount = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    if (this.tasks.length !== beforeCount) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Clear all tasks
   */
  public clearAll() {
    this.tasks = [];
    this.save();
  }

  /**
   * Load curated Norwegian presets
   */
  public loadPreset(presetKey: 'skolehverdag' | 'helg' | 'rolig') {
    let presetItems: Array<{ hour: number; wordId: string }> = [];

    if (presetKey === 'skolehverdag') {
      presetItems = [
        { hour: 7, wordId: 'gjor-2' }, // Re opp seng
        { hour: 7, wordId: 'maal-1' }, // Spise frokost
        { hour: 8, wordId: 'gjor-3' }, // Pusse tenner
        { hour: 11, wordId: 'maal-3' }, // Skolelunsj
        { hour: 14, wordId: 'maal-4' }, // Fruktbit
        { hour: 14, wordId: 'lek-1' }, // Mattestykker
        { hour: 15, wordId: 'lek-2' }, // Norsklekse
        { hour: 16, wordId: 'akt-1' }, // Sykkeltur / utetid
        { hour: 17, wordId: 'maal-5' }, // Familiemiddag
        { hour: 18, wordId: 'skj-1' }, // Skjermtid læring/spill
        { hour: 19, wordId: 'les-1' }, // Lese 20 min bok
        { hour: 20, wordId: 'gjor-9' }, // Pakke sekken
        { hour: 20, wordId: 'maal-6' }, // Kveldsmat
        { hour: 21, wordId: 'skj-6' }, // Skjermfri ro
        { hour: 21, wordId: 'les-7' }, // Lese på senga
      ];
    } else if (presetKey === 'helg') {
      presetItems = [
        { hour: 8, wordId: 'maal-1' }, // God frokost
        { hour: 9, wordId: 'gjor-2' }, // Re opp seng
        { hour: 10, wordId: 'akt-3' }, // Gåtur i skog og mark
        { hour: 12, wordId: 'maal-9' }, // Smoothie
        { hour: 13, wordId: 'sos-3' }, // Besøke venn
        { hour: 15, wordId: 'maal-7' }, // Bake sammen
        { hour: 16, wordId: 'akt-2' }, // Ballspill ute
        { hour: 17, wordId: 'gjor-1' }, // Rydde rommet
        { hour: 18, wordId: 'maal-5' }, // Familiemiddag
        { hour: 19, wordId: 'sos-2' }, // Spille brettspill
        { hour: 20, wordId: 'skj-3' }, // Familiefilm
        { hour: 21, wordId: 'les-3' }, // Høytlesing
      ];
    } else {
      // rolig / trivsel
      presetItems = [
        { hour: 8, wordId: 'akt-4' }, // Morgen yoga/tøying
        { hour: 9, wordId: 'maal-1' }, // Deilig frokost
        { hour: 10, wordId: 'gjor-8' }, // Vanne planter
        { hour: 11, wordId: 'les-2' }, // Lese tegneserie
        { hour: 13, wordId: 'maal-3' }, // God lunsj
        { hour: 14, wordId: 'akt-9' }, // Rusletur i frisk luft
        { hour: 16, wordId: 'sos-1' }, // Ringe besteforeldre
        { hour: 17, wordId: 'maal-5' }, // Felles middag
        { hour: 19, wordId: 'sos-7' }, // Puslespill / lego
        { hour: 20, wordId: 'les-4' }, // Lydbok
      ];
    }

    const created: PlannedTask[] = presetItems.map((item, idx) => {
      const word = WORD_BANK.find((w) => w.id === item.wordId) || WORD_BANK[0];
      const p = this.participants[idx % this.participants.length];
      return {
        id: `task-preset-${idx}-${Date.now()}`,
        hour: item.hour,
        minute: 0,
        title: word.title,
        category: word.category,
        icon: word.icon,
        isCompleted: false,
        assignedParticipantId: p?.id,
      };
    });

    this.tasks = created;
    this.save();
  }
}

export const dailySchedule = new DailyScheduleService();
