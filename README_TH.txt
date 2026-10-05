ติดตั้ง GA4 สำหรับแอปแพทย์แผนไทย 16 แอป
Measurement ID: G-DT9E54XRZZ
เว็บไซต์: https://jeerapat2010-cpu.github.io/my-html-app/

1. สำรองไฟล์เดิมบน GitHub ก่อน
2. แตก ZIP และอัปโหลดไฟล์ HTML ทั้ง 16 ไฟล์ไปยังตำแหน่งเดิมของแอปใน my-html-app (ไม่ต้องอัปโหลดโฟลเดอร์ครอบ)
3. ชื่อไฟล์ในชุดนี้ตรงกับลิงก์ใน index ที่ส่งมา จึงตัด (1), (3), (4) ที่เกิดจากการดาวน์โหลดออกแล้ว
4. Commit changes และรอ GitHub Pages อัปเดต
5. เปิดแอปจริงจากลิงก์ตรงและตรวจ GA4 Realtime ว่าพบ app_open

นับอะไร:
- page_view: การเปิดหน้าแอป โดย GA4 ส่งจาก config
- app_open: เปิดเอกสารแอปหนึ่งครั้ง พร้อม app_name, app_category, app_path
- app_click ใน index: การกดเลือกแอป ไม่ควรนำมาบวกกับ app_open เป็นจำนวนการเปิด
- รีเฟรชหรือเปิดใหม่จะเพิ่มจำนวนครั้ง ไม่ใช่จำนวนคนใหม่เสมอไป
- เปิดจาก LINE หรือลิงก์ตรงก็นับเมื่อโหลดบนเว็บไซต์จริงและระบบติดตามไม่ถูกบล็อก
- เปิดไฟล์ในเครื่อง/ออฟไลน์/โดเมนอื่นไม่ส่งสถิติ

ดูรายงาน:
- Pages and screens: แยกหน้าแอปด้วย Page title หรือ Page path
- Admin > Custom definitions: สร้างมิติ Scope = Event สำหรับ app_name (ชื่อแอป), app_category (หมวดแอป), app_path (พาธแอป)
- Explore: Rows = ชื่อแอป; Values = Event count, Total users; Filter = Event name ตรงกับ app_open
- ข้อมูล custom dimensions อาจใช้เวลา 24–48 ชั่วโมง
- ไม่ต้องสร้าง app_open ซ้ำใน Create event เพราะไฟล์ส่งให้แล้ว

เก็บเฉพาะข้อมูลการเข้าชม ไม่อ่านข้อมูลผู้ป่วยหรือค่าที่กรอกในแอป โค้ดที่เพิ่มตัด query/hash ของ URL และ query/hash ของ referrer ออก
ข้อมูลเดิม หน้าตา สูตรคำนวณ และฟังก์ชันแอปคงเดิมทุกไบต์นอกบล็อกติดตามที่เพิ่ม
ยังไม่ได้อัปโหลดขึ้น GitHub หรือยืนยันรับข้อมูลจริงในบัญชี GA4

ชื่อไฟล์ต้นฉบับ → ชื่อที่ใช้บนเว็บ
DataBP(4).html → DataBP.html
สรุปรายงานเดือนแผนไทย.html → สรุปรายงานเดือนแผนไทย.html
DATABST(3).html → DATABST.html
DATAPS1(3).html → DATAPS1.html
DATAPPD(3).html → DATAPPD.html
DATABB(3).html → DATABB.html
DATAMUNG(3).html → DATAMUNG.html
PAYBackUC(2).html → PAYBackUC.html
HerbUC300969v2.html → HerbUC300969v2.html
HerbUC300969.html → HerbUC300969.html
CANNA2(1).html → CANNA2.html
CANNA1(1).html → CANNA1.html
PPCare(1).html → PPCare.html
IMC(4).html → IMC.html
CMD(1).html → CMD.html
PrimarySer(4).html → PrimarySer.html