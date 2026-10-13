-- ==========================================================
-- Report History & Audit Logs Table for Complaints Tracker
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.report_history (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL UNIQUE,
    report_name VARCHAR(150) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    date_range VARCHAR(100),
    start_date DATE,
    end_date DATE,
    applied_filters JSONB DEFAULT '{}'::jsonb,
    summary_metrics JSONB DEFAULT '{}'::jsonb,
    total_records INTEGER DEFAULT 0,
    generated_by VARCHAR(100) DEFAULT 'System',
    export_format VARCHAR(50) DEFAULT 'PDF', -- PDF, Excel, Email, WhatsApp
    file_url TEXT,
    email_recipient TEXT,
    email_status VARCHAR(50), -- success, failed, pending, not_applicable
    whatsapp_recipient TEXT,
    whatsapp_status VARCHAR(50), -- success, failed, pending, not_applicable
    status VARCHAR(50) DEFAULT 'Completed', -- Completed, Failed, Processing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_history_type ON public.report_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_created_at ON public.report_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_by ON public.report_history(generated_by);
