"use client";

/** Prominent, on-brand loading overlay — fixed, centered, blurred backdrop.
 * Used anywhere content is fetched from the database and would otherwise
 * render as an empty/blank gap. */
export default function LoadingState({ label = "Loading", accentColor = "#33d6ff", inline = false }) {
  return (
    <div
      style={{
        position: inline ? "relative" : "fixed",
        inset: inline ? undefined : 0,
        zIndex: inline ? undefined : 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        minHeight: inline ? "40vh" : undefined,
        width: "100%",
        background: inline ? "transparent" : "rgba(3,3,4,0.55)",
        backdropFilter: inline ? undefined : "blur(10px)",
        WebkitBackdropFilter: inline ? undefined : "blur(10px)",
        animation: "loadingFadeIn 0.25s ease-out",
      }}
    >
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid ${accentColor}33`,
            boxShadow: `0 0 28px ${accentColor}40`,
          }}
        />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "4px",
                left: "50%",
                width: "2px",
                height: i % 3 === 0 ? "8px" : "4px",
                marginLeft: "-1px",
                background: `${accentColor}55`,
                borderRadius: "2px",
              }}
            />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "2.5px",
            height: "26px",
            marginLeft: "-1.25px",
            marginTop: "-26px",
            background: accentColor,
            borderRadius: "2px",
            transformOrigin: "bottom center",
            animation: "clockHourHand 3s linear infinite",
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "2px",
            height: "20px",
            marginLeft: "-1px",
            marginTop: "-20px",
            background: accentColor,
            borderRadius: "2px",
            transformOrigin: "bottom center",
            animation: "clockMinuteHand 1s linear infinite",
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "8px",
            height: "8px",
            marginLeft: "-4px",
            marginTop: "-4px",
            borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: accentColor,
          textShadow: `0 0 20px ${accentColor}80`,
        }}
      >
        {label}
        <span className="loading-dots" />
      </p>

      <style>{`
        @keyframes loadingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes clockHourHand {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes clockMinuteHand {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .loading-dots::after {
          display: inline-block;
          width: 1.4em;
          text-align: left;
          content: "";
          animation: loadingDotsText 1.2s steps(4, end) infinite;
        }
        @keyframes loadingDotsText {
          0% { content: ""; }
          25% { content: "."; }
          50% { content: ".."; }
          75% { content: "..."; }
          100% { content: ""; }
        }
      `}</style>
    </div>
  );
}
