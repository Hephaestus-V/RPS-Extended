"use client";

import React from 'react';
import Link from "next/link";
import { useWallet } from '@/app/contexts/WalletContext';
import { ConnectWalletButtonProps } from '@/app/types/components';

export default function NavBar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { isConnected, connectWallet, address, isCorrectNetwork, switchNetwork } = useWallet();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`nav-fixed ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="nav-container">
                <Link href="/" className="nav-link">
                    RPS-Extended
                </Link>
                <ConnectWalletButton 
                    isConnected={isConnected}
                    isCorrectNetwork={isCorrectNetwork}
                    onConnect={connectWallet}
                    onSwitchNetwork={switchNetwork}
                    address={address}
                />
            </div>
        </nav>
    );
}

function ConnectWalletButton({ 
    isConnected, 
    isCorrectNetwork, 
    onConnect, 
    onSwitchNetwork,
    address 
}: ConnectWalletButtonProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    const handleClick = () => {
        if (!isConnected) {
            onConnect();
        } else if (!isCorrectNetwork) {
            onSwitchNetwork();
        }
    };

    const getButtonText = () => {
        if (!isConnected) return 'Connect Wallet';
        if (!isCorrectNetwork) return 'Switch to Sepolia';
        return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
    };

    return (
        <button 
            className={`nav-button ${isHovered ? 'nav-button-hover' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {getButtonText()}
        </button>
    );
} 