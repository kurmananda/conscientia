import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Calendar, Clock } from "lucide-react";
import { useParallaxTilt } from "../../hooks/useParallaxTilt";
import useSound from "../../hooks/useSound";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import useProfile from "../../hooks/useProfile";
import EvergreenCountdown from "../EvergreenCountdown";
import useCapacity from "../../hooks/useCapacity";
import useMyRegisteredIds from "../../hooks/useMyRegisteredIds";
import { showCartToast } from "@/lib/cartToast";
import { parsePriceLabel } from "@/lib/parsePriceLabel";

const ParallaxCard = ({ card, index, basePath = "/workshop", width }) => {
  const cardWidth = width || card.layout?.width || "500px";
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  // Only the cards actually on-screen pay for a mousemove listener — a
  // long events/workshop listing page can have 30+ of these mounted at
  // once, and each one was tracking window mousemove unconditionally
  // before, which is what made those pages laggy.
  const { ref, isHovered, handleMouseMove, handleMouseLeave, handleMouseEnter } = useParallaxTilt(20, isVisible);

  const playGlitch = useSound("/sounds/glitch.wav", 0.1, 0.15);
  const playClick = useSound("/sounds/click.wav", 0.125, 0.08);

  const { user } = useAuth();
  const { items, addItem, hasItem } = useCart();
  const { profile } = useProfile();
  const kind = basePath.includes("workshop") ? "workshop" : "event";
  const cartKey = `${kind}:${card.id}`;
  const inCart = hasItem(cartKey);

  const { remaining } = useCapacity();
  const registeredIds = useMyRegisteredIds();
  const isRegistered = registeredIds.includes(card.id);
  const isClosed = !isRegistered && remaining(card) <= 0;

  const toCartItem = () => ({
    key: cartKey,
    id: card.id,
    kind,
    ticketId: card.ticketId,
    title: card.title,
    subtitle: card.subtitle,
    priceLabel: card.price,
    unitPrice: parsePriceLabel(card.price),
    image: card.image,
    accentColor: card.accentColor,
  });

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart || isClosed || isRegistered) return;
    if (!user) {
      playClick();
      router.push("/login?redirect=/cart");
      return;
    }
    playGlitch();
    addItem(toCartItem());
    showCartToast("Added to cart — check it out there");
  };

  // Registering no longer books/pays instantly — it just adds the item to
  // the shared cart, same as the cart icon button. If merch or
  // accommodation isn't in the cart yet, send the user straight to that
  // page next instead of leaving it to a dismissible reminder.
  const handleRegister = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosed || isRegistered || inCart) return;
    playClick();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`${basePath}/${card.id}`)}`);
      return;
    }
    if (!profile?.name || !profile?.phone || !profile?.college || !profile?.college_id || !profile?.aadhaar_number) {
      router.push("/profile");
      return;
    }
    // Navigating away mid-request aborts the in-flight cart upsert (surfaces
    // as a "Failed to fetch" console error) — wait for it to land first.
    await addItem(toCartItem());
    showCartToast("Added to cart — check it out there");
    const missingMerch = !items.some((i) => i.kind === "merch");
    const missingAccommodation = !items.some((i) => i.kind === "accommodation");
    if (missingMerch) router.push("/merch");
    else if (missingAccommodation) router.push("/accommodation");
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Pre-trigger a bit before the card is actually on-screen so the reveal
    // has time to finish before it scrolls into view. This used to be
    // 1000px — on a long listing page that meant a single scroll gesture
    // could cross the trigger boundary for a dozen-plus cards at once, all
    // starting their (expensive: filter:blur is not cheap to animate)
    // reveal transition in the same frame. A smaller margin keeps that
    // batch size sane while still front-loading the reveal.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "250px 0px 250px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The continuous rotateX/rotateY/scale tilt is applied straight to the
  // DOM node by useParallaxTilt now (no React state, no re-render per
  // mousemove frame — that per-card re-render triggered on every mouse
  // pixel moved, multiplied across every visible card, was the actual lag).
  // These derived layers only need the low-frequency `isHovered` boolean;
  // they no longer micro-follow the exact tilt angle, which is what let
  // the continuous state go away.
  const cardStyle = {
    transition: "box-shadow 0.15s ease-out",
    boxShadow: isHovered
      ? `0 30px 60px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.4), 0 0 80px ${card.glowColor}, 0 0 120px ${card.glowColor}`
      : `0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 40px ${card.glowColor}`,
    transformStyle: "preserve-3d",
  };

  const layer1Style = {
    transform: isHovered ? "translateZ(20px)" : "translateZ(0px)",
    transition: isHovered ? "transform 0.15s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const layer2Style = {
    transform: isHovered ? "translateZ(35px)" : "translateZ(0px)",
    transition: isHovered ? "transform 0.15s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const rainbowShineStyle = {
    background: `linear-gradient(
      135deg,
      rgba(255, 0, 0, 0.08) 0%,
      rgba(255, 165, 0, 0.08) 15%,
      rgba(255, 255, 0, 0.08) 30%,
      rgba(0, 255, 0, 0.08) 45%,
      rgba(0, 0, 255, 0.08) 60%,
      rgba(238, 130, 238, 0.08) 75%,
      rgba(255, 0, 0, 0.08) 100%
    )`,
    opacity: isHovered ? 1 : 0,
    transition: isHovered ? "opacity 0.15s ease-out" : "opacity 0.6s",
  };

  const foilStyle = {
    background: card.foilGradient,
    opacity: isHovered ? 0.8 : 0.4,
    transition: isHovered ? "opacity 0.15s ease-out" : "opacity 0.6s",
  };

  return (
    <div
      ref={wrapperRef}
      className="group relative cursor-pointer h-full"
      style={{
        // No `filter: blur()` in this transition anymore — animating blur
        // is expensive to rasterize, and with several cards crossing the
        // reveal threshold in the same scroll gesture, several of them
        // animating blur at once was a real cost. The resting (fully
        // revealed) look is identical either way; only the transient
        // entrance animation is a touch less soft now.
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1) rotateX(0deg)"
          : "translateY(80px) scale(0.7) rotateX(8deg)",
        transition: isVisible
          ? "opacity 0.35s cubic-bezier(0.23, 1, 0.32, 1), transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)"
          : "opacity 0.2s ease-in, transform 0.2s ease-in",
        overflow: "visible",
        // While a card is still translated/faded pre-reveal it shouldn't
        // intercept clicks meant for whatever now overlaps its resting
        // position — without this, a fast scroll-then-click could land on
        // an about-to-reveal card instead of the one actually under the
        // cursor, making the click appear to do nothing.
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {/* Main Card */}
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative select-none overflow-hidden rounded-2xl h-full"
        style={{ ...cardStyle, width: cardWidth }}
      >
        {/* Card Base Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950" />

        {/* Foil / Holographic Base Layer */}
        <div className="absolute inset-0 rounded-2xl" style={foilStyle} />

        {/* Rainbow Holographic Sheen */}
        <div className="pointer-events-none absolute inset-0 z-30 rounded-2xl" style={rainbowShineStyle} />

        {/* Card Content - Landscape Layout */}
        <div className="relative z-10 flex flex-row p-2.5 sm:p-3">
          {/* Left Side - Image */}
          <div style={layer2Style} className="relative mr-2.5 sm:mr-3 flex-shrink-0 overflow-hidden rounded-xl">
            <div className="relative h-[120px] w-[95px] sm:h-[200px] sm:w-[160px] overflow-hidden rounded-xl">
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 95px, 160px"
                  className="object-cover"
                  style={{
                    transform: isHovered ? "scale(1.08)" : "scale(1)",
                    transition: isHovered
                      ? "transform 0.3s ease-out"
                      : "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-2xl"
                  style={{ background: `linear-gradient(135deg, ${card.accentColor || "#33d6ff"}33, #0a0a0a)` }}
                >
                  {card.badgeIcon || "✦"}
                </div>
              )}
              {/* Image overlay gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, transparent 60%, ${card.glowColor.replace("0.3", "0.4")} 100%)`,
                }}
              />
              {/* Image scan lines */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)",
                }}
              />
              {/* Type badge on image */}
              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2">
                <span
                  className="rounded-md px-2 py-0.5 text-xs sm:text-sm font-semibold uppercase tracking-wide text-white"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${card.accentColor}66`,
                  }}
                >
                  {card.type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <div style={layer1Style} className="mb-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-white"
                    style={{
                      textShadow: `0 0 20px ${card.accentColor}`,
                      fontFamily: "var(--font-anton), sans-serif",
                      fontWeight: 400,
                      letterSpacing: "0.01em",
                    }}
                  >
                    <span className="digital-interference scanline-sweep digital-flicker" style={{ position: "relative" }}>
                      <span className="glitch-text" data-text={card.title}>{card.title}</span>
                    </span>
                  </h3>
                </div>
                <div
                  className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: `${card.accentColor}22`,
                    border: `1px solid ${card.accentColor}55`,
                    boxShadow: `0 0 15px ${card.accentColor}66`,
                  }}
                >
                  {/^https?:\/\//.test(card.badgeIcon || "") ? (
                    <img
                      src={card.badgeIcon}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    card.badgeIcon
                  )}
                </div>
              </div>
            </div>

            {/* Prize pool — full-width pulsing banner so it reads at a
                glance while scrolling, well above the price/tags row. */}
            {card.prizePool && (
              <div
                style={{
                  ...layer1Style,
                  background: "rgba(255,193,7,0.08)",
                  border: "1px solid rgba(255,193,7,0.4)",
                }}
                className="prize-pool-pulse mb-2 flex items-center justify-center gap-1.5 rounded-lg py-1.5 backdrop-blur-sm"
              >
                <span className="text-sm sm:text-base">🏆</span>
                <span
                  className="text-[11px] sm:text-sm font-black uppercase tracking-wide"
                  style={{
                    fontFamily: 'var(--font-display), sans-serif',
                    color: "#ffd54f",
                    textShadow: "0 0 12px rgba(255,193,7,0.7)",
                  }}
                >
                  {card.prizePool}
                </span>
              </div>
            )}

            {/* Description — skipped on mobile to keep cards compact */}
            <div style={layer1Style} className="mb-2 hidden sm:block">
              <p className="text-sm leading-relaxed text-white/65" style={{ fontFamily: 'var(--font-noto), sans-serif', letterSpacing: "0.01em" }}>{card.description}</p>
            </div>

            {/* Date and Time — shown as two separate rows, not one combined
                string, so each can be styled/skipped independently. */}
            {card.eventDate && (
              <div style={layer1Style} className="mb-1 flex items-center gap-1.5">
                <Calendar size={13} style={{ color: card.accentColor, flexShrink: 0 }} />
                <span
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{
                    color: card.accentColor,
                    fontFamily: 'var(--font-bebas), sans-serif',
                    letterSpacing: "0.02em",
                  }}
                >
                  {card.eventDate}
                </span>
              </div>
            )}
            {card.timing && (
              <div style={layer1Style} className="mb-2 flex items-center gap-1.5">
                <Clock size={13} style={{ color: card.accentColor, flexShrink: 0 }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    color: card.accentColor,
                    fontFamily: 'var(--font-body), sans-serif',
                    letterSpacing: "0.03em",
                  }}
                >
                  {card.timing}
                </span>
              </div>
            )}

            {/* Price */}
            <div style={layer1Style} className="mb-2">
              <span
                className="text-lg sm:text-xl font-black"
                style={{
                  color: card.accentColor,
                  textShadow: `0 0 15px ${card.glowColor}`,
                  fontFamily: 'var(--font-display), sans-serif',
                }}
              >
                {card.strikePrice && (
                  <span className="mr-1.5 text-white/35 line-through font-medium">{card.strikePrice}</span>
                )}
                {card.price} <span className="text-[11px] sm:text-xs font-medium normal-case text-white/50">(registration fee)</span>
              </span>
              <EvergreenCountdown className="mt-1 block text-[9px] sm:text-[10px] font-bold text-amber-300/90" />
            </div>

            {/* Buttons — pinned to the bottom of the card via mt-auto, not
                spread out among the header/tags/price above. View gets its
                own full-width row on top; Cart + Register share the row
                below it. */}
            <div style={{ ...layer1Style, perspective: "600px" }} className="mt-auto flex flex-col gap-2">
              <Link
                href={`${basePath}/${card.id}`}
                prefetch
                className="rounded-lg py-3 text-center text-xs font-bold uppercase tracking-wider"
                style={{
                  background: `${card.accentColor}22`,
                  color: card.accentColor,
                  border: `1px solid ${card.accentColor}55`,
                  fontFamily: 'var(--font-display), sans-serif',
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  transformStyle: "preserve-3d",
                  boxShadow: `0 4px 15px ${card.accentColor}15`,
                }}
                onMouseEnter={(e) => {
                  playGlitch();
                  e.currentTarget.style.background = card.accentColor;
                  e.currentTarget.style.color = "#000";
                  e.currentTarget.style.transform = "translateZ(20px) scale(1.05)";
                  e.currentTarget.style.boxShadow = `0 8px 30px ${card.accentColor}50, 0 0 40px ${card.accentColor}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${card.accentColor}22`;
                  e.currentTarget.style.color = card.accentColor;
                  e.currentTarget.style.transform = "translateZ(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 15px ${card.accentColor}15`;
                }}
                onClick={() => playClick()}
              >
                View Details
              </Link>
              <div className="flex gap-2">
                {isRegistered ? (
                  <div
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      background: `${card.accentColor}18`,
                      color: card.accentColor,
                      border: `1px solid ${card.accentColor}55`,
                      fontFamily: 'var(--font-display), sans-serif',
                    }}
                  >
                    <Check size={14} />
                    Registered
                  </div>
                ) : isClosed ? (
                  <div
                    className="flex-1 flex items-center justify-center rounded-lg py-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontFamily: 'var(--font-display), sans-serif',
                    }}
                  >
                    Closed
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 rounded-lg py-3 text-[11px] font-bold uppercase tracking-wider"
                      disabled={inCart}
                      style={{
                        background: card.accentColor,
                        color: "#000",
                        fontFamily: 'var(--font-display), sans-serif',
                        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                        transformStyle: "preserve-3d",
                        opacity: inCart ? 0.6 : 1,
                        cursor: inCart ? "default" : "pointer",
                        boxShadow: `0 4px 20px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      }}
                      onClick={handleRegister}
                      onMouseEnter={(e) => {
                        if (inCart) return;
                        playGlitch();
                        e.currentTarget.style.transform = "translateZ(25px) scale(1.08)";
                        e.currentTarget.style.boxShadow = `0 12px 40px ${card.glowColor}, 0 0 60px ${card.glowColor}40, inset 0 1px 0 rgba(255,255,255,0.3)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateZ(0) scale(1)";
                        e.currentTarget.style.boxShadow = `0 4px 20px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                      }}
                    >
                      {inCart ? "Added to Cart" : "Register"}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      aria-label={inCart ? "Already in cart" : "Add to cart"}
                      title={inCart ? "Already in cart" : "Add to cart"}
                      className="flex flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        width: "52px",
                        background: inCart ? `${card.accentColor}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${card.accentColor}55`,
                        color: card.accentColor,
                        cursor: inCart ? "default" : "pointer",
                        transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                        transformStyle: "preserve-3d",
                      }}
                      onMouseEnter={(e) => {
                        if (inCart) return;
                        playGlitch();
                        e.currentTarget.style.background = `${card.accentColor}22`;
                        e.currentTarget.style.transform = "translateZ(20px) scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = inCart ? `${card.accentColor}22` : "rgba(255,255,255,0.04)";
                        e.currentTarget.style.transform = "translateZ(0) scale(1)";
                      }}
                    >
                      {inCart ? <Check size={22} /> : <ShoppingCart size={22} />}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} h-3 w-3 opacity-60`}
            style={{
              background: "transparent",
              border: `1.5px solid ${card.accentColor}`,
              borderRadius: "2px",
              clipPath:
                pos.includes("top-2 left-2")
                  ? "polygon(0 0, 100% 0, 0 100%)"
                  : pos.includes("top-2 right-2")
                  ? "polygon(0 0, 100% 0, 100% 100%)"
                  : pos.includes("bottom-2 left-2")
                  ? "polygon(0 0, 100% 100%, 0 100%)"
                  : "polygon(100% 0, 100% 100%, 0 100%)",
            }}
          />
        ))}
      </div>

      {/* ── Side Fire / Aura Effects — desktop hover-glow only, hidden on touch via CSS
           (not a JS/SSR check) so server and client render identical markup ── */}
      {isVisible && <div className="hover-fx">
      {/* Left fire column — positioned fully outside the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "100%",
          top: "-5%",
          bottom: "-5%",
          width: "200px",
          zIndex: -1,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      >
        {/* Deep background glow */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "-25%",
            bottom: "-25%",
            width: "180px",
            background: `radial-gradient(ellipse at 90% 50%, ${card.accentColor}${isHovered ? "45" : "16"}, transparent 65%)`,
            filter: `blur(${isHovered ? "10px" : "22px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
        {/* Bright core strip */}
        <div
          style={{
            position: "absolute",
            right: "0px",
            top: "5%",
            bottom: "5%",
            width: "24px",
            background: `linear-gradient(to bottom, transparent 2%, ${card.accentColor}bb 20%, ${card.accentColor} 45%, ${card.accentColor}ff 50%, ${card.accentColor} 55%, ${card.accentColor}bb 80%, transparent 98%)`,
            opacity: isHovered ? 0.6 : 0.25,
            filter: `blur(${isHovered ? "1px" : "2px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripLeft 1.8s ease-in-out infinite",
          }}
        />
        {/* Flickering inner flame */}
        <div
          style={{
            position: "absolute",
            right: "-8px",
            top: "8%",
            bottom: "8%",
            width: "40px",
            background: `linear-gradient(to bottom, transparent, ${card.accentColor}99, ${card.accentColor}ee, ${card.accentColor}99, transparent)`,
            opacity: isHovered ? 0.55 : 0.2,
            filter: `blur(${isHovered ? "4px" : "8px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.2s ease-in-out infinite alternate",
          }}
        />
        {/* Outer flame haze */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            top: "3%",
            bottom: "3%",
            width: "60px",
            background: `linear-gradient(to bottom, transparent 5%, ${card.accentColor}66 30%, ${card.accentColor}88 50%, ${card.accentColor}66 70%, transparent 95%)`,
            opacity: isHovered ? 0.4 : 0.12,
            filter: `blur(${isHovered ? "8px" : "14px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.6s ease-in-out 0.2s infinite alternate",
          }}
        />
        {/* Smoke / mist layer */}
        <div
          style={{
            position: "absolute",
            right: "-10px",
            top: "-15%",
            bottom: "-15%",
            width: "140px",
            background: `radial-gradient(ellipse at 70% 50%, ${card.accentColor}${isHovered ? "35" : "10"}, transparent 55%)`,
            filter: `blur(${isHovered ? "12px" : "28px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "smokeDrift 3s ease-in-out infinite",
          }}
        />
        {/* Large flowing embers */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`left-big-${i}`}
            style={{
              position: "absolute",
              right: "-5px",
              width: `${5 + (i % 5) * 3}px`,
              height: `${5 + (i % 5) * 3}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, #fff 0%, ${card.accentColor} 40%, transparent 70%)`,
              boxShadow: `0 0 ${10 + i * 3}px ${card.accentColor}, 0 0 ${20 + i * 4}px ${card.accentColor}80, 0 0 ${30 + i * 5}px ${card.accentColor}40`,
              opacity: isHovered ? 0.6 : 0.15,
              animation: `emberLeft${i % 4} ${2 + i * 0.2}s ease-out ${i * 0.12}s infinite`,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}
        {/* Small spark particles */}
        {[...Array(7)].map((_, i) => (
          <div
            key={`left-spark-${i}`}
            style={{
              position: "absolute",
              right: "0px",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 6px ${card.accentColor}, 0 0 14px ${card.accentColor}`,
              opacity: isHovered ? 0.5 : 0.08,
              animation: `sparkLeft${i % 3} ${1 + i * 0.12}s linear ${i * 0.08}s infinite`,
              transition: "opacity 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Right fire column — positioned fully outside the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "100%",
          top: "-5%",
          bottom: "-5%",
          width: "200px",
          zIndex: -1,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      >
        {/* Deep background glow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "-25%",
            bottom: "-25%",
            width: "180px",
            background: `radial-gradient(ellipse at 10% 50%, ${card.accentColor}${isHovered ? "45" : "16"}, transparent 65%)`,
            filter: `blur(${isHovered ? "10px" : "22px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
        {/* Bright core strip */}
        <div
          style={{
            position: "absolute",
            left: "0px",
            top: "5%",
            bottom: "5%",
            width: "24px",
            background: `linear-gradient(to bottom, transparent 2%, ${card.accentColor}bb 20%, ${card.accentColor} 45%, ${card.accentColor}ff 50%, ${card.accentColor} 55%, ${card.accentColor}bb 80%, transparent 98%)`,
            opacity: isHovered ? 0.6 : 0.25,
            filter: `blur(${isHovered ? "1px" : "2px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripRight 1.8s ease-in-out 0.4s infinite",
          }}
        />
        {/* Flickering inner flame */}
        <div
          style={{
            position: "absolute",
            left: "-8px",
            top: "8%",
            bottom: "8%",
            width: "40px",
            background: `linear-gradient(to bottom, transparent, ${card.accentColor}99, ${card.accentColor}ee, ${card.accentColor}99, transparent)`,
            opacity: isHovered ? 0.55 : 0.2,
            filter: `blur(${isHovered ? "4px" : "8px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.4s ease-in-out 0.3s infinite alternate",
          }}
        />
        {/* Outer flame haze */}
        <div
          style={{
            position: "absolute",
            left: "-20px",
            top: "3%",
            bottom: "3%",
            width: "60px",
            background: `linear-gradient(to bottom, transparent 5%, ${card.accentColor}66 30%, ${card.accentColor}88 50%, ${card.accentColor}66 70%, transparent 95%)`,
            opacity: isHovered ? 0.4 : 0.12,
            filter: `blur(${isHovered ? "8px" : "14px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.6s ease-in-out 0.2s infinite alternate",
          }}
        />
        {/* Smoke / mist layer */}
        <div
          style={{
            position: "absolute",
            left: "-10px",
            top: "-15%",
            bottom: "-15%",
            width: "140px",
            background: `radial-gradient(ellipse at 30% 50%, ${card.accentColor}${isHovered ? "35" : "10"}, transparent 55%)`,
            filter: `blur(${isHovered ? "12px" : "28px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "smokeDrift 3.2s ease-in-out 0.5s infinite",
          }}
        />
        {/* Large flowing embers */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`right-big-${i}`}
            style={{
              position: "absolute",
              left: "-5px",
              width: `${5 + (i % 5) * 3}px`,
              height: `${5 + (i % 5) * 3}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, #fff 0%, ${card.accentColor} 40%, transparent 70%)`,
              boxShadow: `0 0 ${10 + i * 3}px ${card.accentColor}, 0 0 ${20 + i * 4}px ${card.accentColor}80, 0 0 ${30 + i * 5}px ${card.accentColor}40`,
              opacity: isHovered ? 0.6 : 0.15,
              animation: `emberRight${i % 4} ${2 + i * 0.2}s ease-out ${i * 0.12 + 0.1}s infinite`,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}
        {/* Small spark particles */}
        {[...Array(7)].map((_, i) => (
          <div
            key={`right-spark-${i}`}
            style={{
              position: "absolute",
              left: "0px",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 6px ${card.accentColor}, 0 0 14px ${card.accentColor}`,
              opacity: isHovered ? 0.5 : 0.08,
              animation: `sparkRight${i % 3} ${1 + i * 0.12}s linear ${i * 0.08 + 0.05}s infinite`,
              transition: "opacity 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Top aura — positioned fully above the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "100%",
          left: "5%",
          right: "5%",
          height: "100px",
          zIndex: -1,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "16px",
            background: `linear-gradient(to right, transparent, ${card.accentColor}dd, transparent)`,
            opacity: isHovered ? 0.55 : 0.2,
            filter: `blur(${isHovered ? "1px" : "3px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripTop 2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "-20%",
            right: "-20%",
            height: "70px",
            background: `radial-gradient(ellipse at center bottom, ${card.accentColor}${isHovered ? "40" : "12"}, transparent 60%)`,
            filter: `blur(${isHovered ? "6px" : "16px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>

      {/* Bottom aura — positioned fully below the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "100%",
          left: "5%",
          right: "5%",
          height: "100px",
          zIndex: -1,
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "16px",
            background: `linear-gradient(to right, transparent, ${card.accentColor}dd, transparent)`,
            opacity: isHovered ? 0.55 : 0.2,
            filter: `blur(${isHovered ? "1px" : "3px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripBottom 2s ease-in-out 0.6s infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "-20%",
            right: "-20%",
            height: "70px",
            background: `radial-gradient(ellipse at center top, ${card.accentColor}${isHovered ? "40" : "12"}, transparent 60%)`,
            filter: `blur(${isHovered ? "6px" : "16px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>
      </div>}
      <style>{`
        .prize-pool-pulse {
          animation: prizePoolPulse 2.2s ease-in-out infinite;
        }
        @keyframes prizePoolPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(255,193,7,0.15); }
          50% { box-shadow: 0 0 18px rgba(255,193,7,0.35); }
        }
        @keyframes fireStripLeft {
          0%, 100% { transform: scaleY(1) translateX(0); opacity: 0.8; }
          25% { transform: scaleY(1.03) translateX(-1px); opacity: 1; }
          50% { transform: scaleY(0.97) translateX(1px); opacity: 0.85; }
          75% { transform: scaleY(1.02) translateX(-0.5px); opacity: 0.95; }
        }
        @keyframes fireStripRight {
          0%, 100% { transform: scaleY(1) translateX(0); opacity: 0.8; }
          25% { transform: scaleY(1.02) translateX(1px); opacity: 0.95; }
          50% { transform: scaleY(0.98) translateX(-1px); opacity: 1; }
          75% { transform: scaleY(1.03) translateX(0.5px); opacity: 0.85; }
        }
        @keyframes fireStripTop {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.7; }
          50% { transform: scaleX(1.04) translateY(-1px); opacity: 1; }
        }
        @keyframes fireStripBottom {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.7; }
          50% { transform: scaleX(1.04) translateY(1px); opacity: 1; }
        }
        @keyframes fireFlickerInner {
          0% { transform: scaleY(1) scaleX(1); opacity: 0.6; filter: blur(3px); }
          33% { transform: scaleY(1.08) scaleX(0.95); opacity: 0.9; filter: blur(2px); }
          66% { transform: scaleY(0.94) scaleX(1.03); opacity: 0.7; filter: blur(4px); }
          100% { transform: scaleY(1.04) scaleX(0.98); opacity: 0.85; filter: blur(3px); }
        }
        @keyframes smokeDrift {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-8px) translateX(3px) scale(1.05); opacity: 0.7; }
        }
        @keyframes emberLeft0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(-70px, -180px) scale(0.2); opacity: 0; }
        }
        @keyframes emberLeft1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.85; }
          100% { transform: translate(-55px, -200px) scale(0.15); opacity: 0; }
        }
        @keyframes emberLeft2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translate(-80px, -160px) scale(0.25); opacity: 0; }
        }
        @keyframes emberLeft3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translate(-60px, -190px) scale(0.1); opacity: 0; }
        }
        @keyframes emberRight0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(70px, -180px) scale(0.2); opacity: 0; }
        }
        @keyframes emberRight1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.85; }
          100% { transform: translate(55px, -200px) scale(0.15); opacity: 0; }
        }
        @keyframes emberRight2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translate(80px, -160px) scale(0.25); opacity: 0; }
        }
        @keyframes emberRight3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translate(60px, -190px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkLeft0 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate(-45px, -120px); opacity: 0; }
        }
        @keyframes sparkLeft1 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(-35px, -140px); opacity: 0; }
        }
        @keyframes sparkLeft2 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(-50px, -110px); opacity: 0; }
        }
        @keyframes sparkRight0 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate(45px, -120px); opacity: 0; }
        }
        @keyframes sparkRight1 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(35px, -140px); opacity: 0; }
        }
        @keyframes sparkRight2 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(50px, -110px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// A listing page mounts dozens of these, each carrying a heavy tree of
// blurred/animated aura layers. Without memoizing, an unrelated state
// change anywhere above (e.g. typing in the search box on /events, which
// re-renders the whole list on every keystroke) re-renders every card's
// full DOM tree even though its own props never changed — that repaint,
// multiplied across every visible card, is what read as laggy. `card` is
// the same object reference across re-filters (only the array wrapping it
// changes), so a shallow prop compare skips all of that reliably.
export default React.memo(ParallaxCard);
