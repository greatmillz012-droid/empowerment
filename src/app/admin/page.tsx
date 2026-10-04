import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import AdminLogout from "@/components/admin-logout";
import { getDb } from "@/lib/neon";
import { getAdminEmail } from "@/lib/session";
import { empowermentLabel } from "@/lib/empowerment-types";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  empowerment_type: string | null;
  payment_status: "paid" | "unpaid";
  created_at: string;
};

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail || adminEmail !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) redirect("/admin/login");

  const status = searchParams.status === "paid" || searchParams.status === "unpaid" ? searchParams.status : "all";
  let users: AdminUser[] | undefined;
  let error = "";

  try {
    const sql = getDb();
    const rows = status === "all"
      ? await sql`select id, full_name, email, phone, empowerment_type, payment_status, created_at from users order by created_at desc`
      : await sql`select id, full_name, email, phone, empowerment_type, payment_status, created_at from users where payment_status = ${status} order by created_at desc`;
    users = rows as AdminUser[];
  } catch (dbError) {
    console.error("Admin dashboard DB query failed", dbError);
    error = dbError instanceof Error ? dbError.message : "Could not connect to the database.";
  }

  const totalUsers = users?.length ?? 0;
  const paidUsers = users?.filter((user) => user.payment_status === "paid").length ?? 0;
  const unpaidUsers = users?.filter((user) => user.payment_status === "unpaid").length ?? 0;

  return <main className="min-h-screen bg-[#f5f6f2] px-4 py-7 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <a href="/" className="font-bold tracking-tight">nextgen<span className="text-[var(--green)]">.</span> <span className="ml-2 text-xs font-medium uppercase tracking-widest text-[#839088]">Registry</span></a>
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[#24352e] shadow-sm transition hover:border-[var(--green)] hover:text-[var(--green)]">Resumption</button>
          <AdminLogout />
        </div>
      </header>

      <div className="mt-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--green)]">Programme administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Registrations</h1>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-[#718078]"><UsersRound size={17} /> {totalUsers} records</div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(24,35,33,.03)]">
          <p className="text-xs uppercase tracking-[.16em] text-[#7a8b81]">Total</p>
          <p className="mt-3 text-3xl font-semibold text-[#24352e]">{totalUsers}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(24,35,33,.03)]">
          <p className="text-xs uppercase tracking-[.16em] text-[#7a8b81]">Paid</p>
          <p className="mt-3 text-3xl font-semibold text-[#176b55]">{paidUsers}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(24,35,33,.03)]">
          <p className="text-xs uppercase tracking-[.16em] text-[#7a8b81]">Unpaid</p>
          <p className="mt-3 text-3xl font-semibold text-[#69766f]">{unpaidUsers}</p>
        </div>
      </div>

      <nav aria-label="Payment status filter" className="mt-7 flex gap-2 border-b border-[var(--line)]">
        {[{ value: "all", label: "All" }, { value: "paid", label: "Paid" }, { value: "unpaid", label: "Unpaid" }].map((filter) => <a key={filter.value} href={filter.value === "all" ? "/admin" : `/admin?status=${filter.value}`} className={`border-b-2 px-3 py-2.5 text-sm font-medium ${status === filter.value ? "border-[var(--green)] text-[var(--green)]" : "border-transparent text-[#718078] hover:text-[#24352e]"}`}>{filter.label}</a>)}
      </nav>

      {error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load registrations: {error}</p> : <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f7f9f5] text-xs uppercase tracking-wider text-[#718078]"><tr><th className="px-4 py-3 font-semibold">Full name</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Empowerment type</th><th className="px-4 py-3 font-semibold">Payment</th><th className="px-4 py-3 font-semibold">Date registered</th></tr></thead><tbody className="divide-y divide-[#edf0ec]">{users?.map((person) => <tr key={person.id} className="hover:bg-[#fbfcfa]"><td className="px-4 py-3.5 font-medium text-[#24352e]">{person.full_name}</td><td className="px-4 py-3.5 text-[#64736c]">{person.email}</td><td className="px-4 py-3.5 text-[#64736c]">{person.phone}</td><td className="px-4 py-3.5 text-[#64736c]">{empowermentLabel(person.empowerment_type)}</td><td className="px-4 py-3.5"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${person.payment_status === "paid" ? "bg-[#e8f4e9] text-[#176b55]" : "bg-[#f1f2ee] text-[#69766f]"}`}>{person.payment_status}</span></td><td className="px-4 py-3.5 text-[#64736c]">{new Date(person.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</td></tr>)}</tbody></table>{!users?.length && <p className="p-8 text-center text-sm text-[#718078]">No registrations in this view.</p>}</div>}
    </div>
  </main>;
}
