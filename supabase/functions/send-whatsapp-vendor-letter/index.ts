import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')

serve(async (req) => {
  // Handle CORS preflight
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
      whatsappNumber,
      vendorName,
      letterNo,
      complaintId,
      beneficiaryName,
      pdfUrl,
      date,
      subject,
      templateName
    } = await req.json()

    if (!whatsappNumber) {
      throw new Error('WhatsApp number is required')
    }

    if (!WHATSAPP_TOKEN || !PHONE_ID) {
      throw new Error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID in Supabase environment secrets.')
    }

    // Format phone number (ensure country code 91 if 10 digits)
    let formattedPhone = whatsappNumber.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }

    const templateToUse = templateName || Deno.env.get('LETTER_WHATSAPP_TEMPLATE') || 'vendor_letter_assigned'

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateToUse,
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: vendorName || 'Vendor' },             // {{1}}
              { type: 'text', text: letterNo || 'N/A' },                   // {{2}}
              { type: 'text', text: complaintId || 'N/A' },                // {{3}}
              { type: 'text', text: beneficiaryName || 'N/A' },            // {{4}}
              { type: 'text', text: date || 'N/A' },                       // {{5}}
              { type: 'text', text: pdfUrl || 'N/A' },                     // {{6}}
            ],
          },
        ],
      },
    }

    console.log(`Sending WhatsApp letter template (${templateToUse}) to: ${formattedPhone}`)

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

    const result = await response.json()

    if (!response.ok) {
      console.error('Meta API Error:', result)
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      })
    }

    console.log('WhatsApp message sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, message: 'WhatsApp message sent successfully', result }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
