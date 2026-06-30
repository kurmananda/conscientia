"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function AboutBackground() {
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    
    // Parallax scroll effects optimized for the entire page scroll range
    // Vertically translate the starry sky image slower to create a nice deep parallax effect
    const y = useTransform(scrollY, [0, 4000], [0, -300]);
    // Zoom in slowly as the user scrolls to feel like moving into space
    const scale = useTransform(scrollY, [0, 4000], [1, 1.15]);

    return (
        <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <motion.div 
                style={{ y, scale }}
                className="absolute top-0 left-0 w-full h-[120vh]"
            >
                <Image
                    src="/images/bg-galaxy.jpg"
                    alt="Starry Background"
                    fill
                    priority
                    className="object-cover"
                />
            </motion.div>
            
            {/* Dark glassmorphic overlays for text readability */}
            <div className="absolute inset-0 bg-black/65" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>
    );
}
