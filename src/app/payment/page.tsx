import { redirect } from "next/navigation";
import PaymentFlow from "@/components/payment-flow";
import { createAdminClient } from "@/lib/supabase-admin";
import { getParticipantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const userId = await getParticipantId();
  if (!userId) redirect("/");
  const { data: user } = await createAdminClient().from("users").select("email_verified, empowerment_type, virtual_account_number, virtual_account_bank, virtual_account_name, payment_status").eq("id", userId).maybeSingle();
  if (!user?.email_verified) redirect("/");
  if (!user.empowerment_type) redirect("/choose");
  if (user.payment_status === "paid") redirect("/success");
  const account = user.virtual_account_number ? {
    account_number: user.virtual_account_number,
    bank_name: user.virtual_account_bank ?? "Bank",
    account_name: user.virtual_account_name ?? "",
  } : null;
  return <PaymentFlow initialAccount={account} />;
}
