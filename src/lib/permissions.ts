import { LayoutDashboard, MessageSquare, Settings, Users, Building, Clipboard } from 'lucide-react';

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  requireSystemAdmin?: boolean;
}

export const PERMISSIONS_LIST: PermissionItem[] = [
  {
    id: 'view_dashboard',
    label: 'ดูภาพรวมระบบ',
    description: 'สถิติปริมาณเคส ความแม่นยำ AI และกราฟวิเคราะห์แนวโน้ม',
    icon: LayoutDashboard,
  },
  {
    id: 'view_chats',
    label: 'จัดการแชตและข้อมูลลูกค้า',
    description: 'ดูรายการแชตของลูกค้า คัดแยกความสำคัญ และดูประวัติลูกค้า',
    icon: MessageSquare,
  },
  {
    id: 'manage_categories',
    label: 'จัดการหมวดหมู่ปัญหา',
    description: 'เพิ่ม/แก้ไข/ลบหมวดหมู่หลัก 18 รายการสำหรับการคัดกรองแชต',
    icon: Settings,
  },
  {
    id: 'manage_users',
    label: 'จัดการสมาชิกในทีม',
    description: 'จัดการระดับสิทธิ์ (Role) และสิทธิ์ย่อยของผู้ใช้งานในสังกัด',
    icon: Users,
  },
  {
    id: 'manage_companies',
    label: 'จัดการข้อมูลบริษัท (System Tenant)',
    description: 'จัดตั้ง/ลงทะเบียนบริษัทใหม่พร้อมเจนเนอเรท Client Credentials',
    icon: Building,
    requireSystemAdmin: true,
  },
  {
    id: 'export_csv',
    label: 'ดาวน์โหลดรายงาน CSV',
    description: 'ส่งออกไฟล์รายงานสถิติของแชตลูกค้าสำหรับนำไปทำกราฟภายนอก',
    icon: Clipboard,
  },
];

export function getPermissionLabel(perm: string, short = false): string {
  if (short) {
    switch (perm) {
      case 'view_dashboard': return 'แดชบอร์ด';
      case 'view_chats': return 'แชตลูกค้า';
      case 'manage_categories': return 'หมวดหมู่';
      case 'manage_users': return 'สมาชิกในทีม';
      case 'manage_companies': return 'บริษัท';
      case 'export_csv': return 'ออกรายงาน';
      default: return perm;
    }
  }
  const found = PERMISSIONS_LIST.find((p) => p.id === perm);
  return found ? found.label : perm;
}
