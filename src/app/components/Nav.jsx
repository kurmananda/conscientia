"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bodoni_Moda, Inter } from "next/font/google";
import Link from "next/link";
import DecryptedText from "../ui/decrypt_text";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu } from "lucide-react";
import Threads from "../ui/threads";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/lightswind/avatar";
import TargetCursor from "../ui/target_cursor";

/**
 * Main Navigation Component
 * Handles the floating navbar and the full-screen overlay menu.
 */
const Nav = () => {
  // --- State & Handlers ---
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle scroll effect for navbar resizing
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <TargetCursor />

      {/* --- Floating Navbar --- */}
      <nav
        className={`fixed left-1/2 -translate-x-1/2 transition-all duration-500 w-[95%] max-w-[1024px] rounded-[1.5rem] flex items-center justify-between px-3 md:px-5 z-[60] ${scrolled ? "top-2 md:top-4 h-[65px]" : "top-4 md:top-6 h-[75px]"
          } ${isMenuOpen
            ? "opacity-0 pointer-events-none"
            : "backdrop-blur-xl bg-grey border border-slate-700 border-[1.5px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-100"
          }`}>
        
        {/* Left Section: Logo */}
        <div className="flex items-center z-50">
          <Link href="/" string="magnetic" className="cursor-target pointer-events-auto transition-transform hover:scale-110 duration-200 shrink-0">
            <Image src="/assets/logo.svg" alt="Logo" width={65} height={65} className="w-[40px] h-[50px] md:w-[80px] md:h-[70px] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </Link>
        </div>

        {/* Center Section: Branding Text */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 whitespace-nowrap pointer-events-none">
          <Link href="/" className="cursor-target pointer-events-auto relative flex items-center no-underline px-2 py-1">
            <DecryptedText
              text="CONSCIENTIA 2k26"
              animateOn="view"
              revealDirection="center"
              sequential={true}
              loop={true}
              pauseTime={1000}
              speed={50}
              className="font-syncopate text-sm sm:text-lg md:text-xl lg:text-2xl tracking-widest uppercase text-white"
              encryptedClassName="font-syncopate text-sm sm:text-lg md:text-xl lg:text-2xl tracking-widest uppercase text-cyan/70"
            />
          </Link>
        </div>

        {/* Right Section: Utility Icons & Menu Toggle */}
        <div className="flex items-center gap-1 md:gap-2 z-50">
          {/* Profile - Hidden on Mobile */}
          <Link
            href="/profile"
            className="hidden md:flex cursor-target text-white hover:text-white transition-colors p-1 md:p-1.5 hover:bg-white/10 rounded-full">
            <Avatar className="w-6 h-6 md:w-7.5 md:h-7.5 bg-white/20">
              <AvatarImage src="" />
              <AvatarFallback className="text-[10px] bg-transparent text-white font-black">
                U
              </AvatarFallback>
            </Avatar>
          </Link>
          
          {/* Store - Hidden on Mobile in Navbar (Moved to Menu) */}
          <Link
            href="/store"
            string="magnetic"
            className="hidden md:flex cursor-target relative group overflow-hidden rounded-lg p-1.5 flex items-center justify-center">
            <span className="absolute inset-0 w-full h-full bg-cyan-400 transform -translate-y-[101%] group-hover:translate-y-0 transition-transform duration-[400ms] ease-out rounded-lg" />
            <ShoppingBag
              className="relative z-10 w-6 h-6 md:w-7 md:h-7 text-white group-hover:text-black transition-colors duration-300"
              strokeWidth={2}
            />
          </Link>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            string="magnetic"
            className="cursor-target relative group overflow-hidden rounded-lg p-1.5 focus:outline-none flex flex-col justify-center items-center w-10 h-10">
            <span className="absolute inset-0 w-full h-full bg-cyan-400 transform -translate-y-[101%] group-hover:translate-y-0 transition-transform duration-[400ms] ease-out rounded-lg" />
            {isMenuOpen ? (
              <>
                <div className="h-[2.5px] w-6 md:w-7 bg-white group-hover:bg-black transition-colors duration-300 absolute rotate-45 relative z-10" />
                <div className="h-[2.5px] w-6 md:w-7 bg-white group-hover:bg-black transition-colors duration-300 absolute -rotate-45 relative z-10" />
              </>
            ) : (
              <>
                <div className="h-[2.5px] w-6 md:w-7 bg-white group-hover:bg-black transition-colors duration-300 mb-1.5 relative z-10" />
                <div className="h-[2.5px] w-6 md:w-7 bg-white group-hover:bg-black transition-colors duration-300 mb-1.5 relative z-10" />
                <div className="h-[2.5px] w-6 md:w-7 bg-white group-hover:bg-black transition-colors duration-300 relative z-10" />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* --- Full-Screen Overlay Menu --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 w-full h-[100dvh] bg-[#1a1d13] z-[45] flex flex-col pointer-events-auto overflow-hidden">
            
            {/* Background Decoration: Topographic/Contour Lines Overlay */}
            <div className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none mix-blend-overlay overflow-hidden">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <filter id="noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" stitchTiles="stitch" />
                  <feDisplacementMap in="SourceGraphic" scale="20" />
                </filter>
                <path d="M-100,200 Q300,50 600,300 T1200,100" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
                <path d="M-100,400 Q400,200 800,500 T1400,200" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
                <path d="M-100,600 Q500,400 900,700 T1500,400" fill="none" stroke="white" strokeWidth="1" opacity="0.1" />
                <path d="M0,0 L100%,100%" stroke="none" filter="url(#noise)" opacity="0.1" />
              </svg>
            </div>

            {/* Top Bar Actions */}
            <div className="relative z-[100] w-full flex justify-between items-center py-6 px-6 md:px-10">
              {/* Store Button (Mobile Version) */}
              <Link
                href="/store"
                onClick={() => setIsMenuOpen(false)}
                className="cursor-target flex items-center gap-2 bg-[#C6FF00] text-black px-4 py-2.5 rounded-lg font-bold text-sm tracking-tighter uppercase transition-transform hover:scale-105 active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
                <span>STORE</span>
              </Link>

              {/* Close Button */}
              <button
                onClick={() => setIsMenuOpen(false)}
                className="cursor-target w-11 h-11 bg-white hover:bg-white/90 text-black flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90"
              >
                <span className="text-2xl font-light">×</span>
              </button>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-8 text-center">
              
              {/* Primary Navigation Links */}
              <div className="flex flex-col items-center gap-6 md:gap-8">
                {[
                  { label: "HOME", path: "/" },
                  { label: "ON TRACK", path: "/workshop" },
                  { label: "OFF TRACK", path: "/events" },
                  { label: "CALENDAR", path: "/accommodation" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: 0.1 + i * 0.05,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="cursor-target relative group py-2"
                    >
                      <span className="font-syncopate font-black text-4xl sm:text-5xl md:text-6xl tracking-tight uppercase text-[#e2e8f0]/90 transition-colors group-hover:text-white">
                        {item.label}
                      </span>
                      {/* Animated Strikethrough-like indicator (Wave) */}
                      <motion.div 
                        className="absolute left-0 bottom-1/2 w-full h-[6px] bg-[#C6FF00] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ originX: 0 }}
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Decorative Middle Section (Replaces Logo) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-16 mb-4"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-white/20 rounded-full flex items-center justify-center">
                  <Image
                    src="/assets/logo.svg"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain opacity-60 mix-blend-screen grayscale"
                  />
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-syncopate text-[10px] md:text-xs tracking-[0.4em] text-white/40 uppercase mb-20"
              >
                CONSCIENTIA SINCE 2026
              </motion.p>

              {/* Footer Actions */}
              <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-6">
                <Link
                  href="/contact-us"
                  onClick={() => setIsMenuOpen(false)}
                  className="cursor-target font-syncopate text-[11px] md:text-[13px] tracking-[0.2em] text-[#C6FF00]/90 hover:text-[#C6FF00] uppercase underline underline-offset-8 decoration-1"
                >
                  BUSINESS ENQUIRIES
                </Link>

                {/* Socials */}
                <div className="flex items-center gap-8 md:gap-12">
                  {["TIKTOK", "INSTAGRAM", "YOUTUBE", "TWITTER"].map((social) => (
                    <Link
                      key={social}
                      href="#"
                      className="cursor-target font-syncopate text-[10px] md:text-[11px] tracking-[0.15em] text-white/60 hover:text-white transition-colors"
                    >
                      {social}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Nav;
