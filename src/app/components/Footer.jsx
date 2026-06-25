'use client';

import Link from 'next/link';

const footerLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Workshops', href: '/workshop' },
  { label: 'Events', href: '/events' },
  { label: 'Accommodation', href: '/accommodation' },
  { label: 'Contact', href: '/contact-us' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-gradient-to-b from-black to-[#050508] px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(6,182,212,0.06),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-syncopate text-xl font-black uppercase italic tracking-tighter">
              Conscientia<span className="text-cyan-400">.</span>
            </span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/45">
            The Time Fall · IIST Technical Fest
          </p>
          <p className="text-sm leading-relaxed text-white/50">
            Workshops, competitions, and experiences at the Indian Institute of Space Science and
            Technology — where space meets systems thinking.
          </p>
        </div>

        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-500/80">
            Explore
          </p>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
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

        <div className="flex flex-col gap-4 text-right md:items-end">
          <p className="max-w-xs text-[11px] leading-relaxed text-white/40">
            © {new Date().getFullYear()} Indian Institute of Space Science and Technology
            <br />
            Dept. of Space, Govt. of India
          </p>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
            Tech fest 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
