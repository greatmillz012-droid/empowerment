import "server-only";

const apiBase = "https://api.flutterwave.com/v3";

export async function flutterwaveRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) throw new Error("FLW_SECRET_KEY is not configured.");
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const payload = await response.json() as { status?: string; message?: string; data?: T };
  if (!response.ok || payload.status !== "success" || payload.data === undefined) {
    throw new Error(payload.message ?? "Flutterwave request failed.");
  }
  return payload.data;
}
