import type { VercelRequest, VercelResponse } from "@vercel/node";

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
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
          "Accept": "text/html",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Cricbuzz returned ${response.status}`,
      });
    }

    const html = await response.text();

    // Raw HTML return karega
    return res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(html);

  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
