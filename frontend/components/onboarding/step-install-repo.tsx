"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Check,
  ExternalLink,
  ArrowRight,
  Database,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  selected: boolean;
}

interface StepInstallRepoProps {
  onComplete: (selectedRepos: Repository[]) => void;
}

export function StepInstallRepo({ onComplete }: StepInstallRepoProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstallations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/installations");
      const body = await res.json();

      if (!res.ok || body?.error) {
        throw new Error(body?.error?.message || `API returned ${res.status}`);
      }

      // Flatten installation.repositories into our local repo shape
      const all: Repository[] = (body ?? []).flatMap((inst: any) =>
        (inst.repositories ?? []).map((r: any) => ({
          id: String(r.id),
          name: r.name,
          fullName: r.full_name,
          private: r.private ?? false,
          selected: false,
        }))
      );

      setRepos(all);
    } catch (err: any) {
      setError(err.message || "Failed to load repositories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallations();
  }, []);

  const toggleRepo = (id: string) => {
    setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const selectedCount = repos.filter((r) => r.selected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-xl mx-auto"
    >
      <div className="flex flex-col items-center text-center">
        <div className="size-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-4">
          <GitBranch className="size-6" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Select Repositories to Monitor
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 max-w-md">
          Choose which GitHub repositories CostGate should inspect for database migration &amp; EXPLAIN
          cost deltas.
        </p>

        <div className="w-full mt-6 space-y-3 text-left">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin text-orange-500" />
              <span>Loading repositories from GitHub App installation…</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-700">Failed to load repositories</p>
                <p className="text-[11px] text-red-500 mt-0.5">{error}</p>
              </div>
              <button
                onClick={loadInstallations}
                className="shrink-0 text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> Retry
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                No repositories found in your GitHub App installation.
              </p>
              <a
                href="https://github.com/apps/costgate-bot/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold hover:underline mt-3"
              >
                Install CostGate GitHub App <ExternalLink className="size-3" />
              </a>
            </div>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => toggleRepo(repo.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  repo.selected
                    ? "bg-white border-orange-500/40 shadow-sm ring-1 ring-orange-500/10"
                    : "bg-slate-50/60 border-slate-200/80 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-5 rounded-lg border flex items-center justify-center ${
                      repo.selected
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {repo.selected && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 font-mono">{repo.fullName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-light">
                      <Database className="size-3 text-slate-400" />
                      {repo.private ? "Private" : "Public"} repository
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  PR Webhook Ready
                </span>
              </div>
            ))
          )}
        </div>

        <div className="w-full mt-8 flex items-center justify-between gap-4">
          <a
            href="https://github.com/apps/costgate-bot/installations/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Install on another organization</span>
            <ExternalLink className="size-3" />
          </a>

          <button
            onClick={() => onComplete(repos.filter((r) => r.selected))}
            disabled={selectedCount === 0 || loading}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <span>Continue ({selectedCount} Selected)</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
