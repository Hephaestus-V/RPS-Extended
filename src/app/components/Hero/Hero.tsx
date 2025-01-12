"use client";

import React, { useState } from 'react';
import { useWallet } from '@/app/contexts/WalletContext';
import { usePeer } from '@/app/contexts/PeerContext';
import { GameMode } from '@/app/types/game';
import GameSetup from '../GameSetup/GameSetup';

export default function Hero() {
    const [showJoinGame, setShowJoinGame] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>(null);
    const { initializePeer } = usePeer();

    const handleGameModeSelect = async (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'CREATE') {
            const peerId = await initializePeer(true);
            console.log('New game created with Peer ID:', peerId);
            // Render the new game UI here
        } else if (mode === 'JOIN') {
            setShowJoinGame(true);
        }
    };

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
            <PlayButton onGameModeSelect={handleGameModeSelect} />
            {showJoinGame && (
                <GameSetup 
                    mode="JOIN"
                    onClose={() => {
                        setShowJoinGame(false);
                        setGameMode(null);
                    }}
                />
            )}
        </section>
    );
}

interface PlayButtonProps {
    onGameModeSelect: (mode: GameMode) => void;
}

function PlayButton({ onGameModeSelect }: PlayButtonProps) {
    const [isHovered, setIsHovered] = React.useState(false);
    const [showOptions, setShowOptions] = React.useState(false);
    const { isConnected, isCorrectNetwork, connectWallet, switchNetwork } = useWallet();
    const optionsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        }

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const handleClick = async () => {
        if (!isConnected) {
            await connectWallet();
        } else if (!isCorrectNetwork) {
            await switchNetwork();
        } else {
            setShowOptions(true);
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
        <div className="relative inline-block" ref={optionsRef}>
            <button 
                className={getButtonClass()}
                disabled={false}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
            >
                {getButtonText()}
            </button>

            {showOptions && isConnected && isCorrectNetwork && (
                <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                            onGameModeSelect('CREATE');
                            setShowOptions(false);
                        }}
                    >
                        Create New Game
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => {
                            onGameModeSelect('JOIN');
                            setShowOptions(false);
                        }}
                    >
                        Join Existing Game
                    </button>
                </div>
            )}
        </div>
    );
} 