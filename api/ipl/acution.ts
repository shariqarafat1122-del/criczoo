export default async function handler(req: any, res: any) {
  const response = await fetch("https://www.cricbuzz.com/api/ipl-auction/completed/0/INR/0/ALL/ALL/0/ALL/apl.updated_at/DESC/ipl/2026", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  const data = await response.json();

  res.status(200).json(data);
}
