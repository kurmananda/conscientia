"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.from(".cta-title div", {
        y: 120,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".cta-subtitle", {
        opacity: 0,
        y: 40,
        delay: .4,
        duration: .8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".cta-buttons", {
        opacity: 0,
        y: 40,
        delay: .6,
        duration: .8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="cta-section" ref={sectionRef}>

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

          <button className="primary-btn">
            Explore Events
          </button>

          <button className="secondary-btn">
            Contact Us
          </button>

        </div>

      </div>

    </section>
  );
}