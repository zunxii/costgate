"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Layers, 
  ChevronRight, 
  Cpu, 
  Database, 
  ShieldCheck, 
  GitPullRequest, 
  Server, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  Lock, 
  Workflow 
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface PipelineStep {
  id: string;
  number: string;
  name: string;
  role: string;
  latency: string;
  security: string;
  details: string[];
  codeSample?: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "webhook",
    number: "01",
    name: "GitHub Webhook Ingestion",
    role: "HMAC Verification & Queue Enqueue",
    latency: "Implemented",
    security: "HMAC SHA-256 Signature Verification",
    details: [
      "Subscribes to pull_request.opened and pull_request.synchronize events.",
      "Verifies X-Hub-Signature-256 header with secret rotation.",
      "Extracts PR diff hunks and changed SQL or ORM migration files.",
      "Enqueues the webhook payload onto the configured Amazon SQS queue; the deployed template currently uses a standard queue.",
    ],
    codeSample: `// Webhook Payload Envelope
{
  "action": "synchronize",
  "pull_request": {
    "number": 42,
    "head": { "sha": "e9b2c3f", "ref": "feat/customer-lookup" },
    "base": { "sha": "a1b2c3d", "ref": "main" }
  },
  "repository": { "full_name": "acme/backend" }
}`,
  },
  {
    id: "sqs-buffer",
    number: "02",
    name: "Amazon SQS Queue",
    role: "Backpressure & Race Condition Elimination",
    latency: "Configured",
    security: "KMS Envelope Encryption (aws/sqs)",
    details: [
      "Provides asynchronous buffering between the public GitHub webhook and the processor Lambda.",
      "Webhook messages carry delivery and installation context so the processor can use the correct GitHub App installation.",
      "Queue behaviour is defined by the deployed SAM queue configuration; verify retry/DLQ settings in your environment before relying on them.",
      "Provides asynchronous buffering so webhook ingestion is decoupled from database analysis work.",
    ],
    codeSample: `// SQS message envelope
{
  "repository": "owner/repository",
  "pull_number": 123,
  "installation_id": "<github-installation-id>",
  "delivery_id": "<github-delivery-id>"
}`,
  },
  {
    id: "ast-parser",
    number: "03",
    name: "AST Query Extractor",
    role: "Diff Parsing & SQL AST Normalization",
    latency: "Implemented",
    security: "Diff-scoped processing",
    details: [
      "Fetches git patch diff via authenticated GitHub App Installation Token.",
      "Identifies altered SQL queries, ORM calls, and migration scripts.",
      "Normalizes parameterized values ($1, :id, ?) into query fingerprint.",
      "The current extractor rejects unsupported SQL changes before analysis; the deployed analyzer is intended for read-oriented query evaluation.",
    ],
    codeSample: `// Analysis request sent to the VPC worker
{
  "baseline_sql": "<base query>",
  "candidate_sql": "<changed query>",
  "file_path": "<changed file>"
}`,
  },
  {
    id: "shadow-sandbox",
    number: "04",
    name: "Shadow DB VPC Worker",
    role: "Read-Only EXPLAIN Execution",
    latency: "VPC Lambda",
    security: "Read-only transaction + timeout",
    details: [
      "The analysis Lambda is configured with your supplied VPC subnet and security-group identifiers.",
      "Connects to isolated shadow PostgreSQL replica with read-only credentials.",
      "Executes EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) within a read-only transaction.",
      "Uses a read-only transaction and explicit ROLLBACK so the analysis path does not persist query-side mutations.",
    ],
    codeSample: `BEGIN;
SET LOCAL default_transaction_read_only = on;
SET LOCAL statement_timeout = '10s';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
<baseline or candidate SQL>;

ROLLBACK;`,
  },
  {
    id: "cost-engine",
    number: "05",
    name: "FinOps Cost Modeling Engine",
    role: "Mathematical Cloud Spend Attribution",
    latency: "Deterministic",
    security: "Stateless Algorithmic Scoring",
    details: [
      "Compares candidate execution time and shared buffer eviction against baseline.",
      "Multiplies compute delta by query frequency (QPS) over 30-day projection.",
      "Maps attributed CPU and I/O consumption to target AWS RDS hourly pricing.",
      "Evaluates the monthly delta against the configured CostGate warning/block policy and records confidence/direction.",
    ],
    codeSample: `// Cost engine result
{
  "monthly_delta_usd": <computed value>,
  "lower_bound_usd": <computed value>,
  "upper_bound_usd": <computed value>,
  "direction": "increase | decrease | unchanged",
  "confidence": "high | medium | low"
}`,
  },
  {
    id: "github-bot",
    number: "06",
    name: "GitHub Check Run & Comment Dispatcher",
    role: "Policy result & GitHub write-back",
    latency: "GitHub write-back",
    security: "Minimal GitHub App Scopes",
    details: [
      "Updates GitHub Commit Check Run status (Success or Failure).",
      "Posts clean markdown comment with visual AST diff and cost breakdown.",
      "Posts the analysis comment and GitHub Check result produced by the processor pipeline.",
      "Persists the prediction record for the authenticated dashboard and can publish GitHub Check/PR comment results when enabled.",
    ],
    codeSample: `// GitHub Check Run is published for the PR head SHA
{
  "status": "completed",
  "conclusion": "success | neutral | failure",
  "output": {
    "title": "CostGate policy result",
    "summary": "Deterministic cost analysis and policy reason"
  }
}`,
  },
];

export default function ArchitecturePage() {
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(PIPELINE_STEPS[3]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1.5">
              <Link href="/" className="hover:text-[#ea580c] transition-colors">Home</Link>
              <ChevronRight className="size-3 text-slate-400" />
              <span className="text-[#ea580c] font-bold">System Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
              <span>Deep Pipeline Architecture</span>
              <span className="rounded-full bg-[#ff9900]/15 border border-[#ff9900]/30 text-[#ea580c] font-mono text-xs px-2.5 py-0.5 font-bold">
                Spec
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
              How CostGate turns GitHub PR events into queued SQL extraction, VPC analysis, deterministic cost modeling, and GitHub write-back.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/security"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "border-slate-200 bg-white text-xs font-mono text-slate-700 hover:text-slate-950 rounded-full shadow-xs",
              })}
            >
              Security Whitepaper →
            </Link>
            <Link
              href="/demo"
              className={buttonVariants({
                size: "sm",
                className: "bg-gradient-to-r from-[#ff9900] to-[#ff6600] hover:from-[#e68a00] hover:to-[#ea580c] text-white font-bold text-xs rounded-full shadow-md shadow-orange-500/20",
              })}
            >
              Test Live in PR Studio
            </Link>
          </div>
        </div>

        {/* High-Level Architecture Flow Diagram */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs space-y-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
              <Workflow className="size-4 text-[#ea580c]" />
              THE 6-STAGE EVENT PIPELINE (CLICK TO INSPECT)
            </span>
            <span className="text-xs font-mono text-[#ea580c] font-bold">E2E Latency: &lt; 1.2s</span>
          </div>

          {/* Grid of pipeline nodes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PIPELINE_STEPS.map((step) => {
              const isSelected = selectedStep.id === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between min-h-[110px] relative ${
                    isSelected
                      ? "bg-white border-[#ff9900] shadow-md ring-1 ring-[#ff9900]"
                      : "bg-slate-50/70 hover:bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold mb-1">
                      <span>STEP {step.number}</span>
                      <span className="text-[#ea580c]">{step.latency}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs leading-tight">
                      {step.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 truncate font-mono">
                    {step.role}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Step Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Details Column (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-white p-6 shadow-xs border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#ea580c] bg-[#ff9900]/10 border border-[#ff9900]/25 px-2.5 py-0.5 rounded-full">
                  STAGE {selectedStep.number} SPECIFICATION
                </span>
                <h2 className="text-xl font-bold text-slate-950 mt-1.5">{selectedStep.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedStep.role}</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">{selectedStep.latency}</div>
                <div className="text-[10px] text-slate-400 font-mono">avg duration</div>
              </div>
            </div>

            {/* Core Responsibilities */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-500">
                Core Execution Steps:
              </h3>
              <ul className="space-y-2">
                {selectedStep.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <CheckCircle2 className="size-3.5 text-[#ea580c] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Isolation Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Lock className="size-3.5 text-[#ea580c]" />
                <span>Security Guarantee: {selectedStep.security}</span>
              </div>
            </div>
          </div>

          {/* Code Sample Column (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-xs border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Terminal className="size-3.5 text-[#ea580c]" />
                <span>Execution Trace Sample</span>
              </div>
              <span className="text-slate-400 text-[10px]">read-only</span>
            </div>

            <pre className="rounded-xl bg-slate-50 p-3.5 font-mono text-[11px] text-slate-800 overflow-x-auto border border-slate-200 leading-relaxed whitespace-pre">
              {selectedStep.codeSample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
