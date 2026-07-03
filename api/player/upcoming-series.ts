import type { VercelRequest, VercelResponse } from "@vercel/node";

function slug(text: string) {
  return text.toLowerCase().replace(/['".]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

function imageUrl(id?: number) {
  return id ? `https://static.cricbuzz.com/a/img/v1/172x172/i1/c${id}/i.jpg` : null;
}

export default async function handler(req: VercelRequest,res: VercelResponse) {
  try {
    const response = await fetch("https://www.cricbuzz.com/api/cricket-schedule/upcoming-series/international/1783441800000",{
      headers:{ "User-Agent":"Mozilla/5.0", Accept:"application/json" }
    });

    const data = await response.json();
    const days:any[] = [];

    for (const item of data) {
      const wrapper = item.scheduleAdWrapper;
      if (!wrapper) continue;

      const matches:any[] = [];

      for (const series of (wrapper.matchScheduleList ?? [])) {
        for (const match of (series.matchInfo ?? [])) {
          const matchSlug = `${match.matchId}/${slug(match.team1.teamSName)}-vs-${slug(match.team2.teamSName)}`;
          const seriesSlug = `${series.seriesId}/${slug(series.seriesName)}`;

          matches.push({
            matchId: match.matchId,
            matchSlug,
            seriesId: series.seriesId,
            seriesSlug,
            seriesName: series.seriesName,
            matchDesc: match.matchDesc,
            format: match.matchFormat,
            status: "Upcoming",
            startTimestamp: Number(match.startDate),
            endTimestamp: Number(match.endDate),
            team1:{
              id:match.team1.teamId,
              name:match.team1.teamName,
              shortName:match.team1.teamSName,
              imageId:match.team1.imageId,
              imageUrl:imageUrl(match.team1.imageId)
            },
            team2:{
              id:match.team2.teamId,
              name:match.team2.teamName,
              shortName:match.team2.teamSName,
              imageId:match.team2.imageId,
              imageUrl:imageUrl(match.team2.imageId)
            },
            venue:match.venueInfo,
            matchUrl:`/match/${matchSlug}`,
            seriesUrl:`/series/${seriesSlug}`
          });
        }
      }

      days.push({
        date: wrapper.date,
        timestamp: Number(wrapper.longDate),
        totalMatches: matches.length,
        matches
      });
    }

    return res.status(200).json({
      success:true,
      generatedAt:new Date().toISOString(),
      totalDays:days.length,
      totalMatches:days.reduce((a,b)=>a+b.totalMatches,0),
      days
    });

  } catch(err:any){
    return res.status(500).json({
      success:false,
      error:err.message
    });
  }
}
