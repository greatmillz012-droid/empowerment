import { redirect } from "next/navigation";
import EmpowermentForm from "@/components/empowerment-form";
import { createAdminClient } from "@/lib/supabase-admin";
import { getParticipantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ChoosePage() {
  const userId = await getParticipantId();
  if (!userId) redirect("/");
  const { data: user } = await createAdminClient().from("users").select("email_verified, empowerment_type").eq("id", userId).maybeSingle();
  if (!user?.email_verified) redirect("/");
  if (user.empowerment_type) redirect("/payment");
  return <EmpowermentForm initialValue={user.empowerment_type} />;
}
