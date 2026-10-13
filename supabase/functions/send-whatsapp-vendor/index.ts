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
      vendorMobile,
      vendorName,
      complaintId,
      vendorComplaintId,
      beneficiaryName,
      contactNumber,
      district,
      block,
      village,
      productType,
      assignmentDate,
      templateName
    } = await req.json()

    if (!vendorMobile) {
      throw new Error('Vendor mobile number is required')
    }

    if (!WHATSAPP_TOKEN || !PHONE_ID) {
      throw new Error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID in Supabase environment secrets.')
    }

    // Format phone number (ensure country code 91 if 10 digits)
    let formattedPhone = vendorMobile.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }

    const templateToUse = templateName || Deno.env.get('VENDOR_WHATSAPP_TEMPLATE') || 'assign_to_vendor_notification'

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
              { type: 'text', text: complaintId || 'N/A' },                // {{2}}
              { type: 'text', text: vendorComplaintId || 'N/A' },          // {{3}}
              { type: 'text', text: beneficiaryName || 'N/A' },            // {{4}}
              { type: 'text', text: contactNumber || 'N/A' },              // {{5}}
              { type: 'text', text: district || 'N/A' },                   // {{6}}
              { type: 'text', text: block || 'N/A' },                      // {{7}}
              { type: 'text', text: village || 'N/A' },                    // {{8}}
              { type: 'text', text: productType || 'N/A' },                // {{9}}
              { type: 'text', text: assignmentDate || 'N/A' },             // {{10}}
            ],
          },
        ],
      },
    }

    console.log(`Sending WhatsApp template (${templateToUse}) to: ${formattedPhone}`)

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
    } else {
      console.log('WhatsApp message sent successfully:', result)
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: response.status,
    })
  } catch (error) {
    console.error('Function error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
