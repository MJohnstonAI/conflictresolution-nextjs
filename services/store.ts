
import { supabase } from './supabase';
import { Case, Round, UserAccount, ResponseTemplate, SuccessStory, UserRole, OpponentType, Mode, PlanType, Theme } from '../types';

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

type CaseQueryOptions = {
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "last_activity_at";
  ascending?: boolean;
};

type RoundQueryOptions = {
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
};

// --- DB MAPPING UTILS ---

const mapCaseFromDB = (row: any): Case => {
  const planType = row.plan_type;
  const roundsLimitRaw = Number(row.rounds_limit);
  const roundsUsedRaw = Number(row.rounds_used);
  const roundsLimit =
    Number.isFinite(roundsLimitRaw) && roundsLimitRaw >= 0 ? roundsLimitRaw : 0;
  const roundsUsed = Number.isFinite(roundsUsedRaw) && roundsUsedRaw >= 0 ? roundsUsedRaw : 0;

  return {
    id: row.id,
    title: row.title,
    opponentType: row.opponent_type,
    createdAt: row.created_at,
    lastUpdatedAt: row.last_activity_at || row.created_at,
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
    opponentText: row.opponent_text || "",
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

// --- LOCAL STORAGE HELPERS ---
const LS_KEYS = {
  CASES: 'cr_local_cases',
  ROUNDS: 'cr_local_rounds',
  PREMIUM_SESSIONS: 'cr_local_premium_sessions',
  STANDARD_SESSIONS: 'cr_local_standard_sessions'
};

const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const resetGuestSessions = () => {
  localStorage.setItem(LS_KEYS.PREMIUM_SESSIONS, '0');
  localStorage.setItem(LS_KEYS.STANDARD_SESSIONS, '0');
};

export const store = {
  // --- ACCOUNT & CREDITS ---
  
  getAccount: async (): Promise<UserAccount> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // DEMO / GUEST USER
        if (!user) {
            resetGuestSessions();
            const localCases = getLocal(LS_KEYS.CASES).length;
            return { 
              premiumSessions: 0, 
              standardSessions: 0,
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
        const { count } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const premiumSessions = data?.premium_sessions || 0;
        const standardSessions = data?.standard_sessions || 0;
        
        // HARDCODED ADMIN CHECK
        const isHardcodedAdmin = user.email === 'marcaj777@gmail.com';
        const isAdmin = !!data?.is_admin || isHardcodedAdmin;
        const isTrial = !!data?.is_trial; 
        
        let role: UserRole = 'pending';
        if (isAdmin) {
          role = 'admin';
        } else if (isTrial) {
          role = 'trial';
        } else if (premiumSessions > 0 || standardSessions > 0) {
          role = 'paid';
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
        console.warn("Auth sync interrupted, falling back to local guest state.");
        resetGuestSessions();
        const localCases = getLocal(LS_KEYS.CASES).length;
        return { 
          premiumSessions: 0, 
          standardSessions: 0,
          totalCasesCreated: localCases, 
          isAdmin: false,
          role: 'demo' 
        };
    }
  },

  updateUserTheme: async (theme: Theme): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
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
    const dbCol = type === 'premium' ? 'premium_sessions' : 'standard_sessions';
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const user = data?.user;

    if (!user) {
        resetGuestSessions();
        throw new Error("Sign in to purchase sessions.");
    }

    if (amount > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const response = await fetch("/api/sessions/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ planType: type, delta: amount, reason: "purchase" }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to update sessions");
        }
        return;
    }

    const { data: profileData } = await supabase.from('profiles').select(dbCol).eq('id', user.id).single();
    const current = profileData?.[dbCol] || 0;

    await supabase
      .from('profiles')
      .update({ [dbCol]: current + amount })
      .eq('id', user.id);
  },
  
  // --- CASES ---
  
  getCases: async (options?: CaseQueryOptions): Promise<Case[]> => {
    const orderBy =
      options?.orderBy === "last_activity_at" ? "last_activity_at" : "created_at";
    const ascending = options?.ascending ?? false;
    const offset = options?.offset ?? 0;
    const limit = options?.limit;
    const sliceEnd = typeof limit === "number" ? offset + limit : undefined;
    const sortCases = (list: Case[]) => {
      const sorted = [...list].sort((a, b) => {
        const aTime = new Date(
          orderBy === "last_activity_at"
            ? a.lastUpdatedAt || a.createdAt
            : a.createdAt
        ).getTime();
        const bTime = new Date(
          orderBy === "last_activity_at"
            ? b.lastUpdatedAt || b.createdAt
            : b.createdAt
        ).getTime();
        return ascending ? aTime - bTime : bTime - aTime;
      });
      return sorted.slice(offset, sliceEnd);
    };
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const cases = getLocal<Case>(LS_KEYS.CASES);
            return sortCases(cases);
        }

        const selectFields =
          "id, title, opponent_type, plan_type, rounds_limit, rounds_used, is_closed, note, demo_scenario_id, created_at, last_activity_at";

        const fetchWithOrder = async (column: "created_at" | "last_activity_at") => {
          let query = supabase
            .from('cases')
            .select(selectFields)
            .eq('user_id', user.id)
            .order(column, { ascending });
          if (typeof limit === "number") {
            query = query.range(offset, offset + limit - 1);
          }
          return query;
        };

        let { data, error } = await fetchWithOrder(orderBy);
        if (error && orderBy === "last_activity_at" && error.message?.includes("last_activity_at")) {
          ({ data, error } = await fetchWithOrder("created_at"));
        }

        if (error) throw error;
        return (data || []).map(mapCaseFromDB);
    } catch (error) {
        console.warn("Network unreachable, fetching local storage cases.");
        return sortCases(getLocal<Case>(LS_KEYS.CASES));
    }
  },

  getCase: async (id: string): Promise<Case | undefined> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const localCases = getLocal<Case>(LS_KEYS.CASES);
            return localCases.find(c => c.id === id);
        }

        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error || !data) return undefined;
        return mapCaseFromDB(data);
    } catch (e) {
        const localCases = getLocal<Case>(LS_KEYS.CASES);
        return localCases.find(c => c.id === id);
    }
  },

  saveCase: async (newCase: Case): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const normalizedCase = {
              ...newCase,
              lastUpdatedAt: newCase.lastUpdatedAt || newCase.createdAt,
            };
            const cases = getLocal<Case>(LS_KEYS.CASES);
            const index = cases.findIndex(c => c.id === normalizedCase.id);
            if (index >= 0) cases[index] = normalizedCase;
            else cases.push(normalizedCase);
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
        const normalizedCase = {
          ...newCase,
          lastUpdatedAt: newCase.lastUpdatedAt || newCase.createdAt,
        };
        const cases = getLocal<Case>(LS_KEYS.CASES);
        const index = cases.findIndex(c => c.id === normalizedCase.id);
        if (index >= 0) cases[index] = normalizedCase;
        else cases.push(normalizedCase);
        setLocal(LS_KEYS.CASES, cases);
    }
  },

  deleteCase: async (id: string): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const cases = getLocal<Case>(LS_KEYS.CASES).filter(c => c.id !== id);
            setLocal(LS_KEYS.CASES, cases);
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS).filter(r => r.caseId !== id);
            setLocal(LS_KEYS.ROUNDS, rounds);
            return;
        }

        const { error } = await supabase.from('cases').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        const cases = getLocal<Case>(LS_KEYS.CASES).filter(c => c.id !== id);
        setLocal(LS_KEYS.CASES, cases);
    }
  },

  // --- ROUNDS ---
  
  getRounds: async (caseId: string, options?: RoundQueryOptions): Promise<Round[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS).filter(r => r.caseId === caseId);
            const order = options?.order === "desc" ? "desc" : "asc";
            const sorted = rounds.sort((a, b) =>
              order === "desc" ? b.roundNumber - a.roundNumber : a.roundNumber - b.roundNumber
            );
            if (typeof options?.limit === "number") {
              const offset = options?.offset ?? 0;
              return sorted.slice(offset, offset + options.limit);
            }
            return sorted;
        }

        let query = supabase
          .from('rounds')
          .select('*')
          .eq('case_id', caseId)
          .eq('user_id', user.id);
        const orderAsc = options?.order !== "desc";
        query = query.order('round_number', { ascending: orderAsc });
        if (typeof options?.limit === "number") {
          const offset = options?.offset ?? 0;
          query = query.range(offset, offset + options.limit - 1);
        }
        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(mapRoundFromDB);
    } catch (e) {
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        const filtered = rounds.filter(r => r.caseId === caseId);
        const order = options?.order === "desc" ? "desc" : "asc";
        const sorted = filtered.sort((a, b) =>
          order === "desc" ? b.roundNumber - a.roundNumber : a.roundNumber - b.roundNumber
        );
        if (typeof options?.limit === "number") {
          const offset = options?.offset ?? 0;
          return sorted.slice(offset, offset + options.limit);
        }
        return sorted;
    }
  },

  saveRound: async (newRound: Round): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
            const index = rounds.findIndex(r => r.id === newRound.id);
            if (index >= 0) rounds[index] = newRound;
            else rounds.push(newRound);
            setLocal(LS_KEYS.ROUNDS, rounds);
            const cases = getLocal<Case>(LS_KEYS.CASES);
            const caseIndex = cases.findIndex(c => c.id === newRound.caseId);
            if (caseIndex >= 0) {
              cases[caseIndex] = {
                ...cases[caseIndex],
                lastUpdatedAt: newRound.createdAt,
              };
              setLocal(LS_KEYS.CASES, cases);
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
            id: newRound.id,
            case_id: newRound.caseId,
            user_id: user.id,
            round_number: newRound.roundNumber,
            // FIXED: Using corrected property names from Round interface
            opponent_text: newRound.opponentText || "",
            sender_identity: newRound.senderIdentity || null,
            selected_mode: newRound.selectedMode,
            analysis_data: analysisData
        };

        const { error } = await supabase.from('rounds').upsert(payload);
        if (error) throw error;
    } catch (e) {
        const rounds = getLocal<Round>(LS_KEYS.ROUNDS);
        const index = rounds.findIndex(r => r.id === newRound.id);
        if (index >= 0) rounds[index] = newRound;
        else rounds.push(newRound);
        setLocal(LS_KEYS.ROUNDS, rounds);
        const cases = getLocal<Case>(LS_KEYS.CASES);
        const caseIndex = cases.findIndex(c => c.id === newRound.caseId);
        if (caseIndex >= 0) {
          cases[caseIndex] = {
            ...cases[caseIndex],
            lastUpdatedAt: newRound.createdAt,
          };
          setLocal(LS_KEYS.CASES, cases);
        }
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
