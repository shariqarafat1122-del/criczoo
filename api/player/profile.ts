// api/cricbuzz-profile.js
export default async function handler(req, res) {
  const { profileId } = req.query; // e.g. "9443/tim-seifert" or just "9443"

  if (!profileId) {
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

    // 1. Extract the JSON-LD block (most reliable, structured source)
    const ldJsonMatch = html.match(
      /<script type="application\/ld\+json">(\{.*?"mainEntity".*?\})<\/script>/s
    );

    let ld = null;
    if (ldJsonMatch) {
      try {
        // The RSC stream escapes quotes as \" — unescape before parsing
        const raw = ldJsonMatch[1];
        ld = JSON.parse(raw);
      } catch {
        // fallback: try regex-based unescape then parse
        try {
          const unescaped = ldJsonMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
          ld = JSON.parse(unescaped);
        } catch {
          ld = null;
        }
      }
    }

    const person = ld?.mainEntity || {};

    // 2. Fallback field-level regex extraction (in case JSON-LD isn't found/parseable)
    const grab = (key) => {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
      return m ? m[1].trim() : null;
    };

    const name = person.name || grab("name");
    const birthDate = person.birthDate || grab("birthDate") || grab("born");
    const birthPlace = person.birthPlace || grab("birthPlace");
    const role = person.jobTitle || grab("role");
    const nationality = person.nationality || grab("nationality");
    const worksFor = person.worksFor || grab("worksFor");

    // Batting/Bowling style: appear as plain labelled text in the page,
    // not always in JSON-LD, so scan the "PERSONAL INFORMATION" block text.
    const battingStyleMatch = html.match(/Batting Style([A-Za-z\s]+?)(?:Bowling Style|Teams)/);
    const bowlingStyleMatch = html.match(/Bowling Style([A-Za-z\s]+?)(?:Teams|ICC)/);

    // Teams: prefer worksFor (from JSON-LD, cleanest), else labelled block
    let teams = [];
    if (worksFor) {
      teams = worksFor.split(",").map((t) => t.trim()).filter(Boolean);
    } else {
      const teamsBlockMatch = html.match(/Teams([A-Za-z0-9,\s]+?)(?:ICC RANKINGS|RECENT FORM)/);
      if (teamsBlockMatch) {
        teams = teamsBlockMatch[1].split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // ICC Rankings: Test/ODI/T20I current & best, for Batting/Bowling/All-Rounder
    const rankingsBlockMatch = html.match(
      /ICC RANKINGS(.*?)(?:SUMMARY|TEAMS\s|RECENT FORM)/s
    );
    const parseRankings = (block) => {
      if (!block) return null;
      // crude table scrape: Test----ODI----T20I126 style sequences
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

    // Recent batting form: pattern like "0(3)LSGT20026 Apr 26"
    const formMatches = [
      ...html.matchAll(/(\d+\(\d+\))([A-Z]+)(T20I?|ODI|TEST)(\d{4} \w{3} \d{2})/g),
    ];
    const battingForm = formMatches.slice(0, 5).map((m) => ({
      score: m[1],
      opponent: m[2],
      format: m[3],
      date: m[4],
    }));

    // Career summary text
    const summaryMatch = html.match(/"summary":"(.*?)","/);
    const careerSummary =
      person.description ||
      (summaryMatch
        ? summaryMatch[1].replace(/\\"/g, '"').replace(/\\u2019/g, "’")
        : null);

    // Player image: not always in ld+json; try imageId pattern near profile
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
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch or parse profile",
      details: err.message,
    });
  }
}
