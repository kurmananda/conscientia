"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Menu, X } from "lucide-react";

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when menu is active
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
  }, [isMenuOpen]);

  const navLinks = [
    { label: "HOME", path: "/" },
    { label: "ABOUT", path: "/about" },
    { label: "WORKSHOPS", path: "/online-workshops" },
    { label: "EVENTS", path: "/events" },
    { label: "ACCOMMODATION", path: "/accommodation" },
    { label: "CONTACT US", path: "/contact-us" },
  ];

  const socialLinks = [
    { label: "Instagram", href: "https://www.instagram.com/conscientia.iist/" },
    { label: "LinkedIn", href: "https://in.linkedin.com/company/conscientia-iist-thiruvananthapuram" },
    { label: "YouTube", href: "https://www.youtube.com/channel/UCx47j3_OXElUMTBbMe-jYjw" },
  ];

  // The "Lando" Easing - Heavy start, smooth finish
  const expoTransition = { duration: 0.9, ease: [0.85, 0, 0.15, 1] };

  return (
    <>
      {/* --- Sleek Floating Navbar (Glassmorphism, No Border) --- */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] z-[100] transition-all duration-700 rounded-3xl flex items-center justify-between px-6 md:px-10 border border-transparent ${
        scrolled 
          ? "h-16 border-white/[0.06] bg-black/55 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]" 
          : "h-20 md:h-24 bg-black/20 backdrop-blur-md border-white/[0.04]"
      }`}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, rotate: -5 }}
        >
          <Link href="/" className="block">
            <Image src="/assets/logo.svg" alt="Logo" width={45} height={45} className="w-10 h-10 rounded-sm object-contain drop-shadow-2xl" />
          </Link>
        </motion.div>

        <div className="flex items-center gap-8 relative z-[110]">
          <Link href="/profile" className="text-white/40 hover:text-cyan-400 transition-all duration-300 hover:scale-110">
            <UserRound size={22} />
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="flex items-center group overflow-hidden"
          >
            <div className="flex flex-col items-end mr-3 overflow-hidden">
                <span className="text-[9px] font-syncopate tracking-[0.4em] text-white/50 group-hover:text-cyan-400 transition-colors duration-300">
                    {isMenuOpen ? "CLOSE" : "MENU"}
                </span>
            </div>
            <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Custom Hamburger Animation */}
                <div className="flex flex-col gap-1.5 items-end">
                    <motion.span 
                        animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 4 : 0, width: isMenuOpen ? 24 : 20 }}
                        className="h-[2px] bg-white block rounded-full"
                    />
                    <motion.span 
                        animate={{ opacity: isMenuOpen ? 0 : 1, width: 28 }}
                        className="h-[2px] bg-white block rounded-full"
                    />
                    <motion.span 
                        animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -4 : 0, width: isMenuOpen ? 24 : 16 }}
                        className="h-[2px] bg-white block rounded-full"
                    />
                </div>
            </div>
          </button>
        </div>
      </nav>

      {/* --- Synchronized Split Menu --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[90] flex overflow-hidden">
            
            {/* Left Side: Sliding Blur Panel */}
            <motion.div
              initial={{ x: "-100%", backdropFilter: "blur(0px)" }}
              animate={{ x: 0, backdropFilter: "blur(24px)" }}
              exit={{ x: "-100%", backdropFilter: "blur(0px)" }}
              transition={expoTransition}
              onClick={() => setIsMenuOpen(false)}
              className="hidden md:block w-1/2 h-full bg-black/40 border-r border-white/[0.03] cursor-pointer"
            >
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 0.5 }}
                    className="h-full w-full flex items-center justify-center pointer-events-none"
                >
                    <Image src="/assets/logo.svg" alt="" width={400} height={400} className="grayscale brightness-100" />
                </motion.div>
            </motion.div>

            {/* Right Side: Content Slide */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={expoTransition}
              className="relative flex h-full w-full flex-col justify-center border-l border-white/[0.06] bg-[#030303] px-10 md:w-1/2 md:px-24"
            >
              {/* Dynamic Glow */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" 
              />

              <div className="flex flex-col gap-3 relative z-10">
                {navLinks.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.3 + i * 0.08, ...expoTransition }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="group inline-block"
                    >
                      {/* Text Transitions: Refined sizing and slower stagger */}
                      <motion.div 
                        className="flex font-syncopate font-bold text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em] uppercase overflow-hidden"
                        whileHover="hovered"
                        initial="initial"
                      >
                        {item.label.split("").map((char, index) => (
                          <div key={index} className="relative overflow-hidden h-[1.15em] inline-block">
                            <motion.span
                              variants={{ initial: { y: 0 }, hovered: { y: "-105%" } }}
                              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay: index * 0.025 }}
                              className="block text-white/90"
                            >
                              {char === " " ? "\u00A0" : char}
                            </motion.span>
                            <motion.span
                              variants={{ initial: { y: "105%" }, hovered: { y: 0 } }}
                              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1], delay: index * 0.025 }}
                              className="absolute inset-0 block text-cyan-400"
                            >
                              {char === " " ? "\u00A0" : char}
                            </motion.span>
                          </div>
                        ))}
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Social Footer */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, ...expoTransition }}
                className="absolute bottom-16 flex flex-col gap-6"
              >
                <div className="flex gap-8 items-center flex flex-col md:flex-row sm:flex-row">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-syncopate uppercase tracking-[0.5em] text-white/20 hover:text-cyan-400 hover:tracking-[0.6em] transition-all duration-500 "
                    >
                      {social.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Nav;