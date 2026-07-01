"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    number: 500,
    suffix: "+",
    label: "Community Members",
  },
  {
    number: 30,
    suffix: "+",
    label: "Projects",
  },
  {
    number: 40,
    suffix: "+",
    label: "Events",
  },
  {
    number: 8,
    suffix: "",
    label: "Domains",
  },
];

export default function Stats() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.from(".stats-heading", {
        y: 50,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      const cards = sectionRef.current.querySelectorAll(".stat-card");

cards.forEach((card) => {
  gsap.from(card, {
    y: 80,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });
});

      const numbers = sectionRef.current.querySelectorAll(".stat-number");
      numbers.forEach((el) => {
        const target = Number(el.dataset.value);

        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2,
            snap: { innerText: 1 },
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          }
        );
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="stats-section" ref={sectionRef}>

      <div className="stats-heading">

        <p>OUR IMPACT</p>

        <h2>
          Numbers that
          <br />
          reflect our journey.
        </h2>

      </div>

      <div className="stats-grid">

        {stats.map((stat) => (

          <div className="stat-card" key={stat.label}>

            <h3>

              <span
                className="stat-number"
                data-value={stat.number}
              >
                0
              </span>

              {stat.suffix}

            </h3>

            <p>{stat.label}</p>

          </div>

        ))}

      </div>

    </section>
  );
}