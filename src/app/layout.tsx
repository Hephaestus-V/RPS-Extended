import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "./contexts/WalletContext";
import "./globals.css";
import { PeerProvider } from './contexts/PeerContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPS-Extended",
  description: "Rock Paper Scissors Spock Lizard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <PeerProvider>
            {children}
          </PeerProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
