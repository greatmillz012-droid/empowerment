import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { getParticipantId } from "@/lib/session";
import { paystackRequest } from "@/lib/paystack";

export const dynamic = "force-dynamic";
const accountSchema = z.object({ account_number: z.string().min(6), account_name: z.string().min(1), bank: z.object({ name: z.string().optional() }).optional(), bank_name: z.string().optional() });

export async function GET() {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  const { data, error } = await createAdminClient().from("users").select("virtual_account_number, virtual_account_bank, virtual_account_name, payment_status").eq("id", userId).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load payment details." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  const supabase = createAdminClient();
  try {
    const { data: user, error: userError } = await supabase.from("users").select("id, full_name, email, phone, email_verified, empowerment_type, paystack_customer_code, virtual_account_number, virtual_account_bank, virtual_account_name, payment_status").eq("id", userId).maybeSingle();
    if (userError) throw userError;
    if (!user?.email_verified || !user.empowerment_type) return NextResponse.json({ error: "Complete your registration details first." }, { status: 403 });
    if (user.payment_status === "paid") return NextResponse.json({ error: "This registration is already paid." }, { status: 409 });
    if (user.virtual_account_number) return NextResponse.json({ account_number: user.virtual_account_number, bank_name: user.virtual_account_bank, account_name: user.virtual_account_name });

    let customerCode = user.paystack_customer_code;
    if (!customerCode) {
      const names = user.full_name.trim().split(/\s+/);
      const customer = await paystackRequest<{ customer_code: string }>("/customer", "POST", {
        email: user.email, first_name: names[0], last_name: names.slice(1).join(" ") || names[0], phone: user.phone,
        metadata: { user_id: user.id },
      });
      customerCode = customer.customer_code;
      const { error } = await supabase.from("users").update({ paystack_customer_code: customerCode }).eq("id", user.id).is("paystack_customer_code", null);
      if (error) throw error;
      const { data: current } = await supabase.from("users").select("paystack_customer_code, virtual_account_number, virtual_account_bank, virtual_account_name").eq("id", user.id).single();
      if (current?.virtual_account_number) return NextResponse.json({ account_number: current.virtual_account_number, bank_name: current.virtual_account_bank, account_name: current.virtual_account_name });
      customerCode = current?.paystack_customer_code ?? customerCode;
    }

    const preferredBank = process.env.PAYSTACK_PREFERRED_BANK;
    const account = await paystackRequest<unknown>("/dedicated_account", "POST", { customer: customerCode, ...(preferredBank ? { preferred_bank: preferredBank } : {}) });
    const parsed = accountSchema.safeParse(account);
    if (!parsed.success) throw new Error("Paystack returned incomplete virtual account details.");
    const accountNumber = parsed.data.account_number;
    const bankName = parsed.data.bank?.name ?? parsed.data.bank_name ?? "Bank";
    const accountName = parsed.data.account_name;
    const { data: savedAccount, error: saveError } = await supabase.from("users").update({
      virtual_account_number: accountNumber, virtual_account_bank: bankName, virtual_account_name: accountName,
    }).eq("id", user.id).is("virtual_account_number", null).select("virtual_account_number, virtual_account_bank, virtual_account_name").maybeSingle();
    if (saveError) {
      const { data: saved } = await supabase.from("users").select("virtual_account_number, virtual_account_bank, virtual_account_name").eq("id", user.id).maybeSingle();
      if (!saved?.virtual_account_number) throw new Error("The account could not be safely assigned to this registration.");
      return NextResponse.json({ account_number: saved.virtual_account_number, bank_name: saved.virtual_account_bank, account_name: saved.virtual_account_name });
    }
    if (savedAccount?.virtual_account_number) return NextResponse.json({ account_number: savedAccount.virtual_account_number, bank_name: savedAccount.virtual_account_bank, account_name: savedAccount.virtual_account_name });
    const { data: saved } = await supabase.from("users").select("virtual_account_number, virtual_account_bank, virtual_account_name").eq("id", user.id).maybeSingle();
    if (!saved?.virtual_account_number) throw new Error("The account could not be safely assigned to this registration.");
    return NextResponse.json({ account_number: saved.virtual_account_number, bank_name: saved.virtual_account_bank, account_name: saved.virtual_account_name });
  } catch (error) {
    console.error("Dedicated account assignment failed", error);
    return NextResponse.json({ error: "A transfer account could not be created. Please try again or contact support." }, { status: 502 });
  }
}
