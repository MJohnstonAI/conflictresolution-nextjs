import { test } from "node:test";
import assert from "node:assert/strict";
import { pruneMessages } from "../pruneMessages";
import type { ChatMessage } from "../tokenEstimate";

const makeMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  role,
  content,
});

test("keeps messages under budget and preserves system + summary ordering", () => {
  const messages = [
    makeMessage("user", "Hello"),
    makeMessage("assistant", "Hi there"),
  ];
  const result = pruneMessages({
    systemPrompt: "System prompt",
    rollingSummary: "Summary note",
    messages,
    budgetTokens: 1000,
    keepLastTurns: 4,
  });

  assert.equal(result.prunedMessages[0].role, "system");
  assert.equal(result.prunedMessages[0].content, "System prompt");
  assert.equal(result.prunedMessages[1].role, "system");
  assert.equal(result.prunedMessages[1].content, "Summary note");
  assert.deepEqual(result.prunedMessages.slice(2), messages);
});

test("drops oldest messages first while keeping the last turns", () => {
  const messages = Array.from({ length: 6 }, (_, index) =>
    makeMessage("user", `Message ${index + 1} with enough text to count.`)
  );
  const result = pruneMessages({
    systemPrompt: "System prompt",
    rollingSummary: null,
    messages,
    budgetTokens: 60,
    keepLastTurns: 4,
  });

  const kept = result.prunedMessages.filter((message) => message.role === "user");
  assert.equal(kept.length, 4);
  assert.equal(kept[0].content, messages[2].content);
  assert.equal(kept[3].content, messages[5].content);
});

test("falls back to last two messages when still over budget", () => {
  const messages = Array.from({ length: 5 }, (_, index) =>
    makeMessage("assistant", `Long message ${index + 1} that pushes the budget.`)
  );
  const result = pruneMessages({
    systemPrompt: "System prompt",
    rollingSummary: null,
    messages,
    budgetTokens: 30,
    keepLastTurns: 4,
  });

  const kept = result.prunedMessages.filter((message) => message.role === "assistant");
  assert.equal(kept.length, 2);
  assert.equal(kept[0].content, messages[3].content);
  assert.equal(kept[1].content, messages[4].content);
});

test("truncates oversized summaries with a marker", () => {
  const longSummary = "Summary ".repeat(200);
  const result = pruneMessages({
    systemPrompt: "System prompt",
    rollingSummary: longSummary,
    messages: [makeMessage("user", "Short")],
    budgetTokens: 40,
    keepLastTurns: 2,
  });

  const summaryMessage = result.prunedMessages.find(
    (message, index) => message.role === "system" && index === 1
  );
  assert.ok(summaryMessage);
  assert.ok(summaryMessage?.content.endsWith("(truncated)"));
});
