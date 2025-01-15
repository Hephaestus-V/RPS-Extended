"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';
import { WalletContextType } from '@/app/types/wallet';

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isCorrectNetwork: false,
  connectWallet: async () => {},
  switchNetwork: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);


  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this application');
      return;
    }

    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      const [address] = await walletClient.requestAddresses();
      const chainId = await walletClient.getChainId();
      
      setAddress(address);
      setIsConnected(true);
      setIsCorrectNetwork(chainId === sepolia.id);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
      });
      setIsCorrectNetwork(true);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${sepolia.id.toString(16)}`,
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
        }
      }
      console.error('Error switching network:', error);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        setAddress(accounts[0] || null);
        setIsConnected(!!accounts[0]);
      };

      const handleChainChanged = (...args: unknown[]) => {
        const chainId = args[0] as string;
        setIsCorrectNetwork(parseInt(chainId) === sepolia.id);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{
      address,
      isConnected,
      isCorrectNetwork,
      connectWallet,
      switchNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);