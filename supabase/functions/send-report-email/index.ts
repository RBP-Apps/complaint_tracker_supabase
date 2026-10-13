import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'reports@complaint-tracker.com'

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
      recipients, 
      subject, 
      message, 
      reportTitle,
      format,
      pdfBase64,
      excelBase64,
      fileName
    } = await req.json()

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      throw new Error('At least one recipient email address is required')
    }

    const recipientList = Array.isArray(recipients) 
      ? recipients.map((r: string) => r.trim()).filter(Boolean)
      : [recipients.trim()]

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipientList.filter((e: string) => !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email address format: ${invalidEmails.join(', ')}`)
    }

    // Prepare attachments
    const attachments = []
    if (pdfBase64 && (format === 'PDF' || format === 'Both')) {
      attachments.push({
        filename: `${fileName || 'Report'}.pdf`,
        content: pdfBase64,
      })
    }

    if (excelBase64 && (format === 'Excel' || format === 'Both')) {
      attachments.push({
        filename: `${fileName || 'Report'}.xlsx`,
        content: excelBase64,
      })
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured in Supabase secrets.")
      return new Response(JSON.stringify({ 
        success: false, 
        serviceConfigured: false,
        message: "Email service is not yet configured with RESEND_API_KEY in Supabase secrets. Please configure RESEND_API_KEY to send emails directly.",
        recipients: recipientList
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      })
    }

    // Call Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipientList,
        subject: subject || `Report: ${reportTitle || 'Application Data'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${reportTitle || 'Generated Report'}</h2>
            <p style="color: #475569; font-size: 14px;">${message || 'Please find attached the generated report from Complaint Tracker.'}</p>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; color: #64748b; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Format:</strong> ${format || 'Document'}</p>
              <p style="margin: 4px 0;"><strong>Generated Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
              This is an automated report dispatched from Complaint Tracker Management System.
            </p>
          </div>
        `,
        attachments: attachments.length > 0 ? attachments : undefined
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(resendData.message || 'Failed to dispatch email via Resend')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      serviceConfigured: true,
      data: resendData,
      recipients: recipientList
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in send-report-email function:", error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
