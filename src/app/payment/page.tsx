import { redirect } from "next/navigation";
import PaymentFlow from "@/components/payment-flow";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const userId = await getParticipantId();
  if (!userId) redirect("/");
  const [user] = await getDb()`select email_verified, empowerment_type, payment_status from users where id = ${userId} limit 1`;
  if (!user?.email_verified) redirect("/");
  if (!user.empowerment_type) redirect("/choose");
  if (user.payment_status === "paid") redirect("/success");
  return <PaymentFlow />;
}
