import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';


/* ------------------------------------------------------------------------ */
/*  Interfaces                                                               */
/* ------------------------------------------------------------------------ */

interface VenueInfo {
  ground: string;
  city: string;
  country: string;
}

interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  imageUrl: string;
}

interface MatchInfo {
  matchId: number;
  matchSlug: string;
  matchUrl: string;
  seriesId: number;
  seriesSlug: string;
  seriesUrl: string;
  seriesName: string;
  matchDesc: string;
  format: string;
  status: string;
  startTimestamp: number;
  endTimestamp: number;
  venue: VenueInfo;
  team1: TeamInfo;
  team2: TeamInfo;
}

interface DayInfo {
  date: string;
  timestamp: number;
  totalMatches: number;
  matches: MatchInfo[];
}

interface ApiResponse {
  success: boolean;
  generatedAt: string;
  totalDays: number;
  totalMatches: number;
  days: DayInfo[];
  error?: string;
}

/* ------------------------------------------------------------------------ */
/*  Raw shape of the data embedded inside Cricbuzz's HTML payload            */
/*  (Next.js RSC "self.__next_f.push" stream -> scheduleData JSON object)    */
/* ------------------------------------------------------------------------ */

interface RawTeam {
  teamId?: number;
  teamName?: string;
  teamSName?: string;
  imageId?: number | string;
}

interface RawVenue {
  ground?: string;
  city?: string;
  country?: string;
  timezone?: string;
}

interface RawMatchInfo {
  matchId?: number;
  seriesId?: number;
  matchDesc?: string;
  matchFormat?: string;
  startDate?: string | number;
  endDate?: string | number;
  state?: string;
  status?: string;
  team1?: RawTeam;
  team2?: RawTeam;
  venueInfo?: RawVenue;
}

interface RawSeriesBlock {
  seriesName?: string;
  seriesId?: number;
  seriesCategory?: string;
  seriesHomeCountry?: string;
  matchInfo?: RawMatchInfo[];
}

interface RawDayWrapper {
  date?: string;
  longDate?: string;
  matchScheduleList?: RawSeriesBlock[];
}

interface RawDayEntry {
  scheduleAdWrapper?: RawDayWrapper;
  [key: string]: unknown;
}

interface RawScheduleData {
  matchScheduleMap?: RawDayEntry[];
  appIndex?: Record<string, unknown>;
}


async function readScheduleHtml(): Promise<string> {
  try {
    const response = await fetch(
      "https://www.cricbuzz.com/cricket-schedule/upcoming-series/all",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      }
    );
    if (!response.ok) return '';
    return await response.text();
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------------ */
/*  Helper functions                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Safely converts any value into a trimmed string, falling back to an
 * empty string when the value is null, undefined, or not usable.
 */
function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/**
 * Safely converts any value into a finite number, falling back to 0.
 */
function safeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * Slugifies a string into a URL-friendly, lowercase, hyphenated token.
 * Never throws; returns an empty string for unusable input.
 */
function slugify(value: string): string {
  const str = safeString(value);
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Builds the full match URL from a match id, series id, and description.
 */
function buildMatchUrl(matchId: number, seriesId: number, matchSlug: string): string {
  if (!matchId) return '';
  const slugPart = matchSlug || 'match';
  return `${CRICBUZZ_BASE_URL}/live-cricket-scorecard/${matchId}/${slugPart}`;
}

/**
 * Builds the full series URL from a series id and series name.
 */
function buildSeriesUrl(seriesId: number, seriesSlug: string): string {
  if (!seriesId) return '';
  const slugPart = seriesSlug || 'series';
  return `${CRICBUZZ_BASE_URL}/cricket-series/${seriesId}/${slugPart}`;
}

/**
 * Builds a full team image URL from a Cricbuzz image id.
 */
function buildTeamImageUrl(imageId: unknown): string {
  const id = safeString(imageId);
  if (!id) return '';
  return `${CRICBUZZ_IMAGE_BASE_URL}${id}/i.jpg`;
}

/**
 * Ensures any URL is absolute, converting relative Cricbuzz paths into
 * fully-qualified URLs when necessary.
 */
function toAbsoluteUrl(url: string): string {
  const str = safeString(url);
  if (!str) return '';
  if (/^https?:\/\//i.test(str)) return str;
  if (str.startsWith('//')) return `https:${str}`;
  if (str.startsWith('/')) return `${CRICBUZZ_BASE_URL}${str}`;
  return `${CRICBUZZ_BASE_URL}/${str}`;
}

/**
 * Derives a human-readable match status when the source payload does not
 * explicitly provide one. Falls back to a generic "Upcoming" status based
 * on whether the start timestamp is in the future.
 */
function deriveMatchStatus(raw: RawMatchInfo, startTimestamp: number): string {
  const explicit = safeString(raw.status) || safeString(raw.state);
  if (explicit) return explicit;
  if (startTimestamp && startTimestamp > Date.now()) return 'Upcoming';
  if (startTimestamp && startTimestamp <= Date.now()) return 'Scheduled';
  return 'Scheduled';
}

/**
 * Normalizes a raw team object into the public TeamInfo shape.
 */
function normalizeTeam(raw: RawTeam | undefined): TeamInfo {
  const safeRaw = raw || {};
  return {
    id: safeNumber(safeRaw.teamId),
    name: safeString(safeRaw.teamName),
    shortName: safeString(safeRaw.teamSName),
    imageUrl: buildTeamImageUrl(safeRaw.imageId),
  };
}

/**
 * Normalizes a raw venue object into the public VenueInfo shape.
 */
function normalizeVenue(raw: RawVenue | undefined): VenueInfo {
  const safeRaw = raw || {};
  return {
    ground: safeString(safeRaw.ground),
    city: safeString(safeRaw.city),
    country: safeString(safeRaw.country),
  };
}

/**
 * Normalizes a single raw match entry into the public MatchInfo shape.
 */
function normalizeMatch(raw: RawMatchInfo, seriesName: string, seriesIdFallback: number): MatchInfo | null {
  if (!raw || typeof raw !== 'object') return null;

  const matchId = safeNumber(raw.matchId);
  if (!matchId) return null;

  const seriesId = safeNumber(raw.seriesId) || seriesIdFallback;
  const matchDesc = safeString(raw.matchDesc);
  const format = safeString(raw.matchFormat);
  const startTimestamp = safeNumber(raw.startDate);
  const endTimestamp = safeNumber(raw.endDate);

  const matchSlugSource = `${seriesName} ${matchDesc}`.trim();
  const matchSlug = slugify(matchSlugSource) || `match-${matchId}`;
  const seriesSlug = slugify(seriesName) || `series-${seriesId}`;

  return {
    matchId,
    matchSlug,
    matchUrl: toAbsoluteUrl(buildMatchUrl(matchId, seriesId, matchSlug)),
    seriesId,
    seriesSlug,
    seriesUrl: toAbsoluteUrl(buildSeriesUrl(seriesId, seriesSlug)),
    seriesName: safeString(seriesName),
    matchDesc,
    format,
    status: deriveMatchStatus(raw, startTimestamp),
    startTimestamp,
    endTimestamp,
    venue: normalizeVenue(raw.venueInfo),
    team1: normalizeTeam(raw.team1),
    team2: normalizeTeam(raw.team2),
  };
}

/**
 * Produces a stable de-duplication key for a normalized match.
 */
function matchDedupeKey(match: MatchInfo): string {
  return `${match.matchId}-${match.seriesId}`;
}

/**
 * Extracts every `self.__next_f.push([1, "..."])` payload string found in
 * the raw HTML document. These chunks make up the Next.js RSC stream that
 * carries the embedded schedule JSON. Never throws; returns [] if none
 * are found.
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
 * Decodes the JavaScript string-literal escape sequences (\", \\, \n, \uXXXX
 * etc.) used inside the Next.js push payloads, turning them back into plain
 * text that can be scanned for embedded JSON objects.
 */
function decodeJsStringLiteral(raw: string): string {
  if (!raw) return '';
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    // Fall back to a manual, best-effort decode if JSON.parse fails
    // (e.g. due to stray unescaped characters in a malformed chunk).
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
 * Given decoded chunk text, locates the value that follows a given JSON key
 * (e.g. `"scheduleData":`) and extracts the balanced JSON object that
 * follows it using bracket-depth matching. Returns null if the key or a
 * balanced object cannot be found.
 */
function extractBalancedJsonObject(text: string, key: string): string | null {
  const marker = `"${key}":`;
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return null;

  let cursor = startIdx + marker.length;
  // Skip any whitespace before the opening brace.
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
 * Scans every Next.js data chunk in the HTML document for an embedded
 * `scheduleData` JSON object and parses it. Returns null if none is found
 * or parsing fails, so callers can respond gracefully instead of crashing.
 */
function extractScheduleData(html: string): RawScheduleData | null {
  const chunks = extractNextDataChunks(html);

  for (const chunk of chunks) {
    const decoded = decodeJsStringLiteral(chunk);
    if (!decoded || decoded.indexOf('scheduleData') === -1) continue;

    const jsonText = extractBalancedJsonObject(decoded, 'scheduleData');
    if (!jsonText) continue;

    try {
      const parsed = JSON.parse(jsonText) as RawScheduleData;
      if (parsed && Array.isArray(parsed.matchScheduleMap)) {
        return parsed;
      }
    } catch {
      // Ignore malformed chunks and keep scanning others.
      continue;
    }
  }

  return null;
}

/**
 * Uses Cheerio to confirm the document is a well-formed HTML document and
 * to provide a fallback path for any future markup-based schedule blocks
 * (e.g. `.cb-col-100.cb-schdl`), in case Cricbuzz ever renders the
 * schedule as static markup instead of / in addition to embedded JSON.
 * Currently returns an empty array because the source page renders the
 * schedule purely through client-side JSON, but the hook is kept so the
 * parser degrades gracefully and remains extensible.
 */
function extractMarkupFallbackDays($: cheerio.CheerioAPI): RawDayEntry[] {
  const days: RawDayEntry[] = [];

  $('.cb-col-100.cb-schdl, .schedule-date, [data-schedule-date]').each((_i, _el) => {
    // No known production markup currently matches; reserved for future use.
  });

  return days;
}

/**
 * Converts the raw parsed schedule payload into the public, normalized
 * response shape, de-duplicating matches and skipping any malformed or
 * incomplete entries without throwing.
 */
function buildDaysFromRawSchedule(raw: RawScheduleData): DayInfo[] {
  const days: DayInfo[] = [];
  const dayEntries = Array.isArray(raw.matchScheduleMap) ? raw.matchScheduleMap : [];
  const 
  for (const entry of dayEntries) {
    const wrapper = entry?.scheduleAdWrapper;
    if (!wrapper || !Array.isArray(wrapper.matchScheduleList)) continue;

    const dateLabel = safeString(wrapper.date) || safeString(wrapper.longDate);
    const seenKeys = new Set<string>();
    const matches: MatchInfo[] = [];

    for (const seriesBlock of wrapper.matchScheduleList) {
      if (!seriesBlock || !Array.isArray(seriesBlock.matchInfo)) continue;

      const seriesName = safeString(seriesBlock.seriesName);
      const seriesIdFallback = safeNumber(seriesBlock.seriesId);

      for (const rawMatch of seriesBlock.matchInfo) {
        const normalized = normalizeMatch(rawMatch, seriesName, seriesIdFallback);
        if (!normalized) continue;

        const key = matchDedupeKey(normalized);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        matches.push(normalized);
      }
    }

    if (matches.length === 0 && !dateLabel) continue;

    // Sort matches chronologically within the day for predictable output.
    matches.sort((a, b) => a.startTimestamp - b.startTimestamp);

    const dayTimestamp = matches.length > 0 ? matches[0].startTimestamp : 0;

    days.push({
      date: dateLabel,
      timestamp: dayTimestamp,
      totalMatches: matches.length,
      matches,
    });
  }

  return days;
}

/**
 * Returns the Cricbuzz schedule HTML. The HTML is embedded directly into
 * the compiled TypeScript bundle (see scheduleHtml.ts) at build time, so
 * there is no filesystem lookup at runtime and no risk of the file being
 * excluded from the Vercel deployment bundle. Never throws; returns an
 * empty string if the embedded constant is somehow empty or unavailable.
 */
function readScheduleHtml(): string {
  try {
    return SCHEDULE_HTML || '';
  } catch {
    return '';
  }
}

/**
 * Main parsing entry point: loads the HTML, extracts the embedded schedule
 * JSON (with a Cheerio-based markup fallback reserved for future use),
 * and returns the fully normalized list of schedule days.
 */
function parseScheduleHtml(html: string): DayInfo[] {
  if (!html) return [];

  const $ = cheerio.load(html);

  const rawScheduleData = extractScheduleData(html);
  if (rawScheduleData) {
    return buildDaysFromRawSchedule(rawScheduleData);
  }

  // Fallback: attempt to read from static markup blocks, in case Cricbuzz
  // ever ships the schedule as server-rendered HTML instead of embedded
  // JSON. Currently yields no results against known markup but is kept
  // for robustness and future compatibility.
  const fallbackEntries = extractMarkupFallbackDays($);
  if (fallbackEntries.length > 0) {
    return buildDaysFromRawSchedule({ matchScheduleMap: fallbackEntries });
  }

  return [];
}

/* ------------------------------------------------------------------------ */
/*  Vercel Serverless Function handler                                      */
/* ------------------------------------------------------------------------ */

export default function handler(req: VercelRequest, res: VercelResponse): void {
  try {
    const html = readScheduleHtml();

    if (!html) {
      const errorResponse: ApiResponse = {
        success: false,
        generatedAt: new Date().toISOString(),
        totalDays: 0,
        totalMatches: 0,
        days: [],
        error: 'Unable to locate or read the uploaded schedule HTML file.',
      };
      res.status(200).json(errorResponse);
      return;
    }

    const days = parseScheduleHtml(html);
    const totalMatches = days.reduce((sum, day) => sum + day.totalMatches, 0);

    const response: ApiResponse = {
      success: true,
      generatedAt: new Date().toISOString(),
      totalDays: days.length,
      totalMatches,
      days,
    };

    res.status(200).json(response);
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      generatedAt: new Date().toISOString(),
      totalDays: 0,
      totalMatches: 0,
      days: [],
      error: error instanceof Error ? error.message : 'Unknown error while parsing schedule.',
    };
    res.status(200).json(errorResponse);
  }
}
