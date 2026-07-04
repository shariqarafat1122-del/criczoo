

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

interface MatchResult {
  [key: string]: unknown;
}

interface HtmlMatchResult {
  rawText: string;
  teamAGuess: string | null;
  teamBGuess: string | null;
  badges: string[];
  images: string[];
}



  const parsedUrl = "https://cricbuzz.com/profile/9443/tim-seifert";

  
  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      res.status(502).json({
        error: `Upstream fetch failed with status ${response.status}`,
      });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ---------- 1. Try __NEXT_DATA__ (Next.js apps) ----------
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
      try {
        const nextData: unknown = JSON.parse(nextDataScript);
        const matches = extractMatchesFromNextData(nextData);
        res.status(200).json({
          source: targetUrl,
          method: "next-data",
          matchesFound: matches.length,
          matches,
          raw: safeTruncate(nextData),
        });
        return;
      } catch (e) {
        // fall through to HTML scraping if JSON parse fails
      }
    }

    // ---------- 2. Generic HTML scraping fallback ----------
    const matches = extractMatchesFromHtml($);

    res.status(200).json({
      source: targetUrl,
      method: "html-scrape",
      matchesFound: matches.length,
      matches,
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: "Scrape failed", details: error.message });
  }
}

// -----------------------------------------------------------------
// Recursively search parsed __NEXT_DATA__ for arrays of objects that
// "look like" cricket matches (has team-ish and score-ish fields).
// -----------------------------------------------------------------
function extractMatchesFromNextData(nextData: unknown): MatchResult[] {
  const found: MatchResult[] = [];
  const seen = new Set<string>();

  const looksLikeMatch = (obj: unknown): obj is Record<string, unknown> => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    const keys = Object.keys(obj as Record<string, unknown>)
      .join(",")
      .toLowerCase();
    const hasTeams =
      keys.includes("team") || keys.includes("home") || keys.includes("away");
    const hasMatchish =
      keys.includes("score") ||
      keys.includes("status") ||
      keys.includes("series") ||
      keys.includes("venue") ||
      keys.includes("match");
    return hasTeams && hasMatchish;
  };

  const visit = (node: unknown, depth: number): void => {
    if (!node || typeof node !== "object" || depth > 12) return;

    if (Array.isArray(node)) {
      const candidateItems = node.filter(looksLikeMatch);
      if (candidateItems.length >= 1) {
        for (const item of candidateItems) {
          const key = JSON.stringify(item).slice(0, 200);
          if (!seen.has(key)) {
            seen.add(key);
            found.push(normalizeMatchObject(item));
          }
        }
      }
      node.forEach((child: unknown) => visit(child, depth + 1));
      return;
    }

    const obj = node as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      visit(obj[k], depth + 1);
    }
  };

  visit(nextData, 0);
  return found;
}

// Normalize an arbitrary match-shaped object into a consistent, flat shape.
function normalizeMatchObject(obj: Record<string, unknown>): MatchResult {
  const flat = flattenSimpleValues(obj);
  return {
    ...flat,
    _raw: obj,
  };
}

// Pulls out string/number leaf values one level deep + common nested paths.
function flattenSimpleValues(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      for (const [k2, v2] of Object.entries(nested)) {
        if (
          typeof v2 === "string" ||
          typeof v2 === "number" ||
          typeof v2 === "boolean"
        ) {
          result[`${key}_${k2}`] = v2;
        }
      }
    }
  }
  return result;
}

function safeTruncate(obj: unknown): unknown {
  try {
    const str = JSON.stringify(obj);
    if (str.length <= 200000) return obj;
    return { _truncated: true, _note: "raw payload too large, omitted" };
  } catch (e) {
    return { _note: "unable to serialize raw payload" };
  }
}

// -----------------------------------------------------------------
// Generic HTML fallback: look for repeating "card"-like blocks and
// pull out team names, scores, status badges, venue/date text.
// -----------------------------------------------------------------
function extractMatchesFromHtml($: CheerioAPI): HtmlMatchResult[] {
  const matches: HtmlMatchResult[] = [];

  const cardSelector =
    '[class*="card" i], [class*="match" i], [class*="fixture" i]';

  const candidates = $(cardSelector).filter((_: number, el: any) => {
    const text = $(el).text().trim();
    return /\bvs\b/i.test(text) && text.length < 2000;
  });

  const topLevel = candidates.filter((_i: number, el: any) => {
    const $el = $(el);
    return (
      $el
        .parents(cardSelector)
        .filter((_p: number, p: any) => candidates.is(p)).length === 0
    );
  });

  topLevel.each((_: number, el: any) => {
    const $el = $(el);

    const images: string[] = $el
      .find("img")
      .map((_i: number, img: any) => {
        const $img = $(img);
        return $img.attr("src") || $img.attr("data-src") || null;
      })
      .get()
      .filter((src: string | null): src is string => Boolean(src));

    const badgeLike: string[] = $el
      .find(
        '[class*="badge" i], [class*="tag" i], [class*="pill" i], [class*="status" i]'
      )
      .map((_i: number, b: any) => $(b).text().trim())
      .get()
      .filter((b: string): boolean => Boolean(b));

    const fullText = $el.text().replace(/\s+/g, " ").trim();

    const vsMatch = fullText.match(/(.{1,60})\bvs\b(.{1,60})/i);

    matches.push({
      rawText: fullText.slice(0, 500),
      teamAGuess: vsMatch ? vsMatch[1].trim() : null,
      teamBGuess: vsMatch ? vsMatch[2].trim() : null,
      badges: [...new Set(badgeLike)],
      images,
    });
  });

  return matches;
}
