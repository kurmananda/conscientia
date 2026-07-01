"use client";

import { useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const domains = [
  {
    id: 1,
    title: "Artificial Intelligence",
    short: "AI",
    description:
      "Machine Learning, Deep Learning, Computer Vision, NLP, LLMs and Generative AI.",
    image: "/aboutImages/domain-ai.jpg",
  },
  {
    id: 2,
    title: "Space Technology",
    short: "SPACE",
    description:
      "CubeSats, satellite systems, embedded electronics and aerospace research.",
    image: "/aboutImages/domain-space.jpg",
  },
  {
    id: 3,
    title: "Software Development",
    short: "DEV",
    description:
      "Full Stack Development, Mobile Apps, Cloud, APIs and scalable systems.",
    image: "/aboutImages/domain-dev.jpg",
  },
  {
    id: 4,
    title: "Research & Innovation",
    short: "R&D",
    description:
      "Turning ideas into impactful research through experimentation and collaboration.",
    image: "/aboutImages/domain-research.jpg",
  },
];

export default function Domains() {
  const [active, setActive] = useState(0);

  return (
    <section className="domains-section">

      <div className="domains-header">

        <p>WHAT WE DO</p>

        <h2>
          Our Domains
        </h2>

      </div>

      <div className="domains-list">

        {domains.map((domain, index) => (

          <div
            key={domain.id}
            className={`domain-card ${
              active === index ? "active" : ""
            }`}
            onMouseEnter={() => setActive(index)}
          >

            <div className="domain-left">

              <span className="domain-number">
                0{index + 1}
              </span>

              <div>

                <h3>{domain.short}</h3>

                <h4>{domain.title}</h4>

                <p>{domain.description}</p>

              </div>

            </div>

            <div className="domain-image">

              <img
                src={domain.image}
                alt={domain.title}
              />

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}