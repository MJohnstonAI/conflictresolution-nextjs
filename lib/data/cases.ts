import type { CaseSummary } from "@/types/domain";

export const demoCases: CaseSummary[] = [
  {
    id: "alpha",
    title: "Vendor Refuses Refund",
    opponent: "Client",
    planType: "premium",
    roundsUsed: 18,
    roundsLimit: 40,
    isClosed: false,
    updatedAt: "12 minutes ago",
  },
  {
    id: "bravo",
    title: "Roommate Lease Takeover",
    opponent: "Roommate",
    planType: "standard",
    roundsUsed: 9,
    roundsLimit: 25,
    isClosed: false,
    updatedAt: "1 hour ago",
  },
  {
    id: "charlie",
    title: "In-Law Overreach",
    opponent: "In-Law",
    planType: "premium",
    roundsUsed: 22,
    roundsLimit: 30,
    isClosed: true,
    updatedAt: "Yesterday",
  },
];
