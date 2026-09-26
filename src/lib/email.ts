import "server-only";
import { Resend } from "resend";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function sender() {
  const address = process.env.EMAIL_FROM;
  if (!address) throw new Error("EMAIL_FROM is not configured.");
  return address;
}

export async function sendVerificationEmail(email: string, code: string) {
  const result = await resend().emails.send({
    from: sender(), to: email, subject: "Your NextGen verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this email.`,
  });
  if (result.error) throw new Error("Verification email could not be sent.");
}

export async function sendPaymentConfirmation(email: string, fullName: string) {
  const result = await resend().emails.send({
    from: sender(), to: email, subject: "Your NextGen registration is successful",
    text: `Hello ${fullName}, Registration successful! Please always check your email for updates. The empowerment program will commence in September 2027.`,
  });
  if (result.error) throw new Error("Confirmation email could not be sent.");
}
