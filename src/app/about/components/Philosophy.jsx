"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const values = [
  "Curiosity",
  "Collaboration",
  "Innovation",
  "Impact",
];

export default function Philosophy() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".philosophy-label", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      gsap.from(".value-item", {
        opacity: 0,
        x: -80,
        stagger: 0.18,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".values-list",
          start: "top 75%",
        },
      });

      gsap.from(".team-image", {
        opacity: 0,
        scale: 1.12,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".team-image-wrapper",
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="philosophy-section" ref={sectionRef}>
      <div className="philosophy-grid">

        <div className="values-column">

          <p className="philosophy-label">
            OUR PHILOSOPHY
          </p>

          <h2 className="philosophy-heading">
            The values that
            <br />
            define us.
          </h2>

          <div className="values-list">

            {values.map((value) => (

              <div className="value-item" key={value}>

                <span>●</span>

                <h3>{value}</h3>

              </div>

            ))}

          </div>

        </div>

        <div className="team-image-wrapper">

          <img
            src="/aboutImages/team.jpg"
            className="team-image"
            alt="Conscientia Team"
          />

        </div>

      </div>
    </section>
  );
}