import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@/app/contexts/WalletContext";
import { Move, PeerMessageType } from "@/app/types/game";
import Peer, { DataConnection } from "peerjs";
import DOMPurify from "dompurify";
import { Address, createWalletClient, custom, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { RPS_ABI } from "@/app/contracts/RPS";
import { EthereumProvider } from "@/app/types/ethereum";
import { createPublicClient } from "viem";
import { ADDRESS_REGEX, STAKE_AMOUNT_REGEX, PEER_CONFIG } from "@/app/constants/game";

interface Player2GameProps {
  gameId: string;
}

export default function Player2Game({ gameId }: Player2GameProps) {
  const [isWaiting, setIsWaiting] = useState(true);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const { address } = useWallet();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaitingForReveal, setIsWaitingForReveal] = useState(false);
  const [player1Move, setPlayer1Move] = useState<Move | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<bigint>(BigInt(0));
  const [currentTime, setCurrentTime] = useState<bigint>(BigInt(0));

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);

  const handlePeerData = (data: unknown, mounted: boolean = true) => {
    if (typeof data === "object" && data && "type" in data) {
      const peerData = data as PeerMessageType;
      if (peerData.type === "GAME_CREATED" && mounted) {
        const sanitizedAddress = DOMPurify.sanitize(peerData.contractAddress?.toString() || "");
        const sanitizedStake = DOMPurify.sanitize(peerData.stake?.toString() || "");
        
        if (sanitizedAddress.match(ADDRESS_REGEX)) {
          setContractAddress(sanitizedAddress);
        }
        
        if (sanitizedStake.match(STAKE_AMOUNT_REGEX)) {
          setStakeAmount(sanitizedStake);
        }
        setIsWaiting(false);
      } else if (peerData.type === "REVEAL_MOVE" && peerData.move && peerData.result) {
        const sanitizedMove = DOMPurify.sanitize(peerData.move.toString());
        const sanitizedResult = DOMPurify.sanitize(peerData.result.toString());
        
        if (Object.values(Move).includes(sanitizedMove as Move)) {
          setPlayer1Move(sanitizedMove as Move);
        }
        setGameResult(sanitizedResult);
        setIsWaitingForReveal(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const joinGame = async () => {
      if (!gameId) return;

      try {
        const peer = new Peer(PEER_CONFIG);
        peerRef.current = peer;

        await new Promise<void>((resolve, reject) => {
          peer.on("open", () => resolve());
          peer.on("error", reject);
        });

        const conn = peer.connect(gameId);
        connectionRef.current = conn;

        await new Promise<void>((resolve, reject) => {
          conn.on("open", () => {
            conn.on("data", (data) => handlePeerData(data, mounted));
            resolve();
          });
          conn.on("error", reject);
        });

        if (mounted && connectionRef.current) {
          connectionRef.current.send({ 
            type: "PLAYER2_JOINED", 
            address: DOMPurify.sanitize(address?.toString() || "") 
          });
        }
      } catch (error) {
        console.error("Failed to connect:", error);
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
    if (!selectedMove || !contractAddress || !address) return;

    setIsPlaying(true);
    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const moveNumber = Object.values(Move).indexOf(selectedMove)+1;
      const stake = parseEther(stakeAmount);

      const hash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: RPS_ABI,
        functionName: "play",
        args: [moveNumber],
        value: stake,
        account: address as Address,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        alert('Move successfully played!');
        
        if (connectionRef.current) {
          connectionRef.current.send({
            type: "PLAYER2_MOVED",
            move: DOMPurify.sanitize(selectedMove.toString())
          });
        }
        setIsWaitingForReveal(true);
      }
    } catch (error) {
      console.error("Failed to play move:", error);
      alert('Failed to play move. Please try again.');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTimeoutClaim = async () => {
    if (!contractAddress || !address) return;

    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const lastActionTime = await publicClient.readContract({
        address: contractAddress as Address,
        abi: RPS_ABI,
        functionName: "lastAction"
      }) as bigint;

      const timeoutDuration = await publicClient.readContract({
        address: contractAddress as Address,
        abi: RPS_ABI,
        functionName: "TIMEOUT"
      }) as bigint;

      const now = Math.floor(Date.now() / 1000);
      
      if (now <= lastActionTime + timeoutDuration) {
        alert("Player 1 still has time to reveal their move!");
        return;
      }

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const hash = await walletClient.writeContract({
        address: contractAddress as Address,
        abi: RPS_ABI,
        functionName: "j1Timeout",
        account: address as Address,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        alert("Successfully claimed timeout! Funds have been returned.");
      }
    } catch (error) {
      console.error("Failed to claim timeout:", error);
      alert("Failed to claim timeout. Please try again.");
    }
  };

  useEffect(() => {
    if (isWaitingForReveal && contractAddress) {
      const interval = setInterval(async () => {
        try {
          const publicClient = createPublicClient({
            chain: sepolia,
            transport: custom(window.ethereum as EthereumProvider),
          });

          const lastActionTime = await publicClient.readContract({
            address: contractAddress as Address,
            abi: RPS_ABI,
            functionName: "lastAction"
          }) as bigint;

          setLastAction(lastActionTime);
          setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
        } catch (error) {
          console.error("Failed to fetch times:", error);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isWaitingForReveal, contractAddress]);

  if (isWaiting) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
          Waiting for Player 1
        </h2>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full mb-4 sm:mb-6">
          <p className="text-base sm:text-lg mb-3 sm:mb-4">Game Status:</p>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="animate-pulse flex items-center gap-2 w-full">
              <div className="h-3 w-3 flex-shrink-0 bg-primary/20 rounded-full"></div>
              <p className="text-gray-600 text-sm sm:text-base break-words">
                Waiting for Player 1 to create game and choose move...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingForReveal) {
    const timeElapsed = Number(currentTime - lastAction);
    const minutesLeft = Math.max(5 - Math.floor(timeElapsed / 60), 0);
    
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
          Waiting for Player 1 to Reveal Move
        </h2>
        
        <div className="mb-4 text-center">
          <p className="mb-2">Time since last action: {Math.floor(timeElapsed / 60)} minutes {timeElapsed % 60} seconds</p>
          {minutesLeft > 0 ? (
            <p>Player 1 has {minutesLeft} minutes left to reveal</p>
          ) : (
            <p className="text-red-500">Player 1 has timed out!</p>
          )}
        </div>

        <button
          onClick={handleTimeoutClaim}
          className="w-full button-primary py-2 sm:py-3 text-sm sm:text-base mt-4"
        >
          Claim Timeout
        </button>

        <div className="animate-pulse mt-4">
          <div className="h-4 w-36 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">
          Game Result: {gameResult}
        </h2>
        <p className="mb-2">Your Move: {selectedMove}</p>
        <p>Player 1&apos;s Move: {player1Move}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
        <span className="block text-center break-words">
          Connected to Game:
        </span>
        <span className="block text-center text-base sm:text-lg font-mono mt-2 break-all">
          {gameId}
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full">
        {Object.values(Move)
          .filter((move) => typeof move === "string")
          .map((move) => (
            <button
              key={move}
              onClick={() => handleMoveSelection(move as Move)}
              className={`p-2 sm:p-4 rounded-lg transition-all duration-300 text-sm sm:text-base break-words ${
                selectedMove === move
                  ? "bg-primary text-white shadow-lg"
                  : "bg-white hover:bg-primary/10"
              }`}
            >
              {move}
            </button>
          ))}
      </div>

      <div className="w-full max-w-md">
        <button
          onClick={handlePlayMove}
          disabled={!selectedMove || isPlaying}
          className="w-full button-primary disabled:opacity-50 py-2 sm:py-3 text-sm sm:text-base"
        >
          {isPlaying ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Playing Move...</span>
            </span>
          ) : (
            "Play Move"
          )}
        </button>
      </div>
    </div>
  );
}
