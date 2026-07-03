import { VercelRequest, VercelResponse } from '@vercel/node';

// ========================================================
// CRICBUZZ INPUT INTERFACES
// ========================================================

interface CricbuzzTeam {
  teamId?: number;
  teamName?: string;
  teamSName?: string;
  imageId?: number;
}

interface CricbuzzVenue {
  ground?: string;
  city?: string;
  timezone?: string;
  country?: string;
}

interface CricbuzzMatch {
  matchId?: number;
  matchDesc?: string;
  matchFormat?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  team1?: CricbuzzTeam;
  team2?: CricbuzzTeam;
  venueInfo?: CricbuzzVenue;
}

interface CricbuzzSeries {
  seriesId?: number;
  seriesName?: string;
  seriesCategory?: string;
  matchInfo?: CricbuzzMatch[];
}

interface CricbuzzScheduleWrapper {
  date?: string;
  matchScheduleList?: CricbuzzSeries[];
}

interface CricbuzzMapItem {
  scheduleAdWrapper?: CricbuzzScheduleWrapper;
}

interface CricbuzzScheduleResponse {
  matchScheduleMap?: CricbuzzMapItem[];
}

// ========================================================
// OUTPUT INTERFACES
// ========================================================

export interface Team {
  id: number | null;
  name: string;
  shortName: string;
  imageId: number | null;
  imageUrl: string;
}

export interface Venue {
  ground: string;
  city: string;
  country: string;
  timezone: string;
}

export interface Match {
  matchId: number | null;
  matchSlug: string;
  seriesId: number | null;
  seriesSlug: string;
  seriesName: string;
  matchTitle: string;
  matchDesc: string;
  format: string;
  status: string;
  startTimestamp: number | null;
  endTimestamp: number | null;
  startDate: string;
  startTime: string;
  countdown: string;
  team1: Team | null;
  team2: Team | null;
  venue: Venue | null;
  matchUrl: string;
  seriesUrl: string;
  isInternational: boolean;
  isDomestic: boolean;
  isWomen: boolean;
}

export interface DaySchedule {
  date: string;
  displayDate: string;
  day: string;
  timestamp: number;
  totalMatches: number;
  internationalMatches: number;
  domesticMatches: number;
  womenMatches: number;
  matches: Match[];
}

export interface UpcomingMatchesResponse {
  success: boolean;
  generatedAt: string;
  totalDays: number;
  totalMatches: number;
  days: DaySchedule[];
}

export interface ErrorResponse {
  success: boolean;
  error: string;
}

// ========================================================
// HELPER FUNCTIONS
// ========================================================

function createSlug(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseTimestamp(timestamp?: string | number): number {
  if (!timestamp) return 0;
  const num = Number(timestamp);
  return isNaN(num) ? 0 : num;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDisplayDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
}

function getDay(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getCountdown(targetTimestamp: number): string {
  if (!targetTimestamp) return "";
  const now = Date.now();
  const diff = targetTimestamp - now;

  if (diff <= 0) return "Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 1) return `Starts in ${days} days`;
  if (days === 1) return "Starts Tomorrow";
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes}m`;
}

function buildImageUrl(imageId?: number): string {
  if (!imageId) return "";
  return `https://static.cricbuzz.com/a/img/v1/172x172/i1/c${imageId}/i.jpg`;
}

function buildMatchUrl(matchId: number | null, slug: string): string {
  if (!matchId) return "";
  return `/match/${matchId}/${slug}`;
}

function buildSeriesUrl(seriesId: number | null, slug: string): string {
  if (!seriesId) return "";
  return `/series/${seriesId}/${slug}`;
}

function isWomenSeries(seriesName?: string): boolean {
  if (!seriesName) return false;
  return seriesName.toLowerCase().includes("women");
}

function isInternationalSeries(category?: string, name?: string): boolean {
  if (category && category.toLowerCase() === "international") return true;
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return (
    lowerName.includes("icc") ||
    lowerName.includes("world cup") ||
    lowerName.includes("test") ||
    lowerName.includes("odi") ||
    lowerName.includes("t20i")
  );
}

function isDomesticSeries(isIntl: boolean, isWom: boolean): boolean {
  return !isIntl && !isWom;
}

// ========================================================
// CORE PROCESSOR
// ========================================================

function processUpcomingSchedule(rawData: CricbuzzScheduleResponse): UpcomingMatchesResponse {
  const daysMap = new Map<string, DaySchedule>();
  let overallTotalMatches = 0;

  const scheduleMap = rawData?.matchScheduleMap || [];

  for (const mapItem of scheduleMap) {
    const wrapper = mapItem?.scheduleAdWrapper;
    if (!wrapper || !wrapper.matchScheduleList) continue;

    const seriesList = wrapper.matchScheduleList;

    for (const series of seriesList) {
      const seriesId = series.seriesId || null;
      const seriesName = series.seriesName || "";
      const seriesCategory = series.seriesCategory || "";
      const seriesSlug = createSlug(seriesName);

      const isWomen = isWomenSeries(seriesName);
      const isIntl = isInternationalSeries(seriesCategory, seriesName);
      const isDomestic = isDomesticSeries(isIntl, isWomen);

      const matches = series.matchInfo || [];

      for (const matchInfo of matches) {
        const matchId = matchInfo.matchId || null;
        const startTimestamp = parseTimestamp(matchInfo.startDate);
        const endTimestamp = parseTimestamp(matchInfo.endDate);

        const team1Name = matchInfo.team1?.teamName || "TBA";
        const team2Name = matchInfo.team2?.teamName || "TBA";
        const matchTitle = `${team1Name} vs ${team2Name}`;
        const matchSlug = createSlug(matchTitle);

        const team1: Team = {
          id: matchInfo.team1?.teamId || null,
          name: team1Name,
          shortName: matchInfo.team1?.teamSName || "",
          imageId: matchInfo.team1?.imageId || null,
          imageUrl: buildImageUrl(matchInfo.team1?.imageId),
        };

        const team2: Team = {
          id: matchInfo.team2?.teamId || null,
          name: team2Name,
          shortName: matchInfo.team2?.teamSName || "",
          imageId: matchInfo.team2?.imageId || null,
          imageUrl: buildImageUrl(matchInfo.team2?.imageId),
        };

        const venue: Venue = {
          ground: matchInfo.venueInfo?.ground || "",
          city: matchInfo.venueInfo?.city || "",
          country: matchInfo.venueInfo?.country || "",
          timezone: matchInfo.venueInfo?.timezone || "",
        };

        const parsedMatch: Match = {
          matchId,
          matchSlug,
          seriesId,
          seriesSlug,
          seriesName,
          matchTitle,
          matchDesc: matchInfo.matchDesc || "",
          format: matchInfo.matchFormat || "",
          status: "Upcoming",
          startTimestamp,
          endTimestamp,
          startDate: formatDate(startTimestamp),
          startTime: formatTime(startTimestamp),
          countdown: getCountdown(startTimestamp),
          team1,
          team2,
          venue,
          matchUrl: buildMatchUrl(matchId, matchSlug),
          seriesUrl: buildSeriesUrl(seriesId, seriesSlug),
          isInternational: isIntl,
          isDomestic: isDomestic,
          isWomen: isWomen,
        };

        // Group by Day String using Start Date (YYYY-MM-DD)
        const dateObj = new Date(startTimestamp);
        const dateKey = startTimestamp
          ? dateObj.toISOString().split("T")[0]
          : "Unknown-Date";

        if (!daysMap.has(dateKey)) {
          // Normalize to start of day for accurate timestamp sorting
          dateObj.setHours(0, 0, 0, 0);

          daysMap.set(dateKey, {
            date: dateKey,
            displayDate: getDisplayDate(startTimestamp),
            day: getDay(startTimestamp),
            timestamp: dateObj.getTime(),
            totalMatches: 0,
            internationalMatches: 0,
            domesticMatches: 0,
            womenMatches: 0,
            matches: [],
          });
        }

        const dayEntry = daysMap.get(dateKey)!;
        dayEntry.matches.push(parsedMatch);
        dayEntry.totalMatches += 1;
        overallTotalMatches += 1;

        if (isWomen) {
          dayEntry.womenMatches += 1;
        } else if (isIntl) {
          dayEntry.internationalMatches += 1;
        } else {
          dayEntry.domesticMatches += 1;
        }
      }
    }
  }

  // Sort days ascending by timestamp
  const sortedDays = Array.from(daysMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Sort matches within each day ascending by startTimestamp
  sortedDays.forEach((day) => {
    day.matches.sort((a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0));
  });

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    totalDays: sortedDays.length,
    totalMatches: overallTotalMatches,
    days: sortedDays,
  };
}

// ========================================================
// API HANDLER (Vercel Serverless Function)
// ========================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS configuration if needed by mobile / web apps
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Optimize cache for Vercel Edge Network
  // s-maxage=300 caches at CDN level for 5 mins
  // stale-while-revalidate=600 allows serving stale content while refetching silently
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );

  try {
    // Determine data source: Use req.body if POSTed, otherwise attempt to fetch from an Env URL
    let rawData: CricbuzzScheduleResponse;

    if (req.method === "POST" && req.body) {
      rawData = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } else {
      // NOTE: Replace this URL with your internal fetch logic if you are fetching directly
      const CRICBUZZ_API = "https://www.cricbuzz.com/api/cricket-schedule/upcoming-series/international/1783441800000";
      
      if (!CRICBUZZ_API) {
        return res.status(400).json({
          success: false,
          error: "No data provided in request body and CRICBUZZ_SCHEDULE_URL is not set.",
        } as ErrorResponse);
      }

      const response = await fetch(CRICBUZZ_API);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Cricbuzz: ${response.statusText}`);
      }
      rawData = await response.json();
    }

    // Process and format the raw Cricbuzz data
    const optimizedSchedule = processUpcomingSchedule(rawData);

    return res.status(200).json(optimizedSchedule);

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return res.status(500).json({
      success: false,
      error: `Failed to process upcoming matches: ${errMessage}`,
    } as ErrorResponse);
  }
}
