"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Verification failed.");
      router.push("/choose");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return <main className="page-grid flex min-h-screen items-center justify-center px-4 py-10"><section className="reveal w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_60px_rgba(24,35,33,.06)] sm:p-8">
    <a href="/" className="mb-9 inline-flex items-center gap-2 text-sm font-medium text-[#64736c]"><ArrowLeft size={16} /> Registration</a>
    <div className="mb-6 grid size-12 place-items-center rounded-xl bg-[#eaf1e9] text-[var(--green)]"><MailCheck size={22} /></div>
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Step 02 / 04</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Check your inbox</h1>
    <p className="mt-3 text-sm leading-6 text-[#718078]">We sent a six-digit verification code to <span className="font-semibold text-[#35453e]">{email}</span>. The code is valid for 10 minutes.</p>
    <form onSubmit={submit} className="mt-7 grid gap-4"><label><span className="field-label">Verification code</span><input className="field h-14 text-center text-xl font-semibold tracking-[.3em]" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /></label>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button disabled={busy || code.length !== 6} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--green)] text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">{busy ? "Checking code..." : <>Verify email <ArrowUpRight size={17} /></>}</button>
    </form><p className="mt-5 text-xs leading-5 text-[#859189]">No email yet? Check your spam folder. Codes expire after 10 minutes.</p>
  </section></main>;
}
