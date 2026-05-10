"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { partnerApi } from "@/lib/partnerApi";
import { Suspense } from "react";

interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

function StripePageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const justConnected = searchParams.get("connected") === "1";
  const needsRefresh = searchParams.get("refresh") === "1";

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError("");
    try {
      const data = await partnerApi.stripeConnectStatus();
      setStatus(data);
    } catch {
      setError("Status konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setActionLoading(true);
    setError("");
    try {
      await partnerApi.stripeConnectCreate();
      const linkData = await partnerApi.stripeConnectLink();
      if (linkData.url) {
        window.location.href = linkData.url;
      } else {
        setError(linkData.error ?? "Stripe-Link konnte nicht erstellt werden.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOnboarding() {
    setActionLoading(true);
    setError("");
    try {
      const linkData = await partnerApi.stripeConnectLink();
      if (linkData.url) {
        window.location.href = linkData.url;
      } else {
        setError(linkData.error ?? "Stripe-Link konnte nicht erstellt werden.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setActionLoading(false);
    }
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

  const fullyEnabled = status?.chargesEnabled && status?.payoutsEnabled;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">Stripe Connect</h1>
        <p className="text-[#6e6e73] text-[15px]">
          Verbinde dein Stripe-Konto für automatische Auszahlungen.
        </p>
      </div>

      {justConnected && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700 text-[14px]">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Stripe-Konto erfolgreich verbunden!
        </div>
      )}

      {needsRefresh && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 text-yellow-700 text-[14px]">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Das Onboarding wurde unterbrochen. Bitte vervollständige deine Angaben.
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px]">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-5">
        {/* Status card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#1d1d1f] text-[17px] font-semibold">Kontostatus</h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
              fullyEnabled
                ? "bg-green-100 text-green-700"
                : status?.connected
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                fullyEnabled ? "bg-green-500" : status?.connected ? "bg-yellow-500" : "bg-gray-400"
              }`} />
              {fullyEnabled ? "Aktiv" : status?.connected ? "Unvollständig" : "Nicht verbunden"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Konto verbunden", value: status?.connected },
              { label: "Zahlungen aktiv", value: status?.chargesEnabled },
              { label: "Auszahlungen aktiv", value: status?.payoutsEnabled },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-[#f5f5f7] rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  value ? "bg-green-100" : "bg-gray-200"
                }`}>
                  {value ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-[#1d1d1f] text-[13px] font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {status?.accountId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-[#6e6e73] text-[12px]">Account-ID: </span>
              <span className="text-[#1d1d1f] text-[12px] font-mono">{status.accountId}</span>
            </div>
          )}
        </div>

        {/* Action card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {!status?.connected ? (
            <>
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-2">Stripe-Konto verbinden</h2>
              <p className="text-[#6e6e73] text-[14px] mb-5 leading-relaxed">
                Verbinde dein Stripe-Konto, um automatische Auszahlungen aus dem Revenue-Split zu erhalten.
                Der Prozess dauert ca. 5 Minuten.
              </p>
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="flex items-center gap-2.5 px-5 py-3 bg-[#635bff] text-white text-[14px] font-semibold rounded-xl hover:bg-[#5851eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm10 1a1 1 0 100 2 1 1 0 000-2zm-4 2a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                )}
                Mit Stripe verbinden
              </button>
            </>
          ) : !fullyEnabled ? (
            <>
              <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-2">Onboarding vervollständigen</h2>
              <p className="text-[#6e6e73] text-[14px] mb-5 leading-relaxed">
                Dein Stripe-Konto ist verbunden, aber das Onboarding ist noch nicht abgeschlossen.
                Bitte vervollständige deine Angaben, damit Zahlungen und Auszahlungen aktiviert werden.
              </p>
              <button
                onClick={handleOnboarding}
                disabled={actionLoading}
                className="flex items-center gap-2.5 px-5 py-3 bg-[#c9a84c] text-white text-[14px] font-semibold rounded-xl hover:bg-[#b8973b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                Onboarding fortsetzen →
              </button>
            </>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-1">Alles bereit</h2>
                <p className="text-[#6e6e73] text-[14px]">
                  Dein Stripe-Konto ist vollständig eingerichtet. Auszahlungen werden automatisch verarbeitet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-[#d2d2d7]/40">
          <h3 className="text-[#1d1d1f] text-[13px] font-semibold mb-3">So funktioniert der Revenue-Split</h3>
          <div className="space-y-2.5">
            {[
              "Jeder aktive Seat deiner Kunden generiert monatliche Einnahmen",
              "Der Revenue-Split wird automatisch über Stripe Connect abgewickelt",
              "Auszahlungen erfolgen direkt auf dein verbundenes Bankkonto",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#1a3a5c]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a5c]" />
                </div>
                <span className="text-[#6e6e73] text-[13px] leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StripePage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-[#1a3a5c] animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <StripePageInner />
    </Suspense>
  );
}
