'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Plus, Search, RefreshCw, X, 
  ShieldAlert, Key, Globe, Layers, CheckCircle2, Clipboard
} from 'lucide-react';
import { saveAuditLog } from '@/lib/audit';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        if (parsed.role === 'system_admin') {
          fetchCompanies();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        setFilteredCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = companies.filter(c => 
        c.name?.toLowerCase().includes(q) || 
        c.domain?.toLowerCase().includes(q) ||
        c.client_id?.toLowerCase().includes(q)
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  // Open Add modal
  const handleOpenAdd = () => {
    setName('');
    setDomain('');
    setError(null);
    setSuccessData(null);
    setShowAddModal(true);
  };

  // Save new company
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) {
      setError('กรุณากรอกข้อมูลชื่อบริษัทและโดเมน');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessData(null);

    try {
      const res = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register company');

      // Update local state list
      setCompanies(prev => [data, ...prev]);
      setSuccessData(data);

      // Save audit log
      await saveAuditLog('CREATE', `จัดตั้งบริษัทใหม่: ${name.trim()} (โดเมน: ${domain.trim()}, ID: ${data.id})`);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  // Clipboard copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอกไปยังคลิปบอร์ดแล้ว!');
  };

  // Access Control Guard
  if (userProfile && userProfile.role !== 'system_admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-455 p-5 rounded-3xl shadow-sm mb-4">
          <ShieldAlert size={48} className="animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">การเข้าถึงถูกปฏิเสธ (Access Denied)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md leading-relaxed">
          ขออภัยด้วยครับคุณ **{userProfile.name}** หน้านี้เป็นเขตควบคุมเฉพาะและจำกัดสิทธิ์ให้เข้าถึงได้เฉพาะระบบผู้ดูแลระบบเครือข่ายหลัก (**System Admin**) เท่านั้นครับ
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display font-bold">จัดการข้อมูลบริษัท (Company Management)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ลงทะเบียนบริษัทใหม่พร้อมสร้าง Client Credentials และจัดหมวดหมู่อัตโนมัติ (เฉพาะ System Admin)</p>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> ลงทะเบียนบริษัทใหม่
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-xs text-slate-850 dark:text-slate-100">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท หรือโดเมน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:border-indigo-650 focus:outline-none transition text-slate-800 dark:text-slate-100"
            />
          </div>

          <button 
            onClick={fetchCompanies}
            title="รีเฟรชข้อมูล"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
            <RefreshCw size={32} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold">กำลังดึงข้อมูลบริษัทผู้เช่า...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <Building size={36} className="text-slate-300 dark:text-slate-700" />
            <span>ไม่พบข้อมูลรายชื่อบริษัทในฐานข้อมูล</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-855/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <th className="px-6 py-4">ชื่อบริษัท</th>
                  <th className="px-6 py-4">โดเมน (Domain)</th>
                  <th className="px-6 py-4">Client ID</th>
                  <th className="px-6 py-4">Client Secret</th>
                  <th className="px-6 py-4">UUID (Company ID)</th>
                  <th className="px-6 py-4">วันที่ลงทะเบียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-855/35 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{c.domain}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-455">
                      <span className="flex items-center gap-1">
                        {c.client_id}
                        <button onClick={() => copyToClipboard(c.client_id)} title="คัดลอก ID" className="hover:text-indigo-650 opacity-60 hover:opacity-100">
                          <Clipboard size={10} />
                        </button>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        {c.client_secret || '••••••••'}
                        {c.client_secret && (
                          <button onClick={() => copyToClipboard(c.client_secret)} title="คัดลอก Secret" className="hover:text-indigo-650 opacity-60 hover:opacity-100">
                            <Clipboard size={10} />
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 dark:text-slate-550">{c.id}</td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= REGISTER COMPANY MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <button 
              onClick={() => {
                setShowAddModal(false);
                if (successData) fetchCompanies(); // Refresh when closed after success
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-md"
            >
              <X size={16} />
            </button>

            {!successData ? (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400">
                    <Building size={18} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-display">ลงทะเบียนบริษัทผู้เช่าใหม่</h3>
                </div>

                {error && (
                  <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-[10px] font-bold p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mb-4 leading-normal">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleRegisterCompany} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ชื่อบริษัท (Company Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Beta Technology Co., Ltd."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">โดเมนหลัก (Domain Identifier)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="เช่น betatech.com (ไม่ต้องใส่ https://)"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9 pr-3 py-2 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 p-3 rounded-xl flex items-start gap-2.5">
                    <Layers size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-indigo-900 dark:text-indigo-300 font-semibold leading-normal">
                      ระบบจะสร้างรหัสความปลอดภัย Client ID และ Client Secret ให้อัตโนมัติ พร้อมกู้คืนคัดลอกหมวดหมู่คัดแยกเคสมาตรฐานทั้ง 18 รายการเข้าไปให้พร้อมใช้งานได้ทันทีครับ
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 py-3 rounded-xl font-bold shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-none transition cursor-pointer text-center block"
                  >
                    {saving ? 'กำลังประมวลผลจัดตั้งระบบบริษัท...' : 'ยืนยันสร้างจัดตั้งบริษัทใหม่'}
                  </button>
                </form>
              </>
            ) : (
              // Success Credentials Report Display
              <div className="space-y-5 text-xs text-center py-2 select-text">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={44} className="text-emerald-500 animate-bounce" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-display">จัดตั้งบริษัทสำเร็จแล้ว!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">โปรดคัดลอกข้อมูลความปลอดภัยเหล่านี้ไปตั้งค่า API Integration ของระบบปลายทางครับ</p>
                </div>

                <div className="space-y-3.5 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 text-left font-mono">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 font-sans uppercase">Company Name / Domain</span>
                    <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs">{successData.name} ({successData.domain})</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-150 dark:border-slate-800 pt-2.5">
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 font-sans uppercase">Company UUID</span>
                    <span className="block font-bold text-indigo-600 dark:text-indigo-400 text-xs">{successData.id}</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-150 dark:border-slate-800 pt-2.5">
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 font-sans uppercase">Client ID</span>
                    <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs">{successData.client_id}</span>
                  </div>

                  <div className="space-y-1 border-t border-slate-150 dark:border-slate-800 pt-2.5">
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 font-sans uppercase">Client Secret</span>
                    <span className="block font-bold text-rose-600 dark:text-rose-400 text-xs">{successData.client_secret}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => copyToClipboard(`Company ID: ${successData.id}\nClient ID: ${successData.client_id}\nClient Secret: ${successData.client_secret}`)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 py-2.5 rounded-xl font-bold transition cursor-pointer"
                  >
                    คัดลอกข้อมูลทั้งหมด
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      fetchCompanies();
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition cursor-pointer"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
