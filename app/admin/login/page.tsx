import { LockKeyhole } from "lucide-react";
import { login } from "./actions";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand"><span>NL</span><strong>NIKKY LUXE</strong></div>
        <div className="admin-login-icon"><LockKeyhole size={22} /></div>
        <h1>Admin sign in</h1>
        <p>Manage products, categories, images and videos.</p>
        {error && <div className="error-box">{error === "not-authorized" ? "This email is not listed as a Nikky Luxe admin." : "Email or password is incorrect."}</div>}
        <form action={login} className="stack-form">
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          <button className="button button-dark wide" type="submit">Sign in</button>
        </form>
        <a href="/" className="admin-back-link">← Back to website</a>
      </div>
    </main>
  );
}
