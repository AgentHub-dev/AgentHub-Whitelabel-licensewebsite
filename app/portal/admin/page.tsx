"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface License {
  id: string;
  key: string;
  tenant_name: string | null;
  tenant_email: string | null;
  status: string;
  tier: string | null;
  expires_at: string | null;
  max_users: number;
  custom_price: number | null;
  is_free: boolean;
  bound_identifier: string | null;
  partner_id: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  created_at: string;
  last_checked_at: string | null;
  notes: string | null;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  tier: string;
  is_active: boolean;
  tier2_price: string;
  tier3_partner_fee: string;
  customer_count: string;
  active_seat_count: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  info: string | null;
  customer_email: string | null;
  license_key: string | null;
  license_status: string | null;
  custom_price: number | null;
  is_free: boolean;
  hetzner_server_status: string;
  deployment_type: string;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  seat_count: string;
  active_seat_count: string;
  suspension_reason: string | null;
  created_at: string;
}

// ─── Status configs ───────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; dotColor: string; badgeClass: string }> = {
  active: { label: "Aktiv", dotColor: "bg-green-400", badgeClass: "bg-green-100 text-green-700" },
  trial: { label: "Trial", dotColor: "bg-blue-400", badgeClass: "bg-blue-100 text-blue-700" },
  paused: { label: "Pausiert", dotColor: "bg-yellow-400", badgeClass: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Gekündigt", dotColor: "bg-red-400", badgeClass: "bg-red-100 text-red-700" },
  suspended_abuse: { label: "Missbrauch", dotColor: "bg-red-600", badgeClass: "bg-red-200 text-red-800" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, dotColor: "bg-gray-400", badgeClass: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${cfg.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
      tier === "tier3" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
    }`}>
      {tier === "tier3" ? "Tier 3" : "Tier 2"}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("de-DE") : "—";
}

// ─── Create License Modal ─────────────────────────────────────────────────────

function CreateLicenseModal({
  onClose,
  onCreated,
  token,
  partners,
}: {
  onClose: () => void;
  onCreated: () => void;
  token: string;
  partners: Partner[];
}) {
  const [form, setForm] = useState({
    tier: "tier2",
    tenantName: "",
    tenantEmail: "",
    partnerId: "",
    priceType: "standard",
    customPrice: "",
    maxUsers: 10,
    expiresAt: "",
    notes: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        tenantName: form.tenantName || undefined,
        tenantEmail: form.tenantEmail || undefined,
        maxUsers: form.maxUsers,
        expiresAt: form.expiresAt || undefined,
        notes: form.notes || undefined,
        status: form.status,
        tier: form.tier,
        isFree: form.priceType === "free",
        customPrice: form.priceType === "custom" && form.customPrice ? parseFloat(form.customPrice) : undefined,
        partnerId: form.partnerId || undefined,
      };

      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#1d1d1f] text-[22px] font-semibold">Neue Lizenz erstellen</h2>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Tier */}
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Lizenz-Typ</label>
            <div className="grid grid-cols-2 gap-2">
              {["tier2", "tier3"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tier: t })}
                  className={`py-3 px-4 rounded-xl border-2 text-[13px] font-medium transition-all ${
                    form.tier === t
                      ? "border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]"
                      : "border-[#d2d2d7] text-[#6e6e73] hover:border-[#0071e3]/40"
                  }`}
                >
                  {t === "tier2" ? "Tier 2 – Server-Owner" : "Tier 3 – Endnutzer"}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Kundenname</label>
              <input className="input-apple" placeholder="Max Muster GmbH" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
            </div>
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">E-Mail</label>
              <input className="input-apple" type="email" placeholder="kunde@firma.de" value={form.tenantEmail} onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })} />
            </div>
          </div>

          {/* Partner */}
          {partners.length > 0 && (
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Partner zuweisen <span className="text-[#6e6e73] font-normal">(optional)</span></label>
              <select className="input-apple" value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}>
                <option value="">— Kein Partner —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.company_name ? `(${p.company_name})` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pricing */}
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Preis-Modell</label>
            <div className="flex gap-2 mb-2">
              {[
                { v: "standard", l: "Standard" },
                { v: "custom", l: "Individuell" },
                { v: "free", l: "Kostenlos" },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, priceType: v })}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-[12px] font-medium transition-all ${
                    form.priceType === v
                      ? "border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]"
                      : "border-[#d2d2d7] text-[#6e6e73] hover:border-[#0071e3]/40"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {form.priceType === "custom" && (
              <input
                className="input-apple"
                type="number"
                min={0}
                step={0.01}
                placeholder="Preis in € (z.B. 49.00)"
                value={form.customPrice}
                onChange={(e) => setForm({ ...form, customPrice: e.target.value })}
              />
            )}
            {form.priceType === "free" && (
              <p className="text-green-600 text-[12px] mt-1">Diese Lizenz ist kostenlos — kein Zahlungseinzug.</p>
            )}
          </div>

          {/* Status & MaxUsers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Status</label>
              <select className="input-apple" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Aktiv</option>
                <option value="trial">Trial</option>
                <option value="paused">Pausiert</option>
              </select>
            </div>
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Max. User</label>
              <input className="input-apple" type="number" min={1} value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })} />
            </div>
          </div>

          {/* Ablaufdatum */}
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Ablaufdatum <span className="text-[#6e6e73] font-normal">(optional, leer = unbegrenzt)</span></label>
            <input className="input-apple" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Interne Notiz <span className="text-[#6e6e73] font-normal">(optional)</span></label>
            <textarea className="input-apple resize-none" rows={2} placeholder="Interne Notiz..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-[14px] font-medium hover:bg-[#e8e8ed] transition-colors">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary !py-3 disabled:opacity-50">
              {loading ? "Wird erstellt..." : "Lizenz erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Customer Modal (Admin) ────────────────────────────────────────────

function CreateCustomerModal({
  onClose,
  onCreated,
  token,
  partners,
}: {
  onClose: () => void;
  onCreated: () => void;
  token: string;
  partners: Partner[];
}) {
  const [form, setForm] = useState({
    partnerId: "",
    name: "",
    email: "",
    info: "",
    priceType: "standard",
    customPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerId) { setError("Bitte einen Partner auswählen."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          partnerId: form.partnerId,
          name: form.name,
          email: form.email || undefined,
          info: form.info || undefined,
          isFree: form.priceType === "free",
          customPrice: form.priceType === "custom" && form.customPrice ? parseFloat(form.customPrice) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#1d1d1f] text-[22px] font-semibold">Neuer Tier-2-Kunde</h2>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Partner *</label>
            <select className="input-apple" required value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}>
              <option value="">— Partner auswählen —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.company_name ? `(${p.company_name})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Kundenname *</label>
            <input className="input-apple" required placeholder="Max Muster GmbH" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">E-Mail des Server-Owners</label>
            <input className="input-apple" type="email" placeholder="owner@firma.de" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Preis-Modell (Server-Lizenz)</label>
            <div className="flex gap-2">
              {[{ v: "standard", l: "Standard" }, { v: "custom", l: "Individuell" }, { v: "free", l: "Kostenlos" }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm({ ...form, priceType: v })}
                  className={`flex-1 py-2 rounded-xl border-2 text-[12px] font-medium transition-all ${form.priceType === v ? "border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]" : "border-[#d2d2d7] text-[#6e6e73]"}`}>
                  {l}
                </button>
              ))}
            </div>
            {form.priceType === "custom" && (
              <input className="input-apple mt-2" type="number" min={0} step={0.01} placeholder="Preis in €" value={form.customPrice} onChange={(e) => setForm({ ...form, customPrice: e.target.value })} />
            )}
          </div>
          <div>
            <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Interne Info</label>
            <textarea className="input-apple resize-none" rows={2} value={form.info} onChange={(e) => setForm({ ...form, info: e.target.value })} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-[14px] font-medium">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary !py-3 disabled:opacity-50">{loading ? "Wird erstellt..." : "Kunde anlegen"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Abuse Suspend Confirm ────────────────────────────────────────────────────

function AbuseSuspendModal({
  licenseKey,
  tenant,
  onClose,
  onSuspended,
  token,
}: {
  licenseKey: string;
  tenant: string | null;
  onClose: () => void;
  onSuspended: () => void;
  token: string;
}) {
  const [reason, setReason] = useState("Manuell durch Admin gesperrt wegen Missbrauch.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: licenseKey, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onSuspended();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-[#1d1d1f] text-[20px] font-semibold mb-2">Lizenz wegen Missbrauch sperren</h2>
        <p className="text-[#6e6e73] text-[14px] mb-4">
          Lizenz <code className="bg-[#f5f5f7] px-1.5 py-0.5 rounded text-[12px]">{licenseKey}</code>
          {tenant ? ` (${tenant})` : ""} wird gesperrt. Alle verknüpften Zahlungen und Nutzer werden ebenfalls gestoppt und per Mail informiert.
        </p>
        <div className="mb-4">
          <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Sperrgrund (wird in E-Mails angezeigt)</label>
          <textarea
            className="input-apple resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px] mb-3">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-[14px] font-medium">Abbrechen</button>
          <button onClick={confirm} disabled={loading || !reason}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl text-[14px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? "Wird gesperrt..." : "Jetzt sperren"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── License Row ──────────────────────────────────────────────────────────────

function LicenseRow({
  license,
  token,
  onRefresh,
}: {
  license: License;
  token: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAbuse, setShowAbuse] = useState(false);

  const changeStatus = async (status: string) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/licenses?key=${license.key}&action=status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteLicense = async () => {
    if (!confirm(`Lizenz ${license.key} wirklich löschen?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/licenses?key=${license.key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr className="border-b border-[#f5f5f7] hover:bg-[#f9f9fb] transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <TierBadge tier={license.tier} />
            <span className="text-[#1d1d1f] text-[14px] font-medium">{license.tenant_name || "—"}</span>
          </div>
          <span className="text-[#6e6e73] text-[12px] mt-0.5 block">{license.tenant_email || "—"}</span>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <code className="text-[12px] text-[#424245] font-mono bg-[#f5f5f7] px-2 py-1 rounded">{license.key}</code>
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={license.status} />
        </td>
        <td className="px-5 py-4 hidden md:table-cell text-[#6e6e73] text-[13px]">
          {license.is_free
            ? <span className="text-green-600 font-medium">Kostenlos</span>
            : license.custom_price != null
            ? <span className="text-indigo-600 font-medium">{fmt(license.custom_price)}/Mo.</span>
            : "Standard"}
        </td>
        <td className="px-5 py-4 hidden lg:table-cell text-[#6e6e73] text-[13px]">
          {license.expires_at ? fmtDate(license.expires_at) : "∞"}
        </td>
        <td className="px-5 py-4 text-right">
          <svg className={`w-4 h-4 ml-auto transition-transform text-[#6e6e73] ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#f9f9fb] border-b border-[#f5f5f7]">
          <td colSpan={6} className="px-5 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-[13px]">
              <div><span className="text-[#6e6e73] block mb-1">Erstellt</span><span className="font-medium">{fmtDate(license.created_at)}</span></div>
              <div><span className="text-[#6e6e73] block mb-1">Letzter Check</span><span className="font-medium">{fmtDate(license.last_checked_at)}</span></div>
              <div><span className="text-[#6e6e73] block mb-1">Max. User</span><span className="font-medium">{license.max_users}</span></div>
              <div>
                <span className="text-[#6e6e73] block mb-1">Gebundene ID</span>
                <span className="font-mono text-[11px] font-medium">{license.bound_identifier || "Noch nicht gebunden"}</span>
              </div>
            </div>
            {license.suspension_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-[13px]">
                <span className="text-red-700 font-medium">Sperrgrund: </span>
                <span className="text-red-600">{license.suspension_reason}</span>
                {license.suspended_at && <span className="text-red-400 ml-2">({fmtDate(license.suspended_at)})</span>}
              </div>
            )}
            {license.notes && (
              <div className="text-[#6e6e73] text-[13px] mb-4">Notiz: {license.notes}</div>
            )}
            <div className="flex flex-wrap gap-2">
              {license.status !== "active" && <button onClick={(e) => { e.stopPropagation(); changeStatus("active"); }} disabled={loading} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-[13px] font-medium hover:bg-green-200 disabled:opacity-50">Aktivieren</button>}
              {license.status !== "paused" && license.status !== "suspended_abuse" && <button onClick={(e) => { e.stopPropagation(); changeStatus("paused"); }} disabled={loading} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-[13px] font-medium hover:bg-yellow-200 disabled:opacity-50">Pausieren</button>}
              {license.status !== "trial" && license.status !== "suspended_abuse" && <button onClick={(e) => { e.stopPropagation(); changeStatus("trial"); }} disabled={loading} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[13px] font-medium hover:bg-blue-200 disabled:opacity-50">→ Trial</button>}
              {license.status !== "cancelled" && license.status !== "suspended_abuse" && <button onClick={(e) => { e.stopPropagation(); changeStatus("cancelled"); }} disabled={loading} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[13px] font-medium hover:bg-red-200 disabled:opacity-50">Kündigen</button>}
              {license.status !== "suspended_abuse" && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAbuse(true); }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Wegen Missbrauch sperren
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); deleteLicense(); }} disabled={loading} className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-[13px] font-medium hover:bg-red-100 hover:text-red-600 disabled:opacity-50 ml-auto">Löschen</button>
            </div>
          </td>
        </tr>
      )}

      {showAbuse && (
        <AbuseSuspendModal
          licenseKey={license.key}
          tenant={license.tenant_name}
          token={token}
          onClose={() => setShowAbuse(false)}
          onSuspended={() => { setShowAbuse(false); onRefresh(); }}
        />
      )}
    </>
  );
}

// ─── Partners Tab ─────────────────────────────────────────────────────────────

function PartnersTab({
  token,
  partners,
  customers,
  loadingData,
  onRefresh,
}: {
  token: string;
  partners: Partner[];
  customers: Customer[];
  loadingData: boolean;
  onRefresh: () => void;
}) {
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  if (loadingData) {
    return <div className="py-16 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1d1d1f] text-[18px] font-semibold">{partners.length} Partner registriert</h2>
        <button onClick={() => setShowCreateCustomer(true)} className="btn-primary !py-2 !px-4 text-[13px]">
          + Tier-2-Kunde anlegen
        </button>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#d2d2d7]/40">
          <p className="text-[#6e6e73] text-[15px]">Noch keine Partner registriert.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => {
            const partnerCustomers = customers.filter((c) => c.partner_id === partner.id);
            const isOpen = expandedPartner === partner.id;
            return (
              <div key={partner.id} className="bg-white rounded-2xl border border-[#d2d2d7]/40 overflow-hidden shadow-sm">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f9f9fb] transition-colors"
                  onClick={() => setExpandedPartner(isOpen ? null : partner.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
                      <span className="text-[#1a3a5c] text-[13px] font-bold">{partner.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1d1d1f] text-[15px] font-semibold">{partner.name}</span>
                        {!partner.is_active && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[11px]">Inaktiv</span>}
                      </div>
                      <span className="text-[#6e6e73] text-[12px]">{partner.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[#1d1d1f] text-[14px] font-semibold">{partner.customer_count} Kunden</div>
                      <div className="text-[#6e6e73] text-[12px]">{partner.active_seat_count} aktive Seats</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-[#6e6e73] text-[12px]">Server: {Number(partner.tier2_price).toFixed(0)} €</div>
                      <div className="text-[#6e6e73] text-[12px]">Seat-Fee: {Number(partner.tier3_partner_fee).toFixed(0)} €</div>
                    </div>
                    <svg className={`w-4 h-4 text-[#6e6e73] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#f5f5f7] px-6 py-4">
                    {partnerCustomers.length === 0 ? (
                      <p className="text-[#6e6e73] text-[13px]">Keine Kunden für diesen Partner.</p>
                    ) : (
                      <div className="space-y-2">
                        {partnerCustomers.map((c) => (
                          <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-[#f9f9fb] rounded-xl">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#1d1d1f] text-[14px] font-medium">{c.name}</span>
                                {c.license_status && <StatusBadge status={c.license_status} />}
                                {c.is_free && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[11px] font-medium">Kostenlos</span>}
                                {c.custom_price != null && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium">{fmt(c.custom_price)}</span>}
                              </div>
                              {c.customer_email && <span className="text-[#6e6e73] text-[12px]">{c.customer_email}</span>}
                              {c.suspension_reason && <div className="text-red-500 text-[11px] mt-1">{c.suspension_reason}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-[#1d1d1f] text-[13px]">{c.active_seat_count}/{c.seat_count} Seats</div>
                              {c.license_key && <code className="text-[10px] text-[#6e6e73] font-mono">{c.license_key}</code>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateCustomer && (
        <CreateCustomerModal
          token={token}
          partners={partners}
          onClose={() => setShowCreateCustomer(false)}
          onCreated={() => { setShowCreateCustomer(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Main Admin Portal ────────────────────────────────────────────────────────

export default function AdminPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<"lizenzen" | "partner" | "statistiken">("lizenzen");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const loadAll = useCallback(async (t: string) => {
    setLoadingData(true);
    try {
      const [licRes, partRes, custRes, statsRes] = await Promise.all([
        fetch("/api/admin/licenses", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/partners", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${t}` } }),
      ]);

      if (licRes.status === 401 || licRes.status === 403) {
        localStorage.removeItem("admin_token");
        router.push("/portal");
        return;
      }

      const [licData, partData, custData, statsData] = await Promise.all([
        licRes.json(), partRes.json(), custRes.json(), statsRes.json(),
      ]);

      setLicenses(licData.licenses || []);
      setPartners(partData.partners || []);
      setCustomers(custData.customers || []);
      setStats(statsData);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) { router.push("/portal"); return; }
    setToken(t);
    loadAll(t);
  }, [router, loadAll]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("partner_token");
    router.push("/portal");
  };

  const filtered = licenses.filter((l) => {
    const matchSearch = !search ||
      l.key.toLowerCase().includes(search.toLowerCase()) ||
      (l.tenant_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.tenant_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.bound_identifier || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const matchTier = filterTier === "all" || l.tier === filterTier || (!l.tier && filterTier === "tier2");
    return matchSearch && matchStatus && matchTier;
  });

  const licStats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === "active").length,
    trial: licenses.filter((l) => l.status === "trial").length,
    paused: licenses.filter((l) => l.status === "paused").length,
    suspended: licenses.filter((l) => l.status === "suspended_abuse").length,
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#d2d2d7]/40 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0071e3] rounded-md flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">AH</span>
              </div>
            </Link>
            <span className="text-[#d2d2d7]">/</span>
            <span className="text-[#1d1d1f] font-semibold text-[15px]">Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/partner-portal/dashboard" className="text-[#0071e3] text-[13px] hover:underline hidden md:block">
              → Partner-Portal
            </Link>
            <button onClick={() => loadAll(token)} className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors" title="Aktualisieren">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={logout} className="text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">Abmelden</button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-[#f5f5f7]">
          {(["lizenzen", "partner", "statistiken"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors capitalize ${
                tab === t ? "border-[#0071e3] text-[#0071e3]" : "border-transparent text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {t === "lizenzen" ? `Lizenzen (${licenses.length})` : t === "partner" ? `Partner & Kunden (${partners.length})` : "Statistiken"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Lizenzen Tab ── */}
        {tab === "lizenzen" && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
              {[
                { label: "Gesamt", v: licStats.total, color: "text-[#1d1d1f]" },
                { label: "Aktiv", v: licStats.active, color: "text-green-600" },
                { label: "Trial", v: licStats.trial, color: "text-blue-600" },
                { label: "Pausiert", v: licStats.paused, color: "text-yellow-600" },
                { label: "Missbrauch", v: licStats.suspended, color: "text-red-600" },
              ].map(({ label, v, color }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-[#d2d2d7]/40 shadow-sm">
                  <p className="text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-[32px] font-semibold ${color}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-[#d2d2d7]/40 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-6 border-b border-[#f5f5f7]">
                <h2 className="text-[#1d1d1f] text-[18px] font-semibold">Lizenzen</h2>
                <div className="flex flex-col md:flex-row items-stretch gap-2 w-full md:w-auto">
                  <input type="text" placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-apple !py-2 w-full md:w-48" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-apple !py-2">
                    <option value="all">Alle Status</option>
                    <option value="active">Aktiv</option>
                    <option value="trial">Trial</option>
                    <option value="paused">Pausiert</option>
                    <option value="cancelled">Gekündigt</option>
                    <option value="suspended_abuse">Missbrauch</option>
                  </select>
                  <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="input-apple !py-2">
                    <option value="all">Alle Tier</option>
                    <option value="tier2">Tier 2</option>
                    <option value="tier3">Tier 3</option>
                  </select>
                  <button onClick={() => setShowCreate(true)} className="btn-primary !py-2 !px-4 text-[13px] whitespace-nowrap">
                    + Neue Lizenz
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-[#6e6e73] text-[16px]">
                    {search || filterStatus !== "all" || filterTier !== "all" ? "Keine Ergebnisse." : "Noch keine Lizenzen."}
                  </p>
                  {!search && filterStatus === "all" && filterTier === "all" && (
                    <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-[14px]">Erste Lizenz erstellen</button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f9f9fb] border-b border-[#f5f5f7]">
                        <th className="text-left px-5 py-3 text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider">Kunde / Tier</th>
                        <th className="text-left px-5 py-3 text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider hidden md:table-cell">Key</th>
                        <th className="text-left px-5 py-3 text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider hidden md:table-cell">Preis</th>
                        <th className="text-left px-5 py-3 text-[#6e6e73] text-[11px] font-medium uppercase tracking-wider hidden lg:table-cell">Gültig bis</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => (
                        <LicenseRow key={l.id} license={l} token={token} onRefresh={() => loadAll(token)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filtered.length > 0 && (
                <div className="px-5 py-3 border-t border-[#f5f5f7] text-right">
                  <span className="text-[#6e6e73] text-[13px]">{filtered.length} von {licenses.length} Lizenzen</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Partner & Kunden Tab ── */}
        {tab === "partner" && (
          <PartnersTab
            token={token}
            partners={partners}
            customers={customers}
            loadingData={loadingData}
            onRefresh={() => loadAll(token)}
          />
        )}

        {/* ── Statistiken Tab ── */}
        {tab === "statistiken" && (
          <div className="space-y-6">
            <h2 className="text-[#1d1d1f] text-[18px] font-semibold">Systemübersicht</h2>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Aktive Partner", v: (stats.activePartners as number) ?? 0, color: "text-[#1d1d1f]" },
                  { label: "Server-Kunden", v: (stats.totalCustomers as number) ?? 0, color: "text-indigo-600" },
                  { label: "Lizenzen gesamt", v: (stats.totalLicenses as number) ?? 0, color: "text-[#1d1d1f]" },
                  { label: "Missbrauch gesperrt", v: (stats.abuseCount as number) ?? 0, color: "text-red-600" },
                ].map(({ label, v, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-6 border border-[#d2d2d7]/40 shadow-sm">
                    <p className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-2">{label}</p>
                    <p className={`text-[40px] font-semibold ${color}`}>{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" /></div>
            )}

            {stats && (stats.licenses as Record<string, number>) && (
              <div className="bg-white rounded-2xl border border-[#d2d2d7]/40 shadow-sm p-6">
                <h3 className="text-[#1d1d1f] text-[16px] font-semibold mb-4">Lizenzen nach Status</h3>
                <div className="space-y-3">
                  {Object.entries(stats.licenses as Record<string, number>).map(([s, count]) => {
                    const cfg = statusConfig[s] ?? { label: s, badgeClass: "bg-gray-100 text-gray-700", dotColor: "bg-gray-400" };
                    return (
                      <div key={s} className="flex items-center justify-between">
                        <StatusBadge status={s} />
                        <span className="text-[#1d1d1f] font-semibold text-[15px]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateLicenseModal
          token={token}
          partners={partners}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(token); }}
        />
      )}
    </div>
  );
}
