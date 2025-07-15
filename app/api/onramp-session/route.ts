import { NextResponse } from "next/server";
import { generateJwt } from "@coinbase/cdp-sdk/auth";

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

// POST: Generate a session token using the CDP SDK
export async function POST(request: Request) {
  try {
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

    // Generate JWT using the CDP SDK
    let jwtToken: string;
    try {
      jwtToken = await generateJwt({
        apiKeyId: CDP_API_KEY as string,
        apiKeySecret: CDP_API_SECRET as string,
        requestMethod: "POST",
        requestHost: "api.developer.coinbase.com",
        requestPath: "/onramp/v1/token",
        expiresIn: 120,
      });
    } catch (jwtError) {
      console.error("Error generating JWT:", jwtError);
      return NextResponse.json(
        {
          error: "Failed to generate JWT for CDP API authentication.",
          details:
            jwtError instanceof Error ? jwtError.message : "Unknown error",
        },
        { status: 500 },
      );
    }

    // Prepare request body for session token
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
    if (presetFiatAmount) {
      requestBody.presetFiatAmount = presetFiatAmount;
    }
    if (quoteId) {
      requestBody.quoteId = quoteId;
    }

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

    const responseText = await response.text();
    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            details:
              "Please verify your CDP API key and secret are correct. The API key should be in the format: organizations/{org_id}/apiKeys/{key_id}",
            apiError: errorDetails,
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        {
          error: `CDP API error: ${response.status} ${response.statusText}`,
          details: errorDetails,
        },
        { status: response.status },
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid response from CDP API",
          details: responseText,
        },
        { status: 500 },
      );
    }

    const sessionToken = data.token || data.data?.token;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token returned from Coinbase API" },
        { status: 500 },
      );
    }

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
  } catch (mainError) {
    console.error("Onramp session error:", mainError);
    return NextResponse.json(
      {
        error: "Failed to generate session token",
        details:
          mainError instanceof Error ? mainError.message : "Unknown error",
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
