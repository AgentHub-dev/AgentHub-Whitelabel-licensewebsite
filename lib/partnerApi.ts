const BASE = "/api";

function getToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("partner_token")
    : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

export const partnerApi = {
  getToken,
  logout() {
    localStorage.removeItem("partner_token");
  },
  async me() {
    const res = await fetch(`${BASE}/partner/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },
  async listMembers() {
    const res = await fetch(`${BASE}/partner/members`, {
      headers: authHeaders(),
    });
    return res.json();
  },
  async createMember(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const res = await fetch(`${BASE}/partner/members`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteMember(id: string) {
    await fetch(`${BASE}/partner/members/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
  async getPricing() {
    const res = await fetch(`${BASE}/partner/pricing`, { headers: authHeaders() });
    return res.json();
  },
  async updatePricing(data: { tier2Price?: number; tier3PartnerFee?: number }) {
    const res = await fetch(`${BASE}/partner/pricing`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async stripeConnectCreate() {
    const res = await fetch(`${BASE}/partner/stripe/connect`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.json();
  },
  async stripeConnectLink() {
    const res = await fetch(`${BASE}/partner/stripe/connect/link`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.json();
  },
  async stripeConnectStatus() {
    const res = await fetch(`${BASE}/partner/stripe/connect/status`, {
      headers: authHeaders(),
    });
    return res.json();
  },

  async getHetznerStatus() {
    const res = await fetch(`${BASE}/partner/hetzner/status`, { headers: authHeaders() });
    return res.json();
  },
  async connectHetzner(apiKey: string) {
    const res = await fetch(`${BASE}/partner/hetzner/connect`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fehler"); }
    return res.json();
  },
  async disconnectHetzner() {
    const res = await fetch(`${BASE}/partner/hetzner/disconnect`, {
      method: "DELETE", headers: authHeaders(),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fehler"); }
    return res.json();
  },
  async listCustomers() {
    const res = await fetch(`${BASE}/partner/customers`, { headers: authHeaders() });
    return res.json();
  },
  async createCustomer(data: {
    name: string; email: string; info?: string;
    deploymentType?: string; serverOwner?: string;
    serverType?: string; serverLocation?: string; ollamaMode?: string;
    tier2PriceCents?: number; seatPriceCents?: number;
  }) {
    const res = await fetch(`${BASE}/partner/customers`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    });
    return res.json();
  },
  async resendHetznerOnboarding(customerId: string) {
    const res = await fetch(`${BASE}/partner/customers/${customerId}/resend-onboarding`, {
      method: "POST", headers: authHeaders(),
    });
    return res.json();
  },
  async getCustomer(id: string) {
    const res = await fetch(`${BASE}/partner/customers/${id}`, { headers: authHeaders() });
    return res.json();
  },
  async updateCustomer(id: string, data: { name?: string; info?: string; hostingType?: string; domain?: string; serverLicenseKey?: string }) {
    const res = await fetch(`${BASE}/partner/customers/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteCustomer(id: string) {
    await fetch(`${BASE}/partner/customers/${id}`, { method: "DELETE", headers: authHeaders() });
  },
  async addSeats(customerId: string, data: { label?: string; count?: number }) {
    const res = await fetch(`${BASE}/partner/customers/${customerId}/seats`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateSeat(customerId: string, seatId: string, data: { status?: string; label?: string }) {
    const res = await fetch(`${BASE}/partner/customers/${customerId}/seats/${seatId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteSeat(customerId: string, seatId: string) {
    await fetch(`${BASE}/partner/customers/${customerId}/seats/${seatId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  // Coach-Ready-Plan Phase 8: eigene nutzungsbasierte Organization (nur fuer
  // ueber /coach/register angelegte Partner vorhanden — 404 bei Systemhaus-
  // Partnern aus dem alten Sitzplatz-Modell ist dort korrekt und erwartet).
  async getOrganization() {
    const res = await fetch(`${BASE}/partner/organization`, { headers: authHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Organization konnte nicht geladen werden.");
    return res.json();
  },
  async updateOrganization(data: { monthlyPrice: number }) {
    const res = await fetch(`${BASE}/partner/organization`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fehler"); }
    return res.json();
  },
  async organizationCheckout(data: { successUrl: string; cancelUrl: string }) {
    const res = await fetch(`${BASE}/partner/organization/checkout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Fehler"); }
    return res.json();
  },
};
