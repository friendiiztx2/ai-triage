'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import CustomerHistoryCard from '@/components/customers/CustomerHistoryCard';

export interface CustomerSelectedState {
  cust: any;
  chats: any[];
  loading: boolean;
}

interface CustomerComparisonPanelProps {
  selectedCustomers: CustomerSelectedState[];
  onCloseCustomer: (custId: string) => void;
  language: 'th' | 'en';
}

export default function CustomerComparisonPanel({
  selectedCustomers,
  onCloseCustomer,
  language,
}: CustomerComparisonPanelProps) {
  if (selectedCustomers.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 p-16 rounded-2xl shadow-xs text-center text-neutral-400 dark:text-neutral-500 text-xs flex flex-col items-center justify-center gap-3">
        <Layers size={36} className="text-neutral-300 dark:text-neutral-700" />
        <span className="font-semibold">
          {language === 'th'
            ? 'ยังไม่ได้เลือกข้อมูลลูกค้า (คลิกเลือกชื่อลูกค้าด้านซ้ายเพื่อเปิดดู หรือเปิดหลายคนเทียบกันได้)'
            : 'No customer selected. Click a customer on the left to open and compare.'}
        </span>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${selectedCustomers.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
      {selectedCustomers.map((panel, idx) => (
        <CustomerHistoryCard
          key={panel.cust.id}
          panelIndex={idx}
          cust={panel.cust}
          chats={panel.chats}
          isLoading={panel.loading}
          onClose={onCloseCustomer}
          language={language}
        />
      ))}
    </div>
  );
}
