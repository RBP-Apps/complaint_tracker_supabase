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
  const serviceId =
    import.meta.env.VITE_EMAILJS_SERVICE_ID ||
    import.meta.env.EMAILJS_SERVICE_ID;
  const templateId =
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    import.meta.env.EMAILJS_TEMPLATE_ID;
  const publicKey =
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY ||
    import.meta.env.EMAILJS_PUBLIC_KEY ||
    import.meta.env.VITE_EMAILJS_USER_ID ||
    import.meta.env.EMAILJS_USER_ID;

  if (!serviceId || !templateId || !publicKey) {
    const missing = [];
    if (!serviceId) missing.push("EMAILJS_SERVICE_ID");
    if (!templateId) missing.push("EMAILJS_TEMPLATE_ID");
    if (!publicKey) missing.push("EMAILJS_PUBLIC_KEY");
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

/**
 * EmailJS Helper Service for sending Vendor Assignment Notifications
 */
export const sendVendorAssignmentEmailViaEmailJS = async ({
  to_email,
  vendor_name = "Vendor",
  complaint_id = "",
  vendor_complaint_id = "",
  beneficiary_name = "",
  contact_number = "",
  district = "",
  block = "",
  village = "",
  location = "",
  product_type = "",
  nature_of_complaint = "",
  assignment_date = "",
  document_url = "",
  company_name = "",
}) => {
  const serviceId =
    import.meta.env.VITE_EMAILJS_SERVICE_ID ||
    import.meta.env.EMAILJS_SERVICE_ID;
  const templateId =
    import.meta.env.VITE_EMAILJS_VENDOR_TEMPLATE_ID ||
    import.meta.env.EMAILJS_VENDOR_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    import.meta.env.EMAILJS_TEMPLATE_ID;
  const publicKey =
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY ||
    import.meta.env.EMAILJS_PUBLIC_KEY ||
    import.meta.env.VITE_EMAILJS_USER_ID ||
    import.meta.env.EMAILJS_USER_ID;

  if (!to_email) {
    return { success: false, error: "Recipient vendor email is required" };
  }

  if (!serviceId || !templateId || !publicKey) {
    const missing = [];
    if (!serviceId) missing.push("EMAILJS_SERVICE_ID");
    if (!templateId) missing.push("EMAILJS_VENDOR_TEMPLATE_ID / EMAILJS_TEMPLATE_ID");
    if (!publicKey) missing.push("EMAILJS_PUBLIC_KEY");
    console.warn(`[EmailJS] Missing environment variables: ${missing.join(", ")}`);
    return {
      success: false,
      error: `Missing EmailJS configuration: ${missing.join(", ")}`,
    };
  }

  const computedLocation =
    location ||
    [village, block, district].filter(Boolean).join(", ") ||
    "-";

  const messageText = `Dear ${vendor_name},

A new service complaint has been assigned to you.

• Complaint ID: ${complaint_id || "-"}
• Vendor Complaint ID: ${vendor_complaint_id || "-"}
• Beneficiary: ${beneficiary_name || "-"}
• Contact Number: ${contact_number || "-"}
• Location: ${computedLocation}
• Product Type: ${product_type || "-"}
• Nature of Complaint: ${nature_of_complaint || "-"}
• Assignment Date: ${assignment_date || "-"}
${document_url ? `• Document: ${document_url}` : ""}

Please take immediate action and update the status once attended.`;

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      // Recipient email fields (EmailJS standard keywords)
      to_email,
      recipient_email: to_email,
      to_name: vendor_name,
      vendor_name,

      // Assignment detail variables
      complaint_id,
      vendor_complaint_id: vendor_complaint_id || "-",
      beneficiary_name: beneficiary_name || "-",
      contact_number: contact_number || "-",
      district: district || "-",
      block: block || "-",
      village: village || "-",
      location: computedLocation,
      product_type: product_type || "-",
      nature_of_complaint: nature_of_complaint || "-",
      assignment_date: assignment_date || "-",
      document_url: document_url || "",
      attachment_url: document_url || "",
      company_name: company_name || "-",

      // Generic email fields for templates using standard tags
      subject: `New Service Complaint Assignment - [${complaint_id || "N/A"}]`,
      message: messageText,
      date: assignment_date || "-",
    },
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[EmailJS] API Error:", errText);
      return { success: false, error: errText || "Failed to send email via EmailJS" };
    }

    console.log("[EmailJS] Assignment email sent successfully to:", to_email);
    return { success: true };
  } catch (err) {
    console.error("[EmailJS] Network Error:", err);
    return { success: false, error: err.message };
  }
};
