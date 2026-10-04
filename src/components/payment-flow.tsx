"use client";

import { ArrowLeft, ArrowUpRight, Check, Landmark } from "lucide-react";

const defaultPaystackCheckoutUrl = "https://paystack.shop/pay/lblkx6r0hg";

export default function PaymentFlow() {
  const paystackUrl = process.env.NEXT_PUBLIC_PAYSTACK_PAYMENT_URL || defaultPaystackCheckoutUrl;

  return <main className="page-grid min-h-screen px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
    <a href="/choose" className="inline-flex items-center gap-2 text-sm font-medium text-[#64736c]"><ArrowLeft size={16} /> Change selection</a>
    <div className="mt-10"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Step 04 / 04</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Complete your registration.</h1><p className="mt-3 text-[#718078]">Use the secure checkout link below to pay the ₦2,000 registration fee.</p></div>
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_60px_rgba(24,35,33,.06)]">
      <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[#f8faf6] p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-[#e8f0e7] text-[var(--green)]"><Landmark size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-[#829088]">Form purchase</p><p className="mt-1 text-2xl font-semibold">₦2,000</p></div><span className="ml-auto rounded-full bg-[#edf4ed] px-3 py-1 text-xs font-semibold text-[var(--green)]">NGN</span></div>
      <div className="p-5 sm:p-7">
        <p className="font-semibold">This fee is for form purchase.</p>
        <p className="mt-1 text-sm text-[#718078]">Pay securely through the shared Paystack checkout link below.</p>

        <a href={paystackUrl} target="_blank" rel="noreferrer" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--green)] text-sm font-semibold text-white shadow-sm transition hover:bg-[#145742]">
          Pay with Paystack <ArrowUpRight size={17} />
        </a>

        <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <Check size={18} /> One checkout link is used for all registrations.
        </div>

        <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[#829088]">After successful payment, your registration is confirmed and you will be redirected to the completion status in the app.</p>
      </div>
    </section>
  </div></main>;
}
