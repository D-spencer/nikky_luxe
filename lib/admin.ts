import { createServerSupabaseClient } from "@/lib/supabase/server";

export function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  const admins = configuredAdminEmails();
  if (!admins.includes(user.email.toLowerCase())) return null;

  return user;
}
