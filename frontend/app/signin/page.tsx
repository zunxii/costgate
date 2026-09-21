"use client";
import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

function safeNext(value: string | null) {
  if (!value) return "/dashboard";

  if (!value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function SigninPage() {
  const searchParams = useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/signin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ??
          "Email or password is incorrect."
        );
      }

      window.location.href = safeNext(searchParams.get("next"));
      return;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (<Suspense fallback={<div>Loading...</div>}>
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <span className="font-bold text-white">
              C
            </span>
          </div>

          <span className="text-xl font-semibold text-gray-900">
            CostGate
          </span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to your CostGate
            workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-800"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                placeholder="you@example.com"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-800"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                placeholder="Your password"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-gray-900 hover:text-orange-600"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  </Suspense>
  );
}