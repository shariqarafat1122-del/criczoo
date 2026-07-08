export default async function handler(req: any, res: any) {
  const response = await fetch("https://betadda.vercel.app/api/poker/create", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  const data = await response.json();

  res.status(200).json(data);
}
