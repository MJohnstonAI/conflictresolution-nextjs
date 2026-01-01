
import { AnalysisResponse, Mode, OpponentType, UserGoal, PlanType, Round, Case } from "../types";
import { DEMO_SCENARIOS } from "./demo_scenarios";
import { supabase } from "./supabase";
import { formatApiErrorMessage, readApiErrorDetails } from "@/lib/client/api-errors";

interface AnalysisParams {
  opponentType: OpponentType;
  mode: Mode;
  goal: UserGoal;
  contextSummary: string;
  historyText: string;
  currentText: string;
  caseId?: string;
  planType?: PlanType;
  useDeepThinking?: boolean;
  demoScenarioId?: string;
  roundIndex?: number;
  senderIdentity?: string;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyzeConflict = async (params: AnalysisParams): Promise<AnalysisResponse> => {
  // 0. Demo Script Interception (Client-side)
  if (params.planType === 'demo' && params.demoScenarioId && params.roundIndex !== undefined) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const scenario = DEMO_SCENARIOS[params.demoScenarioId];
      if (scenario && scenario.rounds[params.roundIndex]) {
          return scenario.rounds[params.roundIndex];
      }
      return {
          vibeCheck: "End of Demo Script.",
          legalRiskScore: 0,
          legalRiskExplanation: "Demo complete.",
          detectedFallacies: [],
          analysisSummary: "You have reached the end of this demo scenario.",
          responses: {
              soft: "Demo Complete.",
              firm: "Demo Complete.",
              nuclear: "Demo Complete.",
              greyRock: "Demo Complete."
          }
      };
  }

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const details = await readApiErrorDetails(response);
      throw new Error(formatApiErrorMessage(details, response.status));
    }

    return (await response.json()) as AnalysisResponse;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to connect to analysis service.");
  }
};

export const reviseResponse = async (
  originalText: string,
  instruction: string,
  planType: PlanType = "standard"
): Promise<string> => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ originalText, instruction, planType }),
    });

    if (!response.ok) {
      const details = await readApiErrorDetails(response);
      throw new Error(formatApiErrorMessage(details, response.status));
    }

    const data = await response.json();
    return data?.text || originalText;
  } catch (e) {
    console.error("Revision failed", e);
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Failed to revise text");
  }
};

export const summarizeCase = async (rounds: Round[], caseInfo: Case): Promise<string> => {
  if (caseInfo.planType === 'demo') {
      return `(Demo Summary) Previous conflict with ${caseInfo.opponentType} regarding: ${caseInfo.title}. Last status: Unresolved.`;
  }

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ rounds, caseInfo }),
    });

    if (!response.ok) {
      const details = await readApiErrorDetails(response);
      return `Summary unavailable. ${formatApiErrorMessage(details, response.status)}`;
    }

    const data = await response.json();
    return data?.summary || "Summary unavailable.";

  } catch (e) {
    console.error(e);
    return `Summary unavailable for case: ${caseInfo.title}`;
  }
};
