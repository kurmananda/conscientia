"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

function paymentTone(status) {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "success") return { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#34d399" };
  if (s === "pending") return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#fbbf24" };
  if (s === "failed") return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#f87171" };
  return { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.5)" };
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function DataPage() {
  const { user, loading: authLoading } = useAuth();
  const [assigned, setAssigned] = useState(null); // null = loading, [] = none
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [participants, setParticipants] = useState(null);
  const [teams, setTeams] = useState([]);
  const [participantsError, setParticipantsError] = useState("");
  const [search, setSearch] = useState("");

  async function authedFetch(url) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAssigned([]);
      return;
    }
    let active = true;
    authedFetch("/api/data/access")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (!json.success) {
          setError(json.message || "Failed to load.");
          setAssigned([]);
          return;
        }
        setAssigned(json.data || []);
      })
      .catch(() => active && setError("Failed to load."));
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const openItem = async (item) => {
    setSelected(item);
    setParticipants(null);
    setTeams([]);
    setParticipantsError("");
    setSearch("");
    const res = await authedFetch(`/api/data/registrants?item_id=${encodeURIComponent(item.id)}`);
    const json = await res.json().catch(() => ({}));
    if (!json.success) {
      setParticipantsError(json.message || "Failed to load participants.");
      return;
    }
    setParticipants(json.data.participants || []);
    setTeams(json.data.teams || []);
  };

  const filteredParticipants = useMemo(() => {
    if (!participants) return [];
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      [p.name, p.email, p.phone, p.unique_code, p.college, p.city]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [participants, search]);

  const paidCount = useMemo(
    () => (participants || []).filter((p) => (p.payment_status || "").toLowerCase() === "paid").length,
    [participants]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030304",
        color: "white",
        padding: "12vh 5vw 8vh",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(ellipse at 15% 0%, rgba(51,214,255,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(168,85,247,0.08) 0%, transparent 55%)",
        }}
      />
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 900,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #fff 40%, #33d6ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Coordinator Data
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "3rem" }}>
          Registrant details for workshops/events you've been assigned to.
        </p>

        {authLoading || assigned === null ? (
          <LoadingState label="Loading" accentColor="#33d6ff" inline />
        ) : !user ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>
              Sign in to view your assigned workshops/events.
            </p>
            <Link href="/login?redirect=/data" className="btn-primary">
              Sign In / Create Account
            </Link>
          </div>
        ) : error ? (
          <p style={{ color: "#f87171" }}>{error}</p>
        ) : assigned.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              You haven't been assigned any event or workshop. Ask admin to send permission.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem" }} className="max-lg:grid-cols-1">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {assigned.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="glass-card"
                  style={{
                    textAlign: "left",
                    padding: "1rem 1.2rem",
                    borderRadius: "16px",
                    border: `1px solid ${selected?.id === item.id ? "rgba(51,214,255,0.6)" : "rgba(255,255,255,0.1)"}`,
                    background: selected?.id === item.id ? "rgba(51,214,255,0.1)" : "rgba(255,255,255,0.02)",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: selected?.id === item.id ? "0 0 30px rgba(51,214,255,0.15)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "rgba(51,214,255,0.8)",
                      fontWeight: 700,
                    }}
                  >
                    {item.kind}
                  </span>
                  <p style={{ fontWeight: 700, margin: "0.3rem 0" }}>{item.title || item.id}</p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Users size={12} />
                    {item.count} registered
                  </p>
                </button>
              ))}
            </div>

            <div>
              {!selected ? (
                <div className="glass-card rounded-2xl p-10 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Select a workshop/event to view participants.
                </div>
              ) : participantsError ? (
                <p style={{ color: "#f87171" }}>{participantsError}</p>
              ) : participants === null ? (
                <LoadingState label="Loading Participants" accentColor="#33d6ff" inline />
              ) : (
                <div>
                  <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "1.4rem", marginBottom: "0.3rem" }}>
                    {selected.title || selected.id}
                  </h2>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", margin: "1rem 0 1.5rem" }}>
                    <div className="glass-card" style={{ padding: "0.8rem 1.2rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Users size={16} color="#33d6ff" />
                      <div>
                        <p style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>{participants.length}</p>
                        <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Registered
                        </p>
                      </div>
                    </div>
                    <div className="glass-card" style={{ padding: "0.8rem 1.2rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <CheckCircle2 size={16} color="#34d399" />
                      <div>
                        <p style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>{paidCount}</p>
                        <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Paid
                        </p>
                      </div>
                    </div>
                  </div>

                  {teams.length > 0 && (
                    <div className="glass-card" style={{ borderRadius: "16px", padding: "1rem 1.2rem", marginBottom: "1.2rem" }}>
                      <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(51,214,255,0.8)", fontWeight: 700, marginBottom: "0.7rem" }}>
                        Teams ({teams.length})
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {teams.map((team) => (
                          <div key={team.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginRight: "0.3rem" }}>
                              {team.confirmed ? "Confirmed" : "Pending"}:
                            </span>
                            {[team.leader_unique_code, ...(team.member_codes || []).filter((c) => c !== team.leader_unique_code)].map((code) => (
                              <span
                                key={code}
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "0.7rem",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "999px",
                                  border: "1px solid rgba(51,214,255,0.3)",
                                  background: "rgba(51,214,255,0.08)",
                                  color: "#33d6ff",
                                }}
                              >
                                {code}
                                {code === team.leader_unique_code ? " (leader)" : ""}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ position: "relative", marginBottom: "1.2rem", maxWidth: "360px" }}>
                    <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email, phone, CNS-id, college…"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem 0.65rem 2.3rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.03)",
                        color: "white",
                        fontSize: "0.8rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.8rem", fontSize: "0.8rem" }}>
                    Showing {filteredParticipants.length} of {participants.length}
                  </p>

                  <div className="glass-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", background: "rgba(255,255,255,0.02)" }}>
                            {["", "Name", "CNS-id", "Email", "Phone", "College", "City", "Amount", "Payment"].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "0.7rem 0.8rem",
                                  color: "rgba(255,255,255,0.4)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  fontSize: "0.65rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredParticipants.map((p, i) => {
                            const tone = paymentTone(p.payment_status);
                            return (
                              <tr
                                key={i}
                                style={{
                                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                                  background: i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                                }}
                              >
                                <td style={{ padding: "0.55rem 0.8rem" }}>
                                  <div
                                    style={{
                                      width: "26px",
                                      height: "26px",
                                      borderRadius: "50%",
                                      background: "linear-gradient(135deg, rgba(51,214,255,0.3), rgba(168,85,247,0.3))",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.6rem",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {initials(p.name)}
                                  </div>
                                </td>
                                <td style={{ padding: "0.55rem 0.8rem", fontWeight: 600 }}>{p.name || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem", fontFamily: "monospace", color: "#33d6ff" }}>{p.unique_code || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>{p.email || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>{p.phone || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>{p.college || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>{p.city || "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>{p.amount ? `₹${p.amount}` : "—"}</td>
                                <td style={{ padding: "0.55rem 0.8rem" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "0.2rem 0.6rem",
                                      borderRadius: "999px",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      background: tone.bg,
                                      border: `1px solid ${tone.border}`,
                                      color: tone.text,
                                    }}
                                  >
                                    {p.payment_status || "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredParticipants.length === 0 && (
                            <tr>
                              <td colSpan={9} style={{ padding: "1.5rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                                {participants.length === 0 ? "No one has registered yet." : "No participants match your search."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
