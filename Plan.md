# 📋 แผนการปรับปรุงระบบ Backoffice (BO) & Dashboard — Sift AI

> **เอกสารวางแผนงาน (Implementation Plan)**  
> **เป้าหมาย:** ปรับเปลี่ยนข้อมูลตัวผู้พัฒนาหน้า BO/Dashboard และยกเครื่องปรับปรุง UI/UX ให้ใช้งานง่าย สะอาดตา และเพิ่มประสิทธิภาพการทำงานของทีมงานตาม Feedback

---

## 1. วัตถุประสงค์และภาพรวม (Objectives & Executive Summary)

1. **อัปเดตข้อมูลผู้พัฒนาระบบ (Developer Identity & Attribution):**  
   ปรับเปลี่ยนข้อความแสดงชื่อผู้พัฒนาเดิม (`ระบบพัฒนาร่วมกับ อ้อ (Or)` / `Developed with Or`) บริเวณท้าย Sidebar และจุดที่เกี่ยวข้อง ให้เป็นชื่อผู้พัฒนาหรือทีมพัฒนาชุดใหม่
2. **ยกระดับ UI/UX ภาพรวมของระบบ (Overall Usability Improvement):**  
   ปรับแดชบอร์ดและการจัดการเคสแชตให้ตอบโจทย์การทำงานของทีมแอดมินและซัพพอร์ต ลดความซับซ้อน ลดความแออัดของ UI และทำให้ Action ต่างๆ ทำได้รวดเร็ว (Fast Triage)
3. **จัดระเบียบโครงสร้างโค้ด (Code Architecture Refactoring):**  
   แยกไฟล์ขนาดใหญ่ เช่น `src/app/page.tsx` (1,400+ บรรทัด) และ `src/app/chats/page.tsx` (2,500+ บรรทัด) ออกเป็นชิ้นส่วนย่อย (Modular Components) เพื่อให้ดูแลรักษาและพัฒนาต่อง่าย

---

## 2. การสำรวจระบบปัจจุบัน (Current State Audit)

| ส่วนของระบบ | ไฟล์หลัก | สถานะปัจจุบัน | ประเด็นที่ต้องปรับปรุง |
|---|---|---|---|
| **เครดิตผู้พัฒนา** | `src/components/Sidebar.tsx`<br>`src/components/LanguageContext.tsx` | ฮาร์ดโค้ดเป็นชื่อผู้พัฒนาเดิม | ปรับแก้ให้รองรับชื่อผู้พัฒนาใหม่ และเพิ่มลิงก์หรือ System Info |
| **แดชบอร์ดภาพรวม (Overview)** | `src/app/page.tsx` | รวม Logic ทั้งหมดไว้ในไฟล์เดียว (1,424 บรรทัด) | กราฟและการ์ดตัวเลขมีรายละเอียดหนาแน่น กราฟเส้นแนวโน้มอ่านยากในจอมือถือ/แท็บเล็ต |
| **การจัดการแชต (Chats)** | `src/app/chats/page.tsx` | ขนาด 2,535 บรรทัด, ฟิลเตอร์หลายระดับ | ตัวกรองและการแสดงผล AI Triage Recommendation ยังซับซ้อน ปรับให้มี One-click actions |
| **เมนูนำทาง (Sidebar)** | `src/components/Sidebar.tsx` | เมนูและการสลับภาษา/ธีม | ปรับปรุง Hierarchy และสถานะ Active ให้อ่านง่าย สบายตาขึ้น |
| **Framework Warning** | `src/middleware.ts` | Next.js 16 แจ้งเตือน Deprecation | อัปเกรดตามแนวทางของ Next.js 16 (`proxy` convention) |

---

## 3. แผนงานการปรับปรุงในแต่ละส่วน (Detailed Scope of Work)

### ส่วนที่ 1: การเปลี่ยนข้อมูลตัวผู้พัฒนาหน้า BO / Dashboard (Developer Attribution) — ✅ ดำเนินการเรียบร้อยแล้ว
* **สถานะ:** เสร็จสมบูรณ์ (Completed)
* **สิ่งที่อัปเดต:**
  * ภาษาไทย (`th`): `ระบบพัฒนาโดยทีม Sift AI`
  * ภาษาอังกฤษ (`en`): `Developed by Sift AI Team`
  * ปรับแต่ง UI บริเวณส่วนท้ายของ Sidebar ให้มี Version Badge `v3.0 • Sift AI Backoffice` สวยงามและเป็นสัดส่วนขึ้นใน [Sidebar.tsx](file:///d:/siftai-bo/src/components/Sidebar.tsx) และ [LanguageContext.tsx](file:///d:/siftai-bo/src/components/LanguageContext.tsx)

---

### ส่วนที่ 2: ปรับปรุง UI/UX แดชบอร์ดภาพรวม (Dashboard Overview) — ✅ ดำเนินการเรียบร้อยแล้ว
* **สถานะ:** เสร็จสมบูรณ์ (Completed)
* **สิ่งที่ได้รับการปรับปรุงใน [src/app/page.tsx](file:///d:/siftai-bo/src/app/page.tsx):**
  * **Quick Timeframe Segmented Control:** เปลี่ยนระบบเลือกช่วงเวลาเป็นชุดปุ่ม Pill สไตล์โมเดิร์น `[ วันนี้ ]` `[ 7 วัน ]` `[ 30 วัน ]` `[ กำหนดเอง 📅 ]` สลับช่วงเวลาได้ทันทีไม่ต้องกด Dropdown หลายชั้น
  * **KPI Metric Cards (4 การ์ดหลัก):** ออกแบบการ์ดสรุปสถิติใหม่ให้มีลำดับชั้นสายตาชัดเจน (แชตทั้งหมด, รอคัดแยก, ด่วนที่สุด, ลูกค้าลงทะเบียน) มีไมโครแอนิเมชัน Pulse เตือนเคสด่วน และลิงก์เจาะลึกไปยังหน้ารายการแชต
  * **AI Daily Insight Banner:** สรุปภาพรวมและคำแนะนำเชิงปฏิบัติการแบบ Glassmorphism สบายตา ไฮไลต์ประเด็นสำคัญประจำวันแบบอัตโนมัติ
  * **หมวดหมู่ปัญหา (Category Breakdown):** แสดงการ์ดปัญหาพร้อม Badge อันดับความถี่ (#1, #2, #3, ...) สัดส่วนเปอร์เซ็นต์ และแถบหลอดความคืบหน้า (Mini progress bar)
  * **AI Accuracy Audit Card:** ปรับแถบแสดงอัตราความแม่นยำ พร้อมสถานะคุณภาพ (ดีเยี่ยม / ดี / ควรปรับจูน) และลิงก์แยกดูเคสที่ยืนยันตาม AI หรือแอดมินแก้ไข Override
  * **Charts & Data Visualization:** ปรับปรุงกราฟเส้นแนวโน้มปัญหาตามช่วงเวลา (Line Chart) และกราฟแท่งระดับความเร่งด่วน (Bar Chart) ให้ใช้สีพาสเทล High-contrast อ่านง่ายทั้ง Light และ Dark Mode รองรับการคลิกที่แท่งเพื่อกรองข้อมูลทันที
  * **Code Cleanup:** ลบโค้ดส่วนที่ไม่ถูกเรียกใช้งานและปรับให้รองรับ React 19 / Next.js 16 อย่างสมบูรณ์ Type Check ผ่าน 100%

---

### ส่วนที่ 3: ปรับปรุง UI/UX หน้ารายการแชตและคัดแยกเคส (Chats & Triage Management) — ✅ ดำเนินการเรียบร้อยแล้ว
* **สถานะ:** เสร็จสมบูรณ์ (Completed)
* **ระบบกรองข้อมูล (Filter Toolbar):**
  * จัดแถบเครื่องมือค้นหา (Search) และตัวกรอง (Status, Priority, Department) ให้เป็นระเบียบ
  * แสดง Active Filter Tags พร้อมปุ่มล้างตัวกรองอย่างชัดเจน
* **ตารางรายการแชต (Chat Table & Cards):**
  * เพิ่ม Priority Visual Accent (เช่น แถบสีด้านซ้ายของแถว: แดง = ด่วนที่สุด, ส้ม = ด่วน, น้ำเงิน = ปกติ)
  * ปรับ Badge แท็กปัญหา (#ฝากถอน, #เข้าสู่ระบบ, #ปัญหาเว็บ) ให้อ่านง่าย สบายตา
  * เพิ่ม Quick Status Toggle หรือ Quick Assign ได้จากหน้าตารางโดยไม่ต้องกดเข้าหน้าต่างย่อยทุกครั้ง
* **หน้าต่างรายละเอียดแชต (Chat Detail & AI Recommendation Drawer):**
  * แบ่ง Layout 2 ฝั่งชัดเจน: ฝั่งประวัติแชตบทสนทนาจริง และฝั่งผลการวิเคราะห์ของ AI
  * **AI Recommendation Card:** ปรับบล็อกผลการคัดกรองแบบ Multi-Issue ให้เป็นการ์ดย่อยชัดเจน พร้อมปุ่ม **"คัดลอกบทสนทนาแนะนำ (One-click Copy)"** เพื่อให้แอดมินนำไปตอบลูกค้าได้ทันที
  * จัดการปุ่มบันทึก/ส่งต่อแผนก (Transfer / Resolve) ให้เด่นชัดและใช้งานง่าย

---

### ส่วนที่ 4: การนำทางและการตั้งค่าระบบ (Navigation & Global Usability)
* **Sidebar Navigation:**
  * ปรับไอคอนและตัวหนังสือให้มีระยะห่าง (Whitespace) เหมาะสม
  * โหมดหดแถบเมนู (Collapsed Sidebar) ให้มี Floating Tooltip แสดงชื่อเมนูเมื่อ Hover
* **Notification & Sound Alert:**
  * ปรับปุ่มเปิด/ปิดเสียงเตือนเคสด่วนให้อยู่ในตำแหน่งที่สังเกตง่าย
  * เพิ่ม Visual Alert (Pulse / Toast) เมื่อมีเคสด่วนเข้ามาใหม่

---

### ส่วนที่ 5: การปรับปรุงเชิงโครงสร้างและประสิทธิภาพ (Refactoring & Modernization) — ✅ ดำเนินการเรียบร้อยแล้ว
* **สถานะ:** เสร็จสมบูรณ์ (Completed)
* **แยก Component ย่อย (Component Modularization):**
  * ดึง Modal และ Chart ออกเป็นไฟล์ย่อยใน `src/components/dashboard/` และ `src/components/chats/`
  * ลดความหน่วงในการเรนเดอร์ (Reduce Re-renders)
* **Next.js 16 Compliance:**
  * อัปเดต `middleware.ts` เพื่อลดคำเตือน Deprecation ให้สอดคล้องกับ Next.js 16

---

## 4. แผนงานการดำเนินงานทีละขั้น (Implementation Phases)

```mermaid
flowchart TD
    A["Phase 1: Developer Info & Config Setup<br>(เปลี่ยนชื่อผู้พัฒนาใน Sidebar/Context)"] --> B["Phase 2: Dashboard Overview Revamp<br>(ปรับ UI การ์ด KPI, กราฟ, Quick Filters)"]
    B --> C["Phase 3: Chats & AI Triage Redesign<br>(แถบตัวกรอง, ตารางแชต, กล่องคำแนะนำ AI)"]
    C --> D["Phase 4: Component Refactoring<br>(แยกไฟล์ย่อย, จัดการ Deprecation)"]
    D --> E["Phase 5: UX Polish & Quality Check<br>(ตรวจความเรียบร้อย Dark/Light mode, ทดสอบจริง)"]
```

1. **ระยะที่ 1: อัปเดตข้อมูลผู้พัฒนาและการตั้งค่าพื้นฐาน (วันแรก)**
   - เปลี่ยนชื่อผู้พัฒนาใน `LanguageContext.tsx` และ `Sidebar.tsx`
   - ตรวจสอบความถูกต้องทั้งภาษาไทยและอังกฤษ
2. **ระยะที่ 2: ปรับโฉมหน้า Dashboard Overview (วันที่ 1 - 2)**
   - ปรับปรุงการ์ดสถิติ (Metric Cards)
   - ปรับแต่งกราฟ Recharts ให้อ่านง่ายและสวยงาม
3. **ระยะที่ 3: ปรับปรุงหน้ารายการแชตและกล่อง AI Triage (วันที่ 2 - 3)**
   - เพิ่มความสะดวกในการกรองและค้นหาแชต
   - ปรับปรุง Drawer รายละเอียดแชตและปุ่ม Quick Copy แนะนำคำตอบ
4. **ระยะที่ 4: ทำความสะอาดโค้ดและแยกโมดูล (วันที่ 3 - 4)**
   - แตกไฟล์ `page.tsx` และ `chats/page.tsx` เป็นส่วนย่อย
   - แก้ไขคำเตือน Next.js Deprecation
5. **ระยะที่ 5: ทดสอบและส่งมอบงาน (วันที่ 4)**
   - ตรวจสอบการแสดงผลบนจอขนาดต่างๆ และ Dark/Light Mode
   - ทดสอบการเชื่อมต่อกับ Supabase และฟังก์ชันทั้งหมด

---

## 5. จุดที่ต้องการยืนยันเพิ่มเติม (Pending User Confirmation)

1. **ชื่อผู้พัฒนาใหม่:**  
   ต้องการให้แสดงชื่อหรือข้อความอย่างไรในแถบด้านล่างของระบบ (เช่น ระบุชื่อบุคคล, ชื่อทีมพัฒนา, หรือชื่อบริษัท)?
2. **Feedback เพิ่มเติมเฉพาะจุด:**  
   มีปัญหาหรือ Feedback จากการใช้งานจริงจุดไหนที่ทีมงานต้องการให้เน้นเป็นพิเศษเพิ่มเติมหรือไม่?
