import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionGuard } from "../lib/server/session-guard";

type Balances = { standard: number; premium: number };

const createFakeStore = (balances: Balances, isAdmin = false) => {
  const state = { ...balances };
  return {
    getProfile: async () => ({ is_admin: isAdmin }),
    consume: async ({
      planType,
    }: {
      planType: "standard" | "premium";
      generationId?: string | null;
    }) => {
      if (state[planType] <= 0) {
        return { consumed: false, remaining: state[planType] };
      }
      state[planType] -= 1;
      return { consumed: true, remaining: state[planType] };
    },
    refund: async ({
      planType,
    }: {
      planType: "standard" | "premium";
      generationId?: string | null;
    }) => {
      state[planType] += 1;
    },
    getBalances: () => ({ ...state }),
  };
};

test("consumes 1 session on generation", async () => {
  const store = createFakeStore({ standard: 1, premium: 0 });
  const guard = createSessionGuard(store);
  const result = await guard.consumeSession({ userId: "user-1", planType: "standard" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.consumed, true);
  }
  assert.equal(store.getBalances().standard, 0);
});

test("browsing does not consume sessions", async () => {
  const store = createFakeStore({ standard: 2, premium: 0 });
  const before = store.getBalances().standard;
  await Promise.resolve();
  const after = store.getBalances().standard;
  assert.equal(after, before);
});

test("blocks generation when sessions are exhausted", async () => {
  const store = createFakeStore({ standard: 0, premium: 0 });
  const guard = createSessionGuard(store);
  const result = await guard.consumeSession({ userId: "user-1", planType: "standard" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.status, 402);
  }
});
