/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export type SupportedLanguage = 'nb' | 'en' | 'ti' | 'sv' | 'de' | 'es' | 'fr' | 'ar';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;        // Native name
  englishName: string; // English name
  flag: string;        // Flag emoji
  speechLocale: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'nb',
    name: 'Norsk (Bokmål)',
    englishName: 'Norwegian',
    flag: '🇳🇴',
    speechLocale: 'nb-NO',
    dir: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇬🇧',
    speechLocale: 'en-US',
    dir: 'ltr',
  },
  {
    code: 'ti',
    name: 'ትግርኛ (Tigrinya)',
    englishName: 'Tigrinya',
    flag: '🇪🇷',
    speechLocale: 'ti-ET',
    dir: 'ltr',
  },
  {
    code: 'sv',
    name: 'Svenska',
    englishName: 'Swedish',
    flag: '🇸🇪',
    speechLocale: 'sv-SE',
    dir: 'ltr',
  },
  {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    flag: '🇩🇪',
    speechLocale: 'de-DE',
    dir: 'ltr',
  },
  {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    speechLocale: 'es-ES',
    dir: 'ltr',
  },
  {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
    speechLocale: 'fr-FR',
    dir: 'ltr',
  },
  {
    code: 'ar',
    name: 'العربية (Arabic)',
    englishName: 'Arabic',
    flag: '🇸🇦',
    speechLocale: 'ar-SA',
    dir: 'rtl',
  },
];

export type TranslationKey =
  | 'app_title'
  | 'app_tagline'
  | 'start_game'
  | 'new_game'
  | 'audience_tv'
  | 'mixer'
  | 'daily_quests'
  | 'daily_schedule'
  | 'print_cards'
  | 'mute'
  | 'unmute'
  | 'dual_view'
  | 'cards_only'
  | 'stage_only'
  | 'grid_view'
  | 'single_card'
  | 'display_mode'
  | 'numbers'
  | 'both'
  | 'prompts'
  | 'game_mode'
  | 'mode_all_in_one'
  | 'mode_caller'
  | 'mode_player'
  | 'theme'
  | 'theme_classic'
  | 'theme_acts'
  | 'theme_memories'
  | 'theme_gratitude'
  | 'theme_ril'
  | 'player_count'
  | 'cards_per_player'
  | 'call_next_ball'
  | 'scramble_cage'
  | 'auto_calling'
  | 'auto_calling_active'
  | 'line_completed'
  | 'bingo_victory'
  | 'star_reward_badge'
  | 'star_reward_title'
  | 'star_reward_earned'
  | 'star_reward_needed'
  | 'claim_star_reward'
  | 'star_diploma'
  | 'close'
  | 'save'
  | 'clear'
  | 'print'
  | 'language'
  | 'switch_language'
  | 'wellbeing_schedule'
  | 'category_meals'
  | 'category_chores'
  | 'category_homework'
  | 'category_reading'
  | 'category_activity'
  | 'category_screentime'
  | 'category_social'
  | 'category_rest'
  | 'word_bank_title'
  | 'add_custom_task'
  | 'tasks_completed'
  | 'drag_or_click_hint'
  | 'safe_community_notice'
  | 'reset_game'
  | 'resume_game';

const TRANSLATIONS: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  nb: {
    app_title: 'Human-connection',
    app_tagline: 'Quiz, familiehygge & sosial trivsel',
    start_game: 'START SPILL',
    new_game: 'Nytt spill',
    audience_tv: 'Audience TV',
    mixer: 'Mikser',
    daily_quests: 'Daglige oppdrag',
    daily_schedule: 'Dagsplan (24t)',
    print_cards: 'Skriv ut kort',
    mute: 'Lyd av',
    unmute: 'Lyd på',
    dual_view: '✨ Dobbel visning',
    cards_only: '📋 Kort',
    stage_only: '🎲 Scene',
    grid_view: 'Rutenett',
    single_card: 'Enkeltkort',
    display_mode: 'Visning',
    numbers: '# Tall',
    both: 'Begge',
    prompts: 'Gledestema',
    game_mode: 'Spillmodus',
    mode_all_in_one: 'Alt-i-ett (Scene & Kort)',
    mode_caller: 'Kun Trommel / Kaller',
    mode_player: 'Kun Spillebrett',
    theme: 'Tema',
    theme_classic: 'Klassisk Glede',
    theme_acts: 'Gode Gjerninger',
    theme_memories: 'Varme Minner',
    theme_gratitude: 'Hverdagsglede',
    theme_ril: 'RIL (Relasjon & Livsglede)',
    player_count: 'Antall spillere',
    cards_per_player: 'Kort per spiller',
    call_next_ball: 'Trekk neste kule',
    scramble_cage: 'Rist kulene',
    auto_calling: 'Autotrekk',
    auto_calling_active: 'Trekker...',
    line_completed: 'Linje fullført!',
    bingo_victory: 'BINGO! Gratulerer!',
    star_reward_badge: 'Stjerne-Mester',
    star_reward_title: 'Dagens Stjernebelønning (15 oppgaver)',
    star_reward_earned: '15/15 fullført! Belønning klar',
    star_reward_needed: 'oppgaver gjenstår for stjerne',
    claim_star_reward: 'Hent Stjernebelønning',
    star_diploma: 'Offisielt Stjerne-Diplom',
    close: 'Lukk',
    save: 'Lagre',
    clear: 'Nullstill',
    print: 'Skriv ut',
    language: 'Språk',
    switch_language: 'Bytt språk',
    wellbeing_schedule: '24-Timers Dagsplan & Trivsel',
    category_meals: 'Måltid & Ernæring',
    category_chores: 'Gjøremål & Orden',
    category_homework: 'Lekser & Læring',
    category_reading: 'Lesing & Bøker',
    category_activity: 'Aktivitet & Fysisk',
    category_screentime: 'Skjermtid med måte',
    category_social: 'Sosialt & Samvær',
    category_rest: 'Hvile & Søvn',
    word_bank_title: 'Ord- og Oppgavebank',
    add_custom_task: 'Legg til gjøremål...',
    tasks_completed: 'oppgaver fullført',
    drag_or_click_hint: 'Klikk eller dra et gjøremål for å plassere det i planen',
    safe_community_notice: 'Trygt og vennlig miljø: upassende innhold filtreres automatisk.',
    reset_game: 'Nullstill spill',
    resume_game: 'Fortsett spill',
  },

  en: {
    app_title: 'Human-connection',
    app_tagline: 'Social Quiz, Family & Wellbeing',
    start_game: 'START GAME',
    new_game: 'New Game',
    audience_tv: 'Audience TV',
    mixer: 'Mixer',
    daily_quests: 'Daily Quests',
    daily_schedule: 'Daily Schedule (24h)',
    print_cards: 'Print Cards',
    mute: 'Mute',
    unmute: 'Unmute',
    dual_view: '✨ Dual View',
    cards_only: '📋 Cards',
    stage_only: '🎲 Stage',
    grid_view: 'Grid View',
    single_card: 'Single Card',
    display_mode: 'Display Mode',
    numbers: '# Numbers',
    both: 'Both',
    prompts: 'Prompts',
    game_mode: 'Game Mode',
    mode_all_in_one: 'All-In-One (Host + Cards)',
    mode_caller: 'Host & Tumbler Only',
    mode_player: 'Player Cards Only',
    theme: 'Theme',
    theme_classic: 'Classic Joy',
    theme_acts: 'Acts of Kindness',
    theme_memories: 'Warm Memories',
    theme_gratitude: 'Daily Gratitude',
    theme_ril: 'RIL (Inclusion & Life Joy)',
    player_count: 'Player Count',
    cards_per_player: 'Cards Per Player',
    call_next_ball: 'Draw Next Ball',
    scramble_cage: 'Scramble Cage',
    auto_calling: 'Auto Calling',
    auto_calling_active: 'Calling...',
    line_completed: 'Line Complete!',
    bingo_victory: 'BINGO! Congratulations!',
    star_reward_badge: 'Star Master',
    star_reward_title: 'Daily Star Reward (15 Tasks)',
    star_reward_earned: '15/15 Completed! Reward Ready',
    star_reward_needed: 'tasks remaining for star',
    claim_star_reward: 'Claim Star Reward',
    star_diploma: 'Official Star Diploma',
    close: 'Close',
    save: 'Save',
    clear: 'Reset',
    print: 'Print',
    language: 'Language',
    switch_language: 'Change Language',
    wellbeing_schedule: '24-Hour Daily Schedule & Wellbeing',
    category_meals: 'Meals & Nutrition',
    category_chores: 'Chores & Duties',
    category_homework: 'Homework & Study',
    category_reading: 'Reading & Books',
    category_activity: 'Physical Activity',
    category_screentime: 'Healthy Screen Time',
    category_social: 'Social & Family Time',
    category_rest: 'Rest & Sleep',
    word_bank_title: 'Task & Activity Bank',
    add_custom_task: 'Add new task...',
    tasks_completed: 'tasks completed',
    drag_or_click_hint: 'Click or drag a task into any hour slot in the schedule',
    safe_community_notice: 'Safe and positive space: inappropriate content is strictly blocked.',
    reset_game: 'Reset Game',
    resume_game: 'Resume Game',
  },

  ti: {
    app_title: 'Human-connection',
    app_tagline: 'ማሕበራዊ ሓጐስ፣ ፈተነ-ፍልጠትን ስድራቤታዊ ርክብን',
    start_game: 'ጸወታ ጀምር',
    new_game: 'ሓድሽ ጸወታ',
    audience_tv: 'ተዓዘብቲ ቲቪ',
    mixer: 'ሚክሰር',
    daily_quests: 'ናይ መዓልቲ ዕማማት',
    daily_schedule: 'መደብ መዓልቲ (24 ሰዓት)',
    print_cards: 'ካርዶች ኣሕትም',
    mute: 'ድምጺ ኣጥፍእ',
    unmute: 'ድምጺ ኣብርህ',
    dual_view: '✨ ክልቲኡ ርአ',
    cards_only: '📋 ካርዶች',
    stage_only: '🎲 መድረኽ',
    grid_view: 'ኩሉ ርአ',
    single_card: 'ሓንቲ ካርድ',
    display_mode: 'ናይ ኣቀራርባ ቅዲ',
    numbers: '# ቁጽርታት',
    both: 'ክልቲኡ',
    prompts: 'ናይ ሓጐስ ቃላት',
    game_mode: 'ቅዲ ጸወታ',
    mode_all_in_one: 'ኩሉ ብሓደ (መድረኽን ካርድን)',
    mode_caller: 'መድረኽን ቁጽሪ መጸውዕን',
    mode_player: 'ናይ ተጻዋታይ ካርዶች ጥራይ',
    theme: 'ቴማ / ኣርእስቲ',
    theme_classic: 'ልሙድ ሓጐስ',
    theme_acts: 'ሰናይ ግብርታት',
    theme_memories: 'ቁምነገር ተዘክሮታት',
    theme_gratitude: 'ምስጋናን ሓጐስን',
    theme_ril: 'RIL (ርክብን ናብራ ሓጐስን)',
    player_count: 'ብዝሒ ተጻወትቲ',
    cards_per_player: 'ካርድ ንነፍሲ ወከፍ ተጻዋታይ',
    call_next_ball: 'ቀጻሊ ኵዕሶ ኣውጽእ',
    scramble_cage: 'ኵዕሶታት ኣንቀሳቕስ',
    auto_calling: 'ብባዕሉ ጸዋዒ',
    auto_calling_active: 'ይጽውዕ ኣሎ...',
    line_completed: 'መስመር ተወዲኡ!',
    bingo_victory: 'ቢንጎ! እንቋዕ ሓጐሰካ!',
    star_reward_badge: 'ዋና ኮኾብ',
    star_reward_title: 'ናይ መዓልቲ ኮኾብ ሽልማት (15 ዕማማት)',
    star_reward_earned: '15/15 ተፈጺሙ! ሽልማት ድሉው እዩ',
    star_reward_needed: 'ዕማማት ይተርፍ ንኮኾብ',
    claim_star_reward: 'ሽልማት ውሰድ',
    star_diploma: 'ወግዓዊ ናይ ኮኾብ ምስክር ወረቐት',
    close: 'ዕጾ',
    save: 'ኣቐምጥ',
    clear: 'ሓድሽ ጀምር',
    print: 'ኣሕትም',
    language: 'ቋንቋ',
    switch_language: 'ቋንቋ ቀይር',
    wellbeing_schedule: '24 ሰዓታት መደብ መዓልትን ቅሳነትን',
    category_meals: 'መግብን ምግቢ ሰዓትን',
    category_chores: 'ናይ ገዛ ዕማማትን ስራሕን',
    category_homework: 'ዕዮ ገዛን ትምህርትን',
    category_reading: 'ምንባብ መጻሕፍትን',
    category_activity: 'ምንቅስቓስን ስፖርትን',
    category_screentime: 'ስክሪን / ቴሌቪዥን ብልክዕ',
    category_social: 'ማሕበራዊ ርክብን ስድራቤትን',
    category_rest: 'ዕረፍትን ድቃስን',
    word_bank_title: 'ናይ ዕማማት መዝገብ',
    add_custom_task: 'ሓድሽ ዕማም ወስኽ...',
    tasks_completed: 'ዕማማት ተፈጺሞም',
    drag_or_click_hint: 'ንሓደ ዕማም ኣብ ዝደለኻዮ ሰዓት ጠውቕ ወይ ጎትት',
    safe_community_notice: 'ውሑስን ቅሳነት ዘለዎን ባይታ: ዘይግባእ ቃላት ኣይፍቀድን እዩ።',
    reset_game: 'ዳግማይ ጀምር',
    resume_game: 'ቀጽል',
  },

  sv: {
    app_title: 'Human-connection',
    app_tagline: 'Quiz, social glädje och gemenskap',
    start_game: 'STARTA SPEL',
    new_game: 'Nytt spel',
    audience_tv: 'Publik-TV',
    mixer: 'Mixer',
    daily_quests: 'Dagliga uppdrag',
    daily_schedule: 'Dagsplan (24h)',
    print_cards: 'Skriv ut brickor',
    mute: 'Ljud av',
    unmute: 'Ljud på',
    dual_view: '✨ Dubbelvy',
    cards_only: '📋 Brickor',
    stage_only: '🎲 Scen',
    grid_view: 'Rutnät',
    single_card: 'Enkel bricka',
    display_mode: 'Visningsläge',
    numbers: '# Nummer',
    both: 'Båda',
    prompts: 'Glädjeteman',
    game_mode: 'Spelläge',
    mode_all_in_one: 'Allt-i-ett (Scen & Brickor)',
    mode_caller: 'Endast dragare & trumma',
    mode_player: 'Endast spelarbrickor',
    theme: 'Tema',
    theme_classic: 'Klassisk Glädje',
    theme_acts: 'Goda Gärningar',
    theme_memories: 'Varma Minnen',
    theme_gratitude: 'Vardagsglädje',
    theme_ril: 'RIL (Relation & Livsglädje)',
    player_count: 'Antal spelare',
    cards_per_player: 'Brickor per spelare',
    call_next_ball: 'Dra nästa boll',
    scramble_cage: 'Blanda bollarna',
    auto_calling: 'Automatisk dragning',
    auto_calling_active: 'Drager...',
    line_completed: 'Rad klar!',
    bingo_victory: 'BINGO! Grattis!',
    star_reward_badge: 'Stjärnmästare',
    star_reward_title: 'Dagens Stjärnbelöning (15 uppgifter)',
    star_reward_earned: '15/15 Klart! Belöning redo',
    star_reward_needed: 'uppgifter kvar till stjärna',
    claim_star_reward: 'Hämta Stjärnbelöning',
    star_diploma: 'Officiellt Stjärndiplom',
    close: 'Stäng',
    save: 'Spara',
    clear: 'Återställ',
    print: 'Skriv ut',
    language: 'Språk',
    switch_language: 'Byt språk',
    wellbeing_schedule: '24-Timmars Dagsplan & Trivsel',
    category_meals: 'Måltider & Näring',
    category_chores: 'Sysslor & Ordning',
    category_homework: 'Läxor & Studier',
    category_reading: 'Läsning & Böcker',
    category_activity: 'Fysisk Aktivitet',
    category_screentime: 'Hälsosam skärmtid',
    category_social: 'Social samvaro',
    category_rest: 'Vila & Sömn',
    word_bank_title: 'Ord- och Uppgiftsbank',
    add_custom_task: 'Lägg till syssla...',
    tasks_completed: 'uppgifter klara',
    drag_or_click_hint: 'Klicka eller dra en uppgift till önskad timme',
    safe_community_notice: 'Trygg och trivsam miljö: olämpligt innehåll blockeras.',
    reset_game: 'Återställ spel',
    resume_game: 'Återuppta spel',
  },

  de: {
    app_title: 'Human-connection',
    app_tagline: 'Quiz, soziale Freude & Gemeinschaft',
    start_game: 'SPIEL STARTEN',
    new_game: 'Neues Spiel',
    audience_tv: 'Publikums-TV',
    mixer: 'Mixer',
    daily_quests: 'Tägliche Quests',
    daily_schedule: 'Tagesplan (24h)',
    print_cards: 'Karten drucken',
    mute: 'Stummschalten',
    unmute: 'Ton an',
    dual_view: '✨ Dual-Ansicht',
    cards_only: '📋 Karten',
    stage_only: '🎲 Bühne',
    grid_view: 'Gitteransicht',
    single_card: 'Einzelkarte',
    display_mode: 'Anzeigemodus',
    numbers: '# Zahlen',
    both: 'Beides',
    prompts: 'Freudige Impulse',
    game_mode: 'Spielmodus',
    mode_all_in_one: 'Alles-in-Einem',
    mode_caller: 'Nur Ziehungstrommel',
    mode_player: 'Nur Spielerkarten',
    theme: 'Thema',
    theme_classic: 'Klassische Freude',
    theme_acts: 'Gute Taten',
    theme_memories: 'Schöne Erinnerungen',
    theme_gratitude: 'Dankbarkeit',
    theme_ril: 'RIL (Gemeinschaft & Freude)',
    player_count: 'Spieleranzahl',
    cards_per_player: 'Karten pro Spieler',
    call_next_ball: 'Nächsten Ball ziehen',
    scramble_cage: 'Trommel mischen',
    auto_calling: 'Auto-Ziehung',
    auto_calling_active: 'Zieht...',
    line_completed: 'Reihe vollständig!',
    bingo_victory: 'BINGO! Herzlichen Glückwunsch!',
    star_reward_badge: 'Sternenmeister',
    star_reward_title: 'Täglicher Stern-Gewinn (15 Aufgaben)',
    star_reward_earned: '15/15 geschafft! Belohnung bereit',
    star_reward_needed: 'Aufgaben bis zum Stern',
    claim_star_reward: 'Stern-Belohnung einlösen',
    star_diploma: 'Offizielles Sternen-Diplom',
    close: 'Schließen',
    save: 'Speichern',
    clear: 'Zurücksetzen',
    print: 'Drucken',
    language: 'Sprache',
    switch_language: 'Sprache wechseln',
    wellbeing_schedule: '24-Stunden Tages- & Wohlfühlplan',
    category_meals: 'Mahlzeiten & Ernährung',
    category_chores: 'Aufgaben & Ordnung',
    category_homework: 'Hausaufgaben & Lernen',
    category_reading: 'Lesen & Bücher',
    category_activity: 'Aktivität & Sport',
    category_screentime: 'Bildschirmzeit in Maßen',
    category_social: 'Gemeinschaft & Familie',
    category_rest: 'Ruhe & Schlaf',
    word_bank_title: 'Wort- & Aufgabenbank',
    add_custom_task: 'Aufgabe hinzufügen...',
    tasks_completed: 'Aufgaben erledigt',
    drag_or_click_hint: 'Klicke oder ziehe eine Aufgabe in die passende Stunde',
    safe_community_notice: 'Sichere Umgebung: unangemessene Inhalte werden gefiltert.',
    reset_game: 'Spiel zurücksetzen',
    resume_game: 'Spiel fortsetzen',
  },

  es: {
    app_title: 'Human-connection',
    app_tagline: 'Quiz, alegría social y familia',
    start_game: 'INICIAR JUEGO',
    new_game: 'Nuevo juego',
    audience_tv: 'TV para Audiencia',
    mixer: 'Mezclador',
    daily_quests: 'Misiones Diarias',
    daily_schedule: 'Horario Diario (24h)',
    print_cards: 'Imprimir Cartones',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    dual_view: '✨ Vista Dual',
    cards_only: '📋 Cartones',
    stage_only: '🎲 Escenario',
    grid_view: 'Cuadrícula',
    single_card: 'Cartón individual',
    display_mode: 'Modo de visualización',
    numbers: '# Números',
    both: 'Ambos',
    prompts: 'Frases de alegría',
    game_mode: 'Modo de juego',
    mode_all_in_one: 'Todo-en-Uno (Escenario y Cartones)',
    mode_caller: 'Solo Bombo y Cantor',
    mode_player: 'Solo Cartones de Jugador',
    theme: 'Tema',
    theme_classic: 'Alegría Clásica',
    theme_acts: 'Buenas Acciones',
    theme_memories: 'Cálidos Recuerdos',
    theme_gratitude: 'Gratitud Diaria',
    theme_ril: 'RIL (Inclusión y Alegría)',
    player_count: 'Número de jugadores',
    cards_per_player: 'Cartones por jugador',
    call_next_ball: 'Sacar siguiente bola',
    scramble_cage: 'Mezclar bombo',
    auto_calling: 'Sorteo automático',
    auto_calling_active: 'Extrayendo...',
    line_completed: '¡Línea completada!',
    bingo_victory: '¡BINGO! ¡Felicitaciones!',
    star_reward_badge: 'Maestro Estrella',
    star_reward_title: 'Recompensa Estrella Diaria (15 tareas)',
    star_reward_earned: '¡15/15 Completado! Recompensa lista',
    star_reward_needed: 'tareas restantes para la estrella',
    claim_star_reward: 'Reclamar Recompensa',
    star_diploma: 'Diploma Oficial Estrella',
    close: 'Cerrar',
    save: 'Guardar',
    clear: 'Reiniciar',
    print: 'Imprimir',
    language: 'Idioma',
    switch_language: 'Cambiar idioma',
    wellbeing_schedule: 'Horario 24h de Bienestar Diario',
    category_meals: 'Comidas y Nutrición',
    category_chores: 'Tareas del Hogar',
    category_homework: 'Deberes y Estudio',
    category_reading: 'Lectura y Libros',
    category_activity: 'Actividad Física',
    category_screentime: 'Tiempo de Pantalla Moderado',
    category_social: 'Tiempo Social y Familiar',
    category_rest: 'Descanso y Sueño',
    word_bank_title: 'Banco de Tareas',
    add_custom_task: 'Añadir nueva tarea...',
    tasks_completed: 'tareas completadas',
    drag_or_click_hint: 'Haz clic o arrastra una tarea a la hora deseada',
    safe_community_notice: 'Espacio seguro: el contenido inapropiado se bloquea.',
    reset_game: 'Reiniciar partida',
    resume_game: 'Reanudar juego',
  },

  fr: {
    app_title: 'Human-connection',
    app_tagline: 'Quiz, joie sociale et famille',
    start_game: 'COMMENCER LA PARTIE',
    new_game: 'Nouvelle partie',
    audience_tv: 'Écran Public',
    mixer: 'Table de mixage',
    daily_quests: 'Quêtes Quotidiennes',
    daily_schedule: 'Planning 24h & Bien-être',
    print_cards: 'Imprimer les grilles',
    mute: 'Muet',
    unmute: 'Activer son',
    dual_view: '✨ Vue double',
    cards_only: '📋 Grilles',
    stage_only: '🎲 Scène',
    grid_view: 'Grille',
    single_card: 'Carte unique',
    display_mode: "Mode d'affichage",
    numbers: '# Numéros',
    both: 'Les deux',
    prompts: 'Thèmes de joie',
    game_mode: 'Mode de jeu',
    mode_all_in_one: 'Tout-en-un (Scène + Grilles)',
    mode_caller: 'Tirage et Boulier seul',
    mode_player: 'Grilles de joueurs uniquement',
    theme: 'Thème',
    theme_classic: 'Joie Classique',
    theme_acts: 'Bonnes Actions',
    theme_memories: 'Souvenirs Chaleureux',
    theme_gratitude: 'Gratitude Quotidienne',
    theme_ril: 'RIL (Inclusion et Joie)',
    player_count: 'Nombre de joueurs',
    cards_per_player: 'Grilles par joueur',
    call_next_ball: 'Tirer la boule suivante',
    scramble_cage: 'Mélanger le boulier',
    auto_calling: 'Tirage automatique',
    auto_calling_active: 'Tirage en cours...',
    line_completed: 'Ligne complétée !',
    bingo_victory: 'BINGO ! Félicitations !',
    star_reward_badge: 'Maître Étoile',
    star_reward_title: 'Récompense Étoile (15 tâches)',
    star_reward_earned: '15/15 accomplies ! Récompense prête',
    star_reward_needed: 'tâches restantes pour obtenir l’étoile',
    claim_star_reward: 'Réclamer la récompense',
    star_diploma: 'Diplôme Officiel de l’Étoile',
    close: 'Fermer',
    save: 'Enregistrer',
    clear: 'Réinitialiser',
    print: 'Imprimer',
    language: 'Langue',
    switch_language: 'Changer de langue',
    wellbeing_schedule: 'Planning 24h & Bien-être',
    category_meals: 'Repas et Nutrition',
    category_chores: 'Tâches & Rangement',
    category_homework: 'Devoirs & Étude',
    category_reading: 'Lecture & Livres',
    category_activity: 'Activité Physique',
    category_screentime: 'Temps d’écran modéré',
    category_social: 'Famille & Amis',
    category_rest: 'Repos & Sommeil',
    word_bank_title: 'Banque de tâches',
    add_custom_task: 'Ajouter une tâche...',
    tasks_completed: 'tâches accomplies',
    drag_or_click_hint: 'Cliquez ou glissez une tâche sur le créneau horaire',
    safe_community_notice: 'Environnement sain et sécurisé : mots interdits bloqués.',
    reset_game: 'Réinitialiser la partie',
    resume_game: 'Reprendre le jeu',
  },

  ar: {
    app_title: 'Human-connection',
    app_tagline: 'مسابقات وفرح اجتماعي للعائلة',
    start_game: 'ابدأ اللعبة',
    new_game: 'لعبة جديدة',
    audience_tv: 'شاشة الجمهور',
    mixer: 'لوحة التحكم',
    daily_quests: 'مهام اليوم',
    daily_schedule: 'جدول اليوم (24 ساعة)',
    print_cards: 'طباعة البطاقات',
    mute: 'كتم الصوت',
    unmute: 'تشغيل الصوت',
    dual_view: '✨ عرض مزدوج',
    cards_only: '📋 البطاقات',
    stage_only: '🎲 المنصة',
    grid_view: 'شبكة',
    single_card: 'بطاقة واحدة',
    display_mode: 'طريقة العرض',
    numbers: '# الأرقام',
    both: 'كلاهما',
    prompts: 'كلمات الفرح',
    game_mode: 'وضع اللعب',
    mode_all_in_one: 'شامل (المنصة والبطاقات)',
    mode_caller: 'السحب والكرة فقط',
    mode_player: 'بطاقات اللاعب فقط',
    theme: 'الموضوع',
    theme_classic: 'الفرح الكلاسيكي',
    theme_acts: 'أفعال الخير',
    theme_memories: 'ذكريات دافئة',
    theme_gratitude: 'الامتنان اليومي',
    theme_ril: 'RIL (العلاقات وفرح الحياة)',
    player_count: 'عدد اللاعبين',
    cards_per_player: 'بطاقات لكل لاعب',
    call_next_ball: 'اسحب الكرة التالية',
    scramble_cage: 'خلط الكرات',
    auto_calling: 'سحب تلقائي',
    auto_calling_active: 'جاري السحب...',
    line_completed: 'اكتمل الخط!',
    bingo_victory: 'بينغو! ألف مبروك!',
    star_reward_badge: 'سيد النجوم',
    star_reward_title: 'مكافأة النجم اليومي (15 مهمة)',
    star_reward_earned: '15/15 مكتمل! المكافأة جاهزة',
    star_reward_needed: 'مهام متبقية للحصول على النجمة',
    claim_star_reward: 'استلام المكافأة',
    star_diploma: 'شهادة النجمة الذهبية الرسمية',
    close: 'إغلاق',
    save: 'حفظ',
    clear: 'إعادة تعيين',
    print: 'طباعة',
    language: 'اللغة',
    switch_language: 'تغيير اللغة',
    wellbeing_schedule: 'جدول الرفاهية واليوم (24 ساعة)',
    category_meals: 'الوجبات والتغذية',
    category_chores: 'الواجبات المنزلية والترتيب',
    category_homework: 'الدراسة والواجب المدرسي',
    category_reading: 'القراءة والكتب',
    category_activity: 'النشاط البدني والرياضة',
    category_screentime: 'وقت الشاشة المتوازن',
    category_social: 'التواصل الاجتماعي والعائلة',
    category_rest: 'الراحة والنوم',
    word_bank_title: 'بنك الكلمات والمهام',
    add_custom_task: 'إضافة مهمة جديدة...',
    tasks_completed: 'مهام مكتملة',
    drag_or_click_hint: 'انقر أو اسحب مهمة إلى أي ساعة في الجدول',
    safe_community_notice: 'بيئة آمنة وإيجابية: المحتوى غير اللائق محظور تمامًا.',
    reset_game: 'إعادة تعيين اللعبة',
    resume_game: 'استئناف اللعبة',
  },
};

const STORAGE_KEY = 'joypulse_language';

class I18nService {
  private currentLanguage: SupportedLanguage = 'nb';
  private listeners: Set<(lang: SupportedLanguage) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        this.currentLanguage = saved;
      } else {
        // Try to detect user's browser language
        const browserLang = navigator.language?.split('-')[0] as SupportedLanguage;
        if (browserLang && SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
          this.currentLanguage = browserLang;
        } else {
          this.currentLanguage = 'nb'; // Default to Norwegian Bokmål as requested
        }
      }
      this.updateDocumentDirection();

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue && SUPPORTED_LANGUAGES.some((l) => l.code === e.newValue)) {
          const next = e.newValue as SupportedLanguage;
          if (this.currentLanguage !== next) {
            this.currentLanguage = next;
            this.updateDocumentDirection();
            this.notify();
          }
        }
      });
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getLanguageInfo(code: SupportedLanguage = this.currentLanguage): LanguageInfo {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
  }

  public setLanguage(lang: SupportedLanguage) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // localStorage ignore
      }
      this.updateDocumentDirection();
    }
    this.notify();
  }

  public t(key: TranslationKey, fallback?: string): string {
    const dict = TRANSLATIONS[this.currentLanguage];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Norwegian Bokmål then English
    return TRANSLATIONS.nb[key] || TRANSLATIONS.en[key] || fallback || key;
  }

  public subscribe(listener: (lang: SupportedLanguage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }

  private updateDocumentDirection() {
    if (typeof document !== 'undefined') {
      const info = this.getLanguageInfo();
      document.documentElement.dir = info.dir;
      document.documentElement.lang = info.code;
    }
  }
}

export const i18n = new I18nService();

/**
 * React hook for reactive multilingual translations
 */
export function useTranslation() {
  const [lang, setLang] = useState<SupportedLanguage>(i18n.getLanguage());

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLang) => {
      setLang(newLang);
    });
    return unsubscribe;
  }, []);

  const t = (key: TranslationKey, fallback?: string) => i18n.t(key, fallback);

  return {
    lang,
    setLanguage: (newLang: SupportedLanguage) => i18n.setLanguage(newLang),
    t,
    currentInfo: i18n.getLanguageInfo(lang),
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
