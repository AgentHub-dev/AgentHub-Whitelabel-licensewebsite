import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

      if (!res.ok) {
        console.error("Failed to create license for session:", session.id);
      } else {
        const data = await res.json();
        console.log("License created:", data.key, "for", email);
      }
    } catch (err) {
      console.error("License creation error:", err);
    }
  }

  if (event.type === "customer.subscription.deleted" || event.type === "invoice.payment_failed") {
    const obj = event.data.object as Stripe.Subscription | Stripe.Invoice;
    const customerId =
      "customer" in obj ? (obj.customer as string) : undefined;

    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const email =
          !customer.deleted && "email" in customer ? customer.email : null;

        if (email) {
          const res = await fetch(`${licenseServerUrl}/admin/licenses`, {
            headers: { Authorization: `Bearer ${adminSecret}` },
          });
          if (res.ok) {
            const data = await res.json();
            const licenses: Array<{ tenant_email: string; key: string }> =
              data.licenses || [];
            const license = licenses.find(
              (l) => l.tenant_email?.toLowerCase() === email.toLowerCase()
            );
            if (license) {
              const newStatus =
                event.type === "customer.subscription.deleted"
                  ? "cancelled"
                  : "paused";
              await fetch(
                `${licenseServerUrl}/admin/licenses/${license.key}/status`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminSecret}`,
                  },
                  body: JSON.stringify({ status: newStatus }),
                }
              );
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
