import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/neon";
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
    const sql = getDb();
    const existing = await sql`select id from users where email = ${email} limit 1`;
    if (existing.length) return NextResponse.json({ error: "An account with this email already exists. Contact support to continue." }, { status: 409 });
    const [user] = await sql`insert into users (full_name, email, phone, gender, state, payment_status)
      values (${fullName}, ${email}, ${phone}, ${gender}, ${state}, 'unpaid') returning id`;
    const code = createOtp();
    try {
      await sql`insert into otps (user_id, otp_code, expires_at)
        values (${user.id}, ${hashOtp(code)}, ${new Date(Date.now() + 10 * 60_000).toISOString()})`;
    } catch (otpError) {
      await sql`delete from users where id = ${user.id}`;
      throw otpError;
    }
    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      await sql`delete from users where id = ${user.id}`;
      throw error;
    }
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Registration could not be completed. Please try again shortly." }, { status: 500 });
  }
}
