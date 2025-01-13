"use client";

import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import {GameSetupProps } from '@/app/types/game';

export default function GameSetup({ onClose, mode, onJoinGame }: GameSetupProps) {
  const [peerId, setPeerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGameIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = DOMPurify.sanitize(e.target.value);
    setPeerId(sanitizedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        if (mode === 'JOIN' && onJoinGame) {
          console.log('Joining game with ID:', peerId);
          const sanitizedGameId = DOMPurify.sanitize(peerId.trim());
          await onJoinGame(sanitizedGameId);
        }
    } catch (error) {
      console.error('Failed to join game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {mode === 'CREATE' ? 'Create New Game' : 'Join Existing Game'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'JOIN' && (
            <div>
              <label htmlFor="peerId" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Game ID
              </label>
              <input
                type="text"
                id="peerId"
                value={peerId}
                onChange={handleGameIdChange}
                className="input-field"
                placeholder="Enter the game ID shared by your opponent"
                required
              />
            </div>
          )}
          
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 
                         transition-colors duration-300 font-medium text-base sm:text-lg
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (mode === 'JOIN' && !peerId)}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light 
                         transition-colors duration-300 font-medium text-base sm:text-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? 'Processing...' : mode === 'CREATE' ? 'Create Game' : 'Join Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 