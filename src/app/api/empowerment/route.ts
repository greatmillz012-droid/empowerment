import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/neon";
import { getParticipantId } from "@/lib/session";
import { isEmpowermentType } from "@/lib/empowerment-types";

const schema = z.object({ empowermentType: z.string().min(1) });

export async function POST(request: Request) {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !isEmpowermentType(parsed.data.empowermentType)) return NextResponse.json({ error: "Choose a valid empowerment type." }, { status: 400 });
    const sql = getDb();
    const updated = await sql`update users set empowerment_type = ${parsed.data.empowermentType}
      where id = ${userId} and email_verified = true and payment_status = 'unpaid' returning id`;
    if (!updated.length) return NextResponse.json({ error: "Your registration could not be updated." }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Empowerment selection failed", error);
    return NextResponse.json({ error: "Could not save your selection. Please try again." }, { status: 500 });
  }
}
