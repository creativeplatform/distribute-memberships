export function getOnrampBuyUrl({
  address,
  defaultAsset = "USDC",
  defaultPaymentMethod = "CRYPTO_ACCOUNT",
  fiatCurrency = "USD",
  presetFiatAmount = 30,
  defaultNetwork = "base",
  quoteId,
  sessionToken,
}: {
  address: string;
  defaultAsset?: string;
  defaultPaymentMethod?: string;
  fiatCurrency?: string;
  presetFiatAmount?: number;
  defaultNetwork?: string;
  quoteId?: string;
  sessionToken?: string;
}) {
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

  if (!projectId) {
    throw new Error("NEXT_PUBLIC_CDP_PROJECT_ID is not set");
  }

  const baseUrl = "https://pay.coinbase.com/buy/select-asset";
  const params = new URLSearchParams();

  // Add session token if provided (preferred method)
  if (sessionToken) {
    params.append("sessionToken", sessionToken);
  } else {
    // Fallback to app-based parameters
    params.append("appId", projectId);
    params.append(
      "addresses",
      JSON.stringify([{ address, blockchains: [defaultNetwork] }]),
    );
  }

  // Add standard parameters
  params.append("defaultAsset", defaultAsset);
  params.append("defaultPaymentMethod", defaultPaymentMethod);
  params.append("fiatCurrency", fiatCurrency);
  params.append("presetFiatAmount", String(presetFiatAmount));
  params.append("defaultNetwork", defaultNetwork);

  // Add optional parameters
  if (quoteId) {
    params.append("quoteId", quoteId);
  }

  return `${baseUrl}?${params.toString()}`;
}

export function getOnrampConfig() {
  return {
    supportedAssets: ["USDC", "ETH", "USDT"],
    supportedNetworks: ["base", "ethereum"],
    supportedFiatCurrencies: ["USD", "EUR", "GBP", "CAD"],
    supportedPaymentMethods: [
      "CRYPTO_ACCOUNT",
      "DEBIT_CARD",
      "BANK_ACCOUNT",
      "WIRE_TRANSFER",
    ],
    defaultFiatAmounts: [30, 100, 1000],
    minFiatAmount: 10,
    maxFiatAmount: 10000,
  };
}

export function validateOnrampParams({
  address,
  defaultAsset,
  defaultNetwork,
  fiatCurrency,
  presetFiatAmount,
  defaultPaymentMethod,
}: {
  address: string;
  defaultAsset?: string;
  defaultNetwork?: string;
  fiatCurrency?: string;
  presetFiatAmount?: number;
  defaultPaymentMethod?: string;
}) {
  const config = getOnrampConfig();
  const errors: string[] = [];

  // Validate address
  if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push("Invalid wallet address format");
  }

  // Validate asset
  if (defaultAsset && !config.supportedAssets.includes(defaultAsset)) {
    errors.push(
      `Unsupported asset: ${defaultAsset}. Supported: ${config.supportedAssets.join(", ")}`,
    );
  }

  // Validate network
  if (defaultNetwork && !config.supportedNetworks.includes(defaultNetwork)) {
    errors.push(
      `Unsupported network: ${defaultNetwork}. Supported: ${config.supportedNetworks.join(", ")}`,
    );
  }

  // Validate fiat currency
  if (fiatCurrency && !config.supportedFiatCurrencies.includes(fiatCurrency)) {
    errors.push(
      `Unsupported fiat currency: ${fiatCurrency}. Supported: ${config.supportedFiatCurrencies.join(", ")}`,
    );
  }

  // Validate amount
  if (
    presetFiatAmount &&
    (presetFiatAmount < config.minFiatAmount ||
      presetFiatAmount > config.maxFiatAmount)
  ) {
    errors.push(
      `Fiat amount must be between ${config.minFiatAmount} and ${config.maxFiatAmount}`,
    );
  }

  // Validate payment method
  if (
    defaultPaymentMethod &&
    !config.supportedPaymentMethods.includes(defaultPaymentMethod)
  ) {
    errors.push(
      `Unsupported payment method: ${defaultPaymentMethod}. Supported: ${config.supportedPaymentMethods.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
