"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface License {
  id: string;
  key: string;
  tenant_name: string;
  tenant_email: string;
  status: "active" | "trial" | "paused" | "cancelled" | "expired";
  expires_at: string | null;
  max_users: number;
  created_at: string;
  last_checked_at: string | null;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  active: { label: "Aktiv", className: "badge-active", icon: "●" },
  trial: { label: "Trial", className: "badge-trial", icon: "●" },
  paused: { label: "Pausiert", className: "badge-paused", icon: "◐" },
  cancelled: { label: "Gekündigt", className: "badge-cancelled", icon: "○" },
  expired: { label: "Abgelaufen", className: "badge-expired", icon: "○" },
};

function KeyDisplay({ licenseKey }: { licenseKey: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-[#d2d2d7]/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#6e6e73] text-[13px] font-medium uppercase tracking-wider">Lizenz-Key</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisible(!visible)}
            className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors text-[13px]"
          >
            {visible ? "Verstecken" : "Anzeigen"}
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-[#0071e3] hover:text-[#0077ed] transition-colors text-[13px] font-medium"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kopiert!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Kopieren
              </>
            )}
          </button>
        </div>
      </div>
      <code className="text-[#1d1d1f] text-[16px] font-mono font-semibold tracking-widest block">
        {visible ? licenseKey : licenseKey.replace(/[A-Z0-9]/g, "•")}
      </code>
    </div>
  );
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/portal");
      return;
    }

    fetch("/api/customer/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem("customer_token");
          router.push("/portal");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.license) setLicense(data.license);
        else if (data?.error) setError(data.error);
      })
      .catch(() => setError("Verbindungsfehler."))
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    localStorage.removeItem("customer_token");
    router.push("/portal");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6e6e73] text-[15px]">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#d2d2d7]/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0071e3] rounded-md flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">AH</span>
            </div>
            <span className="text-[#1d1d1f] font-semibold text-[15px]">AgentHub-OS</span>
          </Link>
          <div className="flex items-center gap-4">
            {license && (
              <span className="text-[#6e6e73] text-[14px]">{license.tenant_email}</span>
            )}
            <button
              onClick={logout}
              className="text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[#1d1d1f] text-[30px] font-semibold mb-1">Meine Lizenz</h1>
          <p className="text-[#6e6e73] text-[16px]">
            {license?.tenant_name || "Dein Account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[15px] mb-6">
            {error}
          </div>
        )}

        {license && (
          <div className="space-y-5">
            {/* Status card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#d2d2d7]/40">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#1d1d1f] text-[18px] font-semibold">Status</h2>
                <span className={statusConfig[license.status]?.className || "badge"}>
                  <span className="mr-1.5">{statusConfig[license.status]?.icon}</span>
                  {statusConfig[license.status]?.label || license.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Plan", value: "Whitelabel Full Stack" },
                  { label: "Max. Benutzer", value: `${license.max_users} Endkunden` },
                  { label: "Aktiv seit", value: formatDate(license.created_at) },
                  { label: "Gültig bis", value: license.expires_at ? formatDate(license.expires_at) : "Unbegrenzt" },
                  { label: "Letzter Check", value: formatDate(license.last_checked_at) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="text-[#1d1d1f] text-[15px] font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* License key */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#d2d2d7]/40">
              <h2 className="text-[#1d1d1f] text-[18px] font-semibold mb-4">Dein Lizenz-Key</h2>
              <KeyDisplay licenseKey={license.key} />
              <p className="text-[#6e6e73] text-[13px] mt-3">
                Verwende diesen Key bei der Installation via setup.sh auf deinem Server.
              </p>
            </div>

            {/* Setup guide */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#d2d2d7]/40">
              <h2 className="text-[#1d1d1f] text-[18px] font-semibold mb-5">Quick Setup</h2>
              <div className="space-y-4">
                {[
                  { step: "1", label: "Repository clonen", code: "git clone git@github-agenthub:mb247alex-jpg/AgentHub-Whitelabel-deployment.git" },
                  { step: "2", label: "In Verzeichnis wechseln", code: "cd AgentHub-Whitelabel-deployment/wl-stack" },
                  { step: "3", label: "Setup ausführen", code: "bash setup.sh" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-6 h-6 bg-[#0071e3]/10 text-[#0071e3] rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-1">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#1d1d1f] text-[14px] font-medium mb-1">{item.label}</p>
                      <code className="block bg-[#f5f5f7] rounded-lg px-3 py-2 text-[12px] text-[#424245] font-mono overflow-auto">
                        {item.code}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support */}
            <div className="bg-[#0071e3]/5 rounded-3xl p-6 border border-[#0071e3]/20">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💬</div>
                <div>
                  <h3 className="text-[#1d1d1f] text-[16px] font-semibold mb-1">Support</h3>
                  <p className="text-[#6e6e73] text-[14px] mb-3">
                    Fragen? Probleme beim Setup? Wir helfen dir direkt weiter.
                  </p>
                  <a href="mailto:alex@agenthub.de" className="text-[#0071e3] text-[14px] font-medium hover:underline">
                    alex@agenthub.de →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
