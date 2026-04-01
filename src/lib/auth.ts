import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";

const COOKIE = "ar_session";

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("请设置环境变量 SESSION_SECRET（至少 16 个字符）");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    const role = payload.role as Role;
    const email = payload.email as string;
    if (!sub || !role || !email) return null;
    return { sub, role, email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const s = await readSession();
  if (!s) return null;
  const user = await prisma.user.findUnique({
    where: { id: s.sub },
    include: { employee: true },
  });
  if (!user) return null;
  return user;
}

export function requireRole(userRole: Role, allowed: Role[]) {
  if (!allowed.includes(userRole)) {
    throw new Error("Forbidden");
  }
}
