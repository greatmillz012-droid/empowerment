"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Copy, Landmark, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type Account = { account_number: string; bank_name: string; account_name: string };

export default function PaymentFlow({ initialAccount }: { initialAccount: Account | null }) {
  const router = useRouter();
  const [account, setAccount] = useState(initialAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  async function loadAccount(create: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(create ? "/api/payment/account" : "/api/payment/account", {
        method: create ? "POST" : "GET", cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load account details.");
      if (result.payment_status === "paid") {
        setPaid(true);
        router.replace("/success");
        router.refresh();
      }
      if (result.account_number) setAccount({ account_number: result.account_number, bank_name: result.bank_name ?? result.virtual_account_bank, account_name: result.account_name ?? result.virtual_account_name });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copyAccount() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the account number. Please select and copy it manually.");
    }
  }

  return <main className="page-grid min-h-screen px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
    <a href="/choose" className="inline-flex items-center gap-2 text-sm font-medium text-[#64736c]"><ArrowLeft size={16} /> Change selection</a>
    <div className="mt-10"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Step 04 / 04</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Complete your registration.</h1><p className="mt-3 text-[#718078]">Use your unique transfer details below. Your registration is confirmed after your transfer is received.</p></div>
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_60px_rgba(24,35,33,.06)]">
      <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[#f8faf6] p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-[#e8f0e7] text-[var(--green)]"><Landmark size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-[#829088]">Form purchase</p><p className="mt-1 text-2xl font-semibold">₦2,000</p></div><span className="ml-auto rounded-full bg-[#edf4ed] px-3 py-1 text-xs font-semibold text-[var(--green)]">NGN</span></div>
      <div className="p-5 sm:p-7"><p className="font-semibold">This fee is for form purchase.</p><p className="mt-1 text-sm text-[#718078]">Transfer exactly ₦2,000 to the account above.</p>
        {paid ? <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"><Check size={18} /> Payment received. Your registration is complete.</div> : account ? <div className="mt-6 grid gap-4 rounded-xl bg-[#f6f8f4] p-4 sm:grid-cols-2 sm:p-5"><div><p className="field-label">Bank name</p><p className="font-semibold">{account.bank_name}</p></div><div><p className="field-label">Account name</p><p className="font-semibold">{account.account_name}</p></div><div className="sm:col-span-2"><p className="field-label">Unique account number</p><div className="flex items-center gap-3"><p className="min-w-0 flex-1 break-all text-2xl font-semibold tracking-wider sm:text-3xl">{account.account_number}</p><button onClick={copyAccount} type="button" title="Copy account number" aria-label="Copy account number" className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-white text-[#50635a] hover:border-[var(--green)]">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></div></div> : <button onClick={() => loadAccount(true)} disabled={busy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--green)] text-sm font-semibold text-white disabled:opacity-50">{busy ? "Preparing secure account..." : <>Generate my transfer account <ArrowUpRight size={17} /></>}</button>}
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        {account && !paid && <button type="button" onClick={() => loadAccount(false)} disabled={busy} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--green)] disabled:opacity-50"><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> I have transferred, check payment status</button>}
        <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[#829088]">Your account number is assigned to your registration only. Transfers of any amount other than exactly ₦2,000 will not complete the registration.</p>
      </div>
    </section>
  </div></main>;
}
