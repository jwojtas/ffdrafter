
import { XMLParser } from "fast-xml-parser";

export async function handler(event, context) {
  try {
    let accessToken = process.env.YAHOO_ACCESS_TOKEN;

    // If missing/expired → refresh
    if (!accessToken) {
      const refreshRes = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.YAHOO_CLIENT_ID + ":" + process.env.YAHOO_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: process.env.YAHOO_REFRESH_TOKEN,
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) {
        return { statusCode: refreshRes.status, body: JSON.stringify(refreshData) };
      }
      accessToken = refreshData.access_token;
    }

    // Fetch players
    const leagueKey = process.env.YAHOO_LEAGUE_KEY;
    const res = await fetch(
      `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/players`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: errText }) };
    }

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xml);

    const rawPlayers = json.fantasy_content?.league?.players?.player || [];
    const players = rawPlayers.map((p) => ({
      name: p.name?.full || `${p.name?.first} ${p.name?.last}`,
      pos: normalizePos(p.display_position),
      adp: Number(p.adp_average) || 999,
      drafted: false,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

function normalizePos(pos) {
  if (!pos) return "UNK";
  if (pos === "K" || pos === "PK") return "PK";
  if (pos === "DEF" || pos === "DST") return "DST";
  return pos.toUpperCase();
}
