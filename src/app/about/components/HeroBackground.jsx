"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function HeroBackground() {
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    
    // Parallax: translate background down slower, scale up, and fade opacity slightly
    const y = useTransform(scrollY, [0, 800], [0, 200]);
    const scale = useTransform(scrollY, [0, 800], [1, 1.15]);
    const opacity = useTransform(scrollY, [0, 800], [1, 0.5]);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            <motion.div 
                style={{ y, scale, opacity }}
                className="absolute inset-0 w-full h-full"
            >
                <Image
                    src="/images/iist-campus.jpg"
                    alt="IIST Campus"
                    fill
                    priority
                    className="object-cover"
                />
            </motion.div>
            
            {/* Dark Overlays */}
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
        </div>
    );
}
