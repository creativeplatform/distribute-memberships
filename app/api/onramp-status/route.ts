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

interface Transaction {
  id: string;
  status: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatAmount: number;
  fiatCurrency: string;
  fees: Array<{
    type: string;
    amount: number;
    currency: string;
  }>;
  exchangeRate: number;
  blockchain: string;
  cryptoAddress: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get("transactionId");
    const partnerUserId = url.searchParams.get("partnerUserId");

    if (!transactionId && !partnerUserId) {
      return NextResponse.json(
        { error: "Either transactionId or partnerUserId must be provided" },
        { status: 400 },
      );
    }

    const jwtToken = generateJWT();

    let apiUrl = "https://api.developer.coinbase.com/onramp/v1/transactions";
    const params = new URLSearchParams();

    if (transactionId) {
      params.append("transactionId", transactionId);
    }
    if (partnerUserId) {
      params.append("partnerUserId", partnerUserId);
    }

    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Coinbase Transaction Status API error:", {
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
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 },
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch transaction status. Please try again." },
        { status: 500 },
      );
    }

    const data = await response.json();
    const transactions = data?.data;

    if (!transactions) {
      return NextResponse.json(
        { error: "No transaction data returned from Coinbase API" },
        { status: 500 },
      );
    }

    // Transform the response to include helpful status information
    const transformedTransactions = Array.isArray(transactions)
      ? transactions.map(transformTransaction)
      : [transformTransaction(transactions)];

    return NextResponse.json({
      transactions: transformedTransactions,
      count: transformedTransactions.length,
    });
  } catch (error) {
    console.error("Transaction status error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

function transformTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    status: transaction.status,
    statusDescription: getStatusDescription(transaction.status),
    cryptoAmount: transaction.cryptoAmount,
    cryptoCurrency: transaction.cryptoCurrency,
    fiatAmount: transaction.fiatAmount,
    fiatCurrency: transaction.fiatCurrency,
    fees: transaction.fees,
    exchangeRate: transaction.exchangeRate,
    blockchain: transaction.blockchain,
    cryptoAddress: transaction.cryptoAddress,
    txHash: transaction.txHash,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    completedAt: transaction.completedAt,
    failureReason: transaction.failureReason,
  };
}

function getStatusDescription(status: string): string {
  const statusDescriptions: Record<string, string> = {
    pending: "Transaction is being processed",
    pending_id_verification: "Waiting for identity verification",
    pending_payment: "Waiting for payment confirmation",
    processing: "Processing transaction",
    completed: "Transaction completed successfully",
    failed: "Transaction failed",
    cancelled: "Transaction was cancelled",
    expired: "Transaction expired",
  };

  return statusDescriptions[status] || "Unknown status";
}

// POST endpoint for webhook notifications (optional)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify the webhook signature here if needed
    // This would typically involve checking a signature header

    console.log("Received webhook notification:", body);

    // Process the webhook notification
    // You could update your database, send notifications, etc.

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
