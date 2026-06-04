-- 1. Create logs table to track sent notifications and prevent duplicates
CREATE TABLE IF NOT EXISTS public.whatsapp_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL, -- references FMS(complaint_id)
    template_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed'
    response_payload JSONB,
    error_message TEXT
);

-- Index for daily duplicate prevention check
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_dedup 
ON public.whatsapp_reminder_logs (complaint_id, template_name, (sent_at::date));


-- 2. SQL Function to fetch Pending Reminders (Today <= Due Date)
CREATE OR REPLACE FUNCTION public.get_pending_reminders()
RETURNS TABLE (
    complaint_id VARCHAR,
    company_name VARCHAR,
    beneficiary_name VARCHAR,
    contact_number VARCHAR,
    district VARCHAR,
    block VARCHAR,
    village VARCHAR,
    product VARCHAR,
    resolved_date DATE,
    reporter_name VARCHAR,
    technician_contact VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
      f.complaint_id::VARCHAR,
      f.company_name::VARCHAR,
      f.beneficiary_name::VARCHAR,
      f.contact_number::VARCHAR,
      f.district::VARCHAR,
      f.block::VARCHAR,
      f.village::VARCHAR,
      f.product::VARCHAR,
      f.resolved_date::DATE,
      f.reporter_name::VARCHAR,
      f.technician_contact::VARCHAR
    FROM public."FMS" f
    WHERE f.actual1 IS NULL
      AND f.resolved_date IS NOT NULL
      AND CURRENT_DATE <= f.resolved_date::date
      AND f.technician_contact IS NOT NULL 
      AND f.technician_contact != ''
      AND NOT EXISTS (
        SELECT 1 
        FROM public.whatsapp_reminder_logs l
        WHERE l.complaint_id = f.complaint_id
          AND l.template_name = 'complaint_pending_reminder'
          AND l.sent_at::date = CURRENT_DATE
      );
END;
$$;


-- 3. SQL Function to fetch Overdue Reminders (Today > Due Date)
CREATE OR REPLACE FUNCTION public.get_overdue_reminders()
RETURNS TABLE (
    complaint_id VARCHAR,
    company_name VARCHAR,
    beneficiary_name VARCHAR,
    contact_number VARCHAR,
    district VARCHAR,
    block VARCHAR,
    village VARCHAR,
    product VARCHAR,
    resolved_date DATE,
    reporter_name VARCHAR,
    technician_contact VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
      f.complaint_id::VARCHAR,
      f.company_name::VARCHAR,
      f.beneficiary_name::VARCHAR,
      f.contact_number::VARCHAR,
      f.district::VARCHAR,
      f.block::VARCHAR,
      f.village::VARCHAR,
      f.product::VARCHAR,
      f.resolved_date::DATE,
      f.reporter_name::VARCHAR,
      f.technician_contact::VARCHAR
    FROM public."FMS" f
    WHERE f.actual1 IS NULL
      AND f.resolved_date IS NOT NULL
      AND CURRENT_DATE > f.resolved_date::date
      AND f.technician_contact IS NOT NULL 
      AND f.technician_contact != ''
      AND NOT EXISTS (
        SELECT 1 
        FROM public.whatsapp_reminder_logs l
        WHERE l.complaint_id = f.complaint_id
          AND l.template_name = 'complaint_overdue_reminder'
          AND l.sent_at::date = CURRENT_DATE
      );
END;
$$;
