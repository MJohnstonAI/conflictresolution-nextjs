
export type OpponentType = "Partner" | "Co-Parent" | "Ex Boy/Girlfriend" | "Ex-Spouse" | "Situationship" | "Boss" | "Landlord" | "Family" | "Sibling" | "Step-Parent" | "Step-Child" | "Executor" | "In-Law" | "Friend" | "Fraternity Member" | "Sorority Member" | "Neighbor" | "Colleague" | "Bank" | "Client" | "Contractor" | "Tenant" | "Seller" | "Buyer" | "Roommate" | "HOA Board" | "Insurance Company" | "Medical Aid Provider" | "Employee" | "Customer Support" | "Wife" | "Husband" | "Boyfriend" | "Girlfriend" | "Company" | "School" | "Teacher" | "Customer" | "Car Dealership" | "Other" | (string & {});

export type Mode = "Peacekeeper" | "Barrister" | "Nuclear" | "Grey Rock";

export type UserGoal = "Calm down" | "Hold boundaries" | "Apply pressure";

export type PlanType = "standard" | "premium" | "demo";

export type UserRole = "admin" | "demo" | "pending" | "paid" | "trial";

export type Theme = 'light' | 'dark' | 'system' | 'aura' | 'midnight' | 'slate' | 'sapphire' | 'nordic';

export interface UserAccount {
  // Personalization
  name?: string;
  
  // Wallet
  standardCredits: number; // For Standard Cases (10 rounds)
  premiumCredits: number;  // For Premium Cases (40 rounds + Expert)
  
  // Permissions
  isAdmin: boolean; // Bypasses all limits
  role: UserRole;   // admin, demo, pending, paid, trial

  // Preferences
  theme?: Theme;

  // Legacy / Stats
  totalCasesCreated: number;
}

export interface Case {
  id: string;
  title: string;
  opponentType: OpponentType;
  createdAt: string;
  lastUpdatedAt?: string; 
  
  // Monetization State
  planType: PlanType;
  roundsLimit: number;    // 10 (Standard), 40 (Premium)
  roundsUsed: number;     
  
  isClosed: boolean;      // If true, no more AI calls allowed

  note?: string;
  demoScenarioId?: string; // If present, this case follows a specific script
}

export interface AnalysisResponse {
  vibeCheck: string;
  confidenceScore?: number; // 0-100
  confidenceExplanation?: string;
  legalRiskScore: number;
  legalRiskExplanation: string;
  detectedFallacies: string[];
  analysisSummary: string;
  responses: {
    soft: string;
    firm: string;
    nuclear: string;
    greyRock: string;
  };
  expertInsights?: string; // For Premium Demo: Explains the strategy/psychology used
  modelSlug?: string;
}

export interface Round {
  id: string;
  caseId: string;
  roundNumber: number; 
  createdAt: string;
  
  // Input State
  opponentText: string;
  userGoal: UserGoal;
  senderIdentity?: string;
  
  // Analysis State
  isAnalyzed: boolean;
  vibeCheck?: string;
  confidenceScore?: number;
  confidenceExplanation?: string;
  legalRiskScore?: number;
  legalRiskExplanation?: string;
  detectedFallacies?: string[];
  analysisSummary?: string;

  // Responses State
  responses: {
    soft?: string;
    firm?: string;
    nuclear?: string;
    greyRock?: string;
  };
  
  // UI State
  selectedMode: Mode;
  rerollsUsed: number;
  
  // Demo Extras
  expertInsights?: string;

  // AI Metadata
  modelSlug?: string;
}

export interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  opponentType: OpponentType;
  mode: Mode;
  createdAt: string;
  isPublic?: boolean;
  recommendedPlan: PlanType; // Added field
}

export interface SuccessStory {
  id: string;
  author: string;
  role: string;
  text: string;
  stars: number;
  isFeatured: boolean;
  createdAt: string;
}
