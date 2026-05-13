"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ungültige Anmeldedaten.");
        return;
      }

      if (data.isAdmin) {
        // Admin: cookie is set server-side (HttpOnly) — no token in client storage
        localStorage.setItem("partner_token", data.token);
        router.push("/portal/admin");
      } else {
        // Partner: store token in localStorage, redirect without token in URL
        localStorage.setItem("partner_token", data.token);
        router.push("/partner-portal/dashboard");
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
            <h1 className="text-[#1d1d1f] text-[32px] font-semibold mb-2">Anmelden</h1>
            <p className="text-[#6e6e73] text-[16px]">
              Melde dich mit deinen Zugangsdaten an.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/40">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[#1d1d1f] text-[14px] font-medium mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
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
                    Wird geprüft...
                  </span>
                ) : (
                  "Anmelden →"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
