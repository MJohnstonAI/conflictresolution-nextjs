
import { supabase } from './supabase';
import {
  Case,
  Round,
  UserAccount,
  ResponseTemplate,
  SuccessStory,
  UserRole,
  OpponentType,
  Mode,
  PlanType,
  Theme,
  SessionEvent,
  PurchaseEvent,
} from '../types';
import { getClientAuthHeaders } from "@/lib/client/auth-headers";

// --- FALLBACK DATA (Offline Mode) ---
const FALLBACK_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'fb_1',
    title: 'The Silent Treatment',
    content: "My partner shuts down and refuses to speak for days whenever I bring up an issue. It makes me feel anxious and desperate to fix it, even when I didn't do anything wrong.",
    opponentType: 'Partner',
    mode: 'Peacekeeper',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'standard'
  },
  {
    id: 'fb_2',
    title: 'Security Deposit Hostage',
    content: "My landlord is withholding my entire security deposit citing 'professional cleaning fees' and 'wear and tear' despite me leaving the place spotless and having move-out photos.",
    opponentType: 'Landlord',
    mode: 'Barrister',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'premium'
  },
  {
    id: 'fb_3',
    title: 'Startup Equity Dispute',
    content: "My co-founder wants to renegotiate our 50/50 split to 70/30 in their favor because they 'came up with the original idea', despite me building the entire product.",
    opponentType: 'Colleague',
    mode: 'Barrister',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'premium'
  },
  {
    id: 'fb_4',
    title: 'The "Friend" Loan',
    content: "I lent money to a friend months ago. They keep posting vacation photos on Instagram but ignore my texts asking when they can pay me back.",
    opponentType: 'Friend',
    mode: 'Peacekeeper',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'standard'
  },
  {
    id: 'fb_5',
    title: 'Boundary Crushing Parent',
    content: "My mother shows up unannounced and criticizes my parenting/housekeeping. When I ask her to call first, she plays the victim.",
    opponentType: 'Family',
    mode: 'Peacekeeper',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'standard'
  },
  {
    id: 'fb_6',
    title: 'Freelance Payment Ghosting',
    content: "I submitted the final design assets three weeks ago. The client loved them but has stopped responding to my invoices.",
    opponentType: 'Client',
    mode: 'Barrister',
    createdAt: new Date().toISOString(),
    isPublic: true,
    recommendedPlan: 'premium'
  }
];

const FALLBACK_STORIES: SuccessStory[] = [
  {
    id: 'fb_s1',
    author: 'Short Changed',
    role: 'Small Business Owner',
    text: 'I used the Barrister mode to reply to a client who refused to pay an invoice. They paid within an hour of receiving the email. Incredible.',
    stars: 5,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'fb_s2',
    author: 'Loving Dad',
    role: 'Co-Parent',
    text: 'My ex sends these long, ranting emails. The Grey Rock mode helped me strip out the emotion and just reply to the logistics. It saved my sanity.',
    stars: 5,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'fb_s3',
    author: 'Fair Play Seeker',
    role: 'Tenant',
    text: 'My landlord tried to keep my deposit. I pasted his email here, got a legal-sounding response pointing out the local laws, and he wired the money back the next day.',
    stars: 5,
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

// --- DB MAPPING UTILS ---

const mapCaseFromDB = (row: any): Case => {
  const planType = row.plan_type;
  const roundsLimitRaw = Number(row.rounds_limit);
  const roundsUsedRaw = Number(row.rounds_used);
  const roundsLimit =
    Number.isFinite(roundsLimitRaw) && roundsLimitRaw > 0 ? roundsLimitRaw : 0;
  const roundsUsed = Number.isFinite(roundsUsedRaw) && roundsUsedRaw >= 0 ? roundsUsedRaw : 0;

  return {
    id: row.id,
    title: row.title,
    opponentType: row.opponent_type,
    createdAt: row.created_at,
    lastUpdatedAt: row.created_at,
    planType: planType,
    roundsLimit,
    roundsUsed,
    isClosed: row.is_closed,
    note: row.note,
    demoScenarioId: row.demo_scenario_id
  };
};

const mapRoundFromDB = (row: any): Round => {
  const data = row.analysis_data || {};
  return {
    id: row.id,
    caseId: row.case_id,
    roundNumber: row.round_number,
    createdAt: row.created_at,
    opponentText: row.opponent_text_encrypted || "",
    senderIdentity: row.sender_identity,
    selectedMode: row.selected_mode,
    // Unpack JSONB analysis_data
    userGoal: data.userGoal || 'Hold boundaries',
    isAnalyzed: true,
    vibeCheck: data.vibeCheck,
    confidenceScore: data.confidenceScore,
    confidenceExplanation: data.confidenceExplanation,
    legalRiskScore: data.legalRiskScore,
    legalRiskExplanation: data.legalRiskExplanation,
    detectedFallacies: data.detectedFallacies,
    analysisSummary: data.analysisSummary,
    responses: data.responses || {},
    expertInsights: data.expertInsights,
    rerollsUsed: data.rerollsUsed || 0,
    modelSlug: data.modelSlug
  };
};

const mapTemplateFromDB = (row: any): ResponseTemplate => ({
    id: row.id,
    title: row.title,
    content: row.content,
    mode: row.mode,
    opponentType: row.opponent_type,
    createdAt: row.created_at,
    isPublic: row.is_public,
    recommendedPlan: row.recommended_plan || 'standard' 
});

const mapStoryFromDB = (row: any): SuccessStory => ({
    id: row.id,
    author: row.author,
    role: row.role,
    text: row.text,
    stars: row.stars,
    isFeatured: row.is_featured,
    createdAt: row.created_at
});

const mapSessionEventFromDB = (row: any): SessionEvent => ({
  id: row.id,
  caseId: row.case_id ?? null,
  roundId: row.round_id ?? null,
  planType: row.plan_type,
  delta: Number(row.delta) || 0,
  reason: row.reason ?? null,
  createdAt: row.created_at,
});

const mapPurchaseEventFromDB = (row: any): PurchaseEvent => ({
  id: row.id,
  planType: row.plan_type,
  quantity: Number(row.quantity) || 0,
  amount: Number(row.amount) || 0,
  currency: row.currency || "USD",
  provider: row.provider || "unknown",
  status: row.status || "pending",
  externalRef: row.external_ref ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

// --- LOCAL STORAGE HELPERS ---
const LS_KEYS = {
  CASES: 'cr_local_cases',
  ROUNDS: 'cr_local_rounds',
  PREMIUM_SESSIONS: 'cr_local_premium_sessions',
  STANDARD_SESSIONS: 'cr_local_standard_sessions',
  LEGACY_PREMIUM_CREDITS: 'cr_local_premium_credits',
  LEGACY_STANDARD_CREDITS: 'cr_local_standard_credits'
};

const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getLocalSessionBalance = () => {
  const premium = parseInt(localStorage.getItem(LS_KEYS.PREMIUM_SESSIONS) || '0');
  const standard = parseInt(localStorage.getItem(LS_KEYS.STANDARD_SESSIONS) || '0');
  if (premium > 0 || standard > 0) {
    return { premium, standard };
  }

  const legacyPremiumCredits = parseInt(localStorage.getItem(LS_KEYS.LEGACY_PREMIUM_CREDITS) || '0');
  const legacyStandardCredits = parseInt(localStorage.getItem(LS_KEYS.LEGACY_STANDARD_CREDITS) || '0');
  const migratedPremium = legacyPremiumCredits * 40;
  const migratedStandard = legacyStandardCredits * 10;

  if (migratedPremium > 0 || migratedStandard > 0) {
    localStorage.setItem(LS_KEYS.PREMIUM_SESSIONS, migratedPremium.toString());
    localStorage.setItem(LS_KEYS.STANDARD_SESSIONS, migratedStandard.toString());
  }

  return { premium: migratedPremium, standard: migratedStandard };
};

export const store = {
  // --- ACCOUNT & SESSIONS ---
  
  getAccount: async (): Promise<UserAccount> => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        // DEMO / GUEST USER
        if (!user) {
            const sessions = getLocalSessionBalance();
            const localCases = getLocal(LS_KEYS.CASES).length;
            return { 
              premiumSessions: sessions.premium, 
              standardSessions: sessions.standard,
              totalCasesCreated: localCases, 
              isAdmin: false,
              role: 'demo' 
            };
        }

        // 1. Fetch Profile with Lazy-Upsert fallback
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // 2. Resilience: If missing profile (Trigger delay or failure), create it immediately
        if (error || !data) {
          console.warn("Profile sync delay detected. Performing emergency upsert...");
          const { data: newData, error: createError } = await supabase
            .from('profiles')
            .upsert(
                [{ 
                  id: user.id, 
                  email: user.email, 
                  name: user.user_metadata?.full_name || '',
                  premium_credits: 0, 
                  standard_credits: 0,
                  premium_sessions: 0,
                  standard_sessions: 0,
                  is_admin: false,
                  is_trial: false,
                  theme: 'dark'
                }],
                { onConflict: 'id' }
            )
            .select()
            .single();
          
          if (createError) {
              console.error("Critical: Failed to resolve user profile:", createError);
              throw createError;
          }
          data = newData;
        }

        // 3. Get total cases count for stats
        const { count, error: countError } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        if (countError) throw countError;

        const premiumSessions =
          typeof data?.premium_sessions === 'number'
            ? data.premium_sessions
            : (data?.premium_credits || 0) * 40;
        const standardSessions =
          typeof data?.standard_sessions === 'number'
            ? data.standard_sessions
            : (data?.standard_credits || 0) * 10;
        
        // HARDCODED ADMIN CHECK
        const isHardcodedAdmin = user.email === 'marcaj777@gmail.com';
        const isAdmin = !!data?.is_admin || isHardcodedAdmin;
        const isTrial = !!data?.is_trial; 
        
        let role: UserRole = 'paid';
        if (isAdmin) {
          role = 'admin';
        } else if (isTrial) {
          role = 'trial';
        }

        return {
          name: data?.name || user.user_metadata?.full_name || '',
          premiumSessions,
          standardSessions,
          isAdmin,
          role,
          totalCasesCreated: count || 0,
          theme: data?.theme as Theme 
        };
    } catch (e) {
        console.warn("Account sync failed:", e);
        throw e;
    }
  },

  updateUserTheme: async (theme: Theme): Promise<void> => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (user) {
            await supabase
                .from('profiles')
                .update({ theme: theme })
                .eq('id', user.id);
        }
    } catch (e) {
        console.warn("Theme synchronization failed:", e);
    }
  },

  addSessions: async (type: 'standard' | 'premium', amount: number): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const lsKey = type === 'premium' ? LS_KEYS.PREMIUM_SESSIONS : LS_KEYS.STANDARD_SESSIONS;
        const dbCol = type === 'premium' ? 'premium_sessions' : 'standard_sessions';

        if (!user) {
            isGuest = true;
            const current = parseInt(localStorage.getItem(lsKey) || '0');
            localStorage.setItem(lsKey, (current + amount).toString());
            return;
        }

        const { data } = await supabase.from('profiles').select(dbCol).eq('id', user.id).single();
        const current = data?.[dbCol] || 0;

        await supabase
          .from('profiles')
          .update({ [dbCol]: current + amount })
          .eq('id', user.id);
    } catch (e) {
        if (!isGuest) throw e;
        const lsKey = type === 'premium' ? LS_KEYS.PREMIUM_SESSIONS : LS_KEYS.STANDARD_SESSIONS;
        const current = parseInt(localStorage.getItem(lsKey) || '0');
        localStorage.setItem(lsKey, (current + amount).toString());
    }
  },

  updateCaseDetails: async (
    caseId: string,
    updates: { opponentType: string; title: string; note: string }
  ): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
            isGuest = true;
            const cases = getLocal<Case>(LS_KEYS.CASES);
            const index = cases.findIndex(c => c.id === caseId);
            if (index >= 0) {
                cases[index] = {
                    ...cases[index],
                    opponentType: updates.opponentType,
                    title: updates.title,
                    note: updates.note
                };
                setLocal(LS_KEYS.CASES, cases);
            }
            return;
        }

        const { data, error } = await supabase
          .from('cases')
          .update({
              opponent_type: updates.opponentType,
              title: updates.title,
              note: updates.note || null
          })
          .eq('id', caseId)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error("Case not found");
        }
    } catch (e) {
        if (!isGuest) throw e;
        const cases = getLocal<Case>(LS_KEYS.CASES);
        const index = cases.findIndex(c => c.id === caseId);
        if (index >= 0) {
            cases[index] = {
                ...cases[index],
                opponentType: updates.opponentType,
                title: updates.title,
                note: updates.note
            };
            setLocal(LS_KEYS.CASES, cases);
        }
    }
  },
  
  // --- CASES ---
  
  getCases: async (): Promise<Case[]> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const cases = getLocal<Case>(LS_KEYS.CASES);
            return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapCaseFromDB);
    } catch (error) {
        if (isGuest) {
            console.warn("Network unreachable, fetching local storage cases.");
            return getLocal<Case>(LS_KEYS.CASES).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        throw error;
    }
  },

  getCase: async (id: string): Promise<Case | undefined> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const localCases = getLocal<Case>(LS_KEYS.CASES);
            return localCases.find(c => c.id === id);
        }

        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return undefined;
        return mapCaseFromDB(data);
    } catch (e) {
        if (isGuest) {
            const localCases = getLocal<Case>(LS_KEYS.CASES);
            return localCases.find(c => c.id === id);
        }
        throw e;
    }
  },

  saveCase: async (newCase: Case): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const cases = getLocal<Case>(LS_KEYS.CASES);
            const index = cases.findIndex(c => c.id === newCase.id);
            if (index >= 0) cases[index] = newCase;
            else cases.push(newCase);
            setLocal(LS_KEYS.CASES, cases);
            return;
        }

        const payload = {
            id: newCase.id,
            user_id: user.id,
            title: newCase.title,
            opponent_type: newCase.opponentType,
            plan_type: newCase.planType,
            rounds_limit: newCase.roundsLimit,
            rounds_used: newCase.roundsUsed,
            is_closed: newCase.isClosed,
            note: newCase.note || null,
            demo_scenario_id: newCase.demoScenarioId || null
        };

        const { error } = await supabase.from('cases').upsert(payload);
        if (error) throw error;
    } catch (e) {
        if (!isGuest) throw e;
        const cases = getLocal<Case>(LS_KEYS.CASES);
        const index = cases.findIndex(c => c.id === newCase.id);
        if (index >= 0) cases[index] = newCase;
        else cases.push(newCase);
        setLocal(LS_KEYS.CASES, cases);
    }
  },

  deleteCase: async (id: string): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const cases = getLocal<Case>(LS_KEYS.CASES).filter(c => c.id !== id);
            setLocal(LS_KEYS.CASES, cases);
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS).filter(r => r.caseId !== id);
            setLocal(LS_KEYS.ROUNDS, rounds);
            return;
        }

        const { error } = await supabase.from('cases').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        if (!isGuest) throw e;
        const cases = getLocal<Case>(LS_KEYS.CASES).filter(c => c.id !== id);
        setLocal(LS_KEYS.CASES, cases);
    }
  },

  // --- ROUNDS ---
  
  getRounds: async (caseId: string): Promise<Round[]> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
            return rounds.filter(r => r.caseId === caseId).sort((a, b) => a.roundNumber - b.roundNumber);
        }

        const { data, error } = await supabase
          .from('rounds')
          .select('*')
          .eq('case_id', caseId)
          .order('round_number', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapRoundFromDB);
    } catch (e) {
        if (isGuest) {
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
            return rounds.filter(r => r.caseId === caseId).sort((a, b) => a.roundNumber - b.roundNumber);
        }
        throw e;
    }
  },

  updateCaseNote: async (caseId: string, note: string): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
            isGuest = true;
            const cases = getLocal<Case>(LS_KEYS.CASES);
            const index = cases.findIndex(c => c.id === caseId);
            if (index >= 0) {
                cases[index] = { ...cases[index], note };
                setLocal(LS_KEYS.CASES, cases);
            }
            return;
        }

        const { data, error } = await supabase
          .from('cases')
          .update({ note: note || null })
          .eq('id', caseId)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error("Case not found");
        }
    } catch (e) {
        if (!isGuest) throw e;
        const cases = getLocal<Case>(LS_KEYS.CASES);
        const index = cases.findIndex(c => c.id === caseId);
        if (index >= 0) {
            cases[index] = { ...cases[index], note };
            setLocal(LS_KEYS.CASES, cases);
        }
    }
  },

  saveRound: async (newRound: Round): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
            isGuest = true;
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
            const index = rounds.findIndex(r => r.id === newRound.id);
            if (index >= 0) rounds[index] = newRound;
            else rounds.push(newRound);
            setLocal(LS_KEYS.ROUNDS, rounds);
            return;
        }

        const analysisData = {
            vibeCheck: newRound.vibeCheck,
            confidenceScore: newRound.confidenceScore,
            confidenceExplanation: newRound.confidenceExplanation,
            legalRiskScore: newRound.legalRiskScore,
            legalRiskExplanation: newRound.legalRiskExplanation,
            detectedFallacies: newRound.detectedFallacies,
            analysisSummary: newRound.analysisSummary,
            responses: newRound.responses,
            expertInsights: newRound.expertInsights,
            userGoal: newRound.userGoal,
            rerollsUsed: newRound.rerollsUsed,
            modelSlug: newRound.modelSlug
        };

        const payload = {
            id: newRound.id,
            case_id: newRound.caseId,
            user_id: user.id,
            round_number: newRound.roundNumber,
            // FIXED: Using corrected property names from Round interface
            opponent_text_encrypted: newRound.opponentText || "",
            sender_identity: newRound.senderIdentity || null,
            selected_mode: newRound.selectedMode,
            analysis_data: analysisData
        };

        const { error } = await supabase.from('rounds').upsert(payload);
        if (error) throw error;
    } catch (e) {
        if (!isGuest) throw e;
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        const index = rounds.findIndex(r => r.id === newRound.id);
        if (index >= 0) rounds[index] = newRound;
        else rounds.push(newRound);
        setLocal(LS_KEYS.ROUNDS, rounds);
    }
  },

  updateRound: async (newRound: Round): Promise<void> => {
    let isGuest = false;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
            isGuest = true;
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
            const index = rounds.findIndex(r => r.id === newRound.id);
            if (index >= 0) {
                rounds[index] = newRound;
                setLocal(LS_KEYS.ROUNDS, rounds);
            }
            return;
        }

        const analysisData = {
            vibeCheck: newRound.vibeCheck,
            confidenceScore: newRound.confidenceScore,
            confidenceExplanation: newRound.confidenceExplanation,
            legalRiskScore: newRound.legalRiskScore,
            legalRiskExplanation: newRound.legalRiskExplanation,
            detectedFallacies: newRound.detectedFallacies,
            analysisSummary: newRound.analysisSummary,
            responses: newRound.responses,
            expertInsights: newRound.expertInsights,
            userGoal: newRound.userGoal,
            rerollsUsed: newRound.rerollsUsed,
            modelSlug: newRound.modelSlug
        };

        const payload = {
            opponent_text_encrypted: newRound.opponentText || "",
            sender_identity: newRound.senderIdentity || null,
            selected_mode: newRound.selectedMode,
            analysis_data: analysisData
        };

        const { data, error } = await supabase
          .from('rounds')
          .update(payload)
          .eq('id', newRound.id)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error("Round not found");
        }
    } catch (e) {
        if (!isGuest) throw e;
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        const index = rounds.findIndex(r => r.id === newRound.id);
        if (index >= 0) {
            rounds[index] = newRound;
            setLocal(LS_KEYS.ROUNDS, rounds);
        }
    }
  },

  getRoundsByIds: async (roundIds: string[]): Promise<Round[]> => {
    if (!roundIds.length) return [];
    let isGuest = false;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!user) {
        isGuest = true;
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        return rounds.filter(r => roundIds.includes(r.id));
      }

      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .in('id', roundIds);
      if (error) throw error;
      return (data || []).map(mapRoundFromDB);
    } catch (e) {
      if (isGuest) {
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        return rounds.filter(r => roundIds.includes(r.id));
      }
      throw e;
    }
  },

  // --- LEDGER ---
  getSessionEvents: async (): Promise<SessionEvent[]> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return [];

      const { data, error } = await supabase
        .from('session_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapSessionEventFromDB);
    } catch (error) {
      console.warn("Session ledger fetch failed:", error);
      return [];
    }
  },

  getPurchaseEvents: async (): Promise<PurchaseEvent[]> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return [];

      const { data, error } = await supabase
        .from('purchase_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapPurchaseEventFromDB);
    } catch (error) {
      console.warn("Purchase ledger fetch failed:", error);
      return [];
    }
  },

  getLedgerSnapshot: async (): Promise<{ sessionEvents: SessionEvent[]; purchaseEvents: PurchaseEvent[] }> => {
    try {
      const authHeaders = await getClientAuthHeaders();
      const response = await fetch("/api/ledger", { headers: authHeaders });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Ledger request failed with ${response.status}`);
      }
      const payload = await response.json();
      const sessionEvents = Array.isArray(payload?.sessionEvents)
        ? payload.sessionEvents.map(mapSessionEventFromDB)
        : [];
      const purchaseEvents = Array.isArray(payload?.purchaseEvents)
        ? payload.purchaseEvents.map(mapPurchaseEventFromDB)
        : [];
      return { sessionEvents, purchaseEvents };
    } catch (error) {
      console.warn("Ledger snapshot fetch failed:", error);
      throw error;
    }
  },

  createPurchaseEvent: async (input: {
    planType: "standard" | "premium";
    quantity: number;
    amount: number;
    currency: string;
    provider: string;
    status: "pending" | "confirmed" | "failed";
    externalRef?: string;
  }): Promise<PurchaseEvent | null> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return null;

      const payload = {
        user_id: user.id,
        plan_type: input.planType,
        quantity: input.quantity,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        status: input.status,
        external_ref: input.externalRef ?? null,
      };
      const { data, error } = await supabase
        .from('purchase_events')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return data ? mapPurchaseEventFromDB(data) : null;
    } catch (error) {
      console.warn("Purchase event create failed:", error);
      return null;
    }
  },

  updatePurchaseEventStatus: async (id: string, status: "pending" | "confirmed" | "failed"): Promise<void> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;

      const { error } = await supabase
        .from('purchase_events')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn("Purchase event update failed:", error);
    }
  },

  // --- TEMPLATES ---
  getTemplates: async (): Promise<ResponseTemplate[]> => {
      try {
          const { data, error } = await supabase
              .from('templates')
              .select('*')
              .order('is_public', { ascending: false }) 
              .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (!data || data.length === 0) return FALLBACK_TEMPLATES;
          return data.map(mapTemplateFromDB);
      } catch (error) {
          return FALLBACK_TEMPLATES;
      }
  },

  // --- SUCCESS STORIES ---
  getSuccessStories: async (): Promise<SuccessStory[]> => {
      try {
          const { data, error } = await supabase
              .from('success_stories')
              .select('*')
              .eq('is_featured', true)
              .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (!data || data.length === 0) return FALLBACK_STORIES;
          return data.map(mapStoryFromDB);
      } catch (error) {
          return FALLBACK_STORIES;
      }
  }
};
