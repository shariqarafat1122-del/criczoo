import type { VercelRequest, VercelResponse } from "@vercel/node";

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
      .replace(/\\u003c/g,"<")
      .replace(/\\u003e/g,">")
      .replace(/\\\"/g,'"')
      .replace(/\\\\/g,"\\");

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
