import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

function clean(text = "") {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getBetween(text: string, start: string, end: string) {
  const s = text.indexOf(start);
  if (s === -1) return "";

  const from = s + start.length;
  const e = end ? text.indexOf(end, from) : -1;

  return clean(
    e === -1
      ? text.substring(from)
      : text.substring(from, e)
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const profileId = String(req.query.profileId || "").trim();

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
            "Mozilla/5.0",
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

    const $ = cheerio.load(decoded);

    const bodyText = clean($("body").text());

    const title =
      $("title").text() ||
      getBetween(bodyText, "ALL", "Born");

    const name =
      title
        .replace(/Profile.*/i, "")
        .replace(/Cricbuzz.*/i, "")
        .trim();

    const country = getBetween(
      bodyText,
      name,
      "Born"
    );

    const born = getBetween(
      bodyText,
      "Born",
      "Birth Place"
    );

    const birthPlace = getBetween(
      bodyText,
      "Birth Place",
      "Role"
    );

    const role = getBetween(
      bodyText,
      "Role",
      "Batting Style"
    );

    const battingStyle = getBetween(
      bodyText,
      "Batting Style",
      "ICC RANKINGS"
    );

    const image =
      $('meta[property="og:image"]').attr("content") ||
      "";

// Teams
const teamsText = getBetween(
  bodyText,
  "Teams",
  "Related Articles"
);

const teams = teamsText
  .split(",")
  .map(t => clean(t))
  .filter(Boolean);

// Summary
const summary = getBetween(
  bodyText,
  "SUMMARY",
  "APPS"
);

// ICC Rankings
const rankings = [];
const rankingBlock = getBetween(
  bodyText,
  "ICC RANKINGS",
  "Teams"
);

if (rankingBlock) {
  ["Test", "ODI", "T20I"].forEach((format) => {
    const m = rankingBlock.match(
      new RegExp(
        `${format}\\s+([^\\s]+)\\s+([^\\s]+)`,
        "i"
      )
    );

    rankings.push({
      format,
      current: m?.[1] || "-",
      best: m?.[2] || "-",
    });
  });
}

// Related Articles
const articles: any[] = [];

const articleRegex =
  /([A-Za-z0-9,\- ':]+)\s+(\d+[dhmy] ago)/g;

let articleMatch;

while ((articleMatch = articleRegex.exec(bodyText)) !== null) {
  articles.push({
    title: clean(articleMatch[1]),
    time: articleMatch[2],
  });

  if (articles.length >= 10) break;
}

// Batting Form
const battingForm: any[] = [];

const formBlock = getBetween(
  bodyText,
  "Batting Form",
  "Batting Career Summary"
);

const formRegex =
  /(\d+\(\d+\)|DNB|TDNB)\s+([A-Z]+)\s+(T20I?|ODI|TEST|IPL)\s+(\d{2}\s[A-Za-z]{3}\s\d{2})/g;

let fm;

while ((fm = formRegex.exec(formBlock)) !== null) {
  battingForm.push({
    score: fm[1],
    opponent: fm[2],
    format: fm[3],
    date: fm[4],
  });
}

// Career Timeline
const timeline: any[] = [];

const timelineBlock = getBetween(
  bodyText,
  "Career Timeline",
  "SUMMARY"
);

const timelineRegex =
  /(t20|odi|test|ipl)\s+vs\s+(.+?)\s+vs\s+(.+?)(?=t20|odi|test|ipl|$)/gis;

let tm;

while ((tm = timelineRegex.exec(timelineBlock)) !== null) {
  timeline.push({
    format: tm[1].toUpperCase(),
    debut: clean(tm[2]),
    lastMatch: clean(tm[3]),
  });
}

// Career Summary placeholders
const battingCareer = {};
const bowlingCareer = {};

    return res.status(200).json({
  success: true,
  profileId,
  name,
  country,
  image,
  born,
  birthPlace,
  role,
  battingStyle,
  teams,
  summary,
  rankings,
  articles,
  battingForm,
  battingCareer,
  bowlingCareer,
  timeline,
});
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Unknown Error",
    });
  }
}
