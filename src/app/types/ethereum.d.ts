interface RequestArguments {
  method: string;
  params?: unknown[];
}

interface EthereumEvent {
  connect: { chainId: string };
  disconnect: { code: number; message: string };
  accountsChanged: string[];
  chainChanged: string;
  message: { type: string; data: unknown };
}

type EventCallback<K extends keyof EthereumEvent> = (
  event: EthereumEvent[K]
) => void;

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: RequestArguments) => Promise<unknown>;
    on: <K extends keyof EthereumEvent>(
      event: K,
      callback: EventCallback<K>
    ) => void;
    removeListener: <K extends keyof EthereumEvent>(
      event: K,
      callback: EventCallback<K>
    ) => void;
    removeAllListeners: () => void;
  };
}
