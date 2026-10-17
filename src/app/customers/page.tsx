'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import CustomerListPanel from '@/components/customers/CustomerListPanel';
import CustomerComparisonPanel, { CustomerSelectedState } from '@/components/customers/CustomerComparisonPanel';

export default function CustomersPage() {
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected customers comparison list
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerSelectedState[]>([]);
  const [, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch categories and customers in parallel for maximum speed
      const [catRes, custRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/customers'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const catMap: Record<string, string> = {};
        catData.forEach((c: any) => {
          catMap[c.id] = c.name || c.title || c.id;
        });
        setCategories(catMap);
      }

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.id?.toLowerCase().includes(q)
    );
  }, [searchQuery, customers]);

  // Select customer to open in right-side comparison panel
  const handleSelectCustomer = async (cust: any) => {
    if (selectedCustomers.some((item) => item.cust.id === cust.id)) {
      return;
    }

    const newPanelState: CustomerSelectedState = {
      cust,
      chats: [],
      loading: true,
    };

    setSelectedCustomers((prev) => [...prev, newPanelState]);

    try {
      const res = await fetch(`/api/chats?search=${encodeURIComponent(cust.name || cust.id)}`);
      if (res.ok) {
        const chatsData = await res.json();
        setSelectedCustomers((prev) =>
          prev.map((item) =>
            item.cust.id === cust.id ? { ...item, chats: chatsData || [], loading: false } : item
          )
        );
      } else {
        setSelectedCustomers((prev) =>
          prev.map((item) => (item.cust.id === cust.id ? { ...item, loading: false } : item))
        );
      }
    } catch (e) {
      setSelectedCustomers((prev) =>
        prev.map((item) => (item.cust.id === cust.id ? { ...item, loading: false } : item))
      );
    }
  };

  const handleCloseCustomer = (custId: string) => {
    setSelectedCustomers((prev) => prev.filter((item) => item.cust.id !== custId));
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
            {language === 'th'
              ? 'บันทึกและจัดการทะเบียนลูกค้า'
              : 'Customer 360 & Registry'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
            {language === 'th'
              ? 'ค้นหาและเปรียบเทียบข้อมูลประวัติลูกค้าในระบบ Sift AI แบบเรียลไทม์'
              : 'Track customer portfolio and compare Sift AI chat history'}
          </p>
        </div>
      </div>

      {/* Customer Registry List & Comparison Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Customers List */}
        <div className="lg:col-span-1">
          <CustomerListPanel
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            customers={filteredCustomers}
            loading={loading}
            selectedCustomerIds={selectedCustomers.map((s) => s.cust.id)}
            onSelectCustomer={handleSelectCustomer}
            language={language}
          />
        </div>

        {/* Right: Selected Customers Triage History Panels */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerComparisonPanel
            selectedCustomers={selectedCustomers}
            onCloseCustomer={handleCloseCustomer}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}
