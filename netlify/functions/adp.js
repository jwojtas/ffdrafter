export async function handler(event, context) {
  try {
    const res = await fetch(
      "https://fantasyfootballcalculator.com/api/v1/adp/standard?position=all&teams=12&year=2025"
    );
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Failed to fetch ADP" }),
      };
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
