"use client";

import { type ReactNode, useState } from "react";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { type State, WagmiProvider } from "wagmi";
import { getConfig } from "@/wagmi";
import { OnchainKitProvider } from "@coinbase/onchainkit";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
          notificationProxyUrl="/api/notification"
        >
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY as string}
            chain={base}
            projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
          >
            {props.children}
          </OnchainKitProvider>
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
