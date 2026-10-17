'use client';

import React from 'react';
import { Search, User, RefreshCw, ChevronRight } from 'lucide-react';

interface CustomerListPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  customers: any[];
  loading: boolean;
  selectedCustomerIds: string[];
  onSelectCustomer: (customer: any) => void;
  language: string;
}

export default function CustomerListPanel({
  searchQuery,
  onSearchChange,
  customers,
  loading,
  selectedCustomerIds,
  onSelectCustomer,
  language,
}: CustomerListPanelProps) {
  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 p-4 rounded-2xl shadow-xs transition-all duration-250">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหาลูกค้าด้วย ชื่อ, อีเมล หรือเบอร์โทร...' : 'Search by name, email or phone...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-neutral-400 dark:focus:border-neutral-600 focus:outline-none transition font-medium text-neutral-800 dark:text-neutral-100 shadow-xs"
          />
        </div>
      </div>

      {/* Customer List Container */}
      <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-250">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400 dark:text-neutral-500">
            <RefreshCw size={28} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold">{language === 'th' ? 'กำลังโหลดทะเบียนรายชื่อลูกค้า...' : 'Loading customers registry...'}</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 dark:text-neutral-500 text-xs flex flex-col items-center justify-center gap-3">
            <User size={32} className="text-neutral-300 dark:text-neutral-700" />
            <span>{language === 'th' ? 'ไม่พบข้อมูลทะเบียนลูกค้าในระบบ' : 'No customer records found in the system'}</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {customers.map((cust) => {
              const isOpened = selectedCustomerIds.includes(cust.id);

              return (
                <div 
                  key={cust.id} 
                  onClick={() => onSelectCustomer(cust)}
                  className={`p-4 flex items-center justify-between hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group ${
                    isOpened ? 'bg-[#e8f0fe]/60 dark:bg-blue-955/30 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center font-medium text-white text-xs shadow-xs shrink-0">
                      {cust.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 block">{cust.name}</span>
                        {isOpened && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-955/60 dark:text-blue-300 border border-[#1a73e8]/20">
                            กำลังเปิด
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        {cust.phone || cust.email || `ID: ${cust.id?.substring(0, 8)}...`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {cust.total_chats || 1} เคส
                    </span>
                    <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
