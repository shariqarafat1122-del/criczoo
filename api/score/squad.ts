import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { matchId } = req.query;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "matchId is required",
      });
    }

    const response = await fetch(
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
          Accept: "text/html",
        },
      }
    );

    const html = await response.text();

    // Extract all self.__next_f.push(...) blocks
    const scripts = [
      ...html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\);/g),
    ];

    const blocks = scripts
      .map((m) => m[1])
      .filter(
        (x) =>
          x.includes("playingXIChange") ||
          x.includes("fullName") ||
          x.includes("teamName")
      );

  
  const html = await response.text();

   return res
  .status(200)
  .setHeader("Content-Type", "text/html")
  .send(html);
    
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
}
