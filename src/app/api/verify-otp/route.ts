import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/neon";
import { hashOtp } from "@/lib/otp";
import { createParticipantSession } from "@/lib/session";

const schema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code sent to your email." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    const sql = getDb();
    const [user] = await sql`select id from users where email = ${email} limit 1`;
    if (!user) return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
    const [result] = await sql`select consume_registration_otp(${user.id}::uuid, ${hashOtp(parsed.data.code)}::text) as verified_user_id`;
    if (result?.verified_user_id !== user.id) return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
    await createParticipantSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP verification failed", error);
    return NextResponse.json({ error: "Verification could not be completed. Please try again." }, { status: 500 });
  }
}
