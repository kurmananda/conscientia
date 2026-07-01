"use client";

import "./about.css";

import Hero from "./components/Hero";
import HorizontalStory from "./components/HorizontalStory";
import Mission from "./components/Mission";
import Domains from "./components/Domains";
import Stats from "./components/Stats";
import Philosophy from "./components/Philosophy";
import CTA from "./components/CTA";

export default function AboutPage() {
  return (
    <main className="about-page">

      {/* Hero */}
      <Hero />

      {/* Horizontal Story */}
      <HorizontalStory />

      {/* Mission */}
      <Mission />

      {/* Domains */}
      <Domains />

      {/* Stats */}
      <Stats />

      {/* Team Philosophy */}
      <Philosophy />

      {/* Call To Action */}
      <CTA />

    </main>
  );
}