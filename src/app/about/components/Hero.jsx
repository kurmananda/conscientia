"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const title = useRef(null);
  const subtitle = useRef(null);
  const arrow = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const lines = title.current.querySelectorAll(".line-inner");
    gsap.fromTo(lines,
      { yPercent: 100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.15,
        ease: "power4.out",
      }
    );

    gsap.from(subtitle.current, {
      y: 40,
      opacity: 0,
      delay: 0.5,
      duration: 1,
      ease: "power3.out",
    });

    gsap.to(arrow.current, {
      y: 15,
      repeat: -1,
      yoyo: true,
      duration: 1,
      ease: "sine.inOut",
    });

    gsap.to(arrow.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "30% top",
        scrub: true,
      }
    });

    gsap.to(".hero-noise", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });
  }, []);

  return (
    <section className="hero" ref={heroRef}>

      <div className="hero-noise" />

      <div className="hero-content">

        <p className="hero-tag">
          ABOUT CONSCIENTIA
        </p>

        <h1 ref={title}>
          <div className="line-wrapper">
            <span className="line-inner">Building</span>
          </div>
          <div className="line-wrapper">
            <span className="line-inner">Tomorrow's</span>
          </div>
          <div className="line-wrapper">
            <span className="line-inner">Innovators.</span>
          </div>
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