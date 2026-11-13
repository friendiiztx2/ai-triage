# Sift AI — Back Office (BO)

ระบบหลังบ้านสำหรับทีมงานและลูกค้าองค์กร ใช้ดูและจัดการแชตลูกค้าที่ AI คัดแยกแล้ว (Sift AI Triage)
— แดชบอร์ด, รายการแชต, หมวดหมู่, ลูกค้า, รายงาน/AI reports, โควตาการใช้งาน, กลุ่ม Telegram, ผู้ใช้และบริษัท

- **Production:** https://ai-triage-eta.vercel.app (deploy อัตโนมัติจาก branch `main`)
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Vercel

---

## เริ่มใช้งานในเครื่อง (Local development)

1. ติดตั้ง Node.js (เครื่องทีมใช้ `C:\Users\ThisPC\nodejs\...` ตามที่ตั้งไว้ใน `start-local.bat`)
2. ติดตั้ง dependencies: `npm install`
3. สร้างไฟล์ `.env.local` จาก `.env.example` แล้วใส่ค่าให้ครบ (ดูหัวข้อ Environment variables)
4. รัน dev server: ดับเบิลคลิก **`start-local.bat`** หรือ `npm run dev` → เปิด http://localhost:3000

### สคริปต์ที่ใช้บ่อย (ดับเบิลคลิกได้)

| ไฟล์ | ทำอะไร |
|---|---|
| `start-local.bat` | รัน dev server ในเครื่อง |
| `build-check.bat` | รัน `npm run build` แล้วบันทึกผลลง `build-result.log` — **ต้องผ่านก่อน deploy ทุกครั้ง** |
| `Deploy-SiftAI.bat` | commit งานที่ค้าง → push branch ปัจจุบัน → push ขึ้น `main` (Vercel deploy production) ผลอยู่ใน `deploy-result.log` · จะหยุดเองถ้า `main` บน GitHub มีงานที่เครื่องยังไม่มี (ไม่ force push) |

---

## Environment variables

ตั้งใน `.env.local` (ในเครื่อง) และใน **Vercel → Settings → Environment Variables** (ติ๊กทั้ง Production และ Preview)

| ตัวแปร | จำเป็น | คำอธิบาย |
|---|---|---|
| `SUPABASE_URL` | ✅ | URL ของโปรเจกต์ Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | key ฝั่ง server (service_role / secret) — **ห้ามใส่ในโค้ดหรือส่งไปเบราว์เซอร์** |
| `SESSION_SECRET` | ✅ production | ใช้เซ็น token การล็อกอิน (≥ 32 ตัวอักษร) ถ้าไม่มี production จะไม่ให้ใครล็อกอิน · สร้างด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` · เปลี่ยนค่าเมื่อไหร่ ทุกคนต้องล็อกอินใหม่ |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | ไม่บังคับ | แจ้งเตือนรายงานปัญหาเข้ากลุ่ม Telegram ของทีม |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TRIAGE_BACKEND_URL` | ไม่บังคับ | URL ของ BO และ backend AI triage (ค่าที่ขึ้นต้น `NEXT_PUBLIC_` จะถูกส่งไปเบราว์เซอร์ — ห้ามใส่ข้อมูลลับ) |

> ไฟล์ `.env*` ถูก `.gitignore` กันไว้แล้ว ยกเว้น `.env.example` (ใส่เฉพาะชื่อตัวแปร ห้ามใส่ค่าจริง)

---

## โครงสร้างโปรเจกต์

```
src/
├── proxy.ts                 # ด่านแรกของทุก request: ตรวจ token, ส่งไปหน้า login, security headers
├── app/                     # หน้าเว็บ (App Router) — 1 โฟลเดอร์ = 1 หน้า
│   ├── page.tsx             # แดชบอร์ด
│   ├── chats/ categories/ customers/ reports/ ai-reports/
│   ├── usage-quotas/ telegram-groups/ companies/ users/ audit-logs/ schema/ login/
│   └── api/                 # API ฝั่ง server — ที่เดียวที่คุยกับ Supabase ได้
├── components/
│   ├── <หมวด>/              # component แยกตามหน้า: chats, dashboard, users, companies, ...
│   ├── sidebar/             # Sidebar และส่วนประกอบ
│   ├── sound/               # ตั้งค่าเสียงแจ้งเตือน
│   ├── ui/                  # component ใช้ร่วม (Modal, Badge, DatePicker, ...)
│   └── LanguageContext.tsx, ThemeInitializer.tsx, ...   # provider ระดับทั้งแอป
├── hooks/                   # ดึง/จัดการข้อมูลฝั่งหน้าเว็บ (เรียกผ่าน /api/* เท่านั้น)
└── lib/                     # ตรรกะร่วม — auth, jwt, permissions, supabase (server-only), export, ...
scripts/                     # SQL สำหรับฐานข้อมูล (รันเองใน Supabase SQL Editor)
public/                      # ไฟล์ static (manual.html = คู่มือผู้ใช้)
```

---

## ความปลอดภัย (สำคัญ — อ่านก่อนแก้โค้ด)

- **เบราว์เซอร์ห้ามคุยกับ Supabase ตรง** — `src/lib/supabase.ts` เป็น server-only (ถ้า import ในโค้ดฝั่งเบราว์เซอร์จะ error ทันที) หน้าเว็บต้องเรียกผ่าน `/api/*` เท่านั้น
- **การล็อกอิน:** เชื่อเฉพาะ cookie `auth_token` (HttpOnly, เซ็นด้วย `SESSION_SECRET`) · cookie `user_session` และ localStorage ใช้แสดงผลเท่านั้น ห้ามใช้ตัดสินสิทธิ์
- **ทุก API route** ต้องเริ่มด้วย `verifyApiAuth()` และใช้ helper ใน `src/lib/auth.ts` แยกข้อมูลตามบริษัท:
  - `isGlobalAdmin(session)` — system_admin / super_admin เห็นทุกบริษัท
  - `getCompanyContext()` / `getScopedCompanyIds()` — ผู้ใช้อื่นเห็นเฉพาะบริษัทตัวเอง (ไม่มีบริษัท = ไม่เห็นอะไร)
  - `canManageRole()` — ห้ามให้สิทธิ์หรือแก้บัญชีที่สิทธิ์สูงกว่าตัวเอง
- **ห้ามส่ง** `password`, `client_secret` หรือ key ใดๆ กลับไปที่หน้าเว็บ
- **ห้ามใช้** `Cache-Control: public` กับข้อมูลของบริษัท — ใช้ `private, no-store`
- เช็กการตั้งค่า: ล็อกอินเป็น system_admin แล้วเปิด `/api/health/security`
- ปิดสิทธิ์ anon ในฐานข้อมูล: `scripts/security_lockdown_rls.sql` (รันทีละเฟส อ่านคำเตือนในไฟล์ก่อน)

### บทบาทผู้ใช้ (สูง → ต่ำ)

| บทบาท | ขอบเขต |
|---|---|
| `system_admin` | ทุกบริษัท + จัดการบริษัท |
| `super_admin` | ทุกบริษัท (ยกเว้นจัดการ system_admin) |
| `admin` | เฉพาะบริษัทตัวเอง (จัดการผู้ใช้ระดับ admin/staff ในบริษัทได้ตามสิทธิ์ที่ได้รับ) |
| `staff` | เฉพาะบริษัทตัวเอง ดู/จัดการแชต |

---

## Deploy

1. ดับเบิลคลิก `build-check.bat` → ต้องขึ้น **BUILD PASSED**
2. ดับเบิลคลิก `Deploy-SiftAI.bat` → ต้องขึ้น **DEPLOY PUSHED**
3. รอ Vercel build ~2–3 นาที (Vercel → ai-triage → Deployments)
4. ถ้ามีปัญหา: Vercel → Deployments → เลือกตัวก่อนหน้า → **Instant Rollback**
