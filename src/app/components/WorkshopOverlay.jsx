import { useEffect, useRef } from 'react';

export default function WorkshopOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      const raf = requestAnimationFrame(() => {
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 2.5s ease';
          overlayRef.current.style.opacity = '1';
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Subtle center glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse at center, rgba(0, 229, 255, 0.025) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2rem 3rem',
          borderBottom: '1px solid rgba(0, 229, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#00E5FF" strokeWidth="0.8" strokeOpacity="0.6" />
            <circle cx="14" cy="14" r="7" stroke="#00E5FF" strokeWidth="0.6" strokeOpacity="0.4" />
            <circle cx="14" cy="14" r="2.5" fill="#00E5FF" fillOpacity="0.9" />
            <line x1="14" y1="2" x2="14" y2="5" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="14" y1="23" x2="14" y2="26" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="2" y1="14" x2="5" y2="14" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="23" y1="14" x2="26" y2="14" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
          <span style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: 'rgba(0, 229, 255, 0.7)',
            textTransform: 'uppercase',
          }}>
            CONSCIENTIA
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          {['Workshop', 'Sessions', 'Archive', 'Contact'].map((item) => (
            <span
              key={item}
              style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase',
                cursor: 'default',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Center content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', textAlign: 'center', padding: '0 2rem' }}>
        {/* Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ width: '24px', height: '1px', background: 'rgba(0, 229, 255, 0.5)' }} />
          <span style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 500,
            letterSpacing: '0.28em',
            color: 'rgba(0, 229, 255, 0.6)',
            textTransform: 'uppercase',
          }}>
            Workshop Series · Vol. IV
          </span>
          <div style={{ width: '24px', height: '1px', background: 'rgba(0, 229, 255, 0.5)' }} />
        </div>

        {/* Main title */}
        <div style={{ position: 'relative' }}>
          <h1 style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            fontSize: 'clamp(3.5rem, 9vw, 8rem)',
            fontWeight: 200,
            letterSpacing: '0.08em',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: 1.0,
            margin: 0,
            textShadow: '0 0 80px rgba(0, 229, 255, 0.12)',
          }}>
            TIME<span style={{ color: 'rgba(0, 229, 255, 0.85)', fontWeight: 300 }}> FALL</span>
          </h1>
          {/* Underline glow */}
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), transparent)',
          }} />
        </div>

        {/* Subtitle */}
        <p style={{
          fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          fontWeight: 300,
          letterSpacing: '0.12em',
          color: 'rgba(255, 255, 255, 0.28)',
          maxWidth: '480px',
          lineHeight: 1.8,
          margin: '0.5rem 0 0 0',
          textTransform: 'uppercase',
        }}>
          An immersive exploration of time, consciousness, and the invisible forces that shape reality
        </p>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '3rem',
          marginTop: '1rem',
        }}>
          {[
            { label: 'Sessions', value: '12' },
            { label: 'Duration', value: '6h' },
            { label: 'Participants', value: '∞' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                fontWeight: 200,
                color: 'rgba(0, 229, 255, 0.8)',
                letterSpacing: '0.05em',
              }}>{value}</span>
              <span style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
                fontSize: '0.6rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: 'rgba(255, 255, 255, 0.2)',
                textTransform: 'uppercase',
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '1.5rem',
          padding: '0.7rem 2.5rem',
          border: '1px solid rgba(0, 229, 255, 0.22)',
          background: 'rgba(0, 229, 255, 0.03)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}>
          <span style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: 'rgba(0, 229, 255, 0.7)',
            textTransform: 'uppercase',
          }}>
            Enter the Field
          </span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M0 5H12M8 1L12 5L8 9" stroke="rgba(0, 229, 255, 0.7)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 3rem',
          borderTop: '1px solid rgba(0, 229, 255, 0.04)',
        }}
      >
        <span style={{
          fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
          fontSize: '0.58rem',
          letterSpacing: '0.2em',
          color: 'rgba(255, 255, 255, 0.12)',
          textTransform: 'uppercase',
        }}>
          Move your cursor to navigate the field
        </span>

        {/* Particle count indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.7)',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.5)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, sans-serif",
            fontSize: '0.58rem',
            letterSpacing: '0.16em',
            color: 'rgba(0, 229, 255, 0.3)',
            textTransform: 'uppercase',
          }}>
            20,000 Particles · Live
          </span>
        </div>
      </div>
    </div>
  );
}
