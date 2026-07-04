
// Usage: GET /api/scrape?url=https://example.com/matches
//
// Strategy:
// 1. Fetch the target URL's HTML.
// 2. If it's a Next.js page, pull out the embedded __NEXT_DATA__ JSON
//    (this is usually the cleanest, most complete source of truth).
// 3. Otherwise, fall back to generic HTML parsing with cheerio to find
//    "match card"-like repeating blocks and extract text/labels/images.
//
// Response shape:
// {
//   "source": "<url>",
//   "method": "next-data" | "html-scrape",
//   "matches": [ ... ],
//   "raw": { ... }   // only for next-data method, the full parsed object (optional, capped)
// }

const cheerio = require("cheerio");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const targetUrl = req.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: "Missing required query param: url" });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL("https://cricbuzz.com/profile/9444/tim-seifert");
  } catch (e) {
    res.status(400).json({ error: "Invalid url" });
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
        const nextData = JSON.parse(nextDataScript);
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
    res.status(500).json({ error: "Scrape failed", details: err.message });
  }
};

// -----------------------------------------------------------------
// Recursively search parsed __NEXT_DATA__ for arrays of objects that
// "look like" cricket matches (has team-ish and score-ish fields).
// -----------------------------------------------------------------
function extractMatchesFromNextData(nextData) {
  const found = [];
  const seen = new Set();

  const looksLikeMatch = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    const keys = Object.keys(obj).join(",").toLowerCase();
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

  const visit = (node, depth) => {
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
      node.forEach((child) => visit(child, depth + 1));
      return;
    }

    for (const k of Object.keys(node)) {
      visit(node[k], depth + 1);
    }
  };

  visit(nextData, 0);
  return found;
}

// Normalize an arbitrary match-shaped object into a consistent, flat shape.
// Keeps unrecognized fields too, so nothing important is lost.
function normalizeMatchObject(obj) {
  const flat = flattenSimpleValues(obj);
  return {
    ...flat,
    _raw: obj,
  };
}

// Pulls out string/number leaf values one level deep + common nested paths,
// without exploding huge nested structures into the top-level result.
function flattenSimpleValues(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // one level of nesting, common for { team: { name, flag } } shapes
      for (const [k2, v2] of Object.entries(value)) {
        if (typeof v2 === "string" || typeof v2 === "number" || typeof v2 === "boolean") {
          result[`${key}_${k2}`] = v2;
        }
      }
    }
  }
  return result;
}

function safeTruncate(obj) {
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
function extractMatchesFromHtml($) {
  const matches = [];

  // Heuristic: find elements whose class names hint at "card", "match", "fixture"
  const cardSelector =
    '[class*="card" i], [class*="match" i], [class*="fixture" i]';

  const candidates = $(cardSelector).filter((_, el) => {
    const text = $(el).text().trim();
    // must contain "vs" (case-insensitive, standalone word) to look like a match card
    return /\bvs\b/i.test(text) && text.length < 2000;
  });

  // De-duplicate nested matches (parent/child both matching selector)
  const topLevel = candidates.filter((i, el) => {
    const $el = $(el);
    return $el.parents(cardSelector).filter((_, p) => candidates.is(p)).length === 0;
  });

  topLevel.each((_, el) => {
    const $el = $(el);

    const images = $el
      .find("img")
      .map((_, img) => $(img).attr("src") || $(img).attr("data-src") || null)
      .get()
      .filter(Boolean);

    const badgeLike = $el
      .find('[class*="badge" i], [class*="tag" i], [class*="pill" i], [class*="status" i]')
      .map((_, b) => $(b).text().trim())
      .get()
      .filter(Boolean);

    const fullText = $el
      .text()
      .replace(/\s+/g, " ")
      .trim();

    // Try to split around "vs" for team-ish text
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
