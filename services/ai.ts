
import { AnalysisResponse, Mode, OpponentType, UserGoal, PlanType, Round, Case } from "../types";
import { DEMO_SCENARIOS } from "./demo_scenarios";

interface AnalysisParams {
  opponentType: OpponentType;
  mode: Mode;
  goal: UserGoal;
  contextSummary: string;
  historyText: string;
  currentText: string;
  planType?: PlanType;
  useDeepThinking?: boolean;
  demoScenarioId?: string;
  roundIndex?: number;
  senderIdentity?: string;
}

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
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || "Analysis failed.");
    }

    return (await response.json()) as AnalysisResponse;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    if (error instanceof Error) {
      throw new Error(`AI Analysis Failed: ${error.message}`);
    }
    throw new Error("Unable to connect to analysis service.");
  }
};

export const reviseResponse = async (originalText: string, instruction: string): Promise<string> => {
  try {
    const response = await fetch("/api/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalText, instruction }),
    });

    if (!response.ok) {
      throw new Error("Failed to revise text");
    }

    const data = await response.json();
    return data?.text || originalText;
  } catch (e) {
    console.error("Revision failed", e);
    throw new Error("Failed to revise text");
  }
};

export const summarizeCase = async (rounds: Round[], caseInfo: Case): Promise<string> => {
  if (caseInfo.planType === 'demo') {
      return `(Demo Summary) Previous conflict with ${caseInfo.opponentType} regarding: ${caseInfo.title}. Last status: Unresolved.`;
  }

  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rounds, caseInfo }),
    });

    if (!response.ok) {
      return "Summary unavailable.";
    }

    const data = await response.json();
    return data?.summary || "Summary unavailable.";

  } catch (e) {
    console.error(e);
    return `Summary unavailable for case: ${caseInfo.title}`;
  }
};
