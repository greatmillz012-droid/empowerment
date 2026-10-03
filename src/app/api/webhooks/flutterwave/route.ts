import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { sendPaymentConfirmation } from "@/lib/email";
import { flutterwaveRequest } from "@/lib/flutterwave";

export const runtime = "nodejs";

function validWebhookHash(hash: string | null) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!secretHash || !hash) return false;
  const expected = Buffer.from(secretHash);
  const supplied = Buffer.from(hash);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validWebhookHash(request.headers.get("verif-hash"))) return NextResponse.json({ error: "Invalid webhook hash." }, { status: 401 });
  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { id?: number | string; tx_ref?: string } };
    if (event.event !== "charge.completed") return NextResponse.json({ received: true });
    const payment = event.data;
    if (!payment?.id || !payment.tx_ref) return NextResponse.json({ received: true });
    const transactionId = String(payment.id);
    if (!/^\d+$/.test(transactionId)) return NextResponse.json({ received: true });

    const verification = await flutterwaveRequest<{
      id: number;
      tx_ref: string;
      status: string;
      amount: number;
      currency: string;
      flw_ref?: string;
    }>(`/transactions/${transactionId}/verify`, "GET");
    if (verification.status !== "successful" || verification.amount !== 2000 || verification.currency !== "NGN" || verification.tx_ref !== payment.tx_ref) {
      return NextResponse.json({ received: true });
    }

    const sql = getDb();
    const [user] = await sql`select id, email, full_name, payment_status, payment_confirmation_sent_at
      from users where flutterwave_tx_ref = ${verification.tx_ref} limit 1`;
    if (!user) return NextResponse.json({ received: true });
    if (user.payment_status !== "paid") {
      await sql`update users set payment_status = 'paid', payment_reference = ${verification.flw_ref ?? String(verification.id)}
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
    console.error("Flutterwave webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
