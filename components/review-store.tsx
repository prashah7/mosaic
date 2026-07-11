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
import { api } from "@/lib/backend-client";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";
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
  const [memory, setMemory] = useState<MemoryRecord[]>([]);
  const [actions, setActions] = useState<KanbanAction[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([api.memory(initiativeId), api.actions(initiativeId)]).then(
      ([nextMemory, nextActions]) => {
        if (!active) return;
        setMemory(nextMemory);
        setActions(nextActions);
      },
    );
    return () => { active = false; };
  }, [initiativeId]);

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
    void api.patchMemory(initiativeId, id, { status: "CONFIRMED" });
  }, [initiativeId]);

  const rejectMemory = useCallback((id: string) => {
    setMemory((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "disputed", proposed: false } : m,
      ),
    );
    void api.patchMemory(initiativeId, id, { status: "DISPUTED" });
  }, [initiativeId]);

  const approveAction = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, approvalStatus: "APPROVED" } : a,
      ),
    );
    void api.patchAction(initiativeId, id, { status: "APPROVED" });
  }, [initiativeId]);

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
    void api.patchAction(initiativeId, id, {
      status: column === "DONE" ? "DONE" : column === "DOING" ? "IN_PROGRESS" : "APPROVED",
    });
  }, [initiativeId]);

  const setActionOwner = useCallback((id: string, ownerName: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ownerName } : a)),
    );
    void api.patchAction(initiativeId, id, { owner: ownerName });
  }, [initiativeId]);

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
    for (const record of memory.filter((item) => item.proposed)) {
      void api.patchMemory(initiativeId, record.id, { status: record.status === "disputed" ? "DISPUTED" : "CONFIRMED" });
    }
    for (const action of actions.filter((item) => item.approvalStatus === "PROPOSED")) {
      void api.patchAction(initiativeId, action.id, { status: "APPROVED" });
    }
  }, [actions, initiativeId, memory]);

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
