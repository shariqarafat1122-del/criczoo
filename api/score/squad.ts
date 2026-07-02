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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
          Accept: "text/html",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Cricbuzz returned ${response.status}`,
      });
    }

    const html = await response.text();

    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

    const nextScripts = scripts
      .map((s) => s[1])
      .filter((s) => s.includes("self.__next_f.push"));

    const text = nextScripts.join("\n");

    const matches = [
      ...text.matchAll(
        /\\"name\\":\\"(.*?)\\"[\s\S]*?\\"profileUrl\\":\\"(.*?)\\"[\s\S]*?\\"imageId\\":(\d+)/g
      ),
    ];

    const players = matches.map((m) => ({
      name: m[1],
      profile: `https://www.cricbuzz.com${m[2].replace(/\\\\/g, "")}`,
      image: `https://static.cricbuzz.com/a/img/v1/i1/c${m[3]}.jpg`,
    }));

    return res.status(200).json({
      success: true,
      total: players.length,
      players,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
