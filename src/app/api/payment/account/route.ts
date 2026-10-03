import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";
import { flutterwaveRequest } from "@/lib/flutterwave";

export const dynamic = "force-dynamic";
const accountSchema = z.object({ account_number: z.string().min(6), account_name: z.string().optional(), bank_name: z.string().min(1) });

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
    const [user] = await sql`select id, full_name, email, phone, email_verified, empowerment_type, flutterwave_tx_ref, virtual_account_number, virtual_account_bank, virtual_account_name, payment_status from users where id = ${userId} limit 1`;
    if (!user?.email_verified || !user.empowerment_type) return NextResponse.json({ error: "Complete your registration details first." }, { status: 403 });
    if (user.payment_status === "paid") return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    if (user.virtual_account_number) return NextResponse.json({ account_number: user.virtual_account_number, bank_name: user.virtual_account_bank, account_name: user.virtual_account_name });

    let txRef = user.flutterwave_tx_ref;
    if (!txRef) {
      const candidate = `NG-${user.id}-${randomUUID()}`;
      const [assigned] = await sql`update users set flutterwave_tx_ref = ${candidate}
        where id = ${user.id} and flutterwave_tx_ref is null returning flutterwave_tx_ref`;
      if (assigned) txRef = assigned.flutterwave_tx_ref;
      else {
        const [current] = await sql`select flutterwave_tx_ref, virtual_account_number, virtual_account_bank, virtual_account_name from users where id = ${user.id} limit 1`;
        if (current?.virtual_account_number) return NextResponse.json({ account_number: current.virtual_account_number, bank_name: current.virtual_account_bank, account_name: current.virtual_account_name });
        txRef = current?.flutterwave_tx_ref;
      }
    }
    if (!txRef) throw new Error("Could not reserve a Flutterwave reference.");

    const names = user.full_name.trim().split(/\s+/);
    const account = await flutterwaveRequest<unknown>("/virtual-account-numbers", "POST", {
      email: user.email,
      is_permanent: false,
      tx_ref: txRef,
      amount: 2000,
      currency: "NGN",
      phonenumber: user.phone,
      firstname: names[0],
      lastname: names.slice(1).join(" ") || names[0],
      narration: "NextGen programme form purchase",
    });
    const parsed = accountSchema.safeParse(account);
    if (!parsed.success) throw new Error("Flutterwave returned incomplete virtual account details.");
    const accountNumber = parsed.data.account_number;
    const bankName = parsed.data.bank_name;
    const accountName = parsed.data.account_name ?? user.full_name;
    const [savedAccount] = await sql`update users set virtual_account_number = ${accountNumber}, virtual_account_bank = ${bankName}, virtual_account_name = ${accountName}
      where id = ${user.id} and virtual_account_number is null
      returning virtual_account_number, virtual_account_bank, virtual_account_name`;
    if (savedAccount?.virtual_account_number) return NextResponse.json({ account_number: savedAccount.virtual_account_number, bank_name: savedAccount.virtual_account_bank, account_name: savedAccount.virtual_account_name });
    const [saved] = await sql`select virtual_account_number, virtual_account_bank, virtual_account_name from users where id = ${user.id} limit 1`;
    if (!saved?.virtual_account_number) throw new Error("The account could not be safely assigned to this registration.");
    return NextResponse.json({ account_number: saved.virtual_account_number, bank_name: saved.virtual_account_bank, account_name: saved.virtual_account_name });
  } catch (error) {
    console.error("Dedicated account assignment failed", error);
    return NextResponse.json({ error: "A transfer account could not be created. Please try again or contact support." }, { status: 502 });
  }
}
