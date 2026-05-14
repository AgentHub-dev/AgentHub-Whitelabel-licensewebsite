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

// ─── Tier 3 helpers ───────────────────────────────────────────────────────────

async function adminFetch(
  licenseServerUrl: string,
  adminSecret: string,
  path: string,
  method = "GET",
  body?: object
): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${adminSecret}` };
  if (body) headers["Content-Type"] = "application/json";
  return fetch(`${licenseServerUrl}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// Creates Stripe transfers for Tier 1 and Tier 2 from a paid invoice.
// Uses idempotency keys derived from the invoice ID to survive retries.
async function createTier3Transfers(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  sub: Stripe.Subscription
): Promise<void> {
  const meta = sub.metadata ?? {};

  const tier2Account = meta.tier2StripeAccount;
  const tier1Account = meta.tier1StripeAccount;
  const tier2Cents = Number(meta.tier2Cents ?? "0");
  const tier1Cents = Number(meta.tier1Cents ?? "0");

  // invoice.charge is the Stripe Charge ID — required as source_transaction
  const chargeId =
    typeof invoice.charge === "string"
      ? invoice.charge
      : (invoice.charge as Stripe.Charge | null)?.id ?? null;

  if (!chargeId) {
    console.error("[Tier3 webhook] No charge on invoice", invoice.id);
    return;
  }

  // Transfer to Tier 2 (server owner)
  if (tier2Account && tier2Cents > 0) {
    try {
      await stripe.transfers.create(
        {
          amount: tier2Cents,
          currency: "eur",
          destination: tier2Account,
          source_transaction: chargeId,
          description: `Tier3 seat — ${meta.seatId ?? ""}`,
          metadata: { invoiceId: invoice.id, seatId: meta.seatId ?? "" },
        },
        { idempotencyKey: `t2-${invoice.id}` }
      );
      console.log(`[Tier3] Transferred ${tier2Cents}ct to Tier2 ${tier2Account}`);
    } catch (err) {
      console.error("[Tier3] Tier2 transfer failed", err);
    }
  }

  // Transfer to Tier 1 (partner)
  if (tier1Account && tier1Cents > 0) {
    try {
      await stripe.transfers.create(
        {
          amount: tier1Cents,
          currency: "eur",
          destination: tier1Account,
          source_transaction: chargeId,
          description: `Tier3 seat partner fee — ${meta.seatId ?? ""}`,
          metadata: { invoiceId: invoice.id, seatId: meta.seatId ?? "" },
        },
        { idempotencyKey: `t1-${invoice.id}` }
      );
      console.log(`[Tier3] Transferred ${tier1Cents}ct to Tier1 ${tier1Account}`);
    } catch (err) {
      console.error("[Tier3] Tier1 transfer failed", err);
    }
  }
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const licenseServerUrl = process.env.LICENSE_SERVER_URL || "http://localhost:3100";
  const adminSecret = process.env.ADMIN_SECRET;

  if (!secretKey || !webhookSecret || !adminSecret) {
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

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const isTier3 = session.metadata?.tier === "tier3";

    if (isTier3) {
      // Tier 3 seat purchase: link subscription to seat and activate it
      const seatId = session.metadata?.seatId;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null;

      if (seatId && subscriptionId) {
        try {
          await adminFetch(licenseServerUrl, adminSecret, `/admin/seats/${seatId}/subscription`, "PATCH", {
            subscriptionId,
          });
          console.log(`[Tier3] Seat ${seatId} activated with sub ${subscriptionId}`);
        } catch (err) {
          console.error("[Tier3] Failed to activate seat", err);
        }
      } else {
        console.error("[Tier3] checkout.session.completed missing seatId or subscriptionId", session.id);
      }
    } else {
      // Standard Tier 2 license purchase: create a new server license
      const email = session.customer_details?.email || session.customer_email;
      const name = session.customer_details?.name || "";
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null;

      try {
        const res = await adminFetch(licenseServerUrl, adminSecret, `/admin/licenses`, "POST", {
          tenantName: name,
          tenantEmail: email,
          maxUsers: 999,
          notes: `Stripe session: ${session.id}`,
          status: "active",
        });

        if (res.ok) {
          const data = await res.json();
          const licenseKey: string = data.key;
          console.log("License created:", licenseKey, "for", email);
          if (email) await sendLicenseEmail(email, name, licenseKey);

          // Persist subscription ID for future pause/cancel handling
          if (subscriptionId) {
            await adminFetch(licenseServerUrl, adminSecret, `/admin/licenses/${licenseKey}/subscription`, "PATCH", {
              subscriptionId,
            });
          }
        } else {
          console.error("Failed to create license for session:", session.id);
        }
      } catch (err) {
        console.error("License creation error:", err);
      }
    }
  }

  // ── invoice.paid ──────────────────────────────────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;

    if (!subId) {
      return NextResponse.json({ received: true });
    }

    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      const isTier3 = sub.metadata?.tier === "tier3";

      if (isTier3) {
        const seatId = sub.metadata?.seatId;
        if (!seatId) {
          console.error("[Tier3] invoice.paid — missing seatId in subscription metadata", subId);
          return NextResponse.json({ received: true });
        }

        // Reactivate seat if it was paused for payment failure
        await adminFetch(licenseServerUrl, adminSecret, `/admin/seats/${seatId}/status`, "PATCH", {
          status: "active",
        });

        // Create Transfers to Tier 1 and Tier 2
        await createTier3Transfers(stripe, invoice, sub);
        console.log(`[Tier3] invoice.paid processed for seat ${seatId}`);
      }
    } catch (err) {
      console.error("[Tier3] invoice.paid error", err);
    }
  }

  // ── invoice.payment_failed ────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;

    if (!subId) {
      return NextResponse.json({ received: true });
    }

    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      const isTier3 = sub.metadata?.tier === "tier3";

      if (isTier3) {
        const seatId = sub.metadata?.seatId;
        if (seatId) {
          await adminFetch(licenseServerUrl, adminSecret, `/admin/seats/${seatId}/status`, "PATCH", {
            status: "payment_failed",
          });
          console.log(`[Tier3] Seat ${seatId} suspended — payment_failed`);
        }
      } else {
        // Standard Tier 2 license: pause by email lookup
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as Stripe.Customer | null)?.id ?? null;

        if (customerId) {
          await pauseOrCancelLicenseByCustomer(stripe, licenseServerUrl, adminSecret, customerId, "paused");
        }
      }
    } catch (err) {
      console.error("invoice.payment_failed error:", err);
    }
  }

  // ── customer.subscription.deleted ────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const isTier3 = sub.metadata?.tier === "tier3";

    if (isTier3) {
      const seatId = sub.metadata?.seatId;
      if (seatId) {
        try {
          await adminFetch(licenseServerUrl, adminSecret, `/admin/seats/${seatId}/status`, "PATCH", {
            status: "inactive",
          });
          console.log(`[Tier3] Seat ${seatId} deactivated — subscription cancelled`);
        } catch (err) {
          console.error("[Tier3] subscription.deleted error:", err);
        }
      }
    } else {
      // Standard Tier 2 license: cancel by email lookup
      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : (sub.customer as Stripe.Customer | null)?.id ?? null;

      if (customerId) {
        try {
          await pauseOrCancelLicenseByCustomer(stripe, licenseServerUrl, adminSecret, customerId, "cancelled");
        } catch (err) {
          console.error("subscription.deleted error:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

// Legacy helper: find a Tier 2 license by Stripe customer email and update its status
async function pauseOrCancelLicenseByCustomer(
  stripe: Stripe,
  licenseServerUrl: string,
  adminSecret: string,
  customerId: string,
  newStatus: "paused" | "cancelled"
): Promise<void> {
  const customer = await stripe.customers.retrieve(customerId);
  const email = !customer.deleted && "email" in customer ? customer.email : null;
  if (!email) return;

  const res = await adminFetch(licenseServerUrl, adminSecret, `/admin/licenses`);
  if (!res.ok) return;

  const data = await res.json();
  const licenses: Array<{ tenant_email: string; key: string }> = data.licenses || [];
  const license = licenses.find((l) => l.tenant_email?.toLowerCase() === email.toLowerCase());

  if (license) {
    await adminFetch(licenseServerUrl, adminSecret, `/admin/licenses/${license.key}/status`, "PUT", {
      status: newStatus,
    });
    await sendStatusEmail(email, newStatus);
    console.log(`License ${license.key} set to ${newStatus} for ${email}`);
  }
}
