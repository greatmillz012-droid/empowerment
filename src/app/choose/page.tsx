import { redirect } from "next/navigation";
import EmpowermentForm from "@/components/empowerment-form";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ChoosePage() {
  const userId = await getParticipantId();
  if (!userId) redirect("/");
  const [user] = await getDb()`select email_verified, empowerment_type from users where id = ${userId} limit 1`;
  if (!user?.email_verified) redirect("/");
  if (user.empowerment_type) redirect("/payment");
  return <EmpowermentForm initialValue={user.empowerment_type} />;
}
