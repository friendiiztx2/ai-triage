// Markdown and plain-text versions of the Chat Ingest API guide (same content as ingestApiDoc.ts).
// Keep all three in sync with POST /api/chats/ingest in the Sift AI bot.

export const INGEST_API_DOC_MARKDOWN = `# ส่งแชตลูกค้าเข้า Sift AI

เอกสาร API สำหรับเชื่อมต่อระบบแชตเข้ากับ Sift AI · เวอร์ชัน 20 พ.ย. 2569

ระบบของคุณส่งบทสนทนาของลูกค้าเข้ามาที่ API นี้ Sift AI จะบันทึกแชตทันที แล้ววิเคราะห์ต่อในเบื้องหลัง (หมวดปัญหา ความเร่งด่วน แผนก สรุป และคำตอบแนะนำ) ผลจะแสดงในหน้า Back Office

\`\`\`
POST https://triage.dev-d.net/api/chats/ingest
\`\`\`

## 1. การยืนยันตัวตน

แต่ละบริษัทได้ \`client_id\` และ \`client_secret\` ของตัวเอง (ขอได้จากทีม Sift AI) ส่งทั้งสองค่าใน header ของทุกคำขอ

| Header | ค่า | |
|---|---|---|
| \`x-client-id\` | Client ID ของบริษัท | จำเป็น |
| \`x-client-secret\` | Client Secret ของบริษัท | จำเป็น |
| \`Content-Type\` | \`application/json\` | จำเป็น |

> **เก็บ Client Secret ไว้ฝั่ง server เท่านั้น** ห้ามใส่ในโค้ดหน้าเว็บหรือแอปมือถือ และไม่ควรส่งผ่าน query string (\`?client_secret=\`) เพราะค่าจะไปค้างใน log ของ proxy ระบบยังรับค่าผ่าน body หรือ query ได้เพื่อความเข้ากันได้กับของเดิม แต่ให้ใช้ header

## 2. ข้อมูลที่ส่ง (Request body)

| ฟิลด์ | ชนิด | | คำอธิบาย |
|---|---|---|---|
| \`id\` | string | จำเป็น | ID ของห้องแชตฝั่งระบบของคุณ ใช้ค่าเดิมทุกครั้งที่ส่งแชตห้องเดียวกัน ID นี้ต้องไม่ซ้ำกับบริษัทอื่น แนะนำให้ขึ้นต้นด้วยชื่อระบบ เช่น \`oneboxx-123456\` |
| \`customer_id\` | string | จำเป็น | ID ลูกค้าฝั่งระบบของคุณ ถ้ายังไม่เคยมี ระบบจะสร้างลูกค้าใหม่ให้อัตโนมัติ |
| \`conversation\` | string หรือ string[] | จำเป็น | บทสนทนา**ทั้งหมด**ของห้องนั้น ถ้าส่งเป็น array ระบบจะต่อแต่ละบรรทัดด้วยการขึ้นบรรทัดใหม่ แนะนำให้ขึ้นต้นแต่ละบรรทัดด้วยผู้พูด เช่น \`ลูกค้า:\` และ \`แอดมิน:\` ห้ามเป็นค่าว่าง |

ขนาด body สูงสุด 1 MB (ประมาณ 300,000 ตัวอักษรภาษาไทย) ส่งเฉพาะข้อความ ไม่ต้องแนบรูปหรือไฟล์

## 3. ตัวอย่าง

### cURL

\`\`\`bash
curl -X POST https://triage.dev-d.net/api/chats/ingest \\
  -H "Content-Type: application/json" \\
  -H "x-client-id: YOUR_CLIENT_ID" \\
  -H "x-client-secret: YOUR_CLIENT_SECRET" \\
  -d '{
    "id": "oneboxx-123456",
    "customer_id": "oneboxx-cust-7788",
    "conversation": [
      "ลูกค้า: ถอนเงินตั้งแต่เมื่อวานยังไม่เข้าบัญชีเลยค่ะ",
      "แอดมิน: รบกวนแจ้งเวลาที่ทำรายการด้วยค่ะ",
      "ลูกค้า: ประมาณ 4 โมงเย็นค่ะ หน้าประวัติขึ้น Service Unavailable"
    ]
  }'
\`\`\`

### Node.js

\`\`\`js
const res = await fetch('https://triage.dev-d.net/api/chats/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-client-id': process.env.SIFT_CLIENT_ID,
    'x-client-secret': process.env.SIFT_CLIENT_SECRET,
  },
  body: JSON.stringify({
    id: 'oneboxx-123456',
    customer_id: 'oneboxx-cust-7788',
    conversation: 'ลูกค้า: ถอนเงินตั้งแต่เมื่อวานยังไม่เข้าบัญชีเลยค่ะ',
  }),
});
const body = await res.json();
\`\`\`

### ผลลัพธ์เมื่อสำเร็จ

ได้ \`200\` ทันทีหลังบันทึกแชต ตอนนี้ AI ยังไม่ได้วิเคราะห์ \`status\` จึงเป็น \`pending\` และฟิลด์ผลวิเคราะห์ยังเป็น \`null\`

\`\`\`json
{
  "message": "Chat ingested successfully and queued for real-time Sift AI classification",
  "triage_queued": true,
  "data": {
    "id": "oneboxx-123456",
    "customer_id": "oneboxx-cust-7788",
    "conversation": "ลูกค้า: ถอนเงินตั้งแต่เมื่อวานยังไม่เข้าบัญชีเลยค่ะ\\nแอดมิน: ...",
    "status": "pending",
    "company_id": "<company uuid>",
    "created_at": "2026-11-20T07:44:13.754372+00:00",
    "category_id": null,
    "priority": null,
    "summary": null
  }
}
\`\`\`

หลังจากนั้น AI จะวิเคราะห์ตามคิว ปกติใช้เวลาประมาณ 30 วินาทีต่อแชต (นานขึ้นถ้ามีแชตรอคิวมาก) เมื่อเสร็จ \`status\` จะเป็น \`completed\` และแสดงในหน้า Back Office ได้แก่ หมวดปัญหา, ความเร่งด่วน (\`low\` / \`medium\` / \`high\` / \`urgent\`), แผนก, สรุป, อารมณ์ลูกค้า, คำตอบแนะนำ และรายการปัญหาย่อยถ้าแชตเดียวมีหลายเรื่อง

## 4. Error code

ทุก error ตอบเป็น JSON ที่มีฟิลด์ \`error\` ยกเว้นกรณีที่ระบุไว้

| Status | เกิดเมื่อ | ข้อความ error | ควรทำอย่างไร |
|---|---|---|---|
| 400 | ขาด \`id\`, \`customer_id\` หรือ \`conversation\` หรือส่งค่าว่าง | \`Missing parameters: id, customer_id, conversation\` | แก้ข้อมูลแล้วส่งใหม่ |
| 400 | body ไม่ใช่ JSON ที่ถูกต้อง | \`Invalid JSON body.\` | ตรวจการแปลงข้อมูลเป็น JSON ฝั่งระบบของคุณ |
| 401 | ไม่ได้ส่ง \`x-client-id\` หรือ \`x-client-secret\` | \`Unauthorized: Missing Client ID or Client Secret credentials.\` | ใส่ header ให้ครบ |
| 401 | Client ID หรือ Secret ไม่ถูกต้อง | \`Unauthorized: Invalid Client ID or Client Secret.\` | ตรวจค่าที่ได้รับจากทีม Sift AI ไม่ต้องส่งซ้ำ |
| 409 | \`id\` นี้เป็นแชตของบริษัทอื่นอยู่แล้ว | \`Conflict: Chat ID … is already used by another company. Please use a different chat ID.\` | เปลี่ยน \`id\` เช่น เติม prefix ชื่อระบบ |
| 413 | body ใหญ่เกิน 1 MB | \`Request body too large (limit 1mb).\` | ส่งเฉพาะข้อความ ไม่แนบรูปหรือไฟล์ ถ้าบทสนทนายาวจริงให้แจ้งทีม Sift AI |
| 429 | โควต้าแชตของเดือนนี้เต็ม หรือแพ็กเกจถูกระงับ แชตจะ**ไม่ถูกบันทึก** | \`โควต้าการใช้งานต่อเดือนครบแล้ว (Monthly Chat Quota Exceeded)\` พร้อม \`message\` และ \`quota\` | หยุดส่งและแจ้งทีม Sift AI ไม่ต้องส่งซ้ำอัตโนมัติ ดูวันรีเซ็ตได้ที่ \`quota.billingCycle.resetDate\` |
| 500 | ระบบหรือฐานข้อมูลขัดข้อง | ข้อความ error จากระบบ | ส่งซ้ำด้วย \`id\` เดิม (ดูข้อ 6) |
| 502 / 503 / 530 | ระบบ Sift AI ปิดอยู่หรือเชื่อมต่อไม่ได้ (Cloudflare ตอบแทน) | หน้า HTML ของ Cloudflare | ส่งซ้ำด้วย \`id\` เดิม (ดูข้อ 6) |

## 5. ส่งแชตเดิมซ้ำ

ระบบใช้ \`id\` เป็นตัวระบุห้องแชต การส่ง \`id\` เดิมซ้ำจึงเป็นการ**อัปเดต** ไม่ใช่สร้างแชตใหม่ และได้ \`200\` แบบเดียวกับการส่งครั้งแรก

- **แทนที่ ไม่ต่อท้าย:** \`conversation\` ที่ส่งมาใหม่จะแทนที่ของเดิมทั้งหมด จึงต้องส่งบทสนทนาเต็มของห้องทุกครั้ง
- **บทสนทนาเปลี่ยน AI วิเคราะห์ใหม่:** สถานะกลับเป็น \`pending\` แล้ว AI วิเคราะห์ใหม่ทั้งแชต รายการปัญหาย่อยเดิมถูกแทนที่ด้วยผลใหม่ response มี \`"triage_queued": true\`
- **บทสนทนาเดิม ไม่วิเคราะห์ซ้ำ:** ถ้าบทสนทนาเหมือนเดิมทุกตัวอักษรและ AI วิเคราะห์เสร็จแล้ว ระบบตอบ \`200\` พร้อม \`"triage_queued": false\` ผลเดิมยังอยู่ครบ จึงส่งซ้ำหลัง timeout ได้โดยไม่เปลือง
- **ไม่นับโควต้าซ้ำ:** โควต้านับตามจำนวนห้องแชตที่สร้างในรอบบิล ส่ง \`id\` เดิมกี่ครั้งก็นับเป็น 1
- **ผลที่คนแก้แล้วจะไม่ถูกทับ:** ถ้าแอดมินแก้ผลใน Back Office แล้ว และบทสนทนาที่ส่งมาเหมือนเดิม AI จะไม่วิเคราะห์ทับ ถ้าบทสนทนาเปลี่ยน AI จะวิเคราะห์ใหม่

## 6. คำแนะนำในการเชื่อมต่อ

- **ส่งเมื่อไหร่:** ส่งเมื่อห้องแชตปิด หรือเมื่อลูกค้าหยุดพิมพ์สักพัก ไม่ควรส่งทุกข้อความ เพราะ AI ต้องวิเคราะห์ใหม่ทั้งแชตทุกครั้ง
- **ส่งซ้ำเมื่อไหร่:** ส่งซ้ำได้อย่างปลอดภัยด้วย \`id\` เดิมเมื่อได้ 500, 502, 503, 530 หรือ timeout แนะนำให้รอ 5, 30 และ 120 วินาทีตามลำดับ ถ้ายังไม่ได้ให้เก็บไว้ส่งรอบหลัง
- **ไม่ต้องส่งซ้ำ:** 400, 401, 409, 413 และ 429 ส่งซ้ำแล้วก็จะได้ผลเดิม ต้องแก้ข้อมูลหรือแจ้งทีม Sift AI ก่อน
- **Timeout:** ตั้งไว้อย่างน้อย 15 วินาที ปกติระบบตอบภายในไม่กี่วินาที เพราะ AI ทำงานแยกในเบื้องหลัง
- **ทดสอบ:** ใช้ \`GET https://triage.dev-d.net/health\` เช็คว่าระบบเปิดอยู่ ควรตอบ 200
`;

/** Plain-text version: the Markdown with its markup removed, tables turned into "label: value" lines. */
export function markdownToPlainText(md: string): string {
  const out: string[] = [];
  let inCode = false;
  let header: string[] | null = null;
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const inline = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

  for (const line of md.split('\n')) {
    if (line.startsWith('```')) { inCode = !inCode; continue; }
    if (inCode) { out.push('    ' + line); continue; }

    if (line.trim().startsWith('|')) {
      const row = cells(line);
      if (row.every((c) => /^-+$/.test(c))) continue;
      if (!header) { header = row; continue; }
      const parts = row.map((c, i) => (header![i] ? `${header![i]}: ${inline(c)}` : inline(c)));
      out.push('- ' + parts.join(' / '));
      continue;
    }
    if (header) { header = null; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const text = inline(h[2]);
      out.push(text, (h[1].length === 1 ? '=' : '-').repeat(Math.min(60, text.length + 4)));
      continue;
    }
    out.push(inline(line.replace(/^>\s?/, '')));
  }
  return out.join('\n');
}
