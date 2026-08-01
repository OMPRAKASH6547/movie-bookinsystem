import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function createStripePaymentIntent(amount: number, currency = "inr", metadata?: Record<string, string>) {
  const client = getStripe();
  if (!client) {
    return {
      id: `pi_demo_${Date.now()}`,
      client_secret: `demo_secret_${Date.now()}`,
      amount: amount * 100,
      currency,
      demo: true,
    };
  }

  return client.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
}

export async function verifyStripeWebhook(payload: string, signature: string) {
  const client = getStripe();
  if (!client || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  return client.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
