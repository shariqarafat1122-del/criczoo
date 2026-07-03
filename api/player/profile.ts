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

    return res.status(200).json({
      success: true,
      length: html.length,

      hasName: html.includes("Tim Seifert"),
      hasBorn: html.includes("Born"),
      hasBatting: html.includes("Batting Style"),
      hasBirthPlace: html.includes("Birth Place"),
      hasBattingSummary: html.includes("Batting Career Summary"),
      hasBowlingSummary: html.includes("Bowling Career Summary"),
      
      

      html,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
