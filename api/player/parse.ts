import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).json({
      success: false,
      message: "Missing url. Pass ?url=https://example.com/page",
    });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    res.status(400).json({ success: false, message: "Invalid url" });
    return;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        message: `Failed to fetch page (status ${response.status})`,
      });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ---------- Try __NEXT_DATA__ first (raw JSON already embedded in page) ----------
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
      try {
        const nextData: unknown = JSON.parse(nextDataScript);
        res.status(200).json({
          success: true,
          source: "next-data",
          url: parsedUrl.toString(),
          data: nextData,
        });
        return;
      } catch (e) {
        // fall through to other strategies
      }
    }

    // ---------- Try any other embedded JSON <script> blocks ----------
    const jsonScripts: unknown[] = [];
    $('script[type="application/json"]').each((_: number, el: any) => {
      const raw = $(el).html();
      if (!raw) return;
      try {
        jsonScripts.push(JSON.parse(raw));
      } catch (e) {
        // skip invalid JSON
      }
    });

    if (jsonScripts.length) {
      res.status(200).json({
        success: true,
        source: "embedded-json-scripts",
        url: parsedUrl.toString(),
        data: jsonScripts.length === 1 ? jsonScripts[0] : jsonScripts,
      });
      return;
    }

    // ---------- Fallback: no structured JSON found on page ----------
    res.status(200).json({
      success: false,
      source: "none",
      url: parsedUrl.toString(),
      message: "No embedded JSON found on this page.",
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ success: false, message: error.message });
  }
}
