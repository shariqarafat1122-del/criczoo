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
  t20i: string;
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
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.cricbuzz.com/",
      },
    });

    const html = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream returned ${response.status}`,
        preview: html.slice(0, 300),
      });
    }

    const hasNotFoundFlag = html.includes('"asNotFound":true');
    const hasPersonSchema = html.includes('"@type":"Person"');

    if (hasNotFoundFlag && !hasPersonSchema) {
      return res.status(404).json({
        success: false,
        profileId,
        error: "Player profile not found",
      });
    }

    // ---- JSON-LD extraction (primary, most reliable source) ----
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

    const name: string | null = person.name || null;
    const birthDate: string | null = person.birthDate || null;
    const birthPlace: string | null = person.birthPlace || null;
    const nationality: string | null = person.nationality || null;
    const worksFor: string | null = person.worksFor || null;

    // jobTitle in JSON-LD is always "Cricketer" — the real role (WK-Batsman etc.)
    // is only in the plain-text "PERSONAL INFORMATION" block, so parse that directly.
    // Pattern in raw text: "...RoleWK-BatsmanBatting StyleRight Handed BatTeams..."
    const roleMatch = html.match(/\bRole([A-Za-z\-\/ ]+?)Batting Style/);
    const role = roleMatch ? roleMatch[1].trim() : null;

    // Batting Style sits directly between "Batting Style" and "Teams"
    const battingStyleMatch = html.match(/Batting Style([A-Za-z ]+?)Teams/);
    const battingStyle = battingStyleMatch ? battingStyleMatch[1].trim() : null;

    // Bowling Style only exists for bowlers/all-rounders; sits between
    // "Bowling Style" and either "Teams" or "ICC"
    const bowlingStyleMatch = html.match(/Bowling Style([A-Za-z, ]+?)(?:Teams|ICC)/);
    const bowlingStyle = bowlingStyleMatch ? bowlingStyleMatch[1].trim() : null;

    // ---- Teams ----
    let teams: string[] = [];
    if (worksFor) {
      teams = worksFor.split(",").map((t: string) => t.trim()).filter(Boolean);
    } else {
      const teamsBlockMatch = html.match(/\bTeams([A-Za-z0-9,\- ]+?)ICC RANKINGS/);
      if (teamsBlockMatch) {
        teams = teamsBlockMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    }

    // ---- ICC Rankings ----
    // Raw pattern: "FormatCurrent RankBest RankTest----ODI----T20I126"
    // i.e. Test, ODI have "-" for both current/best when unranked;
    // T20I here shows "126" meaning current=1, best=26 concatenated (no separator).
    // We can only reliably split when both values are single/double digit; otherwise
    // report the raw captured string alongside a best-effort split.
    const rankingsBlockMatch = html.match(
      /Best RankTest([\s\S]*?)SUMMARY/
    );
    const parseRankings = (block: string | undefined): Rankings | null => {
      if (!block) return null;
      const testMatch = block.match(/^(-+|\d+)ODI/);
      const odiMatch = block.match(/ODI(-+|\d+)T20I/);
      const t20Match = block.match(/T20I(-+|\d+)$/);
      return {
        test: testMatch ? testMatch[1] : "-",
        odi: odiMatch ? odiMatch[1] : "-",
        t20i: t20Match ? t20Match[1] : "-",
      };
    };
    const iccRankings = parseRankings(rankingsBlockMatch?.[1]);

    // ---- Recent batting form ----
    const formMatches = [
      ...html.matchAll(/(\d+\(\d+\))([A-Z]+)(T20I?|ODI|TEST)(\d{4} \w{3} \d{2})/g),
    ];
    const battingForm: BattingFormEntry[] = formMatches.slice(0, 5).map((m) => ({
      score: m[1],
      opponent: m[2],
      format: m[3],
      date: m[4],
    }));

    // ---- Career summary ----
    const summaryMatch = html.match(/"summary":"(.*?)","/);
    const careerSummary: string | null =
      person.description ||
      (summaryMatch
        ? summaryMatch[1].replace(/\\"/g, '"').replace(/\\u2019/g, "'")
        : null);

    // ---- Player image ----
    const imageIdMatch = html.match(/"imageId":(\d+)/);
    const playerImage = imageIdMatch
      ? `https://static.cricbuzz.com/a/img/v1/i1/c${imageIdMatch[1]}/i.jpg`
      : null;

    const cleanData = {
      success: true,
      profileId,
      name,
      country: nationality,
      playerImage,
      born: birthDate,
      birthPlace,
      role,
      battingStyle,
      bowlingStyle,
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
