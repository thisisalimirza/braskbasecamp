"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type WizardContextValue = {
  step: number;
  totalSteps: number;
  setStep: (n: number) => void;
  next: () => void;
  back: () => void;
  close: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardShell");
  return ctx;
}

export function WizardShell({
  open,
  onOpenChange,
  title,
  totalSteps,
  children,
  initialStep = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  totalSteps: number;
  children: ReactNode;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setStep(initialStep), 200);
  };

  const value: WizardContextValue = {
    step,
    totalSteps,
    setStep,
    next: () => setStep((s) => Math.min(s + 1, totalSteps - 1)),
    back: () => setStep((s) => Math.max(s - 1, 0)),
    close,
  };

  if (!open) return null;

  return (
    <WizardContext.Provider value={value}>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
        <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border bg-background shadow-xl sm:max-h-[85vh] sm:rounded-2xl">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            {step > 0 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={value.back}>
                <ChevronLeft className="size-4" />
              </Button>
            )}
            <div className="flex-1">
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {totalSteps}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
          <div className="border-t px-4 py-2">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  );
}

export function WizardStep({ children, step }: { children: ReactNode; step: number }) {
  const { step: current } = useWizard();
  if (current !== step) return null;
  return <div className="space-y-4">{children}</div>;
}
