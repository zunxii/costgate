"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Check, ExternalLink, ArrowRight, Database, Server } from "lucide-react";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  dbEngine: string;
  selected: boolean;
}

const AVAILABLE_REPOS: Repository[] = [
  { id: "repo-1", name: "costgate", fullName: "zunxii/costgate", dbEngine: "PostgreSQL 16 (AWS RDS)", selected: true },
  { id: "repo-2", name: "analytics-db", fullName: "zunxii/analytics-db", dbEngine: "PostgreSQL 15 (AWS RDS Aurora)", selected: true },
  { id: "repo-3", name: "payment-gateway", fullName: "zunxii/payment-gateway", dbEngine: "PostgreSQL 14", selected: false },
];

interface StepInstallRepoProps {
  onComplete: (selectedRepos: Repository[]) => void;
}

export function StepInstallRepo({ onComplete }: StepInstallRepoProps) {
  const [repos, setRepos] = useState<Repository[]>(AVAILABLE_REPOS);

  const toggleRepo = (id: string) => {
    setRepos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
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
          Choose which GitHub repositories CostGate should inspect for database migration & EXPLAIN cost deltas.
        </p>

        <div className="w-full mt-6 space-y-3 text-left">
          {repos.map((repo) => (
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
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {repo.fullName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-light">
                    <Database className="size-3 text-slate-400" />
                    {repo.dbEngine}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                PR Webhook Ready
              </span>
            </div>
          ))}
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
            disabled={selectedCount === 0}
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
