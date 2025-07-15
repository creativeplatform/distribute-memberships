"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Card } from "./DemoComponents";
import { FundButton } from "@coinbase/onchainkit/fund";
import { getOnrampBuyUrl } from "../utils/coinbaseOnramp";
// NOTE: To integrate Divvi referral, import getDataSuffix, submitReferral from '@divvi/referral-sdk' and useChainId from 'wagmi' when adding a custom transaction. See integration plan for details.

type FundProps = {
  setActiveTab: (tab: string) => void;
};

interface SessionTokenResponse {
  sessionToken: string;
  config: {
    assets: string[];
    blockchains: string[];
    fiatCurrency: string;
    defaultPaymentMethod: string;
    presetFiatAmount?: number;
    projectId: string;
  };
}

interface Quote {
  id: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  exchangeRate: number;
  fees: Array<{
    type: string;
    amount: number;
    currency: string;
  }>;
  total: number;
  expiresAt: string;
}

interface QuoteResponse {
  quote: Quote;
  params: {
    fiatCurrency: string;
    cryptoCurrency: string;
    blockchain: string;
    paymentMethod: string;
    country: string;
    fiatAmount?: number;
    cryptoAmount?: number;
  };
}

export function Fund({ setActiveTab }: FundProps) {
  const [sessionData, setSessionData] = useState<SessionTokenResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(30);
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const { address } = useAccount();

  const amounts = [30, 100, 1000];
  const assets = ["USDC", "ETH"];

  useEffect(() => {
    async function fetchSessionToken() {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/onramp-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            assets: [selectedAsset],
            blockchains: ["base"],
            fiatCurrency: "USD",
            defaultPaymentMethod: "CRYPTO_ACCOUNT",
            presetFiatAmount: selectedAmount,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch session token");
        }

        const data: SessionTokenResponse = await res.json();
        setSessionData(data);
      } catch (err) {
        console.error("Failed to fetch session token:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch session token",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSessionToken();
  }, [address, selectedAmount, selectedAsset]);

  const fetchQuote = async () => {
    if (!address) return;

    setQuoteLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onramp-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiatCurrency: "USD",
          cryptoCurrency: selectedAsset,
          fiatAmount: selectedAmount,
          blockchain: "base",
          paymentMethod: "CRYPTO_ACCOUNT",
          country: "US",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch quote");
      }

      const data: QuoteResponse = await res.json();
      setQuote(data.quote);
    } catch (err) {
      console.error("Failed to fetch quote:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch quote");
    } finally {
      setQuoteLoading(false);
    }
  };

  // Generate the enhanced Coinbase Onramp URL
  const onrampBuyUrl =
    address && sessionData?.sessionToken
      ? `https://pay.coinbase.com/buy/select-asset?sessionToken=${sessionData.sessionToken}&defaultNetwork=base&defaultAsset=${selectedAsset}&presetFiatAmount=${selectedAmount}&fiatCurrency=USD`
      : null;

  // Alternative URL using the utility (fallback)
  const fallbackUrl = address
    ? getOnrampBuyUrl({
        address,
        defaultAsset: selectedAsset,
        defaultNetwork: "base",
        presetFiatAmount: selectedAmount,
        fiatCurrency: "USD",
        quoteId: quote?.id,
        sessionToken: sessionData?.sessionToken,
      })
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Add Funds to Your Wallet">
        {/* Asset Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Asset</h3>
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <Button
                key={asset}
                variant={selectedAsset === asset ? "primary" : "outline"}
                onClick={() => setSelectedAsset(asset)}
                className="flex items-center justify-center space-x-2"
              >
                <span>{asset}</span>
                {asset === "USDC" && (
                  <span className="text-sm text-gray-500">on Base</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Amount (USD)</h3>
          <div className="grid grid-cols-3 gap-2">
            {amounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "primary" : "outline"}
                onClick={() => setSelectedAmount(amount)}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Quote Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Quote</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuote}
              disabled={quoteLoading || !address}
            >
              {quoteLoading ? "Loading..." : "Get Quote"}
            </Button>
          </div>

          {quote && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  ${quote.fiatAmount} {quote.fiatCurrency}
                </span>
                <span className="text-gray-500">→</span>
                <span className="font-medium">
                  {quote.cryptoAmount.toFixed(6)} {quote.cryptoCurrency}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Exchange Rate: 1 {quote.cryptoCurrency} = $
                {quote.exchangeRate.toFixed(2)}
              </div>
              {quote.fees.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  Fees:{" "}
                  {quote.fees
                    .map((fee) => `${fee.amount} ${fee.currency}`)
                    .join(", ")}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Total: ${quote.total} {quote.fiatCurrency}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Quote expires: {new Date(quote.expiresAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center text-[var(--app-foreground-muted)]">
            Loading funding options...
          </div>
        )}

        {/* Fund Button */}
        {!loading && sessionData && (
          <div className="space-y-4">
            <FundButton
              fundingUrl={onrampBuyUrl ?? fallbackUrl ?? undefined}
              openIn="tab"
              disabled={!address}
            />

            <Button
              variant="primary"
              onClick={() => {
                const url = onrampBuyUrl || fallbackUrl;
                if (url) {
                  window.open(url, "_blank", "width=420,height=720");
                }
              }}
              disabled={!address || loading}
              className="w-full"
            >
              Add ${selectedAmount} {selectedAsset} with Coinbase
            </Button>
          </div>
        )}

        {/* Configuration Info */}
        {sessionData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Configuration:</strong>{" "}
              {sessionData.config.assets.join(", ")} on{" "}
              {sessionData.config.blockchains.join(", ")}
            </p>
            <p className="text-sm text-blue-700">
              Payment Method: {sessionData.config.defaultPaymentMethod}
            </p>
          </div>
        )}

        <Button
          className="mt-4"
          variant="outline"
          onClick={() => setActiveTab("home")}
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
}
