"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Users, FileSpreadsheet, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import { downloadAsExcel } from "@/lib/exportExcel";

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function DetailField({ label, value, mono }) {
  return (
    <div>
      <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
        {label}
      </p>
      <p style={{ color: "rgba(255,255,255,0.85)", fontFamily: mono ? "monospace" : undefined }}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function DataPage() {
  const { user, loading: authLoading } = useAuth();
  const [assigned, setAssigned] = useState(null); // null = loading, [] = none
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [participants, setParticipants] = useState(null);
  const [teams, setTeams] = useState([]);
  const [groupSize, setGroupSize] = useState(1);
  const [participantsError, setParticipantsError] = useState("");
  const [search, setSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const openIdRef = useRef(null); // latest expanded item, to drop stale responses

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

  // Tap an event to expand its participants, tap again to collapse.
  const toggleItem = (item) => {
    if (selected?.id === item.id) {
      openIdRef.current = null;
      setSelected(null);
      return;
    }
    openItem(item);
  };

  const openItem = async (item) => {
    openIdRef.current = item.id;
    setSelected(item);
    setParticipants(null);
    setTeams([]);
    setGroupSize(1);
    setParticipantsError("");
    setSearch("");
    setExpandedRow(null);
    const res = await authedFetch(`/api/data/registrants?item_id=${encodeURIComponent(item.id)}`);
    const json = await res.json().catch(() => ({}));
    if (openIdRef.current !== item.id) return;
    if (!json.success) {
      setParticipantsError(json.message || "Failed to load participants.");
      return;
    }
    setParticipants(json.data.participants || []);
    setTeams(json.data.teams || []);
    setGroupSize(json.data.item?.group_size || 1);
  };

  const filteredParticipants = useMemo(() => {
    if (!participants) return [];
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      [p.name, p.email, p.phone, p.unique_code, p.college, p.city, p.aadhaar_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [participants, search]);

  const exportParticipants = () => {
    const rows = filteredParticipants.map((p) => ({
      Name: p.name || "",
      "CNS-id": p.unique_code || "",
      Email: p.email || "",
      Phone: p.phone || "",
      "Aadhaar Number": p.aadhaar_number || "",
      College: p.college || "",
      City: p.city || "",
      Food: p.food || "",
      "Accommodation Dates": p.accommodation || "",
    }));
    const label = (selected?.title || selected?.id || "registrants").replace(/[^a-z0-9]+/gi, "_");
    downloadAsExcel(rows, `${label}.xlsx`, "Registrants");
  };

  const filteredAssigned = useMemo(() => {
    if (!assigned) return [];
    const q = itemSearch.trim().toLowerCase();
    if (!q) return assigned;
    return assigned.filter((item) => (item.title || item.id || "").toLowerCase().includes(q));
  }, [assigned, itemSearch]);

  // Team events: one group per team, "Team N — filled/size", leader first.
  // A registrant who isn't on any team row yet is a leader who hasn't added
  // teammates, so they get their own team too (e.g. 1/4) rather than an
  // "Individual" bucket. Non-team events stay a single flat list.
  const groupedParticipants = useMemo(() => {
    const isTeamEvent = groupSize > 1 || teams.length > 0;
    if (!isTeamEvent) {
      return filteredParticipants.length ? [{ label: null, rows: filteredParticipants }] : [];
    }
    const byCode = new Map(filteredParticipants.map((p) => [p.unique_code, p]));
    const used = new Set();
    const groups = [];
    let n = 0;
    for (const team of teams) {
      const codes = [
        team.leader_unique_code,
        ...(team.member_codes || []).filter((c) => c !== team.leader_unique_code),
      ].filter(Boolean);
      n += 1;
      codes.forEach((c) => used.add(c));
      const rows = codes.map((c) => byCode.get(c)).filter(Boolean);
      if (rows.length > 0) groups.push({ label: `Team ${n} — ${codes.length}/${groupSize}`, rows });
    }
    for (const p of filteredParticipants.filter((p) => !used.has(p.unique_code))) {
      n += 1;
      groups.push({ label: `Team ${n} — 1/${groupSize}`, rows: [p] });
    }
    return groups;
  }, [filteredParticipants, teams, groupSize]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030304",
        color: "white",
        padding: "12vh max(1rem, 5vw) 8vh",
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
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ position: "relative", marginBottom: "0.4rem" }}>
                <Search size={13} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search event or workshop…"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.8rem 0.55rem 2.1rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.03)",
                    color: "white",
                    fontSize: "0.78rem",
                    outline: "none",
                  }}
                />
              </div>
              {filteredAssigned.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", padding: "0.4rem 0.2rem" }}>
                  No workshop/event matches your search.
                </p>
              )}
              {filteredAssigned.map((item) => {
                const isOpen = selected?.id === item.id;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      aria-expanded={isOpen}
                      className="glass-card"
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        textAlign: "left",
                        padding: "1rem 1.2rem",
                        borderRadius: "16px",
                        border: `1px solid ${isOpen ? "rgba(51,214,255,0.6)" : "rgba(255,255,255,0.1)"}`,
                        background: isOpen ? "rgba(51,214,255,0.1)" : "rgba(255,255,255,0.02)",
                        color: "white",
                        cursor: "pointer",
                        boxShadow: isOpen ? "0 0 30px rgba(51,214,255,0.15)" : "none",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                      </div>
                      <ChevronDown
                        size={18}
                        style={{
                          flexShrink: 0,
                          color: "rgba(255,255,255,0.5)",
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: "1rem 0.2rem 0.6rem", minWidth: 0 }}>
              {participantsError ? (
                <p style={{ color: "#f87171" }}>{participantsError}</p>
              ) : participants === null ? (
                <LoadingState label="Loading Participants" accentColor="#33d6ff" inline />
              ) : (
                <div>

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
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.8rem", marginBottom: "1.2rem" }}>
                    <div style={{ position: "relative", maxWidth: "360px", flex: "1 1 240px", minWidth: 0 }}>
                      <Search size={14} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, CNS-id…"
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
                    <button
                      type="button"
                      onClick={exportParticipants}
                      disabled={filteredParticipants.length === 0}
                      className="glass-card max-sm:w-full max-sm:justify-center"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.65rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(51,214,255,0.35)",
                        background: "rgba(51,214,255,0.08)",
                        color: "#33d6ff",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: filteredParticipants.length === 0 ? "not-allowed" : "pointer",
                        opacity: filteredParticipants.length === 0 ? 0.5 : 1,
                      }}
                    >
                      <FileSpreadsheet size={14} />
                      Download as Excel
                    </button>
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.8rem", fontSize: "0.8rem" }}>
                    Showing {filteredParticipants.length} of {participants.length}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                    {groupedParticipants.map((group, gi) => (
                      <div key={gi}>
                        {group.label && (
                          <p
                            style={{
                              padding: "0.3rem 0.2rem",
                              marginBottom: "0.5rem",
                              fontSize: "0.65rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontWeight: 700,
                              color: "rgba(51,214,255,0.8)",
                            }}
                          >
                            {group.label}
                          </p>
                        )}
                        <div className="glass-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                          {group.rows.map((p, i) => {
                            const rowKey = p.unique_code || `${gi}-${i}`;
                            const isOpen = expandedRow === rowKey;
                            return (
                              <div
                                key={rowKey}
                                style={{
                                  borderBottom: i === group.rows.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedRow(isOpen ? null : rowKey)}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.7rem",
                                    padding: "0.7rem 0.9rem",
                                    background: isOpen ? "rgba(51,214,255,0.06)" : "transparent",
                                    border: "none",
                                    color: "white",
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      flexShrink: 0,
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
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name || "—"}</p>
                                    <p style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#33d6ff" }}>
                                      {p.unique_code || "—"}
                                    </p>
                                  </div>
                                  <ChevronDown
                                    size={15}
                                    style={{
                                      flexShrink: 0,
                                      color: "rgba(255,255,255,0.4)",
                                      transform: isOpen ? "rotate(180deg)" : "none",
                                      transition: "transform 0.2s ease",
                                    }}
                                  />
                                </button>
                                {isOpen && (
                                  <div
                                    className="grid grid-cols-1 gap-x-4 gap-y-2 px-3.5 pb-3.5 pt-1 text-[0.78rem] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:pl-14"
                                    style={{ overflowWrap: "anywhere" }}
                                  >
                                    <DetailField label="Email" value={p.email} />
                                    <DetailField label="Phone" value={p.phone} />
                                    <DetailField label="Aadhaar" value={p.aadhaar_number} mono />
                                    <DetailField label="College" value={p.college} />
                                    <DetailField label="City" value={p.city} />
                                    <DetailField label="Food" value={p.food} />
                                    <DetailField label="Accommodation" value={p.accommodation} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <p className="glass-card" style={{ borderRadius: "16px", padding: "1.5rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                        {participants.length === 0 ? "No one has registered yet." : "No participants match your search."}
                      </p>
                    )}
                  </div>
                </div>
              )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
