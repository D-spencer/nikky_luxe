import { ShieldCheck, UserCheck, UserX } from "lucide-react";
import { configuredAdminEmails } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const configuredEmails = configuredAdminEmails();
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) throw new Error("Unable to load admin accounts.");

  const usersByEmail = new Map(
    (data.users || [])
      .filter((user) => user.email)
      .map((user) => [user.email!.toLowerCase(), user])
  );

  const admins = configuredEmails.map((email) => ({
    email,
    user: usersByEmail.get(email),
  }));

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <span>Access</span>
          <h1>Manage admins</h1>
          <p>These are the accounts currently authorised to access the Nikky Luxe admin area.</p>
        </div>
      </div>

      <div className="admin-table-card">
        {admins.length === 0 ? (
          <div className="admin-empty">
            <ShieldCheck size={30} />
            <h3>No admin emails configured</h3>
            <p>Add an authorised email to the secure ADMIN_EMAILS environment setting.</p>
          </div>
        ) : (
          <div className="admin-users-list">
            {admins.map(({ email, user }) => (
              <div className="admin-user-row" key={email}>
                <div className="admin-user-icon">
                  {user ? <UserCheck size={20} /> : <UserX size={20} />}
                </div>
                <div className="admin-user-copy">
                  <strong>{email}</strong>
                  <span>{user ? "Supabase account active" : "Authorised email · Supabase account not found"}</span>
                </div>
                <span className={`status-pill ${user ? "live" : ""}`}>{user ? "Active" : "Pending"}</span>
                <div className="admin-user-date">
                  <small>Last sign in</small>
                  <strong>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="admin-access-note">Only emails in the secure admin access list can enter this dashboard. Other Supabase users are not treated as Nikky Luxe admins.</p>
    </main>
  );
}
