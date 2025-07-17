import { sdk } from "@farcaster/frame-sdk";

/**
 * Initializes the Farcaster Frame and dismisses the splash screen
 * Call this when your interface is ready to be displayed
 */
export async function initializeFarcasterFrame(options?: {
  disableNativeGestures?: boolean;
}) {
  try {
    // Ensure the SDK is ready and context is available
    if (sdk.context) {
      // Wait for context to be fully loaded if it's a promise
      if (typeof sdk.context.then === "function") {
        await sdk.context;
      }
    }

    // Call ready to dismiss the splash screen and enable wallet provider
    await sdk.actions.ready(options);
    console.log("Farcaster frame is ready");

    // Additional check to ensure wallet provider is available
    if (typeof window !== "undefined" && window.ethereum) {
      console.log("Wallet provider is available");
    }

    return true;
  } catch (error) {
    console.error("Error initializing Farcaster frame:", error);
    return false;
  }
}

/**
 * Wrapper to handle frame initialization with proper timing
 * Optimized for instant wallet connection in Farcaster
 */
export async function handleSplashScreen(options?: {
  disableNativeGestures?: boolean;
  delay?: number;
}) {
  const { delay = 50, ...readyOptions } = options || {};

  // Shorter delay for faster initialization in Farcaster
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const result = await initializeFarcasterFrame(readyOptions);

  // Additional delay to ensure wallet provider is fully initialized
  if (result && typeof window !== "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return result;
}

/**
 * Check if we're running in a Farcaster context
 */
export function isFarcasterContext(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return !!(sdk.context || window.parent !== window);
  } catch {
    return false;
  }
}
