const BASE =
  process.env.NEXT_PUBLIC_PARTNER_API_URL ?? "https://license.agent-hub.app";

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
};
