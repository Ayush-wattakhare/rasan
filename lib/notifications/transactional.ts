/**
 * Pluggable Transactional Notification Service (SMS & WhatsApp)
 * Provides real-world text and WhatsApp messaging for customer order tracking
 * and rider assignment dispatches.
 *
 * Supported SMS Providers: Fast2SMS, MSG91, Twilio, Mock (Console Fallback)
 * Supported WhatsApp: Meta WhatsApp Cloud API, Mock (Console Fallback)
 */

export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

/**
 * Format an Indian phone number to 10 digits without +91 or leading 0
 */
export function formatIndianPhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Format a phone number to E.164 format (+91XXXXXXXXXX)
 */
export function formatE164PhoneNumber(rawPhone: string): string {
  const tenDigit = formatIndianPhoneNumber(rawPhone);
  return `+91${tenDigit}`;
}

/**
 * Sends a transactional SMS via the configured provider
 */
export async function sendTransactionalSms(to: string, message: string): Promise<SmsSendResult> {
  const cleanedPhone = formatIndianPhoneNumber(to);
  if (!cleanedPhone || cleanedPhone.length !== 10) {
    return {
      success: false,
      provider: 'none',
      error: `Invalid 10-digit Indian mobile number: ${to}`,
    };
  }

  // 1. Fast2SMS Provider (Very popular, instant activation in India)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: cleanedPhone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.return === true) {
        return {
          success: true,
          provider: 'fast2sms',
          messageId: data.request_id || 'fast2sms-ok',
        };
      }
      return {
        success: false,
        provider: 'fast2sms',
        error: data.message?.[0] || 'Fast2SMS dispatch failed',
      };
    } catch (err: any) {
      console.warn('Fast2SMS dispatch exception:', err.message);
    }
  }

  // 2. MSG91 Provider (Enterprise Indian Gateway)
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  if (msg91AuthKey) {
    try {
      const res = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: msg91AuthKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID || '',
          sender: process.env.MSG91_SENDER_ID || 'RASANF',
          short_url: '0',
          recipients: [{ mobiles: `91${cleanedPhone}`, message }],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.type === 'success') {
        return {
          success: true,
          provider: 'msg91',
          messageId: data.request_id || 'msg91-ok',
        };
      }
    } catch (err: any) {
      console.warn('MSG91 dispatch exception:', err.message);
    }
  }

  // 3. Twilio Provider (Global fallback)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const e164 = formatE164PhoneNumber(to);
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: e164,
        From: twilioFrom,
        Body: message,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sid) {
        return {
          success: true,
          provider: 'twilio',
          messageId: data.sid,
        };
      }
    } catch (err: any) {
      console.warn('Twilio dispatch exception:', err.message);
    }
  }

  // 4. Fallback Mock Log (Safe for local testing and pre-live verification)
  console.log(`[TRANSACTIONAL SMS FALLBACK] -> To: +91${cleanedPhone} | Message: "${message}"`);

  return {
    success: true,
    provider: 'mock',
    messageId: `mock-sms-${Date.now()}`,
  };
}

/**
 * Sends a transactional WhatsApp notification using Meta WhatsApp Cloud API
 */
export async function sendTransactionalWhatsApp(
  to: string,
  templateName: string,
  bodyText: string
): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const cleanedPhone = formatIndianPhoneNumber(to);

  if (token && phoneId && cleanedPhone.length === 10) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${cleanedPhone}`,
          type: 'text',
          text: { preview_url: false, body: bodyText },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.messages?.[0]?.id) {
        return {
          success: true,
          provider: 'meta_whatsapp_cloud',
          messageId: data.messages[0].id,
        };
      }
    } catch (err: any) {
      console.warn('Meta WhatsApp dispatch exception:', err.message);
    }
  }

  // Fallback Mock Log
  console.log(
    `[TRANSACTIONAL WHATSAPP FALLBACK] -> To: +91${cleanedPhone} [Template: ${templateName}] | Body: "${bodyText}"`
  );

  return {
    success: true,
    provider: 'mock',
    messageId: `mock-wa-${Date.now()}`,
  };
}

/* ── HIGH-LEVEL ORDER LIFECYCLE MILESTONES ── */

export async function notifyOrderConfirmed(params: {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  totalAmount: number;
  breakSlot?: string;
}) {
  const slotText = params.breakSlot ? ` for lunch slot (${params.breakSlot})` : '';
  const message = `Rasan: Your order #${params.orderNumber} of ₹${params.totalAmount} is confirmed${slotText}! Your home chef is preparing your fresh meal. Track live: https://rasan-pi.vercel.app/orders/${params.orderId}`;
  return sendTransactionalSms(params.customerPhone, message);
}

export async function notifyKitchenCooking(params: {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  vendorName: string;
}) {
  const message = `Rasan: Chef at ${params.vendorName} started cooking order #${params.orderNumber}. Fresh & hygienic packaging in progress!`;
  return sendTransactionalSms(params.customerPhone, message);
}

export async function notifyRiderAssigned(params: {
  orderId: string;
  orderNumber: string;
  riderPhone: string;
  vendorName: string;
  vendorAddress: string;
}) {
  const message = `Rasan Rider Alert: New delivery assigned for order #${params.orderNumber} from ${params.vendorName} (${params.vendorAddress}). Open app to navigate.`;
  return sendTransactionalSms(params.riderPhone, message);
}

export async function notifyOutForDelivery(params: {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
  riderName: string;
  riderPhone?: string;
  orderIdUrl?: string;
}) {
  const riderContact = params.riderPhone ? ` (${params.riderPhone})` : '';
  const message = `Rasan: Order #${params.orderNumber} is OUT FOR DELIVERY with rider ${params.riderName}${riderContact}! Track live: https://rasan-pi.vercel.app/orders/${params.orderId}`;
  return sendTransactionalSms(params.customerPhone, message);
}

export async function notifyOrderDelivered(params: {
  orderId: string;
  orderNumber: string;
  customerPhone: string;
}) {
  const message = `Rasan: Order #${params.orderNumber} has been delivered! Enjoy your fresh home-cooked meal. Rate your chef: https://rasan-pi.vercel.app/orders/${params.orderId}`;
  return sendTransactionalSms(params.customerPhone, message);
}
