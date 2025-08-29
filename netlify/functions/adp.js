export async function handler(event, context) {
  try {
    // Try fetching top 400 directly
    let url = "https://fantasyfootballcalculator.com/api/v1/adp/standard?position=all&teams=12&year=2025&count=400";
    let res = await fetch(url);

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Failed to fetch ADP" }),
      };
    }

    let data = await res.json();
    let players = data.players || [];

    // If API still returns < 400, fetch each position separately and merge
    if (players.length < 400) {
      const positions = ["qb", "rb", "wr", "te", "k", "def"];
      const results = await Promise.all(
        positions.map(async (pos) => {
          const r = await fetch(`https://fantasyfootballcalculator.com/api/v1/adp/standard?position=${pos}&teams=12&year=2025&count=100`);
          if (!r.ok) return [];
          const d = await r.json();
          return d.players || [];
        })
      );
      players = results.flat();

      // Deduplicate by name
      const seen = new Set();
      players = players.filter((p) => {
        const name = p.player_name || p.name;
        if (seen.has(name)) return false;
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
