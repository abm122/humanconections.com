/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../audio/soundEngine';
import { remoteBingo, RemoteParticipant, HostActivityNotification } from '../services/remoteBingo';
import { moderation } from '../services/moderation';
import { sessionTimer } from '../services/sessionTimer';
import { ownerControl, BannedParticipant } from '../services/ownerControl';
import { socialSocket } from '../services/socialSocket';
import { authService, AuthUser } from '../services/authService';
import { musicBingoService } from '../services/musicBingoService';
import { DigitalMusicBingoBoard } from './DigitalMusicBingoBoard';
import { SupportedLanguage, useTranslation } from '../services/i18n';
import {
  formatMilestoneLabel,
  getBingoUiTexts,
  localizeBingoPattern,
  localizeServerBingoMessage,
} from '../services/bingoUiI18n';

interface RemoteExtraTexts {
  subtitle: string;
  messagesTab: string;
  lockedBadge: string;
  switchBigScreen: string;
  connectedRoomPrefix: string;
  chooseModeHint: string;
  numbersBingoBtn: string;
  musicBingoBtn: string;
  sendMsgHostBtn: string;
  enterCodeHint: string;
  nickLabel: string;
  nickPlaceholder: string;
  kahootTitle: string;
  kahootBody: string;
  wellbeingNote: string;
  joinAction: string;
  hostOnlyLockTitle: string;
  hostOnlyLockDesc: string;
  hostNeedPassDesc: string;
  hostBenefit1: string;
  hostBenefit2: string;
  hostBenefit3: string;
  hostBenefit4: string;
  payHostBtn: string;
  hostProfileLabel: string;
  activePaidBadge: string;
  changeNameBtn: string;
  hostNamePlaceholder: string;
  spillCodePrefix: string;
  leftSuffix: string;
  cloudOpenBadge: string;
  serverOpenBadge: string;
  syncingBadge: string;
  reactivateBtn: string;
  newRoundBtnFull: string;
  generateCodeBtn: string;
  codeOpenAllScreens: string;
  codeHiddenTvClickOpen: string;
  codeMaskedMine: string;
  hideOnMyScreen: string;
  codePrivacyLine: string;
  shareTipPrefix: string;
  realtimeLabel: string;
  kickBtn: string;
  bannedHeader: string;
  autoExpiryNote: string;
  unbanBtn: string;
  banRemainingPrefix: string;
  banMinutesSuffix: string;
  expiredBadge: string;
  msgIntroTitle: string;
  msgIntroBody: string;
  msgEmptyTitle: string;
  msgEmptyHint: string;
  msgHostPlaceholder: string;
  msgPlayerPlaceholder: string;
  sendBtn: string;
  footerBrand: string;
  codeAfterPay: string;
  confirmNewRoundText: string;
  confirmKickText: string;
  confirmYes: string;
  hostLabelSuffix: string;
  youLabel: string;
  badNickErr: string;
  joinFailErr: string;
  connectedNotice: string;
  codeLockedErr: string;
  newCodeNotice: string;
  roundStartedNotice: string;
  kickedNotice: string;
  unbannedNotice: string;
  hostNameUpdated: string;
  codeReactivatedNotice: string;
  marksSuffix: string;
}

const REMOTE_EXTRA: Record<SupportedLanguage, RemoteExtraTexts> = {
  nb: {
    subtitle: 'Spill sammen på avstand fra mobil, PC eller storskjerm',
    messagesTab: 'Meldinger',
    lockedBadge: 'Låst',
    switchBigScreen: 'Bytt til Storskjerm',
    connectedRoomPrefix: 'Du er tilkoblet rom:',
    chooseModeHint: 'Velg om du vil spille vanlig Tallbingo eller Digitalt Musikkbingo-brett!',
    numbersBingoBtn: '🎱 Vanlig Tallbingo',
    musicBingoBtn: '🎵 Musikkbingo-brett',
    sendMsgHostBtn: 'Send melding til arrangør',
    enterCodeHint: 'Fås fra bingoverten, storskjermen eller publikumsvisningen.',
    nickLabel: 'Kallenavn (ingen e-post eller innlogging):',
    nickPlaceholder: 'f.eks. Løve, Stjerne eller Familien Hansen',
    kahootTitle: 'Gratis for barn, familie & gjester:',
    kahootBody: 'Arrangøren har betalt for arrangementet. Du trenger ingen konto, ingen e-post og ingen betaling — tast bare koden og et kallenavn!',
    wellbeingNote: 'Appen er kun for glede og sosialt samvær. Upassende ord eller forstyrrelser tolereres ikke og fører til automatisk 10-minutters utestengelse.',
    joinAction: 'Koble til vertens spillrom (Gratis med kode)',
    hostOnlyLockTitle: 'Kun arrangøren styrer spillrommet og spillkoden',
    hostOnlyLockDesc: 'Du deltar som spiller. Bare arrangøren kan generere spillkoder (1 per runde), trekke kuler og styre rommet.',
    hostNeedPassDesc: 'For å opprette spillrom, få spillkode og arrangere avstandsbingo eller storskjermbingo må verten aktivere spilletid.',
    hostBenefit1: 'Sikker betaling med Visa, Mastercard, Apple Pay eller Google Pay',
    hostBenefit2: '1 unik spillkode per runde',
    hostBenefit3: 'Alle dine deltakere spiller helt gratis med koden din',
    hostBenefit4: 'Deltakere kan sende meldinger direkte til deg som vert',
    payHostBtn: 'Aktiver arrangørtilgang (Kort / Apple Pay / Google Pay)',
    hostProfileLabel: 'Arrangørprofil',
    activePaidBadge: '✓ Aktiv & Betalt',
    changeNameBtn: '✏️ Endre navn',
    hostNamePlaceholder: 'Skriv arrangørnavn...',
    spillCodePrefix: 'Spillkode',
    leftSuffix: 'igjen',
    cloudOpenBadge: '☁️ Åpen overalt (Server + Sky aktiv)',
    serverOpenBadge: '🟢 Aktivert på server for mobil (Bingo & Quiz)',
    syncingBadge: '⏳ Synkroniserer rom med server...',
    reactivateBtn: '🔄 Aktiver på nytt',
    newRoundBtnFull: 'Ny runde (1 ny kode)',
    generateCodeBtn: 'Generer kode',
    codeOpenAllScreens: '📡 Deltakerkode ÅPEN på alle skjermer',
    codeHiddenTvClickOpen: '🔒 Deltakerkode SKJULT på TV (Klikk for å åpne)',
    codeMaskedMine: '🙈 Kode skjult på min skjerm',
    hideOnMyScreen: '🙈 Skjul på min skjerm',
    codePrivacyLine: '📡 Romkoden deles åpent på alle skjermer · Arrangørens private innlogging & fasit er alltid skjult',
    shareTipPrefix: '💡 Del kode eller lenke: Del koden',
    realtimeLabel: 'Sanntid',
    kickBtn: '🚫 Kast ut (10 min)',
    bannedHeader: '🛡️ Midlertidig utestengte',
    autoExpiryNote: '10 min auto-opphør',
    unbanBtn: '✓ Opphev',
    banRemainingPrefix: 'Utestengt i',
    banMinutesSuffix: 'min til',
    expiredBadge: 'Utløpt',
    msgIntroTitle: 'Direktemeldinger med arrangør:',
    msgIntroBody: 'Spillere kan sende spørsmål eller hilse til bingoverten. Verten ser alle meldinger og kan svare direkte.',
    msgEmptyTitle: 'Ingen meldinger ennå.',
    msgEmptyHint: 'Send et spørsmål, hilsen eller be om en allsang til bingoverten!',
    msgHostPlaceholder: 'Svar som bingovert til rommet...',
    msgPlayerPlaceholder: 'Skriv en melding eller hilsen til bingoverten...',
    sendBtn: 'Send',
    footerBrand: 'Avstandsbingo • Sanntidssynkronisering',
    codeAfterPay: 'Kode genereres ved oppstart',
    confirmNewRoundText: 'Starte ny runde? Dette nullstiller trukne kuler og starter en ny runde for hele rommet.',
    confirmKickText: 'Utestenge {name} i 10 minutter for å opprettholde sosial trivsel?',
    confirmYes: 'Ja, bekreft',
    hostLabelSuffix: 'Arrangør',
    youLabel: 'Deg',
    badNickErr: 'Vennligst velg et hyggelig og familievennlig kallenavn.',
    joinFailErr: 'Kunne ikke koble til rommet.',
    connectedNotice: '🎉 Tilkoblet rom {code} som {name}! Kulene synkroniseres direkte fra verten.',
    codeLockedErr: 'Koden genereres kun 1 gang per aktive runde. Start en ny runde for å generere ny kode.',
    newCodeNotice: 'Ny spillkode generert for runden: {code}',
    roundStartedNotice: 'Ny runde startet! Spillkode: {code}',
    kickedNotice: '🚫 {name} ble utestengt i 10 minutter for å bevare sosial trivsel.',
    unbannedNotice: '✅ Utestengelse av {name} ble opphevet. Spilleren kan nå delta igjen!',
    hostNameUpdated: 'Arrangørnavn oppdatert til {name}!',
    codeReactivatedNotice: '🔄 Spillkode {code} synkronisert og aktivert for alle deltakere på mobil!',
    marksSuffix: 'kryss',
  },
  en: {
    subtitle: 'Play together remotely from mobile, PC or big screen',
    messagesTab: 'Messages',
    lockedBadge: 'Locked',
    switchBigScreen: 'Switch to Big Screen',
    connectedRoomPrefix: 'You are connected to room:',
    chooseModeHint: 'Choose whether to play classic Number Bingo or Digital Music Bingo!',
    numbersBingoBtn: '🎱 Classic Number Bingo',
    musicBingoBtn: '🎵 Music Bingo Board',
    sendMsgHostBtn: 'Send message to host',
    enterCodeHint: 'Provided by the host, big screen or audience display.',
    nickLabel: 'Nickname (no email or login required):',
    nickPlaceholder: 'e.g. Lion, Star or Family Hansen',
    kahootTitle: 'Free for kids, family & guests:',
    kahootBody: 'The host has already activated the event. No account, no email and no payment needed — just enter the code and a nickname!',
    wellbeingNote: 'This app is purely for joy and social connection. Inappropriate words or disruptions lead to an automatic 10-minute timeout.',
    joinAction: 'Join Host Room (Free with code)',
    hostOnlyLockTitle: 'Only the host manages the game room and code',
    hostOnlyLockDesc: 'You are joined as a player. Only the host can generate room codes, draw balls and manage the room.',
    hostNeedPassDesc: 'To create a game room, share a code and host remote or big-screen bingo, the host must activate playtime.',
    hostBenefit1: 'Secure payment with Visa, Mastercard, Apple Pay or Google Pay',
    hostBenefit2: '1 unique room code per round',
    hostBenefit3: 'All your participants join completely free using your code',
    hostBenefit4: 'Participants can send direct messages to you as host',
    payHostBtn: 'Activate Host Access (Card / Apple Pay / Google Pay)',
    hostProfileLabel: 'Host Profile',
    activePaidBadge: '✓ Active & Paid',
    changeNameBtn: '✏️ Edit name',
    hostNamePlaceholder: 'Enter host name...',
    spillCodePrefix: 'Game Code',
    leftSuffix: 'left',
    cloudOpenBadge: '☁️ Open everywhere (Server + Cloud active)',
    serverOpenBadge: '🟢 Active on server for mobile (Bingo & Quiz)',
    syncingBadge: '⏳ Syncing room with server...',
    reactivateBtn: '🔄 Reactivate',
    newRoundBtnFull: 'New round (1 new code)',
    generateCodeBtn: 'Generate code',
    codeOpenAllScreens: '📡 Participant code OPEN on all screens',
    codeHiddenTvClickOpen: '🔒 Participant code HIDDEN on TV (Click to show)',
    codeMaskedMine: '🙈 Code hidden on my screen',
    hideOnMyScreen: '🙈 Hide on my screen',
    codePrivacyLine: '📡 Room code is open on all screens · Host login & answers are always private',
    shareTipPrefix: '💡 Share code or link: Share code',
    realtimeLabel: 'Live',
    kickBtn: '🚫 Remove (10 min)',
    bannedHeader: '🛡️ Temporarily removed',
    autoExpiryNote: '10 min auto-expiry',
    unbanBtn: '✓ Restore',
    banRemainingPrefix: 'Timed out for',
    banMinutesSuffix: 'more min',
    expiredBadge: 'Expired',
    msgIntroTitle: 'Direct messages with host:',
    msgIntroBody: 'Players can send questions or greetings to the host. The host sees all messages and can reply directly.',
    msgEmptyTitle: 'No messages yet.',
    msgEmptyHint: 'Send a question, greeting or song request to the host!',
    msgHostPlaceholder: 'Reply as host to the room...',
    msgPlayerPlaceholder: 'Write a message or greeting to the host...',
    sendBtn: 'Send',
    footerBrand: 'Remote Bingo • Real-Time Sync',
    codeAfterPay: 'Code generated on start',
    confirmNewRoundText: 'Start a new round? This resets drawn balls and starts a fresh round for everyone.',
    confirmKickText: 'Temporarily remove {name} for 10 minutes to keep the room welcoming?',
    confirmYes: 'Yes, confirm',
    hostLabelSuffix: 'Host',
    youLabel: 'You',
    badNickErr: 'Please choose a friendly, family-safe nickname.',
    joinFailErr: 'Could not connect to the room.',
    connectedNotice: '🎉 Connected to room {code} as {name}! Balls sync automatically from the host.',
    codeLockedErr: 'The code is generated once per active round. Start a new round for a new code.',
    newCodeNotice: 'New game code generated for this round: {code}',
    roundStartedNotice: 'New round started! Room code: {code}',
    kickedNotice: '🚫 {name} was timed out for 10 minutes.',
    unbannedNotice: '✅ {name} can join again!',
    hostNameUpdated: 'Host name updated to {name}!',
    codeReactivatedNotice: '🔄 Room code {code} synced and active for all mobile players!',
    marksSuffix: 'marks',
  },
  sv: {
    subtitle: 'Spela tillsammans på distans från mobil, dator eller storbildsskärm',
    messagesTab: 'Meddelanden',
    lockedBadge: 'Låst',
    switchBigScreen: 'Byt till Storbild',
    connectedRoomPrefix: 'Du är ansluten till rum:',
    chooseModeHint: 'Välj om du vill spela klassisk sifferbingo eller digital musikbingo!',
    numbersBingoBtn: '🎱 Klassisk Sifferbingo',
    musicBingoBtn: '🎵 Musikbingobricka',
    sendMsgHostBtn: 'Skicka meddelande till värden',
    enterCodeHint: 'Fås från bingovärden eller storbildsskärmen.',
    nickLabel: 'Smeknamn (ingen e-post eller inloggning):',
    nickPlaceholder: 't.ex. Lejon, Stjärna eller Familjen Holm',
    kahootTitle: 'Gratis för barn, familj & gäster:',
    kahootBody: 'Värden har aktiverat evenemanget. Inget konto, ingen e-post och ingen betalning behövs — ange bara koden och ett smeknamn!',
    wellbeingNote: 'Appen är endast för glädje och gemenskap. Olämpliga ord leder till automatisk 10 minuters avstängning.',
    joinAction: 'Anslut till värdens spelrum (Gratis med kod)',
    hostOnlyLockTitle: 'Endast värden styr spelrummet och koden',
    hostOnlyLockDesc: 'Du deltar som spelare. Endast värden kan skapa koder och dra kulor.',
    hostNeedPassDesc: 'För att skapa spelrum och dela kod måste värden aktivera speltid.',
    hostBenefit1: 'Säker betalning med Visa, Mastercard, Apple Pay eller Google Pay',
    hostBenefit2: '1 unik spelkod per runda',
    hostBenefit3: 'Alla deltagare spelar helt gratis med din kod',
    hostBenefit4: 'Deltagare kan skicka meddelanden direkt till dig som värd',
    payHostBtn: 'Aktivera värdåtkomst (Kort / Apple Pay / Google Pay)',
    hostProfileLabel: 'Värdprofil',
    activePaidBadge: '✓ Aktiv & Betald',
    changeNameBtn: '✏️ Ändra namn',
    hostNamePlaceholder: 'Skriv värdnamn...',
    spillCodePrefix: 'Spelkod',
    leftSuffix: 'kvar',
    cloudOpenBadge: '☁️ Öppen överallt (Server + Moln aktiv)',
    serverOpenBadge: '🟢 Aktiverad på server för mobil (Bingo & Quiz)',
    syncingBadge: '⏳ Synkroniserar rum med server...',
    reactivateBtn: '🔄 Aktivera igen',
    newRoundBtnFull: 'Ny runda (1 ny kod)',
    generateCodeBtn: 'Generera kod',
    codeOpenAllScreens: '📡 Deltagarkod ÖPPEN på alla skärmar',
    codeHiddenTvClickOpen: '🔒 Deltagarkod DOLD på TV (Klicka för att visa)',
    codeMaskedMine: '🙈 Kod dold på min skärm',
    hideOnMyScreen: '🙈 Dölj på min skärm',
    codePrivacyLine: '📡 Rumskoden visas öppet · Värdens privata inloggning & facit är alltid dolda',
    shareTipPrefix: '💡 Dela kod eller länk: Dela koden',
    realtimeLabel: 'Realtid',
    kickBtn: '🚫 Ta bort (10 min)',
    bannedHeader: '🛡️ Tillfälligt avstängda',
    autoExpiryNote: '10 min auto-upphörande',
    unbanBtn: '✓ Återställ',
    banRemainingPrefix: 'Avstängd i',
    banMinutesSuffix: 'min kvar',
    expiredBadge: 'Utgången',
    msgIntroTitle: 'Direktmeddelanden med värden:',
    msgIntroBody: 'Spelare kan skicka frågor eller hälsningar till bingovärden.',
    msgEmptyTitle: 'Inga meddelanden än.',
    msgEmptyHint: 'Skicka en fråga eller hälsning till värden!',
    msgHostPlaceholder: 'Svara som värd till rummet...',
    msgPlayerPlaceholder: 'Skriv ett meddelande till värden...',
    sendBtn: 'Skicka',
    footerBrand: 'Distansbingo • Realtidssynk',
    codeAfterPay: 'Kod skapas vid start',
    confirmNewRoundText: 'Starta ny runda? Detta återställer dragna kulor och startar en ny runda för alla.',
    confirmKickText: 'Stänga av {name} i 10 minuter för att bevara trivseln?',
    confirmYes: 'Ja, bekräfta',
    hostLabelSuffix: 'Värd',
    youLabel: 'Du',
    badNickErr: 'Vänligen välj ett trevligt och familjevänligt smeknamn.',
    joinFailErr: 'Kunde inte ansluta till rummet.',
    connectedNotice: '🎉 Ansluten till rum {code} som {name}! Kulorna synkas automatiskt.',
    codeLockedErr: 'Koden skapas bara en gång per runda. Starta ny runda för ny kod.',
    newCodeNotice: 'Ny spelkod skapad: {code}',
    roundStartedNotice: 'Ny runda startad! Kod: {code}',
    kickedNotice: '🚫 {name} stängdes av i 10 minuter.',
    unbannedNotice: '✅ Avstängning för {name} hävd!',
    hostNameUpdated: 'Värdnamn uppdaterat till {name}!',
    codeReactivatedNotice: '🔄 Spelkod {code} synkad för alla mobiler!',
    marksSuffix: 'kryss',
  },
  de: {
    subtitle: 'Gemeinsam aus der Ferne per Smartphone, PC oder Großbildschirm spielen',
    messagesTab: 'Nachrichten',
    lockedBadge: 'Gesperrt',
    switchBigScreen: 'Zum Großbildschirm',
    connectedRoomPrefix: 'Verbunden mit Raum:',
    chooseModeHint: 'Wähle klassisches Zahlen-Bingo oder Digitales Musik-Bingo!',
    numbersBingoBtn: '🎱 Klassisches Zahlen-Bingo',
    musicBingoBtn: '🎵 Musik-Bingo-Karte',
    sendMsgHostBtn: 'Nachricht an Host senden',
    enterCodeHint: 'Vom Gastgeber oder auf dem Großbildschirm bereitgestellt.',
    nickLabel: 'Spitzname (keine E-Mail oder Anmeldung):',
    nickPlaceholder: 'z.B. Löwe, Stern oder Familie Müller',
    kahootTitle: 'Kostenlos für Kinder, Familie & Gäste:',
    kahootBody: 'Der Gastgeber hat die Veranstaltung freigeschaltet. Kein Konto, keine E-Mail und keine Zahlung nötig — einfach Code und Namen eingeben!',
    wellbeingNote: 'Diese App dient nur der Freude und Gemeinschaft. Unangemessene Wörter führen zu einer automatischen 10-Minuten-Pause.',
    joinAction: 'Spielraum beitreten (Kostenlos mit Code)',
    hostOnlyLockTitle: 'Nur der Gastgeber verwaltet Raum und Code',
    hostOnlyLockDesc: 'Du spielst als Gast. Nur der Gastgeber kann Codes erstellen und Kugeln ziehen.',
    hostNeedPassDesc: 'Zum Erstellen eines Spielraums muss der Gastgeber Spielzeit aktivieren.',
    hostBenefit1: 'Sichere Zahlung mit Visa, Mastercard, Apple Pay oder Google Pay',
    hostBenefit2: '1 eindeutiger Raumcode pro Runde',
    hostBenefit3: 'Alle Teilnehmer spielen völlig kostenlos mit deinem Code',
    hostBenefit4: 'Teilnehmer können dir direkt Nachrichten senden',
    payHostBtn: 'Host-Zugang aktivieren (Karte / Apple Pay / Google Pay)',
    hostProfileLabel: 'Host-Profil',
    activePaidBadge: '✓ Aktiv & Bezahlt',
    changeNameBtn: '✏️ Name ändern',
    hostNamePlaceholder: 'Host-Name eingeben...',
    spillCodePrefix: 'Spielcode',
    leftSuffix: 'übrig',
    cloudOpenBadge: '☁️ Überall offen (Server + Cloud aktiv)',
    serverOpenBadge: '🟢 Auf Server für Mobilgeräte aktiv (Bingo & Quiz)',
    syncingBadge: '⏳ Raum wird synchronisiert...',
    reactivateBtn: '🔄 Neu aktivieren',
    newRoundBtnFull: 'Neue Runde (1 neuer Code)',
    generateCodeBtn: 'Code erzeugen',
    codeOpenAllScreens: '📡 Teilnehmercode auf allen Bildschirmen SICHTBAR',
    codeHiddenTvClickOpen: '🔒 Teilnehmercode auf TV VERBORGEN (Klicken zum Öffnen)',
    codeMaskedMine: '🙈 Code auf meinem Bildschirm verborgen',
    hideOnMyScreen: '🙈 Auf meinem Bildschirm verbergen',
    codePrivacyLine: '📡 Raumcode ist offen · Host-Login & Lösungen bleiben immer privat',
    shareTipPrefix: '💡 Code oder Link teilen: Code teilen',
    realtimeLabel: 'Echtzeit',
    kickBtn: '🚫 Entfernen (10 Min)',
    bannedHeader: '🛡️ Vorübergehend gesperrt',
    autoExpiryNote: '10 Min. Auto-Ablauf',
    unbanBtn: '✓ Aufheben',
    banRemainingPrefix: 'Gesperrt für',
    banMinutesSuffix: 'Min',
    expiredBadge: 'Abgelaufen',
    msgIntroTitle: 'Direktnachrichten mit dem Gastgeber:',
    msgIntroBody: 'Spieler können Fragen oder Grüße senden. Der Gastgeber kann direkt antworten.',
    msgEmptyTitle: 'Noch keine Nachrichten.',
    msgEmptyHint: 'Sende eine Frage oder einen Gruß an den Gastgeber!',
    msgHostPlaceholder: 'Als Gastgeber an den Raum antworten...',
    msgPlayerPlaceholder: 'Nachricht an den Gastgeber schreiben...',
    sendBtn: 'Senden',
    footerBrand: 'Fern-Bingo • Echtzeit-Sync',
    codeAfterPay: 'Code wird beim Start erstellt',
    confirmNewRoundText: 'Neue Runde starten? Gezogene Kugeln werden zurückgesetzt.',
    confirmKickText: '{name} für 10 Minuten aus dem Raum entfernen?',
    confirmYes: 'Ja, bestätigen',
    hostLabelSuffix: 'Host',
    youLabel: 'Du',
    badNickErr: 'Bitte wähle einen freundlichen Spitznamen.',
    joinFailErr: 'Verbindung zum Raum fehlgeschlagen.',
    connectedNotice: '🎉 Mit Raum {code} als {name} verbunden!',
    codeLockedErr: 'Pro aktiver Runde wird nur 1 Code erstellt. Starte eine neue Runde.',
    newCodeNotice: 'Neuer Spielcode: {code}',
    roundStartedNotice: 'Neue Runde gestartet! Code: {code}',
    kickedNotice: '🚫 {name} wurde für 10 Minuten entfernt.',
    unbannedNotice: '✅ Sperre für {name} aufgehoben!',
    hostNameUpdated: 'Host-Name auf {name} aktualisiert!',
    codeReactivatedNotice: '🔄 Raumcode {code} für alle Geräte synchronisiert!',
    marksSuffix: 'Treffer',
  },
  es: {
    subtitle: 'Juega a distancia desde móvil, PC o pantalla grande',
    messagesTab: 'Mensajes',
    lockedBadge: 'Bloqueado',
    switchBigScreen: 'Ir a Pantalla Grande',
    connectedRoomPrefix: 'Conectado a la sala:',
    chooseModeHint: '¡Elige Bingo clásico de números o Bingo Musical digital!',
    numbersBingoBtn: '🎱 Bingo Clásico',
    musicBingoBtn: '🎵 Bingo Musical',
    sendMsgHostBtn: 'Enviar mensaje al anfitrión',
    enterCodeHint: 'Proporcionado por el anfitrión o en la pantalla grande.',
    nickLabel: 'Apodo (sin correo ni registro):',
    nickPlaceholder: 'ej. León, Estrella o Familia García',
    kahootTitle: 'Gratis para niños, familia e invitados:',
    kahootBody: 'El anfitrión ya activó el evento. No necesitas cuenta ni pago — ¡solo ingresa el código y tu apodo!',
    wellbeingNote: 'Esta app es solo para alegría y convivencia. Palabras inapropiadas causan una pausa automática de 10 minutos.',
    joinAction: 'Unirse a la sala (Gratis con código)',
    hostOnlyLockTitle: 'Solo el anfitrión controla la sala y el código',
    hostOnlyLockDesc: 'Participas como jugador. Solo el anfitrión puede generar códigos y sacar bolas.',
    hostNeedPassDesc: 'Para crear una sala, el anfitrión debe activar tiempo de juego.',
    hostBenefit1: 'Pago seguro con Visa, Mastercard, Apple Pay o Google Pay',
    hostBenefit2: '1 código único por ronda',
    hostBenefit3: 'Todos tus participantes juegan gratis con tu código',
    hostBenefit4: 'Los participantes pueden enviarte mensajes directos',
    payHostBtn: 'Activar acceso de anfitrión (Tarjeta / Apple Pay / Google Pay)',
    hostProfileLabel: 'Perfil del anfitrión',
    activePaidBadge: '✓ Activo y Pagado',
    changeNameBtn: '✏️ Cambiar nombre',
    hostNamePlaceholder: 'Nombre del anfitrión...',
    spillCodePrefix: 'Código',
    leftSuffix: 'restante',
    cloudOpenBadge: '☁️ Abierto en todas partes (Servidor + Nube)',
    serverOpenBadge: '🟢 Activo en servidor para móvil (Bingo y Quiz)',
    syncingBadge: '⏳ Sincronizando sala...',
    reactivateBtn: '🔄 Reactivar',
    newRoundBtnFull: 'Nueva ronda (1 nuevo código)',
    generateCodeBtn: 'Generar código',
    codeOpenAllScreens: '📡 Código VISIBLE en todas las pantallas',
    codeHiddenTvClickOpen: '🔒 Código OCULTO en TV (Clic para mostrar)',
    codeMaskedMine: '🙈 Código oculto en mi pantalla',
    hideOnMyScreen: '🙈 Ocultar en mi pantalla',
    codePrivacyLine: '📡 El código es visible en pantallas · El acceso del anfitrión siempre es privado',
    shareTipPrefix: '💡 Comparte código o enlace: Código',
    realtimeLabel: 'En vivo',
    kickBtn: '🚫 Retirar (10 min)',
    bannedHeader: '🛡️ Suspendidos temporalmente',
    autoExpiryNote: 'Expira en 10 min',
    unbanBtn: '✓ Restaurar',
    banRemainingPrefix: 'Suspendido por',
    banMinutesSuffix: 'min más',
    expiredBadge: 'Expirado',
    msgIntroTitle: 'Mensajes directos con el anfitrión:',
    msgIntroBody: 'Los jugadores pueden enviar saludos o preguntas al anfitrión.',
    msgEmptyTitle: 'Sin mensajes todavía.',
    msgEmptyHint: '¡Envía una pregunta o saludo al anfitrión!',
    msgHostPlaceholder: 'Responder a la sala como anfitrión...',
    msgPlayerPlaceholder: 'Escribe un mensaje al anfitrión...',
    sendBtn: 'Enviar',
    footerBrand: 'Bingo a Distancia • En Tiempo Real',
    codeAfterPay: 'Código generado al iniciar',
    confirmNewRoundText: '¿Iniciar nueva ronda? Esto reinicia las bolas sacadas para toda la sala.',
    confirmKickText: '¿Retirar a {name} durante 10 minutos para mantener un ambiente amable?',
    confirmYes: 'Sí, confirmar',
    hostLabelSuffix: 'Anfitrión',
    youLabel: 'Tú',
    badNickErr: 'Por favor elige un apodo amigable.',
    joinFailErr: 'No se pudo conectar a la sala.',
    connectedNotice: '🎉 ¡Conectado a la sala {code} como {name}!',
    codeLockedErr: 'El código se genera una vez por ronda activa.',
    newCodeNotice: 'Nuevo código generado: {code}',
    roundStartedNotice: '¡Nueva ronda iniciada! Código: {code}',
    kickedNotice: '🚫 {name} fue retirado por 10 minutos.',
    unbannedNotice: '✅ ¡{name} puede volver a entrar!',
    hostNameUpdated: '¡Nombre actualizado a {name}!',
    codeReactivatedNotice: '🔄 ¡Código {code} sincronizado para todos!',
    marksSuffix: 'marcas',
  },
  fr: {
    subtitle: 'Jouez ensemble à distance sur mobile, PC ou grand écran',
    messagesTab: 'Messages',
    lockedBadge: 'Verrouillé',
    switchBigScreen: 'Passer au Grand Écran',
    connectedRoomPrefix: 'Connecté à la salle :',
    chooseModeHint: 'Choisissez le Bingo classique ou le Bingo Musical numérique !',
    numbersBingoBtn: '🎱 Bingo Classique',
    musicBingoBtn: '🎵 Grille Bingo Musical',
    sendMsgHostBtn: 'Envoyer un message à l’hôte',
    enterCodeHint: 'Fourni par l’animateur ou sur le grand écran.',
    nickLabel: 'Pseudo (sans e-mail ni connexion) :',
    nickPlaceholder: 'ex. Lion, Étoile ou Famille Martin',
    kahootTitle: 'Gratuit pour enfants, famille & invités :',
    kahootBody: 'L’hôte a activé l’événement. Aucun compte ni paiement requis — entrez simplement le code et un pseudo !',
    wellbeingNote: 'Cette app est dédiée à la joie et au partage. Tout comportement inapproprié entraîne une pause automatique de 10 minutes.',
    joinAction: 'Rejoindre la salle (Gratuit avec code)',
    hostOnlyLockTitle: 'Seul l’hôte gère la salle et le code',
    hostOnlyLockDesc: 'Vous jouez en tant que participant. Seul l’hôte peut générer des codes et tirer les boules.',
    hostNeedPassDesc: 'Pour créer une salle et partager un code, l’hôte doit activer du temps de jeu.',
    hostBenefit1: 'Paiement sécurisé par Visa, Mastercard, Apple Pay ou Google Pay',
    hostBenefit2: '1 code unique par manche',
    hostBenefit3: 'Tous vos participants jouent gratuitement avec votre code',
    hostBenefit4: 'Les participants peuvent vous envoyer des messages directs',
    payHostBtn: 'Activer l’accès hôte (Carte / Apple Pay / Google Pay)',
    hostProfileLabel: 'Profil Hôte',
    activePaidBadge: '✓ Actif & Payé',
    changeNameBtn: '✏️ Modifier nom',
    hostNamePlaceholder: 'Nom de l’hôte...',
    spillCodePrefix: 'Code',
    leftSuffix: 'restant',
    cloudOpenBadge: '☁️ Ouvert partout (Serveur + Cloud)',
    serverOpenBadge: '🟢 Actif sur serveur mobile (Bingo & Quiz)',
    syncingBadge: '⏳ Synchronisation en cours...',
    reactivateBtn: '🔄 Réactiver',
    newRoundBtnFull: 'Nouvelle manche (1 nouveau code)',
    generateCodeBtn: 'Générer code',
    codeOpenAllScreens: '📡 Code participant VISIBLE sur tous les écrans',
    codeHiddenTvClickOpen: '🔒 Code participant MASQUÉ sur TV (Cliquer pour afficher)',
    codeMaskedMine: '🙈 Code masqué sur mon écran',
    hideOnMyScreen: '🙈 Masquer sur mon écran',
    codePrivacyLine: '📡 Le code est public · La connexion de l’hôte reste privée',
    shareTipPrefix: '💡 Partager code ou lien : Code',
    realtimeLabel: 'En direct',
    kickBtn: '🚫 Retirer (10 min)',
    bannedHeader: '🛡️ Exclus temporairement',
    autoExpiryNote: 'Expiration 10 min',
    unbanBtn: '✓ Rétablir',
    banRemainingPrefix: 'Exclu pour encore',
    banMinutesSuffix: 'min',
    expiredBadge: 'Expiré',
    msgIntroTitle: 'Messages directs avec l’hôte :',
    msgIntroBody: 'Les joueurs peuvent envoyer des questions ou salutations à l’hôte.',
    msgEmptyTitle: 'Aucun message pour l’instant.',
    msgEmptyHint: 'Envoyez une question ou un mot amical à l’hôte !',
    msgHostPlaceholder: 'Répondre à la salle en tant qu’hôte...',
    msgPlayerPlaceholder: 'Écrire un message à l’hôte...',
    sendBtn: 'Envoyer',
    footerBrand: 'Bingo à Distance • Sync en direct',
    codeAfterPay: 'Code généré au lancement',
    confirmNewRoundText: 'Lancer une nouvelle manche ? Cela réinitialise les boules tirées.',
    confirmKickText: 'Retirer {name} pendant 10 minutes pour préserver la convivialité ?',
    confirmYes: 'Oui, confirmer',
    hostLabelSuffix: 'Hôte',
    youLabel: 'Vous',
    badNickErr: 'Veuillez choisir un pseudo convivial.',
    joinFailErr: 'Impossible de rejoindre la salle.',
    connectedNotice: '🎉 Connecté à la salle {code} en tant que {name} !',
    codeLockedErr: 'Un seul code est généré par manche active.',
    newCodeNotice: 'Nouveau code généré : {code}',
    roundStartedNotice: 'Nouvelle manche lancée ! Code : {code}',
    kickedNotice: '🚫 {name} a été exclu pour 10 minutes.',
    unbannedNotice: '✅ {name} peut rejoindre à nouveau !',
    hostNameUpdated: 'Nom d’hôte mis à jour : {name} !',
    codeReactivatedNotice: '🔄 Code {code} synchronisé pour tous !',
    marksSuffix: 'cochés',
  },
  ti: {
    subtitle: 'ካብ ሞባይል፡ ኮምፒዩተር ወይ ዓቢ ስክሪን ብርሑቕ ብሓባር ተጻወቱ',
    messagesTab: 'መልእኽትታት',
    lockedBadge: 'ዕጹው',
    switchBigScreen: 'ናብ ዓቢ ስክሪን ቀይር',
    connectedRoomPrefix: 'ናብዚ ክፍሊ ተራኺብካ ኣለኻ:',
    chooseModeHint: 'ንቡር ቁጽሪ ቢንጎ ወይ ዲጂታል ሙዚቃ ቢንጎ ምረጽ!',
    numbersBingoBtn: '🎱 ንቡር ቁጽሪ ቢንጎ',
    musicBingoBtn: '🎵 ሙዚቃ ቢንጎ ቦርድ',
    sendMsgHostBtn: 'ንመራሒ መልእኽቲ ስደድ',
    enterCodeHint: 'ካብ መራሒ ወይ ዓቢ ስክሪን ዝርከብ ኮድ።',
    nickLabel: 'ሳጓ (ኢመይል ወይ ምዝገባ ኣየድልን):',
    nickPlaceholder: 'ንኣብነት: ኣንበሳ ወይ ስድራ ቤት',
    kahootTitle: 'ንህጻናት፡ ስድራን ኣጋይሽን ብነጻ:',
    kahootBody: 'መራሒ ነቲ መደብ ከፊትዎ ኣሎ። ኣካውንት ወይ ክፍሊት ኣየድልን — ኮድን ስምን ጥራይ ኣእቱ!',
    wellbeingNote: 'እዛ ኣፕ ንሓጎስን ማሕበራዊ ምትእኽኻብን ጥራይ እያ። ዘይግባእ ቃላት ን10 ደቂቕ የእግድ።',
    joinAction: 'ናብ ክፍሊ ጸወታ እቶ (ብነጻ)',
    hostOnlyLockTitle: 'መራሒ ጥራይ እዩ ነዚ ክፍሊ ዘመሓድሮ',
    hostOnlyLockDesc: 'ከም ተሳታፊ ትጻወት ኣለኻ። መራሒ ጥራይ ኮድ ይፈጥርን ኩዕሶ የውጽእን።',
    hostNeedPassDesc: 'ክፍሊ ንምፍጣር መራሒ ግዜ ጸወታ ከንቅሕ ኣለዎ።',
    hostBenefit1: 'ውሑስ ክፍሊት ብ Visa, Mastercard, Apple Pay ወይ Google Pay',
    hostBenefit2: '1 ፍሉይ ኮድ ንነፍሲ ወከፍ ዙር',
    hostBenefit3: 'ኩሎም ተሳተፍቲ ብኮድካ ብነጻ ይጻወቱ',
    hostBenefit4: 'ተሳተፍቲ ብቀጥታ መልእኽቲ ክሰዱልካ ይኽእሉ',
    payHostBtn: 'ፍቓድ መራሒ ኣንቅሕ',
    hostProfileLabel: 'መንነት መራሒ',
    activePaidBadge: '✓ ንጡፍ',
    changeNameBtn: '✏️ ስም ቀይር',
    hostNamePlaceholder: 'ስም መራሒ...',
    spillCodePrefix: 'ኮድ ጸወታ',
    leftSuffix: 'ተሪፉ',
    cloudOpenBadge: '☁️ ኣብ ኩሉ ክፉት (ሰርቨር + ክላውድ)',
    serverOpenBadge: '🟢 ንሞባይል ንጡፍ (ቢንጎን ኩዊዝን)',
    syncingBadge: '⏳ ምስ ሰርቨር ይራኸብ ኣሎ...',
    reactivateBtn: '🔄 ደጊምካ ኣንቅሕ',
    newRoundBtnFull: 'ሓድሽ ዙር (1 ሓድሽ ኮድ)',
    generateCodeBtn: 'ኮድ ፍጠር',
    codeOpenAllScreens: '📡 ኮድ ተሳተፍቲ ኣብ ኩሉ ስክሪን ክፉት',
    codeHiddenTvClickOpen: '🔒 ኮድ ኣብ ቲቪ ተሓቢኡ (ንምርኣይ ጠውቕ)',
    codeMaskedMine: '🙈 ኮድ ኣብ ስክሪነይ ተሓቢኡ',
    hideOnMyScreen: '🙈 ኣብ ስክሪነይ ሕባእ',
    codePrivacyLine: '📡 ኮድ ክፍሊ ክፉት እዩ · ውልቃዊ መእተዊ መራሒ ኩሉ ግዜ ሕቡእ እዩ',
    shareTipPrefix: '💡 ኮድ ወይ ሊንክ ኣካፍል: ኮድ',
    realtimeLabel: 'ቀጥታ',
    kickBtn: '🚫 ኣውጽእ (10 ደቂቕ)',
    bannedHeader: '🛡️ ንግዚኡ ዝተኣገዱ',
    autoExpiryNote: '10 ደቂቕ',
    unbanBtn: '✓ ምለስ',
    banRemainingPrefix: 'ተኣጊዱ ን',
    banMinutesSuffix: 'ደቂቕ',
    expiredBadge: 'ወዲኡ',
    msgIntroTitle: 'ቀጥታ መልእኽቲ ምስ መራሒ:',
    msgIntroBody: 'ተጻወትቲ ሕቶታት ወይ ሰላምታ ንመራሒ ክሰዱ ይኽእሉ።',
    msgEmptyTitle: 'ክሳብ ሕጂ መልእኽቲ የለን።',
    msgEmptyHint: 'ንመራሒ ሕቶ ወይ ሰላምታ ስደድ!',
    msgHostPlaceholder: 'ከም መራሒ ንክፍሊ መልስ...',
    msgPlayerPlaceholder: 'ንመራሒ መልእኽቲ ጽሓፍ...',
    sendBtn: 'ስደድ',
    footerBrand: 'ርሑቕ ቢንጎ • ቀጥታ ምትእስሳር',
    codeAfterPay: 'ምስ ጀመረ ኮድ ይፍጠር',
    confirmNewRoundText: 'ሓድሽ ዙር ክጅምር? ዝተሳሕቡ ኩዕሶታት ይጸርዩ።',
    confirmKickText: 'ን {name} ን10 ደቂቕ ካብ ክፍሊ ክተውጽኦ?',
    confirmYes: 'እወ፡ ኣረጋግጽ',
    hostLabelSuffix: 'መራሒ',
    youLabel: 'ንስኻ',
    badNickErr: 'በጃኻ ጽቡቕ ሳጓ ምረጽ።',
    joinFailErr: 'ናብ ክፍሊ ክራኸብ ኣይከኣለን።',
    connectedNotice: '🎉 ናብ ክፍሊ {code} ከም {name} ተራኺብካ!',
    codeLockedErr: 'ኣብ ሓደ ዙር ሓደ ኮድ ጥራይ ይፍጠር።',
    newCodeNotice: 'ሓድሽ ኮድ: {code}',
    roundStartedNotice: 'ሓድሽ ዙር ጀሚሩ! ኮድ: {code}',
    kickedNotice: '🚫 {name} ን10 ደቂቕ ተኣጊዱ።',
    unbannedNotice: '✅ {name} እንደገና ክኣቱ ይኽእል!',
    hostNameUpdated: 'ስም መራሒ ናብ {name} ተቀዪሩ!',
    codeReactivatedNotice: '🔄 ኮድ {code} ንኹሎም ተራኺቡ!',
    marksSuffix: 'ምልክት',
  },
  ar: {
    subtitle: 'العبوا معًا عن بُعد من الهاتف أو الكمبيوتر أو الشاشة الكبيرة',
    messagesTab: 'الرسائل',
    lockedBadge: 'مقفل',
    switchBigScreen: 'التبديل إلى الشاشة الكبيرة',
    connectedRoomPrefix: 'أنت متصل بالغرفة:',
    chooseModeHint: 'اختر اللعب بالبينغو الكلاسيكي بالأرقام أو بينغو الموسيقى الرقمي!',
    numbersBingoBtn: '🎱 بينغو الأرقام الكلاسيكي',
    musicBingoBtn: '🎵 لوحة بينغو الموسيقى',
    sendMsgHostBtn: 'إرسال رسالة إلى المنظم',
    enterCodeHint: 'يتم الحصول عليه من المنظم أو الشاشة الكبيرة.',
    nickLabel: 'الاسم المستعار (بدون بريد إلكتروني أو تسجيل):',
    nickPlaceholder: 'مثال: الأسد، النجم، أو عائلة حسن',
    kahootTitle: 'مجاني للأطفال والعائلة والضيوف:',
    kahootBody: 'قام المنظم بتفعيل الفعالية. لا حاجة لحساب أو بريد أو دفع — فقط أدخل الرمز واسمك!',
    wellbeingNote: 'هذا التطبيق للمتعة والتواصل الاجتماعي فقط. الكلمات غير اللائقة تؤدي إلى إيقاف تلقائي لمدة 10 دقائق.',
    joinAction: 'الانضمام لغرفة المنظم (مجانًا بالرمز)',
    hostOnlyLockTitle: 'المنظم فقط يدير الغرفة والرمز',
    hostOnlyLockDesc: 'أنت تشارك كلاعب. المنظم فقط يمكنه إنشاء الرموز وسحب الكرات.',
    hostNeedPassDesc: 'لإنشاء غرفة ومشاركة رمز، يجب على المنظم تفعيل وقت اللعب.',
    hostBenefit1: 'دفع آمن عبر Visa وMastercard وApple Pay وGoogle Pay',
    hostBenefit2: 'رمز فريد واحد لكل جولة',
    hostBenefit3: 'جميع المشاركين يلعبون مجانًا برمزك',
    hostBenefit4: 'يمكن للمشاركين إرسال رسائل مباشرة إليك',
    payHostBtn: 'تفعيل صلاحية المنظم (بطاقة / Apple Pay / Google Pay)',
    hostProfileLabel: 'ملف المنظم',
    activePaidBadge: '✓ نشط ومدفوع',
    changeNameBtn: '✏️ تعديل الاسم',
    hostNamePlaceholder: 'أدخل اسم المنظم...',
    spillCodePrefix: 'رمز اللعبة',
    leftSuffix: 'متبقي',
    cloudOpenBadge: '☁️ متاح في كل مكان (الخادم + السحابة)',
    serverOpenBadge: '🟢 مفعّل على الخادم للجوال (بينغو وكويز)',
    syncingBadge: '⏳ جاري مزامنة الغرفة...',
    reactivateBtn: '🔄 إعادة تفعيل',
    newRoundBtnFull: 'جولة جديدة (رمز جديد)',
    generateCodeBtn: 'إنشاء رمز',
    codeOpenAllScreens: '📡 رمز المشاركين ظاهر على كل الشاشات',
    codeHiddenTvClickOpen: '🔒 رمز المشاركين مخفي على التلفاز (اضغط للفتح)',
    codeMaskedMine: '🙈 الرمز مخفي على شاشتي',
    hideOnMyScreen: '🙈 إخفاء على شاشتي',
    codePrivacyLine: '📡 رمز الغرفة مفتوح للجميع · دخول المنظم والإجابات خاصة دائمًا',
    shareTipPrefix: '💡 شارك الرمز أو الرابط: الرمز',
    realtimeLabel: 'مباشر',
    kickBtn: '🚫 إبعاد (10 دقائق)',
    bannedHeader: '🛡️ الموقوفون مؤقتًا',
    autoExpiryNote: 'ينتهي تلقائيًا بعد 10 دقائق',
    unbanBtn: '✓ رفع الإيقاف',
    banRemainingPrefix: 'متوقف لمدة',
    banMinutesSuffix: 'دقيقة أخرى',
    expiredBadge: 'منتهي',
    msgIntroTitle: 'رسائل مباشرة مع المنظم:',
    msgIntroBody: 'يمكن للاعبين إرسال أسئلة أو تحيات للمنظم والرد مباشرة.',
    msgEmptyTitle: 'لا توجد رسائل بعد.',
    msgEmptyHint: 'أرسل سؤالاً أو تحية للمنظم!',
    msgHostPlaceholder: 'الرد كمنظم على الغرفة...',
    msgPlayerPlaceholder: 'اكتب رسالة للمنظم...',
    sendBtn: 'إرسال',
    footerBrand: 'بينغو عن بُعد • مزامنة فورية',
    codeAfterPay: 'يتم إنشاء الرمز عند البدء',
    confirmNewRoundText: 'بدء جولة جديدة؟ سيتم تصفير الكرات المسحوبة للغرفة بأكملها.',
    confirmKickText: 'هل تريد إبعاد {name} لمدة 10 دقائق للحفاظ على الأجواء الإيجابية؟',
    confirmYes: 'نعم، تأكيد',
    hostLabelSuffix: 'المنظم',
    youLabel: 'أنت',
    badNickErr: 'يرجى اختيار اسم لطيف ومناسب للعائلة.',
    joinFailErr: 'تعذر الاتصال بالغرفة.',
    connectedNotice: '🎉 تم الاتصال بالغرفة {code} باسم {name}!',
    codeLockedErr: 'يتم إنشاء رمز واحد فقط لكل جولة نشطة.',
    newCodeNotice: 'تم إنشاء رمز جديد: {code}',
    roundStartedNotice: 'بدأت جولة جديدة! الرمز: {code}',
    kickedNotice: '🚫 تم إبعاد {name} لمدة 10 دقائق.',
    unbannedNotice: '✅ تم رفع الإيقاف عن {name}!',
    hostNameUpdated: 'تم تحديث اسم المنظم إلى {name}!',
    codeReactivatedNotice: '🔄 تمت مزامنة الرمز {code} للجميع!',
    marksSuffix: 'علامات',
  },
};

export interface HostMessageItem {
  id: string;
  senderId?: string;
  senderName: string;
  senderColor?: string;
  text: string;
  timestamp: number;
  isHostReply?: boolean;
}

interface RemoteBingoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHostPlaying?: boolean;
  initialJoinCode?: string;
  onJoinedAsRemotePlayer?: (code: string, name: string) => void;
  onOpenVippsModal?: () => void;
  onSwitchToBigScreen?: () => void;
  onOpenTvMode?: (game: 'bingo' | 'quiz', code: string) => void;
  onStartNewRound?: () => void;
}

export const RemoteBingoModal: React.FC<RemoteBingoModalProps> = ({
  isOpen,
  onClose,
  isHostPlaying = false,
  initialJoinCode,
  onJoinedAsRemotePlayer,
  onOpenVippsModal,
  onSwitchToBigScreen,
  onOpenTvMode,
  onStartNewRound,
}) => {
  const { lang } = useTranslation();
  const ui = getBingoUiTexts(lang);
  const ex = REMOTE_EXTRA[lang] || REMOTE_EXTRA.nb;
  const langRef = useRef(lang);
  langRef.current = lang;

  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const isOwnerNow = ownerControl.isUnlocked();
  const [hasPaid, setHasPaid] = useState<boolean>(
    () => !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || isOwnerNow)
  );
  const [activeTab, setActiveTab] = useState<'join' | 'host' | 'messages'>(
    !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || isOwnerNow)
      ? 'host'
      : 'join'
  );
  const [inputCode, setInputCode] = useState(initialJoinCode || '');
  const [inputName, setInputName] = useState(remoteBingo.getPlayerName() || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'new_round' }
    | { type: 'kick'; participant: RemoteParticipant }
    | null
  >(null);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTvLink, setCopiedTvLink] = useState(false);
  const [showCodeOnBigScreen, setShowCodeOnBigScreen] = useState<boolean>(() =>
    remoteBingo.isShowCodeOnBigScreen()
  );
  const [maskCodeOnHostScreen, setMaskCodeOnHostScreen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>(() => remoteBingo.getConnectedRemotePlayers());
  const [roundNumber, setRoundNumber] = useState<number>(() => remoteBingo.getRoundNumber());
  const [hostCode, setHostCode] = useState(remoteBingo.getHostCode());
  const [serverSynced, setServerSynced] = useState(() => remoteBingo.isRoomActiveOnServer());
  const [cloudSynced, setCloudSynced] = useState(() => remoteBingo.isCloudRoomSynced());
  const [regError, setRegError] = useState<string | null>(() => remoteBingo.getRegistrationError());
  const [isCodeLocked, setIsCodeLocked] = useState(() => remoteBingo.isCodeLockedForRound());
  const [bannedList, setBannedList] = useState<BannedParticipant[]>(() => ownerControl.getBannedParticipants());
  const [sessionRemaining, setSessionRemaining] = useState<string>(() => sessionTimer.getFormattedRemaining());
  const [isEditingHostName, setIsEditingHostName] = useState(false);
  const [hostNameDraft, setHostNameDraft] = useState('');
  const [hostNotifications, setHostNotifications] = useState<HostActivityNotification[]>(() =>
    remoteBingo.getHostNotifications()
  );
  const [unreadHostAlerts, setUnreadHostAlerts] = useState<number>(() =>
    remoteBingo.getUnreadNotificationCount()
  );
  const [liveHostAlert, setLiveHostAlert] = useState<{
    id: string;
    type: 'join' | 'bingo';
    text: string;
  } | null>(null);
  const [musicParticipants, setMusicParticipants] = useState(() =>
    musicBingoService.getSnapshot().participants || []
  );

  // Participant & Host messaging
  const [messages, setMessages] = useState<HostMessageItem[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [participantBoardMode, setParticipantBoardMode] = useState<'numbers' | 'music_bingo'>('numbers');

  const isRemote = remoteBingo.getIsRemotePlayer() && !ownerControl.isUnlocked();
  const canHost = !isRemote && hasPaid;
  const currentRoom = remoteBingo.getCurrentRoomCode();
  const hostDisplayName =
    (authUser.isAuthenticated && authUser.name && authUser.name !== 'Gjest' ? authUser.name : '') ||
    remoteBingo.getHostName() ||
    ui.host;

  useEffect(() => {
    if (isOpen) {
      const currentU = authService.getCurrentUser();
      const isOwner = currentU.role === 'owner' || ownerControl.isUnlocked();
      const isRemoteNow = remoteBingo.getIsRemotePlayer() && !isOwner;
      const paidNow = !isRemoteNow && ((currentU.isAuthenticated && sessionTimer.hasPaidAccess()) || isOwner);
      setHasPaid(paidNow);
      setSessionRemaining(sessionTimer.getFormattedRemaining());
      setAuthUser(currentU);
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setServerSynced(remoteBingo.isRoomActiveOnServer());
      if (initialJoinCode && initialJoinCode.trim()) {
        setInputCode(initialJoinCode.trim().toUpperCase());
        setErrorMessage(null);
        setActiveTab('join');
      } else if (paidNow && !isRemoteNow) {
        setActiveTab('host');
        remoteBingo.activateHostSession(undefined, hostDisplayName);
        setHostCode(remoteBingo.getHostCode());
        setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      } else {
        setActiveTab('join');
      }
    }
  }, [isOpen, isHostPlaying, initialJoinCode]);

  useEffect(() => {
    if (isHostPlaying && !remoteBingo.getIsRemotePlayer() && ((authService.getCurrentUser().isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked())) {
      setActiveTab('host');
    }
  }, [isHostPlaying]);

  useEffect(() => {
    const unsubRemote = remoteBingo.subscribe(() => {
      setParticipants([...remoteBingo.getConnectedRemotePlayers()]);
      setRoundNumber(remoteBingo.getRoundNumber());
      setHostCode(remoteBingo.getHostCode());
      setServerSynced(remoteBingo.isRoomActiveOnServer());
      setCloudSynced(remoteBingo.isCloudRoomSynced());
      setRegError(remoteBingo.getRegistrationError());
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setShowCodeOnBigScreen(remoteBingo.isShowCodeOnBigScreen());
      setHostNotifications(remoteBingo.getHostNotifications());
      setUnreadHostAlerts(remoteBingo.getUnreadNotificationCount());
    });

    const unsubJoinAlert = remoteBingo.onParticipantJoined((p, total) => {
      if (remoteBingo.getIsRemotePlayer() || !remoteBingo.canActAsHost()) return;
      const curLang = langRef.current;
      const curUi = getBingoUiTexts(curLang);
      sounds.playPop(1.25);
      const id = `join-${Date.now()}`;
      const joinMsg = curUi.participantJoinedRoom.replace('{name}', p.name);
      const countMsg = curUi.remoteConnectedCount.replace('{n}', String(total));
      setLiveHostAlert({
        id,
        type: 'join',
        text: `${joinMsg} (${countMsg})`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 6500);
    });

    const unsubClaimAlert = remoteBingo.onClaim((claim) => {
      const curLang = langRef.current;
      const curUi = getBingoUiTexts(curLang);
      const tier =
        claim.milestone ||
        (claim.isFullHouse || /fullt?\s*brett|full_?house|blackout/i.test(claim.pattern)
          ? 'fullbrett'
          : /3\s*\.?\s*rekke|3\s*lines?/i.test(claim.pattern)
          ? 'line3'
          : 'line1');
      const tierLabel = formatMilestoneLabel(tier, curLang);
      const nextText =
        tier === 'fullbrett'
          ? curUi.newRoundStartsSoon
          : tier === 'line3'
          ? curUi.continuesToFullbrett
          : curUi.continuesToLine3;
      sounds.playLineComplete();
      const id = `claim-${Date.now()}`;
      setLiveHostAlert({
        id,
        type: 'bingo',
        text: `${curUi.shoutedBannerPrefix} ${claim.playerName} ${curUi.shoutedBannerMid} ${tierLabel} ${curUi.shoutedBannerSuffix} ➡️ ${nextText}`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 8000);
    });

    const unsubRemoteNewRound = remoteBingo.onNewRound((nr) => {
      const curUi = getBingoUiTexts(langRef.current);
      setLiveHostAlert(null);
      setRoundNumber(nr.roundNumber);
      setSuccessNotice(curUi.roundManualResetMsg.replace('{n}', String(nr.roundNumber)));
      setTimeout(() => setSuccessNotice(null), 3500);
    });

    const unsubMusic = musicBingoService.subscribe(() => {
      setMusicParticipants([...(musicBingoService.getSnapshot().participants || [])]);
      setHostNotifications(remoteBingo.getHostNotifications());
    });

    const unsubMusicClaim = musicBingoService.onClaim((mClaim) => {
      const curLang = langRef.current;
      const curUi = getBingoUiTexts(curLang);
      sounds.playLineComplete();
      const tier =
        mClaim.milestone ||
        (mClaim.isFullHouse || /fullt?\s*brett|full_?house|blackout/i.test(mClaim.pattern)
          ? 'fullbrett'
          : /3\s*\.?\s*rekke|3\s*lines?/i.test(mClaim.pattern)
          ? 'line3'
          : 'line1');
      const tierLabel = localizeBingoPattern(mClaim.pattern, curLang);
      const nextText =
        tier === 'fullbrett'
          ? curUi.newRoundStartsSoon
          : tier === 'line3'
          ? curUi.continuesToFullbrett
          : curUi.continuesToLine3;
      const id = `mclaim-${Date.now()}`;
      setLiveHostAlert({
        id,
        type: 'bingo',
        text: `🎵 ${mClaim.playerName} ${curUi.shoutedBannerMid} ${tierLabel} ${curUi.shoutedBannerSuffix} ➡️ ${nextText}`,
      });
      setHostNotifications(remoteBingo.getHostNotifications());
      setTimeout(() => {
        setLiveHostAlert((prev) => (prev?.id === id ? null : prev));
      }, 8000);
    });

    const unsubMusicNewRound = musicBingoService.onNewRound((nr) => {
      const curUi = getBingoUiTexts(langRef.current);
      setLiveHostAlert(null);
      setSuccessNotice(curUi.musicNewRoundNotice.replace('{n}', String(nr.roundNumber)));
      setTimeout(() => setSuccessNotice(null), 3500);
    });

    const unsubSession = sessionTimer.subscribe(() => {
      const u = authService.getCurrentUser();
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
      setSessionRemaining(sessionTimer.getFormattedRemaining());
    });

    const unsubAuth = authService.subscribe(() => {
      const u = authService.getCurrentUser();
      setAuthUser(u);
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
    });

    const unsubOwner = ownerControl.subscribe(() => {
      const u = authService.getCurrentUser();
      setBannedList(ownerControl.getBannedParticipants());
      setHasPaid(!remoteBingo.getIsRemotePlayer() && ((u.isAuthenticated && sessionTimer.hasPaidAccess()) || ownerControl.isUnlocked()));
    });

    // Listen for participant messages to host and replies
    const unsubHostMsg = socialSocket.on('host:message_received', (payload: any) => {
      if (payload && payload.text) {
        const curUi = getBingoUiTexts(langRef.current);
        setMessages((prev) => [
          ...prev,
          {
            id: payload.id || `msg-${Date.now()}`,
            senderId: payload.senderId,
            senderName: payload.senderName || curUi.player,
            senderColor: payload.senderColor || '#06b6d4',
            text: payload.text,
            timestamp: payload.timestamp || Date.now(),
            isHostReply: false,
          },
        ]);
      }
    });

    const unsubHostReply = socialSocket.on('host:reply_received', (payload: any) => {
      if (payload && payload.text) {
        const curUi = getBingoUiTexts(langRef.current);
        setMessages((prev) => [
          ...prev,
          {
            id: payload.id || `rep-${Date.now()}`,
            senderName: payload.hostName || hostDisplayName || curUi.host,
            senderColor: '#f59e0b',
            text: payload.text,
            timestamp: payload.timestamp || Date.now(),
            isHostReply: true,
          },
        ]);
      }
    });

    return () => {
      unsubRemote();
      unsubJoinAlert();
      unsubClaimAlert();
      unsubRemoteNewRound();
      unsubMusic();
      unsubMusicClaim();
      unsubMusicNewRound();
      unsubSession();
      unsubAuth();
      unsubOwner();
      unsubHostMsg();
      unsubHostReply();
    };
  }, []);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    sounds.playClick();
    setErrorMessage(null);
    const modCheck = moderation.filterText(inputName.trim());
    if (modCheck.hasBannedWords) {
      setErrorMessage(ex.badNickErr);
      return;
    }
    const safeNick = modCheck.cleanText || inputName.trim();
    setIsJoining(true);

    const res = await remoteBingo.validateAndJoinAsRemotePlayer(inputCode, safeNick);
    setIsJoining(false);
    if (!res.success) {
      sounds.playClick();
      setErrorMessage(res.error ? localizeServerBingoMessage(res.error, lang) : ex.joinFailErr);
      return;
    }

    sounds.playLineComplete();
    setSuccessNotice(
      ex.connectedNotice.replace('{code}', inputCode.toUpperCase()).replace('{name}', safeNick)
    );
    if (onJoinedAsRemotePlayer) {
      onJoinedAsRemotePlayer(inputCode.toUpperCase(), safeNick);
    }

    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1500);
  };

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(hostCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJoinLink = () => {
    sounds.playClick();
    const shareUrl = `${window.location.origin}/?spill=bingo&kode=${encodeURIComponent(hostCode)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyTvLink = () => {
    sounds.playClick();
    const tvUrl = `${window.location.origin}/?tv=1&spill=bingo&kode=${encodeURIComponent(hostCode)}`;
    navigator.clipboard?.writeText(tvUrl).catch(() => {});
    setCopiedTvLink(true);
    setTimeout(() => setCopiedTvLink(false), 2200);
  };

  const handleRegenerateCode = () => {
    if (!canHost) return;
    sounds.playClick();
    if (remoteBingo.isCodeLockedForRound()) {
      setErrorMessage(ex.codeLockedErr);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    const newCode = remoteBingo.generateNewHostCode();
    if (newCode) {
      setHostCode(newCode);
      setIsCodeLocked(remoteBingo.isCodeLockedForRound());
      setSuccessNotice(ex.newCodeNotice.replace('{code}', newCode));
      setTimeout(() => setSuccessNotice(null), 2500);
    }
  };

  const executeStartNewRoundCode = () => {
    if (!canHost) return;
    sounds.playLineComplete();
    setConfirmAction(null);
    if (onStartNewRound) {
      onStartNewRound();
    } else {
      remoteBingo.startNewRound();
    }
    const newCode = remoteBingo.getHostCode();
    if (newCode) {
      setHostCode(newCode);
      setIsCodeLocked(true);
      setSuccessNotice(ex.roundStartedNotice.replace('{code}', newCode));
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const executeKickParticipant = (p: RemoteParticipant) => {
    sounds.playClick();
    setConfirmAction(null);
    remoteBingo.kickParticipant(p.id, p.name);
    ownerControl.banParticipant(p.name, ex.autoExpiryNote);
    setBannedList(ownerControl.getBannedParticipants());
    setSuccessNotice(ex.kickedNotice.replace('{name}', p.name));
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleUnban = (banned: BannedParticipant) => {
    sounds.playClick();
    ownerControl.unbanParticipant(banned.name);
    socialSocket.unbanUser(banned.id);
    setBannedList(ownerControl.getBannedParticipants());
    setSuccessNotice(ex.unbannedNotice.replace('{name}', banned.name));
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    sounds.playClick();
    const isHost = activeTab === 'host' || !isRemote;
    if (isHost) {
      const senderLabel = `${hostDisplayName} (${ex.hostLabelSuffix})`;
      socialSocket.replyHostMessage(replyTarget || 'all', msgInput.trim(), senderLabel);
      setMessages((prev) => [
        ...prev,
        {
          id: `rep-${Date.now()}`,
          senderName: senderLabel,
          senderColor: '#f59e0b',
          text: msgInput.trim(),
          timestamp: Date.now(),
          isHostReply: true,
        },
      ]);
      setReplyTarget(null);
    } else {
      socialSocket.sendHostMessage(msgInput.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          senderName: inputName || remoteBingo.getPlayerName() || ex.youLabel,
          senderColor: '#06b6d4',
          text: msgInput.trim(),
          timestamp: Date.now(),
          isHostReply: false,
        },
      ]);
    }
    setMsgInput('');
  };

  const handleLeaveRemote = () => {
    sounds.playClick();
    remoteBingo.leaveRemoteSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full bg-gradient-to-b from-[#26150a] via-[#1a0f08] to-[#0d0804] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl text-amber-50 overflow-hidden flex flex-col max-h-[92vh] transition-all ${
          activeTab === 'join' && participantBoardMode === 'music_bingo' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 text-2xl flex items-center justify-center shadow-md">
              📡
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-amber-200">
                {ui.remoteModalTitle}
              </h2>
              <p className="text-xs text-amber-300/80">
                {ex.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPaid && onSwitchToBigScreen && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSwitchToBigScreen();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow flex items-center gap-1.5"
              >
                <span>📺</span>
                <span className="hidden sm:inline">{ex.switchBigScreen}</span>
              </button>
            )}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 flex items-center justify-center text-amber-300 hover:text-white transition-all text-sm font-bold cursor-pointer"
              title={ui.close}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-black/40 rounded-xl border border-amber-500/20">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('join');
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>📱</span>
            <span>{ui.player}</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('host');
              remoteBingo.markHostNotificationsRead();
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'host'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>👑</span>
            <span>{ui.host}</span>
            {!hasPaid && (
              <span className="text-[10px] bg-rose-900/80 text-rose-200 px-1.5 py-0.2 rounded-full border border-rose-500/40">
                {ex.lockedBadge}
              </span>
            )}
            {hasPaid && unreadHostAlerts > 0 && activeTab !== 'host' && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black">
                {unreadHostAlerts}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('messages');
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'messages'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-amber-300 hover:bg-white/5'
            }`}
          >
            <span>💬</span>
            <span>{ex.messagesTab}</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Inline Confirmation Prompt */}
        {confirmAction && (
          <div className="mb-3 p-3.5 rounded-xl bg-amber-950/90 border-2 border-amber-400 text-xs space-y-2.5 shadow-xl animate-fadeIn">
            <div className="font-bold text-amber-100">
              {confirmAction.type === 'new_round'
                ? ex.confirmNewRoundText
                : ex.confirmKickText.replace('{name}', confirmAction.participant.name)}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold cursor-pointer"
              >
                {ui.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction.type === 'new_round') {
                    executeStartNewRoundCode();
                  } else {
                    executeKickParticipant(confirmAction.participant);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer"
              >
                {ex.confirmYes}
              </button>
            </div>
          </div>
        )}

        {/* Live Host Alert Banner inside Modal */}
        {liveHostAlert && (
          <div
            className={`mb-3 p-3 rounded-xl border-2 text-xs font-black flex items-center justify-between gap-2 shadow-lg animate-fadeIn ${
              liveHostAlert.type === 'bingo'
                ? 'bg-gradient-to-r from-amber-500/30 to-emerald-500/30 border-amber-300 text-amber-100'
                : 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
            }`}
          >
            <span>{liveHostAlert.text}</span>
            <button
              type="button"
              onClick={() => setLiveHostAlert(null)}
              className="text-white/80 hover:text-white font-black cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notices */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-medium animate-fadeIn">
            ⚠️ {errorMessage}
          </div>
        )}

        {successNotice && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-medium animate-fadeIn">
            {successNotice}
          </div>
        )}

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: JOIN AS PARTICIPANT */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              {isRemote && currentRoom ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-center space-y-3">
                    <span className="text-3xl">🟢</span>
                    <div className="font-heading font-black text-lg text-amber-200">
                      {ex.connectedRoomPrefix}{' '}
                      <span className="text-amber-400 underline font-mono">{currentRoom}</span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      {ui.remotePlayingAs} <strong className="text-white">{remoteBingo.getPlayerName()}</strong>.{' '}
                      {ex.chooseModeHint}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setParticipantBoardMode('numbers');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                          participantBoardMode === 'numbers'
                            ? 'bg-amber-400 text-slate-950 border-white shadow'
                            : 'bg-black/45 text-amber-200 border-amber-500/30 hover:bg-black/65'
                        }`}
                      >
                        {ex.numbersBingoBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setParticipantBoardMode('music_bingo');
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                          participantBoardMode === 'music_bingo'
                            ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 border-white shadow'
                            : 'bg-black/45 text-rose-200 border-rose-400/40 hover:bg-black/65'
                        }`}
                      >
                        {ex.musicBingoBtn}
                      </button>
                    </div>

                    <div className="pt-1 flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>💬</span>
                        <span>{ex.sendMsgHostBtn}</span>
                      </button>
                      <button
                        onClick={handleLeaveRemote}
                        className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-200 text-xs font-bold cursor-pointer transition-all"
                      >
                        {ui.remoteLeaveRoomBtn}
                      </button>
                    </div>
                  </div>

                  {participantBoardMode === 'music_bingo' && (
                    <DigitalMusicBingoBoard
                      roomCode={currentRoom}
                      playerName={remoteBingo.getPlayerName() || inputName || ui.player}
                    />
                  )}
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5">
                        {ui.remoteCodeLabel}:
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder={ui.remoteCodePlaceholder}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-amber-400/40 focus:border-amber-400 text-amber-100 placeholder-amber-400/30 font-mono font-black text-center text-2xl tracking-widest outline-none shadow-inner"
                      />
                      <span className="text-[11px] text-amber-300/70 mt-1 block">
                        {ex.enterCodeHint}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1.5">
                        {ex.nickLabel}
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        placeholder={ex.nickPlaceholder}
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-amber-400/40 focus:border-amber-400 text-amber-100 placeholder-amber-400/30 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-400/50 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
                    <span className="text-xl shrink-0">🎟️</span>
                    <div>
                      <strong className="text-white block font-bold mb-0.5">{ex.kahootTitle}</strong>
                      {ex.kahootBody}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                    ✨ <strong>{ui.wellbeingTitle}:</strong> {ex.wellbeingNote}
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>🚀</span>
                    <span>{isJoining ? ui.remoteJoiningBtn : ex.joinAction}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: HOST CONTROLS */}
          {activeTab === 'host' && (
            <div className="space-y-4">
              {!canHost ? (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-rose-950/70 via-black/60 to-black/80 border-2 border-rose-500/60 text-center space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl shadow-lg">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-rose-200">
                      {isRemote ? ex.hostOnlyLockTitle : ui.remoteHostLockedTitle}
                    </h3>
                    <p className="text-xs text-amber-100/80 mt-1 max-w-md mx-auto leading-relaxed">
                      {isRemote ? ex.hostOnlyLockDesc : ex.hostNeedPassDesc}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-left text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> {ex.hostBenefit1}
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> {ex.hostBenefit2}
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> {ex.hostBenefit3}
                    </div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <span>✓</span> {ex.hostBenefit4}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onOpenVippsModal) {
                        onOpenVippsModal();
                      }
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-900/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <span className="text-base">💳</span>
                    <span>{ex.payHostBtn}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Host profile */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-black/60 to-amber-950/50 border border-purple-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow border border-white/30 shrink-0"
                        style={{ backgroundColor: authUser.isAuthenticated ? authUser.avatarColor : '#7c3aed' }}
                      >
                        {authUser.isAuthenticated ? authUser.avatar : '🎤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-black text-purple-300">
                            {ex.hostProfileLabel}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black">
                            {ex.activePaidBadge}
                          </span>
                        </div>
                        {isEditingHostName ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!hostNameDraft.trim()) return;
                              sounds.playLineComplete();
                              const updated = authService.updateUserName(hostNameDraft.trim());
                              remoteBingo.setHostName(updated.name);
                              setIsEditingHostName(false);
                              setSuccessNotice(ex.hostNameUpdated.replace('{name}', updated.name));
                              setTimeout(() => setSuccessNotice(null), 2500);
                            }}
                            className="flex items-center gap-1.5 mt-1"
                          >
                            <input
                              type="text"
                              value={hostNameDraft}
                              onChange={(e) => setHostNameDraft(e.target.value)}
                              placeholder={ex.hostNamePlaceholder}
                              maxLength={30}
                              autoFocus
                              className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-400 text-xs text-white font-bold outline-none"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                            >
                              {ui.save}
                            </button>
                          </form>
                        ) : (
                          <div className="font-heading font-black text-sm sm:text-base text-white flex items-center gap-2">
                            <span>{hostDisplayName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setHostNameDraft(hostDisplayName);
                                setIsEditingHostName(true);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold cursor-pointer"
                            >
                              {ex.changeNameBtn}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {onSwitchToBigScreen && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          onSwitchToBigScreen();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <span>📺</span>
                        <span>{ex.switchBigScreen}</span>
                      </button>
                    )}
                  </div>

                  {/* Host Code & Controls */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black/40 to-black/60 border-2 border-amber-400/60 text-center space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-widest px-1">
                      <span>{ex.spillCodePrefix} · {ui.host}: {hostDisplayName}</span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        ⏱️ {sessionRemaining.includes('Ubegrenset') || sessionRemaining.includes('∞') ? sessionRemaining : `${sessionRemaining} ${ex.leftSuffix}`}
                      </span>
                    </div>

                    <div className="inline-block px-8 py-3 rounded-2xl bg-black/80 border-2 border-amber-400 shadow-2xl">
                      <span className="font-mono font-black text-3xl sm:text-4xl text-amber-200 tracking-widest select-all">
                        {maskCodeOnHostScreen ? '••••' : hostCode}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          serverSynced || cloudSynced
                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                            : regError
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                            : 'bg-amber-500/20 border-amber-400/50 text-amber-200 animate-pulse'
                        }`}
                      >
                        {cloudSynced
                          ? ex.cloudOpenBadge
                          : serverSynced
                          ? ex.serverOpenBadge
                          : regError
                          ? `⚠️ ${localizeServerBingoMessage(regError, lang)}`
                          : ex.syncingBadge}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          const active = remoteBingo.reactivateCurrentHostCode();
                          if (active) {
                            setSuccessNotice(ex.codeReactivatedNotice.replace('{code}', active));
                            setTimeout(() => setSuccessNotice(null), 2500);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-bold text-amber-200 cursor-pointer"
                      >
                        {ex.reactivateBtn}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={handleCopyCode}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>📋</span>
                        <span>{copied ? ui.copied : ui.copyCode}</span>
                      </button>

                      <button
                        onClick={handleCopyJoinLink}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>🔗</span>
                        <span>{copiedLink ? ui.copiedLink : ui.copyLink}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyTvLink}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/50 text-purple-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>📺</span>
                        <span>{copiedTvLink ? ui.copiedLink : ui.tvLinkBtn}</span>
                      </button>

                      {onOpenTvMode && hostCode && (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onClose();
                            onOpenTvMode('bingo', hostCode);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-100 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>🖥️</span>
                          <span>{ui.tvModeBtn}</span>
                        </button>
                      )}

                      {isCodeLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setConfirmAction({ type: 'new_round' });
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>🔄</span>
                          <span>{ex.newRoundBtnFull}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRegenerateCode}
                          className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>🎲</span>
                          <span>{ex.generateCodeBtn}</span>
                        </button>
                      )}
                    </div>

                    {/* Screen Privacy Toggles */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          remoteBingo.toggleCodeOnBigScreen(!showCodeOnBigScreen);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                          showCodeOnBigScreen
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100'
                            : 'bg-black/60 border-white/20 text-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {showCodeOnBigScreen ? ex.codeOpenAllScreens : ex.codeHiddenTvClickOpen}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMaskCodeOnHostScreen((v) => !v);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                          maskCodeOnHostScreen
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-black/60 border-white/20 text-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {maskCodeOnHostScreen ? ex.codeMaskedMine : ex.hideOnMyScreen}
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-amber-300/80">
                      {ex.codePrivacyLine}
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed text-left">
                      {ex.shareTipPrefix} <strong>{maskCodeOnHostScreen ? '••••' : hostCode}</strong>
                    </div>
                  </div>

                  {/* Live Organizer Notifications */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-black/45 to-amber-950/35 border border-emerald-400/40 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      <span>🔔 {ui.liveActivityTitle} ({hostNotifications.length})</span>
                      {unreadHostAlerts > 0 && (
                        <button
                          type="button"
                          onClick={() => remoteBingo.markHostNotificationsRead()}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-[10px] font-black text-emerald-100 cursor-pointer"
                        >
                          ✓ {ui.markAllRead}
                        </button>
                      )}
                    </div>

                    {hostNotifications.length === 0 ? (
                      <div className="p-3 rounded-xl bg-black/35 border border-dashed border-emerald-400/25 text-xs text-slate-300/80 text-center">
                        {ui.noUnreadAlerts}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {hostNotifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                              item.type === 'bingo'
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-100 font-bold'
                                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.type === 'bingo' ? '🏆' : '👋'}</span>
                                <span className="font-black">
                                  {localizeServerBingoMessage(item.detail, lang)}
                                </span>
                              </div>
                              <div className="text-[10px] text-amber-200/70">
                                {item.gameLabel} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected participants list */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <span>
                        {ui.remoteParticipantsTitle} ({participants.length + musicParticipants.filter((mp) => !participants.some((rp) => rp.id === mp.id)).length}) · {ui.round} {roundNumber}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        {ex.realtimeLabel}
                      </span>
                    </div>

                    {participants.length === 0 && musicParticipants.length === 0 ? (
                      <div className="p-4 rounded-xl bg-black/30 border border-dashed border-amber-500/20 text-center text-xs text-amber-300/60">
                        {ui.remoteNoParticipants}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: p.color || '#f59e0b' }}
                              />
                              <span className="font-bold text-amber-100">{p.name}</span>
                              {p.game && (
                                <span className="text-[10px] text-cyan-300/80 font-semibold">· {p.game}</span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                sounds.playClick();
                                setConfirmAction({ type: 'kick', participant: p });
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold cursor-pointer transition-all"
                            >
                              {ex.kickBtn}
                            </button>
                          </div>
                        ))}
                        {musicParticipants
                          .filter((mp) => !participants.some((rp) => rp.id === mp.id))
                          .map((mp) => (
                            <div
                              key={`mp-${mp.id}`}
                              className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-100">{mp.name}</span>
                                <span className="text-[10px] text-amber-300 font-semibold">
                                  · {ui.musicTitle} ({mp.markedCount} {ex.marksSuffix} · {mp.linesCompleted} {ui.linesCountLabel})
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Banned participants management */}
                  {bannedList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-300 uppercase tracking-wider">
                        <span>{ex.bannedHeader} ({bannedList.length})</span>
                        <span className="text-[10px] text-rose-200/70">{ex.autoExpiryNote}</span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {bannedList.map((b) => {
                          const remainingMs = Math.max(0, (b.bannedUntil || 0) - Date.now());
                          const remainingMins = Math.ceil(remainingMs / (60 * 1000));
                          return (
                            <div
                              key={b.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-rose-500/20 text-xs"
                            >
                              <div>
                                <span className="font-bold text-rose-200">{b.name}</span>
                                <span className="text-[10px] text-rose-300/60 block">
                                  {remainingMs > 0
                                    ? `${ex.banRemainingPrefix} ${remainingMins} ${ex.banMinutesSuffix}`
                                    : ex.expiredBadge}{' '}
                                  • {b.reason}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnban(b)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-all"
                              >
                                {ex.unbanBtn}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANT <-> HOST MESSAGING */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <strong>{ex.msgIntroTitle}</strong> {ex.msgIntroBody}
                </div>
              </div>

              {/* Message list */}
              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 h-64 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-amber-300/50 p-4">
                    <span>{ex.msgEmptyTitle}</span>
                    <span className="text-[11px] mt-1">{ex.msgEmptyHint}</span>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        m.isHostReply
                          ? 'bg-amber-500/20 border border-amber-400/40 ml-4'
                          : 'bg-white/5 border border-white/10 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${m.isHostReply ? 'text-amber-300' : 'text-cyan-300'}`}>
                          {m.isHostReply ? '👑 ' : '👤 '}
                          {m.senderName}
                        </span>
                        <span className="text-[10px] text-amber-200/50">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-amber-100 text-xs break-words">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  maxLength={160}
                  placeholder={!isRemote ? ex.msgHostPlaceholder : ex.msgPlayerPlaceholder}
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-amber-400/40 text-amber-100 placeholder-amber-400/30 text-xs outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <span>{ex.sendBtn}</span>
                  <span>➔</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-amber-500/20 text-center text-[11px] text-amber-300/60 flex items-center justify-between">
          <span>{ex.footerBrand}</span>
          <span className="text-amber-400 font-mono">
            {hasPaid && hostCode
              ? maskCodeOnHostScreen
                ? `${ui.code}: ••••`
                : `${ui.code}: ${hostCode}`
              : currentRoom
              ? `${ui.code}: ${currentRoom}`
              : ex.codeAfterPay}
          </span>
        </div>
      </div>
    </div>
  );
};
