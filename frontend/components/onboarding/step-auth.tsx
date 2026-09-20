"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { Logo } from "@/components/ui/logo";
import { useSearchParams } from "next/navigation";

interface StepAuthProps {
  onComplete: (user: { name: string; username: string; avatar: string }) => void;
  authenticatedUser: { name: string; username: string; avatar: string } | null;
}

export function StepAuth({ onComplete, authenticatedUser }: StepAuthProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const searchParams = useSearchParams();

  // When GitHub redirects back with ?auth=success, fetch the real user profile
  useEffect(() => {
    if (searchParams.get("auth") === "success" && !authenticatedUser) {
      setFetchingUser(true);
      fetch("/api/auth/github/user")
        .then((res) => res.json())
        .then((body) => {
          if (body?.data) {
            onComplete(body.data);
          } else {
            console.error("Failed to resolve GitHub user after OAuth callback", body?.error);
          }
        })
        .catch((err) => console.error("GitHub user fetch failed", err))
        .finally(() => setFetchingUser(false));
    }
  }, [searchParams, authenticatedUser, onComplete]);

  const handleGitHubLogin = () => {
    setLoading(true);
    // Redirects to GitHub OAuth — the BFF route builds the authorization URL
    window.location.href = "/api/auth/github/login";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-xl mx-auto"
    >
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" showText={false} className="mb-4" />

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Authorize CostGate GitHub App
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 max-w-md">
          Sign in with your GitHub account to grant CostGate permission to post PR checks and EXPLAIN
          cost analysis comments.
        </p>

        {authenticatedUser ? (
          <div className="w-full mt-8 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={authenticatedUser.avatar}
                alt={authenticatedUser.username}
                className="size-10 rounded-full border border-emerald-300"
              />
              <div className="text-left">
                <div className="text-xs font-mono text-emerald-800 font-bold">
                  @{authenticatedUser.username}
                </div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="size-3" /> GitHub Authorized
                </div>
              </div>
            </div>
            <button
              onClick={() => onComplete(authenticatedUser)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : fetchingUser ? (
          <div className="w-full mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 py-6">
            <Loader2 className="size-4 animate-spin text-orange-500" />
            <span>Verifying GitHub authorization…</span>
          </div>
        ) : (
          <div className="w-full mt-8 space-y-4">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GithubIcon className="size-5 fill-current" />
              )}
              <span>{loading ? "Redirecting to GitHub…" : "Authorize with GitHub OAuth"}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono pt-2">
              <Shield className="size-3.5 text-orange-500" />
              <span>Read-only code inspection &amp; check run permissions</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
