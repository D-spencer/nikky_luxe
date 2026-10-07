"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { configuredAdminEmails } from "@/lib/admin";
import { clientIp, consumeRateLimit } from "@/lib/security";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const ipLimit = await consumeRateLimit("login-ip", ip, 20, 900);
  const emailLimit = await consumeRateLimit("login-email", email || "empty", 8, 900);
  if (!ipLimit.allowed || !emailLimit.allowed) redirect("/admin/login?error=too-many-attempts");

  if (!email || email.length > 254 || !password || password.length > 256 || !configuredAdminEmails().includes(email)) {
    redirect("/admin/login?error=invalid-login");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid-login");

  redirect("/admin");
}
