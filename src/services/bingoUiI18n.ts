/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BingoMilestone } from '../types/bingo';
import { SupportedLanguage } from './i18n';

export interface BingoUiTexts {
  // Common UI
  startMenu: string;
  tools: string;
  mobile: string;
  pc: string;
  tvProjector: string;
  screenSizeLabel: string;
  ok: string;
  close: string;
  cancel: string;
  save: string;
  round: string;
  player: string;
  players: string;
  card: string;
  cards: string;
  host: string;
  code: string;
  codeHidden: string;
  guest: string;
  copied: string;
  copyCode: string;
  copyLink: string;
  copiedLink: string;
  print: string;
  muteSound: string;
  unmuteSound: string;
  fullscreen: string;
  exitFullscreen: string;
  backToStart: string;
  join: string;
  leave: string;
  connecting: string;
  connected: string;
  live: string;

  // Milestones & Shouts
  milestoneLine1: string;
  milestoneLine3: string;
  milestoneFullbrett: string;
  claimedBy: string;
  continuesToLine3: string;
  continuesToFullbrett: string;
  newRoundStartsSoon: string;
  shoutedBannerPrefix: string; // "{name} fylte {tier} og trykket BINGO!"
  shoutedBannerMid: string;
  shoutedBannerSuffix: string;
  roundAutoResetMsg: string; // "Runde {n} startet automatisk etter Fullbrett BINGO av {winner}!"
  roundManualResetMsg: string; // "Ny bingorunde (Runde {n}) er startet!"
  pressBingoBtn: string;
  allMilestonesWon: string;
  noEligibleLineYet: string;
  physicalConfirmHint: string;
  waitingBallsHint: string;
  liveActivityTitle: string;
  noUnreadAlerts: string;
  markAllRead: string;

  // Play Screen HUD & Modals
  modeAllInOne: string;
  modeCallerOnly: string;
  modePassPlay: string;
  modeHumanBingo: string;
  fmtNumbers: string;
  fmtBoth: string;
  fmtPrompts: string;
  cardNumberPrefix: string;
  numberedCardLabel: string;
  joyCardLabel: string;
  cardsInPlayLabel: string;
  shareProgressBtn: string;
  newRoundBtn: string;
  resetGameBtn: string;
  pauseTitle: string;
  pauseDesc: string;
  resumeGameBtn: string;
  quitKeepBtn: string;
  startFreshBtn: string;
  bannedTitle: string;
  bannedDesc: string;
  questDoneBadge: string;
  claimStarBtn: string;
  levelUpTitle: string;
  wellbeingTitle: string;
  wellbeingDesc: string;
  wellbeingCta: string;
  trialEndedLabel: string;
  participantJoinedRoom: string; // "{name} ble med i rommet!"
  youJoinedTitle: string;
  youJoinedDesc: string;
  hostRoomBadge: string;
  hostCodeLabel: string;
  tvLinkBtn: string;
  tvModeBtn: string;
  openBigScreenBtn: string;
  openRemoteBtn: string;
  openMusicBingoBtn: string;
  openSeniorQuizBtn: string;
  gameMenuBtn: string;
  roomCodeOpenNotice: string;
  remoteConnectedCount: string; // "{n} deltakere tilkoblet"
  timeWarningPrefix: string;
  timeWarningSuffix: string;
  extendTimeBtn: string;
  sessionExpiredTitle: string;
  sessionExpiredDesc: string;

  // BingoBoard
  freeSpaceLabel: string;
  lastFromDrum: string;
  scanAndTap: string;
  markConfirmTitle: string;
  markConfirmSubtitle: string;
  partnerNameLabel: string;
  partnerPlaceholder: string;
  storyLabel: string;
  storyPlaceholder: string;
  quickDaubBtn: string;
  recordStoryBtn: string;
  withLabel: string;
  notDrawnYetWarn: string;
  cardWonBadge: string;
  linesCountLabel: string;

  // BallCageCanvas
  drumTitle: string;
  readyToRoll: string;
  waitingForHostShort: string;
  drumSpinning: string;
  ballsRemainingSuffix: string;
  drawNextBtn: string;
  drawingBtn: string;
  scrambleBtn: string;
  autoOffBtn: string;
  autoOnBtn: string;
  refillBtn: string;
  hostControlsNote: string;
  historyEmpty: string;
  latestCallsTitle: string;

  // RemoteBingoClaimModal
  claimModalBadge: string;
  claimModalTitleFull: string;
  claimModalTitleLine: string;
  claimModalPatternLabel: string;
  claimModalCardPrefix: string;
  claimModalRoundPrefix: string;
  claimModalTaskBadge: string;
  claimModalNewRoundNote: string;
  claimModalContinuesLine3: string;
  claimModalContinuesFull: string;
  claimModalStartNewRoundNow: string;
  claimModalCloseBtn: string;
  claimModalAcknowledgeBtn: string;

  // WinnerTaskModal
  winnerTaskBadge: string;
  winnerTaskContinueBtn: string;
  winnerTaskDoneBtn: string;
  winnerTaskRewardLabel: string;

  // VictoryModal
  victoryBadge: string;
  victoryFullHeadline: string;
  victoryLineHeadline: string;
  victoryTotalPoints: string;
  victoryBallsDrawn: string;
  victoryWinningCard: string;
  victoryStoriesTitle: string;
  victoryPlayNewRound: string;
  victoryBackToStart: string;
  victoryShareJoy: string;
  victoryClose: string;

  // ParticipantsModal
  participantsTitle: string;
  participantsSubtitle: string;
  participantsPlaceholder: string;
  participantsAddBtn: string;
  participantsEmpty: string;
  participantsRemove: string;
  participantsCountLabel: string;

  // GameModeSelectorModal
  selectorTitle: string;
  selectorSubtitle: string;
  selectorLockedNote: string;
  selectorTrialNote: string;
  selectorOpenAllNote: string;
  selectorSelectBtn: string;
  selectorGames: {
    bingoTitle: string;
    bingoDesc: string;
    remoteTitle: string;
    remoteDesc: string;
    musicTitle: string;
    musicDesc: string;
    quizAdultTitle: string;
    quizAdultDesc: string;
    quizFamilyTitle: string;
    quizFamilyDesc: string;
    quizChristmasTitle: string;
    quizChristmasDesc: string;
    quizSeniorTitle: string;
    quizSeniorDesc: string;
    memoryTitle: string;
    memoryDesc: string;
  };

  // DigitalMusicBingoBoard
  musicTitle: string;
  musicHallSubtitle: string;
  musicWaitingHost: string;
  musicCurrentClip: string;
  musicHiddenSong: string;
  musicSecondsLeft: string;
  musicShoutBtnPrefix: string;
  musicNeedLineHint: string;
  musicAllClaimedHint: string;
  musicProgressLabel: string;
  musicSongsGridTitle: string;
  musicTapToMarkHint: string;
  musicNewRoundNotice: string;
  musicNotPlayedWarn: string;
  musicAlreadyClaimedWarn: string;

  // RemoteBingoModal
  remoteModalTitle: string;
  remoteTabHost: string;
  remoteTabJoin: string;
  remoteTabMusic: string;
  remoteHostLockedTitle: string;
  remoteHostLockedDesc: string;
  remoteJoinTitle: string;
  remoteJoinDesc: string;
  remoteCodeLabel: string;
  remoteCodePlaceholder: string;
  remoteNameLabel: string;
  remoteNamePlaceholder: string;
  remoteJoinBtn: string;
  remoteJoiningBtn: string;
  remoteActiveCodeLabel: string;
  remoteCopyInviteBtn: string;
  remoteParticipantsTitle: string;
  remoteNoParticipants: string;
  remotePlayingAs: string;
  remoteLeaveRoomBtn: string;
  remoteMilestonesStatus: string;
  remoteClaimedByPrefix: string;
  remoteWaitingOpen: string;
  remoteDrawSyncHint: string;
  remoteInvalidCode: string;
  remoteEnterNameErr: string;

  // AudienceDisplayModal (Storskjerm)
  audienceLockedTitle: string;
  audienceLockedDesc: string;
  audienceTabMain: string;
  audienceTabMusic: string;
  audienceTabSplit: string;
  audienceTabFlashboard: string;
  audienceTabStories: string;
  audienceTabLeaderboard: string;
  audienceCodeOnTvOn: string;
  audienceShowCode: string;
  audienceTvLink: string;
  audienceCleanTv: string;
  audienceScreenLocked: string;
  audienceLockScreen: string;
  audienceParticipantsBar: string;
  audienceNewRoundBtn: string;
  audienceMusicHallCardTitle: string;
  audiencePrint50Btn: string;
  audienceMusicLinkBtn: string;
  audienceDrawRandomSong: string;
  audienceRevealTitle: string;
  audienceHideTitle: string;
  audienceReplayClip: string;
  audienceStopClip: string;
  audienceSearchSongPlaceholder: string;
  audienceAllCategories: string;
  audiencePlayedSongsTitle: string;
  audienceStoriesEmpty: string;
  audienceLeaderboardTitle: string;

  // TvProjectorScreen
  tvWaitingTitle: string;
  tvWaitingDesc: string;
  tvEnterCodePlaceholder: string;
  tvConnectBtn: string;
  tvExitBtn: string;
  tvCalledCountLabel: string;
  tvCurrentBallLabel: string;
  tvWaitingFirstBall: string;
  tvLatestBallsLabel: string;
  tvPlayersStatusLabel: string;
  tvCodeHiddenLabel: string;
  tvRoomCodeLabel: string;
  tvMusicPlayingLabel: string;
  tvMusicMysteryTitle: string;
}

const NB: BingoUiTexts = {
  startMenu: 'Startmeny',
  tools: 'Verktøy',
  mobile: 'Mobil',
  pc: 'PC',
  tvProjector: 'TV / Prosjektor',
  screenSizeLabel: 'Skjermstørrelse',
  ok: 'OK',
  close: 'Lukk',
  cancel: 'Avbryt',
  save: 'Lagre',
  round: 'Runde',
  player: 'Spiller',
  players: 'spillere',
  card: 'Kort',
  cards: 'kort',
  host: 'Arrangør',
  code: 'Kode',
  codeHidden: 'Kode skjult',
  guest: 'Gjest',
  copied: '✓ Kopiert!',
  copyCode: 'Kopier kode',
  copyLink: 'Kopier deltakerlenke',
  copiedLink: '✓ Lenke kopiert!',
  print: 'Skriv ut',
  muteSound: 'Demp lyd og stemme',
  unmuteSound: 'Slå på lyd og stemme',
  fullscreen: 'Fullskjerm TV',
  exitFullscreen: 'Lukk fullskjerm',
  backToStart: '⇦ Tilbake til startmenyen',
  join: 'Bli med',
  leave: 'Forlat',
  connecting: 'Kobler til...',
  connected: 'Tilkoblet',
  live: 'Direkte',

  milestoneLine1: '1. rekke',
  milestoneLine3: '3. rekker',
  milestoneFullbrett: 'Full brett',
  claimedBy: 'tatt av',
  continuesToLine3: 'Vi spiller videre til 3. rekker!',
  continuesToFullbrett: 'Vi spiller videre til Full brett!',
  newRoundStartsSoon: 'Ny runde starter straks!',
  shoutedBannerPrefix: '🏆',
  shoutedBannerMid: 'fylte',
  shoutedBannerSuffix: 'og ropte BINGO!',
  roundAutoResetMsg: '🔄 Runde {n} startet automatisk etter Full brett BINGO av {winner}!',
  roundManualResetMsg: '🔄 Ny bingorunde (Runde {n}) er startet!',
  pressBingoBtn: 'ROP BINGO!',
  allMilestonesWon: 'Alle milepæler er vunnet i denne runden — venter på ny runde!',
  noEligibleLineYet: 'Tegn/merk først alle tallene i en hel rekke som er trukket fra trommelen.',
  physicalConfirmHint: 'Skann kortet & trykk ruter for å bekrefte',
  waitingBallsHint: 'Tall i rekken må være trukket fra trommelen før du kan rope BINGO.',
  liveActivityTitle: 'Siste hendelser & BINGO-rop',
  noUnreadAlerts: 'Ingen nye varsler ennå.',
  markAllRead: 'Merk som lest',

  modeAllInOne: 'Alt-i-ett',
  modeCallerOnly: 'Vert / Trommel',
  modePassPlay: 'Spillkveld',
  modeHumanBingo: 'Kun Brett',
  fmtNumbers: 'Kun tall (1–75)',
  fmtBoth: 'Tall + Ord',
  fmtPrompts: 'Kun ord',
  cardNumberPrefix: 'Kort #',
  numberedCardLabel: '1–75 Tallkort',
  joyCardLabel: 'Gledeskort',
  cardsInPlayLabel: 'Kort i spill',
  shareProgressBtn: 'Del fremgang',
  newRoundBtn: 'Ny runde',
  resetGameBtn: 'Nullstill',
  pauseTitle: 'Spill på pause',
  pauseDesc: 'Vil du fortsette å spille, eller gå tilbake til startmenyen?',
  resumeGameBtn: 'Fortsett spillet',
  quitKeepBtn: 'Gå til startmenyen (behold fremgang)',
  startFreshBtn: 'Start helt på nytt',
  bannedTitle: 'Midlertidig pause fra rommet',
  bannedDesc: 'Kontoen din er midlertidig utestengt i 10 minutter av moderering.',
  questDoneBadge: 'Daglig oppdrag fullført!',
  claimStarBtn: 'Hent stjernebelønning',
  levelUpTitle: 'Nivå opp! Du er nå:',
  wellbeingTitle: 'Sosial trivsel',
  wellbeingDesc: 'Husk å ta gode pauser, drikke vann og dele ekte samtaler sammen.',
  wellbeingCta: 'Fortsett med glede',
  trialEndedLabel: 'Prøvetiden er over',
  participantJoinedRoom: '👋 {name} ble med i rommet!',
  youJoinedTitle: 'Du er med i spillet!',
  youJoinedDesc: 'Følg med på brettet ditt — kulene som arrangøren trekker synkroniseres automatisk.',
  hostRoomBadge: 'Arrangørrom',
  hostCodeLabel: 'Kode',
  tvLinkBtn: 'TV-lenke',
  tvModeBtn: 'Ren TV',
  openBigScreenBtn: 'Storskjerm',
  openRemoteBtn: 'Avstandsbingo',
  openMusicBingoBtn: 'Musikkbingo',
  openSeniorQuizBtn: 'Senior Quiz',
  gameMenuBtn: 'Spillmeny',
  roomCodeOpenNotice: 'Deltakerkode er aktiv og klar for mobil og TV',
  remoteConnectedCount: '{n} mobiler tilkoblet',
  timeWarningPrefix: 'Kun',
  timeWarningSuffix: 'igjen av spilletiden!',
  extendTimeBtn: 'Forleng spilletid',
  sessionExpiredTitle: 'Spilletiden har utløpt',
  sessionExpiredDesc: 'Økten ble automatisk avsluttet ved 00:00:00. Forleng spilletiden eller logg inn på nytt for å fortsette.',

  freeSpaceLabel: 'GRATIS',
  lastFromDrum: 'Siste fra trommelen:',
  scanAndTap: 'Skann kortet & trykk for å bekrefte',
  markConfirmTitle: 'Bekreft rute & del øyeblikk',
  markConfirmSubtitle: 'Merk ruten raskt eller legg til hvem du snakket med.',
  partnerNameLabel: 'Medspiller / venn (valgfri):',
  partnerPlaceholder: 'F.eks. Anna eller Bord 2',
  storyLabel: 'Kort historie eller stikkord (valgfri):',
  storyPlaceholder: 'F.eks. Vi delte et godt barndomsminne...',
  quickDaubBtn: 'Hurtigmerking (+50 p)',
  recordStoryBtn: 'Lagre historie & merk',
  withLabel: 'med',
  notDrawnYetWarn: 'Dette tallet er ikke trukket fra trommelen ennå!',
  cardWonBadge: 'BINGO!',
  linesCountLabel: 'rekker',

  drumTitle: 'Trekningstrommel',
  readyToRoll: 'Klar til å trekke',
  waitingForHostShort: 'Venter på arrangøren...',
  drumSpinning: 'Trommelen snurrer...',
  ballsRemainingSuffix: 'kuler igjen',
  drawNextBtn: 'Trekk neste kule',
  drawingBtn: 'Trekker...',
  scrambleBtn: 'Rist kulene',
  autoOffBtn: 'Autotrekk AV',
  autoOnBtn: 'Autotrekk PÅ',
  refillBtn: 'Fyll på trommelen',
  hostControlsNote: 'Kun arrangøren styrer trekningen — alle deltakere mottar kulene direkte.',
  historyEmpty: 'Ingen kuler trukket ennå',
  latestCallsTitle: 'Siste trukket kuler',

  claimModalBadge: 'BINGO-ROP BEKREFTET!',
  claimModalTitleFull: 'FULL BRETT BINGO!',
  claimModalTitleLine: 'BINGO-ROP!',
  claimModalPatternLabel: 'Mønster:',
  claimModalCardPrefix: 'Kort #',
  claimModalRoundPrefix: 'Runde',
  claimModalTaskBadge: 'Vinneroppdrag',
  claimModalNewRoundNote: '🔄 Ny runde starter automatisk om et øyeblikk for alle spillere!',
  claimModalContinuesLine3: '➡️ Gratulerer! Spillet fortsetter videre til 3. rekker.',
  claimModalContinuesFull: '➡️ Flott spilt! Spillet fortsetter videre til Full brett.',
  claimModalStartNewRoundNow: '🔄 Start ny runde nå',
  claimModalCloseBtn: 'Lukk og feir videre',
  claimModalAcknowledgeBtn: 'Flott, fortsett spillet!',

  winnerTaskBadge: 'Vinneroppdrag!',
  winnerTaskContinueBtn: 'Fortsett spillet!',
  winnerTaskDoneBtn: 'Fullfør oppdrag',
  winnerTaskRewardLabel: 'gnistpoeng',

  victoryBadge: 'BINGO SEIER!',
  victoryFullHeadline: 'GRATULERER! FULL BRETT BINGO!',
  victoryLineHeadline: 'BINGO! REKKE FULLFØRT!',
  victoryTotalPoints: 'Totalpoeng',
  victoryBallsDrawn: 'Kuler trukket',
  victoryWinningCard: 'Vinnerkort',
  victoryStoriesTitle: 'Delte øyeblikk i denne runden',
  victoryPlayNewRound: 'Spill ny runde',
  victoryBackToStart: 'Til startmenyen',
  victoryShareJoy: 'Del gleden',
  victoryClose: 'Lukk',

  participantsTitle: 'Deltakerliste',
  participantsSubtitle: 'Legg til eller fjern navn for spillet.',
  participantsPlaceholder: 'Skriv inn navn på deltaker...',
  participantsAddBtn: 'Legg til',
  participantsEmpty: 'Ingen deltakere lagt til ennå.',
  participantsRemove: 'Fjern',
  participantsCountLabel: 'deltakere',

  selectorTitle: 'Velg Spillmodus',
  selectorSubtitle: 'Bytt fritt mellom alle spill i samme arrangement',
  selectorLockedNote: 'Logg inn og aktiver spilletid eller gratis 10-min prøvespill for å låse opp alle spill.',
  selectorTrialNote: '10 minutters prøvetid aktiv — utforsk alle spillene!',
  selectorOpenAllNote: 'Alle spillformater er åpne for arrangementet ditt!',
  selectorSelectBtn: 'Åpne spill',
  selectorGames: {
    bingoTitle: 'Sosial & Klassisk Bingo',
    bingoDesc: '75-kuler med 3D-trommel, samtalekort og storskjerm',
    remoteTitle: 'Avstandsbingo (Mobil & Kode)',
    remoteDesc: 'Deltakere blir med gratis med kode fra egen mobil',
    musicTitle: 'Digital Musikkbingo (50+)',
    musicDesc: 'Spill lydklipp, kjenn igjen sangen og kryss av på brettet',
    quizAdultTitle: 'Kultur-, Musikk- & Fanquiz',
    quizAdultDesc: 'Lagquiz med buzzer, poeng og stor skjerm',
    quizFamilyTitle: 'Familie- & Barnequiz',
    quizFamilyDesc: 'Morsomme spørsmål for både barn og voksne',
    quizChristmasTitle: 'JuleQuiz & Mimelek',
    quizChristmasDesc: '300 julespørsmål og 80 morsomme mimekort',
    quizSeniorTitle: 'Senior Grenland Quiz',
    quizSeniorDesc: 'Musikk-gjetting, lokalhistorie og hyggelige minner',
    memoryTitle: 'Memory (Bildespill)',
    memoryDesc: '30 bildekort / 15 par med lagpoeng og samarbeid',
  },

  musicTitle: 'Digital Musikkbingo',
  musicHallSubtitle: 'Lytt til musikklippet og trykk på sangen du kjenner igjen!',
  musicWaitingHost: 'Venter på at arrangøren spiller neste lydklipp...',
  musicCurrentClip: 'Nå spilles et musikkklipp',
  musicHiddenSong: 'Skjult sang — lytt nøye og finn den på brettet!',
  musicSecondsLeft: 'sek igjen',
  musicShoutBtnPrefix: 'ROP MUSIKKBINGO:',
  musicNeedLineHint: 'Merk minst én full rad med spilte sanger for å rope Musikkbingo!',
  musicAllClaimedHint: 'Alle milepæler er tatt i denne runden — venter på ny runde!',
  musicProgressLabel: 'Fremgang',
  musicSongsGridTitle: 'Ditt Musikkbingo-brett (5×5)',
  musicTapToMarkHint: 'Trykk på rutene når sangen blir spilt av arrangøren',
  musicNewRoundNotice: '🔄 Ny Musikkbingo-runde (Runde {n}) startet!',
  musicNotPlayedWarn: 'Denne sangen er ikke spilt av arrangøren ennå!',
  musicAlreadyClaimedWarn: 'Denne milepælen er allerede tatt av en annen spiller!',

  remoteModalTitle: 'Avstandsbingo & Direkte Rom',
  remoteTabHost: 'Arranger rom',
  remoteTabJoin: 'Bli med med kode',
  remoteTabMusic: 'Musikkbingo-brett',
  remoteHostLockedTitle: 'Arrangørtilgang kreves',
  remoteHostLockedDesc: 'Aktiver spilletid eller 10-min prøvespill på startskjermen for å dele romkode.',
  remoteJoinTitle: 'Bli med i et bingorom',
  remoteJoinDesc: 'Skriv inn 4-sifret romkode og navnet ditt — helt gratis for deltakere!',
  remoteCodeLabel: 'Romkode',
  remoteCodePlaceholder: 'F.eks. 4821',
  remoteNameLabel: 'Ditt navn',
  remoteNamePlaceholder: 'Skriv navnet ditt...',
  remoteJoinBtn: 'Bli med i spillet',
  remoteJoiningBtn: 'Kobler til rom...',
  remoteActiveCodeLabel: 'Aktiv romkode',
  remoteCopyInviteBtn: 'Kopier invitasjonslenke',
  remoteParticipantsTitle: 'Tilkoblede deltakere',
  remoteNoParticipants: 'Ingen eksterne deltakere har koblet seg til ennå.',
  remotePlayingAs: 'Spiller som',
  remoteLeaveRoomBtn: 'Forlat rommet',
  remoteMilestonesStatus: 'Milepæler i denne runden',
  remoteClaimedByPrefix: 'Tatt av',
  remoteWaitingOpen: 'Ledig',
  remoteDrawSyncHint: 'Alle trukket kuler sendes automatisk til alle mobiler.',
  remoteInvalidCode: 'Fant ingen aktiv bingorunde med denne koden.',
  remoteEnterNameErr: 'Vennligst skriv inn navnet ditt først.',

  audienceLockedTitle: 'Innlogging og spilletid kreves for Storskjerm',
  audienceLockedDesc: 'Storskjermvisning krever aktiv innlogging og gyldig spilletid.',
  audienceTabMain: 'Storskjerm',
  audienceTabMusic: 'Musikkbingo (50+)',
  audienceTabSplit: 'Delt visning',
  audienceTabFlashboard: '75-Tallbrett',
  audienceTabStories: 'Fortellinger',
  audienceTabLeaderboard: 'Stilling',
  audienceCodeOnTvOn: 'Kode på TV: PÅ',
  audienceShowCode: 'Vis kode',
  audienceTvLink: 'TV-lenke',
  audienceCleanTv: 'Ren TV',
  audienceScreenLocked: 'Skjerm Låst',
  audienceLockScreen: 'Lås skjerm',
  audienceParticipantsBar: 'Deltakere som spiller sammen',
  audienceNewRoundBtn: 'Ny runde',
  audienceMusicHallCardTitle: 'Eldre & Stor Sal (50+ personer)',
  audiencePrint50Btn: 'Skriv ut 50–100 brett',
  audienceMusicLinkBtn: 'Lenke til digitale brett',
  audienceDrawRandomSong: 'Trekk tilfeldig sang',
  audienceRevealTitle: 'Avslør tittel',
  audienceHideTitle: 'Skjul tittel',
  audienceReplayClip: 'Spill klipp på nytt',
  audienceStopClip: 'Stopp klipp',
  audienceSearchSongPlaceholder: 'Søk etter sang, artist eller tiår...',
  audienceAllCategories: 'Alle',
  audiencePlayedSongsTitle: 'Spilte sanger i denne runden',
  audienceStoriesEmpty: 'Ingen historier er delt ennå — merk en rute med en historie!',
  audienceLeaderboardTitle: 'Poengtavle & Rekker',

  tvWaitingTitle: 'TV / Prosjektor Storskjerm',
  tvWaitingDesc: 'Skriv inn romkoden fra arrangøren for å vise direkte trekning på TV eller prosjektor.',
  tvEnterCodePlaceholder: 'Romkode (f.eks. 4821)',
  tvConnectBtn: 'Koble til TV-visning',
  tvExitBtn: 'Avslutt TV-visning',
  tvCalledCountLabel: 'Trukket',
  tvCurrentBallLabel: 'SISTE KULE',
  tvWaitingFirstBall: 'Venter på første kule...',
  tvLatestBallsLabel: 'Siste kuler',
  tvPlayersStatusLabel: 'Spillere i rommet',
  tvCodeHiddenLabel: 'Kode skjult av arrangør',
  tvRoomCodeLabel: 'Romkode',
  tvMusicPlayingLabel: 'Musikkbingo direkte',
  tvMusicMysteryTitle: 'Lytt til musikken!',
};

const EN: BingoUiTexts = {
  startMenu: 'Start Menu',
  tools: 'Tools',
  mobile: 'Mobile',
  pc: 'PC',
  tvProjector: 'TV / Projector',
  screenSizeLabel: 'Screen Size',
  ok: 'OK',
  close: 'Close',
  cancel: 'Cancel',
  save: 'Save',
  round: 'Round',
  player: 'Player',
  players: 'players',
  card: 'Card',
  cards: 'cards',
  host: 'Organizer',
  code: 'Code',
  codeHidden: 'Code hidden',
  guest: 'Guest',
  copied: '✓ Copied!',
  copyCode: 'Copy code',
  copyLink: 'Copy invite link',
  copiedLink: '✓ Link copied!',
  print: 'Print',
  muteSound: 'Mute sound and voice',
  unmuteSound: 'Enable sound and voice',
  fullscreen: 'Fullscreen TV',
  exitFullscreen: 'Exit Fullscreen',
  backToStart: '⇦ Back to Start Menu',
  join: 'Join',
  leave: 'Leave',
  connecting: 'Connecting...',
  connected: 'Connected',
  live: 'Live',

  milestoneLine1: '1st Line',
  milestoneLine3: '3 Lines',
  milestoneFullbrett: 'Full House',
  claimedBy: 'won by',
  continuesToLine3: 'Game continues to 3 Lines!',
  continuesToFullbrett: 'Game continues to Full House!',
  newRoundStartsSoon: 'New round starting shortly!',
  shoutedBannerPrefix: '🏆',
  shoutedBannerMid: 'completed',
  shoutedBannerSuffix: 'and shouted BINGO!',
  roundAutoResetMsg: '🔄 Round {n} started automatically after Full House BINGO by {winner}!',
  roundManualResetMsg: '🔄 New bingo round (Round {n}) started!',
  pressBingoBtn: 'SHOUT BINGO!',
  allMilestonesWon: 'All milestones won this round — waiting for next round!',
  noEligibleLineYet: 'Mark a complete row, column, or diagonal of drawn numbers first.',
  physicalConfirmHint: 'Scan card & tap squares to confirm',
  waitingBallsHint: 'Numbers in the line must be drawn from the drum before shouting BINGO.',
  liveActivityTitle: 'Live Alerts & BINGO Shouts',
  noUnreadAlerts: 'No new alerts yet.',
  markAllRead: 'Mark as read',

  modeAllInOne: 'All-in-One',
  modeCallerOnly: 'Host / Drum',
  modePassPlay: 'Party Night',
  modeHumanBingo: 'Boards Only',
  fmtNumbers: 'Numbers Only (1–75)',
  fmtBoth: 'Numbers + Words',
  fmtPrompts: 'Words Only',
  cardNumberPrefix: 'Card #',
  numberedCardLabel: '1–75 Number Card',
  joyCardLabel: 'Joy Connection Card',
  cardsInPlayLabel: 'Cards in Play',
  shareProgressBtn: 'Share Progress',
  newRoundBtn: 'New Round',
  resetGameBtn: 'Reset',
  pauseTitle: 'Game Paused',
  pauseDesc: 'Would you like to continue playing or return to the start menu?',
  resumeGameBtn: 'Resume Game',
  quitKeepBtn: 'Quit to Start Menu (Keep Progress)',
  startFreshBtn: 'Start Fresh',
  bannedTitle: 'Temporary Room Pause',
  bannedDesc: 'Your account has been temporarily muted/paused for 10 minutes.',
  questDoneBadge: 'Daily Quest Completed!',
  claimStarBtn: 'Claim Star Reward',
  levelUpTitle: 'Level Up! You are now:',
  wellbeingTitle: 'Social Wellbeing',
  wellbeingDesc: 'Remember to take breaks, hydrate, and share real conversations together.',
  wellbeingCta: 'Continue with Joy',
  trialEndedLabel: 'Trial Ended',
  participantJoinedRoom: '👋 {name} joined the room!',
  youJoinedTitle: 'You have joined the game!',
  youJoinedDesc: 'Watch your card — numbers drawn by the organizer sync automatically.',
  hostRoomBadge: 'Host Room',
  hostCodeLabel: 'Code',
  tvLinkBtn: 'TV Link',
  tvModeBtn: 'Clean TV',
  openBigScreenBtn: 'Big Screen',
  openRemoteBtn: 'Remote Bingo',
  openMusicBingoBtn: 'Music Bingo',
  openSeniorQuizBtn: 'Senior Quiz',
  gameMenuBtn: 'Games',
  roomCodeOpenNotice: 'Room code is open and ready for mobile and TV',
  remoteConnectedCount: '{n} phones connected',
  timeWarningPrefix: 'Only',
  timeWarningSuffix: 'left of playtime!',
  extendTimeBtn: 'Extend Playtime',
  sessionExpiredTitle: 'Playtime Expired',
  sessionExpiredDesc: 'Your session ended automatically at 00:00:00. Extend playtime or sign in again to continue.',

  freeSpaceLabel: 'FREE',
  lastFromDrum: 'Last from drum:',
  scanAndTap: 'Scan card & tap to confirm',
  markConfirmTitle: 'Confirm Square & Share Moment',
  markConfirmSubtitle: 'Quick-daub or record who you connected with.',
  partnerNameLabel: 'Partner / Friend (optional):',
  partnerPlaceholder: 'e.g. Anna or Table 2',
  storyLabel: 'Short story or note (optional):',
  storyPlaceholder: 'e.g. We shared a warm childhood memory...',
  quickDaubBtn: 'Quick Daub (+50 pts)',
  recordStoryBtn: 'Save Story & Daub',
  withLabel: 'with',
  notDrawnYetWarn: 'This number has not been drawn from the drum yet!',
  cardWonBadge: 'BINGO!',
  linesCountLabel: 'lines',

  drumTitle: 'Number Tumbler',
  readyToRoll: 'Ready to Draw',
  waitingForHostShort: 'Waiting for organizer...',
  drumSpinning: 'Tumbler spinning...',
  ballsRemainingSuffix: 'balls left',
  drawNextBtn: 'Draw Next Ball',
  drawingBtn: 'Drawing...',
  scrambleBtn: 'Scramble Balls',
  autoOffBtn: 'Auto Draw OFF',
  autoOnBtn: 'Auto Draw ON',
  refillBtn: 'Refill Tumbler',
  hostControlsNote: 'Only the organizer controls ball draws — all participants receive balls live.',
  historyEmpty: 'No balls drawn yet',
  latestCallsTitle: 'Recent Called Balls',

  claimModalBadge: 'BINGO SHOUT CONFIRMED!',
  claimModalTitleFull: 'FULL HOUSE BINGO!',
  claimModalTitleLine: 'BINGO SHOUT!',
  claimModalPatternLabel: 'Pattern:',
  claimModalCardPrefix: 'Card #',
  claimModalRoundPrefix: 'Round',
  claimModalTaskBadge: 'Winner Task',
  claimModalNewRoundNote: '🔄 A new round will start automatically in a moment for all players!',
  claimModalContinuesLine3: '➡️ Congratulations! Game continues to 3 Lines.',
  claimModalContinuesFull: '➡️ Great job! Game continues to Full House.',
  claimModalStartNewRoundNow: '🔄 Start New Round Now',
  claimModalCloseBtn: 'Close & Celebrate',
  claimModalAcknowledgeBtn: 'Awesome, Keep Playing!',

  winnerTaskBadge: 'Winner Task!',
  winnerTaskContinueBtn: 'Keep Playing!',
  winnerTaskDoneBtn: 'Complete Task',
  winnerTaskRewardLabel: 'spark pts',

  victoryBadge: 'BINGO VICTORY!',
  victoryFullHeadline: 'CONGRATULATIONS! FULL HOUSE BINGO!',
  victoryLineHeadline: 'BINGO! LINE COMPLETED!',
  victoryTotalPoints: 'Total Points',
  victoryBallsDrawn: 'Balls Drawn',
  victoryWinningCard: 'Winning Card',
  victoryStoriesTitle: 'Shared Moments This Round',
  victoryPlayNewRound: 'Play New Round',
  victoryBackToStart: 'Back to Start',
  victoryShareJoy: 'Share the Joy',
  victoryClose: 'Close',

  participantsTitle: 'Participants',
  participantsSubtitle: 'Add or remove player names for this game.',
  participantsPlaceholder: 'Enter player name...',
  participantsAddBtn: 'Add',
  participantsEmpty: 'No participants added yet.',
  participantsRemove: 'Remove',
  participantsCountLabel: 'participants',

  selectorTitle: 'Choose Game Mode',
  selectorSubtitle: 'Switch freely between all games in the same event',
  selectorLockedNote: 'Sign in and activate playtime or the 10-min free trial to unlock all games.',
  selectorTrialNote: '10-minute free trial active — explore every game!',
  selectorOpenAllNote: 'All game formats are open for your event!',
  selectorSelectBtn: 'Open Game',
  selectorGames: {
    bingoTitle: 'Social & Classic Bingo',
    bingoDesc: '75-ball 3D tumbler, conversation prompts & big screen',
    remoteTitle: 'Remote Bingo (Mobile & Code)',
    remoteDesc: 'Participants join free with code from their phones',
    musicTitle: 'Digital Music Bingo (50+)',
    musicDesc: 'Play song clips, recognize tracks & mark your board',
    quizAdultTitle: 'Culture, Music & Fan Quiz',
    quizAdultDesc: 'Team quiz with buzzer, scores & big screen',
    quizFamilyTitle: 'Family & Kids Quiz',
    quizFamilyDesc: 'Fun questions for children and adults together',
    quizChristmasTitle: 'Christmas Quiz & Mime',
    quizChristmasDesc: '300 holiday questions and 80 playful mime cards',
    quizSeniorTitle: 'Senior Grenland Quiz',
    quizSeniorDesc: 'Music guessing, local history & warm memories',
    memoryTitle: 'Memory (Picture Matching)',
    memoryDesc: '30 picture cards / 15 pairs with team scoring',
  },

  musicTitle: 'Digital Music Bingo',
  musicHallSubtitle: 'Listen to the music clip and tap the song you recognize!',
  musicWaitingHost: 'Waiting for the organizer to play the next clip...',
  musicCurrentClip: 'Now playing a music clip',
  musicHiddenSong: 'Mystery song — listen closely and find it on your board!',
  musicSecondsLeft: 'sec left',
  musicShoutBtnPrefix: 'SHOUT MUSIC BINGO:',
  musicNeedLineHint: 'Mark at least one full line of played songs to shout Music Bingo!',
  musicAllClaimedHint: 'All milestones claimed this round — waiting for next round!',
  musicProgressLabel: 'Progress',
  musicSongsGridTitle: 'Your Music Bingo Board (5×5)',
  musicTapToMarkHint: 'Tap tiles as songs are played by the organizer',
  musicNewRoundNotice: '🔄 New Music Bingo round (Round {n}) started!',
  musicNotPlayedWarn: 'This song has not been played by the organizer yet!',
  musicAlreadyClaimedWarn: 'This milestone has already been claimed by another player!',

  remoteModalTitle: 'Remote Bingo & Live Room',
  remoteTabHost: 'Host Room',
  remoteTabJoin: 'Join with Code',
  remoteTabMusic: 'Music Bingo Board',
  remoteHostLockedTitle: 'Organizer Access Required',
  remoteHostLockedDesc: 'Activate playtime or the 10-min free trial on the start screen to share a room code.',
  remoteJoinTitle: 'Join a Bingo Room',
  remoteJoinDesc: 'Enter the 4-digit room code and your name — completely free for participants!',
  remoteCodeLabel: 'Room Code',
  remoteCodePlaceholder: 'e.g. 4821',
  remoteNameLabel: 'Your Name',
  remoteNamePlaceholder: 'Enter your name...',
  remoteJoinBtn: 'Join Game',
  remoteJoiningBtn: 'Joining room...',
  remoteActiveCodeLabel: 'Active Room Code',
  remoteCopyInviteBtn: 'Copy Invite Link',
  remoteParticipantsTitle: 'Connected Participants',
  remoteNoParticipants: 'No remote participants connected yet.',
  remotePlayingAs: 'Playing as',
  remoteLeaveRoomBtn: 'Leave Room',
  remoteMilestonesStatus: 'Milestones This Round',
  remoteClaimedByPrefix: 'Won by',
  remoteWaitingOpen: 'Available',
  remoteDrawSyncHint: 'Every drawn ball syncs automatically to all phones.',
  remoteInvalidCode: 'No active bingo round found with this code.',
  remoteEnterNameErr: 'Please enter your name first.',

  audienceLockedTitle: 'Sign In & Playtime Required for Big Screen',
  audienceLockedDesc: 'Big Screen display requires an active organizer sign-in and valid playtime.',
  audienceTabMain: 'Big Screen',
  audienceTabMusic: 'Music Bingo (50+)',
  audienceTabSplit: 'Split View',
  audienceTabFlashboard: '75-Flashboard',
  audienceTabStories: 'Stories',
  audienceTabLeaderboard: 'Leaderboard',
  audienceCodeOnTvOn: 'Code on TV: ON',
  audienceShowCode: 'Show Code',
  audienceTvLink: 'TV Link',
  audienceCleanTv: 'Clean TV',
  audienceScreenLocked: 'Screen Locked',
  audienceLockScreen: 'Lock Screen',
  audienceParticipantsBar: 'Players Playing Together',
  audienceNewRoundBtn: 'New Round',
  audienceMusicHallCardTitle: 'Seniors & Large Hall (50+ guests)',
  audiencePrint50Btn: 'Print 50–100 Cards',
  audienceMusicLinkBtn: 'Digital Board Link',
  audienceDrawRandomSong: 'Draw Random Song',
  audienceRevealTitle: 'Reveal Title',
  audienceHideTitle: 'Hide Title',
  audienceReplayClip: 'Replay Clip',
  audienceStopClip: 'Stop Clip',
  audienceSearchSongPlaceholder: 'Search song, artist or decade...',
  audienceAllCategories: 'All',
  audiencePlayedSongsTitle: 'Played Songs This Round',
  audienceStoriesEmpty: 'No stories shared yet — mark a square with a story!',
  audienceLeaderboardTitle: 'Leaderboard & Lines',

  tvWaitingTitle: 'TV / Projector Big Screen',
  tvWaitingDesc: 'Enter the room code from the organizer to display live draws on TV or projector.',
  tvEnterCodePlaceholder: 'Room code (e.g. 4821)',
  tvConnectBtn: 'Connect TV View',
  tvExitBtn: 'Exit TV View',
  tvCalledCountLabel: 'Called',
  tvCurrentBallLabel: 'LATEST BALL',
  tvWaitingFirstBall: 'Waiting for first ball...',
  tvLatestBallsLabel: 'Recent Balls',
  tvPlayersStatusLabel: 'Players in Room',
  tvCodeHiddenLabel: 'Code hidden by organizer',
  tvRoomCodeLabel: 'Room Code',
  tvMusicPlayingLabel: 'Music Bingo Live',
  tvMusicMysteryTitle: 'Listen to the music!',
};

const TI: BingoUiTexts = {
  ...EN,
  startMenu: 'መበገሲ ገጽ',
  tools: 'መሳርሒታት',
  mobile: 'ሞባይል',
  pc: 'ኮምፒዩተር',
  tvProjector: 'ቲቪ / ፕሮጀክተር',
  screenSizeLabel: 'ዓቐን ስክሪን',
  ok: 'እወ',
  close: 'ዕጾ',
  cancel: 'ስረዝ',
  save: 'ኣቐምጥ',
  round: 'ዙር',
  player: 'ተጻዋታይ',
  players: 'ተጻወትቲ',
  card: 'ካርድ',
  cards: 'ካርድታት',
  host: 'ኣዳላዊ',
  code: 'ኮድ',
  codeHidden: 'ኮድ ተሓቢኡ',
  guest: 'ጋሻ',
  copied: '✓ ተቐዲሑ!',
  copyCode: 'ኮድ ቅዳሕ',
  copyLink: 'ሊንክ ቅዳሕ',
  copiedLink: '✓ ሊንክ ተቐዲሑ!',
  print: 'ኣሕትም',
  muteSound: 'ድምጺ ኣጥፍእ',
  unmuteSound: 'ድምጺ ኣብርህ',
  fullscreen: 'ምሉእ ስክሪን ቲቪ',
  exitFullscreen: 'ምሉእ ስክሪን ዕጾ',
  backToStart: '⇦ ናብ መበገሲ ገጽ ተመለስ',
  join: 'ተሳተፍ',
  leave: 'ውጻእ',
  connecting: 'ይተኣሳሰር ኣሎ...',
  connected: 'ተኣሳሲሩ',
  live: 'ቀጥታዊ',

  milestoneLine1: '1ይ መስመር',
  milestoneLine3: '3 መስመራት',
  milestoneFullbrett: 'ምሉእ ሰሌዳ',
  claimedBy: 'ዝወሰዶ',
  continuesToLine3: 'ጸወታ ናብ 3 መስመራት ይቕጽል!',
  continuesToFullbrett: 'ጸወታ ናብ ምሉእ ሰሌዳ ይቕጽል!',
  newRoundStartsSoon: 'ሓድሽ ዙር ድሕሪ ቁሩብ ይጅምር!',
  shoutedBannerPrefix: '🏆',
  shoutedBannerMid: 'መሊኡ',
  shoutedBannerSuffix: 'BINGO ኢሉ ጨዲሩ!',
  roundAutoResetMsg: '🔄 ድሕሪ ምሉእ ሰሌዳ BINGO ብ {winner} ዙር {n} ብባዕሉ ተጀሚሩ!',
  roundManualResetMsg: '🔄 ሓድሽ ዙር ቢንጎ (ዙር {n}) ተጀሚሩ!',
  pressBingoBtn: 'BINGO በል!',
  allMilestonesWon: 'ኩሎም ሸቶታት ተወዲኦም — ሓድሽ ዙር ይጽበ ኣሎ!',
  noEligibleLineYet: 'ቅድም ካብ ከበሮ ዝወጹ ቁጽርታት ብምልኡ ሓደ መስመር ምልክት ግበር።',
  liveActivityTitle: 'ቀጥታዊ ምልክታታትን BINGOን',
  noUnreadAlerts: 'ገና ሓድሽ ምልክታ የለን።',
  markAllRead: 'ከም ዝተነበ ምልክት ግበር',

  freeSpaceLabel: 'ነጻ',
  lastFromDrum: 'ናይ መወዳእታ ኵዕሶ:',
  scanAndTap: 'ካርድካ ርአን ንምርግጋጽ ጠውቕን',
  drawNextBtn: 'ቀጻሊ ኵዕሶ ኣውጽእ',
  drawingBtn: 'ይስሕብ ኣሎ...',
  scrambleBtn: 'ኵዕሶታት ኣንቀሳቕስ',
  refillBtn: 'ከበሮ ዳግማይ ምላእ',
  newRoundBtn: 'ሓድሽ ዙር',
  resetGameBtn: 'ዳግማይ ጀምር',
  pauseTitle: 'ጸወታ ጠጠው ኢሉ',
  resumeGameBtn: 'ጸወታ ቀጽል',
  claimModalBadge: 'BINGO ተረጋጊጹ!',
  claimModalTitleFull: 'ምሉእ ሰሌዳ BINGO!',
  claimModalTitleLine: 'BINGO!',
  claimModalStartNewRoundNow: '🔄 ሓድሽ ዙር ሕጂ ጀምር',
  claimModalCloseBtn: 'ዕጾ',
  claimModalAcknowledgeBtn: 'ቀጽል!',
  victoryPlayNewRound: 'ሓድሽ ዙር ተጻወት',
  victoryBackToStart: 'ናብ መበገሲ ገጽ',
  musicTitle: 'ዲጂታል ሙዚቃ ቢንጎ',
  musicWaitingHost: 'ኣዳላዊ ቀጻሊ ደርፊ ክሳብ ዝኸፍት ይጽበ ኣሎ...',
  musicShoutBtnPrefix: 'ሙዚቃ ቢንጎ:',
  remoteModalTitle: 'ናይ ርሑቕ ቢንጎን ቀጥታዊ ክፍልን',
  remoteJoinBtn: 'ኣብ ጸወታ ተሳተፍ',
  remoteLeaveRoomBtn: 'ካብ ክፍሊ ውጻእ',
  tvConnectBtn: 'ናብ ቲቪ ኣራኽብ',
  tvExitBtn: 'ካብ ቲቪ ውጻእ',
};

const SV: BingoUiTexts = {
  ...NB,
  startMenu: 'Startmeny',
  tools: 'Verktyg',
  mobile: 'Mobil',
  pc: 'PC',
  tvProjector: 'TV / Projektor',
  screenSizeLabel: 'Skärmstorlek',
  close: 'Stäng',
  cancel: 'Avbryt',
  save: 'Spara',
  round: 'Omgång',
  player: 'Spelare',
  players: 'spelare',
  card: 'Bricka',
  cards: 'brickor',
  host: 'Arrangör',
  code: 'Kod',
  codeHidden: 'Kod dold',
  guest: 'Gäst',
  copied: '✓ Kopierad!',
  copyCode: 'Kopiera kod',
  copyLink: 'Kopiera inbjudningslänk',
  copiedLink: '✓ Länk kopierad!',
  print: 'Skriv ut',
  muteSound: 'Stäng av ljud',
  unmuteSound: 'Slå på ljud',
  fullscreen: 'Helskärm TV',
  exitFullscreen: 'Avsluta helskärm',
  backToStart: '⇦ Tillbaka till startmenyn',
  join: 'Gå med',
  leave: 'Lämna',
  connecting: 'Ansluter...',
  connected: 'Ansluten',
  live: 'Direkt',

  milestoneLine1: '1 rad',
  milestoneLine3: '3 rader',
  milestoneFullbrett: 'Full bricka',
  claimedBy: 'tagen av',
  continuesToLine3: 'Spelet fortsätter till 3 rader!',
  continuesToFullbrett: 'Spelet fortsätter till Full bricka!',
  newRoundStartsSoon: 'Ny omgång startar strax!',
  shoutedBannerMid: 'fyllde',
  shoutedBannerSuffix: 'och ropade BINGO!',
  roundAutoResetMsg: '🔄 Omgång {n} startade automatiskt efter Full bricka BINGO av {winner}!',
  roundManualResetMsg: '🔄 Ny bingoomgång (Omgång {n}) har startat!',
  pressBingoBtn: 'ROPA BINGO!',
  allMilestonesWon: 'Alla delmål tagna denna omgång — väntar på ny omgång!',
  noEligibleLineYet: 'Markera först alla dragna nummer i en hel rad.',
  physicalConfirmHint: 'Skanna brickan & tryck för att bekräfta',
  waitingBallsHint: 'Nummer i raden måste vara dragna innan du kan ropa BINGO.',
  liveActivityTitle: 'Senaste händelser & BINGO-rop',
  noUnreadAlerts: 'Inga nya aviseringar ännu.',
  markAllRead: 'Markera som läst',

  modeAllInOne: 'Allt-i-ett',
  modeCallerOnly: 'Värd / Trumma',
  modePassPlay: 'Spelkväll',
  modeHumanBingo: 'Endast bricka',
  fmtNumbers: 'Endast siffror (1–75)',
  fmtBoth: 'Siffror + Ord',
  fmtPrompts: 'Endast ord',
  cardNumberPrefix: 'Bricka #',
  numberedCardLabel: '1–75 Sifferbricka',
  joyCardLabel: 'Glädjebricka',
  cardsInPlayLabel: 'Brickor i spel',
  shareProgressBtn: 'Dela framsteg',
  newRoundBtn: 'Ny omgång',
  resetGameBtn: 'Återställ',
  pauseTitle: 'Spelet pausat',
  pauseDesc: 'Vill du fortsätta spela eller gå tillbaka till startmenyn?',
  resumeGameBtn: 'Fortsätt spela',
  quitKeepBtn: 'Gå till startmenyn (behåll framsteg)',
  startFreshBtn: 'Börja om från början',
  bannedTitle: 'Tillfällig paus från rummet',
  bannedDesc: 'Ditt konto är tillfälligt pausat i 10 minuter.',
  questDoneBadge: 'Dagligt uppdrag klart!',
  claimStarBtn: 'Hämta stjärnbelöning',
  levelUpTitle: 'Nivå upp! Du är nu:',
  wellbeingTitle: 'Socialt välbefinnande',
  wellbeingDesc: 'Kom ihåg att ta pauser, dricka vatten och dela fina samtal.',
  wellbeingCta: 'Fortsätt med glädje',
  trialEndedLabel: 'Provtiden har löpt ut',
  participantJoinedRoom: '👋 {name} gick med i rummet!',
  youJoinedTitle: 'Du är med i spelet!',
  youJoinedDesc: 'Håll koll på din bricka — dragna bollar synkas automatiskt.',
  tvLinkBtn: 'TV-länk',
  tvModeBtn: 'Ren TV',
  openBigScreenBtn: 'Storbild',
  openRemoteBtn: 'Distansbingo',
  openMusicBingoBtn: 'Musikbingo',
  openSeniorQuizBtn: 'Senior Quiz',
  gameMenuBtn: 'Spelmeny',
  roomCodeOpenNotice: 'Deltagarkod är aktiv för mobil och TV',
  remoteConnectedCount: '{n} mobiler anslutna',
  timeWarningPrefix: 'Endast',
  timeWarningSuffix: 'kvar av speltiden!',
  extendTimeBtn: 'Förläng speltid',
  sessionExpiredTitle: 'Speltiden har löpt ut',
  sessionExpiredDesc: 'Sessionen avslutades automatiskt vid 00:00:00.',

  freeSpaceLabel: 'GRATIS',
  lastFromDrum: 'Senaste från trumman:',
  scanAndTap: 'Skanna brickan & tryck för att bekräfta',
  markConfirmTitle: 'Bekräfta ruta & dela ögonblick',
  markConfirmSubtitle: 'Snabbmarkera eller skriv vem du pratade med.',
  partnerNameLabel: 'Medspelare / vän (valfritt):',
  partnerPlaceholder: 'T.ex. Anna eller Bord 2',
  storyLabel: 'Kort berättelse (valfritt):',
  storyPlaceholder: 'T.ex. Vi delade ett fint minne...',
  quickDaubBtn: 'Snabbmarkering (+50 p)',
  recordStoryBtn: 'Spara & markera',
  withLabel: 'med',
  notDrawnYetWarn: 'Detta nummer har inte dragits ännu!',
  linesCountLabel: 'rader',

  drumTitle: 'Dragningstrumma',
  readyToRoll: 'Redo att dra',
  waitingForHostShort: 'Väntar på arrangören...',
  drumSpinning: 'Trumman snurrar...',
  ballsRemainingSuffix: 'bollar kvar',
  drawNextBtn: 'Dra nästa boll',
  drawingBtn: 'Drar...',
  scrambleBtn: 'Blanda bollarna',
  autoOffBtn: 'Autodragning AV',
  autoOnBtn: 'Autodragning PÅ',
  refillBtn: 'Fyll på trumman',
  hostControlsNote: 'Endast arrangören styr dragningen — alla deltagare ser bollarna direkt.',
  historyEmpty: 'Inga bollar dragna ännu',
  latestCallsTitle: 'Senast dragna bollar',

  claimModalBadge: 'BINGO-ROP BEKRÄFTAT!',
  claimModalTitleFull: 'FULL BRICKA BINGO!',
  claimModalTitleLine: 'BINGO-ROP!',
  claimModalPatternLabel: 'Mönster:',
  claimModalCardPrefix: 'Bricka #',
  claimModalRoundPrefix: 'Omgång',
  claimModalTaskBadge: 'Vinnaruppdrag',
  claimModalNewRoundNote: '🔄 En ny omgång startar automatiskt om ett ögonblick!',
  claimModalContinuesLine3: '➡️ Grattis! Spelet fortsätter till 3 rader.',
  claimModalContinuesFull: '➡️ Bra jobbat! Spelet fortsätter till Full bricka.',
  claimModalStartNewRoundNow: '🔄 Starta ny omgång nu',
  claimModalCloseBtn: 'Stäng och fira vidare',
  claimModalAcknowledgeBtn: 'Toppen, fortsätt spelet!',

  winnerTaskBadge: 'Vinnaruppdrag!',
  winnerTaskContinueBtn: 'Fortsätt spelet!',
  winnerTaskDoneBtn: 'Slutför uppdrag',
  winnerTaskRewardLabel: 'glädjepoäng',

  victoryBadge: 'BINGO SEGER!',
  victoryFullHeadline: 'GRATTIS! FULL BRICKA BINGO!',
  victoryLineHeadline: 'BINGO! RAD KLAR!',
  victoryTotalPoints: 'Totalpoäng',
  victoryBallsDrawn: 'Dragna bollar',
  victoryWinningCard: 'Vinnarbricka',
  victoryStoriesTitle: 'Delade ögonblick i denna omgång',
  victoryPlayNewRound: 'Spela ny omgång',
  victoryBackToStart: 'Till startmenyn',
  victoryShareJoy: 'Dela glädjen',
  victoryClose: 'Stäng',

  participantsTitle: 'Deltagarlista',
  participantsSubtitle: 'Lägg till eller ta bort spelarnamn.',
  participantsPlaceholder: 'Skriv deltagarnamn...',
  participantsAddBtn: 'Lägg till',
  participantsEmpty: 'Inga deltagare tillagda ännu.',
  participantsRemove: 'Ta bort',
  participantsCountLabel: 'deltagare',

  selectorTitle: 'Välj Spelläge',
  selectorSubtitle: 'Växla fritt mellan alla spel i samma arrangemang',
  selectorLockedNote: 'Logga in och aktivera speltid eller 10 min gratis provspel.',
  selectorTrialNote: '10 minuters provtid aktiv — testa alla spel!',
  selectorOpenAllNote: 'Alla spelformat är öppna!',
  selectorSelectBtn: 'Öppna spel',

  musicTitle: 'Digital Musikbingo',
  musicHallSubtitle: 'Lyssna på musikklippet och tryck på låten du känner igen!',
  musicWaitingHost: 'Väntar på att arrangören spelar nästa klipp...',
  musicCurrentClip: 'Nu spelas ett musikklipp',
  musicHiddenSong: 'Dold låt — lyssna noga och hitta den på brickan!',
  musicSecondsLeft: 'sek kvar',
  musicShoutBtnPrefix: 'ROPA MUSIKBINGO:',
  musicNeedLineHint: 'Markera minst en hel rad av spelade låtar!',
  musicAllClaimedHint: 'Alla delmål tagna denna omgång — väntar på ny omgång!',
  musicProgressLabel: 'Framsteg',
  musicSongsGridTitle: 'Din Musikbingo-bricka (5×5)',
  musicTapToMarkHint: 'Tryck på rutorna när låten spelas av arrangören',
  musicNewRoundNotice: '🔄 Ny Musikbingo-omgång (Omgång {n}) startad!',
  musicNotPlayedWarn: 'Den här låten har inte spelats av arrangören ännu!',
  musicAlreadyClaimedWarn: 'Detta delmål har redan tagits av en annan spelare!',

  remoteModalTitle: 'Distansbingo & Direktrad',
  remoteTabHost: 'Arrangera rum',
  remoteTabJoin: 'Gå med med kod',
  remoteTabMusic: 'Musikbingo-bricka',
  remoteJoinBtn: 'Gå med i spelet',
  remoteJoiningBtn: 'Ansluter...',
  remoteLeaveRoomBtn: 'Lämna rummet',
  remoteInvalidCode: 'Ingen aktiv bingoomgång hittades med den koden.',
  remoteEnterNameErr: 'Skriv ditt namn först.',

  audienceTabMain: 'Storbild',
  audienceTabMusic: 'Musikbingo (50+)',
  audienceTabSplit: 'Delad vy',
  audienceTabFlashboard: '75-Nummerbräda',
  audienceTabStories: 'Berättelser',
  audienceTabLeaderboard: 'Ställning',
  audienceNewRoundBtn: 'Ny omgång',
  audiencePrint50Btn: 'Skriv ut 50–100 brickor',
  audienceDrawRandomSong: 'Dra slumpad låt',
  tvConnectBtn: 'Anslut TV-vy',
  tvExitBtn: 'Avsluta TV-vy',
};

const DE: BingoUiTexts = {
  ...EN,
  startMenu: 'Startmenü',
  tools: 'Werkzeuge',
  mobile: 'Mobil',
  pc: 'PC',
  tvProjector: 'TV / Beamer',
  screenSizeLabel: 'Bildschirmgröße',
  close: 'Schließen',
  cancel: 'Abbrechen',
  save: 'Speichern',
  round: 'Runde',
  player: 'Spieler',
  players: 'Spieler',
  card: 'Karte',
  cards: 'Karten',
  host: 'Veranstalter',
  code: 'Code',
  codeHidden: 'Code verborgen',
  guest: 'Gast',
  copied: '✓ Kopiert!',
  copyCode: 'Code kopieren',
  copyLink: 'Einladungslink kopieren',
  copiedLink: '✓ Link kopiert!',
  print: 'Drucken',
  muteSound: 'Ton stummschalten',
  unmuteSound: 'Ton aktivieren',
  fullscreen: 'Vollbild TV',
  exitFullscreen: 'Vollbild beenden',
  backToStart: '⇦ Zurück zum Startmenü',
  join: 'Beitreten',
  leave: 'Verlassen',
  connecting: 'Verbinde...',
  connected: 'Verbunden',

  milestoneLine1: '1. Reihe',
  milestoneLine3: '3 Reihen',
  milestoneFullbrett: 'Volle Karte',
  claimedBy: 'gewonnen von',
  continuesToLine3: 'Das Spiel geht weiter bis 3 Reihen!',
  continuesToFullbrett: 'Das Spiel geht weiter bis Volle Karte!',
  newRoundStartsSoon: 'Neue Runde startet gleich!',
  shoutedBannerMid: 'hat erfüllt:',
  shoutedBannerSuffix: 'und BINGO gerufen!',
  roundAutoResetMsg: '🔄 Runde {n} startete automatisch nach Volle Karte BINGO von {winner}!',
  roundManualResetMsg: '🔄 Neue Bingorunde (Runde {n}) gestartet!',
  pressBingoBtn: 'BINGO RUFEN!',
  allMilestonesWon: 'Alle Meilensteine dieser Runde gewonnen — warte auf neue Runde!',
  noEligibleLineYet: 'Markiere zuerst eine vollständige gezogene Reihe.',
  physicalConfirmHint: 'Karte prüfen & Felder antippen',
  waitingBallsHint: 'Alle Zahlen der Reihe müssen gezogen worden sein.',
  liveActivityTitle: 'Live-Meldungen & BINGO-Rufe',
  noUnreadAlerts: 'Noch keine neuen Meldungen.',
  markAllRead: 'Als gelesen markieren',

  modeAllInOne: 'Alles-in-einem',
  modeCallerOnly: 'Leiter / Trommel',
  modePassPlay: 'Spieleabend',
  modeHumanBingo: 'Nur Karten',
  fmtNumbers: 'Nur Zahlen (1–75)',
  fmtBoth: 'Zahlen + Wörter',
  fmtPrompts: 'Nur Wörter',
  cardNumberPrefix: 'Karte #',
  numberedCardLabel: '1–75 Zahlenkarte',
  joyCardLabel: 'Freudenkarte',
  cardsInPlayLabel: 'Karten im Spiel',
  shareProgressBtn: 'Fortschritt teilen',
  newRoundBtn: 'Neue Runde',
  resetGameBtn: 'Zurücksetzen',
  pauseTitle: 'Spiel pausiert',
  pauseDesc: 'Möchtest du weiterspielen oder zum Startmenü zurückkehren?',
  resumeGameBtn: 'Weiterspielen',
  quitKeepBtn: 'Zum Startmenü (Fortschritt behalten)',
  startFreshBtn: 'Neu starten',
  freeSpaceLabel: 'FREI',
  lastFromDrum: 'Zuletzt gezogen:',
  scanAndTap: 'Karte prüfen & tippen zum Bestätigen',
  markConfirmTitle: 'Feld bestätigen & Moment teilen',
  quickDaubBtn: 'Schnell markieren (+50 Pkt)',
  recordStoryBtn: 'Notiz speichern & markieren',
  notDrawnYetWarn: 'Diese Zahl wurde noch nicht gezogen!',
  linesCountLabel: 'Reihen',

  drumTitle: 'Ziehungstrommel',
  readyToRoll: 'Bereit zum Ziehen',
  waitingForHostShort: 'Warte auf Veranstalter...',
  drumSpinning: 'Trommel dreht...',
  ballsRemainingSuffix: 'Kugeln übrig',
  drawNextBtn: 'Nächste Kugel ziehen',
  drawingBtn: 'Zieht...',
  scrambleBtn: 'Kugeln mischen',
  autoOffBtn: 'Auto-Ziehung AUS',
  autoOnBtn: 'Auto-Ziehung AN',
  refillBtn: 'Trommel neu füllen',
  hostControlsNote: 'Nur der Veranstalter steuert die Ziehung — alle Spieler empfangen live.',
  historyEmpty: 'Noch keine Kugeln gezogen',
  latestCallsTitle: 'Zuletzt gezogene Kugeln',

  claimModalBadge: 'BINGO-RUF BESTÄTIGT!',
  claimModalTitleFull: 'VOLLE KARTE BINGO!',
  claimModalTitleLine: 'BINGO-RUF!',
  claimModalStartNewRoundNow: '🔄 Jetzt neue Runde starten',
  claimModalCloseBtn: 'Schließen & Feiern',
  claimModalAcknowledgeBtn: 'Super, weiterspielen!',
  victoryPlayNewRound: 'Neue Runde spielen',
  victoryBackToStart: 'Zum Startmenü',

  musicTitle: 'Digitales Musik-Bingo',
  musicWaitingHost: 'Warte auf den nächsten Musikclip vom Veranstalter...',
  musicShoutBtnPrefix: 'MUSIK-BINGO RUFEN:',
  musicNewRoundNotice: '🔄 Neue Musik-Bingo-Runde (Runde {n}) gestartet!',

  remoteModalTitle: 'Fern-Bingo & Live-Raum',
  remoteTabHost: 'Raum leiten',
  remoteTabJoin: 'Mit Code beitreten',
  remoteTabMusic: 'Musik-Bingo-Karte',
  remoteJoinBtn: 'Spiel beitreten',
  remoteLeaveRoomBtn: 'Raum verlassen',
  tvConnectBtn: 'TV-Ansicht verbinden',
  tvExitBtn: 'TV-Ansicht beenden',
};

const ES: BingoUiTexts = {
  ...EN,
  startMenu: 'Menú de Inicio',
  tools: 'Herramientas',
  mobile: 'Móvil',
  pc: 'PC',
  tvProjector: 'TV / Proyector',
  screenSizeLabel: 'Tamaño de pantalla',
  close: 'Cerrar',
  cancel: 'Cancelar',
  save: 'Guardar',
  round: 'Ronda',
  player: 'Jugador',
  players: 'jugadores',
  card: 'Cartón',
  cards: 'cartones',
  host: 'Organizador',
  code: 'Código',
  codeHidden: 'Código oculto',
  guest: 'Invitado',
  copied: '✓ ¡Copiado!',
  copyCode: 'Copiar código',
  copyLink: 'Copiar enlace',
  copiedLink: '✓ ¡Enlace copiado!',
  print: 'Imprimir',
  muteSound: 'Silenciar sonido',
  unmuteSound: 'Activar sonido',
  fullscreen: 'Pantalla completa TV',
  exitFullscreen: 'Salir de pantalla completa',
  backToStart: '⇦ Volver al menú principal',
  join: 'Unirse',
  leave: 'Salir',
  connecting: 'Conectando...',
  connected: 'Conectado',
  live: 'En vivo',

  milestoneLine1: '1.ª Línea',
  milestoneLine3: '3 Líneas',
  milestoneFullbrett: 'Cartón Lleno',
  claimedBy: 'ganado por',
  continuesToLine3: '¡El juego continúa hasta 3 Líneas!',
  continuesToFullbrett: '¡El juego continúa hasta Cartón Lleno!',
  newRoundStartsSoon: '¡Nueva ronda en breve!',
  shoutedBannerMid: 'completó',
  shoutedBannerSuffix: 'y gritó ¡BINGO!',
  roundAutoResetMsg: '🔄 ¡Ronda {n} iniciada automáticamente tras Cartón Lleno de {winner}!',
  roundManualResetMsg: '🔄 ¡Nueva ronda de bingo (Ronda {n}) iniciada!',
  pressBingoBtn: '¡GRITAR BINGO!',
  allMilestonesWon: '¡Todos los premios ganados esta ronda — esperando nueva ronda!',
  noEligibleLineYet: 'Marca primero una línea completa de bolas extraídas.',
  liveActivityTitle: 'Avisos en vivo y gritos de BINGO',
  noUnreadAlerts: 'Sin avisos nuevos todavía.',
  markAllRead: 'Marcar como leído',

  newRoundBtn: 'Nueva ronda',
  resetGameBtn: 'Reiniciar',
  pauseTitle: 'Juego en pausa',
  resumeGameBtn: 'Continuar juego',
  freeSpaceLabel: 'GRATIS',
  lastFromDrum: 'Última del bombo:',
  scanAndTap: 'Revisa el cartón y pulsa para confirmar',
  quickDaubBtn: 'Marcar rápido (+50 pts)',
  recordStoryBtn: 'Guardar y marcar',
  notDrawnYetWarn: '¡Este número aún no ha salido del bombo!',
  linesCountLabel: 'líneas',

  drumTitle: 'Bombo de Bolas',
  readyToRoll: 'Listo para sacar',
  waitingForHostShort: 'Esperando al organizador...',
  drumSpinning: 'El bombo gira...',
  ballsRemainingSuffix: 'bolas restantes',
  drawNextBtn: 'Sacar siguiente bola',
  drawingBtn: 'Sacando...',
  scrambleBtn: 'Mezclar bolas',
  autoOffBtn: 'Auto APAGADO',
  autoOnBtn: 'Auto ENCENDIDO',
  refillBtn: 'Rellenar bombo',

  claimModalBadge: '¡GRITO DE BINGO CONFIRMADO!',
  claimModalTitleFull: '¡BINGO CARTÓN LLENO!',
  claimModalTitleLine: '¡GRITO DE BINGO!',
  claimModalStartNewRoundNow: '🔄 Iniciar nueva ronda ahora',
  claimModalCloseBtn: 'Cerrar y celebrar',
  claimModalAcknowledgeBtn: '¡Genial, seguir jugando!',
  victoryPlayNewRound: 'Jugar nueva ronda',
  victoryBackToStart: 'Volver al inicio',

  musicTitle: 'Bingo Musical Digital',
  musicWaitingHost: 'Esperando al organizador para reproducir la siguiente canción...',
  musicShoutBtnPrefix: 'GRITAR BINGO MUSICAL:',
  musicNewRoundNotice: '🔄 ¡Nueva ronda de Bingo Musical (Ronda {n}) iniciada!',

  remoteModalTitle: 'Bingo Remoto y Sala en Vivo',
  remoteTabHost: 'Organizar sala',
  remoteTabJoin: 'Unirse con código',
  remoteTabMusic: 'Cartón Musical',
  remoteJoinBtn: 'Unirse al juego',
  remoteLeaveRoomBtn: 'Salir de la sala',
  tvConnectBtn: 'Conectar vista TV',
  tvExitBtn: 'Salir de vista TV',
};

const FR: BingoUiTexts = {
  ...EN,
  startMenu: 'Menu principal',
  tools: 'Outils',
  mobile: 'Mobile',
  pc: 'PC',
  tvProjector: 'TV / Projecteur',
  screenSizeLabel: 'Taille d’écran',
  close: 'Fermer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  round: 'Manche',
  player: 'Joueur',
  players: 'joueurs',
  card: 'Grille',
  cards: 'grilles',
  host: 'Organisateur',
  code: 'Code',
  codeHidden: 'Code masqué',
  guest: 'Invité',
  copied: '✓ Copié !',
  copyCode: 'Copier le code',
  copyLink: 'Copier le lien',
  copiedLink: '✓ Lien copié !',
  print: 'Imprimer',
  muteSound: 'Couper le son',
  unmuteSound: 'Activer le son',
  fullscreen: 'Plein écran TV',
  exitFullscreen: 'Quitter plein écran',
  backToStart: '⇦ Retour au menu',
  join: 'Rejoindre',
  leave: 'Quitter',
  connecting: 'Connexion...',
  connected: 'Connecté',
  live: 'En direct',

  milestoneLine1: '1re Ligne',
  milestoneLine3: '3 Lignes',
  milestoneFullbrett: 'Carton Plein',
  claimedBy: 'gagné par',
  continuesToLine3: 'La partie continue jusqu’à 3 Lignes !',
  continuesToFullbrett: 'La partie continue jusqu’au Carton Plein !',
  newRoundStartsSoon: 'Nouvelle manche imminente !',
  shoutedBannerMid: 'a complété',
  shoutedBannerSuffix: 'et crié BINGO !',
  roundAutoResetMsg: '🔄 Manche {n} lancée automatiquement après Carton Plein de {winner} !',
  roundManualResetMsg: '🔄 Nouvelle manche (Manche {n}) lancée !',
  pressBingoBtn: 'CRIER BINGO !',
  allMilestonesWon: 'Tous les paliers remportés — en attente de la prochaine manche !',
  noEligibleLineYet: 'Cochez d’abord une ligne complète de numéros tirés.',
  liveActivityTitle: 'Alertes & Cris de BINGO',
  noUnreadAlerts: 'Aucune alerte pour le moment.',
  markAllRead: 'Tout marquer lu',

  newRoundBtn: 'Nouvelle manche',
  resetGameBtn: 'Réinitialiser',
  pauseTitle: 'Jeu en pause',
  resumeGameBtn: 'Reprendre la partie',
  freeSpaceLabel: 'GRATUIT',
  lastFromDrum: 'Dernier tirage :',
  scanAndTap: 'Vérifiez votre grille et appuyez',
  quickDaubBtn: 'Cocher vite (+50 pts)',
  recordStoryBtn: 'Enregistrer & cocher',
  notDrawnYetWarn: 'Ce numéro n’a pas encore été tiré !',
  linesCountLabel: 'lignes',

  drumTitle: 'Boulier de tirage',
  readyToRoll: 'Prêt à tirer',
  waitingForHostShort: 'En attente de l’organisateur...',
  drumSpinning: 'Le boulier tourne...',
  ballsRemainingSuffix: 'boules restantes',
  drawNextBtn: 'Tirer la boule suivante',
  drawingBtn: 'Tirage...',
  scrambleBtn: 'Mélanger les boules',
  autoOffBtn: 'Auto DÉSACTIVÉ',
  autoOnBtn: 'Auto ACTIVÉ',
  refillBtn: 'Remplir le boulier',

  claimModalBadge: 'CRI DE BINGO CONFIRMÉ !',
  claimModalTitleFull: 'CARTON PLEIN BINGO !',
  claimModalTitleLine: 'CRI DE BINGO !',
  claimModalStartNewRoundNow: '🔄 Lancer nouvelle manche',
  claimModalCloseBtn: 'Fermer & célébrer',
  claimModalAcknowledgeBtn: 'Super, continuer !',
  victoryPlayNewRound: 'Nouvelle manche',
  victoryBackToStart: 'Menu principal',

  musicTitle: 'Bingo Musical Numérique',
  musicWaitingHost: 'En attente du prochain extrait musical...',
  musicShoutBtnPrefix: 'CRIER BINGO MUSICAL :',
  musicNewRoundNotice: '🔄 Nouvelle manche de Bingo Musical (Manche {n}) !',

  remoteModalTitle: 'Bingo à Distance & Salle Live',
  remoteTabHost: 'Animer la salle',
  remoteTabJoin: 'Rejoindre avec code',
  remoteTabMusic: 'Grille Musicale',
  remoteJoinBtn: 'Rejoindre la partie',
  remoteLeaveRoomBtn: 'Quitter la salle',
  tvConnectBtn: 'Connecter la vue TV',
  tvExitBtn: 'Quitter la vue TV',
};

const AR: BingoUiTexts = {
  ...EN,
  startMenu: 'القائمة الرئيسية',
  tools: 'الأدوات',
  mobile: 'جوال',
  pc: 'كمبيوتر',
  tvProjector: 'تلفاز / بروجكتر',
  screenSizeLabel: 'حجم الشاشة',
  ok: 'حسنًا',
  close: 'إغلاق',
  cancel: 'إلغاء',
  save: 'حفظ',
  round: 'جولة',
  player: 'لاعب',
  players: 'لاعبين',
  card: 'بطاقة',
  cards: 'بطاقات',
  host: 'المنظم',
  code: 'الرمز',
  codeHidden: 'الرمز مخفي',
  guest: 'ضيف',
  copied: '✓ تم النسخ!',
  copyCode: 'نسخ الرمز',
  copyLink: 'نسخ رابط الدعوة',
  copiedLink: '✓ تم نسخ الرابط!',
  print: 'طباعة',
  muteSound: 'كتم الصوت',
  unmuteSound: 'تشغيل الصوت',
  fullscreen: 'ملء الشاشة',
  exitFullscreen: 'إنهاء ملء الشاشة',
  backToStart: '⇦ العودة للقائمة الرئيسية',
  join: 'انضمام',
  leave: 'مغادرة',
  connecting: 'جاري الاتصال...',
  connected: 'متصل',
  live: 'مباشر',

  milestoneLine1: 'الخط الأول',
  milestoneLine3: '3 خطوط',
  milestoneFullbrett: 'اللوحة الكاملة',
  claimedBy: 'فاز بها',
  continuesToLine3: 'تستمر اللعبة نحو 3 خطوط!',
  continuesToFullbrett: 'تستمر اللعبة نحو اللوحة الكاملة!',
  newRoundStartsSoon: 'ستبدأ جولة جديدة قريبًا!',
  shoutedBannerMid: 'أكمل',
  shoutedBannerSuffix: 'وصاح بينغو!',
  roundAutoResetMsg: '🔄 بدأت الجولة {n} تلقائيًا بعد فوز {winner} باللوحة الكاملة!',
  roundManualResetMsg: '🔄 بدأت جولة بينغو جديدة (الجولة {n})!',
  pressBingoBtn: 'صِح بينغو!',
  allMilestonesWon: 'تم الفوز بجميع المراحل — بانتظار الجولة الجديدة!',
  noEligibleLineYet: 'حدّد أولاً صفًا كاملاً من الأرقام المسحوبة.',
  liveActivityTitle: 'التنبيهات المباشرة وصيحات بينغو',
  noUnreadAlerts: 'لا توجد تنبيهات جديدة بعد.',
  markAllRead: 'تعيين كمقروء',

  newRoundBtn: 'جولة جديدة',
  resetGameBtn: 'إعادة ضبط',
  pauseTitle: 'اللعبة متوقفة مؤقتًا',
  resumeGameBtn: 'متابعة اللعب',
  freeSpaceLabel: 'مجاني',
  lastFromDrum: 'آخر كرة مسحوبة:',
  scanAndTap: 'افحص بطاقتك واضغط للتأكيد',
  quickDaubBtn: 'تحديد سريع (+50 نقطة)',
  recordStoryBtn: 'حفظ وتحديد',
  notDrawnYetWarn: 'لم يتم سحب هذا الرقم بعد!',
  linesCountLabel: 'خطوط',

  drumTitle: 'وعاء السحب',
  readyToRoll: 'جاهز للسحب',
  waitingForHostShort: 'بانتظار المنظم...',
  drumSpinning: 'جاري تدوير الكرات...',
  ballsRemainingSuffix: 'كرات متبقية',
  drawNextBtn: 'اسحب الكرة التالية',
  drawingBtn: 'جاري السحب...',
  scrambleBtn: 'خلط الكرات',
  autoOffBtn: 'سحب تلقائي متوقف',
  autoOnBtn: 'سحب تلقائي مفعل',
  refillBtn: 'إعادة تعبئة الوعاء',

  claimModalBadge: 'تم تأكيد صيحة بينغو!',
  claimModalTitleFull: 'بينغو اللوحة الكاملة!',
  claimModalTitleLine: 'صيحة بينغو!',
  claimModalStartNewRoundNow: '🔄 ابدأ جولة جديدة الآن',
  claimModalCloseBtn: 'إغلاق والاحتفال',
  claimModalAcknowledgeBtn: 'ممتاز، تابع اللعب!',
  victoryPlayNewRound: 'العب جولة جديدة',
  victoryBackToStart: 'العودة للبداية',

  musicTitle: 'بينغو الموسيقى الرقمي',
  musicWaitingHost: 'بانتظار تشغيل المنظم للمقطع التالي...',
  musicShoutBtnPrefix: 'صِح بينغو الموسيقى:',
  musicNewRoundNotice: '🔄 بدأت جولة بينغو موسيقى جديدة (الجولة {n})!',

  remoteModalTitle: 'البينغو عن بُعد والغرفة المباشرة',
  remoteTabHost: 'إدارة الغرفة',
  remoteTabJoin: 'انضمام بالرمز',
  remoteTabMusic: 'بطاقة الموسيقى',
  remoteJoinBtn: 'انضم للعبة',
  remoteLeaveRoomBtn: 'مغادرة الغرفة',
  tvConnectBtn: 'الاتصال بشاشة التلفاز',
  tvExitBtn: 'الخروج من شاشة التلفاز',
};

const ALL_BINGO_UI: Record<SupportedLanguage, BingoUiTexts> = {
  nb: NB,
  en: EN,
  ti: TI,
  sv: SV,
  de: DE,
  es: ES,
  fr: FR,
  ar: AR,
};

export function getBingoUiTexts(lang: SupportedLanguage): BingoUiTexts {
  return ALL_BINGO_UI[lang] || NB;
}

export function formatMilestoneLabel(tier: BingoMilestone, lang: SupportedLanguage): string {
  const ui = getBingoUiTexts(lang);
  if (tier === 'fullbrett') return ui.milestoneFullbrett;
  if (tier === 'line3') return ui.milestoneLine3;
  return ui.milestoneLine1;
}

export function localizeBingoPattern(pattern: string, lang: SupportedLanguage): string {
  const p = (pattern || '').trim();
  const ui = getBingoUiTexts(lang);
  if (/fullbrett|fullt?\s*brett|full_?house|blackout/i.test(p)) return ui.milestoneFullbrett;
  if (/3\s*\.?\s*rekke|3\s*line|tre\s*rekke/i.test(p)) return ui.milestoneLine3;
  if (/1\s*\.?\s*rekke|1\s*line|en\s*rekke/i.test(p)) return ui.milestoneLine1;
  return p || ui.milestoneLine1;
}

export function localizeServerBingoMessage(msg: string, lang: SupportedLanguage): string {
  const ui = getBingoUiTexts(lang);
  const raw = (msg || '').trim();
  if (!raw) return ui.noEligibleLineYet;
  if (lang === 'nb') return raw;
  if (/allerede vunnet|already.*claimed/i.test(raw)) return ui.musicAlreadyClaimedWarn;
  if (/alle milepæler/i.test(raw)) return ui.allMilestonesWon;
  if (/ikke spilt.*sangen|not played/i.test(raw)) return ui.musicNotPlayedWarn;
  if (/tall i rekken|ikke trukket|trukket og bekreftet|fullført en ny/i.test(raw)) {
    return ui.waitingBallsHint;
  }
  if (/ugyldig.*kode|ingen aktiv bingorunde/i.test(raw)) return ui.remoteInvalidCode;
  return raw;
}
