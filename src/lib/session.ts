import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const participantCookieName = "nextgen_session";
const adminCookieName = "nextgen_admin";
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
  cookies().set(participantCookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: lifetimeSeconds,
  });
}

export async function getParticipantId() {
  const token = cookies().get(participantCookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "participant" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function clearParticipantSession() {
  cookies().delete(participantCookieName);
}

function constantTimeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("Admin credentials are not configured.");
  return constantTimeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase())
    && constantTimeEqual(password, adminPassword);
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" }).setSubject(email.toLowerCase()).setIssuedAt()
    .setExpirationTime("12h").sign(secret());
  cookies().set(adminCookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 60 * 60 * 12,
  });
}

export async function getAdminEmail() {
  const token = cookies().get(adminCookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  cookies().delete(adminCookieName);
}
