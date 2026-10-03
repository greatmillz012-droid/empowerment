import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { sendPaymentConfirmation } from "@/lib/email";
import { paystackRequest } from "@/lib/paystack";

export const runtime = "nodejs";

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true });

    const payment = await paystackRequest<{
      status: string;
      amount: number;
      currency: string;
      reference: string;
      customer?: { customer_code?: string };
    }>(`/transaction/verify/${encodeURIComponent(event.data.reference)}`, "GET");
    if (payment.status !== "success" || payment.amount !== 200000 || payment.currency !== "NGN" || payment.reference !== event.data.reference || !payment.customer?.customer_code) {
      return NextResponse.json({ received: true });
    }

    const sql = getDb();
    const [user] = await sql`select id, email, full_name, payment_status, payment_confirmation_sent_at
      from users where paystack_customer_code = ${payment.customer.customer_code} limit 1`;
    if (!user) return NextResponse.json({ received: true });
    if (user.payment_status !== "paid") {
      await sql`update users set payment_status = 'paid', payment_reference = ${payment.reference}
        where id = ${user.id} and payment_status = 'unpaid'`;
    }
    if (!user.payment_confirmation_sent_at) {
      try {
        await sendPaymentConfirmation(user.email, user.full_name);
        await sql`update users set payment_confirmation_sent_at = ${new Date().toISOString()}
          where id = ${user.id}`;
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