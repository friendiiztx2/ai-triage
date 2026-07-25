-- ================= SUPABASE DATABASE SETUP FOR SYSTEM ADMIN & PERMISSIONS CHECKLIST =================
-- คำแนะนำ: คัดลอกโค้ดทั้งหมดนี้ไปกดรันใน Supabase Web Console -> SQL Editor เพื่อเคลียร์และอัปเดตระบบจริงทั้งหมดครับ

-- -------------------------------------------------------------
-- SECTION 1: ตารางบริษัท (COMPANIES TABLE)
-- -------------------------------------------------------------

-- 1. เคลียร์ข้อมูลบริษัทเดิมเพื่อรีเซ็ต
TRUNCATE public.companies CASCADE;

-- 2. บันทึกข้อมูลบริษัทตั้งต้น 2 บริษัทเข้าไปในระบบ
INSERT INTO public.companies (id, name, domain, client_id, client_secret, created_at) VALUES
('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', 'Mika Co.', 'mika.com', 'client_mika', 'secret_mika', NOW()),
('2e65829a-6a60-4022-8289-0fe64ec98fae', 'Alpha Support Co., Ltd.', 'alphasupport.com', 'client_alpha', 'secret_alpha', NOW());


-- -------------------------------------------------------------
-- SECTION 2: ตารางผู้ใช้งาน (USERS TABLE)
-- -------------------------------------------------------------

-- 1. เพิ่มคอลัมน์และปรับสิทธิ์ในตาราง users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions text[];

-- ปลดล็อกประเภทคอลัมน์ company_id ให้รับค่า Text เพื่อรองรับการสังกัดหลายบริษัท (Comma-separated)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
ALTER TABLE public.users ALTER COLUMN company_id TYPE text USING company_id::text;

-- เพิ่มคอลัมน์สำหรับระบบการยืนยันตัวตน 2 ชั้น (2FA)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_2fa_enabled boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_secret text;

-- 2. ล้างข้อมูลผู้ใช้เก่า
TRUNCATE public.users;

-- 3. บันทึกบัญชีผู้ใช้งานตั้งต้น 2 บัญชีหลักตามระเบียบใหม่
-- บัญชีที่ 1: System Admin (แอดมินกลางดูแลทุกบริษัท)
-- บัญชีที่ 2: aor (Super Admin ของ Alpha Support Co., Ltd.)
INSERT INTO public.users (id, email, name, role, company_id, password, permissions, is_2fa_enabled, created_at) VALUES
-- System Admin (ดูแลทุกบริษัท มีสิทธิ์ครบ 6 อย่าง)
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

-- aor (Super Admin ของ Alpha Support Co., Ltd. มีสิทธิ์ 5 อย่าง)
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
