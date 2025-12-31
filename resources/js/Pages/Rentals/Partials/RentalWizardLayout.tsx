import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
  StepperContent,
  StepperPanel,
} from "@/components/ui/stepper";

import {
  Check,
  LoaderCircleIcon,
} from "lucide-react";

export type WizardStep = {
  id: number;
  title: string;
  icon: React.ComponentType<any>;
};

type RentalWizardLayoutProps = {
  steps: WizardStep[];
  currentStep: number;
  canNavigateToStep: (stepId: number) => boolean;
  onStepChange: (stepId: number) => void;

  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;

  isFirstStep: boolean;
  isLastStep: boolean;

  nextDisabled?: boolean;
  submitDisabled?: boolean;
  nextLabel?: string;
  submitLabel?: string;

  children: React.ReactNode;
};

export default function RentalWizardLayout({
  steps,
  currentStep,
  canNavigateToStep,
  onStepChange,
  onPrev,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  nextDisabled = false,
  submitDisabled = false,
  nextLabel = "Suivant →",
  submitLabel = "Confirmer la location",
  children,
}: RentalWizardLayoutProps) {
  return (
    <div>
      <div>
        {/* STEPPER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 px-4"
        >
          <Stepper
            value={currentStep}
            onValueChange={(value) => {
              const stepId = Number(value);
              if (canNavigateToStep(stepId)) onStepChange(stepId);
            }}
            indicators={{
              completed: <Check className="size-4" />,
              loading: <LoaderCircleIcon className="size-4 animate-spin" />,
            }}
            className="mx-auto w-full max-w-4xl space-y-8"
          >
            <StepperNav>
              {steps.map((step, index) => {
                const Icon = step.icon;

                // Compute state
                const state =
                  currentStep > step.id
                    ? "completed"
                    : currentStep === step.id
                    ? "active"
                    : "inactive";

                const blocked = !canNavigateToStep(step.id);

                return (
                  <StepperItem
                    key={step.id}
                    step={step.id}
                    className="relative group/step"
                  >
                    <StepperTrigger
                      disabled={blocked}
                      className={[
                        "flex justify-start gap-1.5 items-center",
                        blocked && "opacity-40 cursor-not-allowed",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {/* === EXACT SUCCESS GREEN STATE YOU PROVIDED === */}
                      <StepperIndicator
                        className="
                          size-8 border-2 flex items-center justify-center rounded-full
                          data-[state=completed]:text-white
                          data-[state=completed]:bg-green-500
                          data-[state=inactive]:bg-transparent
                          data-[state=inactive]:border-border
                          data-[state=inactive]:text-muted-foreground
                        "
                      >
                        {state === "completed" ? (
                          <Check className="size-4" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </StepperIndicator>

                      {/* Title hidden on small screens */}
                      <StepperTitle className="hidden md:block text-center">
                        {step.title}
                      </StepperTitle>
                    </StepperTrigger>

                    {/* CONNECTOR (same as your example) */}
                    {steps.length > index + 1 && (
                      <StepperSeparator
                        className="
                          md:mx-2.5 transition-colors
                          group-data-[state=completed]/step:bg-green-500
                        "
                      />
                    )}
                  </StepperItem>
                );
              })}
            </StepperNav>
          </Stepper>
        </motion.div>

        {/* CONTENT */}
        <div className="space-y-4 sm:px-0">{children}</div>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/80 backdrop-blur-sm shadow-lg z-10 lg:left-[16rem]">
        <div className="max-w-6xl mx-auto flex justify-between px-2 sm:px-4 lg:px-8">
          {!isFirstStep ? (
            <Button variant="outline" onClick={onPrev} type="button">
              ← Retour
            </Button>
          ) : (
            <div />
          )}

          {!isLastStep ? (
            <Button type="button" onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
            </Button>
          ) : (
            <Button type="button" onClick={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
