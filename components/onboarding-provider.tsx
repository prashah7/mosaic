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

export type DemoProgressKey =
  | "entered"
  | "saw_pre"
  | "reviewed_post"
  | "approved_actions"
  | "checked_memory";

type OnboardingState = {
  hydrated: boolean;
  completed: boolean;
  dismissedChecklist: boolean;
  workspaceName: string;
  companyName: string;
  role: string;
  progress: Record<DemoProgressKey, boolean>;
  setField: (
    key: "workspaceName" | "companyName" | "role",
    value: string,
  ) => void;
  markProgress: (key: DemoProgressKey) => void;
  complete: () => void;
  dismissChecklist: () => void;
  reset: () => void;
  nextAction: {
    label: string;
    href: string;
    hint: string;
  };
};

const STORAGE_KEY = "mosaic-onboarding-v2";

const defaultProgress: Record<DemoProgressKey, boolean> = {
  entered: false,
  saw_pre: false,
  reviewed_post: false,
  approved_actions: false,
  checked_memory: false,
};

const defaults = {
  completed: false,
  dismissedChecklist: false,
  workspaceName: "Sambit's workspace",
  companyName: "Northline Software",
  role: "Product Manager",
  progress: defaultProgress,
};

const OnboardingContext = createContext<OnboardingState | null>(null);

const resolveNextAction = (
  progress: Record<DemoProgressKey, boolean>,
): OnboardingState["nextAction"] => {
  if (!progress.saw_pre) {
    return {
      label: "Prepare for eng sync",
      hint: "Ask Luci for a pre-meeting brief",
      href: "/initiatives/init_sso/ask?type=PRE_MEETING",
    };
  }
  if (!progress.reviewed_post) {
    return {
      label: "Synthesize the meeting",
      hint: "Run post-meeting synthesis with the transcript",
      href: "/initiatives/init_sso/ask?type=POST_MEETING",
    };
  }
  if (!progress.approved_actions) {
    return {
      label: "Review follow-ups",
      hint: "Approve memory and Kanban in one moment",
      href: "/initiatives/init_sso/runs/run_post_1",
    };
  }
  if (!progress.checked_memory) {
    return {
      label: "Check remembered decisions",
      hint: "See M3 facts with provenance",
      href: "/initiatives/init_sso/memory",
    };
  }
  return {
    label: "Ask Luci again",
    hint: "Weekly review or another brief",
    href: "/initiatives/init_sso/ask",
  };
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof defaults>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          progress: { ...defaultProgress, ...parsed.progress },
        }));
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
    (key: "workspaceName" | "companyName" | "role", value: string) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const markProgress = useCallback((key: DemoProgressKey) => {
    setState((prev) => {
      const progress = { ...prev.progress, [key]: true };
      const allDone = Object.values(progress).every(Boolean);
      return {
        ...prev,
        progress,
        completed: allDone ? true : prev.completed,
      };
    });
  }, []);

  const complete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completed: true,
      progress: { ...prev.progress, entered: true },
    }));
  }, []);

  const dismissChecklist = useCallback(() => {
    setState((prev) => ({ ...prev, dismissedChecklist: true }));
  }, []);

  const reset = useCallback(() => {
    setState(defaults);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const nextAction = useMemo(
    () => resolveNextAction(state.progress),
    [state.progress],
  );

  const value = useMemo(
    () => ({
      hydrated,
      ...state,
      setField,
      markProgress,
      complete,
      dismissChecklist,
      reset,
      nextAction,
    }),
    [
      hydrated,
      state,
      setField,
      markProgress,
      complete,
      dismissChecklist,
      reset,
      nextAction,
    ],
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
