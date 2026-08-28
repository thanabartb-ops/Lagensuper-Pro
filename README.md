# LSUPERAGENT — V11 Public Beta Preview

Thai AI Workspace (AI ช่วยคิด ทำไว งานสำเร็จ ทุกไอเดีย...เป็นผลงาน)

## 📌 สถานะระบบและการเชื่อมต่อ (Current State)
- **สถานะ AI Gateway:** `NOT_CONNECTED`
- **Adapter ที่ใช้งาน:** `MockRuntimeAdapter` (Provider-Neutral Architecture)
- **ฐานข้อมูลและสิทธิ์การเข้าถึง:** Supabase Authority สำหรับ Authentication, Memory และ Audit Records
- **Public Marketing Site:** https://www.wokers-wise.com/

## 🛠️ โครงสร้างพื้นผิวการทำงานหลัก (Core Surfaces)
1. **Landing / Home Dashboard:** Hero, Composer, 5 Quick-Access Cards, Services & Tools, Tool Detail, Closing CTA
2. **Smart Chat (`smart_chat`):** โหมดถาม-ตอบอัจฉริยะภาษาไทย พร้อมสถานะ Streaming แบบละเอียด
3. **Deep Research (`deep_research`):** การสืบค้น เจาะลึก และสร้างรายงานสรุปเชิงวิเคราะห์
4. **Image Generation (`create_image`):** กระบวนการ `request -> BRIEF_PICTURE -> @Approved/@Rejected -> render -> QC`
5. **Agent Mode (`agent_mode`):** มอบหมายงานให้ AI ดำเนินการเป็นขั้นตอน
6. **Memory (`memory`):** จัดเก็บบริบทและกฎเกณฑ์สำคัญ
7. **Settings (`settings`):** กำหนดค่าเวิร์กสเปซและสถานะ Gateway
8. **Runtime Status (`runtime`):** วินิจฉัยเส้นทางและตรวจสอบสถานะ Adapter
9. **Audit Log (`audit`):** บันทึกประวัติกิจกรรมของระบบ

## 🚀 การติดตั้งและรันโปรเจกต์ (Setup Instructions)
```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด Development (Port 3000)
npm run dev

# ทดสอบ Type checking และ Lint
npm run lint

# Build สำหรับ Production
npm run build
```

## 🧪 การรันแบบทดสอบ (Testing)
```bash
npm run lint
```
