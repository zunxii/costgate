"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
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

    if (password.length < 10) {
      setError(
        "Password must be at least 10 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
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
          "Unable to create your account."
        );
      }

      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
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
            Create your CostGate account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Start analyzing the real cost
            impact of your infrastructure
            changes.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-800"
              >
                Name
              </label>

              <input
                id="name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                autoComplete="name"
                placeholder="Your name"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

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
                minLength={10}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="new-password"
                placeholder="At least 10 characters"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-800"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                minLength={10}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Repeat your password"
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
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-gray-900 hover:text-orange-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}