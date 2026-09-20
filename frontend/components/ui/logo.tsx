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
    sm: { icon: 24, text: "text-base" },
    md: { icon: 30, text: "text-lg" },
    lg: { icon: 40, text: "text-2xl" },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group cursor-pointer select-none", className)}>
      <div className="relative overflow-hidden rounded-lg transition-transform duration-200 group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="CostGate Logo"
          width={dimensions.icon * 3}
          height={dimensions.icon * 3}
          className="object-contain"
          style={{ width: dimensions.icon, height: dimensions.icon }}
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-sans font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors", dimensions.text)}>
          Cost<span className="text-orange-500">Gate</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
