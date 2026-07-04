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
    res.status(400).json({ success: false, message: "Missing url. Pass ?url=" });
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

    // 1. Try embedded JSON first (works for Next.js-style sites)
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
      try {
        res.status(200).json({ success: true, source: "next-data", url: parsedUrl.toString(), data: JSON.parse(nextDataScript) });
        return;
      } catch (e) {}
    }

    const jsonScripts: unknown[] = [];
    $('script[type="application/json"]').each((_: number, el: any) => {
      const raw = $(el).html();
      if (!raw) return;
      try { jsonScripts.push(JSON.parse(raw)); } catch (e) {}
    });
    if (jsonScripts.length) {
      res.status(200).json({ success: true, source: "embedded-json-scripts", url: parsedUrl.toString(), data: jsonScripts.length === 1 ? jsonScripts[0] : jsonScripts });
      return;
    }

    // 2. Fallback: build raw JSON from plain HTML (no embedded JSON on page)
    const data: Record<string, unknown> = {};

    data.title = $("title").text().trim();
    data.h1 = $("h1").first().text().trim();

    data.headings = $("h2, h3")
      .map((_: number, el: any) => $(el).text().trim())
      .get()
      .filter(Boolean);

    data.paragraphs = $("p")
      .map((_: number, el: any) => $(el).text().trim())
      .get()
      .filter((t: string) => t.length > 0);

    data.images = $("img")
      .map((_: number, el: any) => ({
        src: $(el).attr("src") || $(el).attr("srcset") || "",
        alt: $(el).attr("alt") || "",
      }))
      .get()
      .filter((img: { src: string }) => img.src);

    data.links = $("a[href]")
      .map((_: number, el: any) => ({
        text: $(el).text().trim(),
        href: $(el).attr("href"),
      }))
      .get()
      .filter((l: { text: string }) => l.text.length > 0)
      .slice(0, 200);

    data.tables = $("table")
      .map((_: number, table: any) => {
        const $table = $(table);
        const headers = $table.find("th").map((_i: number, th: any) => $(th).text().trim()).get();
        const rows = $table
          .find("tbody tr")
          .map((_i: number, tr: any) =>
            $(tr).find("td").map((_j: number, td: any) => $(td).text().trim()).get()
          )
          .get();
        return { headers, rows };
      })
      .get()
      .filter((t: any) => t.rows.length > 0);

    res.status(200).json({
      success: true,
      source: "html-scrape",
      url: parsedUrl.toString(),
      data,
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ success: false, message: error.message });
  }
}
