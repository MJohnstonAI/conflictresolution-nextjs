import { test } from "node:test";
import assert from "node:assert/strict";

test("prunes messages before calling OpenRouter", async () => {
  const originalFetch = global.fetch;
  let capturedBody: any = null;
  const previousKey = process.env.OPENROUTER_API_KEY;

  process.env.OPENROUTER_API_KEY = "test-key";

  global.fetch = async (_url: any, init: any) => {
    capturedBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "ok" } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const { callOpenRouterChat } = await import("../openrouter");
    const messages = [
      { role: "system", content: "System prompt" },
      { role: "user", content: "Message one with extra words." },
      { role: "assistant", content: "Message two with extra words." },
      { role: "user", content: "Message three with extra words." },
      { role: "assistant", content: "Message four with extra words." },
    ];

    const text = await callOpenRouterChat({
      model: "test-model",
      messages,
      planType: "standard",
      budgetTokens: 40,
      keepLastTurns: 2,
    });

    assert.equal(text, "ok");
    assert.ok(capturedBody);
    assert.ok(Array.isArray(capturedBody.messages));
    assert.ok(capturedBody.messages.length <= 3);
    assert.equal(capturedBody.messages[0].role, "system");
  } finally {
    global.fetch = originalFetch as typeof fetch;
    if (previousKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousKey;
    }
  }
});
