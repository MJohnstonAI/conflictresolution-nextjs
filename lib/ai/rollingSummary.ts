import type { ChatMessage } from "./tokenEstimate";

export type RollingSummaryInput = {
  messages: ChatMessage[];
};

export const buildRollingSummaryPrompt = ({ messages }: RollingSummaryInput): string => {
  const transcript = messages
    .map((message, index) => `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return `
Summarize the older conversation history for a conflict-resolution case.

Include:
- key facts and timeline
- parties and roles
- commitments, constraints, and risks
- tone requirements and "must/never" rules

Output rules:
- Plain text only.
- Do not add new facts.

History:
${transcript}
`.trim();
};
