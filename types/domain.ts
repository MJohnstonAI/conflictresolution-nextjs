import type { LucideIcon } from "lucide-react";

export type OpponentType =
  | "Partner"
  | "Family"
  | "In-Law"
  | "Friend"
  | "Neighbor"
  | "Boss"
  | "Client"
  | "Roommate";

export type PlanType = "standard" | "premium" | "demo";

export interface Scenario {
  id: string;
  title: string;
  category: OpponentType;
  summary: string;
  recommendedPlan: PlanType;
  icon: LucideIcon;
}

export interface CaseSummary {
  id: string;
  title: string;
  opponent: OpponentType;
  planType: PlanType;
  roundsUsed: number;
  roundsLimit: number;
  isClosed: boolean;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  location: string;
}

export interface DemoMode {
  id: string;
  label: string;
  goal: string;
  bestFor: string[];
  rounds: number;
}
