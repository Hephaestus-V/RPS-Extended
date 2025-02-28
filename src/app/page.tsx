import React from 'react';
import NavBar from "./components/NavBar/NavBar";
import Hero from "./components/Hero/Hero";

export default function Home() {
  return (
    <main className="min-h-screen pt-16">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Hero />
      </div>
    </main>
  );
}
