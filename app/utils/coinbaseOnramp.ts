export function getOnrampBuyUrl({
  address,
  defaultAsset = "USDC",
  defaultPaymentMethod = "CRYPTO_ACCOUNT",
  fiatCurrency = "USD",
  presetFiatAmount = 30,
  defaultNetwork = "base",
  quoteId,
}: {
  address: string;
  defaultAsset?: string;
  defaultPaymentMethod?: string;
  fiatCurrency?: string;
  presetFiatAmount?: number;
  defaultNetwork?: string;
  quoteId?: string;
}) {
  const appId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
  if (!appId) throw new Error("Coinbase Onramp appId is not set");
  const params = new URLSearchParams({
    appId,
    addresses: JSON.stringify([{ address, blockchains: [defaultNetwork] }]),
    defaultAsset,
    defaultPaymentMethod,
    fiatCurrency,
    presetFiatAmount: String(presetFiatAmount),
    defaultNetwork,
  });
  if (quoteId) params.append("quoteId", quoteId);
  return `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
}
