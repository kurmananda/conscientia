"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, ShoppingCart, Menu, X, VolumeX, Hourglass } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";
import useProfile from "../hooks/useProfile";

// Rolls back and forth along the navbar's vertical midline between the logo
// and the button cluster — random travel distance, random duration (slow to
// fast), and continuous rotation at a matching random rate each leg. Stays
// pinned to the center line so it can never poke outside the bar.
function HourglassPendulum() {
  const dirRef = useRef(1);
  const rotationRef = useRef(0);
  const [leg, setLeg] = useState(() => ({ left: 8, duration: 2, rotate: 0 }));

  const pickNextLeg = () => {
    const distance = 15 + Math.random() * 55;
    let nextLeft = leg.left + dirRef.current * distance;
    if (nextLeft >= 92) {
      nextLeft = 92;
      dirRef.current = -1;
    } else if (nextLeft <= 8) {
      nextLeft = 8;
      dirRef.current = 1;
    }
    const duration = (0.7 + Math.random() * 3.3) / 1.5; // random speed: slow to fast, 1.5x overall pace
    rotationRef.current += dirRef.current * (120 + Math.random() * 600);
    setLeg({ left: nextLeft, duration, rotate: rotationRef.current });
  };

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-1/2 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
      style={{ marginLeft: "-10px", marginTop: "-10px" }}
      initial={{ left: "8%", rotate: 0, opacity: 0 }}
      animate={{ left: `${leg.left}%`, rotate: leg.rotate, opacity: 1 }}
      transition={{ duration: leg.duration, ease: "easeInOut" }}
      onAnimationComplete={pickNextLeg}
    >
      <Hourglass size={20} />
    </motion.div>
  );
}

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { playing, muted, toggle: toggleMusic } = useMusic();
  const holdTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const handleDiscPointerDown = () => {
    longPressFiredRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      document.getElementById("site-footer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 3000);
  };
  const clearDiscHold = () => clearTimeout(holdTimerRef.current);
  const handleDiscClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    toggleMusic();
  };

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
    { label: "WORKSHOPS", path: "/workshop" },
    { label: "EVENTS", path: "/events" },
    { label: "MERCH & STAY", path: "/accommodation" },
    { label: "CONTACT US", path: "/contact-us" },
  ];

 const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/conscientia.iist/",
    icon: "/icons/instagram.svg",
  },
  {
    label: "LinkedIn",
    href: "https://in.linkedin.com/company/conscientia-iist-thiruvananthapuram",
    icon: "/icons/linkedin.svg",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCx47j3_OXElUMTBbMe-jYjw",
    icon: "/icons/youtube.svg",
  },
];

  // The "Lando" Easing - Heavy start, smooth finish
  const expoTransition = { duration: 0.9, ease: [0.85, 0, 0.15, 1] };

  return (
    <>
      <style>{`
        @keyframes vinylSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* --- Sleek Floating Navbar (Glassmorphism, No Border) --- */}
      <nav className={`fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[95%] max-w-[100vw] z-[100] transition-all duration-700 rounded-2xl sm:rounded-3xl flex items-center justify-between px-3 sm:px-6 md:px-10 border border-transparent ${
        scrolled
          ? "h-12 sm:h-16 border-cyan-400/[0.08] bg-black/55 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
          : "h-14 sm:h-20 md:h-24 bg-black/20 backdrop-blur-md border-white/[0.04]"
      }`}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, rotate: -5 }}
        >
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="block">
            <Image src="/assets/logo-mark.png" alt="Logo" width={110} height={50} className="w-14 h-auto sm:w-20 object-contain" />
          </Link>
        </motion.div>

        {/* Hourglass flourish — confined to the empty gap between the logo and the
            button cluster (this div's width IS that gap, via flex-1 in a justify-between
            row), so it can never overlap either or poke outside the bar. */}
        <div className="pointer-events-none relative z-[105] block h-full min-w-[36px] flex-1 overflow-hidden">
          <HourglassPendulum />
        </div>

        <div className="flex items-center gap-3 sm:gap-8 relative z-[110]">
          <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-white/40 hover:text-cyan-400 transition-all duration-300 hover:scale-110">
            <UserRound size={18} className="sm:w-[22px] sm:h-[22px]" />
            {user && profile?.unique_code && (
              <span className="inline-block rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-cyan-300">
                {profile.unique_code}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleDiscClick}
            onPointerDown={handleDiscPointerDown}
            onPointerUp={clearDiscHold}
            onPointerLeave={clearDiscHold}
            onPointerCancel={clearDiscHold}
            title="Tap to play/pause · hold 3s for music credits"
            aria-label={playing ? "Pause background music" : "Play background music"}
            aria-pressed={!playing}
            className="relative flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all duration-300 hover:scale-110"
          >
            {/* Sits centered exactly behind the disc (z-108 vs the disc's
                z-110), semi-visible peeking out from under it at rest. While
                muted it spends ~2s rising up from behind into full view,
                holds, then snaps back down behind the disc with a springy
                little jump. While actually playing, music notes drift up
                from behind it instead (below). */}
            {/* Three plain stacked lines — ♪ / Click / me — each reading
                normally left-to-right, no rotation (rotating individual
                spans doesn't reflow their layout box, which is what was
                causing them to overlap). It lives tucked exactly under the
                disc (opacity 0, y 0), slides straight down out from under
                it to appear, holds, then slides back up under the disc and
                disappears again — repeating. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-0 w-0">
              <motion.div
                aria-hidden
                className="absolute left-0 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-2xl border border-cyan-400/40 bg-black/85 px-2 py-1.5 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                animate={
                  muted || !playing
                    ? { y: [0, 22, 22, 0], opacity: [0, 1, 1, 0] }
                    : { y: 0, opacity: 0 }
                }
                transition={
                  muted || !playing
                    ? {
                        duration: 3.4,
                        delay: 5.8,
                        times: [0, 0.3, 0.75, 1],
                        ease: ["backOut", "linear", "backIn"],
                        repeat: Infinity,
                        repeatDelay: 5.8,
                      }
                    : { duration: 0.2 }
                }
              >
                {["♪", "Click", "me"].map((line) => (
                  <span
                    key={line}
                    className="block whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-cyan-300"
                  >
                    {line}
                  </span>
                ))}
              </motion.div>
            </div>

            {!muted &&
              playing &&
              [
                { symbol: "♪", x: 14, duration: 1.8, delay: 0 },
                { symbol: "♫", x: -12, duration: 2.1, delay: 0.4 },
                { symbol: "♬", x: 6, duration: 1.6, delay: 0.8 },
                { symbol: "♪", x: -18, duration: 2.3, delay: 1.2 },
                { symbol: "♫", x: 20, duration: 1.9, delay: 1.6 },
                { symbol: "♩", x: -6, duration: 1.7, delay: 2 },
              ].map((note, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 z-[108] text-cyan-300"
                  animate={{
                    y: [0, -34],
                    x: [0, note.x],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.1],
                    rotate: [0, note.x > 0 ? 15 : -15],
                  }}
                  transition={{
                    duration: note.duration,
                    repeat: Infinity,
                    delay: note.delay,
                    ease: "easeOut",
                  }}
                >
                  {note.symbol}
                </motion.span>
              ))}
            <svg
              viewBox="0 0 44 44"
              className="relative z-[110] w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              style={{ animation: playing ? "vinylSpin 2.4s linear infinite" : "none" }}
            >
              <defs>
                <radialGradient id="vinylBody" cx="35%" cy="28%" r="80%">
                  <stop offset="0%" stopColor="#6b6b6b" />
                  <stop offset="30%" stopColor="#2a2a2a" />
                  <stop offset="70%" stopColor="#161616" />
                  <stop offset="100%" stopColor="#060606" />
                </radialGradient>
                <linearGradient id="vinylSheen" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="30%" stopColor="#fff" stopOpacity="0.08" />
                  <stop offset="55%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="vinylGlint" cx="30%" cy="25%" r="18%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="22" cy="22" r="21" fill="url(#vinylBody)" stroke="#000" strokeWidth="0.5" />

              {[19, 16.5, 14.3, 12.2, 10.3].map((r) => (
                <circle key={r} cx="22" cy="22" r={r} fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="0.4" />
              ))}
              {[19, 16.5, 14.3, 12.2, 10.3].map((r) => (
                <circle key={`hl-${r}`} cx="22" cy="22" r={r} fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="0.3" />
              ))}

              <circle cx="22" cy="22" r="8" fill="currentColor" />
              <circle cx="22" cy="22" r="8" fill="none" stroke="#000" strokeOpacity="0.3" strokeWidth="0.5" />
              <circle cx="22" cy="22" r="1.6" fill="#050505" />

              <circle cx="22" cy="22" r="21" fill="url(#vinylSheen)" />
              <circle cx="22" cy="22" r="21" fill="url(#vinylGlint)" />
            </svg>
            {(muted || !playing) && (
              <VolumeX
                size={12}
                className="absolute -bottom-1 -right-1 z-[110] rounded-full bg-black/80 p-[1px] text-amber-400"
              />
            )}
          </button>

          <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="relative z-[115] text-white/40 hover:text-cyan-400 transition-all duration-300 hover:scale-110">
            <ShoppingCart size={18} className="sm:w-[22px] sm:h-[22px]" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-black">
                {cartItems.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center group overflow-hidden"
          >
            <div className="hidden sm:flex flex-col items-end mr-3 overflow-hidden">
                <span className="text-[9px] font-syncopate tracking-[0.4em] text-white/50 group-hover:text-cyan-400 transition-colors duration-300">
                    {isMenuOpen ? "CLOSE" : "MENU"}
                </span>
            </div>
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                {/* Custom Hamburger Animation */}
                <div className="flex flex-col gap-1.5 items-end">
                    <motion.span
                        animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 4 : 0, width: isMenuOpen ? 20 : 16 }}
                        className="h-[2px] bg-white block rounded-full"
                    />
                    <motion.span
                        animate={{ opacity: isMenuOpen ? 0 : 1, width: 22 }}
                        className="h-[2px] bg-white block rounded-full"
                    />
                    <motion.span
                        animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -4 : 0, width: isMenuOpen ? 20 : 13 }}
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
              className="relative flex h-full w-full flex-col justify-center border-l border-white/[0.06] bg-[#030303] px-6 sm:px-10 md:w-1/2 md:px-24"
            >
              {/* Dynamic Glow */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" 
              />

              <div className="flex flex-col gap-1.5 sm:gap-3 relative z-10">
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
                        className="flex font-syncopate font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em] uppercase overflow-hidden"
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
                className="absolute bottom-8 flex flex-col gap-6"
              >
                <div className="flex space-x-8 gap-3 items-left flex flex-col md:flex-row sm:flex-row">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group text-[10px] font-syncopate font-bold uppercase tracking-[0.5em] text-white/50 hover:text-cyan-400 hover:tracking-[0.6em] transition-all duration-500 ease-out">
                      <div className="flex items-center gap-2">
                    <img
                      src={social.icon}
                      alt={social.label}
                      className="
                        w-5 h-5
                        transition-all
                        duration-500
                        ease-out
                        group-hover:scale-125
                        group-hover:-translate-y-1
                      "
                    />

                    <span>{social.label}</span>
                </div>
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