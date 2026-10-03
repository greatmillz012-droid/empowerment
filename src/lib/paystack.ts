import "server-only";

export async function paystackRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const response = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const payload = await response.json() as { status?: boolean; message?: string; data?: T };
  if (!response.ok || !payload.status || payload.data === undefined) {
    throw new Error(payload.message ?? "Paystack request failed.");
  }
  return payload.data;
}