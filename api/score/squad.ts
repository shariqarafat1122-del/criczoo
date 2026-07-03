import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

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
        },
      }
    );

    const html = await response.text();

    const flagRegex = /<img[^>]+src="(https:\/\/static\.cricbuzz\.com[^"]+)"/g;
    const flags = [...html.matchAll(flagRegex)].map(m => m[1]);
    const team1Flag = flags[0] || "";
    const team2Flag = flags[1] || "";

    const $ = cheerio.load(html);

    const teams: any[] = [];

    $("div.pb-5").each((_, team) => {
      const players: any[] = [];

      $(team)
        .find('a[href^="/profiles/"]')
        .each((__, el) => {
          const href = $(el).attr("href") || "";

          const profileId = href.split("/")[2];

          const name = $(el)
            .find("span")
            .first()
            .text()
            .trim();

          const role = $(el)
            .find(".text-cbTxtSec")
            .text()
            .trim();

          const image =
            $(el).find("img").attr("src") ||
            $(el).find("img").attr("srcset") ||
            "";

          const text = $(el).text();

          players.push({
            profileId,
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
