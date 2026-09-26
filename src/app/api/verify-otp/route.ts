import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { hashOtp } from "@/lib/otp";
import { createParticipantSession } from "@/lib/session";

const schema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code sent to your email." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (userError) throw userError;
    if (!user) return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
    const { data: verified, error } = await supabase.rpc("consume_registration_otp", { p_user_id: user.id, p_otp_hash: hashOtp(parsed.data.code) });
    if (error) throw error;
    if (verified !== user.id) return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
    await createParticipantSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP verification failed", error);
    return NextResponse.json({ error: "Verification could not be completed. Please try again." }, { status: 500 });
  }
}
