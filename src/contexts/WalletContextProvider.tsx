// components/WalletProvider.tsx
import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolanaMobileWalletAdapter, createDefaultAddressSelector } from '@solana-mobile/wallet-adapter-mobile';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => {
    // Use your Helius RPC endpoint if available
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => {
      const mobileWalletAdapter = new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: 'NFTRek',
          uri: 'https://nftrek.vercel.app',
          icon: '/icon-192x192.svg',
        },
        authorizationResultCache: {
          clear: () => Promise.resolve(),
          get: () => Promise.resolve(undefined),
          set: () => Promise.resolve(),
        },
        cluster: 'mainnet-beta',
        onWalletNotFound: () => {
          window.open('https://www.solanamobile.com/wallet-finder', '_blank');
          return Promise.reject(new Error('No mobile wallet found'));
        },
      });

      return [
        // Mobile Wallet Adapter (for mobile apps)
        mobileWalletAdapter,
        // Desktop/Web wallets
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new TorusWalletAdapter(),
        new LedgerWalletAdapter(),
      ];
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};