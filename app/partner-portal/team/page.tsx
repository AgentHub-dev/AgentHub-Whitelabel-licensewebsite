"use client";

import { useEffect, useState } from "react";
import { partnerApi } from "@/lib/partnerApi";

interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface JwtPayload {
  role?: string;
}

function getRole(): string {
  try {
    const token = localStorage.getItem("partner_token");
    if (!token) return "member";
    const base64 = token.split(".")[1];
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload: JwtPayload = JSON.parse(atob(padded));
    return payload.role ?? "member";
  } catch {
    return "member";
  }
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string>("member");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
    partnerApi
      .listMembers()
      .then((data: Member[]) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setError("Mitglieder konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setFormError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const newMember = await partnerApi.createMember(form);
      if (newMember?.id) {
        setMembers((prev) => [...prev, newMember]);
        setForm({ name: "", email: "", password: "" });
        setFormSuccess("Mitglied erfolgreich hinzugefügt.");
      } else {
        setFormError(newMember?.error ?? "Fehler beim Hinzufügen.");
      }
    } catch {
      setFormError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Mitglied wirklich löschen?")) return;
    setDeletingId(id);
    try {
      await partnerApi.deleteMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Löschen fehlgeschlagen.");
    } finally {
      setDeletingId(null);
    }
  };

  const isOwner = role === "owner" || role === "admin";

  if (!isOwner) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <h2 className="text-[#1d1d1f] text-[18px] font-semibold">
              Kein Zugriff
            </h2>
          </div>
          <p className="text-[#6e6e73] text-[14px]">
            Diese Seite ist nur für Partner-Owner zugänglich.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">
          Team-Verwaltung
        </h1>
        <p className="text-[#6e6e73] text-[15px]">
          Mitglieder hinzufügen, anzeigen und entfernen.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[#1d1d1f] text-[16px] font-semibold">
                Mitglieder
              </h2>
              <span className="text-[#6e6e73] text-[13px]">
                {members.length} gesamt
              </span>
            </div>

            {error && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">
                {error}
              </div>
            )}

            {loading ? (
              <div className="px-6 py-12 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#1a3a5c] animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            ) : members.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-[#1a3a5c]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-[#6e6e73] text-[14px]">
                  Noch keine Mitglieder vorhanden.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#1a3a5c] text-[13px] font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-[#1d1d1f] text-[14px] font-medium">
                          {member.name}
                        </div>
                        <div className="text-[#6e6e73] text-[12px]">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role && (
                        <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#1a3a5c]/10 text-[#1a3a5c] capitalize">
                          {member.role}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(member.id)}
                        disabled={deletingId === member.id}
                        className="p-1.5 text-[#6e6e73] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Mitglied löschen"
                      >
                        {deletingId === member.id ? (
                          <svg
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add member form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-[#1d1d1f] text-[16px] font-semibold mb-5">
              Mitglied hinzufügen
            </h2>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Max Mustermann"
                  required
                  className="w-full px-4 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all placeholder-[#6e6e73]"
                />
              </div>

              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                  E-Mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="max@firma.de"
                  required
                  className="w-full px-4 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all placeholder-[#6e6e73]"
                />
              </div>

              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                  Passwort{" "}
                  <span className="text-[#6e6e73] font-normal">
                    (min. 8 Zeichen)
                  </span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all placeholder-[#6e6e73]"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-[13px]">
                  {formSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Wird hinzugefügt...
                  </>
                ) : (
                  "Mitglied hinzufügen +"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
