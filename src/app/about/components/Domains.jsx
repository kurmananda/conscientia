"use client";

import { useState, useLayoutEffect } from "react";
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

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      gsap.from(".domains-header > *", {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".domains-section",
          start: "top 80%",
        },
      });

      gsap.from(".domain-card", {
        y: 80,
        rotationX: 10,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".domains-list",
          start: "top 85%",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -(y - centerY) / 25;
    const rotateY = (x - centerX) / 35;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: "power2.out",
    });

    const img = card.querySelector(".domain-image img");
    if (img) {
      const moveX = (x - centerX) / 20;
      const moveY = (y - centerY) / 20;
      gsap.to(img, {
        x: moveX,
        y: moveY,
        scale: 1.12,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });

    const img = card.querySelector(".domain-image img");
    if (img) {
      gsap.to(img, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  return (
    <section className="domains-section">
      <div className="domains-header">
        <p>WHAT WE DO</p>
        <h2>Our Domains</h2>
      </div>

      <div className="domains-list">
        {domains.map((domain, index) => (
          <div
            key={domain.id}
            className={`domain-card ${active === index ? "active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="domain-left">
              <span className="domain-number">0{index + 1}</span>
              <div>
                <h3>{domain.short}</h3>
                <h4>{domain.title}</h4>
                <p>{domain.description}</p>
              </div>
            </div>

            <div className="domain-image">
              <img src={domain.image} alt={domain.title} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}