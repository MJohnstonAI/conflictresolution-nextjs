import { Case, Round } from "../types";

const LS_KEYS = {
  CASES: "cr_demo_cases",
  ROUNDS: "cr_demo_rounds",
};

const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const demoStore = {
  getCases: async (): Promise<Case[]> => {
    return getLocal<Case>(LS_KEYS.CASES);
  },

  getCase: async (id: string): Promise<Case | undefined> => {
    const cases = getLocal<Case>(LS_KEYS.CASES);
    return cases.find((c) => c.id === id);
  },

  saveCase: async (newCase: Case): Promise<void> => {
    const normalizedCase = {
      ...newCase,
      lastUpdatedAt: newCase.lastUpdatedAt || newCase.createdAt,
    };
    const cases = getLocal<Case>(LS_KEYS.CASES);
    const index = cases.findIndex((c) => c.id === normalizedCase.id);
    if (index >= 0) cases[index] = normalizedCase;
    else cases.push(normalizedCase);
    setLocal(LS_KEYS.CASES, cases);
  },

  getRounds: async (caseId: string): Promise<Round[]> => {
    const rounds = getLocal<Round>(LS_KEYS.ROUNDS).filter((r) => r.caseId === caseId);
    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  },

  saveRound: async (newRound: Round): Promise<void> => {
    const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
    const index = rounds.findIndex((r) => r.id === newRound.id);
    if (index >= 0) rounds[index] = newRound;
    else rounds.push(newRound);
    setLocal(LS_KEYS.ROUNDS, rounds);
    const cases = getLocal<Case>(LS_KEYS.CASES);
    const caseIndex = cases.findIndex((c) => c.id === newRound.caseId);
    if (caseIndex >= 0) {
      cases[caseIndex] = {
        ...cases[caseIndex],
        lastUpdatedAt: newRound.createdAt,
      };
      setLocal(LS_KEYS.CASES, cases);
    }
  },
};
