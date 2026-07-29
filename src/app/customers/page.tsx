'use client';

import { useState, useEffect } from 'react';
import { 
  Search, User, Mail, Phone, Calendar, RefreshCw, 
  MessageSquare, ChevronRight, Inbox, Clock, X, Layers
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
    
    // Check if customer is already selected
    const existingIndex = selectedCustomers.findIndex(item => item.cust.id === cust.id);
    if (existingIndex !== -1) {
      return; // Already in list
    }

    // Add new customer panel entry with loading true
    const newEntry: CustomerSelectedState = { cust, chats: [], loading: true };
    setSelectedCustomers(prev => [...prev, newEntry]);

    try {
      // Fetch chats for this customer
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
            {language === 'th' ? 'ทะเบียนรายชื่อและเปรียบเทียบข้อมูลลูกค้า (Customer 360)' : 'Customers Registry & Comparison'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === 'th' ? 'คลิกเลือกชื่อลูกค้าเพื่อเปิดประวัติแชต หรือเปิดหลายๆ รายชื่อพร้อมกันเพื่อเปรียบเทียบเทียบเคียงได้ทันที' : 'Select customers to open chat histories and compare multiple accounts side by side'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCustomers.length > 0 && (
            <button
              onClick={handleClearAllSelected}
              className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-955/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <X size={14} /> {language === 'th' ? 'ปิดหน้าต่างทั้งหมด' : 'Close All Panels'} ({selectedCustomers.length})
            </button>
          )}

          <button 
            onClick={fetchCustomers}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> {language === 'th' ? 'โหลดซ้ำรายชื่อ' : 'Reload List'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Customers List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search bar */}
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

          {/* Customers Table / List */}
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

        {/* Right: Selected Customers Triage History Panels (Supports Multi-Comparison & Close ❌) */}
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
                    {/* Panel Header with Close Button ❌ */}
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

                      {/* Close Button ❌ */}
                      <button
                        type="button"
                        onClick={() => handleCloseCustomer(cust.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/40 transition cursor-pointer"
                        title="ปิดแถบลูกค้ารายนี้"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Panel Content (Natural height, max-h-[480px] scrollbox for long chats) */}
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
                                {/* Category */}
                                <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-100 dark:border-slate-750">
                                  {categories[chat.category_id] || chat.category_id || (language === 'th' ? 'อื่นๆ' : 'Other')}
                                </span>

                                {/* Priority */}
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
