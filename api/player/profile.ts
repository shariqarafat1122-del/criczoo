// api/player.ts
// Vercel Serverless Function (TypeScript)
// Usage: GET /api/player?url=https://<site>/profiles/12345/player-name
//
// Works generically across sites by layering strategies:
// 1. __NEXT_DATA__ (Next.js apps) — cleanest source if present.
// 2. Common site-specific patterns (e.g. Cricbuzz-style class names) — best-effort.
// 3. Generic label-based heuristics (looks for "Born", "Role", "Batting", "Bowling",
//    "Teams", stat tables, etc. anywhere in the DOM) — works on unknown markup.
//
// You can also hardcode a URL below instead of passing ?url=.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

interface PlayerProfile {
  name: string;
  image: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  born: string;
  birthPlace: string;
  teams: string[];
  stats: Record<string, Record<string, string>>; // e.g. { batting: { Test: "...", ODI: "..." } }
  bio: string;
  [key: string]: unknown;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  // 👇 Yahan apna URL daalo agar file ke andar hardcode karna hai.
  // Agar khaali ("") rakhoge, to ?url= query param se le lega.
  const HARDCODED_URL: string = "https://www.cricbuzz.com/profiles";

  const targetUrl: string | undefined =
    HARDCODED_URL || (req.query.url as string | undefined);

  if (!targetUrl) {
    res.status(400).json({
      success: false,
      message: "Missing url. Set HARDCODED_URL in file or pass ?url=",
    });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    res.status(400).json({ success: false, message: "Invalid url" });
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

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        message: `Failed to fetch page (status ${response.status})`,
      });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ---------- 1. Try __NEXT_DATA__ ----------
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
      try {
        const nextData: unknown = JSON.parse(nextDataScript);
        const profile = extractPlayerFromNextData(nextData);
        if (profile && Object.keys(profile).length > 0) {
          res.status(200).json({
            success: true,
            method: "next-data",
            player: profile,
          });
          return;
        }
      } catch (e) {
        // fall through
      }
    }

    // ---------- 2 & 3. HTML heuristics (site-pattern + generic) ----------
    const profile = extractPlayerFromHtml($);

    res.status(200).json({
      success: true,
      method: "html-scrape",
      source: targetUrl,
      player: profile,
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------
// Strategy 1: __NEXT_DATA__ — recursively find an object that looks
// like a player profile (has name + role/batting/bowling-ish keys).
// -----------------------------------------------------------------
function extractPlayerFromNextData(nextData: unknown): Partial<PlayerProfile> | null {
  let bestMatch: Record<string, unknown> | null = null;

  const looksLikePlayer = (obj: unknown): obj is Record<string, unknown> => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    const keys = Object.keys(obj as Record<string, unknown>)
      .join(",")
      .toLowerCase();
    const hasName = keys.includes("name") || keys.includes("fullname");
    const hasPlayerish =
      keys.includes("battingstyle") ||
      keys.includes("bowlingstyle") ||
      keys.includes("role") ||
      keys.includes("dateofbirth") ||
      keys.includes("birthplace") ||
      keys.includes("intlteam");
    return hasName && hasPlayerish;
  };

  const visit = (node: unknown, depth: number): void => {
    if (!node || typeof node !== "object" || depth > 14 || bestMatch) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        if (looksLikePlayer(item)) {
          bestMatch = item;
          return;
        }
        visit(item, depth + 1);
        if (bestMatch) return;
      }
      return;
    }

    const obj = node as Record<string, unknown>;
    if (looksLikePlayer(obj)) {
      bestMatch = obj;
      return;
    }
    for (const k of Object.keys(obj)) {
      visit(obj[k], depth + 1);
      if (bestMatch) return;
    }
  };

  visit(nextData, 0);
  if (!bestMatch) return null;

  return flattenPlayerObject(bestMatch);
}

function flattenPlayerObject(obj: Record<string, unknown>): Partial<PlayerProfile> {
  const get = (keys: string[]): string => {
    for (const k of Object.keys(obj)) {
      if (keys.includes(k.toLowerCase())) {
        const v = obj[k];
        if (typeof v === "string" || typeof v === "number") return String(v);
      }
    }
    return "";
  };

  return {
    name: get(["name", "fullname", "playername"]),
    role: get(["role", "playingrole"]),
    battingStyle: get(["battingstyle"]),
    bowlingStyle: get(["bowlingstyle"]),
    born: get(["dateofbirth", "born", "birthdate"]),
    birthPlace: get(["birthplace", "birthplacename"]),
    image: get(["image", "imageurl", "faceimageid"]),
    _raw: obj,
  };
}

// -----------------------------------------------------------------
// Strategy 2 & 3: HTML — try known site patterns first, then
// fall back to generic label scanning (works on unfamiliar markup).
// -----------------------------------------------------------------
function extractPlayerFromHtml($: CheerioAPI): PlayerProfile {
  const profile: PlayerProfile = {
    name: "",
    image: "",
    role: "",
    battingStyle: "",
    bowlingStyle: "",
    born: "",
    birthPlace: "",
    teams: [],
    stats: {},
    bio: "",
  };

  // --- Name: try <h1> first (works on most sites incl. Cricbuzz/ESPN) ---
  profile.name =
    $("h1").first().text().trim() ||
    $('[class*="player-name" i], [class*="playerName" i]').first().text().trim() ||
    $("title").text().split("|")[0].trim();

  // --- Image: first reasonably large image near the top of the page ---
  const heroImg = $('img[class*="player" i], img[class*="profile" i], img[class*="avatar" i]')
    .first()
    .attr("src");
  profile.image = heroImg || $("img").first().attr("src") || "";

  // --- Generic label scanner: find "Label: Value" or "Label \n Value" pairs ---
  const labelMap: Record<string, keyof PlayerProfile> = {
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
      if (profile[field]) return; // already found, keep first match

      // value is usually the next sibling or parent's next sibling text
      const candidate =
        $el.next().text().trim() ||
        $el.parent().next().text().trim() ||
        $el.parent().text().replace($el.text(), "").trim();

      if (candidate && candidate.length < 200) {
        (profile[field] as string) = candidate;
      }
    }
  });

  // --- Teams: links that look like team pages, deduped ---
  const teamTexts = $('a[href*="team" i], a[href*="/teams/" i]')
    .map((_: number, el: any) => $(el).text().trim())
    .get()
    .filter((t: string) => t && t.length < 40);
  profile.teams = [...new Set(teamTexts)].slice(0, 10);

  // --- Stats tables: any <table> with header row + data rows ---
  $("table").each((_: number, table: any) => {
    const $table = $(table);
    const headers = $table
      .find("th")
      .map((_i: number, th: any) => $(th).text().trim())
      .get()
      .filter(Boolean);

    if (!headers.length) return;

    // Try to name this table using nearby heading text
    const nearbyHeading =
      $table.prevAll("h2, h3, h4").first().text().trim() ||
      $table.closest("div").prevAll("h2, h3, h4").first().text().trim() ||
      `table_${Object.keys(profile.stats).length + 1}`;

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

    if (rows.length) {
      // Flatten into { format: firstRowSummary } style for quick reading,
      // plus keep raw rows under a "_rows" key.
      const flatSummary: Record<string, string> = {};
      rows.forEach((row: Record<string, string>, idx: number) => {
        const label = row[headers[0]] || `row_${idx + 1}`;
        flatSummary[label] = Object.entries(row)
          .slice(1)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      });
      profile.stats[nearbyHeading || `table_${idx_fallback(profile)}`] = flatSummary;
    }
  });

  // --- Bio: longest paragraph on the page (rough heuristic) ---
  let longest = "";
  $("p").each((_: number, p: any) => {
    const text = $(p).text().trim();
    if (text.length > longest.length) longest = text;
  });
  profile.bio = longest.slice(0, 1000);

  return profile;
}

function idx_fallback(profile: PlayerProfile): number {
  return Object.keys(profile.stats).length + 1;
    }
