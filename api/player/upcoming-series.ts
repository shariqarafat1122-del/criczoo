export default async function handler(req: any, res: any) {
  const response = await fetch("https://www.cricbuzz.com/api/cricket-schedule/upcoming-series/international/1783441800000", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  const data = await response.json();

  res.status(200).json(data);
}
