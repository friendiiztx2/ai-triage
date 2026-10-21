-- ==============================================================
-- Schema: ai_feedback_reports (ตารางเก็บข้อมูลการรายงานข้อผิดพลาด AI)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.ai_feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT NOT NULL,
    company_id TEXT,
    reported_by TEXT NOT NULL,
    reporter_id TEXT,
    reasons TEXT[] DEFAULT '{}',
    comment TEXT,
    ai_snapshot JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'ignored')),
    developer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index สำหรับค้นหาตาม chat_id และ status
CREATE INDEX IF NOT EXISTS idx_ai_reports_chat_id ON public.ai_feedback_reports(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_status ON public.ai_feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON public.ai_feedback_reports(created_at DESC);

COMMENT ON TABLE public.ai_feedback_reports IS 'ตารางบันทึกรายงานปัญหาที่เจ้าหน้าที่แจ้งว่า AI วิเคราะห์ไม่ถูกต้อง';
