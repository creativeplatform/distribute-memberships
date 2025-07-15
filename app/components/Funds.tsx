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

export function Fund({ setActiveTab }: FundProps) {
  const [sessionData, setSessionData] = useState<SessionTokenResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        sessionToken: sessionData?.sessionToken,
      })
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Add Funds to Your Wallet">
        {/* Asset Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Select Asset{" "}
            <span className="text-[var(--app-accent)] text-sm">on Base</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <Button
                key={asset}
                variant={selectedAsset === asset ? "primary" : "outline"}
                onClick={() => setSelectedAsset(asset)}
                className="flex items-center justify-center space-x-2"
              >
                <span>{asset}</span>
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
              className="w-full"
              fundingUrl={onrampBuyUrl ?? fallbackUrl ?? undefined}
              openIn="tab"
              disabled={!address}
            />
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
