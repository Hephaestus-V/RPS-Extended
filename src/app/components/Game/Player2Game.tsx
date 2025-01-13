import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/app/contexts/WalletContext';
import { Move, PeerMessageType } from '@/app/types/game';
import Peer, { DataConnection } from 'peerjs';
import DOMPurify from 'dompurify';

interface Player2GameProps {
    gameId: string;
}

export default function Player2Game({ gameId }: Player2GameProps) {
    const [isWaiting, setIsWaiting] = useState(true);
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [gameContract, setGameContract] = useState<string>('');
    const { address } = useWallet();
    
    const peerRef = useRef<Peer | null>(null);
    const connectionRef = useRef<DataConnection | null>(null);

    useEffect(() => {
        let mounted = true;

        const handleData = (data: unknown) => {
            if (typeof data === 'object' && data && 'type' in data) {
                const peerData = data as PeerMessageType;
                if (peerData.type === 'GAME_CREATED' && mounted) {
                    const sanitizedAddress = DOMPurify.sanitize(peerData.contractAddress);
                    setGameContract(sanitizedAddress);
                    setIsWaiting(false);
                }
            }
        };

        const joinGame = async () => {
            if (!gameId) return;
            
            try {
                const peer = new Peer({
                    config: {
                        'iceServers': [
                            { urls: 'stun:stun.l.google.com:19302' },
                        ]
                    },
                    debug: 3
                });

                peerRef.current = peer;

                await new Promise<void>((resolve, reject) => {
                    peer.on('open', () => resolve());
                    peer.on('error', reject);
                });

                const conn = peer.connect(gameId);
                connectionRef.current = conn;

                await new Promise<void>((resolve, reject) => {
                    conn.on('open', () => {
                        conn.on('data', handleData);
                        resolve();
                    });
                    conn.on('error', reject);
                });

                if (mounted) {
                    conn.send({ type: 'PLAYER2_JOINED', address: address || '' });
                }

            } catch (error) {
                console.error('Failed to connect:', error);
            }
        };

        if (gameId) {
            joinGame();
        }

        return () => {
            mounted = false;
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, [gameId, address]);

    const handleMoveSelection = (move: Move) => {
        setSelectedMove(move);
    };

    const handlePlayMove = async () => {
        if (!selectedMove || !gameContract || !address) return;
        
        if (connectionRef.current) {
            connectionRef.current.send({ 
                type: 'PLAY_MOVE',
                move: selectedMove,
                address 
            });
        }
    };

    if (isWaiting) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-light rounded-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-primary mb-6">Waiting for Player 1</h2>
                <div className="bg-white p-6 rounded-lg shadow-md w-full mb-6">
                    <p className="text-lg mb-4">Game Status:</p>
                    <div className="flex items-center gap-4">
                        <div className="animate-pulse flex items-center gap-2">
                            <div className="h-3 w-3 bg-primary/20 rounded-full"></div>
                            <p className="text-gray-600">Waiting for Player 1 to create game and choose move...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-light rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-6">Connected to Game: {gameId}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 w-full">
                {Object.values(Move).filter(move => typeof move === 'string').map((move) => (
                    <button
                        key={move}
                        onClick={() => handleMoveSelection(move as Move)}
                        className={`p-4 rounded-lg transition-all duration-300 ${
                            selectedMove === move
                                ? 'bg-primary text-white'
                                : 'bg-white hover:bg-primary/10'
                        }`}
                    >
                        {move}
                    </button>
                ))}
            </div>

            <button
                onClick={handlePlayMove}
                disabled={!selectedMove}
                className="w-full max-w-md button-primary disabled:opacity-50"
            >
                Play Move
            </button>
        </div>
    );
} 