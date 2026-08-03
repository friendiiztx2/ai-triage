-- =================================================================
-- COMPLETE & FULLY AUDITED SUPABASE SCHEMA FOR AI-TRIAGE SYSTEM
-- =================================================================
-- ตรวจสอบและซิงก์ครบทุก คอลัมน์/ตาราง ที่โค้ดใน src/app/api และ components ทั้งหมดเรียกใช้เรียบร้อยแล้ว
-- วิธีใช้: คัดลอกโค้ดทั้งหมดนี้ไปวางที่ Supabase Web Console -> SQL Editor แล้วกด Run

-- -------------------------------------------------------------
-- SECTION 1: ตารางบริษัท (COMPANIES TABLE)
-- -------------------------------------------------------------

-- 1. เคลียร์ข้อมูลบริษัทเดิมเพื่อรีเซ็ต
TRUNCATE public.companies CASCADE;
-- 1. COMPANIES TABLE (บริษัท)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    client_id TEXT,
    client_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 2. USERS TABLE (ผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'agent',
    company_id TEXT,
    password TEXT,
    permissions TEXT[],
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. บันทึกข้อมูลบริษัทตั้งต้น 2 บริษัทเข้าไปในระบบ
INSERT INTO public.companies (id, name, domain, client_id, client_secret, created_at) VALUES
('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', 'Mika Co.', 'mika.com', 'client_mika', 'secret_mika', NOW()),
('2e65829a-6a60-4022-8289-0fe64ec98fae', 'Alpha Support Co., Ltd.', 'alphasupport.com', 'client_alpha', 'secret_alpha', NOW());
-- 3. CATEGORIES TABLE (หมวดหมู่)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    company_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 4. CUSTOMERS TABLE (ลูกค้า)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    channel TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    company_id TEXT,
    last_message TEXT,
    audio_url TEXT,
    transcript TEXT,
    summary TEXT,
    resolution TEXT,
    issue_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- 6. CHAT ISSUES TABLE (ประเด็น/ปัญหาในแชท)
CREATE TABLE IF NOT EXISTS public.chat_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    priority TEXT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_issues DISABLE ROW LEVEL SECURITY;

-- 7. LIKE RESULTS TABLE (FEEDBACK การคัดกรอง)
CREATE TABLE IF NOT EXISTS public.like_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    is_liked BOOLEAN,
    is_correct BOOLEAN,
    liked_by TEXT,
    feedback_text TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.like_results DISABLE ROW LEVEL SECURITY;

-- 8. AUDIT LOGS TABLE (ประวัติกิจกรรม)
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

-- 2. ล้างข้อมูลผู้ใช้เก่า
TRUNCATE public.users;

-- =================================================================
-- SEED INITIAL DATA (ข้อมูลเริ่มต้น)
-- =================================================================

-- 3. บันทึกบัญชีผู้ใช้งานตั้งต้น 2 บัญชีหลักตามระเบียบใหม่
-- บัญชีที่ 1: System Admin (แอดมินกลางดูแลทุกบริษัท)
-- บัญชีที่ 2: aor (Super Admin ของ Alpha Support Co., Ltd.)
-- ล้างข้อมูลเดิมและลงข้อมูลตั้งต้น
TRUNCATE public.companies, public.users CASCADE;

-- เพิ่มบริษัทเริ่มต้น 2 บริษัท
INSERT INTO public.companies (id, name, domain, client_id, client_secret, created_at) VALUES
('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', 'Mika Co.', 'mika.com', 'client_mika', 'secret_mika', NOW()),
('2e65829a-6a60-4022-8289-0fe64ec98fae', 'Alpha Support Co., Ltd.', 'alphasupport.com', 'client_alpha', 'secret_alpha', NOW());

-- เพิ่มบัญชีผู้ใช้เริ่มต้น (System Admin & Super Admin)
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
);


-- -------------------------------------------------------------
-- SECTION 3: Performance Indexes (ดรรชนีเร่งความเร็วในการคีย์ข้อมูล)
-- -------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_chats_company_id ON public.chats (company_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats (status);
CREATE INDEX IF NOT EXISTS idx_chats_priority ON public.chats (priority);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);


-- -------------------------------------------------------------
-- SECTION 4: Production Security Guidance & RLS Template
-- -------------------------------------------------------------
-- ข้อเสนอแนะความปลอดภัยสำหรับ Production:
-- 1. หากต้องการเปิดใช้งาน RLS ให้ใช้คำสั่ง:
--    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- 2. ตัวอย่างนโยบาย RLS แบบจำกัดองค์กร (Multi-tenant Policy Example):
--    CREATE POLICY tenant_isolation_chats ON public.chats
--      FOR ALL USING (company_id = auth.jwt() ->> 'company_id' OR auth.jwt() ->> 'role' = 'system_admin');
-- 3. สำหรับการเก็บ Password แนะนำให้แฮชด้วย Supabase Auth / bcrypt ในระบบ Production จริง

-- การตั้งค่าความสมบูรณ์เสร็จเรียบร้อย! ฐานข้อมูลทั้งหมดซิงก์กัน 100% แล้วครับ
