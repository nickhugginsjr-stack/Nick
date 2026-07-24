import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export function requireTwilioClient() {
  if (!twilioClient) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env."
    );
  }
  return twilioClient;
}

export function requireTwilioNumber() {
  const number = process.env.TWILIO_PHONE_NUMBER;
  if (!number) {
    throw new Error("TWILIO_PHONE_NUMBER is not set in .env.");
  }
  return number;
}

export function publicBaseUrl() {
  const url = process.env.PUBLIC_BASE_URL;
  if (!url) {
    throw new Error(
      "PUBLIC_BASE_URL is not set in .env (Twilio must be able to reach this URL for webhooks)."
    );
  }
  return url.replace(/\/$/, "");
}

/** Parses a Twilio webhook POST body (application/x-www-form-urlencoded). */
export async function parseTwilioForm(
  request: Request
): Promise<Record<string, string>> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }
  return params;
}

/**
 * Verifies the X-Twilio-Signature header against the request. If no auth
 * token is configured (local dev without a real Twilio account), validation
 * is skipped rather than blocking the request.
 */
export function verifyTwilioRequest(
  fullUrl: string,
  signature: string | null,
  params: Record<string, string>
): boolean {
  if (!authToken) return true;
  if (!signature) return false;
  return twilio.validateRequest(authToken, signature, fullUrl, params);
}
