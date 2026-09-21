"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
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
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    name?: string;
    github?: { username?: string; avatar?: string; connected?: boolean };
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const body = await res.json();
        if (body?.data?.user) {
          setUser(body.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore error
    }
    setUser(null);
    window.location.href = "/signin";
  };

  const displayName = user?.name || user?.github?.username || user?.email?.split("@")[0] || "User";
  const userAvatar = user?.github?.avatar;

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

        {/* Right Action CTAs / User Auth State */}
        <div className="hidden sm:flex items-center gap-3">
          {!loadingUser && user ? (
            <>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50/50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors shadow-xs"
              >
                <span>Connect Repo</span>
              </Link>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800">
                  {userAvatar ? (
                    <img src={userAvatar} alt={displayName} className="size-4 rounded-full" />
                  ) : (
                    <div className="size-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-mono font-semibold max-w-[110px] truncate">{displayName}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  aria-label="Log out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </>
          ) : !loadingUser ? (
            <>
              <Link
                href="/signin"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "font-semibold text-xs h-8 px-3.5 rounded-md transition-all bg-slate-900 hover:bg-slate-800 text-white"
                )}
              >
                <span>Sign up</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </>
          ) : null}
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
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    {userAvatar ? (
                      <img src={userAvatar} alt={displayName} className="size-6 rounded-full" />
                    ) : (
                      <div className="size-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold font-mono text-slate-800">{displayName}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Signed in
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
