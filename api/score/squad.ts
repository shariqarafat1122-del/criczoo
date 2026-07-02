import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { matchId } = req.query;

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

    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

    const nextScripts = scripts
      .map((s) => s[1])
      .filter((s) => s.includes("self.__next_f.push"));

    return res.status(200).json({
      totalScripts: scripts.length,
      nextScripts,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
