import crypto from "crypto";

const PAYU_BASE =
  process.env.PAYU_MODE === "production"
    ? "https://secure.payu.in"
    : "https://test.payu.in";

export interface PayUPaymentParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  service_provider: string;
  udf1?: string;
  udf2?: string;
}

export function isPayUConfigured(): boolean {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
}

export function getPayUCheckoutUrl(): string {
  return `${PAYU_BASE}/_payment`;
}

/** PayU hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt */
export function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const sequence = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || "",
    params.udf2 || "",
    params.udf3 || "",
    params.udf4 || "",
    params.udf5 || "",
    "",
    "",
    "",
    "",
    "",
    params.salt,
  ].join("|");

  return crypto.createHash("sha512").update(sequence).digest("hex");
}

/** Reverse hash for webhook/response verification */
export function verifyPayUResponse(data: {
  status: string;
  key?: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  hash: string;
}): boolean {
  const salt = process.env.PAYU_MERCHANT_SALT || "";
  const key = process.env.PAYU_MERCHANT_KEY || data.key || "";

  const sequence = [
    salt,
    data.status,
    "",
    "",
    "",
    "",
    "",
    data.udf5 || "",
    data.udf4 || "",
    data.udf3 || "",
    data.udf2 || "",
    data.udf1 || "",
    data.email,
    data.firstname,
    data.productinfo,
    data.amount,
    data.txnid,
    key,
  ].join("|");

  const calculated = crypto.createHash("sha512").update(sequence).digest("hex");
  return calculated.toLowerCase() === data.hash.toLowerCase();
}

export function buildPayUPayment(input: {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone?: string;
  bookingId: string;
  userId: string;
}): PayUPaymentParams | null {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  if (!key || !salt) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const amount = input.amount.toFixed(2);

  const hash = generatePayUHash({
    key,
    txnid: input.txnid,
    amount,
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    udf1: input.bookingId,
    udf2: input.userId,
    salt,
  });

  return {
    key,
    txnid: input.txnid,
    amount,
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    phone: input.phone || "9999999999",
    surl: `${appUrl}/api/v1/payments/payu/success`,
    furl: `${appUrl}/api/v1/payments/payu/failure`,
    hash,
    service_provider: "payu_paisa",
    udf1: input.bookingId,
    udf2: input.userId,
  };
}
