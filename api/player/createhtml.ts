import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).send("Missing url. Pass ?url=https://example.com/page");
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    res.status(400).send("Invalid url");
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
      res
        .status(response.status)
        .send(`Failed to fetch page (status ${response.status})`);
      return;
    }

    const html = await response.text();

    // Return the raw HTML directly, exactly as fetched
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    const error = err as Error;
    res.status(500).send(`Error: ${error.message}`);
  }
}
