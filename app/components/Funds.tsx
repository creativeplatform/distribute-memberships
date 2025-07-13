"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button, Card } from "./DemoComponents";
import { FundCard } from "@coinbase/onchainkit/fund";
// NOTE: To integrate Divvi referral, import getDataSuffix, submitReferral from '@divvi/referral-sdk' and useChainId from 'wagmi' when adding a custom transaction. See integration plan for details.

type FundProps = {
  setActiveTab: (tab: string) => void;
};

export function Fund({ setActiveTab }: FundProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  useEffect(() => {
    async function fetchSessionToken() {
      setLoading(true);
      try {
        const res = await fetch("/api/onramp-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            assets: ["USDC"],
          }),
        });
        const data = await res.json();
        setSessionToken(data.sessionToken);
      } catch {
        setSessionToken(null);
      }
      setLoading(false);
    }
    if (address) fetchSessionToken();
  }, [address]);

  // Generate the Coinbase Onramp URL using the sessionToken
  const onrampUrl = sessionToken
    ? `https://pay.coinbase.com/buy/select-asset?sessionToken=${sessionToken}&defaultNetwork=base&defaultAsset=USDC`
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Add Funds to Your Wallet">
        <FundCard
          assetSymbol="USDC"
          country="US"
          currency="USD"
          presetAmountInputs={["30", "100", "1000"]}
        />
        {loading ? (
          <div className="py-8 text-center text-[var(--app-foreground-muted)]">
            Loading funding widget...
          </div>
        ) : onrampUrl ? (
          <Button
            className="mt-4"
            variant="primary"
            onClick={() => {
              window.open(onrampUrl, "_blank", "width=420,height=720");
            }}
          >
            Add Funds with Coinbase
          </Button>
        ) : null}
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
