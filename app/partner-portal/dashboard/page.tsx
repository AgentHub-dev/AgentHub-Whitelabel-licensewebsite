"use client";

import { useEffect, useState } from "react";
import { partnerApi } from "@/lib/partnerApi";

interface PartnerData {
  id?: string;
  name?: string;
  companyName?: string;
  plan?: string;
  createdAt?: string;
  memberCount?: number;
  role?: string;
}

interface OrganizationData {
  id: string;
  package_tier: string;
  billing_status: string;
  monthly_price: string | number | null;
  floor_price_eur: string | number | null;
}

export default function DashboardPage() {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    partnerApi
      .me()
      .then((data: PartnerData) => setPartner(data))
      .catch(() => setError("Daten konnten nicht geladen werden."))
      .finally(() => setLoading(false));
    // Coach-Ready-Plan Phase 8: nur ueber /coach/register angelegte Partner
    // haben eine Organization -- 404 (=null) ist fuer Systemhaus-Partner
    // aus dem alten Modell erwartet und wird still ignoriert.
    partnerApi.getOrganization().then(setOrganization).catch(() => {});
  }, []);

  const referralLink =
    typeof window !== "undefined" && partner?.id
      ? `${window.location.origin}/coach/register?ref=${partner.id}`
      : "";

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const origin = window.location.origin;
      const data = await partnerApi.organizationCheckout({
        successUrl: `${origin}/partner-portal/dashboard?checkout=success`,
        cancelUrl: `${origin}/partner-portal/dashboard?checkout=cancelled`,
      });
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout fehlgeschlagen.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <svg
          className="w-8 h-8 text-[#1a3a5c] animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#1d1d1f] text-[28px] font-semibold mb-1">
          Willkommen{partner?.name ? `, ${partner.name}` : ""}!
        </h1>
        <p className="text-[#6e6e73] text-[15px]">
          {partner?.companyName
            ? `${partner.companyName} — Ihr Partner-Dashboard`
            : "Ihr Partner-Dashboard"}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-[14px]">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {/* Plan card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1a3a5c]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#c9a84c]/15 text-[#a07c30]">
              Aktiv
            </span>
          </div>
          <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
            Ihr Plan
          </div>
          <div className="text-[#1d1d1f] text-[22px] font-semibold">
            {partner?.plan ?? "MASTER"}
          </div>
        </div>

        {/* Partner since card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1a3a5c]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
            Partner seit
          </div>
          <div className="text-[#1d1d1f] text-[18px] font-semibold">
            {formatDate(partner?.createdAt)}
          </div>
        </div>

        {/* Team members card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1a3a5c]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
            Team-Mitglieder
          </div>
          <div className="text-[#1d1d1f] text-[28px] font-semibold">
            {partner?.memberCount ?? 0}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-4">
          Ihr Konto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
              Name
            </div>
            <div className="text-[#1d1d1f] text-[15px]">
              {partner?.name ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
              Unternehmen
            </div>
            <div className="text-[#1d1d1f] text-[15px]">
              {partner?.companyName ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
              Rolle
            </div>
            <div className="text-[#1d1d1f] text-[15px] capitalize">
              {partner?.role ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">
              Mitglied seit
            </div>
            <div className="text-[#1d1d1f] text-[15px]">
              {formatDate(partner?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Referral link — jeder Partner kann Coaches werben (Coach-Ready-Plan Phase 8) */}
      {partner?.id && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
          <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-2">
            Dein Empfehlungslink
          </h2>
          <p className="text-[#6e6e73] text-[14px] mb-4">
            Lade Coaches über diesen Link ein. Für jede Anmeldung erhältst du 24 Monate lang eine Provision.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#f5f5f7] rounded-xl px-4 py-3 text-[13px] text-[#1d1d1f] overflow-x-auto whitespace-nowrap">
              {referralLink}
            </code>
            <button onClick={copyReferralLink} className="btn-primary !py-3 !px-5 text-[14px] whitespace-nowrap">
              {copied ? "Kopiert ✓" : "Kopieren"}
            </button>
          </div>
        </div>
      )}

      {/* Eigene Organization — nur fuer Coaches vorhanden (Phase 8) */}
      {organization && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
          <h2 className="text-[#1d1d1f] text-[17px] font-semibold mb-4">
            Deine Unternehmenslizenz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
            <div>
              <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">Paket</div>
              <div className="text-[#1d1d1f] text-[15px]">{organization.package_tier}</div>
            </div>
            <div>
              <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">Status</div>
              <div className="text-[#1d1d1f] text-[15px] capitalize">{organization.billing_status}</div>
            </div>
            <div>
              <div className="text-[#6e6e73] text-[12px] font-medium uppercase tracking-wider mb-1">Monatspreis</div>
              <div className="text-[#1d1d1f] text-[15px]">{organization.monthly_price ?? "—"} €</div>
            </div>
          </div>
          {organization.billing_status === "TRIAL" && (
            <button onClick={startCheckout} disabled={checkoutLoading} className="btn-primary !py-3 !px-5 text-[14px] disabled:opacity-50">
              {checkoutLoading ? "Wird geladen..." : "Zahlung einrichten →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
