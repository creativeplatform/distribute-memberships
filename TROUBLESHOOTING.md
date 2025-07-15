# Onramp Integration Troubleshooting Guide

## Error: "Invalid API credentials"

This error occurs when the Coinbase CDP API cannot authenticate your request. Follow these steps to resolve it:

### 1. Check Your Environment Variables

First, check your environment variables directly in your `.env.local` file to see which are missing or incorrectly configured.

Required environment variables:

```bash
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id
```

### 2. Create Coinbase Developer Platform API Keys

If you haven't created API keys yet:

1. **Go to Coinbase Developer Platform**
   - Visit: https://portal.cdp.coinbase.com/
   - Sign in with your Coinbase account

2. **Create a New Project**
   - Click "Create Project"
   - Choose "Web3 App" or "API Key"
   - Give your project a name

3. **Generate API Keys**
   - In your project dashboard, go to "API Keys"
   - Click "Create API Key"
   - Give it a name (e.g., "Onramp Integration")
   - **Important**: Enable "Onramp" permissions
   - Download the JSON file with your credentials

### 3. Configure Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# From your downloaded API key file
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-api-key-id
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIBcQ7QYBSKBjDFbLLVeRxDKQvLaELjvLYeZuBTWZoLRDoAoGCCqGSM49
AwEHoUQDQgAEMwLJhKCCwT+cCXNYqwNnS8/cH9EpHLjjcuXDEFmWJKAPfQvUYfPz
6NvZmVBwOVhkIyEWGSj9+Q6U4TzgNNHfDw==
-----END EC PRIVATE KEY-----"

# Your project ID (might be different from ONCHAINKIT_PROJECT_ID)
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id

# Your existing OnchainKit project ID (if different)
NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID=your-onchainkit-project-id
```

### 4. Important Notes

**Private Key Format:**

- Must be in PEM format
- Should start with `-----BEGIN EC PRIVATE KEY-----`
- Should end with `-----END EC PRIVATE KEY-----`
- Include all line breaks as shown above
- Use quotes to preserve formatting

**API Key Name Format:**

- Usually looks like: `organizations/org-id/apiKeys/key-id`
- Should be the full resource path, not just the key ID

**Project ID:**

- This might be different from your OnchainKit project ID
- Check your CDP dashboard for the correct project ID

### 5. Restart Your Development Server

After updating environment variables:

```bash
# Stop your server (Ctrl+C)
npm run dev
# Or yarn dev, pnpm dev, etc.
```

### 6. Test Your Configuration

1. **Check your environment variables**: Ensure all required variables are set in `.env.local`.
2. **Review error messages**: The onramp API endpoints will return detailed error messages if configuration is incorrect.

3. **Test the session API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/onramp-session \
     -H "Content-Type: application/json" \
     -d '{"address":"0x742d35Cc6634C0532925a3b8D000B4E49f58c234"}'
   ```

### 7. Common Issues and Solutions

**Issue: "CDP_API_KEY_PRIVATE_KEY format may be incorrect"**

- Solution: Ensure the private key is in PEM format with proper line breaks
- Check that quotes are around the entire key including headers

**Issue: "API access forbidden"**

- Solution: Your API key doesn't have onramp permissions
- Go back to CDP dashboard and enable onramp permissions for your API key

**Issue: Environment variables not loading**

- Solution: Check that your `.env.local` file is in the project root
- Restart your development server
- Ensure there are no spaces around the `=` sign

**Issue: "NEXT_PUBLIC_CDP_PROJECT_ID is required"**

- Solution: Add the project ID to your environment variables
- This might be different from your OnchainKit project ID

### 8. Test With a Simple Request

Once configured, test with this minimal request:

```javascript
fetch("/api/onramp-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "0x742d35Cc6634C0532925a3b8D000B4E49f58c234",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Success:", data))
  .catch((err) => console.error("Error:", err));
```

### 9. Still Having Issues?

If you're still encountering problems:

1. **Check the Coinbase Developer Documentation:**
   - https://docs.cdp.coinbase.com/onramp-&-offramp/onramp-apis/

2. **Verify API Key Permissions:**
   - Go to your CDP dashboard
   - Check that your API key has "Onramp" permissions enabled
   - Make sure the API key is not restricted to specific IP addresses

3. **Check Rate Limits:**
   - You might be hitting rate limits
   - Wait a few minutes and try again

4. **Review Server Logs:**
   - Check your terminal for detailed error messages
   - Look for JWT generation errors or network issues

### 10. Environment Variables Checklist

- [ ] `.env.local` file exists in project root
- [ ] `CDP_API_KEY_NAME` is set with full resource path
- [ ] `CDP_API_KEY_PRIVATE_KEY` is set with proper PEM format
- [ ] `NEXT_PUBLIC_CDP_PROJECT_ID` is set
- [ ] Development server has been restarted
- [ ] API key has onramp permissions enabled
- [ ] No syntax errors in `.env.local` file

### 11. Next Steps

Once your credentials are working:

1. The `/api/debug-credentials` endpoint should show all green checkmarks
2. The onramp session API should return a session token
3. You can proceed to test the full onramp flow

### 12. Security Notes

- Never commit your `.env.local` file to version control
- Keep your private keys secure
- Rotate your API keys regularly
- Use different API keys for development and production
