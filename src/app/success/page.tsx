import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SuccessPage() {
  const userId = await getParticipantId();
  if (!userId) redirect("/");
  const [user] = await getDb()`select payment_status from users where id = ${userId} limit 1`;
  if (user?.payment_status !== "paid") redirect("/payment");
  return <main className="page-grid flex min-h-screen items-center justify-center px-4 py-10"><section className="reveal w-full max-w-xl rounded-2xl border border-[var(--line)] bg-white p-7 text-center shadow-[0_18px_60px_rgba(24,35,33,.06)] sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e7f3e7] text-[var(--green)]"><Check size={28} /></span><p className="mt-7 text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Registration confirmed</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">You’re all set.</h1><p className="mt-4 text-base leading-7 text-[#64736c]">Registration successful! Please always check your email for updates. The empowerment program will commence in September 2027.</p></section></main>;
}
