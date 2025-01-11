"use client";

import React from 'react';
import { useWallet } from '@/app/contexts/WalletContext';
import { useRouter } from 'next/navigation';

export default function Hero() {
    return (
        <section className="text-center mb-16 animate-fadeIn">
            <h1 className="hero-title">
                Rock Paper Scissors
                <span className="hero-subtitle">Lizard Spock</span>
            </h1>
            <p className="hero-description">
                Play the extended version of Rock Paper Scissors with Web3 integration. 
                Challenge players and win ETH on Sepolia testnet!
            </p>
            <PlayButton />
        </section>
    );
}

function PlayButton() {
    const [isHovered, setIsHovered] = React.useState(false);
    const { isConnected, isCorrectNetwork, connectWallet, switchNetwork } = useWallet();
    const router = useRouter();

    const handleClick = async () => {
        if (!isConnected) {
            await connectWallet();
        } else if (!isCorrectNetwork) {
            await switchNetwork();
        } else {
            router.push('/game');
        }
    };

    const getButtonText = () => {
        if (!isConnected) return 'Connect Wallet to Play';
        if (!isCorrectNetwork) return 'Switch to Sepolia Testnet';
        return 'Start Playing';
    };

    const getButtonClass = () => {
        const baseClass = 'hero-button';
        const hoverClass = isHovered ? 'hero-button-hover' : '';
        const networkClass = !isCorrectNetwork && isConnected ? 'bg-primary' : '';
        return `${baseClass} ${hoverClass} ${networkClass}`.trim();
    };

    return (
        <button 
            className={getButtonClass()}
            disabled={false}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {getButtonText()}
        </button>
    );
} 