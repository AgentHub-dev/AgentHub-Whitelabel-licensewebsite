"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const directKey = params.get("key");
    if (directKey) {
      setKey(directKey);
      return;
    }

    const sessionId = params.get("session_id");
    if (!sessionId) {
      setError("Keine Session-ID gefunden.");
      return;
    }

    fetch(`/api/customer/key?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.key) setKey(data.key);
        else setError(data.error || "Key konnte nicht geladen werden.");
      })
      .catch(() => setError("Verbindungsfehler beim Laden des Keys."));
  }, [params]);

  const copyKey = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-[#1d1d1f] text-[36px] font-semibold mb-2">
            Zahlung erfolgreich!
          </h1>
          <p className="text-[#6e6e73] text-[17px]">
            Deine AgentHub-OS Lizenz ist aktiv.
          </p>
        </div>

        {/* License key card */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/40 mb-6">
          <p className="text-[#6e6e73] text-[14px] font-medium uppercase tracking-wider mb-3">
            Dein Lizenz-Key
          </p>
          {key ? (
            <>
              <div className="bg-[#f5f5f7] rounded-xl p-4 flex items-center justify-between gap-4 mb-4 border border-[#d2d2d7]/40">
                <code className="text-[#1d1d1f] text-[18px] font-mono font-semibold tracking-wider flex-1 overflow-auto">
                  {key}
                </code>
                <button
                  onClick={copyKey}
                  className="flex-shrink-0 text-[#0071e3] hover:text-[#0077ed] transition-colors"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[#6e6e73] text-[13px]">
                Dieser Key wurde auch an deine E-Mail-Adresse gesendet.
              </p>
            </>
          ) : error ? (
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
              <p className="text-red-600 text-[14px] mb-2">{error}</p>
              <p className="text-[#6e6e73] text-[12px]">
                Melde dich im Portal mit deiner E-Mail an um deinen Key zu sehen.
              </p>
            </div>
          ) : (
            <div className="bg-[#f5f5f7] rounded-xl p-4 text-center">
              <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[#6e6e73] text-[14px]">Key wird geladen...</p>
            </div>
          )}
        </div>

        {/* Next steps */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#d2d2d7]/40 mb-6">
          <h3 className="text-[#1d1d1f] text-[17px] font-semibold mb-5">
            Nächste Schritte
          </h3>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Setup-Repo clonen",
                code: "git clone git@github-agenthub:mb247alex-jpg/AgentHub-Whitelabel-deployment.git",
              },
              {
                step: "2",
                title: "Stack starten",
                code: "cd AgentHub-Whitelabel-deployment/wl-stack && bash setup.sh",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-7 h-7 bg-[#0071e3]/10 text-[#0071e3] rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-[#1d1d1f] text-[15px] font-medium mb-1">{item.title}</p>
                  <code className="block bg-[#f5f5f7] rounded-lg px-3 py-2 text-[12px] text-[#424245] font-mono overflow-auto">
                    {item.code}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/portal" className="flex-1 btn-primary justify-center">
            Zum Portal
          </Link>
          <Link href="/" className="btn-ghost border border-[#d2d2d7]">
            Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
    </div>}>
      <SuccessContent />
    </Suspense>
  );
}
