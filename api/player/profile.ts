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

    return res.status(200).json({
      success: true,
      hasPersonal: decoded.includes("PERSONAL INFORMATION"),
      hasBorn: decoded.includes("Born"),
      hasBatting: decoded.includes("Batting Style"),
      hasBowling: decoded.includes("Bowling Style"),
      hasTeams: decoded.includes("Teams"),
      hasName: decoded.includes("Tim Seifert"),
      hasBattingSummary: decoded.includes("Batting Career Summary"),
      length: decoded.length,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
