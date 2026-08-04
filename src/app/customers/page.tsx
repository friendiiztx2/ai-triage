'use client';

import { useState, useEffect } from 'react';
import { 
  Search, User, Mail, Phone, Calendar, RefreshCw, 
  MessageSquare, ChevronRight, Inbox, Clock, X, Layers,
  UserPlus, Download, AlertCircle, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

interface CustomerSelectedState {
  cust: any;
  chats: any[];
  loading: boolean;
}

export default function CustomersPage() {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected customers comparison list
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerSelectedState[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});

  // -------------------------------------------------------------
  // CUSTOMER ENTRY FORM STATES & STRICT VALIDATION
  // -------------------------------------------------------------
  const [formOwner, setFormOwner] = useState('คุณเดชา (David)');
  const [formRegDate, setFormRegDate] = useState('2026-08-04');
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLineId, setFormLineId] = useState('');
  const [formLineStatus, setFormLineStatus] = useState('รอแอด');
  const [formChannel, setFormChannel] = useState('facebook');
  const [formNotes, setFormNotes] = useState('');

  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [formSuccessMsg, setFormSuccessMsg] = useState('');

  // Log filter status
  const [logFilterStatus, setLogFilterStatus] = useState('ทั้งหมด');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Recently Added Entries Log state (Pre-seeded with initial logs)
  const [recentEntries, setRecentEntries] = useState<any[]>([
    {
      id: 'cust-101',
      name: 'เดวิด เวลแฮม',
      username: 'ufa11',
      phone: '0877771234',
      line_id: '0877771234',
      status: 'มีไลน์เล็ก',
      channel: 'line',
      owner: 'ทั้งหมด',
      notes: 'ขอโบนัสแรกเข้า',
      category_type: 'ทักสมัคร',
      created_at: '2026-08-04T09:12:00Z'
    },
    {
      id: 'cust-100',
      name: 'นางสาวบี มาเยอะ',
      username: 'ufa10',
      phone: '0991110000',
      line_id: 'bee_line',
      status: 'รอแอดไลน์เล็ก',
      channel: 'doopenteam',
      owner: 'คุณเอมิกา (Emma)',
      notes: '-',
      category_type: 'สมัครและฝาก',
      created_at: '2026-08-04T08:45:00Z'
    }
  ]);

  // Strict Validation: Full Name, Phone, and LINE ID MUST all be non-empty and valid!
  const isFullNameValid = formFullName.trim().length > 0 && formFullName.trim() !== '-';
  const isPhoneValid = formPhone.trim().length > 0 && formPhone.trim() !== '-' && formPhone.trim() !== '089-000-0000';
  const isLineIdValid = formLineId.trim().length > 0 && formLineId.trim() !== '-';

  const isFormValid = isFullNameValid && isPhoneValid && isLineIdValid;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories via Server API Proxy
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        const catMap: Record<string, string> = {};
        catData.forEach((c: any) => {
          catMap[c.id] = c.name || c.title || c.id;
        });
        setCategories(catMap);
      }

      // 2. Fetch customers via Server API Proxy
      const custRes = await fetch('/api/customers');
      if (!custRes.ok) throw new Error('Failed to load customers');
      const custData = await custRes.json();
      
      if (custData && custData.length > 0) {
        setCustomers(custData);
        setFilteredCustomers(custData);
        
        // Auto select matched customer or first customer
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const qParam = params.get('search') || params.get('customer_id') || params.get('customer_name');
          if (qParam) {
            setSearchQuery(qParam);
            const matched = custData.find((c: any) => 
              c.name.toLowerCase().includes(qParam.toLowerCase()) || 
              c.id.toLowerCase().includes(qParam.toLowerCase())
            );
            handleSelectCustomer(matched || custData[0]);
          } else {
            handleSelectCustomer(custData[0]);
          }
        } else {
          handleSelectCustomer(custData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save new customer entry with strict validation
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFullNameValid || !isPhoneValid || !isLineIdValid) {
      setFormErrorMsg('❌ ไม่สามารถบันทึกได้! กรุณากรอกรายละเอียด "ชื่อ-นามสกุลลูกค้า", "เบอร์ติดต่อ" และ "ไลน์ลูกค้า" ให้ครบถ้วน');
      setFormSuccessMsg('');
      return;
    }

    setFormErrorMsg('');

    const newEntry = {
      id: `cust-${Date.now()}`,
      name: formFullName.trim(),
      username: formUsername.trim() || '-',
      phone: formPhone.trim(),
      line_id: formLineId.trim(),
      status: formLineStatus,
      channel: formChannel,
      owner: formOwner,
      notes: formNotes.trim() || '-',
      category_type: 'ทักสมัคร',
      created_at: new Date().toISOString()
    };

    setRecentEntries(prev => [newEntry, ...prev]);

    // Also add to customers registry list
    const newCustRegistry = {
      id: newEntry.id,
      name: newEntry.name,
      email: `${newEntry.username}@example.com`,
      phone: newEntry.phone,
      tier: 'General',
      risk_level: 'low',
      total_chats: 1
    };
    setCustomers(prev => [newCustRegistry, ...prev]);

    setFormSuccessMsg(`✅ บันทึกข้อมูลลูกค้า "${newEntry.name}" เข้าพอร์ตงานเรียบร้อยแล้ว!`);
    
    // Clear inputs
    setFormFullName('');
    setFormUsername('');
    setFormPhone('');
    setFormLineId('');
    setFormNotes('');

    setTimeout(() => setFormSuccessMsg(''), 4000);
  };

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = customers.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleSelectCustomer = async (cust: any) => {
    if (!cust) return;
    
    const existingIndex = selectedCustomers.findIndex(item => item.cust.id === cust.id);
    if (existingIndex !== -1) {
      return;
    }

    const newEntry: CustomerSelectedState = { cust, chats: [], loading: true };
    setSelectedCustomers(prev => [...prev, newEntry]);

    try {
      const chatsRes = await fetch('/api/chats');
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        const filtered = chats.filter((c: any) => 
          c.customer_id === cust.id || 
          c.customer_name === cust.name
        );
        const sorted = [...filtered].sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setSelectedCustomers(prev => 
          prev.map(item => item.cust.id === cust.id ? { ...item, chats: sorted, loading: false } : item)
        );
      }
    } catch (err) {
      console.error('Error fetching customer chats:', err);
      setSelectedCustomers(prev => 
        prev.map(item => item.cust.id === cust.id ? { ...item, loading: false } : item)
      );
    }
  };

  const handleCloseCustomer = (custId: string) => {
    setSelectedCustomers(prev => prev.filter(item => item.cust.id !== custId));
  };

  const handleClearAllSelected = () => {
    setSelectedCustomers([]);
  };

  // Filtered recent log entries
  const filteredLogEntries = recentEntries.filter(entry => {
    if (logFilterStatus !== 'ทั้งหมด' && entry.category_type !== logFilterStatus) {
      return false;
    }
    if (logSearchQuery) {
      const q = logSearchQuery.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.phone.includes(q) ||
        entry.username.toLowerCase().includes(q) ||
        entry.owner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
            {language === 'th' ? 'บันทึกและจัดการทะเบียนลูกค้า (Customer 360 & Registry)' : 'Customer 360 & Entry Form'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === 'th' ? 'กรอกบันทึกข้อมูลลูกค้าเข้าพอร์ตงาน ติดตามประวัติ และเปรียบเทียบข้อมูลได้แบบเรียลไทม์' : 'Record customer entries into portfolio and track customer history'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. NEW CUSTOMER ENTRY FORM WITH STRICT VALIDATION */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 transition-all">
        <form onSubmit={handleSaveCustomer} className="space-y-5">
          {/* Header Row: Owner & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-purple-600" /> ชื่อเจ้าหน้าที่บันทึก (ผู้รับผิดชอบหลัก)
              </label>
              <select
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-600 transition"
              >
                <option value="คุณเดชา (David)">คุณเดชา (David)</option>
                <option value="คุณเอมิกา (Emma)">คุณเอมิกา (Emma)</option>
                <option value="คุณสมชาย (Somchai)">คุณสมชาย (Somchai)</option>
                <option value="ทั้งหมด">ทั้งหมด (Shared)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-600" /> วันที่คีย์งาน (Registration Date)
              </label>
              <input
                type="date"
                value={formRegDate}
                onChange={(e) => setFormRegDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {/* Row 2: Full Name & Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Required Field 1: Customer Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อ-นามสกุลลูกค้า (Customer Full Name) <span className="text-rose-500 font-extrabold">* จำเป็นต้องกรอก</span>
              </label>
              <input
                type="text"
                placeholder="เช่น คุณสมชาย ใจดี"
                value={formFullName}
                onChange={(e) => {
                  setFormFullName(e.target.value);
                  if (formErrorMsg) setFormErrorMsg('');
                }}
                className={`w-full bg-slate-50 dark:bg-slate-850 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none transition ${
                  !isFullNameValid && formFullName !== '' 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 dark:border-slate-750 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ยูสเซอร์เนมลูกค้า (Username)
              </label>
              <input
                type="text"
                placeholder="เช่น ufa13"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {/* Row 3: Phone Number, LINE ID, Line Lek Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Required Field 2: Customer Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone size={13} className="text-purple-600" /> เบอร์ติดต่อลูกค้า <span className="text-rose-500 font-extrabold">* จำเป็น</span>
              </label>
              <input
                type="text"
                placeholder="081-xxx-xxxx"
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(e.target.value);
                  if (formErrorMsg) setFormErrorMsg('');
                }}
                className={`w-full bg-slate-50 dark:bg-slate-850 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none transition ${
                  !isPhoneValid && formPhone !== '' 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 dark:border-slate-750 focus:border-indigo-600'
                }`}
              />
            </div>

            {/* Required Field 3: LINE ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MessageSquare size={13} className="text-emerald-600" /> ไลน์ลูกค้า (LINE ID) <span className="text-rose-500 font-extrabold">* จำเป็น</span>
              </label>
              <input
                type="text"
                placeholder="เช่น @line_id หรือ line_user"
                value={formLineId}
                onChange={(e) => {
                  setFormLineId(e.target.value);
                  if (formErrorMsg) setFormErrorMsg('');
                }}
                className={`w-full bg-slate-50 dark:bg-slate-850 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none transition ${
                  !isLineIdValid && formLineId !== '' 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 dark:border-slate-750 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                สถานะไลน์เล็ก (Line Lek Status)
              </label>
              <select
                value={formLineStatus}
                onChange={(e) => setFormLineStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
              >
                <option value="รอแอด">🟡 รอแอด</option>
                <option value="รอแอดไลน์เล็ก">🟡 รอแอดไลน์เล็ก</option>
                <option value="มีไลน์เล็ก">🟢 มีไลน์เล็ก</option>
              </select>
            </div>
          </div>

          {/* Row 4: Channel Source */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ช่องทางที่ทักเข้ามา (Source Channel)
            </label>
            <select
              value={formChannel}
              onChange={(e) => setFormChannel(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
            >
              <option value="facebook">facebook</option>
              <option value="line">line</option>
              <option value="doopenteam">doopenteam</option>
              <option value="other">ช่องทางอื่นๆ</option>
            </select>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              โน้ตหมายเหตุก่อนการตาม
            </label>
            <textarea
              rows={2}
              placeholder="เช่น ทักมาจากโปรโมชั่นวันหวยออก นัดหมายฝากช่วงเย็น..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* Validation Feedback Messages */}
          {formErrorMsg && (
            <div className="bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/60 p-3.5 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formErrorMsg}</span>
            </div>
          )}

          {formSuccessMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-955/40 border border-emerald-200 dark:border-emerald-900/60 p-3.5 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{formSuccessMsg}</span>
            </div>
          )}

          {/* Submit Button (DISABLED when form is incomplete!) */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all ${
              isFormValid 
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer hover:shadow-indigo-500/25 active:scale-[0.99]' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 opacity-60'
            }`}
          >
            <UserPlus size={16} />
            <span>{isFormValid ? 'บันทึกลูกค้าเข้าพอร์ตงาน' : 'กรุณากรอก ชื่อนามสกุล, เบอร์ และ ไลน์ ให้ครบถ้วนเพื่อบันทึก'}</span>
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. RECENTLY ADDED ENTRIES LOG TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Clock size={16} className="text-purple-600" />
              ประวัติรายการที่เพิ่มเข้าไป (Recently Added Entries Log)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              รายการรายชื่อลูกค้าทั้งหมดประจำรอบเดือน <strong>2026-08</strong> ({filteredLogEntries.length} รายการ)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('ดาวน์โหลดรายงาน CSV เรียบร้อยแล้ว')}
              className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-955/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Download size={14} /> ดาวน์โหลด CSV
            </button>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / เบอร์ / พนักงาน..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Status Category Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">กรองตามสถานะ:</span>
          {['ทั้งหมด', 'ทักไม่สมัคร', 'ทักสมัคร', 'สมัครและฝาก', 'สมัครไม่ฝาก'].map((st) => {
            const count = st === 'ทั้งหมด' 
              ? recentEntries.length 
              : recentEntries.filter(e => e.category_type === st).length;

            const isSelected = logFilterStatus === st;

            return (
              <button
                key={st}
                onClick={() => setLogFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Log Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-50/50 dark:bg-slate-850/40">
                <th className="p-3">ชื่อ-นามสกุลลูกค้า</th>
                <th className="p-3">ยูสเซอร์เนม</th>
                <th className="p-3">ข้อมูลติดต่อ</th>
                <th className="p-3">สถานะไลน์เล็ก</th>
                <th className="p-3">ช่องทาง</th>
                <th className="p-3">ผู้รับผิดชอบ (OWNER)</th>
                <th className="p-3">โน้ตเริ่มต้น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    ไม่พบรายการประวัติการเพิ่มข้อมูลลูกค้าตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredLogEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {entry.name && entry.name !== '-' ? entry.name : <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                      {entry.username || '-'}
                    </td>
                    <td className="p-3 space-y-1">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                        <Phone size={11} className="text-rose-500 shrink-0" />
                        <span>{entry.phone}</span>
                      </div>
                      {entry.line_id && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                          <MessageSquare size={10} className="shrink-0" />
                          <span>LINE: {entry.line_id}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        entry.status === 'มีไลน์เล็ก'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/30 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'มีไลน์เล็ก' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-purple-50 dark:bg-purple-955/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        {entry.channel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-bold">
                      {entry.owner}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">
                      {entry.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CUSTOMER REGISTRY LIST & COMPARISON PANELS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Customers List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-all duration-250">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={language === 'th' ? "ค้นหาลูกค้าด้วย ชื่อ, อีเมล หรือเบอร์โทร..." : "Search by name, email or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
                <RefreshCw size={28} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold">{language === 'th' ? 'กำลังโหลดทะเบียนรายชื่อลูกค้า...' : 'Loading customers registry...'}</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                <User size={32} className="text-slate-300 dark:text-slate-700" />
                <span>{language === 'th' ? 'ไม่พบข้อมูลทะเบียนลูกค้าในระบบ' : 'No customer records found in the system'}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((cust) => {
                  const isOpened = selectedCustomers.some(item => item.cust.id === cust.id);

                  return (
                    <div 
                      key={cust.id} 
                      onClick={() => handleSelectCustomer(cust)}
                      className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group ${
                        isOpened ? 'bg-indigo-50/40 dark:bg-indigo-950/30 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-xs shadow-sm shrink-0">
                          {cust.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{cust.name}</span>
                            {isOpened && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                👁️ กำลังเปิด
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {cust.phone || cust.email || `ID: ${cust.id?.substring(0, 8)}...`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {cust.total_chats || 1} เคส
                        </span>
                        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Customers Triage History Panels */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-16 rounded-2xl shadow-sm text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <Layers size={36} className="text-slate-300 dark:text-slate-700" />
              <span className="font-semibold">{language === 'th' ? 'ยังไม่ได้เลือกข้อมูลลูกค้า (คลิกเลือกชื่อลูกค้าด้านซ้ายเพื่อเปิดดู หรือเปิดหลายคนเทียบกันได้)' : 'No customer selected. Click a customer on the left to open and compare.'}</span>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${selectedCustomers.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {selectedCustomers.map((panel, idx) => {
                const { cust, chats, loading: isPanelLoading } = panel;

                return (
                  <div 
                    key={cust.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250 flex flex-col hover:shadow-md"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                            {cust.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {cust.phone || cust.email || cust.id}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCloseCustomer(cust.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/40 transition cursor-pointer"
                        title="ปิดแถบลูกค้ารายนี้"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          ประวัติแชตสะสม ({chats.length} เคส)
                        </span>
                        <Link
                          href={`/chats?search=${encodeURIComponent(cust.name || cust.id)}`}
                          className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          ค้นหาในหน้าแชต ➔
                        </Link>
                      </div>

                      {isPanelLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <RefreshCw size={22} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                        </div>
                      ) : chats.length === 0 ? (
                        <div className="text-slate-400 dark:text-slate-500 italic text-xs text-center py-8 flex flex-col items-center justify-center gap-2">
                          <Inbox size={20} className="text-slate-300 dark:text-slate-700" />
                          <span>{language === 'th' ? 'ไม่พบประวัติการแจ้งเรื่อง' : 'No chat history found'}</span>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                          {chats.map((chat) => (
                            <Link 
                              key={chat.id} 
                              href={`/chats?chat_id=${chat.id}`}
                              className="block border border-slate-100 dark:border-slate-800 rounded-xl p-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all bg-slate-50/50 dark:bg-slate-850/40 space-y-2 cursor-pointer group hover:shadow-sm"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-100 dark:border-slate-750">
                                  {categories[chat.category_id] || chat.category_id || (language === 'th' ? 'อื่นๆ' : 'Other')}
                                </span>

                                {(() => {
                                  const pri = chat.priority?.toLowerCase() || 'low';
                                  let color = 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
                                  if (pri === 'urgent') color = 'text-rose-600 bg-rose-50 dark:bg-rose-955/30 dark:text-rose-400';
                                  else if (pri === 'high') color = 'text-orange-600 bg-orange-50 dark:bg-orange-955/30 dark:text-orange-400';
                                  else if (pri === 'medium') color = 'text-amber-600 bg-amber-50 dark:bg-amber-955/30 dark:text-amber-400';
                                  else if (pri === 'low') color = 'text-blue-600 bg-blue-50 dark:bg-blue-955/30 dark:text-blue-400';
                                  return (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${color}`}>
                                      {pri}
                                    </span>
                                  );
                                })()}
                              </div>

                              <p className="text-xs text-slate-650 dark:text-slate-350 font-medium line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {chat.summary || 'ไม่มีบทสรุปเคส'}
                              </p>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1"><Clock size={10} /> {chat.status === 'completed' ? (language === 'th' ? 'เสร็จสิ้น' : 'Completed') : (language === 'th' ? 'ค้างอยู่' : 'Pending')}</span>
                                <span>{chat.created_at ? new Date(chat.created_at).toLocaleDateString('th-TH') : ''}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
