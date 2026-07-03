import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

const url = "https://www.cricbuzz.com/profiles/9443/tim-seifert";


async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 3600 }, // Cache 1 hour on Vercel
  });

  if (!res.ok) {
    throw new Error(`Cricbuzz returned ${res.status}`);
  }

  return res.text();
}

/**
 * Extract text content between two markers in HTML
 */
function between(html: string, start: string, end: string): string {
  const s = html.indexOf(start);
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return html.slice(s + start.length);
  return html.slice(s + start.length, e);
}

/**
 * Strip HTML tags
 */
function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract player image URL from HTML
 */
function extractImage(html: string): string | null {
  // Pattern: <img ... src="https://static.cricbuzz.com/a/img/v1/...
  const imgMatch = html.match(
    /src=["'](https:\/\/static\.cricbuzz\.com\/a\/img\/v1\/i1\/c\d+\/[^"']+)["']/
  );
  if (imgMatch) return imgMatch[1];

  // Alternate pattern
  const altMatch = html.match(
    /src=["'](https:\/\/[^"']*cricbuzz[^"']*\/players\/[^"']+)["']/
  );
  return altMatch ? altMatch[1] : null;
}

/**
 * Extract JSON-LD schema data from HTML
 */
function extractJsonLd(html: string): any[] {
  const results: any[] = [];
  const pattern =
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]));
    } catch {
      // Skip malformed JSON
    }
  }

  return results;
}
