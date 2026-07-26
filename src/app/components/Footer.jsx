'use client';

import Link from 'next/link';

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Workshops', href: '/workshop' },
  { label: 'Events', href: '/events' },
  { label: 'Merch & Accommodation', href: '/accommodation' },
  { label: 'Contact', href: '/contact-us' },
];

function MusicCredit({ align = 'center' }) {
  const isEnd = align === 'end';
  return (
    <div className={`flex flex-col gap-3 ${isEnd ? 'items-end' : 'items-center'}`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">Music by</p>
      <p className="font-syncopate text-5xl font-black uppercase leading-none text-white sm:text-5xl lg:text-6xl">
        tansyN 
      </p>
      <div className={`flex flex-wrap gap-3 ${isEnd ? 'justify-end' : 'justify-center'}`}>
        <a
          href="https://www.instagram.com/tansyn007/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-2.72 0-3.06.01-4.13.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 00-1.77 1.15A4.9 4.9 0 002.53 5.44c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.13c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 001.15 1.77 4.9 4.9 0 001.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.13-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 001.77-1.15 4.9 4.9 0 001.15-1.77c.25-.64.42-1.37.47-2.43.05-1.07.06-1.41.06-4.13s-.01-3.06-.06-4.13c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 00-1.15-1.77 4.9 4.9 0 00-1.77-1.15c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.21 1.85.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.13.36.3.87.34 1.85.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.21 1.5-.34 1.85-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.13-.87.3-1.85.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.21-1.85-.34a3.1 3.1 0 01-1.15-.75 3.1 3.1 0 01-.75-1.15c-.13-.36-.3-.87-.34-1.85-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.04-.98.21-1.5.34-1.85.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.13.87-.3 1.85-.34C9.01 3.81 9.33 3.8 12 3.8zm0 3.05a5.15 5.15 0 100 10.3 5.15 5.15 0 000-10.3zm0 8.5a3.35 3.35 0 110-6.7 3.35 3.35 0 010 6.7zm5.35-8.7a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
          </svg>
          Instagram
        </a>
        <a
          href="https://open.spotify.com/artist/6UktgMjAQKRQTH8u2UHOBR?si=d4vXcuUgScyETCh6dxh5rQ"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-black shadow-lg transition-transform hover:scale-105"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.44a.62.62 0 01-.86.21c-2.36-1.44-5.33-1.77-8.83-.97a.62.62 0 11-.28-1.21c3.83-.88 7.12-.5 9.76 1.11.3.18.39.57.21.86zm1.22-2.72a.78.78 0 01-1.07.26c-2.7-1.66-6.82-2.14-10.02-1.17a.78.78 0 11-.45-1.49c3.65-1.1 8.19-.57 11.28 1.33.37.23.49.72.26 1.07zm.1-2.84C14.9 9.03 9.16 8.84 5.86 9.85a.94.94 0 11-.55-1.79c3.79-1.15 10.1-.93 14.09 1.44a.94.94 0 11-.96 1.62l-.53-.24z" />
          </svg>
          Spotify
        </a>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="site-footer" className="relative overflow-hidden border-t border-white/[0.06] bg-gradient-to-b from-black to-[#050508] px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(6,182,212,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_85%_0%,rgba(139,92,246,0.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-3">
          <div className="mx-auto max-w-sm space-y-4 sm:mx-0">
            <span className="font-syncopate text-xl font-black uppercase italic tracking-tighter">
              Conscientia<span className="text-cyan-400">.</span>
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/45">
              The Time Fall · IIST Technical Fest
            </p>
            <p className="text-sm leading-relaxed text-white/50">
              Workshops, competitions, and experiences at the Indian Institute of Space Science and
              Technology — where space meets systems thinking.
            </p>
          </div>

          <div>
            <p className="section-eyebrow mb-4">Explore</p>
            <ul className="grid grid-cols-2 justify-items-center gap-x-8 gap-y-3 sm:justify-items-start">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[12px] font-semibold uppercase tracking-wider text-white/55 transition-colors hover:text-cyan-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto max-w-xs space-y-5 sm:mx-0 lg:ml-auto lg:text-right">
            <div className="space-y-3">
              <p className="text-[11px] leading-relaxed text-white/40">
                © {new Date().getFullYear()} Indian Institute of Space Science and Technology
                <br />
                Dept. of Space, Govt. of India
              </p>
              <span className="chip inline-block">Tech fest 2026</span>
            </div>

            {/* Blended into this same column on sm+; only breaks out into
                its own bordered row on mobile, below. */}
            <div className="hidden sm:block">
              <MusicCredit align="end" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center border-t border-white/[0.06] pt-6 sm:hidden">
          <MusicCredit align="center" />
        </div>
      </div>
    </footer>
  );
}
