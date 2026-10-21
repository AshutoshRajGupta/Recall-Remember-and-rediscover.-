import { useState } from "react";
import { loginUser, registerUser } from "../services/api.js";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "register") {
        await registerUser({
          email: normalizedEmail,
          password,
        });

        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage("Account created successfully. Please sign in.");
      } else {
        await loginUser({
          email: normalizedEmail,
          password,
        });

        // The browser handles the HTTP-only cookie.
        // Fetch the authenticated user through /auth/me.
        await onLogin();
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="app-logo">AI</div>
          <p className="auth-eyebrow">YOUR PERSONAL KNOWLEDGE SPACE</p>
        </div>

        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>

        <p className="auth-description">
          {mode === "login"
            ? "Sign in to explore your saved knowledge with AI."
            : "Save your notes and webpages in your own private workspace."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => switchMode("register")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={mode === "register" ? 8 : undefined}
            required
          />

          {mode === "register" && (
            <>
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </>
          )}

          {error && (
            <p className="auth-feedback auth-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="auth-feedback auth-success" role="status">
              {message}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Your knowledge belongs to you. Sign in to access your workspace.
        </p>
      </section>
    </main>
  );
}
