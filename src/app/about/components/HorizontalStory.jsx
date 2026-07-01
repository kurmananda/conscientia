"use client";

import { useRef } from "react";
import useHorizontalScroll from "../hooks/useHorizontalScroll";

const panels = [
  {
    no: "01",
    title: "Beyond\nProjects",
    text:
      "We don't just build projects. We build curious minds capable of solving real-world problems.",
    image: "/aboutImages/about1.jpg",
  },
  {
    no: "02",
    title: "Technology\nMeets Vision",
    text:
      "Artificial Intelligence, Space Technology, Robotics and Software Engineering working together.",
    image: "/aboutImages/about2.jpg",
  },
  {
    no: "03",
    title: "Community\nFirst",
    text:
      "Hackathons, workshops, mentorship and collaboration shape tomorrow's innovators.",
    image: "/aboutImages/about3.jpg",
  },
  {
    no: "04",
    title: "Create\nThe Future",
    text:
      "The future belongs to those who build it. Conscientia exists to help students become one of them.",
    image: "/aboutImages/about4.jpg",
  },
];

export default function HorizontalStory() {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  useHorizontalScroll(sectionRef, containerRef);

  return (
    <section className="horizontal-section" ref={sectionRef}>
      <div className="horizontal-container" ref={containerRef}>
        {panels.map((panel) => (
          <div className="story-panel" key={panel.no}>
            <div className="story-content">
              <span>{panel.no}</span>

              <h2>
                {panel.title.split("\n").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </h2>

              <p>{panel.text}</p>
            </div>

            <div className="story-image-wrapper">
              <img
                className="story-image"
                src={panel.image}
                alt={panel.title}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}