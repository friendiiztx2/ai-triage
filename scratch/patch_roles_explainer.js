const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define the explainer HTML template block
const explainerAdd = `                                </div>

                                {/* Dynamic Role Permission Explainer */}
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-xl space-y-1 transition-all select-none">
                                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10.5px]">
                                    🔑 {role === 'system_admin' && 'System Admin (สิทธิ์ผู้ดูแลระบบโครงสร้าง)'}
                                    {role === 'super_admin' && 'Super Admin (ผู้ดูแลระบบร้านค้า)'}
                                    {role === 'admin' && 'Admin (ผู้จัดการทั่วไป)'}
                                    {role === 'agent' && 'Agent / Support (เจ้าหน้าที่ช่วยเหลือลูกค้า)'}
                                  </div>
                                  <ul className="list-disc list-inside space-y-0.5 font-semibold text-slate-450 dark:text-slate-400 text-[9.5px]">
                                    {role === 'system_admin' && (
                                      <>
                                        <li>เข้าถึงและตั้งค่าระบบได้ทุกส่วน รวมถึงจัดการบริษัท (Companies) และแอดมินทั้งหมด</li>
                                      </>
                                    )}
                                    {role === 'super_admin' && (
                                      <>
                                        <li>เข้าถึง Dashboard และระบบคัดแยกแชตลูกค้า</li>
                                        <li><b>สิทธิ์เพิ่ม/ลบ/แก้ไขแอดมินคนอื่นๆ ในระบบ</b> และตั้งค่าหมวดหมู่ปัญหา</li>
                                      </>
                                    )}
                                    {role === 'admin' && (
                                      <>
                                        <li>เข้าถึง Dashboard, คัดแยกแชต และจัดการหมวดหมู่ปัญหาได้</li>
                                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการผู้ใช้งาน หรือตั้งค่าระบบบริษัทได้</li>
                                      </>
                                    )}
                                    {role === 'agent' && (
                                      <>
                                        <li>เข้าถึง Dashboard และเข้ามาเปิดดูสรุปแชตลูกค้า/สิทธิ์ความเร่งด่วนเท่านั้น</li>
                                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการพนักงาน หรือลบ/แก้ไขหมวดหมู่ได้</li>
                                      </>
                                    )}
                                  </ul>
                                </div>`;

const explainerEdit = `                  </div>
                </div>

                {/* Dynamic Role Permission Explainer */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-xl space-y-1 transition-all select-none">
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10.5px]">
                    🔑 {role === 'system_admin' && 'System Admin (สิทธิ์ผู้ดูแลระบบโครงสร้าง)'}
                    {role === 'super_admin' && 'Super Admin (ผู้ดูแลระบบร้านค้า)'}
                    {role === 'admin' && 'Admin (ผู้จัดการทั่วไป)'}
                    {role === 'agent' && 'Agent / Support (เจ้าหน้าที่ช่วยเหลือลูกค้า)'}
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 font-semibold text-slate-450 dark:text-slate-400 text-[9.5px]">
                    {role === 'system_admin' && (
                      <>
                        <li>เข้าถึงและตั้งค่าระบบได้ทุกส่วน รวมถึงจัดการบริษัท (Companies) และแอดมินทั้งหมด</li>
                      </>
                    )}
                    {role === 'super_admin' && (
                      <>
                        <li>เข้าถึง Dashboard และระบบคัดแยกแชตลูกค้า</li>
                        <li><b>สิทธิ์เพิ่ม/ลบ/แก้ไขแอดมินคนอื่นๆ ในระบบ</b> และตั้งค่าหมวดหมู่ปัญหา</li>
                      </>
                    )}
                    {role === 'admin' && (
                      <>
                        <li>เข้าถึง Dashboard, คัดแยกแชต และจัดการหมวดหมู่ปัญหาได้</li>
                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการผู้ใช้งาน หรือตั้งค่าระบบบริษัทได้</li>
                      </>
                    )}
                    {role === 'agent' && (
                      <>
                        <li>เข้าถึง Dashboard และเข้ามาเปิดดูสรุปแชตลูกค้า/สิทธิ์ความเร่งด่วนเท่านั้น</li>
                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการพนักงาน หรือลบ/แก้ไขหมวดหมู่ได้</li>
                      </>
                    )}
                  </ul>
                </div>`;

// 2. Inject inside Add User modal layout
content = content.replace(
  `                                  </div>\n                                </div>\n\n                                {/* Checklist of companies (select multiple) */}`,
  `                                  </div>\n                                </div>\n\n${explainerAdd}\n\n                                {/* Checklist of companies (select multiple) */}`
);

// 3. Inject inside Edit User modal layout
content = content.replace(
  `                    </select>\n                  </div>\n                </div>\n              </div>\n\n              {/* Checklist of companies (select multiple) */}`,
  `                    </select>\n                  </div>\n                </div>\n\n${explainerEdit}\n              </div>\n\n              {/* Checklist of companies (select multiple) */}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched users/page.tsx with Role Explainer UI cards!');
