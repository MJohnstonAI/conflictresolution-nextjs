import type { DemoMode } from "@/types/domain";

export const demoModes: DemoMode[] = [
  {
    id: "peacekeeper",
    label: "Peacekeeper",
    goal: "De-escalate, repair rapport, validate feelings while holding boundaries.",
    bestFor: ["Partners", "Family", "Friends"],
    rounds: 4,
  },
  {
    id: "barrister",
    label: "Barrister",
    goal: "Fact-check, document gaps, apply pressure without emotional heat.",
    bestFor: ["Boss", "Client", "Landlord"],
    rounds: 5,
  },
  {
    id: "grey-rock",
    label: "Grey Rock",
    goal: "Starve narcissists of fuel while documenting and tightening your perimeter.",
    bestFor: ["Ex", "In-Law", "Toxic parent"],
    rounds: 3,
  },
  {
    id: "nuclear",
    label: "Nuclear",
    goal: "High-voltage roast when diplomacy failed and you need a mic drop.",
    bestFor: ["Online trolls", "Bad faith actors"],
    rounds: 2,
  },
];
