"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface License {
  id: string;
  key: string;
  tenant_name: string | null;
  tenant_email: string | null;
  status: "active" | "trial" | "paused" | "cancelled";
  expires_at: string | null;
  max_users: number;
  created_at: string;
  last_checked_at: string | null;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  active: { label: "Aktiv", badge: "badge-active", dot: "bg-green-400" },
  trial: { label: "Trial", badge: "badge-trial", dot: "bg-blue-400" },
  paused: { label: "Pausiert", badge: "badge-paused", dot: "bg-yellow-400" },
  cancelled: { label: "Gekündigt", badge: "badge-cancelled", dot: "bg-red-400" },
};

function StatCard({ label, value, color = "text-[#1d1d1f]" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#d2d2d7]/40 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <p className="text-[#6e6e73] text-[13px] font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-[36px] font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreated,
  token,
}: {
  onClose: () => void;
  onCreated: (license: License) => void;
  token: string;
}) {
  const [form, setForm] = useState({
    tenantName: "",
    tenantEmail: "",
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
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantName: form.tenantName || undefined,
          tenantEmail: form.tenantEmail || undefined,
          maxUsers: form.maxUsers,
          expiresAt: form.expiresAt || undefined,
          notes: form.notes || undefined,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onCreated(data.license);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#1d1d1f] text-[22px] font-semibold">Neue Lizenz</h2>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Kundenname</label>
              <input
                className="input-apple"
                placeholder="Max Mustermann GmbH"
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">E-Mail</label>
              <input
                className="input-apple"
                type="email"
                placeholder="kunde@firma.de"
                value={form.tenantEmail}
                onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Max. Benutzer</label>
              <input
                className="input-apple"
                type="number"
                min={1}
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div>
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">Status</label>
              <select
                className="input-apple"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Aktiv</option>
                <option value="trial">Trial</option>
                <option value="paused">Pausiert</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">
                Ablaufdatum <span className="text-[#6e6e73] font-normal">(optional)</span>
              </label>
              <input
                className="input-apple"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1">
                Notizen <span className="text-[#6e6e73] font-normal">(optional)</span>
              </label>
              <textarea
                className="input-apple resize-none"
                rows={2}
                placeholder="Interne Notiz..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost border border-[#d2d2d7] !py-3">
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

function LicenseRow({
  license,
  token,
  onStatusChange,
  onDelete,
}: {
  license: License;
  token: string;
  onStatusChange: (key: string, status: string) => void;
  onDelete: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const changeStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/licenses?key=${license.key}&action=status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onStatusChange(license.key, status);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteLicense = async () => {
    if (!confirm(`Lizenz ${license.key} wirklich löschen?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/licenses?key=${license.key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onDelete(license.key);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("de-DE") : "—";

  return (
    <>
      <tr
        className="border-b border-[#f5f5f7] hover:bg-[#f9f9fb] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig[license.status]?.dot || "bg-gray-400"}`} />
            <span className="text-[#1d1d1f] text-[14px] font-medium">
              {license.tenant_name || "—"}
            </span>
          </div>
          <span className="text-[#6e6e73] text-[12px] ml-4">{license.tenant_email || "—"}</span>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <code className="text-[12px] text-[#424245] font-mono bg-[#f5f5f7] px-2 py-1 rounded">
            {license.key}
          </code>
        </td>
        <td className="px-5 py-4">
          <span className={statusConfig[license.status]?.badge || "badge"}>
            {statusConfig[license.status]?.label || license.status}
          </span>
        </td>
        <td className="px-5 py-4 hidden md:table-cell text-[#6e6e73] text-[13px]">
          {license.expires_at ? formatDate(license.expires_at) : "∞"}
        </td>
        <td className="px-5 py-4 text-[#6e6e73] text-[13px] text-right">
          <svg
            className={`w-4 h-4 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#f9f9fb] border-b border-[#f5f5f7]">
          <td colSpan={5} className="px-5 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-[13px]">
              <div>
                <span className="text-[#6e6e73] block mb-1">Erstellt</span>
                <span className="text-[#1d1d1f] font-medium">{formatDate(license.created_at)}</span>
              </div>
              <div>
                <span className="text-[#6e6e73] block mb-1">Letzter Check</span>
                <span className="text-[#1d1d1f] font-medium">{formatDate(license.last_checked_at)}</span>
              </div>
              <div>
                <span className="text-[#6e6e73] block mb-1">Max. User</span>
                <span className="text-[#1d1d1f] font-medium">{license.max_users}</span>
              </div>
              <div>
                <span className="text-[#6e6e73] block mb-1">Notizen</span>
                <span className="text-[#1d1d1f] font-medium">{license.notes || "—"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {license.status !== "active" && (
                <button
                  onClick={(e) => { e.stopPropagation(); changeStatus("active"); }}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-[13px] font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  Aktivieren
                </button>
              )}
              {license.status !== "paused" && (
                <button
                  onClick={(e) => { e.stopPropagation(); changeStatus("paused"); }}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-[13px] font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  Pausieren
                </button>
              )}
              {license.status !== "trial" && (
                <button
                  onClick={(e) => { e.stopPropagation(); changeStatus("trial"); }}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[13px] font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  → Trial
                </button>
              )}
              {license.status !== "cancelled" && (
                <button
                  onClick={(e) => { e.stopPropagation(); changeStatus("cancelled"); }}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[13px] font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  Kündigen
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteLicense(); }}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-[13px] font-medium hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50 ml-auto"
              >
                Löschen
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminPortal() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const loadLicenses = useCallback(async (t: string) => {
    try {
      const res = await fetch("/api/admin/licenses", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("admin_token");
        router.push("/portal");
        return;
      }
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/portal");
      return;
    }
    setToken(t);
    loadLicenses(t);
  }, [router, loadLicenses]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/portal");
  };

  const handleStatusChange = (key: string, status: string) => {
    setLicenses((prev) =>
      prev.map((l) => (l.key === key ? { ...l, status: status as License["status"] } : l))
    );
  };

  const handleDelete = (key: string) => {
    setLicenses((prev) => prev.filter((l) => l.key !== key));
  };

  const handleCreated = (newLicense: License) => {
    setLicenses((prev) => [newLicense, ...prev]);
    setShowCreate(false);
  };

  const filtered = licenses.filter((l) => {
    const matchSearch =
      !search ||
      l.key.toLowerCase().includes(search.toLowerCase()) ||
      (l.tenant_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.tenant_email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === "active").length,
    trial: licenses.filter((l) => l.status === "trial").length,
    paused: licenses.filter((l) => l.status === "paused").length,
    cancelled: licenses.filter((l) => l.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
            <span className="text-[#6e6e73] text-[13px] hidden md:block">
              {stats.total} Lizenzen gesamt
            </span>
            <button
              onClick={() => loadLicenses(token)}
              className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
              title="Aktualisieren"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Gesamt" value={stats.total} />
          <StatCard label="Aktiv" value={stats.active} color="text-green-600" />
          <StatCard label="Trial" value={stats.trial} color="text-blue-600" />
          <StatCard label="Pausiert" value={stats.paused} color="text-yellow-600" />
          <StatCard label="Gekündigt" value={stats.cancelled} color="text-red-500" />
        </div>

        {/* License table */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#d2d2d7]/40 overflow-hidden">
          {/* Table header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-[#f5f5f7]">
            <h2 className="text-[#1d1d1f] text-[18px] font-semibold">Lizenzen</h2>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-apple !py-2 w-full md:w-56"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-apple !py-2"
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="trial">Trial</option>
                <option value="paused">Pausiert</option>
                <option value="cancelled">Gekündigt</option>
              </select>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary !py-2 !px-5 text-[14px] whitespace-nowrap"
              >
                + Neue Lizenz
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#6e6e73] text-[16px]">
                {search || filterStatus !== "all"
                  ? "Keine Ergebnisse für die aktuelle Suche."
                  : "Noch keine Lizenzen vorhanden."}
              </p>
              {!search && filterStatus === "all" && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary mt-4 text-[14px]"
                >
                  Erste Lizenz erstellen
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f9f9fb] border-b border-[#f5f5f7]">
                    <th className="text-left px-5 py-3 text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="text-left px-5 py-3 text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider hidden md:table-cell">
                      Key
                    </th>
                    <th className="text-left px-5 py-3 text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider hidden md:table-cell">
                      Gültig bis
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <LicenseRow
                      key={l.id}
                      license={l}
                      token={token}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-[#f5f5f7] text-right">
              <span className="text-[#6e6e73] text-[13px]">
                {filtered.length} von {licenses.length} Lizenzen
              </span>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
