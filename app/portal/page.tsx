"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LoginMode = "partner" | "admin";

const PARTNER_PORTAL_URL =
  process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL ?? "https://138.2.173.221";

export default function PortalLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("partner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ungültige Anmeldedaten.");
      } else {
        // Redirect to partner portal with token in URL — portal stores it and cleans URL
        window.location.href = `${PARTNER_PORTAL_URL}/partner-portal/dashboard?token=${encodeURIComponent(data.token)}`;
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: adminSecret }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Ungültiger Admin-Schlüssel.");
      } else {
        localStorage.setItem("admin_token", data.token);
        router.push("/portal/admin");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0071e3] rounded-md flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">AH</span>
          </div>
          <span className="text-[#1d1d1f] font-semibold text-[15px]">AgentHub-OS</span>
        </Link>
        <Link href="/" className="text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">
          ← Zurück
        </Link>
      </nav>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-[#1d1d1f] text-[32px] font-semibold mb-2">
              {mode === "partner" ? "Partner Portal" : "Admin Portal"}
            </h1>
            <p className="text-[#6e6e73] text-[16px]">
              {mode === "partner"
                ? "Melde dich mit deinen Partner-Zugangsdaten an."
                : "Zugang zum Admin-Dashboard."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-[#e8e8ed] rounded-xl p-1 mb-8">
            <button
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                mode === "partner"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
              onClick={() => { setMode("partner"); setError(""); }}
            >
              Partner
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                mode === "admin"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
              onClick={() => { setMode("admin"); setError(""); }}
            >
              Admin
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/40">
            {mode === "partner" ? (
              <form onSubmit={handlePartnerLogin} className="space-y-4">
                <div>
                  <label className="block text-[#1d1d1f] text-[14px] font-medium mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@firma.de"
                    className="input-apple"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[#1d1d1f] text-[14px] font-medium mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="input-apple"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[14px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full btn-primary justify-center !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Anmelden...
                    </span>
                  ) : (
                    "Partner-Portal öffnen →"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[#1d1d1f] text-[14px] font-medium mb-2">
                    Admin-Schlüssel
                  </label>
                  <input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="input-apple"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[14px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminSecret}
                  className="w-full btn-primary justify-center !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Prüfe...
                    </span>
                  ) : (
                    "Admin-Zugang →"
                  )}
                </button>
              </form>
            )}
          </div>

          {mode === "partner" && (
            <p className="text-center text-[#6e6e73] text-[13px] mt-4">
              Partner werden?{" "}
              <Link href="/#partner" className="text-[#0071e3] hover:underline">
                Jetzt bewerben
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
