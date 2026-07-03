import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";


function createProfileSlug(profileId: string, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${profileId}/${slug}`;
}


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { matchId } = req.query;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "matchId is required",
      });
    }

    const response = await fetch(
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
          Accept: "text/html",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Failed to fetch Cricbuzz page",
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // -------------------------------------------------
    // Team Header (ENGW / RSAW + Flags)
    // -------------------------------------------------

    const header = $("div.flex.justify-between.bg-cbInactTab").first();

    const teamNames = header
      .find("h1")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    const team1Name = teamNames[0] || "";
    const team2Name = teamNames[1] || "";

    const visibleFlags = header
      .find("img")
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter(
        (src) =>
          !!src &&
          src.startsWith("https://static.cricbuzz.com") &&
          !src.includes("base64")
      );

    const uniqueFlags = [...new Set(visibleFlags)];

    const team1Flag = uniqueFlags[0] || "";
    const team2Flag = uniqueFlags[1] || "";

    // -------------------------------------------------
    // Match Info
    // -------------------------------------------------

    const seriesName = $("title").text().trim();

    const venue = "";
    const matchStatus = "";
    const matchDate = "";
    const matchTime = "";
    const matchFormat = "";

    // -------------------------------------------------
    // Players
    // -------------------------------------------------

    const teams: any[] = [];

    $("div.pb-5").each((_, team) => {
      const players: any[] = [];

      $(team)
        .find('a[href^="/profiles/"]')
        .each((__, el) => {
          const href = $(el).attr("href") || "";
          const profileId = href.split("/")[2] || "";

          const name = $(el)
            .find("span")
            .first()
            .text()
            .trim();

          const role = $(el)
            .find(".text-cbTxtSec")
            .first()
            .text()
            .trim();

          let image =
            $(el).find("img").attr("src") ||
            $(el).find("img").attr("srcset") ||
            "";

          if (image.includes(",")) {
            image = image.split(",")[0].split(" ")[0];
          }

          const text = $(el).text();

          players.push({
           profileId,
           profileSlug: createProfileSlug(profileId, name),
           name,
           role,
           captain: text.includes("(C)"),
           keeper: text.includes("(WK)"),
           image,
           });
        });

      if (players.length) {
        teams.push(players);
      }
    });

    return res.status(200).json({
      success: true,

      team1Name,
      team2Name,

      team1Flag,
      team2Flag,

      seriesName,
      venue,
      matchStatus,
      matchDate,
      matchTime,
      matchFormat,

      team1: teams[0] || [],
      team2: teams[1] || [],
    });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}
