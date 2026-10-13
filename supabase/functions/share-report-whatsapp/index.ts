import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')

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
    const { 
      phoneNumber,
      reportTitle,
      dateRange,
      summaryText,
      customMessage,
      fileUrl
    } = await req.json()

    if (!phoneNumber) {
      throw new Error('Recipient WhatsApp phone number is required')
    }

    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }

    if (!WHATSAPP_TOKEN || !PHONE_ID) {
      // Return status that direct API credentials are not set, providing fallback payload
      return new Response(JSON.stringify({ 
        success: false, 
        serviceConfigured: false,
        message: "Meta WhatsApp API credentials (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID) are not configured in Supabase secrets. Please use the WhatsApp Web 1-click sharing fallback.",
        recipient: formattedPhone
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      })
    }

    // Prepare message text
    const messageBody = `📊 *${reportTitle || 'Complaints Tracker Report'}*\n` +
      `📅 *Period:* ${dateRange || 'All Time'}\n\n` +
      `${summaryText ? `📈 *Summary:*\n${summaryText}\n\n` : ''}` +
      `${customMessage ? `💬 *Notes:* ${customMessage}\n\n` : ''}` +
      `${fileUrl ? `🔗 *Download Report:* ${fileUrl}\n\n` : ''}` +
      `_Generated from Complaints Tracker System_`

    // Call Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: messageBody
          }
        }),
      }
    )

    const result = await response.json()

    return new Response(JSON.stringify({
      success: response.ok,
      serviceConfigured: true,
      data: result,
      recipient: formattedPhone
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: response.ok ? 200 : 400,
    })

  } catch (error) {
    console.error("Error in share-report-whatsapp function:", error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
