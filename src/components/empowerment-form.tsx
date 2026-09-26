"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, GraduationCap, Lightbulb, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { empowermentTypes } from "@/lib/empowerment-types";

const icons = [GraduationCap, BriefcaseBusiness, UsersRound, Lightbulb];

export default function EmpowermentForm({ initialValue }: { initialValue: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/empowerment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empowermentType: selected }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save your choice.");
      router.push("/payment");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return <main className="page-grid min-h-screen px-4 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
    <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#64736c]"><ArrowLeft size={16} /> Exit registration</a>
    <div className="mt-10"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Step 03 / 04</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Choose your direction.</h1><p className="mt-3 text-[#718078]">Select the area that best matches what you want to work toward.</p></div>
    <form onSubmit={submit} className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2">{empowermentTypes.map((option, index) => { const Icon = icons[index % icons.length]; return <button type="button" key={option.value} aria-pressed={selected === option.value} onClick={() => setSelected(option.value)} className={`flex min-h-32 items-start gap-4 rounded-xl border p-5 text-left transition ${selected === option.value ? "border-[var(--green)] bg-[#edf4ed] ring-2 ring-[#176b5520]" : "border-[var(--line)] bg-white hover:border-[#8ba69a]"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-lg ${selected === option.value ? "bg-[var(--green)] text-white" : "bg-[#edf1ec] text-[var(--green)]"}`}><Icon size={19} /></span><span><span className="block font-semibold">{option.label}</span><span className="mt-1 block text-sm leading-5 text-[#75827b]">{option.detail}</span></span></button>; })}</div>
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button disabled={!selected || busy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--green)] text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving choice..." : <>Continue to payment <ArrowUpRight size={17} /></>}</button>
    </form>
  </div></main>;
}
