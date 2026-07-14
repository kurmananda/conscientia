"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo(".cta-title div",
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );

      gsap.from(".cta-subtitle", {
        opacity: 0,
        y: 30,
        delay: .4,
        duration: .8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".cta-buttons", {
        opacity: 0,
        y: 30,
        delay: .6,
        duration: .8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.fromTo(".cta-glow-1",
        { yPercent: -25 },
        {
          yPercent: 25,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        }
      );

      gsap.fromTo(".cta-glow-2",
        { yPercent: 25 },
        {
          yPercent: -25,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="cta-section" ref={sectionRef}>

      {/* Floating neon glows */}
      <div className="cta-glow cta-glow-1" />
      <div className="cta-glow cta-glow-2" />

      <div className="cta-container">

        <p className="cta-tag">
          JOIN CONSCIENTIA
        </p>

        <h2 className="cta-title">

          <div>Ready to</div>

          <div>Build the</div>

          <div>Future?</div>

        </h2>

        <p className="cta-subtitle">

          Become a part of a community that
          learns, builds and innovates together.

        </p>

        <div className="cta-buttons">

          <Link href="/events" className="primary-btn">
            Explore Events
          </Link>

          <Link href="/contact-us" className="secondary-btn">
            Contact Us
          </Link>

        </div>

      </div>

    </section>
  );
}