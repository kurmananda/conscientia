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

      const distance = container.scrollWidth - window.innerWidth;

      const horizontalTween = gsap.to(container, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      panels.forEach((panel) => {
        const image = panel.querySelector(".story-image");
        const content = panel.querySelector(".story-content");

        if (image) {
          gsap.fromTo(
            image,
            {
              scale: 1.2,
              opacity: 0,
            },
            {
              scale: 1,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: horizontalTween,
                start: "left center",
                end: "right center",
                scrub: true,
              },
            }
          );
        }

        if (content) {
          gsap.from(content.children, {
            y: 60,
            opacity: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: horizontalTween,
              start: "left center",
            },
          });
        }
      });

      ScrollTrigger.refresh();
    }, section);

    return () => {
      ctx.revert();
    };
  }, [sectionRef, containerRef]);
}