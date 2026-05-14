'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { partnerApi } from '@/lib/partnerApi';

interface Pricing {
  tier2Price: number;
  tier3PartnerFee: number;
  alexServerFloor: number;
  alexSeatFloor: number;
  minSeatPrice: number;
}

function getTokenPayload(): { role: string; isAdmin: boolean } {
  try {
    const token = localStorage.getItem('partner_token');
    if (!token) return { role: 'member', isAdmin: false };
    const b = token.split('.')[1];
    const p = b + '='.repeat((4 - (b.length % 4)) % 4);
    const payload = JSON.parse(atob(p));
    return { role: payload.role ?? 'member', isAdmin: payload.isAdmin === true };
  } catch { return { role: 'member', isAdmin: false }; }
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NeuerKundePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', info: '',
    deploymentType: 'LICENSE_ONLY' as 'LICENSE_ONLY' | 'SERVER_BUILD',
    serverOwner: 'PARTNER' as 'PARTNER' | 'CUSTOMER',
    serverType: 'cx31',
    serverLocation: 'fsn1',
    ollamaMode: 'DISABLED' as 'DISABLED' | 'ENABLED',
    tier2Price: '',
    seatPrice: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ licenseKey: string; deploymentType: string } | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { isAdmin: admin } = getTokenPayload();
    setIsAdmin(admin);
    partnerApi.getPricing().then((p: Pricing) => {
      setPricing(p);
      // Pre-fill with current partner defaults
      setForm(f => ({
        ...f,
        tier2Price: String(p.tier2Price),
        seatPrice: String(p.minSeatPrice),
      }));
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function validatePrices(): string | null {
    const t2 = parseFloat(form.tier2Price);
    const seat = parseFloat(form.seatPrice);
    if (isNaN(t2) || t2 < 0) return 'Bitte gültigen Server-Lizenzpreis eingeben.';
    if (isNaN(seat) || seat < 0) return 'Bitte gültigen Seat-Preis eingeben.';
    if (!isAdmin) {
      const floor = pricing?.alexServerFloor ?? 149;
      if (t2 < floor) return `Server-Lizenzpreis mindestens ${floor}€.`;
      const seatFloor = pricing?.minSeatPrice ?? 25;
      if (seat < seatFloor) return `Seat-Preis mindestens ${seatFloor}€.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceErr = validatePrices();
    if (priceErr) { setError(priceErr); return; }
    setSaving(true); setError(null);
    try {
      const result = await partnerApi.createCustomer({
        name: form.name,
        email: form.email,
        info: form.info || undefined,
        deploymentType: form.deploymentType,
        serverOwner: form.deploymentType === 'SERVER_BUILD' ? form.serverOwner : undefined,
        serverType: form.deploymentType === 'SERVER_BUILD' ? form.serverType : undefined,
        serverLocation: form.deploymentType === 'SERVER_BUILD' ? form.serverLocation : undefined,
        ollamaMode: form.deploymentType === 'SERVER_BUILD' ? form.ollamaMode : undefined,
        tier2PriceCents: Math.round(parseFloat(form.tier2Price) * 100),
        seatPriceCents: Math.round(parseFloat(form.seatPrice) * 100),
      });
      if (result.error) { setError(result.error); return; }
      setDone(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="p-4 sm:p-8 max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
          <div className="text-3xl">✓</div>
          <h2 className="font-bold text-gray-900 text-lg">Kunde erstellt</h2>
          <p className="text-sm text-gray-600">
            {done.deploymentType === 'SERVER_BUILD'
              ? 'Der Server wird eingerichtet. Du erhältst eine E-Mail sobald alles bereit ist.'
              : 'Willkommens-E-Mail mit Login-Daten wurde verschickt.'}
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-left">
            <p className="text-xs text-gray-500">Lizenzschlüssel</p>
            <p className="font-mono font-semibold">{done.licenseKey}</p>
          </div>
          <button onClick={() => router.push('/partner-portal/lizenzen')}
            className="w-full bg-[#1a3a5c] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#1a3a5c]/90">
            Zur Kundenliste
          </button>
        </div>
      </div>
    );
  }

  const serverFloor = pricing?.alexServerFloor ?? 149;
  const seatFloor = pricing?.minSeatPrice ?? 25;
  const t2Val = parseFloat(form.tier2Price) || 0;
  const seatVal = parseFloat(form.seatPrice) || 0;
  const serverMargin = Math.max(0, t2Val - serverFloor);
  const seatMargin = Math.max(0, seatVal - (pricing?.alexSeatFloor ?? 25));

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">Neuer Kunde</h1>
        <p className="text-[#6e6e73] text-[15px]">Lege einen neuen Kunden an und setze die Preise.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

        {/* Stammdaten */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Stammdaten</h2>
          <div>
            <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">E-Mail *</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Notiz</label>
            <textarea value={form.info} onChange={e => set('info', e.target.value)} rows={2}
              className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all resize-none" />
          </div>
        </div>

        {/* Preise */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Preise</h2>
            {isAdmin && (
              <span className="text-[9px] font-bold bg-[#c9a84c] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Server-Lizenzpreis */}
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                Server-Lizenzpreis (€)
                {isAdmin
                  ? <span className="text-[#c9a84c] font-normal ml-1">kein Minimum</span>
                  : <span className="text-[#6e6e73] font-normal ml-1">min. {serverFloor}€</span>
                }
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.tier2Price}
                  onChange={e => { set('tier2Price', e.target.value); setError(null); }}
                  min={isAdmin ? 0 : serverFloor}
                  step="1"
                  className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 pr-10 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73] text-[13px]">€</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-1">
                {isAdmin
                  ? <span className="text-[#c9a84c]">Admin-Override aktiv</span>
                  : <>Deine Marge: <span className="font-semibold text-[#1a3a5c]">{fmt(serverMargin)}€</span> · AgentHub: <span className="font-semibold">{fmt(serverFloor)}€</span></>
                }
              </p>
            </div>

            {/* Seat-Preis */}
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                Seat-Preis / User (€)
                {isAdmin
                  ? <span className="text-[#c9a84c] font-normal ml-1">kein Minimum</span>
                  : <span className="text-[#6e6e73] font-normal ml-1">min. {seatFloor}€</span>
                }
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.seatPrice}
                  onChange={e => { set('seatPrice', e.target.value); setError(null); }}
                  min={isAdmin ? 0 : seatFloor}
                  step="0.5"
                  className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 pr-10 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73] text-[13px]">€</span>
              </div>
              <p className="text-[11px] text-[#6e6e73] mt-1">
                {isAdmin
                  ? <span className="text-[#c9a84c]">Admin-Override aktiv</span>
                  : <>Deine Marge: <span className="font-semibold text-[#1a3a5c]">{fmt(seatMargin)}€</span> · AgentHub: <span className="font-semibold">{fmt(pricing?.alexSeatFloor ?? 25)}€</span></>
                }
              </p>
            </div>
          </div>
        </div>

        {/* Deployment */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Deployment</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['LICENSE_ONLY', 'SERVER_BUILD'] as const).map(t => (
              <label key={t} className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${form.deploymentType === t ? 'border-[#1a3a5c] bg-[#1a3a5c]/5' : 'border-[#d2d2d7] hover:border-[#1a3a5c]/40'}`}>
                <input type="radio" name="deploymentType" value={t} checked={form.deploymentType === t} onChange={() => set('deploymentType', t)} className="sr-only" />
                <span className="font-medium text-[13px] text-[#1d1d1f]">{t === 'LICENSE_ONLY' ? 'Nur Lizenz' : 'Mit Server'}</span>
                <span className="text-[11px] text-[#6e6e73]">{t === 'LICENSE_ONLY' ? 'Kunde bringt eigene Infrastruktur' : 'Server wird automatisch eingerichtet'}</span>
              </label>
            ))}
          </div>

          {form.deploymentType === 'SERVER_BUILD' && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                {(['PARTNER', 'CUSTOMER'] as const).map(o => (
                  <label key={o} className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${form.serverOwner === o ? 'border-[#1a3a5c] bg-[#1a3a5c]/5' : 'border-[#d2d2d7] hover:border-[#1a3a5c]/40'}`}>
                    <input type="radio" name="serverOwner" value={o} checked={form.serverOwner === o} onChange={() => set('serverOwner', o)} className="sr-only" />
                    <span className="font-medium text-[13px] text-[#1d1d1f]">{o === 'PARTNER' ? 'Mein Hetzner' : 'Kunde'}</span>
                    <span className="text-[11px] text-[#6e6e73]">{o === 'PARTNER' ? 'Billing über deinen Account' : 'Kunde gibt API-Key ein'}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Server-Typ</label>
                  <select value={form.serverType} onChange={e => set('serverType', e.target.value)}
                    className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all">
                    <option value="cx21">CX21 — 2 vCPU, 4 GB</option>
                    <option value="cx31">CX31 — 2 vCPU, 8 GB</option>
                    <option value="cx41">CX41 — 4 vCPU, 16 GB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">Standort</label>
                  <select value={form.serverLocation} onChange={e => set('serverLocation', e.target.value)}
                    className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20 transition-all">
                    <option value="fsn1">Falkenstein (DE)</option>
                    <option value="nbg1">Nürnberg (DE)</option>
                    <option value="hel1">Helsinki (FI)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['DISABLED', 'ENABLED'] as const).map(m => (
                  <label key={m} className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${form.ollamaMode === m ? 'border-[#1a3a5c] bg-[#1a3a5c]/5' : 'border-[#d2d2d7] hover:border-[#1a3a5c]/40'}`}>
                    <input type="radio" name="ollamaMode" value={m} checked={form.ollamaMode === m} onChange={() => set('ollamaMode', m)} className="sr-only" />
                    <span className="font-medium text-[13px] text-[#1d1d1f]">Ollama {m === 'DISABLED' ? 'aus' : 'an'}</span>
                    <span className="text-[11px] text-[#6e6e73]">{m === 'DISABLED' ? 'Kein RAM-Verbrauch' : 'Lokale LLM-Modelle'}</span>
                  </label>
                ))}
              </div>
              {form.ollamaMode === 'ENABLED' && form.serverType === 'cx21' && (
                <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">CX21 hat nur 4 GB RAM — für Ollama empfehlen wir mindestens CX31.</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px]">{error}</div>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] text-white py-3 rounded-2xl text-[15px] font-semibold hover:bg-[#1a3a5c]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          {saving ? 'Erstelle Kunde…' : 'Kunde erstellen →'}
        </button>
      </form>
    </div>
  );
}
