"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getActionsForInitiative,
  getMemoryForInitiative,
  SEED_INITIATIVE_ID,
} from "@/lib/mosaic-data";
import type { KanbanAction, MemoryRecord } from "@/lib/types";

type ReviewStore = {
  memory: MemoryRecord[];
  actions: KanbanAction[];
  approveMemory: (id: string) => void;
  rejectMemory: (id: string) => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  moveAction: (id: string, column: KanbanAction["column"]) => void;
  setActionOwner: (id: string, ownerName: string) => void;
  approveAllProposed: () => void;
};

const ReviewContext = createContext<ReviewStore | null>(null);

export const ReviewProvider = ({
  initiativeId = SEED_INITIATIVE_ID,
  children,
}: {
  initiativeId?: string;
  children: ReactNode;
}) => {
  const [memory, setMemory] = useState(() =>
    getMemoryForInitiative(initiativeId),
  );
  const [actions, setActions] = useState(() =>
    getActionsForInitiative(initiativeId),
  );

  const approveMemory = useCallback((id: string) => {
    setMemory((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "confirmed",
              proposed: false,
              lastConfirmedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const rejectMemory = useCallback((id: string) => {
    setMemory((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "disputed", proposed: false } : m,
      ),
    );
  }, []);

  const approveAction = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, approvalStatus: "APPROVED" } : a,
      ),
    );
  }, []);

  const rejectAction = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, approvalStatus: "REJECTED" } : a,
      ),
    );
  }, []);

  const moveAction = useCallback((id: string, column: KanbanAction["column"]) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, column } : a)),
    );
  }, []);

  const setActionOwner = useCallback((id: string, ownerName: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ownerName } : a)),
    );
  }, []);

  const approveAllProposed = useCallback(() => {
    setMemory((prev) =>
      prev.map((m) =>
        m.proposed
          ? {
              ...m,
              status: m.status === "disputed" ? "disputed" : "confirmed",
              proposed: false,
              lastConfirmedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
    setActions((prev) =>
      prev.map((a) =>
        a.approvalStatus === "PROPOSED"
          ? { ...a, approvalStatus: "APPROVED" }
          : a,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      memory,
      actions,
      approveMemory,
      rejectMemory,
      approveAction,
      rejectAction,
      moveAction,
      setActionOwner,
      approveAllProposed,
    }),
    [
      memory,
      actions,
      approveMemory,
      rejectMemory,
      approveAction,
      rejectAction,
      moveAction,
      setActionOwner,
      approveAllProposed,
    ],
  );

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
};

export const useReviewStore = (): ReviewStore => {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReviewStore must be used within ReviewProvider");
  }
  return ctx;
};
