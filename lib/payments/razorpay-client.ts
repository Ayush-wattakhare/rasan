import Razorpay from 'razorpay';

/**
 * One place for Razorpay server credentials, so create-order, verify, refunds
 * and the webhook all agree on what "configured" means.
 *
 * RAZORPAY_KEY_ID is preferred; NEXT_PUBLIC_RAZORPAY_KEY_ID is accepted for
 * older setups. The browser always uses NEXT_PUBLIC_RAZORPAY_KEY_ID, so when
 * both are set they must be the same key (checked by razorpayConfigIssues).
 */
export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || undefined;
}

let cached: { keyId: string; client: Razorpay } | null = null;

/** Razorpay SDK client, or null when the server keys are not configured. */
export function getRazorpay(): Razorpay | null {
  const keyId = razorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  if (!cached || cached.keyId !== keyId) {
    cached = { keyId, client: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
  }
  return cached.client;
}

/**
 * Configuration problems that would silently break payments. Empty when OK.
 * Never includes secret values.
 */
export function razorpayConfigIssues(): string[] {
  const issues: string[] = [];
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const serverKey = process.env.RAZORPAY_KEY_ID;

  if (!publicKey || publicKey === 'your_razorpay_key_id') {
    issues.push('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set (online payment is hidden at checkout)');
  }
  if (!process.env.RAZORPAY_KEY_SECRET) issues.push('RAZORPAY_KEY_SECRET is not set');
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    issues.push('RAZORPAY_WEBHOOK_SECRET is not set (webhooks are rejected; closed-tab payments are never recorded)');
  }
  if (publicKey && serverKey && publicKey !== serverKey) {
    issues.push('RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID are different keys');
  }
  if (publicKey && serverKey) {
    const mode = (k: string) => (k.startsWith('rzp_live_') ? 'live' : k.startsWith('rzp_test_') ? 'test' : '?');
    if (mode(publicKey) !== mode(serverKey)) issues.push('Razorpay client and server keys are in different modes (test vs live)');
  }
  return issues;
}

/** True when the browser can start a payment AND the server can complete it. */
export function onlinePaymentsConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  return !!publicKey && publicKey !== 'your_razorpay_key_id' && !!getRazorpay();
}

let warned = false;
/** Logs configuration problems once per server instance. */
export function warnRazorpayConfigOnce(): void {
  if (warned) return;
  warned = true;
  const issues = razorpayConfigIssues();
  if (issues.length > 0) console.error(`[payments] Razorpay configuration: ${issues.join('; ')}`);
}
