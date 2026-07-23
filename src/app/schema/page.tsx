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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">โครงสร้างข้อมูลในฐาน (Database Schema)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">เครื่องมือตรวจสอบคอลัมน์ข้อมูลแถวแรกแบบเรียลไทม์ผ่าน API Server Proxy</p>
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
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 p-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            title="โหลดข้อมูลใหม่"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['chats', 'customers', 'categories'] as const).map((table) => (
          <button
            key={table}
            onClick={() => setActiveTable(table)}
            className={`px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTable === table
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
            }`}
          >
            ตาราง: {table}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Table size={18} className="text-slate-400 dark:text-slate-500" />
            ตาราง: <span className="text-indigo-600 dark:text-indigo-400 font-mono">{activeTable}</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-550 font-medium">แสดงข้อมูลฟิลด์แถวแรก</span>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
              <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium">กำลังโหลดข้อมูลโครงสร้าง...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-500 p-4 rounded-full">
                <XCircle size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">ดึงข้อมูลล้มเหลว</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{error}</p>
                <p className="text-slate-400 dark:text-slate-550 text-xs mt-2 font-mono bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800 rounded-lg">
                  โปรดตรวจสอบว่าได้ตั้งค่า API URL และ anon key ใน .env ถูกต้อง และรัน Supabase ปลดล็อก RLS แล้ว
                </p>
              </div>
              <button onClick={fetchSchemaData} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer">
                ลองอีกครั้ง
              </button>
            </div>
          ) : !schemaData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-3">
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-full text-slate-400">
                <Database size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">เชื่อมต่อตารางได้ แต่ไม่มีข้อมูล</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  พบตาราง <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">{activeTable}</code> ในฐานข้อมูล แต่ไม่มีข้อมูลเลยสักแถวเดียวครับ รบกวนป้อนข้อมูลจำลองลงตารางก่อนครับ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Field mapping table */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="px-5 py-3 flex items-center gap-1.5"><Key size={14} className="text-slate-400" /> ชื่อคอลัมน์ (Column Name)</th>
                      <th className="px-5 py-3">ประเภทข้อมูล (Data Type)</th>
                      <th className="px-5 py-3">ตัวอย่างข้อมูลจริง (Sample Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(schemaData).map(([key, val]) => (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{key}</td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {val === null ? 'unknown' : typeof val}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-350">
                          {val === null ? (
                            <span className="text-slate-400 italic">null</span>
                          ) : typeof val === 'object' ? (
                            <pre className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2 rounded-lg max-w-lg overflow-x-auto text-slate-700 dark:text-slate-300">
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3">ข้อมูลแถวแรกแบบ Raw JSON</h3>
                <pre className="text-xs bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 border border-slate-950 dark:border-slate-800 p-4 rounded-xl overflow-x-auto font-mono max-h-[350px] shadow-sm">
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
