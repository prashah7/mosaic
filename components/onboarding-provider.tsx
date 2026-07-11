"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OnboardingStepId =
  | "welcome"
  | "account"
  | "workspace"
  | "initiative"
  | "evidence"
  | "first-run"
  | "complete";

type OnboardingState = {
  hydrated: boolean;
  completed: boolean;
  dismissedChecklist: boolean;
  currentStep: OnboardingStepId;
  workspaceName: string;
  companyName: string;
  role: string;
  initiativeName: string;
  objective: string;
  successMetric: string;
  stage: string;
  evidenceTitle: string;
  evidenceContent: string;
  luciInstruction: string;
  setField: (key: keyof Omit<
    OnboardingState,
    | "hydrated"
    | "completed"
    | "dismissedChecklist"
    | "currentStep"
    | "setField"
    | "goTo"
    | "complete"
    | "dismissChecklist"
    | "reset"
  >, value: string) => void;
  goTo: (step: OnboardingStepId) => void;
  complete: () => void;
  dismissChecklist: () => void;
  reset: () => void;
};

const STORAGE_KEY = "mosaic-onboarding-v1";

const defaults = {
  completed: false,
  dismissedChecklist: false,
  currentStep: "welcome" as OnboardingStepId,
  workspaceName: "Sambit's workspace",
  companyName: "Northline Software",
  role: "Product Manager",
  initiativeName: "Enterprise SSO launch",
  objective:
    "Launch SAML SSO for three enterprise design partners by September 30.",
  successMetric: "Three design partners activated on SAML",
  stage: "Engineering readiness",
  evidenceTitle: "Architecture planning — July 8",
  evidenceContent:
    "Priya: For v1 we ship SAML first and revisit SCIM later. Marcus: Admins need a Test Connection action.",
  luciInstruction:
    "Prepare us for engineering review using the PRD, planning transcript, and current tickets.",
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof defaults>;
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const setField = useCallback(
    (key: keyof typeof defaults, value: string) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const goTo = useCallback((step: OnboardingStepId) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const complete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completed: true,
      currentStep: "complete",
    }));
  }, []);

  const dismissChecklist = useCallback(() => {
    setState((prev) => ({ ...prev, dismissedChecklist: true }));
  }, []);

  const reset = useCallback(() => {
    setState(defaults);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      ...state,
      setField: setField as OnboardingState["setField"],
      goTo,
      complete,
      dismissChecklist,
      reset,
    }),
    [hydrated, state, setField, goTo, complete, dismissChecklist, reset],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingState => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
};
