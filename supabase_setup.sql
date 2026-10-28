-- =================================================================
-- COMPLETE SUPABASE SCHEMA FOR SIFT AI (https://dmorfsududiqtnzrhdvb.supabase.co)
-- =================================================================
-- วิธีใช้: คัดลอกโค้ดทั้งหมดนี้ไปวางที่ Supabase Dashboard -> SQL Editor แล้วกด Run

-- 1. COMPANIES TABLE (บริษัท)
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    client_id TEXT,
    client_secret TEXT,
    quota INT DEFAULT 1000,
    tier_id TEXT DEFAULT 'starter',
    telegram_group_id TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    line_oa_name TEXT,
    line_channel_id TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 2. USERS TABLE (ผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'staff',
    company_id TEXT,
    password TEXT,
    permissions TEXT[],
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. CATEGORIES TABLE (หมวดหมู่)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT,
    name_en TEXT,
    description TEXT,
    color TEXT,
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 4. CUSTOMERS TABLE (ลูกค้า)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- 5. CHATS TABLE (แชท & ประวัติคัดกรอง)
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT,
    customer_name TEXT,
    channel TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    urgency TEXT DEFAULT 'low',
    confidence NUMERIC DEFAULT 0,
    category_id TEXT,
    company_id TEXT,
    conversation TEXT,
    last_message TEXT,
    audio_url TEXT,
    transcript TEXT,
    summary TEXT,
    resolution TEXT DEFAULT 'Pending',
    keywords JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    issue_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- 6. CHAT ISSUES TABLE (ประเด็น/ปัญหาในแชท)
CREATE TABLE IF NOT EXISTS public.chat_issues (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
    category_id TEXT,
    priority TEXT DEFAULT 'low',
    confidence NUMERIC DEFAULT 0,
    title TEXT,
    summary TEXT,
    issue_summary TEXT,
    status TEXT DEFAULT 'open',
    resolution TEXT,
    sentiment TEXT,
    department TEXT,
    recommended_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_issues DISABLE ROW LEVEL SECURITY;

-- 7. LIKE RESULTS & AI FEEDBACK TABLES (FEEDBACK การคัดกรอง)
CREATE TABLE IF NOT EXISTS public.like_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT,
    is_liked BOOLEAN,
    is_correct BOOLEAN,
    liked_by TEXT,
    feedback_text TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.like_results DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT NOT NULL,
    company_id TEXT,
    reported_by TEXT NOT NULL,
    reporter_id TEXT,
    reasons TEXT[] DEFAULT '{}',
    comment TEXT,
    ai_snapshot JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    developer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_feedback_reports DISABLE ROW LEVEL SECURITY;

-- 8. ACTIVITY LOGS & AUDIT LOGS TABLES (ประวัติกิจกรรม)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT,
    user_id TEXT,
    user_name TEXT,
    action_type TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id TEXT,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 9. TELEGRAM GROUPS & MEMBERS TABLES (ผูกกลุ่มแจ้งเตือนเคสด่วน Telegram)
CREATE TABLE IF NOT EXISTS public.telegram_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id TEXT UNIQUE NOT NULL,
    group_name TEXT,
    company_id TEXT,
    status TEXT DEFAULT 'active',
    member_count INT DEFAULT 0,
    bot_is_admin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.telegram_groups DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id TEXT NOT NULL,
    user_id TEXT,
    username TEXT,
    first_name TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.telegram_group_members DISABLE ROW LEVEL SECURITY;

-- 10. SEED INITIAL COMPANIES & ADMIN ACCOUNTS (ปลอดภัย ไม่ลบข้อมูลเดิม)
INSERT INTO public.companies (id, name, domain, client_id, client_secret, quota, tier_id, created_at) VALUES
('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', 'Mika Co.', 'mika.com', 'client_mika', 'secret_mika', 5000, 'growth', NOW()),
('2e65829a-6a60-4022-8289-0fe64ec98fae', 'Alpha Support Co., Ltd.', 'alphasupport.com', 'client_alpha', 'secret_alpha', 5000, 'growth', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name, role, company_id, password, permissions, is_2fa_enabled, created_at) VALUES
(
  '10000000-0000-0000-0000-000000000001', 
  'friendiiztx2@gmail.com', 
  'System Admin (แอดมินกลางดูแลทุกบริษัท)', 
  'system_admin', 
  NULL, 
  'Aa234234*', 
  ARRAY['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv'],
  false, 
  NOW()
),
(
  '20000000-0000-0000-0000-000000000002', 
  'aor', 
  'aor', 
  'super_admin', 
  '2e65829a-6a60-4022-8289-0fe64ec98fae', 
  'Aor278444', 
  ARRAY['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'export_csv'],
  false, 
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 11. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_chats_company_id ON public.chats (company_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats (status);
CREATE INDEX IF NOT EXISTS idx_chats_priority ON public.chats (priority);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);
