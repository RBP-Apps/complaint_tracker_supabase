/**
 * Production-ready daily reminder cron script (Node.js)
 * Run this via node-cron, serverless cron (Vercel/AWS), or GitHub Actions.
 */
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
  console.error("❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WHATSAPP_PHONE_ID, or WHATSAPP_TOKEN");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Formats a phone number to standard E.164 format with '91' prefix (India).
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

/**
 * Triggers the WhatsApp Business API template message.
 */
async function sendWhatsAppTemplate(item, templateName) {
  const phone = formatPhoneNumber(item.technician_contact);
  if (!phone) {
    console.warn(`⚠️ Skipped Complaint ${item.complaint_id} due to missing technician contact number`);
    return { success: false, error: "Missing phone number" };
  }

  const resolvedDateFormatted = item.resolved_date 
    ? new Date(item.resolved_date).toLocaleDateString('en-GB') 
    : 'N/A';

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: item.company_name || 'N/A' },        // {{1}}
            { type: 'text', text: item.beneficiary_name || 'N/A' },    // {{2}}
            { type: 'text', text: item.contact_number || 'N/A' },      // {{3}}
            { type: 'text', text: item.district || 'N/A' },            // {{4}}
            { type: 'text', text: item.block || 'N/A' },               // {{5}}
            { type: 'text', text: item.village || 'N/A' },             // {{6}}
            { type: 'text', text: item.product || 'N/A' },             // {{7}}
            { type: 'text', text: resolvedDateFormatted },             // {{8}}
            { type: 'text', text: item.reporter_name || 'N/A' },       // {{9}}
            { type: 'text', text: item.complaint_id || 'N/A' },        // {{10}}
          ],
        },
      ],
    },
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Log success to DB
    await supabase.from('whatsapp_reminder_logs').insert({
      complaint_id: item.complaint_id,
      template_name: templateName,
      recipient_phone: phone,
      status: 'success',
      response_payload: response.data,
    });

    console.log(`✅ Sent ${templateName} to ${phone} for Complaint ${item.complaint_id}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ Failed to send ${templateName} to ${phone}:`, errorMsg);

    // Log failure to DB
    await supabase.from('whatsapp_reminder_logs').insert({
      complaint_id: item.complaint_id,
      template_name: templateName,
      recipient_phone: phone,
      status: 'failed',
      error_message: errorMsg,
      response_payload: error.response ? error.response.data : null,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Main worker execution function.
 */
export async function runDailyReminders() {
  console.log("🚀 Starting daily WhatsApp reminder cron process...");

  try {
    // 1. Fetch complaints for Pending Reminders
    const { data: pendingComplaints, error: pendingErr } = await supabase.rpc('get_pending_reminders');
    if (pendingErr) throw pendingErr;
    console.log(`Found ${pendingComplaints ? pendingComplaints.length : 0} eligible pending reminders.`);

    // 2. Fetch complaints for Overdue Reminders
    const { data: overdueComplaints, error: overdueErr } = await supabase.rpc('get_overdue_reminders');
    if (overdueErr) throw overdueErr;
    console.log(`Found ${overdueComplaints ? overdueComplaints.length : 0} eligible overdue reminders.`);

    // 3. Process Pending Reminders sequentially
    if (pendingComplaints && pendingComplaints.length > 0) {
      for (const item of pendingComplaints) {
        await sendWhatsAppTemplate(item, 'complaint_pending_reminder');
        // Simple 200ms throttle to prevent bursting Meta API
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // 4. Process Overdue Reminders
    if (overdueComplaints && overdueComplaints.length > 0) {
      for (const item of overdueComplaints) {
        await sendWhatsAppTemplate(item, 'complaint_overdue_reminder');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log("🎉 Daily WhatsApp reminder cron finished successfully.");
  } catch (err) {
    console.error("💥 Critical error in daily reminder cron execution:", err);
  }
}

// Check if running as main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyReminders();
}
