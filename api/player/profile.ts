// api/cricbuzz-profile.js
export default async function handler(req, res) {
  const { profileId } = req.query;

  if (!profileId) {
    return res.status(400).json({ success: false, error: "profileId is required" });
  }

  try {
    const response = await fetch(`https://www.cricbuzz.com/profiles/${profileId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream returned ${response.status}`,
      });
    }

    const html = await response.text();

    // Try to locate the embedded Next.js data blob (__next_f.push chunks)
    // and extract profile-specific fields via regex, since Cricbuzz ships
    // data as streamed RSC payload, not a clean JSON API.
    const nameMatch = html.match(/"name":"([^"]+)"[^}]*"role":"([^"]*)"/);
    const bornMatch = html.match(/"born":"([^"]*)"/);
    const birthPlaceMatch = html.match(/"birthPlace":"([^"]*)"/);
    const battingStyleMatch = html.match(/"battingStyle":"([^"]*)"/);
    const bowlingStyleMatch = html.match(/"bowlingStyle":"([^"]*)"/);
    const teamsMatch = html.match(/"teams":"([^"]*)"/);

    // Detect "not found" state
    const notFound = html.includes("Nothing to show") || html.includes('"asNotFound":true');

    if (notFound || !bornMatch) {
      return res.status(404).json({
        success: false,
        profileId,
        error: "Player profile not found or data unavailable for this ID",
      });
    }

    const cleanData = {
      success: true,
      profileId,
      born: bornMatch?.[1]?.trim() || null,
      birthPlace: birthPlaceMatch?.[1]?.trim() || null,
      role: nameMatch?.[2]?.trim() || null,
      battingStyle: battingStyleMatch?.[1]?.trim() || null,
      bowlingStyle: bowlingStyleMatch?.[1]?.trim() || null,
      teams: teamsMatch?.[1]
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [],
    };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(cleanData);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch or parse profile",
      details: err.message,
    });
  }
}
