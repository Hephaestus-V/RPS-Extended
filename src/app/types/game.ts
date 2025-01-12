export interface PeerConnectionType {
  peerId: string;
  isHost: boolean;
  isConnected: boolean;
}

export type GameMode = "CREATE" | "JOIN" | null;

export interface GameSetupProps {
  onClose: () => void;
  mode: GameMode;
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
  status: 'waiting' | 'playing' | 'revealing' | 'finished';
  winner?: string;
}

export interface GameProps {
  gameState: GameState;
  isHost: boolean;
  onMove: (move: string) => void;
  onWager: (amount: number) => void;
  onReveal: () => void;
}
