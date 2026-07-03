// api/player/profile.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface BattingFormEntry {
  score: string;
  opponent: string;
  format: string;
  date: string;
}

interface RankingEntry {
  current: string;
  best: string;
}

interface Rankings {
  test: string;
  odi: string;
  t20i: string | RankingEntry;
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream returned ${response.status}`,
      });
    }

    const html = await response.text();

    if (html.includes("Nothing to show") || html.includes('"asNotFound":true')) {
      return res.status(404).json({
        success: false,
        profileId,
        error: "Player profile not found",
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

    const grab = (key: string): string | null => {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
      return m ? m[1].trim() : null;
    };

    const name = person.name || grab("name");
    const birthDate = person.birthDate || grab("birthDate") || grab("born");
    const birthPlace = person.birthPlace || grab("birthPlace");
    const role = person.jobTitle || grab("role");
    const nationality = person.nationality || grab("nationality");
    const worksFor: string | null = person.worksFor || grab("worksFor");

    const battingStyleMatch = html.match(/Batting Style([A-Za-z\s]+?)(?:Bowling Style|Teams)/);
    const bowlingStyleMatch = html.match(/Bowling Style([A-Za-z\s]+?)(?:Teams|ICC)/);

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
