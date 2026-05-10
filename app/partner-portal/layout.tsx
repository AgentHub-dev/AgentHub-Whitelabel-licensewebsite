"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { partnerApi } from "@/lib/partnerApi";

interface JwtPayload {
  role?: string;
  name?: string;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload {
  try {
    const base64 = token.split(".")[1];
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function PartnerPortalLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("partner_token", urlToken);
      window.history.replaceState({}, "", pathname);
    }

    const stored = localStorage.getItem("partner_token");
    if (!stored) {
      router.replace("/portal");
      return;
    }

    const payload = decodeJwt(stored);
    setRole(payload.role ?? "member");
    setName(payload.name ?? "Partner");
    setReady(true);
  }, [pathname, router, searchParams]);

  const handleLogout = () => {
    partnerApi.logout();
    router.replace("/portal");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
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

  const isOwner = role === "owner" || role === "admin";

  const ownerNav = [
    { href: "/partner-portal/dashboard", label: "Dashboard", icon: "⊞" },
    { href: "/partner-portal/team", label: "Team", icon: "👥" },
    { href: "/partner-portal/preise", label: "Preise", icon: "€" },
    { href: "/partner-portal/stripe", label: "Stripe", icon: "💳" },
  ];

  const memberNav = [
    { href: "/partner-portal/dashboard", label: "Dashboard", icon: "⊞" },
    { href: "/partner-portal/preise", label: "Preise", icon: "€" },
  ];

  const navItems = isOwner ? ownerNav : memberNav;

  return (
    <div className="min-h-screen flex bg-[#f5f5f7]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a3a5c] flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/partner-portal/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">AH</span>
            </div>
            <div>
              <div className="text-white font-semibold text-[14px] leading-tight">
                AgentHub
              </div>
              <div className="text-[#c9a84c] text-[11px] leading-tight">
                Partner Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Partner info */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#c9a84c] text-[13px] font-semibold">
                {name ? name.charAt(0).toUpperCase() : "P"}
              </span>
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-[13px] font-medium truncate">
                {name ?? "Partner"}
              </div>
              <div className="text-white/50 text-[11px] capitalize">
                {role ?? "member"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-[16px] leading-none w-5 text-center">
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
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
      }
    >
      <PartnerPortalLayoutInner>{children}</PartnerPortalLayoutInner>
    </Suspense>
  );
}
