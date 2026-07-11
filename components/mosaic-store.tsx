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
  findings as seedFindings,
  remediations as seedRemediations,
  verificationResults as seedVerification,
} from "@/lib/mosaic-data";
import { readinessBreakdown } from "@/lib/readiness";
import type {
  Finding,
  FindingStatus,
  RemediationAction,
  VerificationResult,
} from "@/lib/types";

type MosaicStore = {
  findings: Finding[];
  remediations: RemediationAction[];
  verifications: VerificationResult[];
  score: number;
  label: string;
  updateFindingStatus: (id: string, status: FindingStatus) => void;
  updateRemediation: (
    id: string,
    patch: Partial<RemediationAction>,
  ) => void;
  approveRemediation: (id: string) => void;
  rejectRemediation: (id: string) => void;
  executeRemediation: (id: string) => void;
  runVerification: () => void;
  generateRemediationsVisible: boolean;
  setGenerateRemediationsVisible: (value: boolean) => void;
};

const MosaicStoreContext = createContext<MosaicStore | null>(null);

export const MosaicStoreProvider = ({
  runId,
  children,
}: {
  runId: string;
  children: ReactNode;
}) => {
  const [findings, setFindings] = useState(
    () => seedFindings.filter((f) => f.runId === runId),
  );
  const [remediations, setRemediations] = useState(() => {
    const ids = seedFindings
      .filter((f) => f.runId === runId)
      .map((f) => f.id);
    return seedRemediations.filter((r) => ids.includes(r.findingId));
  });
  const [verifications, setVerifications] =
    useState<VerificationResult[]>(seedVerification);
  const [generateRemediationsVisible, setGenerateRemediationsVisible] =
    useState(false);

  const { score, label } = useMemo(
    () => readinessBreakdown(findings),
    [findings],
  );

  const updateFindingStatus = useCallback(
    (id: string, status: FindingStatus) => {
      setFindings((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f)),
      );
      if (status === "ACCEPTED") {
        setGenerateRemediationsVisible(true);
      }
    },
    [],
  );

  const updateRemediation = useCallback(
    (id: string, patch: Partial<RemediationAction>) => {
      setRemediations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...patch,
                approvalStatus:
                  patch.content && patch.content !== r.content
                    ? "EDITED"
                    : (patch.approvalStatus ?? r.approvalStatus),
              }
            : r,
        ),
      );
    },
    [],
  );

  const approveRemediation = useCallback((id: string) => {
    setRemediations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.requiresHumanInput && !r.humanInputValue?.trim()) {
          return { ...r, executionStatus: "BLOCKED" };
        }
        return {
          ...r,
          approvalStatus: r.approvalStatus === "EDITED" ? "EDITED" : "APPROVED",
          approvedBy: "Sambit Nayak",
          approvedAt: new Date().toISOString(),
          executionStatus:
            r.requiresHumanInput && !r.humanInputValue?.trim()
              ? "BLOCKED"
              : "NOT_STARTED",
        };
      }),
    );
  }, []);

  const rejectRemediation = useCallback((id: string) => {
    setRemediations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              approvalStatus: "REJECTED",
              executionStatus: "NOT_STARTED",
            }
          : r,
      ),
    );
  }, []);

  const executeRemediation = useCallback((id: string) => {
    setRemediations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (
          r.approvalStatus !== "APPROVED" &&
          r.approvalStatus !== "EDITED"
        ) {
          return r;
        }
        if (r.requiresHumanInput && !r.humanInputValue?.trim()) {
          return { ...r, executionStatus: "BLOCKED" };
        }
        if (r.type === "CREATE_GITHUB_ISSUE") {
          const issueNum = 240 + Math.floor(Math.random() * 8);
          return {
            ...r,
            executionStatus: "COMPLETED",
            externalId: String(issueNum),
            externalUrl: `https://github.com/northline/platform/issues/${issueNum}`,
            simulatedNote: `Simulated GitHub issue #${issueNum} created. No live API call was made.`,
          };
        }
        if (r.type === "PRD_EDIT") {
          return {
            ...r,
            executionStatus: "COMPLETED",
            simulatedNote: "PRD revision saved inside Mosaic (simulated).",
          };
        }
        if (r.type === "REQUEST_HUMAN_OWNER") {
          return {
            ...r,
            executionStatus: "COMPLETED",
            simulatedNote: `Owner request recorded: ${r.humanInputValue}`,
          };
        }
        return {
          ...r,
          executionStatus: "COMPLETED",
          simulatedNote: "Action recorded in Mosaic (simulated).",
        };
      }),
    );
  }, []);

  const runVerification = useCallback(() => {
    setVerifications(() => {
      const results: VerificationResult[] = remediations
        .filter((r) => r.executionStatus === "COMPLETED")
        .map((r) => {
          const finding = findings.find((f) => f.id === r.findingId);
          if (r.type === "CREATE_GITHUB_ISSUE" && r.findingId === "find_1") {
            return {
              id: `ver_${r.id}`,
              findingId: r.findingId,
              actionId: r.id,
              outcome: "PARTIALLY_RESOLVED" as const,
              summary:
                "Issue exists, but ownership is still missing. Finding remains partially resolved.",
              remainingRisk: "Human owner still required for audit logging.",
            };
          }
          if (r.type === "PRD_EDIT") {
            return {
              id: `ver_${r.id}`,
              findingId: r.findingId,
              actionId: r.id,
              outcome: "RESOLVED" as const,
              summary: "PRD now reflects SAML-first / SCIM deferred decision.",
            };
          }
          if (r.type === "CREATE_GITHUB_ISSUE") {
            return {
              id: `ver_${r.id}`,
              findingId: r.findingId,
              actionId: r.id,
              outcome: "RESOLVED" as const,
              summary: `Verified ${r.externalUrl ?? "artifact"} against original finding.`,
            };
          }
          return {
            id: `ver_${r.id}`,
            findingId: r.findingId,
            actionId: r.id,
            outcome:
              finding?.requiresHumanInput && !r.humanInputValue
                ? ("OPEN" as const)
                : ("PARTIALLY_RESOLVED" as const),
            summary: "Verification agent checked approved action independently.",
            remainingRisk: finding?.humanInputNote,
          };
        });
      return results;
    });

    setFindings((prev) =>
      prev.map((f) => {
        const related = remediations.filter(
          (r) => r.findingId === f.id && r.executionStatus === "COMPLETED",
        );
        if (!related.length) return f;
        if (f.id === "find_1") {
          return { ...f, status: "PARTIALLY_RESOLVED" };
        }
        if (related.some((r) => r.type === "PRD_EDIT" || r.type === "CREATE_GITHUB_ISSUE")) {
          return { ...f, status: "RESOLVED" };
        }
        return f;
      }),
    );
  }, [findings, remediations]);

  const value = useMemo(
    () => ({
      findings,
      remediations,
      verifications,
      score,
      label,
      updateFindingStatus,
      updateRemediation,
      approveRemediation,
      rejectRemediation,
      executeRemediation,
      runVerification,
      generateRemediationsVisible,
      setGenerateRemediationsVisible,
    }),
    [
      findings,
      remediations,
      verifications,
      score,
      label,
      updateFindingStatus,
      updateRemediation,
      approveRemediation,
      rejectRemediation,
      executeRemediation,
      runVerification,
      generateRemediationsVisible,
    ],
  );

  return (
    <MosaicStoreContext.Provider value={value}>
      {children}
    </MosaicStoreContext.Provider>
  );
};

export const useMosaicStore = (): MosaicStore => {
  const ctx = useContext(MosaicStoreContext);
  if (!ctx) {
    throw new Error("useMosaicStore must be used within MosaicStoreProvider");
  }
  return ctx;
};
