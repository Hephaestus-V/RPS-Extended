export interface GameCardProps {
  title: string;
  items: string[];
  className?: string;
}

export interface ConnectWalletButtonProps {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  onConnect: () => Promise<void>;
  onSwitchNetwork: () => Promise<void>;
  address?: string | null;
}
