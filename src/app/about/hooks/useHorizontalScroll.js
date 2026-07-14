"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useHorizontalScroll(sectionRef, containerRef) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;

    if (!section || !container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      const panels = gsap.utils.toArray(".story-panel");
      if (panels.length === 0) return;

      gsap.set(panels, {
        zIndex: (i) => i + 10,
        filter: "blur(0px)",
      });

      if (panels.length > 1) {
        gsap.set(panels.slice(1), { xPercent: 100 });
      }

      const firstContent = panels[0].querySelector(".story-content");
      if (firstContent) {
        const lines = firstContent.querySelectorAll(".line-inner");
        const p = firstContent.querySelector("p");
        
        gsap.fromTo(
          lines,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }
        );
        if (p) {
          gsap.fromTo(
            p,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.4 }
          );
        }
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + (panels.length - 1) * 100 + "%",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      tl.to(".horizontal-progress-fill", {
        width: "100%",
        ease: "none",
      }, 0);

      panels.forEach((panel, i) => {
        if (i === 0) return;

        const prevPanel = panels[i - 1];
        const prevImage = prevPanel.querySelector(".story-image");
        const currImage = panel.querySelector(".story-image");
        const currLines = panel.querySelectorAll(".line-inner");
        const currP = panel.querySelector("p");

        const label = `panel-${i}`;

        if (currImage) {
          gsap.set(currImage, { xPercent: -20, scale: 1.15 });
        }

        tl.add(label);

        tl.to(panel, {
          xPercent: 0,
          filter: "blur(0px)",
          ease: "none",
        }, label);

        if (currImage) {
          tl.to(currImage, {
            xPercent: 0,
            scale: 1,
            ease: "none",
          }, label);
        }

        tl.to(prevPanel, {
          xPercent: -15,
          scale: 0.92,
          opacity: 0.35,
          filter: "blur(6px)",
          ease: "none",
        }, label);

        if (prevImage) {
          tl.to(prevImage, {
            xPercent: 15,
            ease: "none",
          }, label);
        }

        if (currLines.length > 0) {
          tl.fromTo(
            currLines,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, stagger: 0.08, ease: "power2.out" },
            `${label}+=0.1`
          );
        }

        if (currP) {
          tl.fromTo(
            currP,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, ease: "power2.out" },
            `${label}+=0.3`
          );
        }
      });

      ScrollTrigger.refresh();
    }, section);

    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      clearTimeout(refreshTimeout);
      ctx.revert();
    };
  }, [sectionRef, containerRef]);
}