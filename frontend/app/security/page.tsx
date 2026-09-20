"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  Server, 
  Key, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Database 
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Read-Only Transaction Isolation",
    badge: "Database Level",
    color: "text-[#ea580c]",
    desc: "Supported analysis queries run inside a PostgreSQL read-only transaction with a statement timeout; the analyzer does not permit write SQL.",
    code: `BEGIN;
SET LOCAL default_transaction_read_only = on;
SET LOCAL statement_timeout = '10000'; -- 10s kill switch

-- Replay query AST --
ROLLBACK; -- Zero persistent mutation`,
  },
  {
    icon: Server,
    title: "Private VPC Network Air-Gapping",
    badge: "Network Level",
    color: "text-[#ea580c]",
    desc: "The analysis Lambda is deployed with the VPC subnet and security-group configuration supplied to the SAM stack. Network egress depends on that AWS networking setup.",
    points: [
      "Analysis traffic is isolated from the public API path by the Lambda/VPC boundary",
      "Security group IDs are supplied as deployment parameters for the analysis worker",
      "Use the database TLS settings and security-group rules configured for your deployment"
    ],
  },
  {
    icon: Key,
    title: "Minimal GitHub App Scopes",
    badge: "Identity Level",
    color: "text-[#ea580c]",
    desc: "Uses repository-scoped GitHub App access for pull-request inspection and write-back of analysis results.",
    points: [
      "Repository metadata: read-only",
      "Pull requests and repository contents: read access for diff analysis",
      "Checks and issue/comment surfaces: write access for analysis results",
      "No application flow requests repository secrets or billing data",
    ],
  },
  {
    icon: Clock,
    title: "Runaway Query Kill Switch",
    badge: "Compute Level",
    color: "text-red-600",
    desc: "The analyzer configures a 10-second statement timeout and a 2-second lock timeout.",
    points: [
      "Hard timeout enforced via Postgres statement_timeout parameter",
      "The analyzer applies its configured statement timeout; the resulting policy decision is surfaced in the PR Check/comment"
    ],
  },
];

const COMPLIANCE_ITEMS = [
  { name: "Session signing", status: "Implemented", desc: "HS256-signed CostGate sessions with a shared secret between the frontend BFF and API." },
  { name: "GitHub App identity", status: "Implemented", desc: "Installation access is resolved from the authenticated GitHub identity instead of trusting a client-supplied installation id." },
  { name: "DynamoDB scoping", status: "Implemented", desc: "Prediction, connection, policy and PR Studio job records are partitioned by authenticated user id." },
  { name: "Read-only analysis", status: "Implemented", desc: "The analysis path uses read-only database execution controls; deployment security still depends on the configured database/VPC." },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1.5">
              <Link href="/" className="hover:text-[#ea580c] transition-colors">Home</Link>
              <ChevronRight className="size-3 text-slate-400" />
              <span className="text-[#ea580c] font-bold">Security & Trust Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
              <span>Security Model</span>
              <span className="rounded-full bg-[#ff9900]/15 border border-[#ff9900]/30 text-[#ea580c] font-mono text-xs px-2.5 py-0.5 font-bold">
                Implemented Controls
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
              How CostGate isolates execution-plan analysis from the application path, avoids schema writes, and makes the database/VPC boundary explicit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/zunxii/costgate"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "border-slate-200 bg-white text-xs font-mono text-slate-700 hover:text-slate-950 rounded-full shadow-xs",
              })}
            >
              Audit SAM Code →
            </a>
            <Link
              href="/demo"
              className={buttonVariants({
                size: "sm",
                className: "bg-gradient-to-r from-[#ff9900] to-[#ff6600] hover:from-[#e68a00] hover:to-[#ea580c] text-white font-bold text-xs rounded-full shadow-md shadow-orange-500/20",
              })}
            >
              See Live Sandbox
            </Link>
          </div>
        </div>

        {/* Security Overview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SECURITY_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl bg-white p-6 space-y-3 shadow-xs flex flex-col justify-between border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="size-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Icon className="size-4.5 text-[#ea580c]" />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 tracking-tight">{pillar.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">{pillar.desc}</p>
                </div>

                {pillar.code && (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto">
                    <pre>{pillar.code}</pre>
                  </div>
                )}

                {pillar.points && (
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-600 font-normal">
                    {pillar.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-[#ea580c] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Compliance Checklist */}
        <div className="rounded-2xl bg-white p-6 space-y-4 shadow-xs border border-slate-200">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-950">Implemented Security Controls</h3>
            <p className="text-xs text-slate-500">The page documents controls present in the current repository; it is not a certification claim.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMPLIANCE_ITEMS.map((item) => (
              <div key={item.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
