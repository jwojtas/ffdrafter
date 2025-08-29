
export async function handler(event, context) {
  const url = new URL(event.rawUrl);

  // If no code yet, redirect user to Yahoo login
  if (!url.searchParams.has("code")) {
    const authUrl =
      "https://api.login.yahoo.com/oauth2/request_auth?" +
      new URLSearchParams({
        client_id: process.env.YAHOO_CLIENT_ID,
        redirect_uri: process.env.YAHOO_REDIRECT_URI,
        response_type: "code",
        scope: "fspt-r", // Fantasy Sports read-only
      });

    return {
      statusCode: 302,
      headers: { Location: authUrl },
    };
  }

  // If Yahoo redirected back with code, exchange for token
  const code = url.searchParams.get("code");

  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
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
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.YAHOO_REDIRECT_URI,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      statusCode: res.status,
      body: JSON.stringify(data),
    };
  }

  // 🚨 Save these tokens manually into Netlify env vars
  // YAHOO_ACCESS_TOKEN
  // YAHOO_REFRESH_TOKEN
  // They expire, so you'll want to refresh later.
  console.log("Yahoo OAuth Tokens:", data);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message:
        "Success! Copy the tokens from logs and add them to Netlify env vars.",
      tokens: data,
    }),
  };
}
