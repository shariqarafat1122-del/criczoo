
// api/train.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const trainNo = req.query.trainNo as string;

    if (!trainNo) {
      return res.status(400).json({
        error: "trainNo is required",
      });
    }

    // Demo URL
    const url = "https://www.railyatri.in/m/live-train-status/75302";

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to fetch RailYatri page",
      });
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    const nextData = $("#__NEXT_DATA__").html();

    if (!nextData) {
      return res.status(500).json({
        error: "__NEXT_DATA__ not found",
      });
    }

    const json = JSON.parse(nextData);

    return res.status(200).json(json);
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
