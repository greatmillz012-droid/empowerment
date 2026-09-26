"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Supabase is not configured.");
      const client = createBrowserClient(url, key);
      const { error: authError } = await client.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (authError) throw authError;
      router.push("/admin");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return <main className="page-grid flex min-h-screen items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-[0_18px_60px_rgba(24,35,33,.06)] sm:p-8"><div className="mb-6 grid size-12 place-items-center rounded-xl bg-[#e8f0e7] text-[var(--green)]"><LockKeyhole size={21} /></div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">NextGen / Admin</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to the registry</h1><p className="mt-2 text-sm text-[#718078]">Use your authorized Supabase administrator account.</p>
    <form onSubmit={submit} className="mt-7 grid gap-4"><label><span className="field-label">Email</span><input className="field" name="email" type="email" autoComplete="username" required /></label><label><span className="field-label">Password</span><input className="field" name="password" type="password" autoComplete="current-password" required /></label>{error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}<button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--green)] text-sm font-semibold text-white disabled:opacity-50">{busy ? "Signing in..." : <>Sign in <ArrowUpRight size={17} /></>}</button></form>
  </section></main>;
}
