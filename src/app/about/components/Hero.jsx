"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const title = useRef(null);
  const subtitle = useRef(null);
  const arrow = useRef(null);

  useEffect(() => {
    gsap.from(title.current, {
      y: 120,
      opacity: 0,
      duration: 1.4,
      ease: "power4.out",
    });

    gsap.from(subtitle.current, {
      y: 60,
      opacity: 0,
      delay: 0.3,
      duration: 1,
    });

    gsap.to(arrow.current, {
      y: 15,
      repeat: -1,
      yoyo: true,
      duration: 1,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <section className="hero">

      <div className="hero-noise" />

      <div className="hero-content">

        <p className="hero-tag">
          ABOUT CONSCIENTIA
        </p>

        <h1 ref={title}>
          Building
          <br />
          Tomorrow's
          <br />
          Innovators.
        </h1>

        <p
          className="hero-subtitle"
          ref={subtitle}
        >
          A community where technology,
          research and creativity merge to
          shape the future.
        </p>

      </div>

      <div
        className="scroll-indicator"
        ref={arrow}
      >
        ↓
      </div>

    </section>
  );
}