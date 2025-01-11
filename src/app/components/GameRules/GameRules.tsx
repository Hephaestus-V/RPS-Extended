"use client";

import React from 'react';
import GameCard from '../GameCard/GameCard';

const gameData = {
    howToPlay: [
        'Connect your wallet',
        'Choose your move',
        'Place your wager',
        'Wait for opponent',
        'Reveal your move'
    ],
    rules: [
        'Scissors cuts Paper & decapitates Lizard',
        'Paper disproves Spock & covers Rock',
        'Rock crushes both Lizard & Scissors',
        'Lizard poisons Spock & eats Paper',
        'Spock smashes Scissors & vaporizes Rock'
    ],
    rewards: [
        'Winner takes the pot',
        'Equal moves = draw',
        'Funds in Sepolia ETH',
        'Instant payouts'
    ]
};

export default function GameRules() {
    return (
        <section className="rules-grid">
            <GameCard title="How to Play" items={gameData.howToPlay} />
            <GameCard title="Game Rules" items={gameData.rules} />
            <GameCard title="Rewards" items={gameData.rewards} />
        </section>
    );
} 