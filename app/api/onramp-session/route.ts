import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// These should be set in your environment variables
const CDP_API_KEY = process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_KEY_PRIVATE_KEY;
const CDP_PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

if (!CDP_API_KEY || !CDP_API_SECRET) {
  throw new Error(
    "CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set in your environment variables.",
  );
}

if (!CDP_PROJECT_ID) {
  throw new Error(
    "NEXT_PUBLIC_CDP_PROJECT_ID must be set in your environment variables.",
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

  // Debug: Log payload structure (remove in production)
  console.log("JWT payload structure:", {
    iss: payload.iss?.substring(0, 10) + "...",
    sub: payload.sub?.substring(0, 10) + "...",
    aud: payload.aud,
    iat: payload.iat,
    exp: payload.exp,
  });

  return jwt.sign(payload, CDP_API_SECRET_SAFE, { algorithm: "HS256" });
}

export async function POST(request: Request) {
  try {
    // Parse the request body with enhanced parameter support
    const body = await request.json();
    const {
      address,
      assets = ["USDC"],
      blockchains = ["base"],
      fiatCurrency = "USD",
      defaultPaymentMethod = "CRYPTO_ACCOUNT",
      presetFiatAmount,
      quoteId,
    } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Missing required field: address" },
        { status: 400 },
      );
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 },
      );
    }

    // Validate supported assets
    const supportedAssets = ["USDC", "ETH", "USDT"];
    const invalidAssets = assets.filter(
      (asset: string) => !supportedAssets.includes(asset),
    );
    if (invalidAssets.length > 0) {
      return NextResponse.json(
        {
          error: `Unsupported assets: ${invalidAssets.join(", ")}. Supported: ${supportedAssets.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate supported blockchains
    const supportedBlockchains = ["base", "ethereum"];
    const invalidBlockchains = blockchains.filter(
      (chain: string) => !supportedBlockchains.includes(chain),
    );
    if (invalidBlockchains.length > 0) {
      return NextResponse.json(
        {
          error: `Unsupported blockchains: ${invalidBlockchains.join(", ")}. Supported: ${supportedBlockchains.join(", ")}`,
        },
        { status: 400 },
      );
    }

    console.log("Generating JWT token...");
    const jwtToken = generateJWT();
    console.log("JWT token generated successfully");

    // Enhanced request body for session token
    const requestBody: {
      addresses: Array<{ address: string; blockchains: string[] }>;
      assets: string[];
      fiatCurrency: string;
      defaultPaymentMethod: string;
      presetFiatAmount?: number;
      quoteId?: string;
    } = {
      addresses: [
        {
          address,
          blockchains,
        },
      ],
      assets,
      fiatCurrency,
      defaultPaymentMethod,
    };

    // Add optional parameters if provided
    if (presetFiatAmount) {
      requestBody.presetFiatAmount = presetFiatAmount;
    }
    if (quoteId) {
      requestBody.quoteId = quoteId;
    }

    console.log("Making request to Coinbase API...");
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Call Coinbase Onramp Session Token API
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    console.log("Coinbase API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Coinbase API error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Invalid API credentials",
            details:
              "Please check your CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY environment variables",
          },
          { status: 401 },
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: "API access forbidden. Check your API key permissions.",
            details: "Your API key may not have onramp permissions enabled",
          },
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
        {
          error: "Failed to generate session token. Please try again.",
          details: `API returned ${response.status}: ${response.statusText}`,
          body: errorText,
        },
        { status: 500 },
      );
    }

    const data = await response.json();
    console.log("Coinbase API response data:", data);

    const sessionToken = data?.data?.token;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token returned from Coinbase API" },
        { status: 500 },
      );
    }

    // Return enhanced response with configuration
    return NextResponse.json({
      sessionToken,
      config: {
        assets,
        blockchains,
        fiatCurrency,
        defaultPaymentMethod,
        presetFiatAmount,
        projectId: CDP_PROJECT_ID,
      },
    });
  } catch (error) {
    console.error("Onramp session error:", error);
    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Add a GET endpoint for configuration
export async function GET() {
  return NextResponse.json({
    supportedAssets: ["USDC", "ETH", "USDT"],
    supportedBlockchains: ["base", "ethereum"],
    supportedFiatCurrencies: ["USD", "EUR", "GBP"],
    supportedPaymentMethods: ["CRYPTO_ACCOUNT", "DEBIT_CARD", "BANK_ACCOUNT"],
    projectId: CDP_PROJECT_ID,
  });
}
