import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { PrivyProvider } from '@privy-io/react-auth';
import type { PrivyClientConfig } from '@privy-io/react-auth';
// Inline type definition for EmbeddedWalletCreateOnLoginConfig
// Allowed values: 'users-without-wallets' | 'all-users' | 'off'
type EmbeddedWalletCreateOnLoginConfig = 'users-without-wallets' | 'all-users' | 'off';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { mainnet } from 'viem/chains';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Use Vite environment variable for Privy App ID
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID; // Set this in .env as VITE_PRIVY_APP_ID=your-app-id
const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets' as EmbeddedWalletCreateOnLoginConfig,
    requireUserPasswordOnCreate: false,
    showWalletUIs: true,
  },
  loginMethods: ['wallet'],
  appearance: {
    showWalletLoginFirst: true,
    walletChainType: 'ethereum-and-solana',
  },
  externalWallets: {
    solana: {
      connectors: toSolanaWalletConnectors(),
    },
  },
};

const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  </StrictMode>
)
