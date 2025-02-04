import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styles from './WalletButton.module.css';

const WalletButton: React.FC = () => {
    const { publicKey } = useWallet();

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
                {publicKey ? 'Wallet Connected' : 'Connect Your Wallet'}
            </h2>
            <p className="mb-6 text-gray-300">
                {publicKey 
                    ? 'You can now start minting NFTs'
                    : 'To start minting NFTs, please connect your Solana wallet'
                }
            </p>
            <WalletMultiButton className="custom-wallet-btn" />
        </div>
    );
};

export default WalletButton;