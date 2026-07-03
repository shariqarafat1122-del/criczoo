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

    const start = decoded.indexOf("PERSONAL INFORMATION");
    const batting = decoded.indexOf("Batting Style");
    const bowling = decoded.indexOf("Bowling Career Summary");

    return res.status(200).json({
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
