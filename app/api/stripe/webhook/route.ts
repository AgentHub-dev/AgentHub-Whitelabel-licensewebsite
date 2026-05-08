import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function sendLicenseEmail(email: string, name: string, licenseKey: string) {
  const resend = getResend();
  if (!resend || !email) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agent-hub.app";
  await resend.emails.send({
    from: "AgentHub <noreply@agent-hub.app>",
    to: email,
    subject: "Dein AgentHub Lizenz-Key 🎉",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2 style="color:#6366f1">Willkommen bei AgentHub, ${name || ""}!</h2>
        <p>Deine Zahlung war erfolgreich. Hier ist dein Lizenz-Key:</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:24px 0;text-align:center">
          <code style="font-size:18px;font-weight:bold;letter-spacing:2px;color:#18181b">${licenseKey}</code>
        </div>
        <p>Kopiere diesen Key und trage ihn bei der Installation ein.</p>
        <p>Im Kundenportal kannst du deinen Key jederzeit einsehen:</p>
        <a href="${appUrl}/portal" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Zum Portal →
        </a>
        <hr style="margin:32px 0;border:none;border-top:1px solid #e4e4e7"/>
        <p style="color:#71717a;font-size:13px">
          Bei Fragen antworte einfach auf diese Email.<br/>AgentHub Team
        </p>
      </div>
    `,
  });
}

async function sendStatusEmail(email: string, status: "paused" | "cancelled") {
  const resend = getResend();
  if (!resend || !email) return;
  const isPaused = status === "paused";
  await resend.emails.send({
    from: "AgentHub <noreply@agent-hub.app>",
    to: email,
    subject: isPaused ? "Zahlung fehlgeschlagen — Lizenz pausiert" : "Lizenz gekündigt",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2 style="color:#ef4444">${isPaused ? "Zahlung fehlgeschlagen" : "Lizenz gekündigt"}</h2>
        <p>${isPaused
          ? "Deine letzte Zahlung konnte nicht verarbeitet werden. Deine Lizenz wurde pausiert."
          : "Dein Abo wurde gekündigt. Deine Lizenz ist nicht mehr aktiv."
        }</p>
        ${isPaused ? `<p>Bitte aktualisiere deine Zahlungsmethode um fortzufahren.</p>` : ""}
        <p style="color:#71717a;font-size:13px">AgentHub Team</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.customer_email;
    const name = session.customer_details?.name || "";

    try {
      const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({
          tenantName: name,
          tenantEmail: email,
          maxUsers: 999,
          notes: `Stripe session: ${session.id}`,
          status: "active",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("License created:", data.key, "for", email);
        if (email) await sendLicenseEmail(email, name, data.key);
      } else {
        console.error("Failed to create license for session:", session.id);
      }
    } catch (err) {
      console.error("License creation error:", err);
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
    const obj = event.data.object as Stripe.Subscription | Stripe.Invoice;
    const customerId = "customer" in obj ? (obj.customer as string) : undefined;

    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const email = !customer.deleted && "email" in customer ? customer.email : null;

        if (email) {
          const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
            headers: { Authorization: `Bearer ${adminSecret}` },
          });
          if (res.ok) {
            const data = await res.json();
            const licenses: Array<{ tenant_email: string; key: string }> = data.licenses || [];
            const license = licenses.find(
              (l) => l.tenant_email?.toLowerCase() === email.toLowerCase()
            );
            if (license) {
              const newStatus = event.type === "customer.subscription.deleted" ? "cancelled" : "paused";
              await fetch(`${licenseServerUrl}/admin/licenses/${license.key}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSecret}` },
                body: JSON.stringify({ status: newStatus }),
              });
              await sendStatusEmail(email, newStatus);
              console.log(`License ${license.key} set to ${newStatus} for ${email}`);
            }
          }
        }
      } catch (err) {
        console.error("License pause/cancel error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
