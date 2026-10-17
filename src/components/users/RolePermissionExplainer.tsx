'use client';

import React from 'react';

interface RolePermissionExplainerProps {
  role: string;
}

export default function RolePermissionExplainer({ role }: RolePermissionExplainerProps) {
  return (
    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 p-2.5 rounded-xl space-y-1 transition-all select-none">
      <div className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 text-[10.5px]">
        🔑 {role === 'system_admin' && 'System Admin (สิทธิ์ผู้ดูแลระบบโครงสร้างส่วนกลาง)'}
        {role === 'super_admin' && 'Super Admin (ผู้ดูแลระบบระดับบริษัท / Company Admin)'}
        {role === 'admin' && 'Admin (ผู้จัดการทั่วไปประจำบริษัท)'}
        {role === 'agent' && 'Agent / Support (เจ้าหน้าที่ช่วยเหลือลูกค้า)'}
      </div>
      <ul className="list-disc list-inside space-y-0.5 font-semibold text-neutral-400 dark:text-neutral-400 text-[9.5px]">
        {role === 'system_admin' && (
          <li>เข้าถึงและตั้งค่าระบบได้ทุกส่วน รวมถึงจัดการบริษัท (Companies) และแอดมินทั้งหมด</li>
        )}
        {role === 'super_admin' && (
          <>
            <li>เข้าถึง Dashboard และระบบคัดแยกแชตลูกค้าของบริษัทตนเอง</li>
            <li>
              <b>สิทธิ์เพิ่ม/ลบ/แก้ไขแอดมินและพนักงานภายในบริษัทตนเอง</b> และตั้งค่าหมวดหมู่ปัญหา
            </li>
          </>
        )}
        {role === 'admin' && (
          <>
            <li>เข้าถึง Dashboard, คัดแยกแชต และจัดการหมวดหมู่ปัญหาได้</li>
            <li className="text-rose-500 dark:text-rose-500 list-none font-bold">
              ❌ ไม่สามารถจัดการผู้ใช้งาน หรือตั้งค่าระบบบริษัทได้
            </li>
          </>
        )}
        {role === 'agent' && (
          <>
            <li>เข้าถึง Dashboard และเข้ามาเปิดดูสรุปแชตลูกค้า/สิทธิ์ความเร่งด่วนเท่านั้น</li>
            <li className="text-rose-500 dark:text-rose-500 list-none font-bold">
              ❌ ไม่สามารถจัดการพนักงาน หรือลบ/แก้ไขหมวดหมู่ได้
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
