import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// These should be set in your environment variables
const CDP_API_KEY = process.env.COINBASE_CDP_API_KEY!;
const CDP_API_SECRET = process.env.COINBASE_CDP_API_SECRET!; // Your private key for JWT signing

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: CDP_API_KEY,
    sub: CDP_API_KEY,
    aud: "coinbase-cloud",
    iat: now,
    exp: now + 60 * 5, // 5 minutes
  };
  return jwt.sign(payload, CDP_API_SECRET, { algorithm: "HS256" });
}

export async function POST(request: Request) {
  console.log("Request received");

  // Parse the request body
  let address: string | undefined;
  let assets: string[] | undefined;
  try {
    const body = await request.json();
    address = body.address;
    assets = body.assets;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  console.log("Parsed body:", { address, assets });

  if (!address || !Array.isArray(assets) || assets.length === 0) {
    return NextResponse.json(
      { error: "Missing address or assets" },
      { status: 400 },
    );
  }

  const jwtToken = generateJWT();

  console.log("JWT generated");

  // Call Coinbase Onramp Session Token API
  const response = await fetch(
    "https://api.developer.coinbase.com/onramp/v1/token",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addresses: [
          {
            address,
            blockchains: ["base"], // or ["ethereum", "base"] as needed
          },
        ],
        assets,
      }),
    },
  );

  console.log("Coinbase API response status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  const data = await response.json();

  console.log("Coinbase API response data:", data);

  const sessionToken = data?.data?.token;

  if (!sessionToken) {
    return NextResponse.json(
      { error: "No session token returned" },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessionToken });
}
