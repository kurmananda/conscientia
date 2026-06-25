"use client";

import IntroController from "../components/IntroController";
import TimeFallScene from "../components/TimeFallScene";

export default function WorkshopPage() {
  return (
    <IntroController>
      <div className="relative min-h-screen">

        {/* Background */}
        <TimeFallScene />

        {/* Everything visible above the background */}
        <main className="relative z-10">

          {/* Navbar */}

          {/* Hero */}

          {/* Workshop Cards */}

          {/* Footer */}

        </main>

      </div>
    </IntroController>
  );
}