"use client";

import React from "react";
import { Check, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const TIERS = [
  {
    name: "Open Source SAM",
    price: "$0",
    frequency: "free forever",
    desc: "Deploy CostGate directly into your AWS account with our open-source Serverless Application Model template.",
    features: [
      "Full source code access",
      "Unlimited PR analyses",
      "Deploys in your private AWS VPC",
      "Connects to your shadow RDS/Postgres",
      "Idempotent GitHub PR comments",
      "Community GitHub support",
    ],
    cta: "Deploy SAM Template",
    ctaLink: "https://github.com/zunxii/costgate",
    popular: false,
  },
  {
    name: "Cloud Pro",
    price: "$49",
    frequency: "per repo / month",
    desc: "Zero-infrastructure managed cloud service. Install the GitHub App in 60 seconds without managing Lambdas.",
    features: [
      "Everything in Open Source",
      "Zero AWS infrastructure to maintain",
      "60-second GitHub App installation",
      "Up to 500 PR analyses / month",
      "Automated shadow database seeding",
      "Slack / Discord webhook alerts",
      "Priority email & GitHub support",
    ],
    cta: "Start 14-Day Free Trial",
    ctaLink: "https://github.com/apps",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    frequency: "annual contract",
    desc: "For security-sensitive organizations requiring dedicated private infrastructure, SLAs, and custom cost models.",
    features: [
      "Everything in Cloud Pro",
      "Dedicated isolated AWS VPC",
      "Custom cost attribution formulas",
      "Multi-region RDS & Aurora support",
      "Custom CI merge blocking policies",
      "SOC2 Type II & HIPAA compliance",
      "Dedicated Slack channel & 99.9% SLA",
    ],
    cta: "Contact Architecture Team",
    ctaLink: "https://github.com/zunxii/costgate",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 border-t border-white/[0.08] bg-[#090d12]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-3">
            Predictable Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transparent Plans for Modern Engineering Teams
          </h2>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base">
            Start free with our open-source AWS template, or scale effortlessly with our fully managed cloud service.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative transition-all ${
                tier.popular
                  ? "bg-[#111620] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15"
                  : "bg-[#0d1117] border border-white/[0.08] hover:border-white/20"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-neutral-950 uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-white">{tier.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-white tracking-tight">{tier.price}</span>
                  <span className="text-xs text-neutral-400 font-mono">/ {tier.frequency}</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  {tier.desc}
                </p>

                <div className="space-y-3 pt-4 border-t border-white/[0.08] mb-8">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    What&apos;s Included:
                  </span>
                  {tier.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={tier.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className: `w-full font-semibold text-xs h-10 ${
                    tier.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20"
                      : "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]"
                  }`,
                })}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
