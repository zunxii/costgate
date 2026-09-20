"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Calculator, GitPullRequest, Layers, CheckCircle2 } from "lucide-react";
import { Hero } from "@/components/hero";
import { CodeRabbitDeck } from "@/components/coderabbit-deck";
import { ScrollContextShowcase } from "@/components/scroll-context-showcase";
import { HowItWorks } from "@/components/how-it-works";
import { FeaturesBento } from "@/components/features-bento";
import { CtaBanner } from "@/components/cta-banner";
import { cn } from "@/lib/utils";

const TRUSTED_BY = [
  { name: "PostgreSQL 16", label: "Plan AST" },
  { name: "AWS RDS Aurora", label: "FinOps Engine" },
  { name: "GitHub Actions", label: "CI Check Runs" },
  { name: "Terraform", label: "IaC Drift Guard" },
  { name: "SOC2 Type II", label: "Zero Egress" },
];

const EXPLORE_CARDS = [
  {
    title: "PR Studio Workbench",
    href: "/demo",
    description: "Inspect simulated PR diffs, AST comparison trees, and commit one-click fixes.",
    icon: GitPullRequest,
    badge: "Interactive",
  },
  {
    title: "FinOps Cost Simulator",
    href: "/calculator",
    description: "Slide query frequencies and RDS instance sizes to model AWS bill impact.",
    icon: Calculator,
    badge: "ROI Modeler",
  },
  {
    title: "Pipeline Architecture",
    href: "/architecture",
    description: "SQS FIFO queues, ephemeral VPC worker sandboxes, and timeout guards.",
    icon: Layers,
    badge: "Architecture",
  },
  {
    title: "Zero-Trust Security",
    href: "/security",
    description: "Read-only transactions, automated rollbacks, and zero data egress.",
    icon: Shield,
    badge: "Enterprise",
  },
];

const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Home() {
  return (
    <div className="w-full bg-slate-50 min-h-screen selection:bg-orange-100 selection:text-orange-900">
      {/* Hero Section */}
      <Hero />

      {/* Minimal Stack Ticker */}
      <section className="border-y border-slate-200/60 bg-white/40 backdrop-blur-md py-5 px-4 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[12px] font-mono text-slate-500 uppercase tracking-widest font-semibold whitespace-nowrap">
            Engineered for Production
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-[13px] text-slate-800">
            {TRUSTED_BY.map((item, i) => (
              <motion.div 
                key={item.name} 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="size-4 text-orange-500" />
                <span className="font-bold">{item.name}</span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">({item.label})</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CodeRabbit Deck Showcase - Clean Light */}
      <section className="relative px-6 lg:px-8 py-32 border-b border-slate-200/60 bg-white/30 backdrop-blur-3xl overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-rose-500/5 rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="mb-16 max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs text-orange-600 font-mono mb-6 border border-orange-200 shadow-sm">
              <Sparkles className="size-3.5" />
              <span className="font-bold tracking-tight">THE PR AUDIT DECK</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Watch CostGate guard your cloud budget in real time.
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed font-light">
              Auto-cycling audit phases showing how AST trees turn into committable FinOps suggestions right inside your Pull Request.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="rounded-3xl border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] bg-white/60 backdrop-blur-2xl p-4 sm:p-6 relative overflow-hidden"
          >
            {/* Inner glass highlight */}
            <div className="absolute inset-0 border border-white/40 rounded-3xl pointer-events-none" />
            <CodeRabbitDeck />
          </motion.div>
        </div>
      </section>

      {/* Flagship Sticky Scroll Context Showcase */}
      <div className="border-b border-slate-200/60 bg-slate-50">
        <ScrollContextShowcase />
      </div>

      {/* Dedicated Workspace Navigation Cards */}
      <section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div className="max-w-2xl">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-orange-500 flex items-center gap-2">
              <Layers className="size-4" />
              Explore Workspaces
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mt-4 leading-tight">
              Dedicated tools for engineering & FinOps.
            </h2>
          </div>
          <p className="text-slate-500 text-lg max-w-md font-light leading-relaxed">
            Jump into interactive workbenches to simulate bills, inspect execution plans, and review security specs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {EXPLORE_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="group relative rounded-3xl bg-white/70 backdrop-blur-xl p-8 sm:p-10 transition-all border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-orange-200 overflow-hidden flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="size-12 rounded-2xl border border-slate-200/60 bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-orange-50 group-hover:text-orange-500 group-hover:border-orange-200 transition-all duration-300">
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors duration-300 border border-slate-200/50">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors duration-300">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-[15px] text-slate-500 leading-relaxed font-light">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between text-[14px] font-semibold text-slate-400 group-hover:text-slate-900 transition-colors duration-300">
                    <span>Open workspace</span>
                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="border-t border-slate-200/60 bg-white/40 backdrop-blur-md">
        <HowItWorks />
      </div>

      <div className="border-t border-slate-200/60 bg-slate-50">
        <FeaturesBento />
      </div>

      <div className="border-t border-slate-200/60">
        <CtaBanner />
      </div>
    </div>
  );
}
