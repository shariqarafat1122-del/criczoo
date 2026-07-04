import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

// ---------- Shapes matching PlayerProfilePage.tsx ----------

interface RankingEntry {
  current: string;
  best: string;
}

interface Rankings {
  test: string;
  odi: string;
  t20i: RankingEntry;
}

interface BattingFormEntry {
  score: string;
  opponent: string;
  format: string;
  date: string;
}

interface CareerFormatStats {
  matches?: number;
  runs?: number;
  highest?: string;
  average?: number;
  strikeRate?: number;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
  notOuts?: number;
}

interface CareerSummary {
  test?: CareerFormatStats;
  odi?: CareerFormatStats;
  t20i?: CareerFormatStats;
  ipl?: CareerFormatStats;
  text?: string;
}

interface PlayerProfileResponse {
  success: boolean;
  profileId: string;
  name: string;
  country: string;
  playerImage: string | null;
  born: string;
  birthPlace: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  iccRankings: Rankings;
  teams: string[];
  battingForm: BattingFormEntry[];
  careerSummary: CareerSummary;
  isCaptain?: boolean;
  isKeeper?: boolean;
}

export default async function handler( req: VercelRequest, res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const profileId = (req.query.profileId as string | undefined) || "";

  if (!profileId) {
    res.status(400).json({
      success: false,
      message: "Missing profileId. Pass ?profileId=9443/tim-seifert",
    });
    return;
  }

  const targetUrl = `https://www.cricbuzz.com/profiles/${profileId}`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    res.status(400).json({ success: false, message: "Invalid profileId" });
    return;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (response.status === 404) {
      res.status(404).json({ success: false, message: "Player not found" });
      return;
    }

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        message: `Failed to fetch page (status ${response.status})`,
      });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const profile = extractPlayerFromHtml($, profileId);

    if (!profile.name) {
      res.status(404).json({ success: false, message: "Player not found" });
      return;
    }

    res.status(200).json(profile);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------
// Helpers to parse Cricbuzz-style strings into typed fields
// -----------------------------------------------------------------





function parseRankString(str: string): RankingEntry {
  const currentMatch = str.match(/Current Rank:\s*([^,]+)/i);
  const bestMatch = str.match(/Best Rank:\s*([^,]+)/i);
  return {
    current: currentMatch?.[1]?.trim() || "-",
    best: bestMatch?.[1]?.trim() || "-",
  };
}

function parseFormatNumber(
  str: string,
  format: "ODI" | "T20" | "IPL" | "Test"
): number | undefined {
  const regex = new RegExp(`${format}:\\s*([\\d.]+)`, "i");
  const match = str.match(regex);
  if (!match) return undefined;
  const num = parseFloat(match[1]);
  return isNaN(num) ? undefined : num;
}

function parseFormatString(
  str: string,
  format: "ODI" | "T20" | "IPL" | "Test"
): string | undefined {
  const regex = new RegExp(`${format}:\\s*([\\w.*-]+)`, "i");
  return str.match(regex)?.[1];
}

function buildFormatStats(
  table: Record<string, string>,
  format: "ODI" | "T20" | "IPL" | "Test"
): CareerFormatStats {
  return {
    matches: parseFormatNumber(table["Matches"] ?? "", format),
    runs: parseFormatNumber(table["Runs"] ?? "", format),
    highest: parseFormatString(table["Highest"] ?? "", format),
    average: parseFormatNumber(table["Average"] ?? "", format),
    strikeRate: parseFormatNumber(table["SR"] ?? "", format),
    fifties: parseFormatNumber(table["50s"] ?? "", format),
    hundreds: parseFormatNumber(table["100s"] ?? "", format),
    fours: parseFormatNumber(table["Fours"] ?? "", format),
    sixes: parseFormatNumber(table["Sixes"] ?? "", format),
    notOuts: parseFormatNumber(table["Not Out"] ?? "", format),
  };
}


function extractCountry($: CheerioAPI): string {
  const countryFromTeam = $('a[href*="/cricket-team/" i], a[href*="/teams/" i]')
    .filter((_: number, el: any) => {
      const text = $(el).text().trim();
      return text.length > 0 && text.length < 30;
    })
    .first()
    .text()
    .trim();

  if (countryFromTeam) return countryFromTeam;

  let country = "";
  $("*").each((_: number, el: any) => {
    if (country) return;
    const $el = $(el);
    const ownText = $el
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim()
      .toLowerCase()
      .replace(/:$/, "");
    if (ownText === "country" || ownText === "intl team") {
      const candidate =
        $el.next().text().trim() || $el.parent().next().text().trim();
      if (candidate && candidate.length < 40) country = candidate;
    }
  });

  return country;
}
  
// -----------------------------------------------------------------
// Main HTML extraction — returns data already shaped for the frontend
// -----------------------------------------------------------------
function extractPlayerFromHtml(
  $: CheerioAPI,
  profileId: string
): PlayerProfileResponse {
 
  // --- Name ---
  const rawName =
    $("h1").first().text().trim() ||
    $('[class*="player-name" i], [class*="playerName" i]').first().text().trim() ||
    $("title").text().split("|")[0].trim();
    const name = rawName
    .split(" - ")[0]
    .replace(/\s*profile\s*$/i, "")
    .trim();

  // --- Image ---
  const heroImg = $(
    'img[class*="player" i], img[class*="profile" i], img[class*="avatar" i]'
  )
    .first()
    .attr("src");
  const playerImage = heroImg || $("img").first().attr("src") || null;

  // --- Generic label scanner for role / batting / bowling / born / birthplace ---
  const fields: Record<string, string> = {
    role: "",
    battingStyle: "",
    bowlingStyle: "",
    born: "",
    birthPlace: "",
  };

  const labelMap: Record<string, keyof typeof fields> = {
    role: "role",
    "playing role": "role",
    batting: "battingStyle",
    "batting style": "battingStyle",
    bowling: "bowlingStyle",
    "bowling style": "bowlingStyle",
    born: "born",
    "date of birth": "born",
    birthplace: "birthPlace",
    "birth place": "birthPlace",
  };

  $("*").each((_: number, el: any) => {
    const $el = $(el);
    const ownText = $el
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .trim()
      .toLowerCase()
      .replace(/:$/, "");

    if (ownText && labelMap[ownText]) {
      const field = labelMap[ownText];
      if (fields[field]) return;

      const candidate =
        $el.next().text().trim() ||
        $el.parent().next().text().trim() ||
        $el.parent().text().replace($el.text(), "").trim();

      if (candidate && candidate.length < 200) {
        fields[field] = candidate;
      }
    }
  });

  // --- Teams ---
  const teamTexts = $('a[href*="team" i], a[href*="/teams/" i]')
    .map((_: number, el: any) => $(el).text().trim())
    .get()
    .filter((t: string) => t && t.length < 40 && t.toLowerCase() !== "teams");
  const teams = [...new Set(teamTexts)].slice(0, 10);

  // --- ICC Rankings & career tables from <table> elements ---
  const rankingStrings: Record<string, string> = {};
  let battingTable: Record<string, string> = {};

  $("table").each((_: number, table: any) => {
    const $table = $(table);
    const headers = $table
      .find("th")
      .map((_i: number, th: any) => $(th).text().trim())
      .get()
      .filter(Boolean);

    if (!headers.length) return;

    const nearbyHeading =
      $table.prevAll("h2, h3, h4").first().text().trim() ||
      $table.closest("div").prevAll("h2, h3, h4").first().text().trim();

    const rows: Record<string, string>[] = [];
    $table.find("tbody tr").each((_i: number, tr: any) => {
      const cells = $(tr)
        .find("td")
        .map((_j: number, td: any) => $(td).text().trim())
        .get();
      if (!cells.length) return;
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = cells[idx] ?? "";
      });
      rows.push(row);
    });

    if (!rows.length) return;

    const flatSummary: Record<string, string> = {};
    rows.forEach((row: Record<string, string>, idx: number) => {
      const label = row[headers[0]] || `row_${idx + 1}`;
      flatSummary[label] = Object.entries(row)
        .slice(1)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    });

    if (/rank/i.test(nearbyHeading)) {
      Object.assign(rankingStrings, flatSummary);
    } else if (!Object.keys(battingTable).length) {
      // first non-ranking table assumed to be the batting stats table
      battingTable = flatSummary;
    }
  });

  const iccRankings: Rankings = {
    test: parseRankString(rankingStrings["Test"] ?? "").current,
    odi: parseRankString(rankingStrings["ODI"] ?? "").current,
    t20i: parseRankString(rankingStrings["T20I"] ?? ""),
  };

  const careerSummary: CareerSummary = {
    odi: buildFormatStats(battingTable, "ODI"),
    t20i: buildFormatStats(battingTable, "T20"),
    ipl: buildFormatStats(battingTable, "IPL"),
  };

  // --- Bio: longest paragraph ---
  let longest = "";
  $("p").each((_: number, p: any) => {
    const text = $(p).text().trim();
    if (text.length > longest.length) longest = text;
  });
  careerSummary.text = longest.slice(0, 1000);

  return {
    success: true,
    profileId,
    name: name || "",
    country: extractCountry($) || fields.birthPlace || "",
    playerImage,
    born: fields.born || "",
    birthPlace: fields.birthPlace || "",
    role: fields.role || "",
    battingStyle: fields.battingStyle || "",
    bowlingStyle: fields.bowlingStyle || "",
    iccRankings,
    teams,
    battingForm: [], // Cricbuzz profile page doesn't expose recent-form data directly
    careerSummary,
  };
}
