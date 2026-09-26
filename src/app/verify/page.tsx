import { redirect } from "next/navigation";
import OtpForm from "@/components/otp-form";

export default function VerifyPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email;
  if (!email) redirect("/");
  return <OtpForm email={email} />;
}
