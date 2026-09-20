"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/types";

interface ErrorStateProps {
  error: ApiError | string;
  requestId?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  error,
  requestId,
  onRetry,
  title = "Backend Service Unavailable",
}: ErrorStateProps) {
  const code = typeof error === "string" ? "BACKEND_ERROR" : error.code;
  const message =
    typeof error === "string"
      ? error
      : error.message || "Failed to fetch data from CostGate backend API.";

  return (
    <div className="w-full rounded-md border border-red-200 bg-red-50/50 p-4 sm:p-5 text-left text-xs font-sans space-y-3 shadow-xs">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-red-900 text-xs">{title}</h4>
            <span className="font-mono text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
              {code}
            </span>
          </div>
          <p className="text-red-700 leading-relaxed text-[11px]">{message}</p>

          {requestId && (
            <div className="text-[10px] font-mono text-red-500 pt-1">
              Request ID: <span className="font-bold">{requestId}</span>
            </div>
          )}
        </div>
      </div>

      {onRetry && (
        <div className="pt-2 border-t border-red-200/60 flex items-center justify-end">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
}
