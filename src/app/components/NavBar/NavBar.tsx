"use client";

import React from 'react';
import Link from "next/link";

export default function NavBar() {
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`nav-fixed ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="nav-container">
                <Link href="/" className="nav-link">
                    RPS-Extended
                </Link>
                <ConnectWalletButton />
            </div>
        </nav>
    );
}

function ConnectWalletButton() {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button 
            className={`nav-button ${isHovered ? 'nav-button-hover' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            Connect Wallet
        </button>
    );
} 