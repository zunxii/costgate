"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { 
  BarChart3, 
  Cpu, 
  Database, 
  MessageSquare
} from "lucide-react";

// Clean, crafted Bento Grid without AI images
export function FeaturesBento() {
  return (
    <section id="features" className="py-24 md:py-32 bg-slate-50 relative border-y border-slate-200/60">
      
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Built for DBAs. Loved by developers.
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Real insights based on PostgreSQL query planner mechanics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <BentoCard 
            title="Cache Hit Profiling"
            desc="Inspects Shared Hit Blocks to identify queries thrashing buffer pools and causing disk I/O spikes."
            icon={Cpu}
          >
            <div className="mt-6 p-4 rounded-lg bg-white border border-slate-100 shadow-sm font-mono text-xs">
              <div className="flex justify-between text-slate-400 mb-2 font-semibold">
                <span>Hits: 2,500</span>
                <span className="text-orange-500">Displaced: 2,491</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="w-[50%] bg-emerald-400 h-full"></div>
                <div className="w-[50%] bg-orange-400 h-full"></div>
              </div>
            </div>
          </BentoCard>

          <BentoCard 
            title="Evidence Scoring"
            desc="Deterministic scores based on scan changes, index drops, and actual execution runtime deltas."
            icon={BarChart3}
          >
            <div className="mt-6 p-4 flex items-center justify-center bg-white border border-slate-100 rounded-lg shadow-sm">
               <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full font-mono text-xs font-bold shadow-sm">
                 CONFIDENCE: HIGH (6/6)
               </span>
            </div>
          </BentoCard>

          <BentoCard 
            title="Zero PR Spam"
            desc="Updates a single existing comment in-place on each commit push to keep your PR threads clean and readable."
            icon={MessageSquare}
          />

          <BentoCard 
            title="Committable Fixes"
            desc="Generates ready-to-merge GitHub suggestion blocks pointing precisely to unindexed predicates."
            icon={Database}
          >
            <div className="mt-6 p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-inner font-mono text-[11px] leading-relaxed">
              <div className="text-rose-400 line-through opacity-80">- WHERE LOWER(id::text) = &apos;123&apos;;</div>
              <div className="text-emerald-400 font-medium">+ WHERE id = 123;</div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}

function BentoCard({ title, desc, icon: Icon, children }: any) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(249, 115, 22, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">
        <div className="size-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 mb-4 group-hover:text-orange-500 group-hover:border-orange-200 transition-colors">
          <Icon className="size-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
