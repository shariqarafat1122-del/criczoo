import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
function clean(text: string) {
  return text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function extractBetween(source: string, start: string, end: string) {
  const s = source.indexOf(start);
  if (s === -1) return "";
  const from = s + start.length;
  const e = end ? source.indexOf(end, from) : -1;
  return clean(e === -1 ? source.substring(from) : source.substring(from, e));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const profileId = String(req.query.profileId || "").trim();
    if (!profileId) return res.status(400).json({success:false,message:"profileId is required"});

    const response = await fetch(`https://www.cricbuzz.com/profiles/${profileId}`,{
      headers:{
        "User-Agent":"Mozilla/5.0",
        "Accept":"text/html"
      }
    });

    const html = await response.text();

const decoded = html
  .replace(/\\u003c/g, "<")
  .replace(/\\u003e/g, ">")
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, "\\");


    const $ = cheerio.load(decoded);

     console.log($("body").text());
// 👇 YAHAN RAKHO
const born =
  decoded.match(/Born\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}\s*\(\d+\s*years\))/)?.[1] ?? "";

const birthPlace =
  decoded.match(/Birth Place\s*([A-Za-z\s-]+?)(?=Role)/)?.[1]?.trim() ?? "";

const role =
  decoded.match(/Role\s*([A-Za-z-]+?)(?=Batting Style)/)?.[1]?.trim() ?? "";

const battingStyle =
  decoded.match(/Batting Style\s*(.*?)(?=Teams)/)?.[1]?.trim() ?? "";

const teams =
  decoded.match(/Teams\s*(.*?)(?=ICC Rankings|Career Summary|Summary|$)/is)?.[1]?.trim() ?? "";

    const text = clean(decoded);

    return res.status(200).json({
      success:true,
      profileId,
      born: extractBetween(text,"Born","Birth Place"),
      birthPlace: extractBetween(text,"Birth Place","Role"),
      role: extractBetween(text,"Role","Batting Style"),
      battingStyle: extractBetween(text,"Batting Style","ICC RANKINGS"),
      teams: extractBetween(text,"Teams","Related Articles"),
      summary: extractBetween(text,"SUMMARY","APPS")
    });
  } catch(err:any){
    return res.status(500).json({success:false,error:err?.message});
  }
}
