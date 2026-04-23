/**
 * DentaCore ERP — Messaging Service
 * Sends WhatsApp and SMS messages via configured gateway.
 * Supports: WhatsApp Business API, Twilio, or custom SMS gateway.
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;

export interface MessagePayload {
  to: string;          // Phone number with country code
  message: string;     // Message text
  type?: "whatsapp" | "sms";
  template?: string;   // Template name for WhatsApp
  params?: Record<string, string>; // Template parameters
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: "whatsapp" | "sms" | "none";
}

/**
 * Send a message via the best available channel.
 * Priority: WhatsApp > SMS > Log only
 */
export async function sendMessage(payload: MessagePayload): Promise<MessageResult> {
  const channel = payload.type || (WHATSAPP_API_URL ? "whatsapp" : SMS_API_URL ? "sms" : "none");

  if (channel === "whatsapp" && WHATSAPP_API_URL && WHATSAPP_API_TOKEN) {
    return sendWhatsApp(payload);
  }

  if (channel === "sms" && SMS_API_URL && SMS_API_KEY) {
    return sendSMS(payload);
  }

  // No gateway configured — log the message
  console.log(`[Messaging] No gateway configured. Would send to ${payload.to}: ${payload.message}`);
  return { success: true, channel: "none", messageId: `log-${Date.now()}` };
}

async function sendWhatsApp(payload: MessagePayload): Promise<MessageResult> {
  try {
    const res = await fetch(WHATSAPP_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: payload.to.replace(/[^0-9]/g, ""),
        type: "text",
        text: { body: payload.message },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, channel: "whatsapp", messageId: data.messages?.[0]?.id };
    }

    const err = await res.text();
    console.error("[WhatsApp] Error:", err);
    return { success: false, channel: "whatsapp", error: err };
  } catch (error) {
    console.error("[WhatsApp] Failed:", error);
    return { success: false, channel: "whatsapp", error: String(error) };
  }
}

async function sendSMS(payload: MessagePayload): Promise<MessageResult> {
  try {
    const res = await fetch(SMS_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: payload.to.replace(/[^0-9]/g, ""),
        message: payload.message,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, channel: "sms", messageId: data.id || data.messageId };
    }

    const err = await res.text();
    console.error("[SMS] Error:", err);
    return { success: false, channel: "sms", error: err };
  } catch (error) {
    console.error("[SMS] Failed:", error);
    return { success: false, channel: "sms", error: String(error) };
  }
}

// ---- Message Templates ----

export function appointmentReminder(patientName: string, date: string, time: string, doctorName: string): string {
  return `Hi ${patientName}, this is a reminder for your appointment on ${date} at ${time} with ${doctorName} at DentaCore Dental Clinic. Please arrive 10 minutes early. Reply CONFIRM to confirm.`;
}

export function prescriptionMessage(patientName: string, medicines: string[]): string {
  return `Hi ${patientName}, your prescription from DentaCore Dental Clinic:\n\n${medicines.join("\n")}\n\nPlease take as directed. Contact us for any questions.`;
}

export function followUpReminder(patientName: string, date: string, reason: string): string {
  return `Hi ${patientName}, you have a follow-up due on ${date} for: ${reason}. Please book your appointment at DentaCore Dental Clinic.`;
}

export function invoiceReminder(patientName: string, amount: string, invoiceNumber: string): string {
  return `Hi ${patientName}, you have an outstanding balance of ${amount} (${invoiceNumber}) at DentaCore Dental Clinic. Please visit us or contact for payment options.`;
}
