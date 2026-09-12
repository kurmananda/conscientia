"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { getCatalog } from "@/lib/catalogStore";

// Site-wide nudge: as long as the signed-in user has a paid group
// registration (groupSize > 1) whose teammate roster isn't confirmed yet,
// this stays on screen everywhere. "Minimize" only collapses it to a small
// tab — there's no way to dismiss it outright, since the whole point is to
// keep bugging the user until they actually add their teammates.
export default function TeamNudgeWidget() {
  const { user } = useAuth();
  const [incomplete, setIncomplete] = useState([]);
  const [minimized, setMinimized] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncomplete([]);
      return;
    }
    let active = true;

    (async () => {
      try {
        const regRes = await fetch(`/api/get-registrations?user_id=${encodeURIComponent(user.id)}`);
        const regJson = await regRes.json().catch(() => ({}));
        const reg = regJson?.data;
        if (!reg || reg.payment_status !== "paid" || !Array.isArray(reg.workshop_ids)) {
          if (active) setIncomplete([]);
          return;
        }

        const [workshops, events] = await Promise.all([getCatalog("workshop"), getCatalog("event")]);
        const catalogById = new Map([...workshops, ...events].map((c) => [String(c.id), c]));

        const groupIds = reg.workshop_ids
          .map((id) => String(id))
          .filter((id) => Number(catalogById.get(id)?.groupSize) > 1);

        if (groupIds.length === 0) {
          if (active) setIncomplete([]);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          if (active) setIncomplete([]);
          return;
        }

        const results = await Promise.all(
          groupIds.map(async (id) => {
            try {
              const res = await fetch(`/api/team?eventId=${encodeURIComponent(id)}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json().catch(() => ({}));
              if (!json.success) return null;
              const confirmed = !!json.data?.team?.confirmed;
              return confirmed ? null : { id, title: catalogById.get(id)?.title || id };
            } catch {
              return null;
            }
          })
        );

        if (active) setIncomplete(results.filter(Boolean));
      } catch {
        if (active) setIncomplete([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (incomplete.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[150] flex flex-col items-start gap-2 sm:bottom-6 sm:left-6">
      <AnimatePresence mode="wait">
        {minimized ? (
          <motion.button
            key="peek"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#0a0c10]/95 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-sm hover:border-cyan-300/70"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Add Teammates ({incomplete.length})
          </motion.button>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="w-[calc(100vw-2rem)] max-w-xs rounded-2xl border border-cyan-500/25 bg-[#0a0c10]/98 p-4 shadow-[0_0_35px_rgba(6,182,212,0.12)] backdrop-blur-sm sm:w-80"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/90">
                Team Incomplete
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHelpOpen((v) => !v)}
                  aria-label="Help"
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black transition-colors ${
                    helpOpen
                      ? "border-cyan-400 text-cyan-300"
                      : "border-white/20 text-white/50 hover:border-cyan-400/60 hover:text-cyan-300"
                  }`}
                >
                  ?
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-white/50 hover:border-white/40 hover:text-white transition-colors"
                >
                  −
                </button>
              </div>
            </div>

            <p className="mb-1 text-sm font-bold text-white">Add Your Teammates</p>
            <p className="mb-3 text-xs leading-relaxed text-white/60">
              {incomplete.length === 1 ? (
                <>Your team for <span className="text-white">{incomplete[0].title}</span> isn&apos;t complete yet.</>
              ) : (
                <>You have {incomplete.length} teams that still need teammates added.</>
              )}
            </p>

            <AnimatePresence>
              {helpOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] p-3 text-[11px] leading-relaxed text-white/60"
                >
                  <p className="mb-1.5">
                    <span className="font-bold text-cyan-300">What&apos;s a CNS-id?</span> It&apos;s your unique
                    Conscientia registration code, shown on your profile page after you sign up.
                  </p>
                  <p>
                    <span className="font-bold text-cyan-300">Adding teammates:</span> ask each teammate for
                    their own CNS-id, then go to your profile page and enter their codes under this
                    event/workshop&apos;s team section to complete your roster.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Link
              href="/profile"
              className="block w-full rounded-full bg-cyan-400 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
            >
              Go to Profile
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
