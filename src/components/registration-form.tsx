"use client";

import { useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const states = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

export default function RegistrationForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResumeEmail("");
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Registration failed.");
      if (result.resume) {
        setResumeEmail(result.email ?? "");
        setBusy(false);
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(result.email)}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="page-grid min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <a href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--green)] text-[var(--lime)]"><Sparkles size={20} /></span>
            <span className="text-lg">nextgen<span className="text-[var(--green)]">.</span></span>
          </a>
          <div className="text-right text-xs font-medium uppercase tracking-widest text-[#77847e]">2027 Programme <span className="ml-2 text-[var(--green)]">● Open</span></div>
        </header>
        <div className="grid gap-10 py-9 md:grid-cols-[.9fr_1.1fr] md:gap-16 md:py-14">
          <section className="reveal flex flex-col justify-between">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--green)]"><span className="size-1.5 rounded-full bg-[var(--green)]" /> Applications now open</p>
              <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Make room for your <span className="text-[var(--green)]">next move.</span></h1>
              <p className="mt-6 max-w-md text-base leading-7 text-[#61716b]">A practical empowerment programme for young people ready to build skills, strengthen ideas and shape what comes next.</p>
              <div className="mt-9 grid max-w-md grid-cols-3 border-y border-[var(--line)] py-5">{["Skills", "Enterprise", "Guidance"].map((item, index) => <div key={item} className={index > 0 ? "border-l border-[var(--line)] pl-4" : ""}><span className="block text-xs text-[#82908a]">0{index + 1}</span><span className="mt-1 block text-sm font-semibold">{item}</span></div>)}</div>
            </div>

            <div className="mt-10 rounded-[28px] border border-[var(--line)] bg-[radial-gradient(circle_at_top,_rgba(214,240,108,0.4),_transparent_40%),linear-gradient(135deg,_#f8faf4,_#edf5ec_40%,_#f1f7ef)] p-5 shadow-[0_20px_60px_rgba(24,35,33,.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#728078]">Success stories</p>
                  <p className="mt-2 text-xl font-semibold text-[#24352e]">From ambition to action.</p>
                </div>
                <div className="grid size-11 place-items-center rounded-full bg-[var(--green)] text-[var(--lime)]"><ArrowUpRight size={18} /></div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[110px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/60">
                  <div className="h-28 bg-[linear-gradient(135deg,#dfead0,#b9ccad_45%,#8da48c)]" />
                </div>
                <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6d7d73]">Featured participant</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#24352e]">Grace A.</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d6f67]">“The programme gave me practical exposure, strong mentorship, and the confidence to start my own business. I’m now in a stronger position to build my future.”</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Skills unlocked", value: "12+" },
                  { label: "Jobs secured", value: "87%" },
                  { label: "Mentorship hours", value: "180" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/70 p-3 text-center">
                    <div className="text-xl font-semibold text-[var(--green)]">{item.value}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[.16em] text-[#77847e]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="reveal rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_60px_rgba(24,35,33,.06)] sm:p-8" style={{ animationDelay: "80ms" }}>
            <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Step 01 / 04</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Start your registration</h2><p className="mt-1 text-sm text-[#77847e]">Your details stay private and secure.</p></div><span className="shrink-0 rounded-md bg-[#eff3ed] px-2.5 py-1.5 text-xs font-semibold text-[#627168]">Free to apply</span></div>
            <form onSubmit={submit} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="field-label">Full name</span><input className="field" name="fullName" autoComplete="name" placeholder="As shown on your ID" required minLength={2} maxLength={120} /></label>
              <label className="sm:col-span-2"><span className="field-label">Email address</span><input className="field" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
              <label><span className="field-label">Phone number</span><input className="field" type="tel" name="phone" autoComplete="tel" placeholder="+234 800 000 0000" required minLength={7} maxLength={25} /></label>
              <label><span className="field-label">Gender</span><span className="select-wrap"><select className="field appearance-none" name="gender" defaultValue="" required><option value="" disabled>Select one</option><option value="female">Female</option><option value="male">Male</option><option value="prefer-not-to-say">Prefer not to say</option><option value="self-describe">Self-describe</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#819089]" size={16} /></span></label>
              <label className="sm:col-span-2"><span className="field-label">State of residence</span><span className="select-wrap"><select className="field appearance-none" name="state" defaultValue="" required><option value="" disabled>Select your state</option>{states.map((state) => <option key={state}>{state}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#819089]" size={16} /></span></label>
              {error && <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
              {resumeEmail ? <div className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[#edf7f0] p-4">
                <p className="text-sm font-semibold text-[#1d4035]">Your registration is still in progress.</p>
                <p className="mt-1 text-sm text-[#557066]">We found an unfinished application for {resumeEmail}. You can continue from where you left off.</p>
                <button type="button" onClick={() => router.push("/choose")} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--green)] px-5 text-sm font-semibold text-white transition hover:bg-[#105942]">
                  Resume registration <ArrowUpRight size={17} />
                </button>
              </div> : <button disabled={busy} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--green)] px-5 text-sm font-semibold text-white transition hover:bg-[#105942] disabled:cursor-wait disabled:opacity-60 sm:col-span-2">{busy ? "Submitting..." : <>Continue to email verification <ArrowUpRight size={17} /></>}</button>}
            </form>
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#77847e]"><Check className="mt-0.5 shrink-0 text-[var(--green)]" size={14} /> By continuing, you confirm these details are accurate and agree to receive programme updates by email.</p>
          </section>
        </div>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-4 text-xs text-[#819089]"><span>NextGen Youth Empowerment Programme</span><span>Nigeria · Applications for 2027</span></footer>
      </div>
    </main>
  );
}
