import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// These should be set in your environment variables
const CDP_API_KEY = process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_KEY_PRIVATE_KEY; // Your secret API key for JWT signing

if (!CDP_API_KEY || !CDP_API_SECRET) {
  throw new Error(
    "CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set in your environment variables.",
  );
}
// At this point, both are non-null
const CDP_API_KEY_SAFE = CDP_API_KEY as string;
const CDP_API_SECRET_SAFE = CDP_API_SECRET as string;

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: CDP_API_KEY_SAFE,
    sub: CDP_API_KEY_SAFE,
    aud: "coinbase-cloud",
    iat: now,
    exp: now + 60 * 5, // 5 minutes
  };
  // Debug: log payload (remove before production)
  console.log("JWT payload:", payload);
  return jwt.sign(payload, CDP_API_SECRET_SAFE, { algorithm: "HS256" });
}

export async function POST(request: Request) {
  console.log("Request received");

  // Parse the request body
  let address: string | undefined;
  try {
    const body = await request.json();
    address = body.address;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Must be JSON with 'address' field." },
      { status: 400 },
    );
  }

  if (!address) {
    return NextResponse.json(
      { error: "Missing address. Only USDC on Base is supported." },
      { status: 400 },
    );
  }

  console.log("Parsed body:", { address });

  const jwtToken = generateJWT();

  console.log("JWT generated");

  // Debug: log environment variables (remove before production)
  console.log("CDP_API_KEY:", CDP_API_KEY_SAFE);
  console.log("CDP_API_SECRET length:", CDP_API_SECRET_SAFE.length);

  // Call Coinbase Onramp Session Token API for USDC on Base only
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
            blockchains: ["base"],
          },
        ],
        assets: ["USDC"],
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
      {
        error:
          "No session token returned from Coinbase. Check API credentials and request format.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ sessionToken });
}
