"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Terminal, ChevronRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const TYPING_SPEED = 50;
const CODE_LINES = [
  "GitHub webhook received",
  "SQS event queued",
  "Extracting supported SQL change",
  "VPC worker running EXPLAIN (ANALYZE, BUFFERS)",
  "Cost policy evaluated",
  "Prediction persisted + GitHub check published",
];

export function Hero() {
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= CODE_LINES.length) return;

    const currentFullLine = CODE_LINES[currentLineIndex];

    if (currentCharIndex < currentFullLine.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex((prev) => prev + 1);
        setTypedLines((prev) => {
          const newLines = [...prev];
          if (newLines[currentLineIndex] === undefined) {
            newLines[currentLineIndex] = "";
          }
          newLines[currentLineIndex] = currentFullLine.substring(0, currentCharIndex + 1);
          return newLines;
        });
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [currentCharIndex, currentLineIndex]);

  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-white">
      
      {/* Hand-crafted CSS Grid Background (Humanized, not AI) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-orange-500 opacity-[0.08] blur-[100px]"></div>

      <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col items-center">
        
        {/* Humanized Announcer */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 mb-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Introducing CostGate v1.0</span>
          <ChevronRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </motion.div>

        {/* Clean, readable typography */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", bounce: 0.2 }}
          className="max-w-4xl font-sans text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 text-center leading-[1.05]"
        >
          Stop bad queries before <br className="hidden sm:block" />
          they hit <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">production.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, type: "spring", bounce: 0.2 }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-500 text-center leading-relaxed"
        >
          A developer-first CI guardrail. For supported SQL changes, CostGate runs <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-sm border border-slate-200">EXPLAIN ANALYZE</code> in the analysis worker and evaluates the resulting cost impact.
        </motion.p>

        {/* Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, type: "spring", bounce: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <motion.a
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="/signup"
            className="flex items-center justify-center w-full sm:w-auto bg-slate-900 text-white font-medium text-[15px] h-12 px-8 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition-all"
          >
            <span>Start Free Trial</span>
          </motion.a>
          
          <motion.a
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="https://github.com/zunxii/costgate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full sm:w-auto bg-white text-slate-700 font-medium text-[15px] h-12 px-8 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
          >
            <GithubIcon className="size-4 mr-2" />
            <span>Star on GitHub</span>
          </motion.a>
        </motion.div>

        {/* Interactive Terminal Window (Human, code-focused) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring", bounce: 0.15 }}
          className="mt-20 w-full max-w-3xl rounded-xl bg-slate-900 shadow-2xl border border-slate-800 overflow-hidden text-left"
        >
          {/* Terminal Header */}
          <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex gap-2">
              <div className="size-3 rounded-full bg-rose-500/80"></div>
              <div className="size-3 rounded-full bg-amber-500/80"></div>
              <div className="size-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="mx-auto text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <Terminal className="size-3" />
              costgate-cli
            </div>
          </div>
          {/* Terminal Body */}
          <div className="p-6 font-mono text-sm leading-relaxed min-h-[220px]">
            {typedLines.map((line, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-slate-600 select-none">~</span>
                <span className={
                  line.includes("Analyzing") ? "text-amber-400" :
                  line.includes("Cost delta") ? "text-rose-400" :
                  line.includes("Done") ? "text-emerald-400" :
                  "text-slate-300"
                }>
                  {line}
                </span>
              </div>
            ))}
            {currentLineIndex < CODE_LINES.length && (
              <div className="inline-block w-2 h-4 bg-slate-400 ml-4 animate-pulse align-middle" />
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
