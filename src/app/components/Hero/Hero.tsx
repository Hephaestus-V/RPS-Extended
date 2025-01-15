"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/app/contexts/WalletContext';
import { GameMode } from '@/app/types/game';
import GameSetup from '../GameSetup/GameSetup';
import Player1Game from '../Game/Player1Game';
import Player2Game from '../Game/Player2Game';
import GameRules from '../GameRules/GameRules';
import { PlayButtonProps } from '@/app/types/game';
import DOMPurify from 'dompurify';

export default function Hero() {
    const [showJoinGame, setShowJoinGame] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>(null);
    const [peerId, setPeerId] = useState<string | null>(null);
    const [joinGameId, setJoinGameId] = useState<string | null>(null);
   

    const handleGameModeSelect = async (mode: GameMode) => {
        const sanitizedMode = DOMPurify.sanitize(mode as string);
        if (sanitizedMode === 'CREATE' || sanitizedMode === 'JOIN') {
            setGameMode(sanitizedMode as GameMode);
            if (sanitizedMode === 'CREATE') {
                setPeerId('placeholder');
            } else if (sanitizedMode === 'JOIN') {
                setShowJoinGame(true);
            }
        }
    };

    const handleJoinGame = async (gameId: string) => {
        try {
            const sanitizedGameId = DOMPurify.sanitize(gameId);
            // Validate that gameId only contains allowed PeerJS ID characters
            if (sanitizedGameId.match(/^[a-zA-Z0-9-_]+$/)) {
                console.log('Joining game with ID:', sanitizedGameId);
                setJoinGameId(sanitizedGameId);
                setShowJoinGame(false);
                setGameMode('JOIN');
            } else {
                throw new Error('Invalid game ID format');
            }
        } catch (error) {
            console.error('Failed to initialize peer for joining:', error);
            setGameMode(null);
            setJoinGameId(null);
        }
    };

    const renderGameContent = () => {
        console.log('Current state:', { gameMode, joinGameId, peerId }); // Debug current state
        
        if (gameMode === 'CREATE' && peerId) {
            return <Player1Game />;
        }
        if (gameMode === 'JOIN' && joinGameId) {
            console.log('Rendering Player2Game with ID:', joinGameId);
            return <Player2Game gameId={joinGameId} />;
        }
        return (
            <>
                <div className="mb-16">
                    <h1 className="hero-title">
                        Rock Paper Scissors
                        <span className="hero-subtitle">Lizard Spock</span>
                    </h1>
                    <p className="hero-description mb-8">
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
                            onJoinGame={handleJoinGame}
                        />
                    )}
                </div>

                <div className="border-t border-gray-200 pt-12">
                    <div className="mx-auto">
                        <GameRules />
                    </div>
                </div>
            </>
        );
    };

    return (
        <section className="text-center animate-fadeIn">
            {renderGameContent()}
        </section>
    );
}

function PlayButton({ onGameModeSelect }: PlayButtonProps) {
    const [isHovered, setIsHovered] = React.useState(false);
    const [showOptions, setShowOptions] = React.useState(false);
    const { isConnected, isCorrectNetwork, connectWallet, switchNetwork } = useWallet();
    const optionsRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
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