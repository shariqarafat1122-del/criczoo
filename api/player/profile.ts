import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { profileUrl } = req.query;

    if (!profileUrl) {
      return res.status(400).json({
        success: false,
        message: "profileUrl is required",
      });
    }

    const response = await fetch(profileUrl as string, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Failed to fetch player page",
      });
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    // Ab yahan parsing hogi
    // const name = ...
    // const image = ...
    // const role = ...

    return res.status(200).send(html); // Test ke liye
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}
