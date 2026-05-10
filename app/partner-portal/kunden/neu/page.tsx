'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { partnerApi } from '@/lib/partnerApi';

export default function NeuerKundePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', info: '',
    deploymentType: 'LICENSE_ONLY' as 'LICENSE_ONLY' | 'SERVER_BUILD',
    serverOwner: 'PARTNER' as 'PARTNER' | 'CUSTOMER',
    serverType: 'cx31',
    serverLocation: 'fsn1',
    ollamaMode: 'DISABLED' as 'DISABLED' | 'ENABLED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ licenseKey: string; deploymentType: string } | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      });
      if (result.error) { setError(result.error); return; }
      setDone(result);
    } catch (err: any) {
      setError(err.message ?? 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">✓</div>
          <h2 className="font-bold text-gray-900 text-lg">Kunde erstellt</h2>
          <p className="text-sm text-gray-600">
            {done.deploymentType === 'SERVER_BUILD'
              ? 'Der Server wird eingerichtet. Du erhältst eine E-Mail sobald alles bereit ist.'
              : 'Willkommens-E-Mail mit Login-Daten wurde verschickt.'}
          </p>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-left">
            <p className="text-xs text-gray-500">Lizenzschlüssel</p>
            <p className="font-mono font-semibold">{done.licenseKey}</p>
          </div>
          <button onClick={() => router.push('/partner-portal/lizenzen')}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Zur Kundenliste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neuer Kunde</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
            <textarea value={form.info} onChange={e => set('info', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">Deployment</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['LICENSE_ONLY', 'SERVER_BUILD'] as const).map(t => (
              <label key={t} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer ${form.deploymentType === t ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                <input type="radio" name="deploymentType" value={t} checked={form.deploymentType === t} onChange={() => set('deploymentType', t)} className="sr-only" />
                <span className="font-medium text-sm">{t === 'LICENSE_ONLY' ? 'Nur Lizenz' : 'Mit Server'}</span>
                <span className="text-xs text-gray-500">{t === 'LICENSE_ONLY' ? 'Kunde bringt eigene Infrastruktur' : 'Server wird automatisch eingerichtet'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.deploymentType === 'SERVER_BUILD' && (
          <>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Server gehört</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['PARTNER', 'CUSTOMER'] as const).map(o => (
                  <label key={o} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer ${form.serverOwner === o ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                    <input type="radio" name="serverOwner" value={o} checked={form.serverOwner === o} onChange={() => set('serverOwner', o)} className="sr-only" />
                    <span className="font-medium text-sm">{o === 'PARTNER' ? 'Dir (Partner)' : 'Dem Kunden'}</span>
                    <span className="text-xs text-gray-500">{o === 'PARTNER' ? 'Billing über deinen Hetzner-Account' : 'Kunde gibt seinen API-Key ein'}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Server-Typ</label>
                <select value={form.serverType} onChange={e => set('serverType', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="cx21">CX21 — 2 vCPU, 4 GB</option>
                  <option value="cx31">CX31 — 2 vCPU, 8 GB</option>
                  <option value="cx41">CX41 — 4 vCPU, 16 GB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standort</label>
                <select value={form.serverLocation} onChange={e => set('serverLocation', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="fsn1">Falkenstein (DE)</option>
                  <option value="nbg1">Nürnberg (DE)</option>
                  <option value="hel1">Helsinki (FI)</option>
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Ollama (lokale KI)</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['DISABLED', 'ENABLED'] as const).map(m => (
                  <label key={m} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer ${form.ollamaMode === m ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                    <input type="radio" name="ollamaMode" value={m} checked={form.ollamaMode === m} onChange={() => set('ollamaMode', m)} className="sr-only" />
                    <span className="font-medium text-sm">{m === 'DISABLED' ? 'Deaktiviert' : 'Aktiviert'}</span>
                    <span className="text-xs text-gray-500">{m === 'DISABLED' ? 'Kein RAM-Verbrauch' : 'Lokale LLM-Modelle'}</span>
                  </label>
                ))}
              </div>
              {form.ollamaMode === 'ENABLED' && form.serverType === 'cx21' && (
                <p className="mt-2 text-xs text-amber-600">Hinweis: CX21 hat nur 4 GB RAM — für Ollama empfehlen wir mindestens CX31.</p>
              )}
            </fieldset>
          </>
        )}

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

        <button type="submit" disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Erstelle Kunde…' : 'Kunde erstellen →'}
        </button>
      </form>
    </div>
  );
}
