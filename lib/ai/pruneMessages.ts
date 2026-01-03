import { estimateTokensForMessages } from "./tokenEstimate";
import type { ChatMessage } from "./tokenEstimate";

type PruneOptions = {
  systemPrompt: string;
  rollingSummary?: string | null;
  messages: ChatMessage[];
  budgetTokens: number;
  keepLastTurns: number;
};

type PruneResult = {
  prunedMessages: ChatMessage[];
  estimatedTokensBefore: number;
  estimatedTokensAfter: number;
  messageCountBefore: number;
  messageCountAfter: number;
  summaryTruncated: boolean;
};

const buildSystemMessage = (content: string | null | undefined): ChatMessage | null => {
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (!trimmed) return null;
  return { role: "system", content: trimmed };
};

const sanitizeMessages = (messages: ChatMessage[]) =>
  messages
    .filter((message) => typeof message?.content === "string" && message.content.trim().length > 0)
    .map((message) => ({ role: message.role, content: message.content.trim() }));

const truncateSummary = (summary: string, maxTokens: number) => {
  const marker = " (truncated)";
  const maxChars = Math.max(0, maxTokens * 4);
  if (summary.length <= maxChars) {
    return { text: summary, truncated: false };
  }
  const cut = Math.max(0, maxChars - marker.length);
  const text = summary.slice(0, cut).trimEnd() + marker;
  return { text, truncated: true };
};

const buildTokenEstimate = (
  systemMessage: ChatMessage | null,
  summaryMessage: ChatMessage | null,
  messages: ChatMessage[]
) => {
  const all = [systemMessage, summaryMessage, ...messages].filter(Boolean) as ChatMessage[];
  return estimateTokensForMessages(all);
};

export const pruneMessages = (options: PruneOptions): PruneResult => {
  const systemMessage = buildSystemMessage(options.systemPrompt);
  const initialSummary = buildSystemMessage(options.rollingSummary || "");
  const normalizedMessages = sanitizeMessages(options.messages);

  const messageCountBefore =
    normalizedMessages.length + (systemMessage ? 1 : 0) + (initialSummary ? 1 : 0);
  const estimatedTokensBefore = buildTokenEstimate(systemMessage, initialSummary, normalizedMessages);

  let workingMessages = [...normalizedMessages];
  let summaryMessage = initialSummary;
  const keepLastTurns = Math.max(2, options.keepLastTurns || 2);

  while (
    workingMessages.length > keepLastTurns &&
    buildTokenEstimate(systemMessage, summaryMessage, workingMessages) > options.budgetTokens
  ) {
    workingMessages.shift();
  }

  if (
    workingMessages.length > 2 &&
    buildTokenEstimate(systemMessage, summaryMessage, workingMessages) > options.budgetTokens
  ) {
    workingMessages = workingMessages.slice(-2);
  }

  let summaryTruncated = false;
  if (summaryMessage) {
    const tokensWithoutSummary = buildTokenEstimate(systemMessage, null, workingMessages);
    const availableTokens = options.budgetTokens - tokensWithoutSummary;
    if (availableTokens <= 0) {
      summaryMessage = null;
      summaryTruncated = true;
    } else {
      const truncated = truncateSummary(summaryMessage.content, availableTokens);
      summaryMessage = { role: "system", content: truncated.text };
      summaryTruncated = truncated.truncated;
    }
  }

  const prunedMessages = [systemMessage, summaryMessage, ...workingMessages].filter(
    Boolean
  ) as ChatMessage[];
  const estimatedTokensAfter = estimateTokensForMessages(prunedMessages);

  return {
    prunedMessages,
    estimatedTokensBefore,
    estimatedTokensAfter,
    messageCountBefore,
    messageCountAfter: prunedMessages.length,
    summaryTruncated,
  };
};
