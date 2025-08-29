export async function handler(event, context) {
  try {
    // Try to fetch "all players" with count param
    let url = "https://fantasyfootballcalculator.com/api/v1/adp/standard?position=all&teams=12&year=2025&count=400";
    let res = await fetch(url);

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Failed to fetch ADP" }),
      };
    }

    let data = await res.json();
    let players = Array.isArray(data.players) ? data.players : [];

    // 🚨 If no players or not enough, fallback to per-position fetch
    if (players.length === 0 || players.length < 400) {
      const positions = ["qb", "rb", "wr", "te", "k", "def"];
      const results = await Promise.all(
        positions.map(async (pos) => {
          const r = await fetch(
            `https://fantasyfootballcalculator.com/api/v1/adp/standard?position=${pos}&teams=12&year=2025&count=100`
          );
          if (!r.ok) return [];
          const d = await r.json();
          return Array.isArray(d.players) ? d.players : [];
        })
      );
      players = results.flat();

      // Deduplicate by player_name
      const seen = new Set();
      players = players.filter((p) => {
        const name = p.player_name || p.name;
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }

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
