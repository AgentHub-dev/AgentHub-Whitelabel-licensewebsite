"use client";

import { useEffect, useState } from "react";
import { partnerApi } from "@/lib/partnerApi";

interface Pricing {
  tier2Price: number;
  tier3PartnerFee: number;
  alexServerFloor: number;
  alexSeatFloor: number;
  minSeatPrice: number;
}

function fmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTokenPayload(): { role: string; isAdmin: boolean } {
  try {
    const token = localStorage.getItem("partner_token");
    if (!token) return { role: "member", isAdmin: false };
    const b = token.split(".")[1];
    const p = b + "=".repeat((4 - (b.length % 4)) % 4);
    const payload = JSON.parse(atob(p));
    return { role: payload.role ?? "member", isAdmin: payload.isAdmin === true };
  } catch { return { role: "member", isAdmin: false }; }
}

function SplitBar({ a, b, total, colorA, colorB }: { a: number; b: number; total: number; colorA: string; colorB: string }) {
  return (
    <div className="h-3 rounded-full overflow-hidden flex">
      <div className={`${colorA} transition-all`} style={{ width: `${(a / total) * 100}%` }} />
      <div className={`${colorB} transition-all`} style={{ width: `${(b / total) * 100}%` }} />
    </div>
  );
}

export default function PreisePage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [tier2, setTier2] = useState("");
  const [tier3, setTier3] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const { role, isAdmin: admin } = getTokenPayload();
    setIsOwner(role === "owner" || role === "admin");
    setIsAdmin(admin);
    partnerApi.getPricing()
      .then((data: Pricing) => {
        setPricing(data);
        setTier2(String(data.tier2Price));
        setTier3(String(data.tier3PartnerFee));
      })
      .catch(() => setError("Preise konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const t2 = parseFloat(tier2);
    const t3 = parseFloat(tier3);
    if (isNaN(t2) || isNaN(t3)) { setSaveError("Bitte gültige Zahlen eingeben."); setSaving(false); return; }
    if (!isAdmin && t2 < (pricing?.alexServerFloor ?? 149)) { setSaveError(`Mindestpreis Server-Lizenz: ${pricing?.alexServerFloor ?? 149}€`); setSaving(false); return; }
    if (t2 < 0) { setSaveError("Preis muss >= 0 sein."); setSaving(false); return; }
    if (t3 < 0) { setSaveError("Partner-Gebühr muss >= 0 sein."); setSaving(false); return; }
    try {
      const updated = await partnerApi.updatePricing({ tier2Price: t2, tier3PartnerFee: t3 });
      if (updated.error) { setSaveError(updated.error); }
      else { setPricing(updated); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
    } catch { setSaveError("Verbindungsfehler. Bitte versuche es erneut."); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-[#1a3a5c] animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const serverMargin = pricing ? pricing.tier2Price - pricing.alexServerFloor : 0;
  const seatMargin = pricing ? pricing.tier3PartnerFee : 0;
  const seatTotal = pricing ? pricing.minSeatPrice : 0;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">Preise</h1>
        <p className="text-[#6e6e73] text-[15px]">Lege fest, was deine Kunden zahlen und was du verdienst.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px]">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* ── Server-Lizenz Split ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-[#1a3a5c]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1a3a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Server-Lizenz</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: "AgentHub erhält", sublabel: "Fixgebühr / Server", value: `${fmt(pricing?.alexServerFloor ?? 149)} €`, bg: "bg-[#f5f5f7]", text: "text-[#1d1d1f]" },
                { label: "Du verdienst", sublabel: "Deine Marge / Server", value: `${fmt(serverMargin)} €`, bg: "bg-[#1a3a5c]/5", text: "text-[#1a3a5c]" },
                { label: "Kunde zahlt", sublabel: "Gesamt / Server", value: `${fmt(pricing?.tier2Price ?? 149)} €`, bg: "bg-[#c9a84c]/10", text: "text-[#a07c30]" },
              ].map(({ label, sublabel, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-2xl p-5`}>
                  <div className="text-[#6e6e73] text-[11px] font-semibold uppercase tracking-wider mb-1">{label}</div>
                  <div className={`${text} text-[26px] font-bold leading-tight`}>{value}</div>
                  <div className="text-[#6e6e73] text-[12px] mt-1">{sublabel}</div>
                </div>
              ))}
            </div>
            {pricing && pricing.tier2Price > 0 && (
              <>
                <div className="flex text-[11px] text-[#6e6e73] mb-1.5 justify-between">
                  <span>Aufteilung pro Server-Lizenz</span>
                  <span>{fmt(pricing.tier2Price)} € gesamt</span>
                </div>
                <SplitBar a={pricing.alexServerFloor} b={serverMargin} total={pricing.tier2Price} colorA="bg-[#1a3a5c]" colorB="bg-[#c9a84c]" />
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1a3a5c]" /><span className="text-[11px] text-[#6e6e73]">AgentHub ({fmt(pricing.alexServerFloor)} €)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]" /><span className="text-[11px] text-[#6e6e73]">Du ({fmt(serverMargin)} €)</span></div>
                </div>
              </>
            )}
          </div>

          {/* ── Seat-Lizenz Split ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-[#1a3a5c]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1a3a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Seat-Lizenz (pro User)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: "AgentHub erhält", sublabel: "Fixgebühr / Seat", value: `${fmt(pricing?.alexSeatFloor ?? 25)} €`, bg: "bg-[#f5f5f7]", text: "text-[#1d1d1f]" },
                { label: "Du verdienst", sublabel: "Deine Marge / Seat", value: `${fmt(seatMargin)} €`, bg: "bg-[#1a3a5c]/5", text: "text-[#1a3a5c]" },
                { label: "Kunde zahlt", sublabel: "Gesamt / Seat", value: `${fmt(seatTotal)} €`, bg: "bg-[#c9a84c]/10", text: "text-[#a07c30]" },
              ].map(({ label, sublabel, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-2xl p-5`}>
                  <div className="text-[#6e6e73] text-[11px] font-semibold uppercase tracking-wider mb-1">{label}</div>
                  <div className={`${text} text-[26px] font-bold leading-tight`}>{value}</div>
                  <div className="text-[#6e6e73] text-[12px] mt-1">{sublabel}</div>
                </div>
              ))}
            </div>
            {pricing && seatTotal > 0 && (
              <>
                <div className="flex text-[11px] text-[#6e6e73] mb-1.5 justify-between">
                  <span>Aufteilung pro Seat</span>
                  <span>{fmt(seatTotal)} € gesamt</span>
                </div>
                <SplitBar a={pricing.alexSeatFloor} b={seatMargin} total={seatTotal} colorA="bg-[#1a3a5c]" colorB="bg-[#c9a84c]" />
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1a3a5c]" /><span className="text-[11px] text-[#6e6e73]">AgentHub ({fmt(pricing.alexSeatFloor)} €)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]" /><span className="text-[11px] text-[#6e6e73]">Du ({fmt(seatMargin)} €)</span></div>
                </div>
              </>
            )}
          </div>

          {/* ── Preise bearbeiten ── */}
          {isOwner ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-1">Preise anpassen</h2>
              <p className="text-[#6e6e73] text-[13px] mb-5">Ändere deine Margen für Server- und Seat-Lizenzen.</p>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                      Server-Lizenzpreis (€)
                      {isAdmin
                        ? <span className="text-[#c9a84c] font-normal ml-1">Admin: kein Mindestpreis</span>
                        : <span className="text-[#6e6e73] font-normal ml-1">min. {pricing?.alexServerFloor ?? 149} €</span>
                      }
                    </label>
                    <div className="relative">
                      <input type="number" value={tier2} onChange={(e) => { setTier2(e.target.value); setSaveError(""); }} min={isAdmin ? 0 : (pricing?.alexServerFloor ?? 149)} step="1"
                        className="w-full px-4 py-2.5 pr-10 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73] text-[13px]">€</span>
                    </div>
                    <p className="text-[#6e6e73] text-[11px] mt-1">
                      {isAdmin
                        ? <span className="text-[#c9a84c] font-semibold">Admin-Override: 0 € möglich</span>
                        : <>Deine Marge: <span className="font-semibold text-[#1a3a5c]">{fmt(Math.max(0, parseFloat(tier2) - (pricing?.alexServerFloor ?? 149)))} €</span></>
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                      Meine Marge pro Seat (€)
                      <span className="text-[#6e6e73] font-normal ml-1">min. 0 €</span>
                    </label>
                    <div className="relative">
                      <input type="number" value={tier3} onChange={(e) => { setTier3(e.target.value); setSaveError(""); }} min="0" step="0.5"
                        className="w-full px-4 py-2.5 pr-10 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73] text-[13px]">€</span>
                    </div>
                    <p className="text-[#6e6e73] text-[11px] mt-1">Kunde zahlt: <span className="font-semibold text-[#1a3a5c]">{fmt((pricing?.alexSeatFloor ?? 25) + Math.max(0, parseFloat(tier3) || 0))} €</span> / Seat</p>
                  </div>
                </div>

                {saveError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">{saveError}</div>}
                {saveSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-600 text-[13px]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Preise erfolgreich gespeichert.
                  </div>
                )}

                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  Preise speichern
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-1">Aktuelle Preise</h2>
              <p className="text-[#6e6e73] text-[13px]">Nur der Partner-Owner kann Preise anpassen.</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-[#1d1d1f] text-[15px] font-semibold mb-4">Aktuelle Preise</h3>
            <div className="space-y-3">
              {[
                { label: "Server-Lizenz", value: `${fmt(pricing?.tier2Price ?? 0)} €` },
                { label: "↳ davon AgentHub", value: `${fmt(pricing?.alexServerFloor ?? 149)} €` },
                { label: "↳ davon du", value: `${fmt(serverMargin)} €` },
                { label: "Preis / Seat (gesamt)", value: `${fmt(pricing?.minSeatPrice ?? 0)} €` },
                { label: "↳ davon AgentHub", value: `${fmt(pricing?.alexSeatFloor ?? 25)} €` },
                { label: "↳ davon du", value: `${fmt(pricing?.tier3PartnerFee ?? 0)} €` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[#6e6e73] text-[13px]">{label}</span>
                  <span className="text-[#1d1d1f] text-[13px] font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-5 border ${isAdmin ? "bg-[#c9a84c]/10 border-[#c9a84c]/30" : "bg-[#f5f5f7] border-[#d2d2d7]/40"}`}>
            <h3 className="text-[#1d1d1f] text-[13px] font-semibold mb-3">{isAdmin ? "Admin-Hinweise" : "Hinweise"}</h3>
            <div className="space-y-2.5">
              {(isAdmin ? [
                "Admin-Modus: alle Preisfloors deaktiviert",
                "Server-Lizenz: auch 0 € möglich",
                "Seat-Lizenz: auch 0 € möglich",
                "Preisänderungen gelten sofort",
              ] : [
                `Server-Lizenz: mindestens ${pricing?.alexServerFloor ?? 149} €`,
                "Seat-Marge: beliebig hoch, auch 0 € möglich",
                "Preisänderungen gelten für neue Kunden sofort",
                "Bestehende Verträge laufen zum alten Preis weiter",
              ]).map((text) => (
                <div key={text} className="flex items-start gap-2">
                  <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${isAdmin ? "bg-[#c9a84c]" : "bg-[#6e6e73]"}`} />
                  <span className={`text-[12px] leading-relaxed ${isAdmin ? "text-[#a07c30]" : "text-[#6e6e73]"}`}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
