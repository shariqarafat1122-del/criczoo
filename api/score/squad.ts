import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { matchId } = req.query;

    const response = await fetch(
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
        },
      }
    );

    const html = await response.text();

    const $ = cheerio.load(html);

    // 👇 Yahan parsing code aayega

    return res.status(200).json(players);

  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    });
  }
}
