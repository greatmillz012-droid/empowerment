import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";
import { paystackRequest } from "@/lib/paystack";

export const dynamic = "force-dynamic";
const accountSchema = z.object({
  account_number: z.string().min(6),
  account_name: z.string().min(1),
  bank: z.object({ name: z.string().optional() }).optional(),
  bank_name: z.string().optional(),
});

export async function GET() {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  const [data] = await getDb()`select virtual_account_number, virtual_account_bank, virtual_account_name, payment_status from users where id = ${userId} limit 1`;
  if (!data) return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  const sql = getDb();
  try {
    const [user] = await sql`select id, full_name, email, phone, email_verified, empowerment_type, paystack_customer_code, virtual_account_number, virtual_account_bank, virtual_account_name, payment_status from users where id = ${userId} limit 1`;
    if (!user?.email_verified || !user.empowerment_type) return NextResponse.json({ error: "Complete your registration details first." }, { status: 403 });
    if (user.payment_status === "paid") return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    if (user.virtual_account_number) return NextResponse.json({ account_number: user.virtual_account_number, bank_name: user.virtual_account_bank, account_name: user.virtual_account_name });

    let customerCode = user.paystack_customer_code;
    if (!customerCode) {
      const names = user.full_name.trim().split(/\s+/);
      const customer = await paystackRequest<{ customer_code?: string }>("/customer", "POST", {
        email: user.email,
        first_name: names[0],
        last_name: names.slice(1).join(" ") || names[0],
        phone: user.phone,
      });
      if (!customer.customer_code) throw new Error("Paystack did not return a customer code.");
      const [assigned] = await sql`update users set paystack_customer_code = ${customer.customer_code}
        where id = ${user.id} and paystack_customer_code is null returning paystack_customer_code`;
      if (assigned) customerCode = assigned.paystack_customer_code;
      else {
        const [current] = await sql`select paystack_customer_code, virtual_account_number, virtual_account_bank, virtual_account_name from users where id = ${user.id} limit 1`;
        if (current?.virtual_account_number) return NextResponse.json({ account_number: current.virtual_account_number, bank_name: current.virtual_account_bank, account_name: current.virtual_account_name });
        customerCode = current?.paystack_customer_code;
      }
    }
    if (!customerCode) throw new Error("Could not assign a Paystack customer code.");

    const preferredBank = process.env.PAYSTACK_PREFERRED_BANK;
    const account = await paystackRequest<unknown>("/dedicated_account", "POST", {
      customer: customerCode,
      ...(preferredBank ? { preferred_bank: preferredBank } : {}),
    });
    const parsed = accountSchema.safeParse(account);
    if (!parsed.success) throw new Error("Paystack returned incomplete dedicated account details.");
    const accountNumber = parsed.data.account_number;
    const bankName = parsed.data.bank?.name ?? parsed.data.bank_name ?? "Bank";
    const accountName = parsed.data.account_name;
    const [savedAccount] = await sql`update users set virtual_account_number = ${accountNumber}, virtual_account_bank = ${bankName}, virtual_account_name = ${accountName}
      where id = ${user.id} and virtual_account_number is null
      returning virtual_account_number, virtual_account_bank, virtual_account_name`;
    if (savedAccount?.virtual_account_number) return NextResponse.json({ account_number: savedAccount.virtual_account_number, bank_name: savedAccount.virtual_account_bank, account_name: savedAccount.virtual_account_name });
    const [saved] = await sql`select virtual_account_number, virtual_account_bank, virtual_account_name from users where id = ${user.id} limit 1`;
    if (!saved?.virtual_account_number) throw new Error("The account could not be safely assigned to this registration.");
    return NextResponse.json({ account_number: saved.virtual_account_number, bank_name: saved.virtual_account_bank, account_name: saved.virtual_account_name });
  } catch (error) {
    console.error("Paystack dedicated account assignment failed", error);
    return NextResponse.json({ error: "A transfer account could not be created. Please try again or contact support." }, { status: 502 });
  }
}
