// api/score/squad.ts

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
        error: "matchId is required",
      });
    }

    const response = await fetch(
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to fetch Cricbuzz Squad page",
      });
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    const nextData = $("#__NEXT_DATA__").html();

    if (!nextData) {
      return res.status(404).json({
        error: "__NEXT_DATA__ not found",
      });
    }

    const json = JSON.parse(nextData);

    return res.status(200).json(json);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
