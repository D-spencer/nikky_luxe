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
        {error && <div className="error-box">{error === "too-many-attempts" ? "Too many sign-in attempts. Please wait a few minutes and try again." : "Email or password is incorrect."}</div>}
        <form action={login} className="stack-form">
          <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required maxLength={256} autoComplete="current-password" /></label>
          <button className="button button-dark wide" type="submit">Sign in</button>
        </form>
        <a href="/" className="admin-back-link">← Back to website</a>
      </div>
    </main>
  );
}
