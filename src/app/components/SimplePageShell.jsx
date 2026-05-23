'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SimplePageShell({
  eyebrow = 'Conscientia 2026',
  title,
  subtitle,
  children,
}) {
  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-24 md:pt-32 md:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[10px] uppercase tracking-[0.45em] text-cyan-400/90 mb-4"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-syncopate text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95] mb-6"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/55 text-base md:text-lg leading-relaxed max-w-2xl mb-12 border-l-2 border-cyan-500/40 pl-6"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-none space-y-5 text-[15px] md:text-base leading-relaxed text-white/70"
        >
          {children}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-14 flex flex-wrap gap-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
          >
            ← Back home
          </Link>
          <Link
            href="/online-workshops"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
          >
            Workshops
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
