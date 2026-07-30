import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

export interface JobStep {
  id: string;
  stepId: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
  startedAt?: string | Date | null;
  completedAt?: string | Date | null;
}

function formatTime(ms: number) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

function StepTimer({ step }: { step: JobStep }) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!step.startedAt) return;
    
    const start = new Date(step.startedAt).getTime();
    
    if (step.status === "completed" || step.status === "failed") {
      const end = step.completedAt ? new Date(step.completedAt).getTime() : new Date().getTime();
      setElapsed(end - start);
      return;
    }

    if (step.status === "processing") {
      const updateElapsed = () => {
        setElapsed(new Date().getTime() - start);
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [step.startedAt, step.completedAt, step.status]);

  if (!step.startedAt || step.status === "pending") return null;

  return (
    <span className="text-[11px] text-muted-foreground ml-2 tabular-nums">
      ({formatTime(elapsed)})
    </span>
  );
}

export function JobStepper({ steps, className }: { steps: JobStep[], className?: string }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3 py-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed";
        const isProcessing = step.status === "processing";
        const isFailed = step.status === "failed";
        const isPending = step.status === "pending";

        return (
          <div key={step.id} className="flex gap-3 relative">
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "absolute top-5 bottom-[-12px] left-[9px] w-[2px] z-0",
                  isCompleted ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-800"
                )}
              />
            )}
            
            {/* Status Icon */}
            <div className="z-10 mt-0.5">
              {isCompleted && <CheckCircle2 className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950 rounded-full" size={20} />}
              {isProcessing && <Loader2 className="text-blue-500 animate-spin bg-background rounded-full" size={20} />}
              {isFailed && <AlertCircle className="text-red-500 bg-red-50 dark:bg-red-950 rounded-full" size={20} />}
              {isPending && <Circle className="text-gray-300 dark:text-gray-700 bg-background rounded-full" size={20} />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center">
                <div className={cn(
                  "text-sm font-medium",
                  isCompleted ? "text-foreground" : 
                  isProcessing ? "text-blue-600 dark:text-blue-400" :
                  isFailed ? "text-red-600 dark:text-red-400" :
                  "text-muted-foreground"
                )}>
                  {step.name}
                </div>
                <StepTimer step={step} />
              </div>
              {isFailed && step.error && (
                <div className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-950/30 p-2 rounded-md">
                  {step.error}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
