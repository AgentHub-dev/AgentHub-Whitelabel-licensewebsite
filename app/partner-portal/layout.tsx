"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
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

function Spinner() {
  return (
    <svg className="w-8 h-8 text-[#1a3a5c] animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PartnerPortalLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(() => {
    partnerApi.logout();
    router.replace("/portal");
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isOwner = role === "owner" || role === "admin";

  const ownerNav = [
    { href: "/partner-portal/dashboard", label: "Dashboard", icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { href: "/partner-portal/team", label: "Team", icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { href: "/partner-portal/preise", label: "Preise", icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { href: "/partner-portal/stripe", label: "Stripe", icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
  ];

  const memberNav = [
    ownerNav[0],
    ownerNav[2],
  ];

  const navItems = isOwner ? ownerNav : memberNav;

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className={`border-b border-white/10 ${collapsed && !isMobile ? "px-3 py-5 flex justify-center" : "px-5 py-5"}`}>
        {collapsed && !isMobile ? (
          <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold">AH</span>
          </div>
        ) : (
          <Link href="/partner-portal/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">AH</span>
            </div>
            <div>
              <div className="text-white font-semibold text-[14px] leading-tight">AgentHub</div>
              <div className="text-[#c9a84c] text-[11px] leading-tight">Partner Portal</div>
            </div>
          </Link>
        )}
      </div>

      {/* Partner info */}
      <div className={`border-b border-white/10 ${collapsed && !isMobile ? "px-3 py-4 flex justify-center" : "px-5 py-4"}`}>
        {collapsed && !isMobile ? (
          <div className="w-9 h-9 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#c9a84c] text-[13px] font-semibold">
              {name ? name.charAt(0).toUpperCase() : "P"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#c9a84c] text-[13px] font-semibold">
                {name ? name.charAt(0).toUpperCase() : "P"}
              </span>
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-[13px] font-medium truncate">{name ?? "Partner"}</div>
              <div className="text-white/50 text-[11px] capitalize">{role ?? "member"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-5 space-y-0.5 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all ${
                collapsed && !isMobile ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.icon}
              {(!collapsed || isMobile) && <span>{item.label}</span>}
              {(!collapsed || isMobile) && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-3 pb-2 border-t border-white/10 pt-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            className={`w-full flex items-center rounded-xl px-2.5 py-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span className="text-[13px] font-medium">Einklappen</span>}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className={`pb-5 border-t border-white/10 pt-3 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Abmelden" : undefined}
          className={`w-full flex items-center rounded-xl text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all ${
            collapsed && !isMobile ? "px-2.5 py-2.5 justify-center" : "gap-3 px-3 py-2.5"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {(!collapsed || isMobile) && <span>Abmelden</span>}
        </button>
      </div>
    </>
  );

  const sidebarWidth = collapsed ? "w-16" : "w-64";
  const mainMargin = collapsed ? "lg:ml-16" : "lg:ml-64";

  return (
    <div className="min-h-screen flex bg-[#f5f5f7]">

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 bg-[#1a3a5c] flex flex-col w-72 transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent(true)}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#1a3a5c] ${sidebarWidth} transition-all duration-300`}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-1 ${mainMargin} min-h-screen flex flex-col transition-all duration-300`}>

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-[#1a3a5c] px-4 py-3.5 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-7 h-7 bg-[#c9a84c] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">AH</span>
          </div>
          <span className="text-white font-semibold text-[14px]">Partner Portal</span>
          <div className="ml-auto w-8 h-8 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full flex items-center justify-center">
            <span className="text-[#c9a84c] text-[12px] font-semibold">
              {name ? name.charAt(0).toUpperCase() : "P"}
            </span>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PartnerPortalLayoutInner>{children}</PartnerPortalLayoutInner>
    </Suspense>
  );
}
