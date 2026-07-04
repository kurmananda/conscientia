  "use client";

import { motion, useScroll, useTransform, AnimatePresence, } from "framer-motion";
import { useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Satellite,
  Zap,
  Rocket,
  Cpu,
  Brain,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Package,
  Star,
  X
} from "lucide-react";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import Hyperspeed from "./components/Hyperspeed";
import MerchPromoNotification from "./components/MerchPromoNotification";

/** Memoized — Hyperspeed re-inits WebGL when this object identity changes (see reactbits.dev). */
const HYPERSPEED_OPTIONS = {
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 20,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 80,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [120, 160],
  movingCloserSpeed: [-160, -200],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3,
  },
};

export default function Home() {
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const expoTransition = { duration: 0.2, ease: [0.85, 0, 0.15, 1] };

  const hyperspeedEffectOptions = useMemo(() => HYPERSPEED_OPTIONS, []);

  // --- SCROLL LOGIC ---

  const IMAGES = [
    '/imags/1.jpeg',
    '/imags/2.jpeg',
    '/imags/3.jpeg',
    '/imags/4.jpeg',
    '/imags/5.jpeg',
    '/imags/6.jpeg',
    '/imags/7.jpeg',
    '/imags/8.jpeg',
    '/imags/9.jpeg',
    '/imags/10.jpeg',
    '/imags/11.jpeg',
    '/imags/12.jpeg',
    '/imags/13.jpeg',
    '/imags/14.jpeg',
    '/imags/15.jpeg',
    '/imags/16.jpeg',
    '/imags/17.jpeg',
    '/imags/18.jpeg',
    '/imags/19.jpeg',
    '/imags/20.jpeg',
    '/imags/21.jpeg',
    '/imags/22.jpeg',
    '/imags/23.jpeg',
    '/imags/24.jpeg',
    '/imags/25.jpeg',
    '/imags/26.jpeg',
    '/imags/27.jpeg',
    '/imags/28.jpeg',
    '/imags/29.jpeg',
  ];
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false // Helps with centering loops
    },
    [
      Autoplay({
        delay: 500, // 0.5s as requested
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: true
      })
    ]
  );

  const handleMouseEnter = useCallback(() => {
    emblaApi?.plugins().autoplay.stop();
  }, [emblaApi]);

  const handleMouseLeave = useCallback(() => {
    emblaApi?.plugins().autoplay.play();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const workshopCartel = [
    {
      title: 'Cube Sat Workshop',
      price: 349,
      desc: '20th June 2026',
      details : ['1. End to end concepts of Cubesat design', '2. Learn from experts who have worked on in-flight satellites.', '3. Understand mission design and space fundamentals'],
      icon: <Satellite size={20} />,
      cat : 'space',
    },
    {
      title: 'Launch Vehicle Workshop',
      price: 349,
      desc: '27th June 2026',
      details : ['1. End to end concepts of Launch Vehicles', '2. Understand mission design and space fundamentals', '3. Explore propulsion, staging, and flight dynamics basics'],
      icon: <Rocket size={20} />,
      cat : 'space',
    },
    {
      title: 'Agentic AI Workshop',
      price: 299,
      desc: '28th June 2026',
      details : ['1. Explore the basics of prompt engineering', '2. Optimize AI usage for maximum productivity', '3. Hands on learning with AI agents.'],
      icon: <Cpu size={20} />,
      cat : 'tech',
    },
    {
      title: 'Python ML Workshop',
      price: 299,
      desc: '21st June 2026',
      details : ['1. Explore the basics of python and machine learning', '2. Understand concepts with application focused learning', '3. Develop industry focused skills.'],
      icon: <Brain size={20} />,
      cat : 'tech',
    },
  ];

  return (
    <main className="bg-[#050505] min-h-screen text-white selection:bg-cyan-500/30 overflow-x-hidden relative">

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0">
          <Hyperspeed effectOptions={hyperspeedEffectOptions} />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#050505]/45 to-[#050505]"
          aria-hidden
        />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 flex h-screen flex-col items-center justify-center px-6">
        <div className="relative space-y-10 text-center">
          <motion.div
            initial={{ opacity: 0, letterSpacing: "1.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.8em" }}
            transition={{ duration: 1.5 }}
            className="font-syncopate text-cyan-500 text-[10px] md:text-xs uppercase font-bold"
          >
            Technical Fest
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "110%", rotateX: 50 }}
              animate={{ y: 0, rotateX: 0 }}
              transition={expoTransition}
              className="text-[14vw] md:text-[10vw] font-syncopate font-bold leading-[0.75] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
            >
              CONSCIENTIA
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
            className="text-center max-w-xl mx-auto text-md md:text-md tracking-[0.2em] uppercase leading-loose items-center gap-4 flex flex-col text-white/40"
          >
            TIME FALL <br /> <span className="text-xs md:text-xs">Directed by Indian Institute of Space Science and Technology (IIST).</span>
            <Image src="/assets/iistlogo.png" alt="Logo" width={55} height={55} className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </motion.p>

          <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.2, duration: 1 }} className="pt-12 flex flex-col items-center gap-6">
            <button onClick={() => { location.href = "/online-workshops" }} className="group flex flex-col items-center gap-6 cursor-pointer bg-transparent border-none appearance-none">
              <div className="h-16 w-[1px] bg-cyan-500 group-hover:h-24 group-hover:bg-white transition-all duration-200 relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full blur-[2px]" />
              </div>
              <span className="font-syncopate text-[9px] tracking-[0.5em] text-white/40 group-hover:text-cyan-400 transition-colors uppercase">Register for a Workshop</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- MERCH PROMO STRIP --- */}
      <section className="relative z-10 px-4 sm:px-6 -mt-8 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.85, 0, 0.15, 1] }}
          className="max-w-4xl mx-auto"
        >
          <Link
            href="/online-workshops"
            className="group relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 overflow-hidden rounded-[2rem] border border-cyan-500/25 bg-[#0A0A0A]/80 backdrop-blur-xl p-5 sm:p-6 hover:border-cyan-400/50 hover:shadow-[0_0_50px_rgba(6,182,212,0.2)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex gap-2 shrink-0">
              <motion.div
                whileHover={{ rotate: -3, scale: 1.05 }}
                className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 shadow-lg"
              >
                <Image
                  src="/assets/wsfront.png"
                  alt="Merch front"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </motion.div>
              <motion.div
                whileHover={{ rotate: 3, scale: 1.05 }}
                className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 shadow-lg -ml-4 mt-4"
              >
                <Image
                  src="/assets/wsback.png"
                  alt="Merch back"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </motion.div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-3">
                <Package size={10} />
                Limited drop
              </span>
              <h2 className="font-syncopate text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Get official <span className="text-cyan-400">Space Merch</span>
              </h2>
              <p className="text-sm text-white/45 mt-2 max-w-md mx-auto sm:mx-0">
                Hoodie-style kit for Conscientia 2026. Pick your size and delivery address on the registration page.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-white text-black group-hover:bg-cyan-400 transition-colors duration-300">
              <span className="font-syncopate text-2xl font-black">₹599</span>
              <span className="font-syncopate text-[9px] uppercase tracking-[0.25em] flex items-center gap-1">
                Register
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* --- WORKSHOP CARTEL --- */}
      <section className="min-h-[70vh] py-24 relative z-10 flex items-center">
        <div className="container mx-auto px-6 md:px-20 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-12">
            <motion.div initial={{ x: -80, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={expoTransition} className="space-y-4">
              <span className="font-mono text-[10px] text-cyan-500 tracking-[0.6em] uppercase font-black">// CLASSIFIED MODULES</span>
              <h2 className="font-syncopate text-4xl md:text-6xl tracking-tighter uppercase leading-none">Workshop<br /><span className="text-white/50 italic">Cartel</span></h2>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <Link
                href="/online-workshops"
                className="group relative flex items-center gap-6 bg-white px-10 py-5 rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all duration-500"
              >
                <span className="relative z-10 font-syncopate text-[11px] tracking-widest text-black font-black uppercase">Registration Page</span>
                <div className="relative z-10 w-8 h-8 rounded-full bg-black flex items-center justify-center text-white group-hover:rotate-45 transition-transform duration-400">
                  <ChevronRight size={18} />
                </div>
                <div className="absolute inset-0 bg-cyan-400 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-[0.85,0,0.15,1]" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            <div className="flex flex-col gap-4">
              {workshopCartel.slice(0, 4).map((w, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {setSelectedWorkshop(w)}}
                  whileHover={{ scale: 1.02, rotateX: -5, rotateY: 5 }}
                  className={`group relative h-[150px] cursor-pointer bg-[#0A0A0A]/60 border ${w.highlight ? 'border-cyan-500/30' : 'border-white/5'} rounded-3xl p-6 flex flex-col justify-between overflow-hidden backdrop-blur-xl hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <motion.div
                        animate={hoveredIndex === index ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center  ${w.highlight ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white/40 group-hover:text-cyan-400'}`}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          rotate: { duration: 0.4, ease: "circOut" }
                        }}
                      >
                        {w.icon}
                      </motion.div>
                      <div>
                        <span className="block font-syncopate text-sm text-cyan-500/60 uppercase mb-1 tracking-widest">{w.cat}</span>
                        <h3 className="font-syncopate text-xl tracking-wider uppercase group-hover:text-cyan-400 transition-colors">{w.title}</h3>
                      </div>
                    </div>
                    {w.highlight && <div className="bg-cyan-500 text-black font-syncopate text-[7px] px-2 py-0.5 rounded-full font-bold uppercase">Hot</div>}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="font-syncopate font-bold text-lg">Rs. {w.price}</span>
                    <ArrowUpRight size={16} className="text-white/20 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-[#0A0A0A]/70 h-[min(80vh)]"
            >
              <Image
                src="/assets/workshops.png"
                alt="Workshop visual"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <span className="font-syncopate text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">Major Workshops</span>
                <h3 className="font-syncopate text-3xl md:text-4xl uppercase tracking-tight mt-3 leading-tight">with combos</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- REGISTRATION MODAL --- */}
      <AnimatePresence>
        {selectedWorkshop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80"
            onClick={() => setSelectedWorkshop(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-[#0F0F0F] border border-cyan-500/50 p-8 md:p-12 rounded-[2.5rem] text-center max-w-md w-full shadow-[0_0_80px_rgba(6,182,212,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <span className="font-mono text-[9px] text-cyan-500 tracking-[0.5em] uppercase mb-4 block">Visit registration page to </span>
              <h2 className="font-syncopate text-2xl mb-8 uppercase tracking-tighter leading-tight">
                Access {selectedWorkshop.title}
              </h2>
              <h3 className="font-syncopate text-lg text-cyan-400/80 mb-4">{selectedWorkshop.desc}</h3>
              
              <h2 className="font-syncopate text-xl mb-8 uppercase tracking-tighter leading-tight">
                {selectedWorkshop.details.map((detail, index) => (
                  <p key={index} className="text-white/50 font-mono text-sm uppercase tracking-[0.3em]">
                    {detail}
                  </p>
                ))}
              </h2>
              <p className="mt-8 text-white/20 font-mono text-[8px] uppercase tracking-[0.3em]">
                {selectedWorkshop.cat} Module // Price: {selectedWorkshop.price}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PHOTO GALLERY (VISUAL ARCHIVES) --- */}
      <section className=" py-30 relative z-10 border-t border-white/5 bg-[#030303]/50 backdrop-blur-3xl overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave} >
        <div className="container mx-auto px-6 text-center mb-20">
          <span className="font-mono text-[10px] text-cyan-500 tracking-[1em] uppercase block mb-4">
            Visual Archives
          </span>
          <h2 className="font-syncopate text-4xl md:text-6xl tracking-tighter uppercase leading-none">
            <span className="text-white/50 italic">Time Fall</span> 2026
          </h2>
        </div>

        <div className="relative group">
          {/* Viewport */}
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            {/* Container */}
            <div className="flex -ml-8"> {/* Matches gap for alignment */}
              {IMAGES.map((src, i) => (
                <div
                  key={i}
                  className="pl-8 flex-[0_0_85%] md:flex-[0_0_500px] min-w-0"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5"
                  >
                    <Image
                      src={src}
                      fill
                      alt={`Archive ${i}`}
                      sizes="(max-width: 768px) 85vw, 500px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Subtle vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Navigation Controls */}
          <div className="flex justify-center items-center gap-12 mt-16">
            <button
              onClick={scrollPrev}
              className="p-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-white/70 hover:text-cyan-400 group"
            >
              <ChevronLeft size={28} className="group-active:scale-90 transition-transform" />
            </button>

            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <button
              onClick={scrollNext}
              className="p-5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-white/70 hover:text-cyan-400 group"
            >
              <ChevronRight size={28} className="group-active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* --- INSTITUTION: THE NEXUS --- */}
      <section className="py-48 px-6 md:px-20 bg-[#070707] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-32 items-center">
          <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} transition={expoTransition} className="flex-1 space-y-14">
            <div className="space-y-6">
              <div className="w-12 h-[2px] bg-cyan-500" />
              <h2 className="font-syncopate text-4xl md:text-6xl tracking-tighter leading-tight uppercase font-black">India's Space <br /><span className="text-cyan-500">Incubator</span></h2>
            </div>
            <div className="space-y-6 text-white/40 font-light leading-relaxed text-lg md:text-xl max-w-xl">
              <p>The Indian Institute of Space Science and Technology (IIST) is India’s premier incubator for future leaders in space science, technology, and engineering.</p>
              <p>The institute is committed to excellence in teaching, learning and research. IIST fosters state-of-the-art research and development in space studies and provides a think-tank to explore new directions for the Indian Space Programme.</p>
              <p className="text-sm border-l border-white/10 pl-6 italic">Established in 2007 by the Dept. of Space with complete backing from ISRO.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
              {[{ label: "Established", val: "2007" }, { label: "Under", val: "ISRO / Dept. of Space" }].map((stat, i) => (
                <div key={i} className="border-l-2 border-cyan-500/40 pl-8 py-3 bg-white/[0.02] rounded-r-xl">
                  <p className="text-[10px] font-syncopate text-cyan-500/50 tracking-[0.4em] mb-3 uppercase font-black">{stat.label}</p>
                  <p className="font-syncopate text-sm tracking-widest text-white">{stat.val}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} className="flex-1 w-full aspect-[4/5] relative border border-white/10 group overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <Image src="/assets/iist.png" alt="Campus" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-100 group-hover:opacity-80 transition-all duration-300 scale-110 group-hover:scale-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-80" />
          </motion.div>
        </div>
      </section>

      <MerchPromoNotification />
    </main>
  );
}