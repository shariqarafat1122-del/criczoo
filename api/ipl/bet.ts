export default async function handler(req: any, res: any) {
  try {

    const response = await fetch(
      "https://betadda.vercel.app/api/poker/create"),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
      }
    );

    const text = await response.text();

  return res.status(200).send(text);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
