"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "请输入邮箱和密码。" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "登录失败，请检查账号或密码。" };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "登录失败，请检查账号或密码。" };
  }

  const token = await createSessionToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  await setSessionCookie(token);
  redirect("/");
}
