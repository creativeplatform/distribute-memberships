"use client";
import { Button, Card } from "./DemoComponents";
import { FundCard } from "@coinbase/onchainkit/fund";
// NOTE: To integrate Divvi referral, import getDataSuffix, submitReferral from '@divvi/referral-sdk' and useChainId from 'wagmi' when adding a custom transaction. See integration plan for details.

type FundProps = {
  setActiveTab: (tab: string) => void;
};

export function Fund({ setActiveTab }: FundProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Add Funds to Your Wallet">
        <FundCard
          assetSymbol="USDC"
          country="US"
          currency="USD"
          presetAmountInputs={["30", "100", "1000"]}
        />
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
