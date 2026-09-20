"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, ArrowRight, Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Dashboard", href: "/dashboard", badge: "Console" },
  { label: "PR Studio", href: "/demo", badge: "Live" },
  { label: "Cost Simulator", href: "/calculator" },
  { label: "Architecture", href: "/architecture" },
  { label: "Security", href: "/security" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-border shadow-sm"
          : "bg-background border-border"
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Logo size="sm" href="/" />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono uppercase bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50/50 px-3.5 py-1.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-sm"
          >
            <span>Connect Repo</span>
          </Link>

          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "sm" }), "font-semibold text-sm h-9 px-4 rounded-md transition-all bg-slate-900 hover:bg-slate-800 text-white")}
          >
            <span>Open Console</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground focus:outline-none rounded-md hover:bg-muted"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-muted text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-2 border-t border-border flex flex-col gap-2">
            <a
              href="https://github.com/zunxii/costgate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-card py-2.5 text-sm font-medium text-foreground"
            >
              <GithubIcon className="size-4" />
              View on GitHub
            </a>
            <a
              href="https://github.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "default" }), "w-full font-semibold")}
            >
              Install Free Trial
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
