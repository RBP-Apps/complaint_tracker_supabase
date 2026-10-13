/**
 * EmailJS Helper Service for sending letters via EmailJS
 */
export const sendEmailViaEmailJS = async ({
  to_email,
  to_name = "Vendor",
  company_name = "",
  letter_no = "",
  complaint_id = "",
  subject = "",
  pdf_url = "",
  date = "",
  officer_name = "District Incharge",
  department = "CREDA",
  district = "",
  beneficiary_name = ""
}) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || import.meta.env.VITE_EMAILJS_USER_ID;

  if (!serviceId || !templateId || !publicKey) {
    const missing = [];
    if (!serviceId) missing.push("VITE_EMAILJS_SERVICE_ID");
    if (!templateId) missing.push("VITE_EMAILJS_TEMPLATE_ID");
    if (!publicKey) missing.push("VITE_EMAILJS_PUBLIC_KEY");
    console.warn(`[EmailJS] Missing environment variables: ${missing.join(", ")}`);
    return {
      success: false,
      error: `Missing EmailJS configuration: ${missing.join(", ")}`
    };
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email,
      to_name,
      company_name,
      letter_no,
      complaint_id,
      subject,
      pdf_url,
      date,
      officer_name,
      department,
      district,
      beneficiary_name,
      message: `Dear ${to_name},\n\nA service confirmation letter has been generated with Ref: ${letter_no} for Complaint ID: ${complaint_id}.\n\nView PDF: ${pdf_url}`
    }
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[EmailJS] API Error:", errText);
      return { success: false, error: errText || "Failed to send email via EmailJS" };
    }

    console.log("[EmailJS] Email sent successfully to:", to_email);
    return { success: true };
  } catch (err) {
    console.error("[EmailJS] Network Error:", err);
    return { success: false, error: err.message };
  }
};
