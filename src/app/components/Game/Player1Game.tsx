import React, { useState, useEffect, useRef } from "react";
import { Move, PeerMessageType } from "@/app/types/game";
import Peer, { DataConnection } from "peerjs";
import DOMPurify from "dompurify";
import { useWallet } from "@/app/contexts/WalletContext";
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  parseEther,
  keccak256,
  encodePacked,
} from "viem";
import { sepolia } from "viem/chains";
import { RPS_ABI } from "@/app/contracts/RPS";
import { RPS_BYTECODE } from "@/app/contracts/RPS";
import { EthereumProvider } from "@/app/types/ethereum";
import useForceUpdate from "@/app/utils/forceUpdate";

export default function Player1Game() {
  const [stake, setStake] = useState<string>("");
  const [player2Address, setPlayer2Address] = useState<string>("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [peerId, setPeerId] = useState<string>("");
  const { address } = useWallet();
  const [isRevealPhase, setIsRevealPhase] = useState(false);
  const [player2Move, setPlayer2Move] = useState<Move | null>(null);
  const [waitingForPlayer2, setWaitingForPlayer2] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<bigint>(BigInt(0));
  const [currentTime, setCurrentTime] = useState<bigint>(BigInt(0));

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const contractRef = useRef<Address | null>(null);
  const moveRef = useRef<Move | null>(null);
  const saltRef = useRef<string | null>(null);

  const forceUpdate = useForceUpdate();

  const handlePeerData = (data: unknown, mounted: boolean = true) => {
    if (typeof data === "object" && data && "type" in data) {
      const peerData = data as PeerMessageType;
      if (peerData.type === "PLAYER2_JOINED" && mounted && peerData.address) {
        const sanitizedAddress = DOMPurify.sanitize(peerData.address.toString());
        if (sanitizedAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          setPlayer2Address(sanitizedAddress);
        }
      } else if (peerData.type === "PLAYER2_MOVED" && peerData.move) {
        const sanitizedMove = DOMPurify.sanitize(peerData.move.toString());
        if (Object.values(Move).includes(sanitizedMove as Move)) {
          setPlayer2Move(sanitizedMove as Move);
          setIsRevealPhase(true);
        }
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializePeer = async () => {
      try {
        const peer = new Peer({
          config: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
          debug: 3,
        });

        peerRef.current = peer;

        peer.on("open", (id) => {
          if (mounted) {
            console.log("Peer initialized with ID:", id);
            setPeerId(id);
          }
        });

        peer.on("connection", (conn) => {
          console.log("Received connection from peer");
          connectionRef.current = conn;

          conn.on("data", (data) => handlePeerData(data, mounted));
        });
      } catch (error) {
        console.error("Failed to initialize peer:", error);
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

  const handleCreateGame = async () => {
    if (!moveRef.current || !stake || !player2Address || isCreatingGame || !connectionRef.current) return;

    setIsCreatingGame(true);
    try {
      
      saltRef.current = crypto.randomUUID();
      
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const moveNumber = Object.values(Move).indexOf(moveRef.current) + 1;
      const saltBigInt = BigInt("0x" + saltRef.current.replace(/-/g, ""));

      const moveHash = keccak256(
        encodePacked(["uint8", "uint256"], [moveNumber, saltBigInt])
      );

      const stakeAmount = parseEther(stake);

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const RPShash = await walletClient.deployContract({
        abi: RPS_ABI,
        bytecode: RPS_BYTECODE,
        args: [moveHash, player2Address as Address],
        value: stakeAmount,
        account: address as Address,
      });

      const contractAddress = await publicClient.waitForTransactionReceipt({
        hash: RPShash,
      });
      contractRef.current = contractAddress.contractAddress as Address;

      connectionRef.current.send({
        type: "GAME_CREATED",
        contractAddress: DOMPurify.sanitize(contractAddress.contractAddress?.toString() || ""),
        stake: DOMPurify.sanitize(stake),
      });
      setWaitingForPlayer2(true);
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleRevealMove = async () => {
    if (!contractRef.current || !moveRef.current || !saltRef.current || !player2Move) return;

    try {
      const moveNumber = Object.values(Move).indexOf(moveRef.current) + 1;
      const saltBigInt = BigInt("0x" + saltRef.current.replace(/-/g, ""));

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const hash = await walletClient.writeContract({
        address: contractRef.current,
        abi: RPS_ABI,
        functionName: "solve",
        args: [moveNumber, saltBigInt],
        account: address as Address,
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        const result = determineWinner(moveRef.current, player2Move);
        setGameResult(result);

        if (connectionRef.current) {
          connectionRef.current.send({
            type: "REVEAL_MOVE",
            move: moveRef.current,
            result: result
          });
        }
      }
    } catch (error) {
      console.error("Failed to reveal move:", error);
    }
  };

  const handleMoveSelection = (move: Move) => {
    moveRef.current = move;
    forceUpdate();
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = DOMPurify.sanitize(e.target.value);
    if (sanitizedValue.match(/^\d*\.?\d*$/)) {
      setStake(sanitizedValue);
    }
  };

  const determineWinner = (p1Move: Move, p2Move: Move): string => {
    if (p1Move === p2Move) return "Draw!";
    
    const moves = {
      [Move.Rock]: [Move.Scissors, Move.Lizard],
      [Move.Paper]: [Move.Rock, Move.Spock],
      [Move.Scissors]: [Move.Paper, Move.Lizard],
      [Move.Lizard]: [Move.Paper, Move.Spock],
      [Move.Spock]: [Move.Rock, Move.Scissors],
    };

    return moves[p1Move].includes(p2Move) ? "You Win!" : "Player 2 Wins!";
  };

  const handleTimeoutClaim = async () => {
    if (!contractRef.current || !address) return;

    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const lastActionTime = await publicClient.readContract({
        address: contractRef.current,
        abi: RPS_ABI,
        functionName: "lastAction"
      }) as bigint;

      const timeoutDuration = await publicClient.readContract({
        address: contractRef.current,
        abi: RPS_ABI,
        functionName: "TIMEOUT"
      }) as bigint;

      const now = Math.floor(Date.now() / 1000);
      
      if (now <= lastActionTime + timeoutDuration) {
        alert("Player 2 still has time to make their move!");
        return;
      }

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const hash = await walletClient.writeContract({
        address: contractRef.current,
        abi: RPS_ABI,
        functionName: "j2Timeout",
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
    if (waitingForPlayer2 && contractRef.current) {
      const interval = setInterval(async () => {
        try {
          const publicClient = createPublicClient({
            chain: sepolia,
            transport: custom(window.ethereum as EthereumProvider),
          });

          const lastActionTime = await publicClient.readContract({
            address: contractRef.current!,
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
  }, [waitingForPlayer2]);

  if (!player2Address) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
          Waiting for Player 2
        </h2>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full mb-4 sm:mb-6">
          <p className="text-base sm:text-lg mb-3 sm:mb-4">
            Share this Game ID with Player 2:
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <code className="bg-gray-100 p-2 sm:px-4 sm:py-2 rounded font-mono break-all text-sm sm:text-base flex-1">
              {peerId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(peerId)}
              className="button-primary whitespace-nowrap px-4 py-2"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="animate-pulse mt-4 sm:mt-6">
          <div className="h-4 w-36 sm:w-48 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (waitingForPlayer2 && !isRevealPhase) {
    const timeElapsed = Number(currentTime - lastAction);
    const minutesLeft = Math.max(5 - Math.floor(timeElapsed / 60), 0);
    
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
          Waiting for Player 2&apos;s Move
        </h2>
        
        <div className="mb-4 text-center">
          <p className="mb-2">Time since last action: {Math.floor(timeElapsed / 60)} minutes {timeElapsed % 60} seconds</p>
          {minutesLeft > 0 ? (
            <p>Player 2 has {minutesLeft} minutes left to play</p>
          ) : (
            <p className="text-red-500">Player 2 has timed out!</p>
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
        <p className="mb-2">Your Move: {moveRef.current}</p>
        <p>Player 2&apos;s Move: {player2Move}</p>
      </div>
    );
  }

  if (isRevealPhase) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
          Reveal Your Move
        </h2>
        <button
          onClick={handleRevealMove}
          className="w-full button-primary py-2 sm:py-3 text-sm sm:text-base"
        >
          Reveal Move
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-light rounded-lg max-w-2xl mx-auto w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
        Choose Your Move
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full">
        {Object.values(Move)
          .filter((move) => typeof move === "string")
          .map((move) => (
            <button
              key={move}
              onClick={() => handleMoveSelection(move as Move)}
              className={`p-2 sm:p-4 rounded-lg transition-all duration-300 text-sm sm:text-base break-words ${
                moveRef.current === move
                  ? "bg-primary text-white shadow-lg"
                  : "bg-white hover:bg-primary/10"
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
            className="input-field w-full px-3 py-2 text-base sm:text-lg"
            placeholder="Enter stake amount"
            step="0.01"
          />
        </div>

        <button
          onClick={handleCreateGame}
          disabled={!moveRef.current || !stake || isCreatingGame}
          className="w-full button-primary disabled:opacity-50 relative py-2 sm:py-3"
        >
          {isCreatingGame ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 border-2 border-white border-t-transparent rounded-full"></span>
              <span className="text-sm sm:text-base">Creating Game...</span>
            </span>
          ) : (
            <span className="text-sm sm:text-base">Create Game</span>
          )}
        </button>
      </div>
    </div>
  );
}
