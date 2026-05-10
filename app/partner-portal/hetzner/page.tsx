'use client';

import { useEffect, useState } from 'react';
import { partnerApi } from '@/lib/partnerApi';

export default function HetznerPage() {
  const [status, setStatus] = useState<{ connected: boolean; connectedAt: string | null } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    partnerApi.getHetznerStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      await partnerApi.connectHetzner(apiKey.trim());
      setSuccess('Hetzner erfolgreich verbunden.');
      setApiKey('');
      const updated = await partnerApi.getHetznerStatus();
      setStatus(updated);
    } catch (err: any) {
      setError(err.message ?? 'Verbindung fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Hetzner wirklich trennen?')) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      await partnerApi.disconnectHetzner();
      setStatus({ connected: false, connectedAt: null });
      setSuccess('Hetzner getrennt.');
    } catch (err: any) {
      setError(err.message ?? 'Fehler beim Trennen.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hetzner Cloud</h1>
        <p className="text-sm text-gray-500 mt-1">Verbinde deinen Hetzner-Account, um Server automatisch für Kunden bereitzustellen.</p>
      </div>

      {status?.connected ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="font-medium text-gray-900">Verbunden</span>
            {status.connectedAt && (
              <span className="text-xs text-gray-400">seit {new Date(status.connectedAt).toLocaleDateString('de-DE')}</span>
            )}
          </div>
          <p className="text-sm text-gray-600">Dein Hetzner API-Token ist gespeichert. Du kannst jetzt bei der Kunden-Erstellung automatisch Server einrichten.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Verbindung trennen
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">API-Token erstellen (2 Min)</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
              <li>Auf <strong>cloud.hetzner.com</strong> anmelden</li>
              <li>Projekt öffnen → <strong>Sicherheit → API-Tokens</strong></li>
              <li><strong>Token generieren</strong> — Rechte: <strong>Read &amp; Write</strong></li>
              <li>Token kopieren und unten einfügen</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hetzner API Token</label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="hv1_…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                {showKey ? 'Ausblenden' : 'Anzeigen'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Verbinde…' : 'Hetzner verbinden'}
          </button>
        </form>
      )}
    </div>
  );
}
