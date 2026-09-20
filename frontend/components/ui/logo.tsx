"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, showText = true, size = "md", href = "/" }: LogoProps) {
  const dimensions = {
    sm: { icon: 20, text: "text-xs font-semibold" },
    md: { icon: 24, text: "text-sm font-bold" },
    lg: { icon: 32, text: "text-lg font-bold" },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2 group cursor-pointer select-none", className)}>
      <div className="relative overflow-hidden rounded border border-slate-200 bg-white p-0.5 shadow-xs">
        <Image
          src="/logo.png"
          alt="CostGate Logo"
          width={dimensions.icon * 2}
          height={dimensions.icon * 2}
          className="object-contain"
          style={{ width: dimensions.icon, height: dimensions.icon }}
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-sans tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors", dimensions.text)}>
          Cost<span className="text-orange-600">Gate</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
