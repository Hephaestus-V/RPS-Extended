import React, { useState, useEffect, useRef } from 'react';
import { Move, PeerMessageType } from '@/app/types/game';
import Peer, { DataConnection } from 'peerjs';
import DOMPurify from 'dompurify';



export default function Player1Game() {
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [stake, setStake] = useState<string>('');
    const [player2Address, setPlayer2Address] = useState<string>('');
    const [isCreatingGame, setIsCreatingGame] = useState(false);
    const [peerId, setPeerId] = useState<string>('');
    
    const peerRef = useRef<Peer | null>(null);
    const connectionRef = useRef<DataConnection | null>(null);

    useEffect(() => {
        let mounted = true;

        const initializePeer = async () => {
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

                peer.on('open', (id) => {
                    if (mounted) {
                        console.log('Peer initialized with ID:', id);
                        setPeerId(id);
                    }
                });

                peer.on('connection', (conn) => {
                    console.log('Received connection from peer');
                    connectionRef.current = conn;

                    conn.on('data', (data: unknown) => {
                        if (typeof data === 'object' && data && 'type' in data) {
                            const peerData = data as PeerMessageType;
                            if (peerData.type === 'PLAYER2_JOINED' && mounted) {
                                const sanitizedAddress = DOMPurify.sanitize(peerData.address);
                                setPlayer2Address(sanitizedAddress);
                            }
                        }
                    });
                });

            } catch (error) {
                console.error('Failed to initialize peer:', error);
            }
        };

        initializePeer();

        return () => {
            mounted = false;
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    const handleMoveSelection = (move: Move) => {
        setSelectedMove(move);
    };

    const handleCreateGame = async () => {
        if (!selectedMove || !stake || !player2Address || isCreatingGame || !connectionRef.current) return;
        
        setIsCreatingGame(true);
        try {
            // Contract interaction will be implemented here
            const contractAddress = '0x...'; // This will be the actual contract address
            connectionRef.current.send({ 
                type: 'GAME_CREATED', 
                contractAddress,
                stake 
            });
        } catch (error) {
            console.error('Failed to create game:', error);
        } finally {
            setIsCreatingGame(false);
        }
    };

    const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedValue = DOMPurify.sanitize(e.target.value);
        setStake(sanitizedValue);
    };

    // Use peerId instead of gameId in the UI
    if (!player2Address) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-light rounded-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-primary mb-6">Waiting for Player 2</h2>
                <div className="bg-white p-6 rounded-lg shadow-md w-full mb-6">
                    <p className="text-lg mb-4">Share this Game ID with Player 2:</p>
                    <div className="flex items-center gap-4">
                        <code className="bg-gray-100 px-4 py-2 rounded flex-1 font-mono">{peerId}</code>
                        <button
                            onClick={() => navigator.clipboard.writeText(peerId)}
                            className="button-primary"
                        >
                            Copy
                        </button>
                    </div>
                </div>
                <div className="animate-pulse mt-6">
                    <div className="h-4 w-48 bg-primary/20 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Choose Your Move</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full">
                {Object.values(Move).filter(move => typeof move === 'string').map((move) => (
                    <button
                        key={move}
                        onClick={() => handleMoveSelection(move as Move)}
                        className={`p-3 sm:p-4 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                            selectedMove === move
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white hover:bg-primary/10'
                        }`}
                    >
                        {move}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stake Amount (ETH)
                    </label>
                    <input
                        type="number"
                        value={stake}
                        onChange={handleStakeChange}
                        className="input-field w-full"
                        placeholder="Enter stake amount"
                        step="0.01"
                    />
                </div>

                <button
                    onClick={handleCreateGame}
                    disabled={!selectedMove || !stake || isCreatingGame}
                    className="w-full button-primary disabled:opacity-50 relative"
                >
                    {isCreatingGame ? (
                        <span className="flex items-center justify-center">
                            <span className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></span>
                            Creating Game...
                        </span>
                    ) : (
                        'Create Game'
                    )}
                </button>
            </div>
        </div>
    );
} 