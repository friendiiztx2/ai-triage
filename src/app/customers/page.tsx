'use client';

import { useState, useEffect } from 'react';
import { 
  Search, User, Mail, Phone, Calendar, RefreshCw, 
  MessageSquare, ChevronRight, Inbox, Clock
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function CustomersPage() {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected customer details
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [custChats, setCustChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
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
    setSelectedCust(cust);
    setLoadingChats(true);
    setCustChats([]);

    try {
      // Fetch chats of this customer via Server API Proxy
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
        setCustChats(sorted);
      }
    } catch (err) {
      console.error('Error fetching customer chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">{language === 'th' ? 'ทะเบียนรายชื่อลูกค้า (Customers Registry)' : 'Customers Registry'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{language === 'th' ? 'ประวัติการติดต่อและเคสการแจ้งปัญหาของลูกค้าแต่ละรายในระบบ' : 'Contact logs and case triage history for registered customers'}</p>
        </div>
        <button 
          onClick={fetchCustomers}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> {language === 'th' ? 'โหลดซ้ำรายชื่อ' : 'Reload List'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Customers List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-all duration-250">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={language === 'th' ? "ค้นหาลูกค้าด้วย ชื่อ, อีเมล หรือเบอร์โทร..." : "Search by name, email or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
                <RefreshCw size={28} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold">{language === 'th' ? 'กำลังโหลดทะเบียนรายชื่อลูกค้า...' : 'Loading customers registry...'}</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
                <User size={32} className="text-slate-300 dark:text-slate-700" />
                <span>{language === 'th' ? 'ไม่พบข้อมูลทะเบียนลูกค้าในระบบ' : 'No customer records found in the system'}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="px-6 py-4">{language === 'th' ? 'ลูกค้า (Customer)' : 'Customer'}</th>
                      <th className="px-6 py-4">{language === 'th' ? 'อีเมล (Email)' : 'Email'}</th>
                      <th className="px-6 py-4">{language === 'th' ? 'เบอร์โทร (Phone)' : 'Phone'}</th>
                      <th className="px-6 py-4">{language === 'th' ? 'ลงทะเบียนเมื่อ (Joined)' : 'Joined'}</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCustomers.map((cust) => (
                      <tr 
                        key={cust.id} 
                        onClick={() => handleSelectCustomer(cust)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group ${
                          selectedCust?.id === cust.id ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-xs shadow-sm">
                            {cust.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">{cust.name}</span>
                              {cust.email?.includes('gmail') || cust.phone ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                  ⭐ VERIFIED
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {cust.id?.substring(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{cust.email || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{cust.phone || '-'}</td>
                        <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-550 font-medium">
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Right: Selected Customer Triage History */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{language === 'th' ? 'ประวัติการเปิดตั๋ว / แจ้งเคส' : 'Ticket & Case History'}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{language === 'th' ? 'เลือกชื่อลูกค้าเพื่อประเมินประวัติแชต' : 'Select a customer to view history'}</p>
            </div>

            <div className="p-6">
              {selectedCust ? (
                <div className="space-y-6">
                  {/* Selected Customer mini profile */}
                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-50 dark:border-indigo-950/20 p-4 rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <User size={14} className="text-indigo-600 dark:text-indigo-400" /> {selectedCust.name}
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedCust.email && <div className="flex items-center gap-1.5"><Mail size={12} /> {selectedCust.email}</div>}
                      {selectedCust.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {selectedCust.phone}</div>}
                    </div>
                  </div>

                  {/* Chats list of customer */}
                  <div>
                    <h5 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">{language === 'th' ? 'เคสทั้งหมด' : 'Total Cases'} ({custChats.length})</h5>
                    
                    {loadingChats ? (
                      <div className="flex justify-center py-10">
                        <RefreshCw size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ) : custChats.length === 0 ? (
                      <div className="text-slate-400 dark:text-slate-500 italic text-xs text-center py-10 flex flex-col items-center justify-center gap-2">
                        <Inbox size={24} className="text-slate-300 dark:text-slate-700" />
                        <span>{language === 'th' ? 'ไม่พบประวัติการเปิดแชตแจ้งเรื่อง' : 'No chat history found'}</span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                        {custChats.map((chat) => (
                          <Link 
                            key={chat.id} 
                            href={`/chats?chat_id=${chat.id}`}
                            className="block border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-150 dark:hover:border-indigo-900 transition-all bg-slate-50/50 dark:bg-slate-850/40 space-y-3 cursor-pointer group hover:shadow-sm"
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

                            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="flex items-center gap-1"><Clock size={10} /> {chat.status === 'completed' ? (language === 'th' ? 'เสร็จสิ้น' : 'Completed') : (language === 'th' ? 'ค้างอยู่' : 'Pending')}</span>
                              <span>{chat.created_at ? new Date(chat.created_at).toLocaleDateString('th-TH') : ''}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 dark:text-slate-500 italic text-xs text-center py-20 flex flex-col items-center justify-center gap-2">
                  <User size={32} className="text-slate-200 dark:text-slate-800" />
                  <span>{language === 'th' ? 'ยังไม่มีการเลือกชื่อลูกค้าเพื่อประเมินประวัติ' : 'No customer selected. Please select a customer.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
