"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Navigation ───────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[52px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0071e3] rounded-md flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">AH</span>
          </div>
          <span className="text-[#1d1d1f] font-semibold text-[15px]">
            AgentHub-OS
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ["Features", "#features"],
            ["So funktioniert es", "#how"],
            ["Preise", "#preise"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[#1d1d1f] text-[14px] hover:text-[#0071e3] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/portal" className="text-[#0071e3] text-[14px] font-medium hover:underline">
            Mein Konto
          </Link>
          <a href="#preise" className="btn-primary text-[14px] !py-2 !px-5">
            Lizenz kaufen
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#1d1d1f] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-nav border-t border-[#d2d2d7]/30 px-6 py-4 flex flex-col gap-4">
          {[
            ["Features", "#features"],
            ["So funktioniert es", "#how"],
            ["Preise", "#preise"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} className="text-[#1d1d1f] text-[16px]">
              {label}
            </a>
          ))}
          <Link href="/portal" className="text-[#0071e3] text-[16px] font-medium">Mein Konto</Link>
          <a href="#preise" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>Lizenz kaufen</a>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-16">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#0071e3]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#34aadc]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f5f5f7]/80 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f5f7] rounded-full text-[13px] text-[#6e6e73] mb-8 border border-[#d2d2d7]/40">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Whitelabel Edition 2026
        </div>

        <h1 className="text-[52px] md:text-[80px] lg:text-[96px] font-semibold tracking-tight leading-[1.05] text-[#1d1d1f] mb-6">
          Die KI-Plattform
          <br />
          <span className="gradient-text-blue">für deine Agentur.</span>
        </h1>

        <p className="text-[#6e6e73] text-[19px] md:text-[23px] leading-relaxed max-w-2xl mx-auto mb-10">
          AgentHub-OS — Das vollständige KI-System, das du deinen Kunden unter
          eigenem Brand anbietest. Fertig deployed in 5 Minuten.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#preise" className="btn-primary text-[17px] !px-8 !py-4">
            Lizenz kaufen →
          </a>
          <a href="#features" className="btn-ghost text-[17px] !px-8 !py-4">
            Mehr erfahren
          </a>
        </div>

        <p className="mt-6 text-[#6e6e73] text-[14px]">
          Keine Einrichtungsgebühr · Kündigung jederzeit · Sofort-Setup
        </p>

        {/* Mock UI preview */}
        <div className="mt-20 relative mx-auto max-w-4xl">
          <div className="bg-[#1d1d1f] rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-[#424245]">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 bg-[#2d2d2f] border-b border-[#424245]">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-4">
                <div className="bg-[#1d1d1f] rounded-md h-6 flex items-center justify-center">
                  <span className="text-[#6e6e73] text-[12px]">app.youragency.com</span>
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: "Aktive Agenten", value: "247", color: "text-green-400" },
                { label: "Endkunden", value: "83", color: "text-blue-400" },
                { label: "Automatisierungen", value: "1.204", color: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#2d2d2f] rounded-2xl p-4 border border-[#424245]">
                  <div className={`text-[28px] font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-[#6e6e73] text-[13px]">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
              <div className="bg-[#2d2d2f] rounded-2xl p-4 border border-[#424245] col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-[14px] font-medium">Automatisierungen heute</span>
                  <span className="text-green-400 text-[13px]">+12%</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#0071e3]/40 rounded-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "⚡",
    title: "Plug & Play Deployment",
    desc: "Ein einziger Befehl. Dein vollständiger KI-Stack läuft in unter 5 Minuten auf deinem Server.",
  },
  {
    icon: "🔒",
    title: "Zero-Knowledge Privacy",
    desc: "BYOK mit AES-256 Verschlüsselung. Deine Kunden-Daten sind unsichtbar — auch für dich als Admin.",
  },
  {
    icon: "⚙️",
    title: "Automatischer Kill-Switch",
    desc: "Zahlung ausgeblieben? Der Watchdog-Container pausiert den Stack sofort. Kein manuelles Eingreifen nötig.",
  },
  {
    icon: "💳",
    title: "Stripe Connect",
    desc: "Du setzt deine Preise. Deine Kunden zahlen direkt. Dein Anteil kommt automatisch auf dein Konto.",
  },
  {
    icon: "🎨",
    title: "White-Label Branding",
    desc: "Dein Logo. Deine Farben. Deine Domain. Deine Kunden sehen niemals AgentHub.",
  },
  {
    icon: "🎙️",
    title: "Siri & PWA-Ready",
    desc: "Deine Kunden steuern ihre Agenten per Sprachbefehl oder direkt vom Homescreen wie eine native App.",
  },
];

function AnimatedSection({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`animate-on-scroll ${className}`} style={style}>
      {children}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="py-32 bg-[#f5f5f7]">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-20">
          <p className="section-label">Features</p>
          <h2 className="section-title mb-4">
            Alles drin.
            <br />
            Nichts vergessen.
          </h2>
          <p className="section-subtitle mx-auto">
            AgentHub-OS ist ein komplettes System — von der KI-Engine bis zum
            Abrechnungssystem. Du bringst den Kunden, wir den Rest.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={f.title} style={{ transitionDelay: `${i * 80}ms` } as React.CSSProperties}>
              <div className="card-apple h-full">
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-[#1d1d1f] text-[20px] font-semibold mb-3">{f.title}</h3>
                <p className="text-[#6e6e73] text-[16px] leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    title: "Lizenz kaufen",
    desc: "Einmal bezahlen, sofort deinen persönlichen WL-Key erhalten. Alles in unter 2 Minuten.",
  },
  {
    num: "02",
    title: "Stack starten",
    desc: "SSH auf deinen Server, setup.sh ausführen. AgentHub-OS konfiguriert sich vollständig selbst.",
  },
  {
    num: "03",
    title: "Kunden onboarden",
    desc: "Dein Branding ist live. Lade deine ersten Kunden ein — und fange an, monatlich zu verdienen.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-20">
          <p className="section-label">So funktioniert es</p>
          <h2 className="section-title mb-4">
            Drei Schritte.
            <br />
            Dein Business läuft.
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((s, i) => (
            <AnimatedSection key={s.num} style={{ transitionDelay: `${i * 120}ms` } as React.CSSProperties}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[24px] font-bold mb-6">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#0071e3]/20 to-transparent" />
                )}
                <h3 className="text-[#1d1d1f] text-[22px] font-semibold mb-3">{s.title}</h3>
                <p className="text-[#6e6e73] text-[16px] leading-relaxed">{s.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner() {
  return (
    <section className="py-20 bg-[#1d1d1f]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "< 5 min", label: "Setup-Zeit" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "AES-256", label: "Verschlüsselung" },
            { value: "0€", label: "Einrichtungsgebühr" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-white text-[36px] md:text-[48px] font-semibold mb-2">{s.value}</div>
              <div className="text-[#6e6e73] text-[15px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Fehler beim Checkout. Bitte versuche es erneut.");
      }
    } catch {
      alert("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="preise" className="py-32 bg-[#f5f5f7]">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="section-label">Preise</p>
          <h2 className="section-title mb-4">
            Ein Plan.
            <br />
            Alles dabei.
          </h2>
          <p className="section-subtitle mx-auto">
            Keine versteckten Kosten. Keine Feature-Gates. Du bekommst das
            vollständige System.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="max-w-lg mx-auto">
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.12)] border border-[#d2d2d7]/40">
              {/* Top accent */}
              <div className="h-1 bg-gradient-to-r from-[#0071e3] to-[#34aadc]" />

              <div className="p-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-[#1d1d1f] text-[24px] font-semibold mb-1">
                      Whitelabel Lizenz
                    </h3>
                    <p className="text-[#6e6e73] text-[15px]">AgentHub-OS · Full Stack</p>
                  </div>
                  <div className="bg-[#0071e3]/10 text-[#0071e3] text-[13px] font-medium px-3 py-1 rounded-full">
                    Beliebt
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[56px] font-bold text-[#1d1d1f] leading-none">297</span>
                  <div>
                    <span className="text-[#1d1d1f] text-[24px] font-medium">€</span>
                    <span className="text-[#6e6e73] text-[15px] block">/Monat</span>
                  </div>
                </div>
                <p className="text-[#6e6e73] text-[14px] mb-8">
                  Jährlich: <strong className="text-[#1d1d1f]">2.970 € / Jahr</strong> — 2 Monate gratis
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    "Vollständiger White-Label Stack",
                    "Unlimitierte Endkunden-Accounts",
                    "Dify.ai + n8n + Browser-Automatisierung",
                    "Stripe Connect Integration",
                    "Siri-Schnittstelle & PWA",
                    "Automatischer Kill-Switch Watchdog",
                    "AES-256 BYOK Verschlüsselung",
                    "Alle zukünftigen Updates",
                    "Technischer Support via Email",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[#1d1d1f] text-[15px]">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full btn-primary justify-center text-[17px] !py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Wird vorbereitet...
                    </span>
                  ) : (
                    "Jetzt Lizenz kaufen →"
                  )}
                </button>

                <p className="text-center text-[#6e6e73] text-[13px] mt-4">
                  Sicher bezahlen via Stripe · Sofort-Aktivierung
                </p>
              </div>
            </div>

            <p className="text-center text-[#6e6e73] text-[14px] mt-6">
              Fragen?{" "}
              <a href="mailto:alex@agenthub.de" className="text-[#0071e3] hover:underline">
                Schreib uns
              </a>
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Was bekomme ich mit der Lizenz?",
    a: "Du erhältst einen persönlichen WL-Lizenz-Key (Format: WL-XXXX-XXXX-XXXX-XXXX), mit dem du AgentHub-OS auf einem beliebigen Server deployen kannst. Im Lieferumfang ist der komplette Stack: Dify.ai, n8n im Queue Mode, Browser-Automatisierung, Backend mit Multi-Tenancy, Frontend als PWA und alle Integrationen.",
  },
  {
    q: "Wie schnell bin ich startklar?",
    a: "Nach dem Kauf erhältst du deinen Key sofort per E-Mail. Du SSH-st auf deinen Server, clonest das Deployment-Repo und führst setup.sh aus. Die vollständige Installation dauert in der Regel unter 5 Minuten.",
  },
  {
    q: "Was passiert, wenn ich nicht zahle?",
    a: "Der integrierte Watchdog-Container prüft täglich die Lizenz. Bei ausbleibender Zahlung pausiert er den gesamten Docker-Stack automatisch. Deine Daten bleiben erhalten — nach Zahlung läuft alles sofort wieder.",
  },
  {
    q: "Kann ich eigene Preise für meine Kunden setzen?",
    a: "Ja, vollständig. Über Stripe Connect legst du deine eigenen Abo-Preise für Endkunden fest. Du kassierst direkt, und dein Anteil für die Lizenz wird automatisch abgeführt.",
  },
  {
    q: "Sehen meine Kunden, dass es AgentHub ist?",
    a: "Nein. Du konfigurierst dein eigenes Logo, deine Farben und deine Domain. Deine Kunden erleben eine vollständig gebrandete Plattform — AgentHub bleibt unsichtbar.",
  },
  {
    q: "Was ist mit Updates?",
    a: "Alle zukünftigen Updates sind im Abo enthalten. Du erhältst Benachrichtigungen, wenn neue Versionen verfügbar sind. Das Update-Verfahren ist ebenfalls vollständig automatisiert.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <p className="section-label">FAQ</p>
          <h2 className="section-title mb-4">
            Häufige Fragen.
          </h2>
        </AnimatedSection>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <AnimatedSection key={faq.q} style={{ transitionDelay: `${i * 60}ms` } as React.CSSProperties}>
              <div className="bg-[#f5f5f7] rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#ebebed] transition-colors"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-[#1d1d1f] text-[16px] font-medium">{faq.q}</span>
                  <div className={`text-[#6e6e73] transition-transform duration-200 flex-shrink-0 ${open === i ? "rotate-45" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </button>
                {open === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[#6e6e73] text-[15px] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-32 bg-[#1d1d1f]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <AnimatedSection>
          <h2 className="text-white text-[44px] md:text-[60px] font-semibold tracking-tight leading-tight mb-6">
            Dein KI-Business
            <br />
            startet heute.
          </h2>
          <p className="text-[#6e6e73] text-[19px] leading-relaxed mb-10 max-w-xl mx-auto">
            Schließ dich den Agenturen an, die ihre KI-Plattform bereits unter eigenem Brand betreiben.
          </p>
          <a href="#preise" className="btn-primary text-[17px] !px-10 !py-4 bg-white !text-[#1d1d1f] hover:bg-[#f5f5f7]">
            Jetzt starten →
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]/40">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#0071e3] rounded-md flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">AH</span>
              </div>
              <span className="text-[#1d1d1f] font-semibold text-[15px]">AgentHub-OS</span>
            </div>
            <p className="text-[#6e6e73] text-[14px] max-w-xs">
              Die White-Label KI-Plattform für moderne Agenturen.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[#1d1d1f] text-[13px] font-semibold mb-3 uppercase tracking-wider">Produkt</h4>
              <div className="space-y-2">
                {[["Features", "#features"], ["Preise", "#preise"], ["FAQ", "#faq"]].map(([l, h]) => (
                  <a key={l} href={h} className="block text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[#1d1d1f] text-[13px] font-semibold mb-3 uppercase tracking-wider">Konto</h4>
              <div className="space-y-2">
                <Link href="/portal" className="block text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">Mein Portal</Link>
                <Link href="/portal" className="block text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">Admin</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[#1d1d1f] text-[13px] font-semibold mb-3 uppercase tracking-wider">Rechtliches</h4>
              <div className="space-y-2">
                {["Impressum", "Datenschutz", "AGB"].map((l) => (
                  <a key={l} href="#" className="block text-[#6e6e73] text-[14px] hover:text-[#1d1d1f] transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#d2d2d7]/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#6e6e73] text-[13px]">© 2026 AgentHub-OS. Alle Rechte vorbehalten.</p>
          <a href="mailto:alex@agenthub.de" className="text-[#0071e3] text-[13px] hover:underline">
            alex@agenthub.de
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <StatsBanner />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </>
  );
}
