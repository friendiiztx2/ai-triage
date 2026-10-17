export interface SystemTagItem {
  name: string;
  desc: string;
  style: string;
}

export const DEFAULT_SYSTEM_TAGS: SystemTagItem[] = [
  {
    name: '#รูปภาพทั้งหมด',
    desc: 'ทุกเคสที่มีภาพแนบ/ภาพล้วน',
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-955/30 dark:text-indigo-300 dark:border-indigo-900/50',
  },
  {
    name: '#รูปภาพแนบ',
    desc: 'มีภาพแนบมากับข้อความ',
    style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/30 dark:text-blue-300 dark:border-blue-900/50',
  },
  {
    name: '#รูปภาพล้วน',
    desc: 'ไม่มีข้อความพิมพ์',
    style: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-955/30 dark:text-fuchsia-300 dark:border-fuchsia-900/50',
  },
  {
    name: '#VIP',
    desc: 'ป้ายสีม่วง',
    style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-955/30 dark:text-purple-300 dark:border-purple-900/50',
  },
  {
    name: '#ติดตามผล',
    desc: 'ป้ายสีส้ม',
    style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
  },
  {
    name: '#รอสลิป',
    desc: 'ป้ายสีฟ้า',
    style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-955/30 dark:text-sky-300 dark:border-sky-900/50',
  },
  {
    name: '#ส่งเรื่องทีมเทคนิค',
    desc: 'ป้ายสีแดง',
    style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-300 dark:border-rose-900/50',
  },
  {
    name: '#รอธนาคารแก้ไข',
    desc: 'ป้ายสีเขียว',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50',
  },
  {
    name: '#เคสพิเศษ',
    desc: 'ป้ายสีอินดิโก้',
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-955/30 dark:text-indigo-300 dark:border-indigo-900/50',
  },
];
