"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBanner } from "@/components/shared/status-banner";
import { ApiError, getCurrentUser, login } from "@/lib/api";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, HOME_FOR_ROLE, SHOW_DEMO_ACCOUNTS } from "@/lib/constants";
import { hardNavigate } from "@/lib/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Already signed in? Go straight to the role's home.
  useEffect(() => {
    getCurrentUser().then(
      (user) => hardNavigate(HOME_FOR_ROLE[user.role], { replace: true }),
      () => {},
    );
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { user } = await login(email.trim(), password);
      // Full load so the app starts clean for this user.
      hardNavigate(HOME_FOR_ROLE[user.role]);
    } catch (err) {
      setPending(false);
      // Same message for an unknown email and a wrong password.
      setError(
        err instanceof ApiError && (err.status === 401 || err.status === 400)
          ? "Email or password is incorrect."
          : "NovaWorks couldn't reach the server. Try again.",
      );
    }
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    submitRef.current?.focus();
  }

  return (
    <>
      <section aria-labelledby="sign-in-heading" className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <h1 id="sign-in-heading" className="text-2xl font-semibold tracking-[-0.015em]">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-slate">Use your NovaWorks account.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              disabled={pending}
            />
          </div>

          {error ? (
            <div id="login-error">
              <StatusBanner tone="error" title={error} />
            </div>
          ) : null}

          <Button ref={submitRef} type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </section>

      {SHOW_DEMO_ACCOUNTS ? (
        <section aria-labelledby="demo-heading" className="mt-4 rounded-card border border-line bg-surface/60 p-4">
          <h2 id="demo-heading" className="text-xs font-medium text-slate">
            Demo accounts
          </h2>
          <ul className="mt-2 flex flex-col">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => fillDemoAccount(a.email)}
                  className="flex min-h-10 w-full items-center justify-between gap-3 rounded-control px-2 text-left text-sm transition-colors hover:bg-lagoon-tint"
                >
                  <span className="truncate text-ink">{a.email}</span>
                  <span className="shrink-0 text-xs text-slate">{a.who}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-2 text-xs text-slate">
            Password for all: <span className="font-medium text-ink">{DEMO_PASSWORD}</span>
          </p>
        </section>
      ) : null}
    </>
  );
}
