"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { partnerApi } from "@/lib/partnerApi";

interface Customer {
  id: string;
  name: string;
  info: string | null;
  hostingType: string;
  domain: string | null;
  serverLicenseKey: string | null;
  seatCount: number;
  activeSeatCount: number;
  monthlyRevenue: number;
  partnerProfit: number;
  createdAt: string;
}

function fmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getIsOwner(): boolean {
  try {
    const token = localStorage.getItem("partner_token");
    if (!token) return false;
    const b = token.split(".")[1];
    const p = b + "=".repeat((4 - (b.length % 4)) % 4);
    const role = JSON.parse(atob(p)).role;
    return role === "owner" || role === "admin";
  } catch { return false; }
}

export default function LizenzenPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formInfo, setFormInfo] = useState("");
  const [formHosting, setFormHosting] = useState("partner_hosted");
  const [formDomain, setFormDomain] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setIsOwner(getIsOwner());
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await partnerApi.listCustomers();
      setCustomers(data.customers ?? []);
    } catch {
      setError("Kunden konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Name ist erforderlich."); return; }
    setFormSaving(true);
    setFormError("");
    try {
      const created = await partnerApi.createCustomer({
        name: formName.trim(),
        info: formInfo.trim() || undefined,
        hostingType: formHosting,
        domain: formDomain.trim() || undefined,
        serverLicenseKey: formKey.trim() || undefined,
      });
      if (created.error) { setFormError(created.error); return; }
      setCustomers((prev) => [{ ...created, monthlyRevenue: 0, partnerProfit: 0 }, ...prev]);
      setShowForm(false);
      setFormName(""); setFormInfo(""); setFormHosting("partner_hosted"); setFormDomain(""); setFormKey("");
    } catch {
      setFormError("Verbindungsfehler.");
    } finally {
      setFormSaving(false);
    }
  }

  const totalProfit = customers.reduce((s, c) => s + c.partnerProfit, 0);
  const totalSeats = customers.reduce((s, c) => s + c.activeSeatCount, 0);

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

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">Lizenzen</h1>
          <p className="text-[#6e6e73] text-[15px]">Verwalte deine Server-Kunden und deren Lizenzen.</p>
        </div>
        {isOwner && (
          <button
            onClick={() => { setShowForm(true); setFormError(""); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neuer Kunde
          </button>
        )}
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px]">{error}</div>}

      {/* Summary stats */}
      {customers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Server-Kunden", value: String(customers.length), sub: "Gesamt" },
            { label: "Aktive Seats", value: String(totalSeats), sub: "Über alle Kunden" },
            { label: "Monatl. Gewinn", value: `${fmt(totalProfit)} €`, sub: "Deine Marge gesamt" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-[#6e6e73] text-[11px] font-semibold uppercase tracking-wider mb-1">{label}</div>
              <div className="text-[#1d1d1f] text-[24px] font-bold leading-tight">{value}</div>
              <div className="text-[#6e6e73] text-[12px] mt-1">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Neuer Server-Kunde</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Muster GmbH"
                  className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
              </div>
              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Info / Notiz</label>
                <textarea value={formInfo} onChange={(e) => setFormInfo(e.target.value)} placeholder="Optionale Anmerkung..." rows={2}
                  className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Hosting</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "partner_hosted", label: "Partner-Hosted", desc: "Du hostest den Server" },
                    { value: "self_hosted", label: "Self-Hosted", desc: "Kunde hostet selbst" },
                  ].map((opt) => (
                    <button type="button" key={opt.value} onClick={() => setFormHosting(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${formHosting === opt.value ? "border-[#1a3a5c] bg-[#1a3a5c]/5" : "border-[#d2d2d7] bg-[#f5f5f7] hover:border-[#1a3a5c]/40"}`}>
                      <div className="text-[13px] font-medium text-[#1d1d1f]">{opt.label}</div>
                      <div className="text-[11px] text-[#6e6e73]">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Domain (optional)</label>
                  <input type="text" value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="kunde.example.com"
                    className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Lizenz-Key (optional)</label>
                  <input type="text" value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="WL-XXXX-XXXX-..."
                    className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all font-mono" />
                </div>
              </div>
              {formError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">{formError}</div>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={formSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50">
                  {formSaving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  Erstellen
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-[#1d1d1f] text-[14px] font-medium rounded-xl border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-colors">
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer list */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h3 className="text-[#1d1d1f] text-[17px] font-semibold mb-2">Noch keine Kunden</h3>
          <p className="text-[#6e6e73] text-[14px] mb-6">Erstelle deinen ersten Server-Kunden um Lizenzen zu verwalten.</p>
          {isOwner && (
            <button onClick={() => setShowForm(true)} className="px-6 py-2.5 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors">
              Ersten Kunden anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/partner-portal/lizenzen/${c.id}`}
              className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#1a3a5c]/20 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#1a3a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[#1d1d1f] text-[15px] font-semibold truncate">{c.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      c.hostingType === "partner_hosted"
                        ? "bg-[#1a3a5c]/10 text-[#1a3a5c]"
                        : "bg-[#6e6e73]/10 text-[#6e6e73]"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.hostingType === "partner_hosted" ? "bg-[#1a3a5c]" : "bg-[#6e6e73]"}`} />
                      {c.hostingType === "partner_hosted" ? "Partner-Hosted" : "Self-Hosted"}
                    </span>
                    {c.serverLicenseKey && (
                      <span className="font-mono text-[11px] text-[#6e6e73] bg-[#f5f5f7] px-2 py-0.5 rounded-lg">{c.serverLicenseKey}</span>
                    )}
                  </div>
                  {c.info && <p className="text-[#6e6e73] text-[13px] truncate mb-1">{c.info}</p>}
                  {c.domain && (
                    <p className="text-[#0071e3] text-[12px]">{c.domain}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right hidden sm:block">
                  <div className="text-[#1d1d1f] text-[15px] font-semibold">{c.activeSeatCount} / {c.seatCount} Seats</div>
                  <div className="text-[#6e6e73] text-[12px]">{fmt(c.partnerProfit)} € Gewinn/Mo.</div>
                </div>
                <svg className="w-5 h-5 text-[#d2d2d7] group-hover:text-[#1a3a5c] transition-colors flex-shrink-0 self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              {/* Mobile stats */}
              <div className="sm:hidden mt-3 pt-3 border-t border-gray-50 flex gap-4">
                <span className="text-[#6e6e73] text-[12px]">{c.activeSeatCount} / {c.seatCount} Seats aktiv</span>
                <span className="text-[#1a3a5c] text-[12px] font-medium">{fmt(c.partnerProfit)} € Gewinn/Mo.</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
