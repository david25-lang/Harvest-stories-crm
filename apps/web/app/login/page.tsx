"use client";

import { Suspense, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackError =
    searchParams.get("error") === "confirmation_failed"
      ? "The confirmation link is invalid or expired. Request a new confirmation email."
      : "";

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Invalid email or password. If you recently registered, confirm your email first."
            : signInError.message
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError(
        "Unable to sign in right now. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Harvest &amp; Stories
        </p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to manage your farming and writing workspace.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Enter your password"
            />
          </div>

          {(error || callbackError) && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error || callbackError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Forgot your password?
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm text-slate-600">Loading login...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}