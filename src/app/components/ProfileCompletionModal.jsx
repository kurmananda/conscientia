"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import useProfile from "../hooks/useProfile";

export default function ProfileCompletionModal() {
  const { user } = useAuth();
  const { profile, loading, save } = useProfile();
  const [form, setForm] = useState({ name: "", phone: "", college: "", city: "", gender: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const missing =
    !loading && !!user && (!profile || !profile.name || !profile.phone || !profile.college);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        college: profile.college || "",
        city: profile.city || "",
        gender: profile.gender || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.college.trim()) {
      setError("Name, phone number, and college are required.");
      return;
    }
    setSaving(true);
    const result = await save({
      name: form.name.trim(),
      phone: form.phone.trim(),
      college: form.college.trim(),
      city: form.city.trim(),
      gender: form.gender || null,
    });
    setSaving(false);
    if (result.error) setError(result.error);
  };

  return (
    <AnimatePresence>
      {missing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0c10] p-5 sm:p-7"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/90 mb-2">
              One Last Step
            </p>
            <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl">
              Complete Your Profile
            </h2>
            <p className="mb-5 text-sm text-white/50">
              We need a few details to register you for events and workshops.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Full Name *">
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="Phone Number *">
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="College Name *">
                <input
                  required
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="City (optional)">
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="Gender (optional)">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                >
                  <option value="">Prefer not to specify</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="rather_not_say">Neutral</option>
                </select>
              </Field>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-cyan-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save & Continue"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </label>
      {children}
    </div>
  );
}
