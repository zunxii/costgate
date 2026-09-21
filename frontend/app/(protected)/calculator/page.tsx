"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Instance {
  id: string;
  hourly_usd: number;
  v_cpu: number;
  ram_gb: number;
  label: string;
}

interface SimulationResult {
  monthly_delta_usd: number;
  lower_bound_usd: number;
  upper_bound_usd: number;
  annualized_delta_usd: number;
  direction: string;
  confidence: string;
  assumptions: Record<string, unknown>;
}

export default function CalculatorPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [baseline, setBaseline] = useState(10);
  const [candidate, setCandidate] = useState(40);
  const [requests, setRequests] = useState(5_000_000);
  const [instance, setInstance] = useState("db.t4g.small");
  const [multiAz, setMultiAz] = useState(true);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingConfig(true);
    fetch("/api/cost-simulator/config", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body?.data) throw new Error(body?.error?.message || "Unable to load simulator configuration.");
        if (!active) return;
        setInstances(body.data.instances || []);
        if (body.data.instances?.length && !body.data.instances.some((item: Instance) => item.id === instance)) {
          setInstance(body.data.instances[0].id);
        }
      })
      .catch((reason) => {
        if (active) setError(reason?.message || "Unable to load simulator.");
      })
      .finally(() => {
        if (active) setLoadingConfig(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function calculate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cost-simulator/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          baseline_ms: Number(baseline),
          candidate_ms: Number(candidate),
          monthly_requests: Number(requests),
          instance_class: instance,
          multi_az: multiAz,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body?.data) throw new Error(body?.error?.message || "Simulation failed.");
      setResult(body.data);
    } catch (reason: any) {
      setError(reason?.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-slate-500 hover:text-slate-900">Home</Link>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="font-semibold">Cost Simulator</span>
          </div>
          <Link href="/demo" className="text-xs font-semibold text-slate-600 hover:text-orange-600">
            PR Studio <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-orange-600">Live backend calculator</p>
          <h1 className="text-3xl font-semibold mt-2">Model a real query regression.</h1>
          <p className="text-slate-500 mt-2">
            Inputs are sent to the same Python cost engine used by CostGate&apos;s PR analysis. The result is an attributed estimate, not a substitute for your AWS bill.
          </p>
        </div>

        {error && <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

        {loadingConfig ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Loading backend configuration…
          </div>
        ) : (
          <div className="grid lg:grid-cols-7 gap-6">
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Baseline execution (ms)</span>
                <input type="number" min="0" step="0.01" value={baseline} onChange={(event) => setBaseline(Number(event.target.value))} className="mt-2 w-full h-11 rounded-lg border border-slate-200 px-3 font-mono" />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Candidate execution (ms)</span>
                <input type="number" min="0" step="0.01" value={candidate} onChange={(event) => setCandidate(Number(event.target.value))} className="mt-2 w-full h-11 rounded-lg border border-slate-200 px-3 font-mono" />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Monthly request volume</span>
                <input type="number" min="1" value={requests} onChange={(event) => setRequests(Number(event.target.value))} className="mt-2 w-full h-11 rounded-lg border border-slate-200 px-3 font-mono" />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">RDS instance class</span>
                <select value={instance} onChange={(event) => setInstance(event.target.value)} className="mt-2 w-full h-11 rounded-lg border border-slate-200 px-3 font-mono bg-white">
                  {instances.map((item) => <option key={item.id} value={item.id}>{item.id} · ${item.hourly_usd}/hr</option>)}
                </select>
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span>
                  <span className="text-sm font-semibold">Multi-AZ multiplier</span>
                  <span className="block text-xs text-slate-500 mt-1">Uses the backend&apos;s HA billing assumption.</span>
                </span>
                <button type="button" onClick={() => setMultiAz((value) => !value)} className={`px-3 py-2 rounded-lg text-xs font-semibold border ${multiAz ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600"}`}>
                  {multiAz ? "Enabled (2×)" : "Disabled (1×)"}
                </button>
              </label>

              <button onClick={calculate} disabled={loading || !instances.length} className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="size-4 animate-spin" />}
                Calculate with CostGate engine
              </button>
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Backend result</div>
              {result ? (
                <div className="mt-8 space-y-5">
                  <div>
                    <div className="text-sm text-slate-500">Estimated monthly delta</div>
                    <div className="text-5xl font-mono font-semibold mt-1">{formatCurrency(result.monthly_delta_usd)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="text-[11px] text-slate-500">Annualized</div><div className="font-mono font-semibold mt-1">{formatCurrency(result.annualized_delta_usd)}</div></div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="text-[11px] text-slate-500">Range</div><div className="font-mono font-semibold mt-1">{formatCurrency(result.lower_bound_usd)}–{formatCurrency(result.upper_bound_usd)}</div></div>
                  </div>
                  <div className="text-sm"><span className="text-slate-500">Direction:</span> <span className="font-semibold capitalize">{result.direction}</span></div>
                  <div className="text-sm"><span className="text-slate-500">Confidence:</span> <span className="font-semibold capitalize">{result.confidence}</span></div>
                  <pre className="text-[11px] bg-slate-950 text-slate-200 rounded-xl p-4 overflow-auto">{JSON.stringify(result.assumptions, null, 2)}</pre>
                </div>
              ) : (
                <div className="py-20 text-sm text-slate-400 text-center">Run a calculation to see the engine output.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
