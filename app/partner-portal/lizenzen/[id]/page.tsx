"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { partnerApi } from "@/lib/partnerApi";

interface Customer {
  id: string;
  name: string;
  info: string | null;
  hostingType: string;
  domain: string | null;
  serverLicenseKey: string | null;
  createdAt: string;
}

interface Seat {
  id: string;
  label: string | null;
  status: string;
  createdAt: string;
}

interface Revenue {
  seatCount: number;
  activeSeatCount: number;
  alexSeatFloor: number;
  alexServerFloor: number;
  tier3PartnerFee: number;
  tier2Price: number;
  serverPartnerMargin: number;
  seatPartnerMargin: number;
  monthlyRevenue: number;
  partnerProfit: number;
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

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInfo, setEditInfo] = useState("");
  const [editHosting, setEditHosting] = useState("partner_hosted");
  const [editDomain, setEditDomain] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showAddSeats, setShowAddSeats] = useState(false);
  const [seatLabel, setSeatLabel] = useState("");
  const [seatCount, setSeatCount] = useState("1");
  const [seatSaving, setSeatSaving] = useState(false);
  const [seatError, setSeatError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partnerApi.getCustomer(id);
      if (data.error) { setError(data.error); return; }
      setCustomer(data.customer);
      setSeats(data.seats);
      setRevenue(data.revenue);
      setEditName(data.customer.name);
      setEditInfo(data.customer.info ?? "");
      setEditHosting(data.customer.hostingType);
      setEditDomain(data.customer.domain ?? "");
      setEditKey(data.customer.serverLicenseKey ?? "");
    } catch {
      setError("Kunde konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setIsOwner(getIsOwner());
    load();
  }, [load]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) { setEditError("Name ist erforderlich."); return; }
    setEditSaving(true); setEditError("");
    try {
      const updated = await partnerApi.updateCustomer(id, {
        name: editName.trim(),
        info: editInfo.trim() || undefined,
        hostingType: editHosting,
        domain: editDomain.trim() || undefined,
        serverLicenseKey: editKey.trim() || undefined,
      });
      if (updated.error) { setEditError(updated.error); return; }
      setCustomer((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
    } catch { setEditError("Verbindungsfehler."); }
    finally { setEditSaving(false); }
  }

  async function handleAddSeats(e: React.FormEvent) {
    e.preventDefault();
    setSeatSaving(true); setSeatError("");
    try {
      const data = await partnerApi.addSeats(id, { label: seatLabel.trim() || undefined, count: parseInt(seatCount) || 1 });
      if (data.error) { setSeatError(data.error); return; }
      setSeats((prev) => [...(data.seats ?? []), ...prev]);
      setRevenue((prev) => prev ? { ...prev, seatCount: prev.seatCount + (data.seats?.length ?? 0), activeSeatCount: prev.activeSeatCount + (data.seats?.length ?? 0) } : prev);
      setShowAddSeats(false); setSeatLabel(""); setSeatCount("1");
    } catch { setSeatError("Verbindungsfehler."); }
    finally { setSeatSaving(false); }
  }

  async function handleToggleSeat(seat: Seat) {
    const newStatus = seat.status === "active" ? "inactive" : "active";
    try {
      await partnerApi.updateSeat(id, seat.id, { status: newStatus });
      setSeats((prev) => prev.map((s) => s.id === seat.id ? { ...s, status: newStatus } : s));
      setRevenue((prev) => {
        if (!prev) return prev;
        const diff = newStatus === "active" ? 1 : -1;
        return { ...prev, activeSeatCount: prev.activeSeatCount + diff, partnerProfit: prev.partnerProfit + diff * prev.seatPartnerMargin };
      });
    } catch { /* silent */ }
  }

  async function handleDeleteSeat(seatId: string) {
    try {
      await partnerApi.deleteSeat(id, seatId);
      const removed = seats.find((s) => s.id === seatId);
      setSeats((prev) => prev.filter((s) => s.id !== seatId));
      if (removed && revenue) {
        setRevenue((prev) => prev ? {
          ...prev,
          seatCount: prev.seatCount - 1,
          activeSeatCount: prev.activeSeatCount - (removed.status === "active" ? 1 : 0),
        } : prev);
      }
    } catch { /* silent */ }
  }

  async function handleDeleteCustomer() {
    setDeleting(true);
    try {
      await partnerApi.deleteCustomer(id);
      router.push("/partner-portal/lizenzen");
    } catch { setDeleting(false); }
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

  if (error || !customer) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px] mb-4">{error || "Kunde nicht gefunden."}</div>
        <Link href="/partner-portal/lizenzen" className="text-[#1a3a5c] text-[14px] font-medium hover:underline">← Zurück zur Übersicht</Link>
      </div>
    );
  }

  const activeSeats = seats.filter((s) => s.status === "active");
  const inactiveSeats = seats.filter((s) => s.status !== "active");

  return (
    <div className="p-4 sm:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#6e6e73] mb-6">
        <Link href="/partner-portal/lizenzen" className="hover:text-[#1a3a5c] transition-colors">Lizenzen</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-[#1d1d1f] font-medium">{customer.name}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* ── Customer info card ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#1a3a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-[#1d1d1f] text-[20px] font-semibold leading-tight">{customer.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${
                    customer.hostingType === "partner_hosted" ? "bg-[#1a3a5c]/10 text-[#1a3a5c]" : "bg-[#6e6e73]/10 text-[#6e6e73]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${customer.hostingType === "partner_hosted" ? "bg-[#1a3a5c]" : "bg-[#6e6e73]"}`} />
                    {customer.hostingType === "partner_hosted" ? "Partner-Hosted" : "Self-Hosted"}
                  </span>
                </div>
              </div>
              {isOwner && !editing && (
                <button onClick={() => { setEditing(true); setEditError(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1a3a5c] rounded-lg border border-[#1a3a5c]/20 hover:bg-[#1a3a5c]/5 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Bearbeiten
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Name *</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Domain</label>
                    <input type="text" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} placeholder="kunde.example.com"
                      className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Info / Notiz</label>
                  <textarea value={editInfo} onChange={(e) => setEditInfo(e.target.value)} rows={2}
                    className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Server-Lizenz-Key</label>
                  <input type="text" value={editKey} onChange={(e) => setEditKey(e.target.value)} placeholder="WL-XXXX-XXXX-..."
                    className="w-full px-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Hosting</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "partner_hosted", label: "Partner-Hosted" },
                      { value: "self_hosted", label: "Self-Hosted" },
                    ].map((opt) => (
                      <button type="button" key={opt.value} onClick={() => setEditHosting(opt.value)}
                        className={`p-2.5 rounded-xl border text-[13px] font-medium transition-all ${editHosting === opt.value ? "border-[#1a3a5c] bg-[#1a3a5c]/5 text-[#1a3a5c]" : "border-[#d2d2d7] text-[#6e6e73] hover:border-[#1a3a5c]/40"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {editError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px]">{editError}</div>}
                <div className="flex gap-3">
                  <button type="submit" disabled={editSaving} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50">
                    {editSaving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    Speichern
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 text-[#1d1d1f] text-[14px] font-medium rounded-xl border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-colors">
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {customer.info && (
                  <div><span className="text-[#6e6e73] text-[12px] uppercase tracking-wider font-medium">Info</span><p className="text-[#1d1d1f] text-[14px] mt-1">{customer.info}</p></div>
                )}
                {customer.domain && (
                  <div><span className="text-[#6e6e73] text-[12px] uppercase tracking-wider font-medium">Domain</span><p className="text-[#0071e3] text-[14px] mt-1">{customer.domain}</p></div>
                )}
                {customer.serverLicenseKey && (
                  <div><span className="text-[#6e6e73] text-[12px] uppercase tracking-wider font-medium">Server-Lizenz-Key</span><p className="font-mono text-[14px] text-[#1d1d1f] mt-1 bg-[#f5f5f7] px-3 py-2 rounded-lg inline-block">{customer.serverLicenseKey}</p></div>
                )}
                {!customer.info && !customer.domain && !customer.serverLicenseKey && (
                  <p className="text-[#6e6e73] text-[13px]">Keine weiteren Infos. Klicke auf "Bearbeiten" um Details hinzuzufügen.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Seat Licenses ── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Seat-Lizenzen</h2>
                <p className="text-[#6e6e73] text-[13px] mt-0.5">{revenue?.activeSeatCount ?? 0} aktiv · {revenue?.seatCount ?? 0} gesamt</p>
              </div>
              {isOwner && (
                <button onClick={() => { setShowAddSeats(true); setSeatError(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-[#1a3a5c] text-white rounded-lg hover:bg-[#1a3a5c]/90 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Seats hinzufügen
                </button>
              )}
            </div>

            {/* Add seats form */}
            {showAddSeats && (
              <form onSubmit={handleAddSeats} className="mb-5 p-4 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7]/40 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#1d1d1f] text-[12px] font-medium mb-1">Label (optional)</label>
                    <input type="text" value={seatLabel} onChange={(e) => setSeatLabel(e.target.value)} placeholder="z.B. Vertrieb"
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg outline-none focus:border-[#1a3a5c] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[12px] font-medium mb-1">Anzahl</label>
                    <input type="number" value={seatCount} onChange={(e) => setSeatCount(e.target.value)} min="1" max="500"
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg outline-none focus:border-[#1a3a5c] transition-all" />
                  </div>
                </div>
                {seatError && <div className="text-red-600 text-[12px]">{seatError}</div>}
                <div className="flex gap-2">
                  <button type="submit" disabled={seatSaving} className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a5c] text-white text-[13px] font-medium rounded-lg hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50">
                    {seatSaving && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    Erstellen
                  </button>
                  <button type="button" onClick={() => setShowAddSeats(false)} className="px-4 py-2 text-[13px] font-medium text-[#6e6e73] rounded-lg border border-[#d2d2d7] hover:bg-white transition-colors">Abbrechen</button>
                </div>
              </form>
            )}

            {seats.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-[#6e6e73] text-[14px]">Noch keine Seat-Lizenzen angelegt.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSeats.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] px-1 mb-1">Aktiv ({activeSeats.length})</p>
                    {activeSeats.map((seat) => (
                      <SeatRow key={seat.id} seat={seat} isOwner={isOwner} onToggle={handleToggleSeat} onDelete={handleDeleteSeat} />
                    ))}
                  </>
                )}
                {inactiveSeats.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] px-1 mt-3 mb-1">Inaktiv ({inactiveSeats.length})</p>
                    {inactiveSeats.map((seat) => (
                      <SeatRow key={seat.id} seat={seat} isOwner={isOwner} onToggle={handleToggleSeat} onDelete={handleDeleteSeat} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Danger zone ── */}
          {isOwner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
              <h3 className="text-red-600 text-[15px] font-semibold mb-2">Gefahrenzone</h3>
              <p className="text-[#6e6e73] text-[13px] mb-4">Diesen Kunden löschen entfernt auch alle zugehörigen Seat-Lizenzen.</p>
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-[#1d1d1f] text-[13px]">Wirklich löschen?</span>
                  <button onClick={handleDeleteCustomer} disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                    {deleting ? "Löschen..." : "Ja, löschen"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-[13px] font-medium text-[#6e6e73] rounded-lg border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-colors">Abbrechen</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 text-red-600 text-[13px] font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                  Kunden löschen
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Revenue sidebar ── */}
        <div className="space-y-5">
          {revenue && (
            <>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-[#1d1d1f] text-[15px] font-semibold mb-4">Umsatz & Gewinn</h3>
                <div className="space-y-3">
                  {[
                    { label: "Seats gesamt", value: String(revenue.seatCount) },
                    { label: "Seats aktiv", value: String(revenue.activeSeatCount) },
                    { label: "Monatl. Gesamtumsatz", value: `${fmt(revenue.monthlyRevenue)} €` },
                    { label: "Dein Gewinn/Monat", value: `${fmt(revenue.partnerProfit)} €`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-[#6e6e73] text-[13px]">{label}</span>
                      <span className={`text-[13px] font-semibold ${highlight ? "text-[#1a3a5c]" : "text-[#1d1d1f]"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-[#1d1d1f] text-[15px] font-semibold mb-4">Preisstruktur</h3>
                <div className="space-y-3 text-[13px]">
                  <div className="p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] mb-2">Server-Lizenz</div>
                    <div className="flex justify-between"><span className="text-[#6e6e73]">Kunde zahlt</span><span className="font-semibold">{fmt(revenue.tier2Price)} €</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#6e6e73]">AgentHub erhält</span><span>{fmt(revenue.alexServerFloor)} €</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#1a3a5c] font-medium">Deine Marge</span><span className="text-[#1a3a5c] font-semibold">{fmt(revenue.serverPartnerMargin)} €</span></div>
                  </div>
                  <div className="p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] mb-2">Seat-Lizenz (pro Seat)</div>
                    <div className="flex justify-between"><span className="text-[#6e6e73]">Kunde zahlt</span><span className="font-semibold">{fmt(revenue.alexSeatFloor + revenue.tier3PartnerFee)} €</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#6e6e73]">AgentHub erhält</span><span>{fmt(revenue.alexSeatFloor)} €</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#1a3a5c] font-medium">Deine Marge</span><span className="text-[#1a3a5c] font-semibold">{fmt(revenue.tier3PartnerFee)} €</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SeatRow({ seat, isOwner, onToggle, onDelete }: {
  seat: Seat;
  isOwner: boolean;
  onToggle: (s: Seat) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const isActive = seat.status === "active";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isActive ? "bg-white border-gray-100" : "bg-[#f5f5f7] border-transparent opacity-60"}`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-green-400" : "bg-[#d2d2d7]"}`} />
      <div className="flex-1 min-w-0">
        <span className="text-[#1d1d1f] text-[13px] font-medium">{seat.label ?? `Seat`}</span>
        <span className="ml-2 text-[#6e6e73] text-[11px]">{new Date(seat.createdAt).toLocaleDateString("de-DE")}</span>
      </div>
      {isOwner && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {confirmDel ? (
            <>
              <button onClick={() => onDelete(seat.id)} className="px-2 py-1 text-[11px] font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Löschen</button>
              <button onClick={() => setConfirmDel(false)} className="px-2 py-1 text-[11px] font-medium text-[#6e6e73] bg-[#f5f5f7] rounded-lg hover:bg-[#e5e5e7] transition-colors">Nein</button>
            </>
          ) : (
            <>
              <button onClick={() => onToggle(seat)} className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${isActive ? "text-[#6e6e73] bg-[#f5f5f7] hover:bg-[#e5e5e7]" : "text-green-600 bg-green-50 hover:bg-green-100"}`}>
                {isActive ? "Deaktivieren" : "Aktivieren"}
              </button>
              <button onClick={() => setConfirmDel(true)} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#d2d2d7] hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
