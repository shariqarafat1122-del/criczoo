import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { profileId } = req.query;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "profileId is required",
      });
    }

    const response = await fetch(
      `https://www.cricbuzz.com/profiles/${profileId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36",
          Accept: "text/html",
        },
      }
    );

    const html = await response.text();

    const decoded = html
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

";

// decoded HTML milne ke baad
const decoded = decodeURIComponent(html);

// YAHAN
const $ = cheerio.load(decoded);

const born = $("*:contains('Born')").next().text().trim();

const birthPlace = $("*:contains('Birth Place')").next().text().trim();

const role = $("*:contains('Role')").next().text().trim();

const battingStyle = $("*:contains('Batting Style')").next().text().trim();

const teams = $("*:contains('Teams')")
  .next()
  .text()
  .replace(/\s+/g, " ")
  .trim();



       return res.status(200).json({
       success: true,
       born,
       birthPlace,
       role,
       battingStyle,
       teams,
    });


  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
