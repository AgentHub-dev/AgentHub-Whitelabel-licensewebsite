'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_PARTNER_API_URL ?? 'https://license.agent-hub.app';

interface OnboardingInfo {
  tenantName: string;
  expiresAt: string;
  partnerName: string | null;
}

export default function HetznerOnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<OnboardingInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'expired' | 'invalid' | 'done' | 'error'>('loading');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/provisioning/hetzner-onboarding/${token}`)
      .then(async res => {
        if (!res.ok) {
          const code = res.status;
          if (code === 404) setStatus('invalid');
          else if (code === 410) setStatus('expired');
          else setStatus('error');
          return;
        }
        const data = await res.json();
        setInfo(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSubmitting(true); setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/provisioning/hetzner-onboarding/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Fehler beim Einreichen. Bitte versuche es erneut.');
        return;
      }
      setStatus('done');
    } catch {
      setErrorMsg('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="bg-slate-900 rounded-t-2xl px-8 py-6 text-center">
          <h1 className="text-white font-bold text-xl">AgentHub</h1>
          <p className="text-slate-400 text-sm mt-1">Server-Einrichtung</p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-200 px-8 py-8">

          {status === 'loading' && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center space-y-3">
              <h2 className="font-bold text-gray-900">Link ungültig</h2>
              <p className="text-sm text-gray-500">
                Dieser Link ist ungültig oder wurde bereits verwendet.
                Bitte wende dich an deinen Partner für einen neuen Link.
              </p>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center space-y-3">
              <h2 className="font-bold text-gray-900">Link abgelaufen</h2>
              <p className="text-sm text-gray-500">
                Dieser Link ist nicht mehr gültig (24h Laufzeit).
                Kontaktiere deinen Partner und bitte um einen neuen Link.
              </p>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Server wird eingerichtet!</h2>
              <p className="text-sm text-gray-600">
                Dein Hetzner API-Token wurde gespeichert. Der Server wird jetzt
                automatisch in deinem Hetzner-Account erstellt (~5–10 Min).
              </p>
              <p className="text-sm text-gray-600">
                Du erhältst eine E-Mail sobald alles bereit ist — inklusive Login-Daten
                und IP-Adresse.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                Der API-Token wird nach der Einrichtung aus unserem System gelöscht.
                Billing läuft direkt über deinen Hetzner-Account.
              </div>
            </div>
          )}

          {status === 'ready' && info && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  Letzter Schritt: Hetzner verbinden
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Für <strong>{info.tenantName}</strong>
                  {info.partnerName && ` (via ${info.partnerName})`}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                <p className="font-semibold">So erstellst du einen API-Token (2 Min)</p>
                <ol className="space-y-1 list-decimal list-inside text-blue-700">
                  <li>Melde dich auf <strong>cloud.hetzner.com</strong> an</li>
                  <li>Öffne dein Projekt (oder lege ein neues an)</li>
                  <li>Gehe zu <strong>Sicherheit → API-Tokens</strong></li>
                  <li>Klicke <strong>„Token generieren"</strong></li>
                  <li>Berechtigungen: <strong>Read &amp; Write</strong></li>
                  <li>Token kopieren und unten einfügen</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hetzner API Token *
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    required
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="hv1_…"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    {showKey ? 'Verbergen' : 'Anzeigen'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !apiKey.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold
                           hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Einrichten wird gestartet…' : 'Server einrichten →'}
              </button>

              <div className="text-xs text-gray-400 text-center space-y-1">
                <p>
                  Link läuft ab: {new Date(info.expiresAt).toLocaleString('de-DE')}
                </p>
                <p>
                  Der Token wird nach der Einrichtung aus unserem System gelöscht.
                  Billing läuft direkt über deinen Hetzner-Account.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
