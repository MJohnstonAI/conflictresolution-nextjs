import {
  Star,
  Home,
  Users,
  HeartPulse,
  Handshake,
  Briefcase,
  Shield,
  Flame,
} from "lucide-react";

import type { Scenario } from "@/types/domain";

export const scenarios: Scenario[] = [
  {
    id: "silent-treatment",
    title: "The Silent Treatment",
    category: "Partner",
    summary:
      "Your partner shuts down for days after conflicts and you need to re-open communication without caving.",
    recommendedPlan: "standard",
    icon: HeartPulse,
  },
  {
    id: "boundary-parent",
    title: "Boundary Crushing Parent",
    category: "Family",
    summary:
      "A parent ignores healthy boundaries and weaponizes guilt when you push back.",
    recommendedPlan: "premium",
    icon: Shield,
  },
  {
    id: "loan-friend",
    title: "The 'Friend' Loan",
    category: "Friend",
    summary:
      "Money was loaned to a friend who ghosts repayment, yet flaunts trips online.",
    recommendedPlan: "standard",
    icon: Users,
  },
  {
    id: "property-tree",
    title: "Property Line Tree",
    category: "Neighbor",
    summary:
      "Your neighbor's oak is destroying your driveway and they've ignored every civil request.",
    recommendedPlan: "premium",
    icon: Home,
  },
  {
    id: "boss-gaslight",
    title: "Gaslighting Boss",
    category: "Boss",
    summary:
      "Performance reviews weaponized to keep you compliant; you need receipts and leverage.",
    recommendedPlan: "premium",
    icon: Briefcase,
  },
  {
    id: "client-scope",
    title: "Scope Creep Client",
    category: "Client",
    summary:
      "Client expects 4 rounds of revisions on a budget for one and threatens to 'leave a review'.",
    recommendedPlan: "standard",
    icon: Handshake,
  },
  {
    id: "roommate-noise",
    title: "Roommate Bass Drop",
    category: "Roommate",
    summary:
      "Roommate runs midnight studio sessions; landlord ignores it. Need leverage + compromise.",
    recommendedPlan: "standard",
    icon: Flame,
  },
  {
    id: "inlaw-interference",
    title: "In-Law Interference",
    category: "In-Law",
    summary:
      "Your in-law undermines financial decisions and paints you as 'disrespectful'.",
    recommendedPlan: "standard",
    icon: Star,
  },
];
