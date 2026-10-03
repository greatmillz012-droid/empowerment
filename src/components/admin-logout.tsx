"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[#56665e] hover:border-[#aab8ae]"><LogOut size={15} /> Sign out</button>;
}
