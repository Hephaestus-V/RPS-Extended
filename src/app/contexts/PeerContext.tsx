"use client";

import React, { createContext, useContext, useState } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { PeerConnectionType } from '@/app/types/game';

interface PeerContextType {
  connection: PeerConnectionType | null;
  initializePeer: (isHost: boolean) => Promise<string>;
  connectToPeer: (peerId: string) => Promise<void>;
  disconnect: () => void;
}

const PeerContext = createContext<PeerContextType>({
  connection: null,
  initializePeer: async () => '',
  connectToPeer: async () => {},
  disconnect: () => {},
});

export function PeerProvider({ children }: { children: React.ReactNode }) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<PeerConnectionType | null>(null);

  const initializePeer = async (isHost: boolean): Promise<string> => {
    if (peer) peer.destroy();
    
    return new Promise((resolve, reject) => {
      const newPeer = new Peer();
      
      newPeer.on('open', (id) => {
        setPeer(newPeer);
        setConnection({
          peerId: id,
          isHost,
          isConnected: false
        });
        resolve(id);
      });

      newPeer.on('error', (error) => {
        reject(error);
      });
    });
  };

  const connectToPeer = async (peerId: string): Promise<void> => {
    if (!peer) throw new Error('Peer not initialized');

    return new Promise((resolve, reject) => {
      const conn = peer.connect(peerId);
      
      conn.on('open', () => {
        setConnection(prev => prev ? { ...prev, isConnected: true } : null);
        resolve();
      });

      conn.on('error', (error) => {
        reject(error);
      });
    });
  };

  const disconnect = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
      setConnection(null);
    }
  };

  return (
    <PeerContext.Provider value={{
      connection,
      initializePeer,
      connectToPeer,
      disconnect,
    }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => useContext(PeerContext); 