import "server-only";
import { createHmac, randomInt } from "node:crypto";

function otpSecret() {
  const value = process.env.OTP_SECRET;
  if (!value || value.length < 32) throw new Error("OTP_SECRET must contain at least 32 characters.");
  return value;
}

export function createOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string) {
  return createHmac("sha256", otpSecret()).update(code).digest("hex");
}
