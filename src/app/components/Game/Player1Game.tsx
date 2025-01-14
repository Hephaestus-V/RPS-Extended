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

export default function Player1Game() {
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [stake, setStake] = useState<string>("");
  const [player2Address, setPlayer2Address] = useState<string>("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [peerId, setPeerId] = useState<string>("");
  const { address } = useWallet();
  const [isRevealPhase, setIsRevealPhase] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const saltRef = useRef<string>(crypto.randomUUID());
  const contractRef = useRef<Address | null>(null);
  const moveRef = useRef<Move | null>(null);

  console.log("salt", saltRef.current);

  const generateSaltFromUUID = (uuid: string): bigint => {
    const hexString = "0x" + uuid.replace(/-/g, "");
    return BigInt(hexString);
  };

  const handlePeerData = (data: unknown, mounted: boolean = true) => {
    if (typeof data === "object" && data && "type" in data) {
      const peerData = data as PeerMessageType;

      if (peerData.type === "PLAYER2_JOINED" && mounted) {
        const sanitizedAddress = DOMPurify.sanitize(peerData.address);
        setPlayer2Address(sanitizedAddress);
      } else if (peerData.type === "PLAYER2_MOVED") {
        setIsRevealPhase(true);
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

  const handleMoveSelection = (move: Move) => {
    setSelectedMove(move);
  };

  const handleCreateGame = async () => {
    if (
      !selectedMove ||
      !stake ||
      !player2Address ||
      isCreatingGame ||
      !connectionRef.current
    )
      return;

    setIsCreatingGame(true);
    try {
      if (!window.ethereum) throw new Error("No ethereum provider");
      console.log("window.ethereum", window.ethereum);
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      console.log("selectedMove", selectedMove);

      const moveNumber = Object.values(Move).indexOf(selectedMove) + 1;
      console.log("moveNumber", moveNumber);
      const salt = generateSaltFromUUID(saltRef.current);
      console.log("salt", salt);

      const moveHash = keccak256(
        encodePacked(["uint8", "uint256"], [moveNumber, salt])
      );

      const stakeAmount = parseEther(stake);

      const RPShash = await walletClient.deployContract({
        abi: RPS_ABI,
        bytecode: RPS_BYTECODE,
        args: [moveHash, player2Address as Address],
        value: stakeAmount,
        account: address as Address,
      });
      console.log("RPShash", RPShash);

      const contractAddress = await publicClient.waitForTransactionReceipt({
        hash: RPShash,
      });
      contractRef.current = contractAddress.contractAddress as Address;
      moveRef.current = selectedMove;

      console.log("contractAddress", contractAddress);

      connectionRef.current.send({
        type: "GAME_CREATED",
        contractAddress: contractAddress.contractAddress,
        stake,
      });
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleRevealMove = async () => {
    if (!contractRef.current || !moveRef.current) return;

    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as EthereumProvider),
      });

      const moveNumber = Object.values(Move).indexOf(moveRef.current)+1;
      const salt = generateSaltFromUUID(saltRef.current);

      await walletClient.writeContract({
        address: contractRef.current,
        abi: RPS_ABI,
        functionName: "solve",
        args: [moveNumber, salt],
        account: address as Address,
      });

      if (connectionRef.current) {
        connectionRef.current.send({
          type: "REVEAL_MOVE",
        });
      }
    } catch (error) {
      console.error("Failed to reveal move:", error);
    }
  };

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = DOMPurify.sanitize(e.target.value);
    setStake(sanitizedValue);
  };

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
                selectedMove === move
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
          disabled={!selectedMove || !stake || isCreatingGame}
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
