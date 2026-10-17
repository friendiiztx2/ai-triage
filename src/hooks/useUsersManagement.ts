'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveAuditLog } from '@/lib/audit';

export function useUsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const [visiblePasswordUserIds, setVisiblePasswordUserIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedPatchUserId, setExpandedPatchUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (companyId?: string) => {
    setLoading(true);
    try {
      let url = '/api/users';
      if (companyId && companyId !== 'all') {
        url += `?company_id=${companyId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resUsers, resCompanies] = await Promise.all([fetch('/api/users'), fetch('/api/companies')]);

      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        if (Array.isArray(dataUsers)) {
          setUsers(dataUsers);
          setFilteredUsers(dataUsers);
        }
      }

      if (resCompanies.ok) {
        const dataCompanies = await resCompanies.json();
        setCompanies(dataCompanies);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
      } catch (e) {}
    }
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleCompanyFilterChange = (companyId: string) => {
    setSelectedCompanyFilter(companyId);
    fetchUsers(companyId);
  };

  const handleTogglePatch = (user: any) => {
    setExpandedPatchUserId((prev) => (prev === user.id ? null : user.id));
  };

  const handleSavePatch = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit user');

      setUsers((prev) => prev.map((u) => (u.id === payload.id ? data : u)));
      await saveAuditLog('UPDATE', `อัปเดตข้อมูลผู้ใช้: ${payload.name} (ID: ${payload.id})`);
      setExpandedPatchUserId(null);
      alert('อัปเดตข้อมูลผู้ใช้เรียบร้อย!');
      return true;
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
      return false;
    }
  };

  const handleDeleteUser = async (user: any) => {
    const isConfirmed = window.confirm(
      `คุณต้องการลบบัญชีผู้ใช้งาน "${user.name}" (${user.email}) ออกจากระบบใช่หรือไม่?`
    );
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      await saveAuditLog('DELETE', `ลบผู้ใช้งาน: ${user.name} (อีเมล: ${user.email}, ID: ${user.id})`);
      alert('ลบผู้ใช้ออกจากระบบสำเร็จ!');
    } catch (err: any) {
      alert(`ไม่สามารถลบผู้ใช้ได้: ${err.message}`);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswordUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleUserCreated = (newUser: any) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  return {
    users,
    filteredUsers,
    companies,
    selectedCompanyFilter,
    loading,
    searchQuery,
    setSearchQuery,
    userProfile,
    visiblePasswordUserIds,
    showAddModal,
    setShowAddModal,
    expandedPatchUserId,
    setExpandedPatchUserId,
    fetchUsers,
    handleCompanyFilterChange,
    handleTogglePatch,
    handleSavePatch,
    handleDeleteUser,
    togglePasswordVisibility,
    handleUserCreated,
  };
}
