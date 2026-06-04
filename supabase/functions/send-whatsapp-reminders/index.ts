import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')
const URL = Deno.env.get('URL')
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    if (!WHATSAPP_TOKEN || !PHONE_ID || !URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables. Please check WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, URL, and SERVICE_ROLE_KEY in your Supabase dashboard settings.')
    }

    const supabase = createClient(URL, SERVICE_ROLE_KEY)

    console.log("Fetching pending reminders...")
    const { data: pendingComplaints, error: pendingErr } = await supabase.rpc('get_pending_reminders')
    if (pendingErr) throw pendingErr

    console.log("Fetching overdue reminders...")
    const { data: overdueComplaints, error: overdueErr } = await supabase.rpc('get_overdue_reminders')
    if (overdueErr) throw overdueErr

    const results = []

    // Helper to send template
    const sendTemplateNotification = async (item: any, templateName: string) => {
      let phone = item.technician_contact.replace(/\D/g, '')
      if (phone.length === 10) {
        phone = '91' + phone
      }

      const resolvedDateFormatted = item.resolved_date 
        ? new Date(item.resolved_date).toLocaleDateString('en-GB') 
        : 'N/A'

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
      }

      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        )

        const resJson = await response.json()

        if (response.ok && !resJson.error) {
          // Log success to DB
          await supabase.from('whatsapp_reminder_logs').insert({
            complaint_id: item.complaint_id,
            template_name: templateName,
            recipient_phone: phone,
            status: 'success',
            response_payload: resJson
          })
          return { success: true }
        } else {
          const errMsg = resJson.error?.message || 'Unknown API Error'
          // Log failure to DB
          await supabase.from('whatsapp_reminder_logs').insert({
            complaint_id: item.complaint_id,
            template_name: templateName,
            recipient_phone: phone,
            status: 'failed',
            error_message: errMsg,
            response_payload: resJson
          })
          return { success: false, error: errMsg }
        }

      } catch (err) {
        // Log failure to DB
        await supabase.from('whatsapp_reminder_logs').insert({
          complaint_id: item.complaint_id,
          template_name: templateName,
          recipient_phone: phone,
          status: 'failed',
          error_message: err.message
        })
        return { success: false, error: err.message }
      }
    }

    // Process pending reminders sequentially to prevent rate limits
    if (pendingComplaints && pendingComplaints.length > 0) {
      console.log(`Processing ${pendingComplaints.length} pending reminders...`)
      for (const item of pendingComplaints) {
        const res = await sendTemplateNotification(item, 'complaint_pending_reminder')
        results.push({ id: item.complaint_id, type: 'pending', ...res })
        // Throttling to prevent API bursts (200ms delay)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Process overdue reminders sequentially
    if (overdueComplaints && overdueComplaints.length > 0) {
      console.log(`Processing ${overdueComplaints.length} overdue reminders...`)
      for (const item of overdueComplaints) {
        const res = await sendTemplateNotification(item, 'complaint_overdue_reminder')
        results.push({ id: item.complaint_id, type: 'overdue', ...res })
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in send-whatsapp-reminders function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
