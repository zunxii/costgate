"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StepAuth } from "@/components/onboarding/step-auth";
import { StepInstallRepo } from "@/components/onboarding/step-install-repo";
import { StepPolicyConfig } from "@/components/onboarding/step-policy-config";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [user, setUser] = useState<{ name: string; username: string; avatar: string } | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<any[]>([]);

  const steps = [
    { number: 1, title: "Authorize GitHub" },
    { number: 2, title: "Select Repositories" },
    { number: 3, title: "Configure FinOps Limits" },
  ];

  const handleAuthComplete = (userData: { name: string; username: string; avatar: string }) => {
    setUser(userData);
    setCurrentStep(2);
  };

  const handleRepoComplete = (repos: any[]) => {
    setSelectedRepos(repos);
    setCurrentStep(3);
  };

  const handlePolicyComplete = async (policy: any) => {
    try {
      await fetch("/api/dashboard/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
    } catch (e) {
      console.warn("Failed to save policy", e);
    }
    router.push("/dashboard?onboarded=true");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900 py-12 px-4 relative overflow-hidden">
      {/* Background Ambient Blur */}
      <div className="absolute top-[-10%] left-[30%] w-[600px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Shield className="size-3.5 text-emerald-500" />
            <span>SOC2 Type II Compliant Setup</span>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="mb-12 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-10" />
            {steps.map((step) => {
              const isDone = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <div key={step.number} className="flex flex-col items-center bg-slate-50 px-2">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-orange-500 text-white shadow-md ring-4 ring-orange-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="size-4" /> : step.number}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 font-mono ${
                      isCurrent ? "text-slate-900 font-bold" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Views */}
        {currentStep === 1 && (
          <StepAuth onComplete={handleAuthComplete} authenticatedUser={user} />
        )}
        {currentStep === 2 && (
          <StepInstallRepo onComplete={handleRepoComplete} />
        )}
        {currentStep === 3 && (
          <StepPolicyConfig onComplete={handlePolicyComplete} />
        )}
      </div>
    </div>
  );
}
