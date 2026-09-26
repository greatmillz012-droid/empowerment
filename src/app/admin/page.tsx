import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import AdminLogout from "@/components/admin-logout";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { empowermentLabel } from "@/lib/empowerment-types";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.app_metadata.role !== "admin") redirect("/admin/login");

  const status = searchParams.status === "paid" || searchParams.status === "unpaid" ? searchParams.status : "all";
  let query = createAdminClient().from("users").select("id, full_name, email, phone, empowerment_type, payment_status, created_at").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("payment_status", status);
  const { data: users, error } = await query;

  return <main className="min-h-screen bg-[#f5f6f2] px-4 py-7 sm:px-8"><div className="mx-auto max-w-7xl">
    <header className="flex items-center justify-between border-b border-[var(--line)] pb-5"><a href="/" className="font-bold tracking-tight">nextgen<span className="text-[var(--green)]">.</span> <span className="ml-2 text-xs font-medium uppercase tracking-widest text-[#839088]">Registry</span></a><AdminLogout /></header>
    <div className="mt-9 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Programme administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Registrations</h1></div><div className="inline-flex items-center gap-2 text-sm text-[#718078]"><UsersRound size={17} /> {users?.length ?? 0} records</div></div>
    <nav aria-label="Payment status filter" className="mt-7 flex gap-2 border-b border-[var(--line)]">{[{ value: "all", label: "All" }, { value: "paid", label: "Paid" }, { value: "unpaid", label: "Unpaid" }].map((filter) => <a key={filter.value} href={filter.value === "all" ? "/admin" : `/admin?status=${filter.value}`} className={`border-b-2 px-3 py-2.5 text-sm font-medium ${status === filter.value ? "border-[var(--green)] text-[var(--green)]" : "border-transparent text-[#718078] hover:text-[#24352e]"}`}>{filter.label}</a>)}</nav>
    {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load registrations.</p> : <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f7f9f5] text-xs uppercase tracking-wider text-[#718078]"><tr><th className="px-4 py-3 font-semibold">Full name</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Empowerment type</th><th className="px-4 py-3 font-semibold">Payment</th><th className="px-4 py-3 font-semibold">Date registered</th></tr></thead><tbody className="divide-y divide-[#edf0ec]">{users?.map((person) => <tr key={person.id} className="hover:bg-[#fbfcfa]"><td className="px-4 py-3.5 font-medium text-[#24352e]">{person.full_name}</td><td className="px-4 py-3.5 text-[#64736c]">{person.email}</td><td className="px-4 py-3.5 text-[#64736c]">{person.phone}</td><td className="px-4 py-3.5 text-[#64736c]">{empowermentLabel(person.empowerment_type)}</td><td className="px-4 py-3.5"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${person.payment_status === "paid" ? "bg-[#e8f4e9] text-[#176b55]" : "bg-[#f1f2ee] text-[#69766f]"}`}>{person.payment_status}</span></td><td className="px-4 py-3.5 text-[#64736c]">{new Date(person.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>)}</tbody></table>{!users?.length && <p className="p-8 text-center text-sm text-[#718078]">No registrations in this view.</p>}</div>}
  </div></main>;
}
