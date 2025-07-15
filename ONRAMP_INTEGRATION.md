# Enhanced Coinbase Onramp Integration

This document outlines the comprehensive Coinbase Onramp integration with session tokens, quotes, transaction status tracking, and enhanced error handling.

## Overview

The integration provides a seamless way for users to purchase crypto directly within your app using Coinbase's onramp service. It includes:

- **Session Token Management**: Secure session creation for onramp flows
- **Quote Generation**: Get real-time pricing before purchase
- **Transaction Status Tracking**: Monitor transaction progress
- **Enhanced Error Handling**: Comprehensive error states and user feedback
- **Flexible Configuration**: Support for multiple assets, networks, and payment methods

## API Endpoints

### 1. Session Token API (`/api/onramp-session`)

Creates secure session tokens for onramp transactions.

**POST Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "assets": ["USDC", "ETH"],
  "blockchains": ["base"],
  "fiatCurrency": "USD",
  "defaultPaymentMethod": "CRYPTO_ACCOUNT",
  "presetFiatAmount": 50
}
```

**Response:**

```json
{
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "config": {
    "assets": ["USDC"],
    "blockchains": ["base"],
    "fiatCurrency": "USD",
    "defaultPaymentMethod": "CRYPTO_ACCOUNT",
    "presetFiatAmount": 50,
    "projectId": "your-project-id"
  }
}
```

**GET Request:**
Returns supported configuration options.

### 2. Quote API (`/api/onramp-quote`)

Generates quotes for onramp purchases.

**POST Request:**

```json
{
  "fiatCurrency": "USD",
  "cryptoCurrency": "USDC",
  "fiatAmount": 100,
  "blockchain": "base",
  "paymentMethod": "CRYPTO_ACCOUNT",
  "country": "US"
}
```

**Response:**

```json
{
  "quote": {
    "id": "quote-id-123",
    "fiatAmount": 100,
    "fiatCurrency": "USD",
    "cryptoAmount": 99.5,
    "cryptoCurrency": "USDC",
    "exchangeRate": 0.995,
    "fees": [
      {
        "type": "network",
        "amount": 0.5,
        "currency": "USD"
      }
    ],
    "total": 100,
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Transaction Status API (`/api/onramp-status`)

Tracks transaction status and progress.

**GET Request:**

- `?transactionId=tx-123` - Get specific transaction
- `?partnerUserId=user-123` - Get user's transactions

**Response:**

```json
{
  "transactions": [
    {
      "id": "tx-123",
      "status": "completed",
      "statusDescription": "Transaction completed successfully",
      "cryptoAmount": 99.5,
      "cryptoCurrency": "USDC",
      "fiatAmount": 100,
      "fiatCurrency": "USD",
      "blockchain": "base",
      "txHash": "0xabcdef...",
      "createdAt": "2024-01-01T10:00:00Z",
      "completedAt": "2024-01-01T10:05:00Z"
    }
  ],
  "count": 1
}
```

## Component Usage

### Basic Implementation

```tsx
import { Fund } from "./components/Funds";

function MyApp() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div>{activeTab === "fund" && <Fund setActiveTab={setActiveTab} />}</div>
  );
}
```

### Enhanced URL Generation

```tsx
import { getOnrampBuyUrl } from "./utils/coinbaseOnramp";

const url = getOnrampBuyUrl({
  address: userAddress,
  defaultAsset: "USDC",
  defaultNetwork: "base",
  presetFiatAmount: 100,
  fiatCurrency: "USD",
  sessionToken: sessionToken, // Optional: preferred method
  quoteId: quoteId, // Optional: for one-click-buy
});
```

## Configuration

### Environment Variables

```env
# Required for API access
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key

# Required for project identification
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id
```

### Supported Options

```typescript
const config = {
  supportedAssets: ["USDC", "ETH", "USDT"],
  supportedNetworks: ["base", "ethereum"],
  supportedFiatCurrencies: ["USD", "EUR", "GBP", "CAD"],
  supportedPaymentMethods: [
    "CRYPTO_ACCOUNT",
    "DEBIT_CARD",
    "BANK_ACCOUNT",
    "WIRE_TRANSFER",
  ],
  defaultFiatAmounts: [30, 50, 100, 200, 500, 1000],
  minFiatAmount: 10,
  maxFiatAmount: 10000,
};
```

## Error Handling

The integration includes comprehensive error handling:

### API Errors

- **401**: Invalid API credentials
- **403**: API access forbidden
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Internal server error

### User-Facing Errors

- Invalid wallet address format
- Unsupported asset/network combinations
- Amount outside supported range
- Session token expiration
- Quote expiration

## Transaction Status Flow

1. **pending**: Transaction initiated
2. **pending_id_verification**: Awaiting identity verification
3. **pending_payment**: Awaiting payment confirmation
4. **processing**: Transaction being processed
5. **completed**: Transaction successful
6. **failed**: Transaction failed
7. **cancelled**: Transaction cancelled
8. **expired**: Transaction expired

## Best Practices

### 1. Session Token Management

- Generate session tokens server-side
- Use JWT with proper expiration (5 minutes)
- Refresh tokens as needed

### 2. Quote Management

- Get quotes before purchase for better UX
- Handle quote expiration gracefully
- Show real-time pricing and fees

### 3. Transaction Monitoring

- Poll transaction status periodically
- Implement webhook notifications for real-time updates
- Provide clear status updates to users

### 4. Error Handling

- Provide user-friendly error messages
- Implement retry logic for transient errors
- Log errors for debugging

### 5. Security

- Validate all user inputs
- Use HTTPS for all API calls
- Implement rate limiting
- Verify webhook signatures

## Integration Checklist

- [ ] Environment variables configured
- [ ] Session token API implemented
- [ ] Quote API integrated
- [ ] Transaction status tracking enabled
- [ ] Error handling implemented
- [ ] User interface updated
- [ ] Testing completed
- [ ] Documentation updated

## Testing

### Manual Testing

1. Test session token generation
2. Verify quote generation
3. Complete test transaction
4. Monitor transaction status
5. Test error scenarios

### Automated Testing

- Unit tests for API endpoints
- Integration tests for onramp flow
- Error handling tests
- Performance tests

## Troubleshooting

### Common Issues

1. **Session token not generating**: Check API credentials
2. **Quote not loading**: Verify supported asset/network combination
3. **Transaction not completing**: Check user's payment method
4. **Status not updating**: Verify transaction ID format

### Debug Information

- Enable detailed logging in development
- Check browser network tab for API errors
- Verify environment variables are set
- Test with different asset/network combinations

## Support

For additional support:

- Check Coinbase Developer Documentation
- Review API response logs
- Test with different user scenarios
- Contact Coinbase Developer Support if needed
