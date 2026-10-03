import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminCredentials } from "@/lib/session";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    if (!verifyAdminCredentials(parsed.data.email, parsed.data.password)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createAdminSession(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin sign-in failed", error);
    return NextResponse.json({ error: "Administrator sign-in is not configured." }, { status: 500 });
  }
}
