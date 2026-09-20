"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  GitPullRequest, 
  FileCode, 
  Database, 
  CheckCircle2,
  ArrowDown
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Webhook Ingestion",
    desc: "Validates GitHub payload and queues to SQS FIFO.",
    icon: GitPullRequest,
  },
  {
    num: "02",
    title: "AST Query Parser",
    desc: "Extracts modified SQL from diffs into ASTs.",
    icon: FileCode,
  },
  {
    num: "03",
    title: "Shadow Execution",
    desc: "Runs EXPLAIN ANALYZE inside a private VPC.",
    icon: Database,
  },
  {
    num: "04",
    title: "Cost Fixes",
    desc: "Posts committable index fixes to your PR.",
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  return (
    <section id="architecture" className="py-24 md:py-32 bg-white relative">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            How it works under the hood
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            A secure, event-driven architecture designed to keep your production database totally isolated.
          </p>
        </div>

        {/* Clean, Humanized Flow Diagram */}
        <div className="relative">
          <div className="absolute left-[28px] top-8 bottom-8 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="space-y-12">
            {STEPS.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative flex flex-col md:flex-row items-start md:items-center gap-6 group cursor-default"
              >
                <div className="relative z-10 flex items-center justify-center size-14 rounded-full bg-white border-2 border-slate-200 text-slate-400 group-hover:border-orange-500 group-hover:text-orange-500 transition-colors shadow-sm">
                  <step.icon className="size-6" />
                </div>
                
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">STEP {step.num}</span>
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
