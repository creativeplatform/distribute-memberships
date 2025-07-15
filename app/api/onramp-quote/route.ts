import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const CDP_API_KEY = process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_KEY_PRIVATE_KEY;

if (!CDP_API_KEY || !CDP_API_SECRET) {
  throw new Error(
    "CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set in your environment variables.",
  );
}

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
  return jwt.sign(payload, CDP_API_SECRET_SAFE, { algorithm: "HS256" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fiatCurrency = "USD",
      cryptoCurrency = "USDC",
      fiatAmount,
      cryptoAmount,
      blockchain = "base",
      paymentMethod = "CRYPTO_ACCOUNT",
      country = "US",
    } = body;

    if (!fiatAmount && !cryptoAmount) {
      return NextResponse.json(
        { error: "Either fiatAmount or cryptoAmount must be provided" },
        { status: 400 },
      );
    }

    const jwtToken = generateJWT();

    // Build request body for quote
    const requestBody: {
      fiatCurrency: string;
      cryptoCurrency: string;
      blockchain: string;
      paymentMethod: string;
      country: string;
      fiatAmount?: number;
      cryptoAmount?: number;
    } = {
      fiatCurrency,
      cryptoCurrency,
      blockchain,
      paymentMethod,
      country,
    };

    if (fiatAmount) {
      requestBody.fiatAmount = fiatAmount;
    }
    if (cryptoAmount) {
      requestBody.cryptoAmount = cryptoAmount;
    }

    // Call Coinbase Onramp Quote API
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/quote",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Coinbase Quote API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API credentials" },
          { status: 401 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: "API access forbidden. Check your API key permissions." },
          { status: 403 },
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to generate quote. Please try again." },
        { status: 500 },
      );
    }

    const data = await response.json();
    const quote = data?.data;

    if (!quote) {
      return NextResponse.json(
        { error: "No quote returned from Coinbase API" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      quote,
      params: {
        fiatCurrency,
        cryptoCurrency,
        blockchain,
        paymentMethod,
        country,
        fiatAmount,
        cryptoAmount,
      },
    });
  } catch (error) {
    console.error("Onramp quote error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
