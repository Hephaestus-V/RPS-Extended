"use client";

import React from 'react';

interface GameCardProps {
    title: string;
    items: string[];
    className?: string;
}

export default function GameCard({ title, items, className = '' }: GameCardProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div 
            className={`game-card ${isHovered ? 'game-card-hover' : ''} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h2 className="card-title">{title}</h2>
            <ul className="card-list">
                {items.map((item, index) => (
                    <li key={index} className="card-list-item">
                        <span className="card-bullet">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
} 