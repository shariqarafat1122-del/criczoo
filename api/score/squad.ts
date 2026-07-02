import * as cheerio from "cheerio";

export default async function handler(req: any, res: any) {
  try {
    const { matchId } = req.query;

    const response = await fetch(
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const html = await response.text();

    const $ = cheerio.load(html);

    const players: any[] = [];

    $("a[href^='/profiles/']").each((_, el) => {
      players.push({
        name: $(el).text().trim(),
        profile: "https://www.cricbuzz.com" + $(el).attr("href"),
        image: $(el).find("img").attr("src"),
      });
    });

    return res.status(200).json({
      success: true,
      total: players.length,
      players,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
