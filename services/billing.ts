


/**
 * BILLING STUB (WEB DEMO)
 *
 * This file is a front-end-only billing abstraction for the web prototype.
 * It is NOT real Google Play Billing.
 */

export const BILLING_PRODUCT_IDS = {
  // STANDARD SESSIONS
  STANDARD_SESSION_10: "pass_standard_case_499", // $4.99 (10 Standard Sessions)

  // PREMIUM SESSIONS
  PREMIUM_SESSION_40: "credit_premium_1_1499", // $14.99 (40 Premium Sessions)
  PREMIUM_SESSION_120: "credit_premium_3_3999", // $39.99 (120 Premium Sessions)
  PREMIUM_SESSION_400: "credit_premium_10_11999", // $119.99 (400 Premium Sessions)
} as const;

export type BillingProductId =
  (typeof BILLING_PRODUCT_IDS)[keyof typeof BILLING_PRODUCT_IDS];

export type BillingStatus =
  | { state: "demo"; message?: string }
  | { state: "ready"; products: BillingProductId[] }
  | { state: "error"; reason: string };

let currentStatus: BillingStatus = {
  state: "demo",
  message:
    "Running in web demo mode. Purchases are simulated and no real money is charged.",
};

export function getBillingStatus(): BillingStatus {
  return currentStatus;
}

/**
 * Simulate a purchase. In the web demo, we treat this as success.
 */
export async function simulatePurchase(
  productId: BillingProductId
): Promise<{ success: boolean; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}
