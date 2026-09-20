"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FAQS = [
  {
    q: "How does CostGate analyze queries without risking production data?",
    a: "CostGate connects to a dedicated shadow PostgreSQL replica or containerized staging database inside your private VPC. Furthermore, CostGate AST-validates every statement to ensure only SELECT and WITH statements are ever executed, wraps every query in `SET TRANSACTION READ ONLY`, and enforces a 10-second statement timeout with a 2-second lock timeout to eliminate any risk of table locking or data modification.",
  },
  {
    q: "How is the attributed monthly dollar cost calculated?",
    a: "CostGate calculates attributed database compute impact using the formula: ((candidate_ms - baseline_ms) / 1000) × monthly_requests × effective_parallelism / 3600 × db_instance_hourly_price. It provides lower and upper uncertainty bounds (default ±20%) and an evidence confidence score (HIGH, MEDIUM, LOW) based on whether execution plans shifted from Index Scans to Seq Scans or suffered shared memory buffer misses.",
  },
  {
    q: "Will CostGate slow down our CI/CD workflow or pull request checks?",
    a: "Not at all. The GitHub webhook endpoint is completely decoupled via Amazon SQS and returns HTTP 202 in under 100ms. The background PR Event Processor and VPC Analysis Lambda run asynchronously, publishing or updating the PR comment in 2 to 3 seconds without blocking your GitHub Actions test runners.",
  },
  {
    q: "What permissions does the CostGate GitHub App require?",
    a: "CostGate requires minimal, read-only permissions on repository metadata and Pull Request contents to fetch changed SQL statements, along with read/write access to Pull Request comments to post and update its analysis. CostGate never asks for write permissions to your git branches or repository code.",
  },
  {
    q: "Can CostGate be deployed entirely within our own AWS account?",
    a: "Yes! CostGate includes a complete AWS Serverless Application Model (`template.yaml`) that you can deploy in minutes with `sam deploy`. It provisions the HTTP API, SQS queues, processor Lambdas, and VPC connectors directly in your own AWS account with zero external third-party dependencies.",
  },
  {
    q: "Which database engines are supported?",
    a: "Currently, CostGate is purpose-built for PostgreSQL 14, 15, and 16 running on AWS RDS, AWS Aurora, or self-hosted EC2/Docker environments. MySQL 8 (EXPLAIN FORMAT=JSON) and Snowflake support are on the roadmap.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24 border-t border-white/[0.08] bg-[#0c1017]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-xs mb-3">
            Got Questions?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-neutral-400 text-sm">
            Everything you need to know about CostGate&apos;s security model, cost formulas, and architecture.
          </p>
        </div>

        <Accordion className="w-full space-y-3">
          {FAQS.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-5 py-1 text-left"
            >
              <AccordionTrigger className="text-sm sm:text-base font-semibold text-white hover:text-emerald-400 transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-1 pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
