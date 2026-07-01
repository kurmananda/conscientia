"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Mission() {
  const section = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.from(".mission-label", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        scrollTrigger: {
          trigger: section.current,
          start: "top 75%",
        },
      });

      gsap.from(".mission-title div", {
        opacity: 0,
        y: 80,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section.current,
          start: "top 70%",
        },
      });

      gsap.from(".mission-description", {
        opacity: 0,
        y: 40,
        duration: 1,
        delay: 0.2,
        scrollTrigger: {
          trigger: section.current,
          start: "top 70%",
        },
      });

      gsap.from(".mission-image", {
        opacity: 0,
        scale: 1.15,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section.current,
          start: "top 70%",
        },
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="mission-section" ref={section}>

      <div className="mission-grid">

        <div className="mission-left">

          <p className="mission-label">
            OUR MISSION
          </p>

          <h2 className="mission-title">

            <div>We don't prepare</div>

            <div>students for</div>

            <div>the future.</div>

            <div className="gold-line">
              We build the people
            </div>

            <div>who create it.</div>

          </h2>

          <p className="mission-description">

            Conscientia is a student-driven innovation community
            where curiosity evolves into research, collaboration,
            engineering and real-world impact.

          </p>

        </div>

        <div className="mission-right">

          <img
            src="/aboutImages/mission.jpg"
            className="mission-image"
            alt="Mission"
          />

        </div>

      </div>

    </section>
  );
}