import * as cheerio from 'cheerio';

/* ------------------------------------------------------------------------ */
/*  Interfaces                                                               */
/* ------------------------------------------------------------------------ */

interface TeamRef {
  teamId: number;
  teamName: string;
}

interface BattingRanking {
  t20Rank: string;
  t20BestRank: string;
}

interface PlayerRankings {
  bat: Partial<BattingRanking>;
  bowl: Record<string, string>;
  all: Record<string, string>;
}

interface RecentMatchRow {
  matchId: string;
  score: string;
  opponent: string;
  format: string;
  date: string;
  matchUrl: string;
}

interface StatRow {
  label: string;
  values: string[];
}

interface StatsTable {
  headers: string[];
  rows: StatRow[];
}

interface CareerSpan {
  format: string;
  debut: string;
  lastPlayed: string;
  debutMatchId: string;
  lastPlayedMatchId: string;
}

interface PlayerProfile {
  id: string;
  name: string;
  fullName: string;
  battingStyle: string;
  bowlingStyle: string;
  role: string;
  birthPlace: string;
  dateOfBirth: string;
  age: string;
  internationalTeam: string;
  teams: string[];
  teamRefs: TeamRef[];
  imageUrl: string;
  bio: string;
  rankings: PlayerRankings;
  careerSpans: CareerSpan[];
  recentBatting: RecentMatchRow[];
  battingStats: StatsTable;
  bowlingStats: StatsTable;
  profileUrl: string;
}

interface ParseResult {
  success: boolean;
  generatedAt: string;
  player: PlayerProfile | null;
  error?: string;
}

/* ------------------------------------------------------------------------ */
/*  Constants                                                                */
/* ------------------------------------------------------------------------ */

const CRICBUZZ_BASE_URL = 'https://www.cricbuzz.com/profiles/9443/tim-seifert';

/* ------------------------------------------------------------------------ */
/*  Generic safe helpers                                                     */
/* ------------------------------------------------------------------------ */

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toAbsoluteUrl(url: string): string {
  const str = safeString(url);
  if (!str) return '';
  if (/^https?:\/\//i.test(str)) return str;
  if (str.startsWith('//')) return `https:${str}`;
  if (str.startsWith('/')) return `${CRICBUZZ_BASE_URL}${str}`;
  return `${CRICBUZZ_BASE_URL}/${str}`;
}

/* ------------------------------------------------------------------------ */
/*  Raw shapes found inside the embedded Next.js RSC payload                 */
/* ------------------------------------------------------------------------ */

interface RawTeamNameId {
  teamId?: string | number;
  teamName?: string;
}

interface RawRankingBlock {
  t20Rank?: string;
  t20BestRank?: string;
  odiRank?: string;
  odiBestRank?: string;
  testRank?: string;
  testBestRank?: string;
  [key: string]: string | undefined;
}

interface RawRankings {
  bat?: RawRankingBlock;
  bowl?: RawRankingBlock;
  all?: RawRankingBlock;
}

interface RawCareerEntry {
  name?: string;
  debut?: string;
  lastPlayed?: string;
  debutMatchID?: string;
  lastPlayedMatchId?: string;
}

interface RawPlayerCareerData {
  values?: RawCareerEntry[];
}

interface RawRecentRow {
  values?: string[];
  followUpLinkText?: string;
}

interface RawRecentBatting {
  headers?: string[];
  rows?: RawRecentRow[];
}

interface RawStatValueRow {
  values?: string[];
}

interface RawStatsBlock {
  headers?: string[];
  values?: RawStatValueRow[];
}

interface RawPlayerData {
  id?: string;
  bat?: string;
  bowl?: string;
  name?: string;
  fullName?: string;
  role?: string;
  birthPlace?: string;
  intlTeam?: string;
  teams?: string;
  DoB?: string;
  DoBFormat?: string;
  image?: string;
  bio?: string;
  faceImageId?: number | string;
  rankings?: RawRankings;
  teamNameIds?: RawTeamNameId[];
  playerCareerData?: RawPlayerCareerData;
  recentBatting?: RawRecentBatting;
}

/* ------------------------------------------------------------------------ */
/*  Extraction helpers for the Next.js RSC push-stream payload               */
/* ------------------------------------------------------------------------ */

/**
 * Extracts every `self.__next_f.push([1, "..."])` payload string from the
 * raw HTML document. Never throws; returns [] if none are found.
 */
function extractNextDataChunks(html: string): string[] {
  const chunks: string[] = [];
  if (!html) return chunks;

  const pattern = /self\.__next_f\.push\(\[1,\s*"([\s\S]*?)"\]\)\s*<\/script>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    chunks.push(match[1]);
  }

  return chunks;
}

/**
 * Decodes the JS string-literal escape sequences used inside the Next.js
 * push payloads, turning them back into plain text.
 */
function decodeJsStringLiteral(raw: string): string {
  if (!raw) return '';
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    try {
      return raw
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } catch {
      return '';
    }
  }
}

/**
 * Given decoded text, finds the value following a JSON key and extracts
 * the balanced `{ ... }` object using bracket-depth matching. Returns
 * null if the key or a balanced object cannot be found.
 */
function extractBalancedJsonObject(text: string, key: string): string | null {
  const marker = `"${key}":`;
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return null;

  let cursor = startIdx + marker.length;
  while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
  if (text[cursor] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  const objectStart = cursor;

  for (let i = objectStart; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(objectStart, i + 1);
      }
    }
  }

  return null;
}

/**
 * Scans every Next.js data chunk for an embedded `playerData` JSON object
 * and parses it. Returns null if none is found or parsing fails.
 */
function extractPlayerData(html: string): RawPlayerData | null {
  const chunks = extractNextDataChunks(html);
  const decodedChunks = chunks.map(decodeJsStringLiteral);

  for (const decoded of decodedChunks) {
    if (!decoded || decoded.indexOf('"playerData"') === -1) continue;

    const jsonText = extractBalancedJsonObject(decoded, 'playerData');
    if (!jsonText) continue;

    try {
      const parsed = JSON.parse(jsonText) as RawPlayerData;
      if (parsed && parsed.id) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * The player bio is streamed separately from the JSON payload as a raw
 * text segment in the form `<ref>:T<hexLength>,<text...>`, where `<ref>`
 * is the same reference id (e.g. "27") used as a placeholder inside the
 * playerData JSON (`"bio":"$27"`). This function locates that reference
 * id from the playerData raw JSON text and resolves the actual bio text
 * from across the concatenated chunk stream. Returns an empty string if
 * it cannot be resolved.
 */
function extractPlayerBio(html: string, playerDataRaw: string | null): string {
  if (!playerDataRaw) return '';

  const refMatch = playerDataRaw.match(/"bio":"\$([0-9a-fA-F]+)"/);
  if (!refMatch) return '';

  const refId = refMatch[1];
  const chunks = extractNextDataChunks(html).map(decodeJsStringLiteral);
  const combined = chunks.join('');

  const textPattern = new RegExp(`(?:^|[^0-9a-zA-Z])${refId}:T([0-9a-fA-F]+),`);
  const textMatch = combined.match(textPattern);
  if (!textMatch) return '';

  // The hex value declares the text length in UTF-8 *bytes*, not JS string
  // characters, so multi-byte characters (smart quotes, accented letters,
  // etc.) require slicing on a Buffer rather than the raw JS string to
  // avoid truncating short or overrunning into the next chunk's marker.
  const byteLength = parseInt(textMatch[1], 16);
  if (!Number.isFinite(byteLength) || byteLength <= 0) return '';

  const start = (textMatch.index ?? 0) + textMatch[0].length;
  const remainder = combined.slice(start);
  const remainderBuffer = Buffer.from(remainder, 'utf-8');
  const textBuffer = remainderBuffer.subarray(0, byteLength);
  const text = textBuffer.toString('utf-8');

  return safeString(text.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' '));
}

/**
 * Retains the raw JSON substring for the playerData block (used to
 * resolve the bio reference id) alongside the parsed object.
 */
function extractPlayerDataRaw(html: string): string | null {
  const chunks = extractNextDataChunks(html).map(decodeJsStringLiteral);

  for (const decoded of chunks) {
    if (!decoded || decoded.indexOf('"playerData"') === -1) continue;
    const jsonText = extractBalancedJsonObject(decoded, 'playerData');
    if (jsonText) return jsonText;
  }

  return null;
}

/* ------------------------------------------------------------------------ */
/*  Normalization                                                            */
/* ------------------------------------------------------------------------ */

function normalizeRankings(raw: RawRankings | undefined): PlayerRankings {
  const safeRaw = raw || {};
  const bat = safeRaw.bat || {};
  return {
    bat: {
      t20Rank: safeString(bat.t20Rank),
      t20BestRank: safeString(bat.t20BestRank),
    },
    bowl: (safeRaw.bowl as Record<string, string>) || {},
    all: (safeRaw.all as Record<string, string>) || {},
  };
}

function normalizeTeamRefs(raw: RawTeamNameId[] | undefined): TeamRef[] {
  return safeArray<RawTeamNameId>(raw)
    .map((t) => ({
      teamId: Number(safeString(t.teamId)) || 0,
      teamName: safeString(t.teamName),
    }))
    .filter((t) => t.teamName !== '');
}

function normalizeCareerSpans(raw: RawPlayerCareerData | undefined): CareerSpan[] {
  return safeArray<RawCareerEntry>(raw?.values).map((entry) => ({
    format: safeString(entry.name).toUpperCase(),
    debut: safeString(entry.debut),
    lastPlayed: safeString(entry.lastPlayed),
    debutMatchId: safeString(entry.debutMatchID),
    lastPlayedMatchId: safeString(entry.lastPlayedMatchId),
  }));
}

function normalizeRecentBatting(raw: RawRecentBatting | undefined): RecentMatchRow[] {
  const rows = safeArray<RawRecentRow>(raw?.rows);
  const result: RecentMatchRow[] = [];

  for (const row of rows) {
    const values = safeArray<string>(row.values);
    if (values.length < 5) continue;

    result.push({
      matchId: safeString(values[0]),
      score: safeString(values[1]),
      opponent: safeString(values[2]),
      format: safeString(values[3]),
      date: safeString(values[4]),
      matchUrl: toAbsoluteUrl(safeString(row.followUpLinkText)),
    });
  }

  return result;
}

function normalizeStatsTable(raw: RawStatsBlock | undefined): StatsTable {
  const headers = safeArray<string>(raw?.headers).map(safeString);
  const rows: StatRow[] = safeArray<RawStatValueRow>(raw?.values).map((row) => {
    const values = safeArray<string>(row.values).map(safeString);
    const [label, ...rest] = values;
    return {
      label: safeString(label),
      values: rest,
    };
  });

  return { headers, rows };
}

function buildFaceImageUrl(imageUrl: string | undefined): string {
  const str = safeString(imageUrl);
  if (!str) return '';
  return toAbsoluteUrl(str);
}

function normalizePlayerData(raw: RawPlayerData, bio: string): PlayerProfile {
  const id = safeString(raw.id);
  const dob = safeString(raw.DoB);
  const ageMatch = dob.match(/\((\d+)\s*years?\)/i);

  return {
    id,
    name: safeString(raw.name),
    fullName: safeString(raw.fullName) || safeString(raw.name),
    battingStyle: safeString(raw.bat),
    bowlingStyle: safeString(raw.bowl),
    role: safeString(raw.role),
    birthPlace: safeString(raw.birthPlace),
    dateOfBirth: safeString(raw.DoBFormat) || dob,
    age: ageMatch ? ageMatch[1] : '',
    internationalTeam: safeString(raw.intlTeam),
    teams: safeString(raw.teams)
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== ''),
    teamRefs: normalizeTeamRefs(raw.teamNameIds),
    imageUrl: buildFaceImageUrl(raw.image),
    bio,
    rankings: normalizeRankings(raw.rankings),
    careerSpans: normalizeCareerSpans(raw.playerCareerData),
    recentBatting: normalizeRecentBatting(raw.recentBatting),
    battingStats: { headers: [], rows: [] },
    bowlingStats: { headers: [], rows: [] },
    profileUrl: id ? `${CRICBUZZ_BASE_URL}/profiles/${id}/${slugifyName(raw.name)}` : '',
  };
}

function slugifyName(name: unknown): string {
  const str = safeString(name);
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------------ */
/*  Batting / bowling career stats block (separate embedded object)         */
/* ------------------------------------------------------------------------ */

function extractStatsBlocks(html: string): { battingStats: StatsTable; bowlingStats: StatsTable } {
  const chunks = extractNextDataChunks(html).map(decodeJsStringLiteral);

  let battingStats: StatsTable = { headers: [], rows: [] };
  let bowlingStats: StatsTable = { headers: [], rows: [] };

  for (const decoded of chunks) {
    if (!decoded) continue;

    if (battingStats.rows.length === 0 && decoded.indexOf('"battingStats"') !== -1) {
      const json = extractBalancedJsonObject(decoded, 'battingStats');
      if (json) {
        try {
          battingStats = normalizeStatsTable(JSON.parse(json) as RawStatsBlock);
        } catch {
          // ignore malformed block
        }
      }
    }

    if (bowlingStats.rows.length === 0 && decoded.indexOf('"bowlingStats"') !== -1) {
      const json = extractBalancedJsonObject(decoded, 'bowlingStats');
      if (json) {
        try {
          bowlingStats = normalizeStatsTable(JSON.parse(json) as RawStatsBlock);
        } catch {
          // ignore malformed block
        }
      }
    }

    if (battingStats.rows.length > 0 && bowlingStats.rows.length > 0) break;
  }

  return { battingStats, bowlingStats };
}

/* ------------------------------------------------------------------------ */
/*  Main parse function                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Parses a Cricbuzz player profile HTML document (as a string) and
 * returns the normalized player profile data. Uses Cheerio to validate
 * and load the document; the actual data is embedded as JSON inside the
 * page's Next.js RSC script chunks rather than in static HTML tags, so
 * extraction relies on scanning those chunks. Never throws.
 */
function parsePlayerProfileHtml(html: string): ParseResult {
  const generatedAt = new Date().toISOString();

  if (!html) {
    return {
      success: false,
      generatedAt,
      player: null,
      error: 'No HTML content provided.',
    };
  }

  try {
    // Cheerio load confirms the document parses as valid HTML and is kept
    // available for any future static-markup fallback needs.
    cheerio.load(html);

    const rawPlayerData = extractPlayerData(html);
    if (!rawPlayerData) {
      return {
        success: false,
        generatedAt,
        player: null,
        error: 'Unable to locate embedded player data in the provided HTML.',
      };
    }

    const rawPlayerDataText = extractPlayerDataRaw(html);
    const bio = extractPlayerBio(html, rawPlayerDataText);
    const { battingStats, bowlingStats } = extractStatsBlocks(html);

    const player = normalizePlayerData(rawPlayerData, bio);
    player.battingStats = battingStats;
    player.bowlingStats = bowlingStats;

    return {
      success: true,
      generatedAt,
      player,
    };
  } catch (error) {
    return {
      success: false,
      generatedAt,
      player: null,
      error: error instanceof Error ? error.message : 'Unknown error while parsing profile.',
    };
  }
}

export { parsePlayerProfileHtml };
export type { ParseResult, PlayerProfile };
