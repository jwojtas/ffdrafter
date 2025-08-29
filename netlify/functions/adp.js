export async function handler(event, context) {
  try {
    // Correct positions as required by the API
    const positions = ["QB", "RB", "WR", "TE", "PK", "DEF"];

    const results = await Promise.all(
      positions.map(async (pos) => {
        const url = `https://fantasyfootballcalculator.com/api/v1/adp/standard?position=${pos}&teams=12&year=2025&count=400`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.players) ? data.players : [];
      })
    );

    let players = results.flat();

    // Deduplicate by player_name
    const seen = new Set();
    players = players.filter((p) => {
      const name = p.player_name || p.name;
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
