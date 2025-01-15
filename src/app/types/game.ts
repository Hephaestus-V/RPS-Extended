export interface PeerConnectionType {
  peerId: string;
  isHost: boolean;
  isConnected: boolean;
}

export type GameMode = "CREATE" | "JOIN" | null;

export interface GameSetupProps {
  mode: GameMode;
  onClose: () => void;
  onJoinGame?: (gameId: string) => Promise<void>;
}

export interface GameState {
  gameId: string;
  player1: {
    address: string;
    connected: boolean;
    move?: string;
    wager?: number;
  };
  player2: {
    address: string;
    connected: boolean;
    move?: string;
    wager?: number;
  };
  status: "waiting" | "playing" | "revealing" | "finished";
  winner?: string;
}

export interface GameProps {
  gameState: GameState;
  isHost: boolean;
  onMove: (move: string) => void;
  onWager: (amount: number) => void;
  onReveal: () => void;
}

export enum Move {
  Rock = "Rock",
  Paper = "Paper",
  Scissors = "Scissors",
  Spock = "Spock",
  Lizard = "Lizard",
}

export type PeerMessageType = {
  type: "PLAYER2_JOINED" | "PLAYER2_MOVED" | "GAME_CREATED" | "REVEAL_MOVE";
  address?: string;
  contractAddress?: string;
  stake?: string;
  move?: Move;
  result?: string;
};

export interface PeerContextType {
  connection: PeerConnectionType | null;
  initializePeer: (isHost: boolean) => Promise<string>;
  connectToPeer: (peerId: string) => Promise<boolean>;
  disconnect: () => void;
  sendData: (data: PeerMessageType) => void;
  onData: (callback: (data: PeerMessageType) => void) => void;
}
export interface PlayButtonProps {
  onGameModeSelect: (mode: GameMode) => void;
}
