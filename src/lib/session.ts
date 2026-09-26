import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "nextgen_session";
const lifetimeSeconds = 60 * 60 * 24 * 5;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createParticipantSession(userId: string) {
  const token = await new SignJWT({ role: "participant" })
    .setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt()
    .setExpirationTime(`${lifetimeSeconds}s`).sign(secret());
  cookies().set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: lifetimeSeconds,
  });
}

export async function getParticipantId() {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "participant" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function clearParticipantSession() {
  cookies().delete(cookieName);
}
