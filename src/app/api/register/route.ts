import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { createOtp, hashOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(25),
  gender: z.enum(["female", "male", "prefer-not-to-say", "self-describe"]),
  state: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check the details and try again." }, { status: 400 });
    const { fullName, email: rawEmail, phone, gender, state } = parsed.data;
    const email = rawEmail.toLowerCase();
    const supabase = createAdminClient();
    const existing = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return NextResponse.json({ error: "An account with this email already exists. Contact support to continue." }, { status: 409 });
    const { data: user, error: insertError } = await supabase.from("users").insert({ full_name: fullName, email, phone, gender, state, payment_status: "unpaid" }).select("id").single();
    if (insertError) throw insertError;
    const code = createOtp();
    const { error: otpError } = await supabase.from("otps").insert({ user_id: user.id, otp_code: hashOtp(code), expires_at: new Date(Date.now() + 10 * 60_000).toISOString(), used: false });
    if (otpError) {
      await supabase.from("users").delete().eq("id", user.id);
      throw otpError;
    }
    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      await supabase.from("users").delete().eq("id", user.id);
      throw error;
    }
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Registration could not be completed. Please try again shortly." }, { status: 500 });
  }
}
