import React from "react";
import Link from "next/link";
import { GithubIcon } from "@/components/icons";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background text-muted-foreground text-xs py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Col (2 cols) */}
          <div className="col-span-2 space-y-3">
            <Logo size="sm" href="/" />
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Cloud cost governance for GitHub Pull Requests. Catch query regressions and attribute AWS RDS impact before merge.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/zunxii/costgate"
                target="_blank"
                rel="noopener noreferrer"
                className="size-7 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-semibold text-foreground uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-primary transition-colors">
                  PR Studio
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="hover:text-primary transition-colors">
                  Cost Simulator
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-primary transition-colors">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-semibold text-foreground uppercase tracking-wider">Technology</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/zunxii/costgate/blob/master/template.yaml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  AWS SAM Template
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zunxii/costgate/tree/master/app/analyzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  EXPLAIN Parser
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zunxii/costgate/tree/master/app/cost_engine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  FinOps Cost Engine
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zunxii/costgate/blob/master/db/schema.sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  PostgreSQL 16 Schema
                </a>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-semibold text-foreground uppercase tracking-wider">Open Source</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/zunxii/costgate/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/zunxii/costgate/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Pull Requests
                </a>
              </li>
              <li>
                <Link href="/security" className="hover:text-primary transition-colors">
                  Zero Egress Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} CostGate. Automated Cloud Cost Governance.
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-foreground font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
