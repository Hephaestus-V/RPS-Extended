"use client";

import React from 'react';

export default function Hero() {
    return (
        <section className="text-center mb-16 animate-fadeIn">
            <h1 className="hero-title">
                Rock Paper Scissors
                <span className="hero-subtitle">Lizard Spock</span>
            </h1>
            <p className="hero-description">
                Play the extended version of Rock Paper Scissors with Web3 integration. 
                Challenge players and win ETH on Sepolia testnet!
            </p>
            <PlayButton />
        </section>
    );
}

function PlayButton() {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button 
            className={`hero-button ${isHovered ? 'hero-button-hover' : ''}`}
            disabled={false}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            Start Playing
        </button>
    );
} 