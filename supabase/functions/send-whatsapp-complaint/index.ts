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
    const { technicianContact, companyName, beneficiaryName, contactNumber, district, block, village, product, resolvedDate, reporterName } = await req.json()

    if (!technicianContact) {
      throw new Error('Technician contact is required')
    }

    // Format phone number (ensure it has country code, assuming 91 for India if not present)
    let formattedPhone = technicianContact.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }

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
          type: 'template',
          template: {
            name: 'new_complaint_comnplaint_tracker_final',
            language: {
              code: 'en_US',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: companyName || 'N/A' },
                  { type: 'text', text: beneficiaryName || 'N/A' },
                  { type: 'text', text: contactNumber || 'N/A' },
                  { type: 'text', text: district || 'N/A' },
                  { type: 'text', text: block || 'N/A' },
                  { type: 'text', text: village || 'N/A' },
                  { type: 'text', text: product || 'N/A' },
                  { type: 'text', text: resolvedDate || 'N/A' },
                  { type: 'text', text: reporterName || 'N/A' },
                ],
              },
            ],
          },
        }),
      }
    )

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: response.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
