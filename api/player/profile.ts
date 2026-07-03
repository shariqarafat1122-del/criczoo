import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    const personal = decoded.match(
  /PERSONAL INFORMATION([\s\S]*?)ICC RANKINGS/i
)?.[1] || "";

const born =
  personal.match(/Born\s*([\s\S]*?)Birth Place/i)?.[1]?.trim() || "";

const birthPlace =
  personal.match(/Birth Place\s*([\s\S]*?)Role/i)?.[1]?.trim() || "";

const role =
  personal.match(/Role\s*([\s\S]*?)Batting Style/i)?.[1]?.trim() || "";

const battingStyle =
  personal.match(/Batting Style\s*([\s\S]*?)Teams/i)?.[1]?.trim() || "";

const BowlingSummary =
  personal.match(/Bowling Career Summary\s*([\s\S]*?)Bowling Career Summary/i)?.[1]?.trim() || "";

const teams =
  personal.match(/Teams\s*([\s\S]*)/)?.[1]
    ?.replace(/\s+/g, " ")
    .trim() || "";

       return res.status(200).send({
       success: true,
       born,
       birthPlace,
       role,
       battingStyle,
       BowlingSummary,
       teams,
    });


  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
