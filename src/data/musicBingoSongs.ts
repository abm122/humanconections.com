/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MusicDecade = '1950s' | '1960s' | '1970s' | '1980s' | 'Klassiker';

export interface MusicBingoSong {
  id: string;
  title: string;
  artist: string;
  decade: MusicDecade;
  category: 'Norsk allsang' | 'Bygda & Slager' | 'Nordisk skatt' | 'Internasjonal evergreen';
  clipHint: string;
  spotifySearchUrl: string;
}

export interface MusicBingoCell {
  row: number;
  col: number;
  isCenter: boolean;
  song: MusicBingoSong | null;
}

export interface MusicBingoCardData {
  cardId: number;
  grid: MusicBingoCell[][];
}

function makeSpotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

function song(
  id: string,
  title: string,
  artist: string,
  decade: MusicDecade,
  category: MusicBingoSong['category'],
  clipHint: string
): MusicBingoSong {
  return {
    id,
    title,
    artist,
    decade,
    category,
    clipHint,
    spotifySearchUrl: makeSpotifySearchUrl(title, artist),
  };
}

/**
 * 60 tidløse musikkminner fra 1950–1980-tallet skreddersydd for eldre og storsal (50+ deltakere).
 */
export const MUSIC_BINGO_SONGS: MusicBingoSong[] = [
  song('ms-01', 'Lys og varme', 'Åge Aleksandersen', '1980s', 'Norsk allsang', 'Spill refrenget «Når mørket sænke sæ...»'),
  song('ms-02', 'Levva livet', 'Åge Aleksandersen', '1980s', 'Norsk allsang', 'Start på det glade refrenget!'),
  song('ms-03', 'Mil etter mil', 'Jahn Teigen', '1970s', 'Norsk allsang', 'Grand Prix-klassikeren fra 1978'),
  song('ms-04', 'Optimist', 'Jahn Teigen', '1980s', 'Norsk allsang', 'Alle kjenner refrenget «Jeg er en optimist!»'),
  song('ms-05', 'Min første kjærlighet', 'Jahn Teigen', '1980s', 'Norsk allsang', 'Varm allsangklassiker fra 1982'),
  song('ms-06', 'Tanta til Beate', 'Lillebjørn Nilsen', '1980s', 'Norsk allsang', 'Swingende Oslovise med Hot Club de Norvège'),
  song('ms-07', 'Bysommer', 'Lillebjørn Nilsen', '1970s', 'Norsk allsang', '«Bysommer, hete dager...»'),
  song('ms-08', 'Barn av regnbuen', 'Lillebjørn Nilsen', '1970s', 'Norsk allsang', 'Folkekjær allsang alle synger med på'),
  song('ms-09', 'Tango for to', 'Alf Prøysen', '1950s', 'Norsk allsang', 'Nostalgisk Prøysen-perle fra 1957'),
  song('ms-10', 'Slipsteinsvalsen', 'Alf Prøysen', '1950s', 'Norsk allsang', 'Klassisk bygdevals fra Hedmark'),
  song('ms-11', 'Du skal få en dag i mårå', 'Alf Prøysen', '1960s', 'Norsk allsang', 'Varm vise om håp og nye dager'),
  song('ms-12', 'La meg være ung', 'Wenche Myhre', '1960s', 'Norsk allsang', 'Sprudlende 1964-slager med Wenche'),
  song('ms-13', 'Vi lever', 'Wenche Myhre', '1980s', 'Norsk allsang', 'Feststemt allsanghit fra 1983'),
  song('ms-14', 'Vinter og sne', 'Wenche Myhre', '1960s', 'Norsk allsang', 'Kjent fra 1966-vinteren'),
  song('ms-15', 'Oj, oj, oj, så glad jeg skal bli', 'Kirsti Sparboe', '1960s', 'Norsk allsang', 'Melodi Grand Prix-favoritt fra 1969'),
  song('ms-16', 'Nordlandsnetter', 'Kirsti Sparboe', '1960s', 'Norsk allsang', 'Vakker nordnorsk sommervise'),
  song('ms-17', 'Voi Voi', 'Nora Brockstedt', '1960s', 'Norsk allsang', 'Norges aller første Eurovision-bidrag (1960)'),
  song('ms-18', 'Tango for tre', 'Nora Brockstedt', '1950s', 'Norsk allsang', 'Sjarmerende 50-talls slager'),
  song('ms-19', 'Aldri i livet', 'Finn Kalvik', '1980s', 'Norsk allsang', 'Vinner av Melodi Grand Prix 1981'),
  song('ms-20', 'Ride ranke', 'Finn Kalvik', '1970s', 'Norsk allsang', 'Finns vare versjon av «Cat’s in the Cradle»'),
  song('ms-21', 'Kjærlighetsvisa', 'Halvdan Sivertsen', '1980s', 'Norsk allsang', '«Når sommerdagen ligg utover landet...»'),
  song('ms-22', 'Sommerfuggel i vinterland', 'Halvdan Sivertsen', '1980s', 'Norsk allsang', 'Varme ord og sterk melodi'),
  song('ms-23', 'Fru Johnsen', 'Inger Lise Rypdal', '1960s', 'Norsk allsang', 'Stor slager fra 1968 («Harper Valley PTA»)'),
  song('ms-24', 'Romeo og Julie', 'Inger Lise Rypdal', '1960s', 'Norsk allsang', 'Tidlig pophit fra 1969'),
  song('ms-25', 'Jaktprat', 'Øystein Sunde', '1970s', 'Bygda & Slager', 'Lynrask gitar og ellevill humor'),
  song('ms-26', 'Kjekt å ha', 'Øystein Sunde', '1980s', 'Bygda & Slager', 'Alle kjenner «Det er kjekt å ha»!'),
  song('ms-27', 'Surfbrett', 'Vazelina Bilopphøggers', '1980s', 'Bygda & Slager', '«Je har kjøpt meg surfbrett!»'),
  song('ms-28', 'Gi meg fri i kveld', 'Vazelina Bilopphøggers', '1980s', 'Bygda & Slager', 'Toten-rock som skaper smil i salen'),
  song('ms-29', 'Lukk opp din hjertedør', 'Sputnik', '1980s', 'Bygda & Slager', 'Telemarks egen folkehelt fra Bostrak!'),
  song('ms-30', 'I vår lille verden', 'Dizzie Tunes', '1960s', 'Bygda & Slager', 'Telemarks eget showband fra Porsgrunn/Skien!'),
  song('ms-31', 'Den finaste eg veit', 'Hellbillies', 'Klassiker', 'Bygda & Slager', 'Nydelig Hallingdal-ballade'),
  song('ms-32', 'E6', 'D.D.E.', 'Klassiker', 'Bygda & Slager', 'Trøndersk allsang med full fart'),
  song('ms-33', 'Har en drøm', 'Jørn Hoel', '1980s', 'Norsk allsang', 'Hees og varm 80-talls klassiker'),
  song('ms-34', 'Forelska i lærer’n', 'The Kids', '1980s', 'Norsk allsang', 'Norsk rockhit fra 1980'),
  song('ms-35', 'Fröken Fräken', 'Sven-Ingvars', '1960s', 'Nordisk skatt', 'Svensktopp-klassiker hele Norden elsker'),
  song('ms-36', 'Säg inte nej, säg kanske', 'Sven-Ingvars', '1960s', 'Nordisk skatt', 'Svingende svensk dansebandperle'),
  song('ms-37', 'Leende guldbruna ögon', 'Vikingarna', '1970s', 'Nordisk skatt', 'Tidløs dansebandfavoritt'),
  song('ms-38', 'Somliga går med trasiga skor', 'Cornelis Vreeswijk', '1960s', 'Nordisk skatt', 'Elsket viseklassiker fra 1968'),
  song('ms-39', 'Gøy på landet', 'Jens Book-Jenssen', '1950s', 'Norsk allsang', '«Vi tar en liten svingom på låven!»'),
  song('ms-40', 'Norge i rødt, hvitt og blått', 'Jens Book-Jenssen', '1950s', 'Norsk allsang', '17. mai-klassiker fra revyscenen'),
  song('ms-41', 'Dancing Queen', 'ABBA', '1970s', 'Internasjonal evergreen', 'Ikonisk piano-intro fra 1976'),
  song('ms-42', 'Waterloo', 'ABBA', '1970s', 'Internasjonal evergreen', 'Vant Eurovision Song Contest i 1974'),
  song('ms-43', 'Mamma Mia', 'ABBA', '1970s', 'Internasjonal evergreen', 'Umiddelbart gjenkjennelig marimba-riff'),
  song('ms-44', 'Fernando', 'ABBA', '1970s', 'Internasjonal evergreen', 'Stemning og allsang over hele salen'),
  song('ms-45', 'Can’t Help Falling in Love', 'Elvis Presley', '1960s', 'Internasjonal evergreen', '«Wise men say, only fools rush in...»'),
  song('ms-46', 'Love Me Tender', 'Elvis Presley', '1950s', 'Internasjonal evergreen', 'Rolig og kjær 1956-ballade'),
  song('ms-47', 'Jailhouse Rock', 'Elvis Presley', '1950s', 'Internasjonal evergreen', 'Rockefoten går av seg selv!'),
  song('ms-48', 'Yesterday', 'The Beatles', '1960s', 'Internasjonal evergreen', 'Verdens mest innspilte poplåt'),
  song('ms-49', 'Hey Jude', 'The Beatles', '1960s', 'Internasjonal evergreen', 'Perfekt til «Na-na-na»-allsang'),
  song('ms-50', 'Let It Be', 'The Beatles', '1970s', 'Internasjonal evergreen', 'Tidløs pianoklassiker fra 1970'),
  song('ms-51', 'Living Doll', 'Cliff Richard', '1950s', 'Internasjonal evergreen', 'Ungdomsminne fra sommeren 1959'),
  song('ms-52', 'Oh, Pretty Woman', 'Roy Orbison', '1960s', 'Internasjonal evergreen', 'Tromme- og gitarintro alle kjenner igjen'),
  song('ms-53', 'Jolene', 'Dolly Parton', '1970s', 'Internasjonal evergreen', '«Jolene, Jolene, Jolene, Joleeeene»'),
  song('ms-54', '9 to 5', 'Dolly Parton', '1980s', 'Internasjonal evergreen', 'Skrivemaskin-rytmen fra 1980'),
  song('ms-55', 'Ring of Fire', 'Johnny Cash', '1960s', 'Internasjonal evergreen', 'Trompetene og dyp bassstemme'),
  song('ms-56', 'My Way', 'Frank Sinatra', '1960s', 'Internasjonal evergreen', 'Storslått klassiker fra 1969'),
  song('ms-57', 'What a Wonderful World', 'Louis Armstrong', '1960s', 'Internasjonal evergreen', '«I see trees of green, red roses too...»'),
  song('ms-58', 'Bridge Over Troubled Water', 'Simon & Garfunkel', '1970s', 'Internasjonal evergreen', 'Nydelig klassiker fra 1970'),
  song('ms-59', 'Have You Ever Seen the Rain', 'Creedence Clearwater Revival', '1970s', 'Internasjonal evergreen', 'Kjent gitar og allsangrefreng'),
  song('ms-60', 'We’ll Meet Again', 'Vera Lynn', 'Klassiker', 'Internasjonal evergreen', 'Varm og håpefull klassiker for alle generasjoner'),
];

/**
 * Deterministisk PRNG (Mulberry32) slik at utskrevne brett #1..#100 alltid er unike og reproduserbare.
 */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSongsSeeded(seed?: number): MusicBingoSong[] {
  const copy = [...MUSIC_BINGO_SONGS];
  const rand = typeof seed === 'number' ? seededRandom(seed) : Math.random;
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Lager et 5x5 musikkbingo-brett (24 sanger + midtrute «★ FRI RUTE ★ Allsang»).
 */
export function generateMusicBingoCard(cardId: number, seedOffset = 0): MusicBingoCardData {
  const shuffled = shuffleSongsSeeded(cardId * 9973 + seedOffset * 131 + 42);
  const picked = shuffled.slice(0, 24);
  const grid: MusicBingoCell[][] = [];
  let idx = 0;

  for (let r = 0; r < 5; r++) {
    const rowCells: MusicBingoCell[] = [];
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        rowCells.push({
          row: r,
          col: c,
          isCenter: true,
          song: null,
        });
      } else {
        rowCells.push({
          row: r,
          col: c,
          isCenter: false,
          song: picked[idx++],
        });
      }
    }
    grid.push(rowCells);
  }

  return { cardId, grid };
}

/**
 * Teller antall ferdige rekker (vannrett, loddrett, diagonal) og fullt brett for et digitalt musikkbingobrett.
 */
export function evaluateMusicBingoBoard(
  grid: MusicBingoCell[][],
  markedSongIds: Set<string>
): { linesCompleted: number; hasFullHouse: boolean; markedCount: number } {
  const isMarked = (r: number, c: number) => {
    const cell = grid[r]?.[c];
    if (!cell) return false;
    if (cell.isCenter) return true;
    return Boolean(cell.song && markedSongIds.has(cell.song.id));
  };

  let lines = 0;
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => isMarked(r, c))) lines++;
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => isMarked(r, c))) lines++;
  }
  if ([0, 1, 2, 3, 4].every((i) => isMarked(i, i))) lines++;
  if ([0, 1, 2, 3, 4].every((i) => isMarked(i, 4 - i))) lines++;

  let markedCount = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!grid[r][c].isCenter && isMarked(r, c)) {
        markedCount++;
      }
    }
  }

  return {
    linesCompleted: lines,
    hasFullHouse: markedCount === 24,
    markedCount,
  };
}
