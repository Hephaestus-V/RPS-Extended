export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
  removeAllListeners: (event: string) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
