"use client";

import React, { createContext, useContext } from 'react';
import {  PeerContextType } from '@/app/types/game';

const PeerContext = createContext<PeerContextType>({
  connection: null,
  initializePeer: async () => '',
  connectToPeer: async () => false,
  disconnect: () => {},
  sendData: () => {},
  onData: () => {},
});

export function PeerProvider({ children }: { children: React.ReactNode }) {
  return (
    <PeerContext.Provider value={{
      connection: null,
      initializePeer: async () => '',
      connectToPeer: async () => false,
      disconnect: () => {},
      sendData: () => {},
      onData: () => {},
    }}>
      {children}
    </PeerContext.Provider>
  );
}

export const usePeer = () => useContext(PeerContext); 