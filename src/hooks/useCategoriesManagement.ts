'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveAuditLog } from '@/lib/audit';

export function useCategoriesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [totalChatsCount, setTotalChatsCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<any>(null);

  // Tabs & System Tags
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [systemTags, setSystemTags] = useState<string[]>([
    '#VIP',
    '#ส่งเรื่องทีมเทคนิค',
    '#รอสลิป',
    '#ติดตามผล',
    '#รอธนาคารแก้ไข',
    '#เคสพิเศษ',
  ]);

  const getActiveCompanyId = useCallback(() => {
    let raw = '';
    if (typeof document !== 'undefined') {
      const matchCookie = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
      if (matchCookie) raw = decodeURIComponent(matchCookie[1]);
    }
    if (!raw && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem('company_id') || '';
    }
    if (!raw || raw === 'all' || raw === 'null' || raw === 'undefined') return '';
    return raw;
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const compId = getActiveCompanyId();
      const compQuery = compId && compId !== 'all' ? `?company_id=${compId}` : '';

      // 1. Fetch categories
      const catRes = await fetch(`/api/categories${compQuery}`);
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats || []);
      }

      // 2. Fetch chats count to calculate stats
      const chatsQuery =
        compId && compId !== 'all' ? `?summary_only=true&company_id=${compId}` : '?summary_only=true';
      const chatsRes = await fetch(`/api/chats${chatsQuery}`);
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        const chatList = Array.isArray(chats) ? chats : [];
        setTotalChatsCount(chatList.length);

        const stats: Record<string, number> = {};
        chatList.forEach((chat: any) => {
          const cat = chat.category_id || chat.category || 'other';
          stats[cat] = (stats[cat] || 0) + 1;
        });
        setCategoryStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch categories or chat stats:', err);
    } finally {
      setLoading(false);
    }
  }, [getActiveCompanyId]);

  useEffect(() => {
    fetchCategories();
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserProfile(JSON.parse(savedSession));
      } catch (e) {}
    }
    const savedTags = localStorage.getItem('system_tags');
    if (savedTags) {
      try {
        const parsed = JSON.parse(savedTags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSystemTags(parsed);
        }
      } catch (e) {}
    }
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleStartEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (data: {
    id: string;
    name: string;
    name_en: string;
    description: string;
    isEdit: boolean;
  }) => {
    const compId = getActiveCompanyId();

    if (data.isEdit) {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          name_en: data.name_en,
          description: data.description,
        }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to update category');
      }

      const updatedCategory = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === data.id ? updatedCategory : c)));
      await saveAuditLog('UPDATE', `แก้ไขหมวดหมู่: ${data.name} (ID: ${data.id})`);
      alert('แก้ไขหมวดหมู่สำเร็จ!');
    } else {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          name_en: data.name_en,
          description: data.description,
          company_id: compId && compId !== 'all' ? compId : null,
        }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to create category');
      }

      const newCategory = await res.json();
      setCategories((prev) => [...prev, newCategory]);
      await saveAuditLog('CREATE', `สร้างหมวดหมู่ใหม่: ${data.name} (ID: ${data.id})`);
      alert('เพิ่มหมวดหมู่ใหม่สำเร็จ!');
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const isConfirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${cat.name || cat.id}"?\nการดำเนินการนี้จะลบข้อมูลออกจากระบบอย่างถาวรและไม่สามารถเรียกคืนได้`
    );
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to delete category');
      }

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      await saveAuditLog('DELETE', `ลบหมวดหมู่: ${cat.name || cat.id} (ID: ${cat.id})`);
      alert('ลบหมวดหมู่สำเร็จ!');
    } catch (err: any) {
      console.error(err);
      alert(`ไม่สามารถลบหมวดหมู่ได้: ${err.message}`);
    }
  };

  const canManage = userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin';

  return {
    categories,
    loading,
    categoryStats,
    totalChatsCount,
    isModalOpen,
    setIsModalOpen,
    editingCategory,
    userProfile,
    canManage,
    activeTab,
    setActiveTab,
    systemTags,
    setSystemTags,
    fetchCategories,
    handleOpenCreateModal,
    handleStartEdit,
    handleSaveCategory,
    handleDeleteCategory,
  };
}
