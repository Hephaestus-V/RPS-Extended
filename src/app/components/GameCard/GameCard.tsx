"use client";

import React from 'react';
import { GameCardProps } from '@/app/types/components';

export default function GameCard({ title, items, className = '' }: GameCardProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div 
            className={`game-card overflow-hidden ${isHovered ? 'game-card-hover' : ''} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h2 className="card-title text-lg sm:text-xl break-words">{title}</h2>
            <ul className="card-list">
                {items.map((item, index) => (
                    <li key={index} className="card-list-item flex items-start space-x-2 break-words">
                        <span className="card-bullet flex-shrink-0">•</span>
                        <span className="flex-1 min-w-0">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
} 