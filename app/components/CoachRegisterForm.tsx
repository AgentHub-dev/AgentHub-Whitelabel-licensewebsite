"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const benefits = [
  "Eigene Unternehmenslizenz für dein Coaching-Business",
  "Du behältst 70% — Rest deckt Plattform & Infrastruktur",
  "Automatische Auszahlung via Stripe Connect",
  "Team-Mitglieder einladen, Nutzung gemeinsam abgerechnet",
];

export default function CoachRegisterForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;

  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/coach/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ref }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      setSuccess(true);
      localStorage.setItem("partner_token", data.token);
      setTimeout(() => {
        window.location.href = data.stripeOnboardingUrl || "/partner-portal/dashboard";
      }, 1500);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-32 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label">Coach-Portal</p>
          <h2 className="section-title mb-4">
            Dein KI-Business,
            <br />
            <span className="gradient-text-blue">startklar in Minuten.</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Registriere deine eigene Unternehmenslizenz — inklusive automatischer
            Auszahlung und sofortigem Zugang.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl mx-auto">
          <div>
            <h3 className="text-[#1d1d1f] text-[28px] md:text-[34px] font-semibold leading-tight mb-6">
              Für Coaches & Berater,
              <br />
              nutzungsbasiert abgerechnet.
            </h3>
            <p className="text-[#6e6e73] text-[17px] leading-relaxed mb-10">
              Kein Sitzplatzmodell, keine Mindestlaufzeit — deine gesamte
              Organisation teilt sich einen Plan, Nutzung wird gemeinsam
              abgerechnet.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#1d1d1f] text-[16px]">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-[#f5f5f7] rounded-2xl border border-[#d2d2d7]/40">
              <p className="text-[#6e6e73] text-[13px] font-semibold uppercase tracking-wider mb-1">
                Bereits registriert?
              </p>
              <a href="/portal" className="text-[#0071e3] text-[15px] font-medium hover:underline">
                Zum Portal anmelden →
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/40">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-[#1d1d1f] text-[22px] font-semibold mb-2">Willkommen bei AgentHub!</h4>
                <p className="text-[#6e6e73] text-[15px]">
                  Wir richten deinen Zugang ein und schicken dir eine E-Mail. Du wirst weitergeleitet, um
                  Auszahlungen einzurichten...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h4 className="text-[#1d1d1f] text-[20px] font-semibold mb-1">Jetzt registrieren</h4>
                  <p className="text-[#6e6e73] text-[14px]">
                    Kostenlos starten — Testphase, danach nutzungsbasiert.
                  </p>
                  {ref && (
                    <p className="text-[#0071e3] text-[12px] mt-2">
                      Du wurdest über einen Empfehlungslink eingeladen.
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Vollständiger Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Max Mustermann" required className="input-apple" />
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">E-Mail</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="max@coaching.de" required className="input-apple" />
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">Firmenname</label>
                    <input type="text" name="companyName" value={form.companyName} onChange={handleChange} placeholder="Muster Coaching" required className="input-apple" />
                  </div>
                  <div>
                    <label className="block text-[#1d1d1f] text-[13px] font-medium mb-1.5">
                      Passwort <span className="text-[#6e6e73] font-normal">(min. 8 Zeichen)</span>
                    </label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required minLength={8} className="input-apple" />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <p className="text-red-600 text-[13px] leading-snug">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full btn-primary text-[16px] !py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Wird registriert..." : "Jetzt registrieren →"}
                  </button>
                </form>

                <p className="text-center text-[#6e6e73] text-[12px] mt-5">
                  Mit der Registrierung stimmst du unseren{" "}
                  <a href="#" className="text-[#0071e3] hover:underline">AGB</a> und der{" "}
                  <a href="#" className="text-[#0071e3] hover:underline">Datenschutzerklärung</a> zu.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
