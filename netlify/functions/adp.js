export async function handler(event, context) {
  try {
    // Fetch all NFL players from Sleeper
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Failed to fetch Sleeper players" }),
      };
    }

    const data = await res.json();

    // Map Sleeper data into your draft pool format
    const mapped = Object.values(data)
      .map((p) => ({
        name: p.full_name || p.first_name + " " + p.last_name,
        pos: normalizePos(p.position), // We'll normalize to QB/RB/WR/TE/DST/PK
        adp: p.fantasy_positions && p.fantasy_positions.length > 0 ? p.rank_ecr : 999,
        drafted: false,
      }))
      .filter(
        (p) => ["QB", "RB", "WR", "TE", "DST", "PK"].includes(p.pos)
      );

    // Deduplicate by name (Sleeper sometimes has multiple entries)
    const seen = new Set();
    const players = mapped.filter((p) => {
      if (!p.name || seen.has(p.name)) return false;
      seen.add(p.name);
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

// helper to standardize positions
function normalizePos(pos) {
  if (!pos) return "UNK";
  if (pos === "PK" || pos === "K") return "PK";
  if (pos === "DEF" || pos === "DST") return "DST";
  return pos.toUpperCase();
}
