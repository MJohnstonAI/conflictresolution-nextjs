export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const AVG_CHARS_PER_TOKEN = 4;
const MESSAGE_OVERHEAD_TOKENS = 4;

export const estimateTokensFromText = (text: string): number => {
  const length = text ? text.length : 0;
  return Math.ceil(length / AVG_CHARS_PER_TOKEN);
};

export const estimateTokensForMessage = (message: ChatMessage): number =>
  estimateTokensFromText(message.content || "") + MESSAGE_OVERHEAD_TOKENS;

export const estimateTokensForMessages = (messages: ChatMessage[]): number =>
  messages.reduce((total, message) => total + estimateTokensForMessage(message), 0);
