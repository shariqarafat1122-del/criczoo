// api/player/profile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface BattingFormEntry {
  score: string;
  opponent: string;
  format: string;
  date: string;
}

interface Rankings {
  test: string;
  odi: string;
  t20i: string | { current: string; best: string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { profileId } = req.query;

  if (!profileId || typeof profileId !== "string") {
    return res.status(400).json({ success: false, error: "profileId is required" });
  }

  try {
    const url = `https://www.cricbuzz.com/profiles/${profileId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.cricbuzz.com/",
      },
    });

    const html = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream returned ${response.status}`,
        preview: html.slice(0, 300), // debug: see what Cricbuzz actually sent
      });
    }

   
    const hasNotFoundFlag = html.includes('"asNotFound":true');
    const hasPersonSchema = html.includes('"@type":"Person"');

    if (hasNotFoundFlag && !hasPersonSchema) {
      return res.status(404).json({
        success: false,
        profileId,
        error: "Player profile not found",
        preview: html.slice(0, 300), // debug: remove once confirmed working
      });
    }

    const ldJsonMatch = html.match(
      /<script type="application\/ld\+json">(\{.*?"mainEntity".*?\})<\/script>/s
    );

    let ld: any = null;
    if (ldJsonMatch) {
      try {
        ld = JSON.parse(ldJsonMatch[1]);
      } catch {
        try {
          const unescaped = ldJsonMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
          ld = JSON.parse(unescaped);
        } catch {
          ld = null;
        }
      }
    }

    const person: any = ld?.mainEntity || {};

    // Scope name/nationality/birthDate/birthPlace to the mainEntity Person block only,
// never to the whole HTML — avoids matching the site-wide Organization schema.
const grabFromPerson = (key: string): string | null => {
  if (!ldJsonMatch) return null;
  const personBlock = ldJsonMatch[1]; // the mainEntity JSON-LD string only
  const m = personBlock.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
  return m ? m[1].trim() : null;
};

const name = person.name || grabFromPerson("name");
const birthDate = person.birthDate || grabFromPerson("birthDate");
const birthPlace = person.birthPlace || grabFromPerson("birthPlace");
const nationality = person.nationality || grabFromPerson("nationality");
const worksFor: string | null = person.worksFor || grabFromPerson("worksFor");

// role / battingStyle / bowlingStyle are NOT in JSON-LD — only in the
// plain-text "PERSONAL INFORMATION" block, so grab() (JSON key:value) never finds them.
// Parse that text block directly instead:
const roleMatch = html.match(/\bRole([A-Za-z\-\/ ]+?)Batting Style/);
const role = roleMatch ? roleMatch[1].trim() : null;

const battingStyleMatch = html.match(/Batting Style([A-Za-z ]+?)Teams/);
const battingStyle = battingStyleMatch ? battingStyleMatch[1].trim() : null;

const bowlingStyleMatch = html.match(/Bowling Style([A-Za-z, ]+?)(?:Teams|ICC)/);
const bowlingStyle = bowlingStyleMatch ? bowlingStyleMatch[1].trim() : null;

    let teams: string[] = [];
    if (worksFor) {
      teams = worksFor.split(",").map((t: string) => t.trim()).filter(Boolean);
    } else {
      const teamsBlockMatch = html.match(/Teams([A-Za-z0-9,\s]+?)(?:ICC RANKINGS|RECENT FORM)/);
      if (teamsBlockMatch) {
        teams = teamsBlockMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    }

    const rankingsBlockMatch = html.match(
      /ICC RANKINGS(.*?)(?:SUMMARY|TEAMS\s|RECENT FORM)/s
    );
    const parseRankings = (block: string | undefined): Rankings | null => {
      if (!block) return null;
      const testMatch = block.match(/Test(\S*?)(ODI|$)/);
      const odiMatch = block.match(/ODI(\S*?)(T20I|$)/);
      const t20Match = block.match(/T20I(\d*)(\d*)/);
      return {
        test: testMatch ? testMatch[1] : "-",
        odi: odiMatch ? odiMatch[1] : "-",
        t20i: t20Match ? { current: t20Match[1] || "-", best: t20Match[2] || "-" } : "-",
      };
    };
    const iccRankings = parseRankings(rankingsBlockMatch?.[1]);

    const formMatches = [
      ...html.matchAll(/(\d+\(\d+\))([A-Z]+)(T20I?|ODI|TEST)(\d{4} \w{3} \d{2})/g),
    ];
    const battingForm: BattingFormEntry[] = formMatches.slice(0, 5).map((m) => ({
      score: m[1],
      opponent: m[2],
      format: m[3],
      date: m[4],
    }));

    const summaryMatch = html.match(/"summary":"(.*?)","/);
    const careerSummary: string | null =
      person.description ||
      (summaryMatch
        ? summaryMatch[1].replace(/\\"/g, '"').replace(/\\u2019/g, "'")
        : null);

    const imageIdMatch = html.match(/"imageId":(\d+)/);
    const playerImage = imageIdMatch
      ? `https://static.cricbuzz.com/a/img/v1/i1/c${imageIdMatch[1]}/i.jpg`
      : null;

    const cleanData = {
      success: true,
      profileId,
      name: name || null,
      country: nationality || null,
      playerImage,
      born: birthDate || null,
      birthPlace: birthPlace || null,
      role: role || null,
      battingStyle: battingStyleMatch ? battingStyleMatch[1].trim() : null,
      bowlingStyle: bowlingStyleMatch ? bowlingStyleMatch[1].trim() : null,
      iccRankings,
      teams,
      battingForm,
      careerSummary,
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(cleanData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch or parse profile",
      details: message,
    });
  }
}
