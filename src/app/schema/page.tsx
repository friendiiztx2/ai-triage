'use client';

import { useState, useEffect } from 'react';
import { Database, Table, Key, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function SchemaPage() {
  const [activeTable, setActiveTable] = useState<'chats' | 'customers' | 'categories'>('chats');
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<'testing' | 'success' | 'failed'>('testing');

  useEffect(() => {
    fetchSchemaData();
  }, [activeTable]);

  const fetchSchemaData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch table schema via Server API Proxy
      const res = await fetch(`/api/schema?table=${activeTable}`);
      
      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to fetch schema');
      }

      const data = await res.json();
      setConnStatus('success');
      setSchemaData(data);
    } catch (err: any) {
      console.error(err);
      setConnStatus('failed');
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผ่าน API Server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">โครงสร้างข้อมูลในฐาน (Database Schema)</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">เครื่องมือตรวจสอบคอลัมน์ข้อมูลแถวแรกแบบเรียลไทม์ผ่าน API Server Proxy</p>
        </div>
        
        <div className="flex items-center gap-3">
          {connStatus === 'testing' && (
            <span className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-xl text-xs font-semibold">
              <RefreshCw size={14} className="animate-spin" /> กำลังตรวจสอบการเชื่อมต่อ...
            </span>
          )}
          {connStatus === 'success' && (
            <span className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-4 py-2 rounded-xl text-xs font-semibold">
              <CheckCircle2 size={14} /> เชื่อมต่อเซิร์ฟเวอร์ proxy สำเร็จ
            </span>
          )}
          {connStatus === 'failed' && (
            <span className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 px-4 py-2 rounded-xl text-xs font-semibold">
              <XCircle size={14} /> การดึงข้อมูลล้มเหลว
            </span>
          )}
          <button 
            onClick={fetchSchemaData} 
            className="backdrop-blur-md bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-200 p-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            title="โหลดข้อมูลใหม่"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        {(['chats', 'customers', 'categories'] as const).map((table) => (
          <button
            key={table}
            onClick={() => setActiveTable(table)}
            className={`px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTable === table
                ? 'border-[#1a73e8] text-[#1a73e8] dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            ตาราง: {table}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-250">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center justify-between">
          <h2 className="font-bold text-neutral-800 dark:text-neutral-100 text-base flex items-center gap-2">
            <Table size={18} className="text-neutral-400 dark:text-neutral-500" />
            ตาราง: <span className="text-[#1a73e8] dark:text-blue-400 font-mono">{activeTable}</span>
          </h2>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">แสดงข้อมูลฟิลด์แถวแรก</span>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400 dark:text-neutral-500">
              <RefreshCw size={32} className="animate-spin text-[#1a73e8]" />
              <span className="text-sm font-medium">กำลังโหลดข้อมูลโครงสร้าง...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-4">
              <div className="bg-rose-50 dark:bg-rose-955/30 text-rose-500 p-4 rounded-full">
                <XCircle size={32} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg">ดึงข้อมูลล้มเหลว</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{error}</p>
                <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-2 font-mono bg-neutral-50 dark:bg-neutral-900 p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  โปรดตรวจสอบว่าได้ตั้งค่า API URL และ anon key ใน .env ถูกต้อง และรัน Supabase ปลดล็อก RLS แล้ว
                </p>
              </div>
              <button onClick={fetchSchemaData} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs px-4 py-2 rounded-lg transition shadow-xs cursor-pointer">
                ลองอีกครั้ง
              </button>
            </div>
          ) : !schemaData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-3">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full text-neutral-400">
                <Database size={32} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">เชื่อมต่อตารางได้ แต่ไม่มีข้อมูล</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                  พบตาราง <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">{activeTable}</code> ในฐานข้อมูล แต่ไม่มีข้อมูลเลยสักแถวเดียวครับ รบกวนป้อนข้อมูลจำลองลงตารางก่อนครับ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Field mapping table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-inner">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                      <th className="px-5 py-3 flex items-center gap-1.5"><Key size={14} className="text-neutral-400" /> ชื่อคอลัมน์ (Column Name)</th>
                      <th className="px-5 py-3">ประเภทข้อมูล (Data Type)</th>
                      <th className="px-5 py-3">ตัวอย่างข้อมูลจริง (Sample Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {Object.entries(schemaData).map(([key, val]) => (
                      <tr key={key} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{key}</td>
                        <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                          {val === null ? 'unknown' : typeof val}
                        </td>
                        <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">
                          {val === null ? (
                            <span className="text-neutral-400 italic">null</span>
                          ) : typeof val === 'object' ? (
                            <pre className="text-xs bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg max-w-lg overflow-x-auto text-neutral-700 dark:text-neutral-300">
                              {JSON.stringify(val, null, 2)}
                            </pre>
                          ) : (
                            String(val)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Raw JSON panel */}
              <div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm mb-3">ข้อมูลแถวแรกแบบ Raw JSON</h3>
                <pre className="text-xs bg-neutral-900 dark:bg-neutral-950 text-neutral-300 dark:text-neutral-400 border border-neutral-800 p-4 rounded-xl overflow-x-auto font-mono max-h-[350px] shadow-sm">
                  {JSON.stringify(schemaData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
