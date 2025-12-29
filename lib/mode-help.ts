import { Mode } from "../types";

export type ModeHelp = {
  bestFor: string;
  description: string;
  whyItWorks?: string;
  warning?: string;
  disclaimer?: string;
  highlight?: string;
};

export const MODE_ORDER: Mode[] = [
  "Peacekeeper",
  "Barrister",
  "Grey Rock",
  "Nuclear",
];

export const MODE_HELP: Record<Mode, ModeHelp> = {
  Peacekeeper: {
    bestFor: "Saving Relationships",
    description:
      'Use this when you want to de-escalate tension with a partner, friend, or family member. It uses "we" language and validation to lower defenses while gently asserting your needs.',
  },
  Barrister: {
    bestFor: "Business & Legal",
    description:
      'Removes all emotion. Focuses strictly on facts, dates, contracts, and logic. Ideal for landlords, bosses, or custody disputes where you need a "paper trail" for court.',
  },
  "Grey Rock": {
    bestFor: "Narcissists & High Conflict",
    description:
      'Designed for dealing with Narcissistic Personality Disorder (NPD). People with NPD crave emotional reaction (positive or negative) as "supply".',
    whyItWorks:
      "By giving boring, monosyllabic, unemotional responses (like a grey rock), you starve them of this supply. They eventually get bored and move on to a new target.",
    highlight: "Narcissistic Personality Disorder (NPD)",
  },
  Nuclear: {
    bestFor: "Shutting Down Bullies",
    description:
      "A high-risk, high-reward mode. It uses wit, sarcasm, and psychological mirroring to humiliate an aggressor or expose their insecurity.",
    warning:
      "This will burn bridges. Use only when you are ready to end the relationship or silence a troll.",
    disclaimer:
      "We will not be held liable for any consequences resulting from the use of this mode. Do not use this mode if you have a restraining order awarded against you or engaged in active legal proceedings from the adversary.",
  },
};

export const getModeTooltipText = (mode: Mode): string => {
  const { bestFor, description, whyItWorks, warning, disclaimer } =
    MODE_HELP[mode];
  const lines = [`Best For: ${bestFor}`, description];
  if (whyItWorks) lines.push(`Why it works: ${whyItWorks}`);
  if (warning) lines.push(`Warning: ${warning}`);
  if (disclaimer) lines.push(`Disclaimer: ${disclaimer}`);
  return lines.join("\n");
};
