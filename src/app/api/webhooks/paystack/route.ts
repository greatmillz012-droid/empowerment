import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendPaymentConfirmation } from "@/lib/email";

export const runtime = "nodejs";

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const supplied = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return supplied.length === expectedBuffer.length && timingSafeEqual(supplied, expectedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-paystack-signature"))) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { status?: string; amount?: number; currency?: string; reference?: string; customer?: { customer_code?: string } | string; metadata?: { user_id?: string } } };
    if (event.event !== "charge.success") return NextResponse.json({ received: true });
    const payment = event.data;
    if (!payment || payment.status !== "success" || payment.amount !== 200000 || payment.currency !== "NGN" || !payment.reference) return NextResponse.json({ received: true });
    const customerCode = typeof payment.customer === "string" ? payment.customer : payment.customer?.customer_code;
    const supabase = createAdminClient();
    let query = supabase.from("users").select("id, email, full_name, payment_status, payment_confirmation_sent_at");
    query = customerCode ? query.eq("paystack_customer_code", customerCode) : payment.metadata?.user_id ? query.eq("id", payment.metadata.user_id) : query.eq("id", "00000000-0000-0000-0000-000000000000");
    const { data: user, error: lookupError } = await query.maybeSingle();
    if (lookupError) throw lookupError;
    if (!user) return NextResponse.json({ received: true });
    if (user.payment_status !== "paid") {
      const { error } = await supabase.from("users").update({ payment_status: "paid", payment_reference: payment.reference }).eq("id", user.id).eq("payment_status", "unpaid");
      if (error) throw error;
    }
    if (!user.payment_confirmation_sent_at) {
      try {
        await sendPaymentConfirmation(user.email, user.full_name);
        const { error: emailMarkerError } = await supabase.from("users").update({ payment_confirmation_sent_at: new Date().toISOString() }).eq("id", user.id);
        if (emailMarkerError) throw emailMarkerError;
      } catch (emailError) {
        console.error("Payment confirmation email failed", emailError);
        return NextResponse.json({ error: "Payment email delivery will be retried." }, { status: 500 });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
