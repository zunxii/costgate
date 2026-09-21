"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export function CtaBanner() {
  return (
    <section className="py-24 md:py-32 bg-white border-t border-slate-200/60">
      <div className="mx-auto max-w-4xl px-6 text-center">
        
        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 mb-6">
          <Sparkles className="size-3.5 text-orange-500" />
          <span>START GUARDING YOUR DATABASE</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Stop bill shocks before merge.
        </h2>
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          Catch expensive SQL execution regressions before merge with the open-source CostGate stack and authenticated application flow.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="/signup"
            className="flex items-center justify-center w-full sm:w-auto bg-slate-900 text-white font-medium text-[15px] h-12 px-8 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition-all"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="size-4 ml-2" />
          </motion.a>
          
          <motion.a
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="https://github.com/zunxii/costgate"
            target="_blank"
            className="flex items-center justify-center w-full sm:w-auto bg-white text-slate-700 font-medium text-[15px] h-12 px-8 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
          >
            <GithubIcon className="size-4 mr-2" />
            <span>Star on GitHub</span>
          </motion.a>
        </div>

      </div>
    </section>
  );
}
