import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";
import { getParticipantId } from "@/lib/session";
import { isEmpowermentType } from "@/lib/empowerment-types";

const schema = z.object({ empowermentType: z.string().min(1) });

export async function POST(request: Request) {
  const userId = await getParticipantId();
  if (!userId) return NextResponse.json({ error: "Verify your email to continue." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !isEmpowermentType(parsed.data.empowermentType)) return NextResponse.json({ error: "Choose a valid empowerment type." }, { status: 400 });
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("users").update({ empowerment_type: parsed.data.empowermentType })
      .eq("id", userId).eq("email_verified", true).eq("payment_status", "unpaid").select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Your registration could not be updated." }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Empowerment selection failed", error);
    return NextResponse.json({ error: "Could not save your selection. Please try again." }, { status: 500 });
  }
}
