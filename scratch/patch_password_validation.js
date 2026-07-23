const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add validation logic inside handleAddUser
const targetAddVal = `    if (!name || !role || !password) {
      setError('กรุณากรอกชื่อผู้ใช้ บทบาท และรหัสผ่าน');
      return;
    }`;

const replacementAddVal = `    if (!name || !role || !password) {
      setError('กรุณากรอกชื่อผู้ใช้ บทบาท และรหัสผ่าน');
      return;
    }
    if (password.length < 4 || !/[a-zA-Z]/.test(password)) {
      setError(language === 'th'
        ? 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'
        : 'Password must be at least 4 characters and contain at least one English letter (a-z/A-Z)');
      return;
    }`;

content = content.replace(targetAddVal, replacementAddVal);

// 2. Add validation logic inside handleEditUser
const targetEditVal = `    setSaving(true);
    setError(null);`;

const replacementEditVal = `    if (password && password.trim() !== '') {
      if (password.length < 4 || !/[a-zA-Z]/.test(password)) {
        setError(language === 'th'
          ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'
          : 'New password must be at least 4 characters and contain at least one English letter (a-z/A-Z)');
        return;
      }
    }

    setSaving(true);
    setError(null);`;

content = content.replace(targetEditVal, replacementEditVal);

// 3. Update placeholder in Add modal
content = content.replace(
  `placeholder="ขั้นต่ำ 4 ตัวอักษร"`,
  `placeholder={language === 'th' ? "ขั้นต่ำ 4 ตัวอักษร (ต้องมีตัวอักษร)" : "Min 4 characters (must contain letters)"}`
);

// 4. Update placeholder in Edit modal
content = content.replace(
  `placeholder="รหัสผ่านใหม่"`,
  `placeholder={language === 'th' ? "รหัสผ่านใหม่ (ต้องมีตัวอักษร)" : "New password (must contain letters)"}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched users/page.tsx with password validations!');
