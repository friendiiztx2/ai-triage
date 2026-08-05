'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Trash2, Edit2, Plus, X, ChevronDown,
  Search, RefreshCw, ShieldAlert, Key, Mail, Shield, Building, Info, 
  CheckCircle2, LayoutDashboard, MessageSquare, Settings, Clipboard, Check, Lock
} from 'lucide-react';

import { saveAuditLog } from '@/lib/audit';
import { useLanguage } from '@/components/LanguageContext';

const PERMISSIONS_LIST = [
  { 
    id: 'view_dashboard', 
    label: 'ดูภาพรวมระบบ', 
    description: 'สถิติปริมาณเคส ความแม่นยำ AI และกราฟวิเคราะห์แนวโน้ม',
    icon: LayoutDashboard 
  },
  { 
    id: 'view_chats', 
    label: 'จัดการแชตและข้อมูลลูกค้า', 
    description: 'ดูรายการแชตของลูกค้า คัดแยกความสำคัญ และดูประวัติลูกค้า',
    icon: MessageSquare 
  },
  { 
    id: 'manage_categories', 
    label: 'จัดการหมวดหมู่ปัญหา', 
    description: 'เพิ่ม/แก้ไข/ลบหมวดหมู่หลัก 18 รายการสำหรับการคัดกรองแชต',
    icon: Settings 
  },
  { 
    id: 'manage_users', 
    label: 'จัดการสมาชิกในทีม', 
    description: 'จัดการระดับสิทธิ์ (Role) และสิทธิ์ย่อยของผู้ใช้งานในสังกัด',
    icon: Users 
  },
  { 
    id: 'manage_companies', 
    label: 'จัดการข้อมูลบริษัท (System Tenant)', 
    description: 'จัดตั้ง/ลงทะเบียนบริษัทใหม่พร้อมเจนเนอเรท Client Credentials',
    icon: Building, 
    requireSystemAdmin: true 
  },
  { 
    id: 'export_csv', 
    label: 'ดาวน์โหลดรายงาน CSV', 
    description: 'ส่งออกไฟล์รายงานสถิติของแชตลูกค้าสำหรับนำไปทำกราฟภายนอก',
    icon: Clipboard 
  }
];

export default function UsersPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Password visibility states (masked by default, click eye to reveal)
  const [visiblePasswordUserIds, setVisiblePasswordUserIds] = useState<string[]>([]);

  // Modal & Saving states
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dropdown open states
  const [showAddPermissionsDropdown, setShowAddPermissionsDropdown] = useState(false);
  const [showEditPermissionsDropdown, setShowEditPermissionsDropdown] = useState(false);

  // Inline collapsible dropdown state for PATCH (Pencil button)
  const [expandedPatchUserId, setExpandedPatchUserId] = useState<string | null>(null);

  // Click outside ref to close dropdowns
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUserProfile(parsed);
        fetchInitialData(parsed);
      } catch (e) {
        fetchInitialData(null);
      }
    } else {
      fetchInitialData(null);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setShowAddPermissionsDropdown(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setShowEditPermissionsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync manage_companies permission based on role (Add form / PATCH form)
  useEffect(() => {
    if (role !== 'system_admin') {
      setSelectedPermissions(prev => prev.filter(p => p !== 'manage_companies'));
    }
  }, [role]);

  const fetchInitialData = async (profile: any) => {
    setLoading(true);
    try {
      const resUsers = await fetch('/api/users');
      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        if (Array.isArray(dataUsers)) {
          setUsers(dataUsers);
          setFilteredUsers(dataUsers);
        }
      }

      // Fetch all companies to make them selectable
      const resCompanies = await fetch('/api/companies');
      if (resCompanies.ok) {
        const dataCompanies = await resCompanies.json();
        setCompanies(dataCompanies);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (companyId?: string) => {
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
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = users.filter(u => 
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

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setRole('agent');
    setSelectedPermissions(['view_dashboard', 'view_chats']);
    setSelectedCompanies([]);
    setPassword('');
    setError(null);
    setShowAddPermissionsDropdown(false);
    setShowAddModal(true);
  };

  // Toggle expanded PATCH sub-row dropdown (Pencil button)
  const handleTogglePatchDropdown = (user: any) => {
    if (expandedPatchUserId === user.id) {
      setExpandedPatchUserId(null);
    } else {
      setExpandedPatchUserId(user.id);
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'agent');
      setSelectedCompanies((user.company_id || '').split(',').filter(Boolean));
      setSelectedPermissions(user.permissions || []);
      setPassword('');
      setError(null);
      setShowEditPermissionsDropdown(false);
    }
  };


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !password) {
      setError('กรุณากรอกชื่อผู้ใช้ บทบาท และรหัสผ่าน');
      return;
    }
    if (password.length < 4 || !/[a-zA-Z]/.test(password)) {
      setError(language === 'th'
        ? 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'
        : 'Password must be at least 4 characters and contain at least one English letter (a-z/A-Z)');
      return;
    }
    if (role !== 'system_admin' && selectedCompanies.length === 0) {
      setError('กรุณาเลือกบริษัทสังกัด');
      return;
    }

    if (password && password.trim() !== '') {
      if (password.length < 4 || !/[a-zA-Z]/.test(password)) {
        setError(language === 'th'
          ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร และต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'
          : 'New password must be at least 4 characters and contain at least one English letter (a-z/A-Z)');
        return;
      }
    }

    setSaving(true);
    setError(null);

    const submitEmail = email.trim() !== '' ? email.trim() : name.trim();
    const companyIdPayload = role === 'system_admin' ? null : selectedCompanies.join(',');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email: submitEmail, 
          role, 
          company_id: companyIdPayload, 
          password,
          permissions: selectedPermissions 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');

      setUsers(prev => [data, ...prev]);
      setShowAddModal(false);

      // Save audit log
      await saveAuditLog('CREATE', `เพิ่มผู้ใช้งานใหม่: ${name.trim()} (บทบาท: ${role})`);

      alert('เพิ่มผู้ใช้งานใหม่สำเร็จ!');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  // Save Edit User (PATCH) inline inside collapsible dropdown
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) {
      setError('กรุณากรอกชื่อผู้ใช้และบทบาท');
      return;
    }
    if (role !== 'system_admin' && selectedCompanies.length === 0) {
      setError('กรุณาเลือกบริษัทสังกัด');
      return;
    }

    setSaving(true);
    setError(null);

    const submitEmail = email.trim() !== '' ? email.trim() : name.trim();
    const companyIdPayload = role === 'system_admin' ? null : selectedCompanies.join(',');

    try {
      const bodyData: any = { 
        id: expandedPatchUserId, 
        name, 
        email: submitEmail, 
        role, 
        company_id: companyIdPayload,
        permissions: selectedPermissions
      };
      
      if (password.trim() !== '') {
        bodyData.password = password.trim();
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit user');

      setUsers(prev => prev.map(u => u.id === expandedPatchUserId ? data : u));

      // Save audit log
      await saveAuditLog('UPDATE', `อัปเดตข้อมูลผู้ใช้: ${name.trim()} (ID: ${expandedPatchUserId})`);

      setExpandedPatchUserId(null); // Collapse panel
      alert('อัปเดตข้อมูลผู้ใช้เรียบร้อย!');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteUser = async (user: any) => {
    const isConfirmed = window.confirm(`คุณต้องการลบบัญชีผู้ใช้งาน "${user.name}" (${user.email}) ออกจากระบบใช่หรือไม่?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));

      // Save audit log
      await saveAuditLog('DELETE', `ลบผู้ใช้งาน: ${user.name} (อีเมล: ${user.email}, ID: ${user.id})`);

      alert('ลบผู้ใช้ออกจากระบบสำเร็จ!');
    } catch (err: any) {
      alert(`ไม่สามารถลบผู้ใช้ได้: ${err.message}`);
    }
  };

  const handleToggleCompany = (id: string) => {
    if (selectedCompanies.includes(id)) {
      setSelectedCompanies(prev => prev.filter(item => item !== id));
    } else {
      setSelectedCompanies(prev => [...prev, id]);
    }
  };

  const handleTogglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(prev => prev.filter(p => p !== id));
    } else {
      setSelectedPermissions(prev => [...prev, id]);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    if (visiblePasswordUserIds.includes(userId)) {
      setVisiblePasswordUserIds(prev => prev.filter(id => id !== userId));
    } else {
      setVisiblePasswordUserIds(prev => [...prev, userId]);
    }
  };

  const getCompanyDisplay = (role: string, companyIdStr: string) => {
    if (role === 'system_admin') return 'ทุกบริษัท (Global Admin)';
    const ids = (companyIdStr || '').split(',').filter(Boolean);
    if (ids.length === 0) return 'ไม่มีสังกัด';
    
    const names = ids.map(id => {
      const match = companies.find(c => c.id === id);
      if (match) return match.name;
      if (id === '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2') return 'Mika Co.';
      if (id === '2e65829a-6a60-4022-8289-0fe64ec98fae') return 'Alpha Support';
      return id.substring(0, 8);
    });

    return names.join(', ');
  };

  const getPermissionLabel = (perm: string) => {
    switch (perm) {
      case 'view_dashboard': return 'แดชบอร์ด';
      case 'view_chats': return 'แชตลูกค้า';
      case 'manage_categories': return 'หมวดหมู่';
      case 'manage_users': return 'สมาชิกในทีม';
      case 'manage_companies': return 'บริษัท';
      case 'export_csv': return 'ออกรายงาน';
      default: return perm;
    }
  };

  const modalCompanyOptions = companies.length > 0
    ? companies
    : [
        { id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', name: 'Mika Co.' },
        { id: '2e65829a-6a60-4022-8289-0fe64ec98fae', name: 'Alpha Support Co., Ltd.' }
      ];

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display font-bold">จัดการบัญชีผู้ใช้งาน (User Management)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">บริหารสิทธิ์ความปลอดภัย กำหนดสิทธิ์ย่อยแยกรายฟังก์ชันด้วยระบบ Checklist Permissions</p>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={16} /> เพิ่มบัญชีผู้ใช้ใหม่
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters Header */}
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative text-slate-850 dark:text-slate-100">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล หรือบทบาท..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-800 dark:text-slate-100"
              />
            </div>

            {userProfile?.role === 'system_admin' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">กรองบริษัท:</span>
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => handleCompanyFilterChange(e.target.value)}
                  className="bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                >
                  <option value="all">แสดงทุกบริษัท (All)</option>
                  {modalCompanyOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-slate-600 dark:text-slate-350 font-bold bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 select-none shadow-sm">
              👥 {language === 'th' ? 'บัญชีผู้ใช้ทั้งหมด:' : 'Total Accounts:'} <span className="font-extrabold text-indigo-650 dark:text-indigo-400 text-sm leading-none">{users.length}</span>
            </span>

            <button 
              onClick={() => fetchUsers(selectedCompanyFilter)}
              title="รีเฟรชข้อมูล"
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-855 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer self-end sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
            <RefreshCw size={32} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold">กำลังดึงข้อมูลบัญชีผู้ใช้งาน...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <Users size={36} className="text-slate-300 dark:text-slate-700" />
            <span>ไม่พบรายชื่อบัญชีผู้ใช้งานในระบบ</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-855/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <th className="px-6 py-4">ชื่อผู้ใช้งาน</th>
                  <th className="px-6 py-4">ชื่อบัญชี / อีเมล</th>
                  <th className="px-6 py-4">บทบาท</th>
                  <th className="px-6 py-4">สิทธิ์ย่อยการเข้าถึง</th>
                  <th className="px-6 py-4">บริษัทสังกัด</th>
                  <th className="px-6 py-4">รหัสผ่าน</th>
                  <th className="px-6 py-4 text-right">จัดการบัญชี</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  let roleBadgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-3-300';
                  if (u.role === 'system_admin') roleBadgeStyle = 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/30';
                  else if (u.role === 'super_admin') roleBadgeStyle = 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-955/20 dark:text-indigo-400 dark:border-indigo-900/30';
                  else if (u.role === 'admin') roleBadgeStyle = 'bg-emerald-50 text-emerald-655 border border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-450 dark:border-emerald-900/30';
                  else if (u.role === 'agent') roleBadgeStyle = 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';

                  const isPatchActive = expandedPatchUserId === u.id;

                  return (
                    <React.Fragment key={u.id}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-slate-855/35 transition relative ${isPatchActive ? 'bg-indigo-50/20 dark:bg-indigo-955/5 font-bold' : ''}`}>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{u.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-655 dark:text-slate-350 font-mono">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${roleBadgeStyle}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[240px]">
                          <div className="flex flex-wrap gap-1.5">
                            {u.role === 'system_admin' || (u.permissions && u.permissions.length === 6) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/60 text-indigo-700 dark:border-indigo-900/40 dark:text-indigo-300 shadow-sm select-none">
                                ✨ สิทธิ์เข้าถึงทั้งหมด (Full Access)
                              </span>
                            ) : u.permissions && u.permissions.length > 0 ? (
                              u.permissions.map((p: string) => {
                                let style = 'bg-slate-50 text-slate-655 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-770';
                                let Icon = Clipboard;

                                if (p === 'view_dashboard') {
                                  style = 'bg-blue-50/70 text-blue-700 border-blue-150 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';
                                  Icon = LayoutDashboard;
                                } else if (p === 'view_chats') {
                                  style = 'bg-emerald-50/70 text-emerald-700 border-emerald-150 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30';
                                  Icon = MessageSquare;
                                } else if (p === 'manage_categories') {
                                  style = 'bg-purple-50/70 text-purple-700 border-purple-150 dark:bg-purple-955/20 dark:text-purple-400 dark:border-purple-900/30';
                                  Icon = Settings;
                                } else if (p === 'manage_users') {
                                  style = 'bg-amber-50/70 text-amber-700 border-amber-150 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30';
                                  Icon = Users;
                                } else if (p === 'manage_companies') {
                                  style = 'bg-rose-50/70 text-rose-700 border-rose-150 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
                                  Icon = Building;
                                } else if (p === 'export_csv') {
                                  style = 'bg-slate-100/75 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
                                  Icon = Clipboard;
                                }

                                return (
                                  <span 
                                    key={p} 
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-extrabold tracking-wide select-none ${style}`}
                                  >
                                    <Icon size={10} className="shrink-0" />
                                    {getPermissionLabel(p)}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">ไม่มีสิทธิ์ย่อย</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-655 dark:text-slate-400">{getCompanyDisplay(u.role, u.company_id)}</td>
                        
                        {/* Masked password with toggle visibility eye icon */}
                        <td className="px-6 py-4 text-slate-455 dark:text-slate-500 font-mono font-medium">
                          <div className="flex items-center gap-2 justify-between max-w-[110px]">
                            <span>
                              {visiblePasswordUserIds.includes(u.id) 
                                ? u.password 
                                : '••••••'
                              }
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                              title={visiblePasswordUserIds.includes(u.id) ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                            >
                              {visiblePasswordUserIds.includes(u.id) ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </button>
                          </div>
                        </td>
                        
                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right space-x-2 shrink-0 relative">
                          <button
                            onClick={() => handleTogglePatchDropdown(u)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isPatchActive
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-955/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400'
                            }`}
                            title="แก้ไขข้อมูลทั้งหมด (PATCH)"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-955/10 hover:bg-rose-100 text-rose-600 dark:text-rose-455 transition cursor-pointer"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>

                      {/* ================= REDESIGNED INLINE COLLAPSIBLE FORM (PATCH) ================= */}
                      {isPatchActive && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-200 dark:border-slate-800 animate-fadeIn">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="max-w-xl mx-auto bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                              <form onSubmit={handleEditUser} className="space-y-4 text-left select-none">
                                
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400">
                                      <Shield size={16} />
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">แก้ไขข้อมูลพนักงาน</h4>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">แก้ไขข้อมูลของ: {u.name} ({u.email})</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => setExpandedPatchUserId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                {error && (
                                  <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-[10px] font-bold p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30">
                                    ⚠️ {error}
                                  </div>
                                )}

                                {/* Compact Form Input Stack */}
                                <div className="grid grid-cols-2 gap-3.5">
                                  <div className="space-y-1">
                                    <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-[9px]">ชื่อผู้ใช้งาน</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="ชื่อพนักงาน"
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-[9px]">ชื่อบัญชี / อีเมล</label>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-2.5 text-slate-400" size={13} />
                                      <input
                                        type="text"
                                        placeholder="ชื่อล็อกอิน"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                  <div className="space-y-1">
                                    <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-[9px]">บทบาทหลัก</label>
                                    <select
                                      value={role}
                                      onChange={(e) => setRole(e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600 cursor-pointer"
                                    >
                                      {userProfile?.role === 'system_admin' && (
                                        <option value="system_admin">System Admin</option>
                                      )}
                                      <option value="super_admin">Super Admin</option>
                                      <option value="admin">Admin</option>
                                      <option value="agent">Agent / Support</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-[9px]">
                                      รหัสผ่านใหม่
                                      <span className="text-[8px] text-slate-400 font-normal"> (ใช้รหัสเดิมเว้นไว้)</span>
                                    </label>
                                    <input
                                      type="password"
                                      placeholder={language === 'th' ? "รหัสผ่านใหม่ (ต้องมีตัวอักษร)" : "New password (must contain letters)"}
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                </div>


                                {/* Dynamic Role Permission Explainer */}
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-xl space-y-1 transition-all select-none">
                                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10.5px]">
                                    🔑 {role === 'system_admin' && 'System Admin (สิทธิ์ผู้ดูแลระบบโครงสร้าง)'}
                                    {role === 'super_admin' && 'Super Admin (ผู้ดูแลระบบร้านค้า)'}
                                    {role === 'admin' && 'Admin (ผู้จัดการทั่วไป)'}
                                    {role === 'agent' && 'Agent / Support (เจ้าหน้าที่ช่วยเหลือลูกค้า)'}
                                  </div>
                                  <ul className="list-disc list-inside space-y-0.5 font-semibold text-slate-450 dark:text-slate-400 text-[9.5px]">
                                    {role === 'system_admin' && (
                                      <>
                                        <li>เข้าถึงและตั้งค่าระบบได้ทุกส่วน รวมถึงจัดการบริษัท (Companies) และแอดมินทั้งหมด</li>
                                      </>
                                    )}
                                    {role === 'super_admin' && (
                                      <>
                                        <li>เข้าถึง Dashboard และระบบคัดแยกแชตลูกค้า</li>
                                        <li><b>สิทธิ์เพิ่ม/ลบ/แก้ไขแอดมินคนอื่นๆ ในระบบ</b> และตั้งค่าหมวดหมู่ปัญหา</li>
                                      </>
                                    )}
                                    {role === 'admin' && (
                                      <>
                                        <li>เข้าถึง Dashboard, คัดแยกแชต และจัดการหมวดหมู่ปัญหาได้</li>
                                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการผู้ใช้งาน หรือตั้งค่าระบบบริษัทได้</li>
                                      </>
                                    )}
                                    {role === 'agent' && (
                                      <>
                                        <li>เข้าถึง Dashboard และเข้ามาเปิดดูสรุปแชตลูกค้า/สิทธิ์ความเร่งด่วนเท่านั้น</li>
                                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการพนักงาน หรือลบ/แก้ไขหมวดหมู่ได้</li>
                                      </>
                                    )}
                                  </ul>
                                </div>

                                {/* Checklist of companies (select multiple) */}
                                <div className="space-y-1.5">
                                  <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-[9px]">บริษัทสังกัดที่ให้สิทธิ์เข้าถึง</label>
                                  {role === 'system_admin' ? (
                                    <div className="bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl p-2.5 font-bold text-slate-500 dark:text-slate-400 select-none flex items-center gap-2 text-[10px]">
                                      <Building size={13} className="text-indigo-500" />
                                      เข้าถึงข้อมูลได้ทุกบริษัท (Global Admin Context)
                                    </div>
                                  ) : (
                                    <div className="space-y-2 border border-slate-200 dark:border-slate-750 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-855 max-h-28 overflow-y-auto">
                                      {modalCompanyOptions.map(c => (
                                        <label key={c.id} className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer text-[10px] select-none hover:text-indigo-600 transition">
                                          <input
                                            type="checkbox"
                                            checked={selectedCompanies.includes(c.id)}
                                            onChange={() => handleToggleCompany(c.id)}
                                            className="w-3.5 h-3.5 text-indigo-600 border-slate-350 rounded cursor-pointer"
                                          />
                                          <span>{c.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Permissions multi-select dropdown */}
                                <div className="space-y-1 relative" ref={editDropdownRef}>
                                  <label className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px]">กำหนดสิทธิ์เข้าใช้งานฟังก์ชันต่างๆ</label>
                                  <button
                                    type="button"
                                    onClick={() => setShowEditPermissionsDropdown(!showEditPermissionsDropdown)}
                                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-850 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition"
                                  >
                                    <span className="truncate">
                                      {selectedPermissions.length === 0 
                                        ? 'เลือกสิทธิ์การเข้าถึง...' 
                                        : `เลือกแล้ว ${selectedPermissions.length} สิทธิ์ (${selectedPermissions.map(getPermissionLabel).join(', ')})`
                                      }
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                                  </button>

                                  {showEditPermissionsDropdown && (
                                    <div className="w-full mt-2 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 dark:border-indigo-500/40 rounded-xl p-2.5 space-y-2">
                                      {PERMISSIONS_LIST.map((p) => {
                                        const isDisabled = p.requireSystemAdmin && role !== 'system_admin';
                                        const isChecked = selectedPermissions.includes(p.id);

                                        return (
                                          <label
                                            key={p.id}
                                            className={`flex items-start gap-3 p-2.5 rounded-lg transition text-xs font-semibold select-none ${
                                              isDisabled 
                                                ? 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-slate-855/15' 
                                                : isChecked
                                                  ? 'bg-indigo-50/50 text-indigo-700 dark:bg-indigo-955/20 dark:text-indigo-400 cursor-pointer'
                                                  : 'text-slate-655 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 cursor-pointer'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              disabled={isDisabled}
                                              checked={isChecked}
                                              onChange={() => handleTogglePermission(p.id)}
                                              className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed shrink-0"
                                            />
                                            <div className="min-w-0">
                                              <span className="block leading-normal font-extrabold">{p.label}</span>
                                              <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-normal mt-0.5">{p.description}</span>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 mt-1">
                                  <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 py-2.5 rounded-xl font-bold shadow-md transition cursor-pointer text-center text-xs"
                                  >
                                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedPatchUserId(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 py-2.5 rounded-xl font-bold transition cursor-pointer text-center text-xs"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD USER MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-955/45 dark:bg-slate-955/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto animate-fadeIn">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 transition p-1 rounded-md"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-400">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm font-display leading-tight">เพิ่มบัญชีผู้ใช้งานใหม่</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 mt-0.5">กรอกประวัติข้อมูลผู้ใช้ พร้อมตั้งค่าสิทธิ์ Checklist ย่อยรายแผนก</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-[10px] font-bold p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mb-4 leading-normal">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ชื่อผู้ใช้ (Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมหมาย เจริญดี"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">ชื่อบัญชีล็อกอิน / อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="เช่น sommai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl pl-9.5 pr-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">รหัสผ่านเริ่มต้น</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="password"
                      required
                      placeholder={language === 'th' ? "ขั้นต่ำ 4 ตัวอักษร (ต้องมีตัวอักษร)" : "Min 4 characters (must contain letters)"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9.5 pr-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">บทบาทหลัก (Role)</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-9.5 pr-3.5 py-2.5 focus:border-indigo-600 focus:outline-none font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      {userProfile?.role === 'system_admin' && (
                        <option value="system_admin">System Admin</option>
                      )}
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Agent / Support</option>
                    </select>
                  </div>
                </div>


                {/* Dynamic Role Permission Explainer */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-xl space-y-1 transition-all select-none">
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10.5px]">
                    🔑 {role === 'system_admin' && 'System Admin (สิทธิ์ผู้ดูแลระบบโครงสร้าง)'}
                    {role === 'super_admin' && 'Super Admin (ผู้ดูแลระบบร้านค้า)'}
                    {role === 'admin' && 'Admin (ผู้จัดการทั่วไป)'}
                    {role === 'agent' && 'Agent / Support (เจ้าหน้าที่ช่วยเหลือลูกค้า)'}
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 font-semibold text-slate-450 dark:text-slate-400 text-[9.5px]">
                    {role === 'system_admin' && (
                      <>
                        <li>เข้าถึงและตั้งค่าระบบได้ทุกส่วน รวมถึงจัดการบริษัท (Companies) และแอดมินทั้งหมด</li>
                      </>
                    )}
                    {role === 'super_admin' && (
                      <>
                        <li>เข้าถึง Dashboard และระบบคัดแยกแชตลูกค้า</li>
                        <li><b>สิทธิ์เพิ่ม/ลบ/แก้ไขแอดมินคนอื่นๆ ในระบบ</b> และตั้งค่าหมวดหมู่ปัญหา</li>
                      </>
                    )}
                    {role === 'admin' && (
                      <>
                        <li>เข้าถึง Dashboard, คัดแยกแชต และจัดการหมวดหมู่ปัญหาได้</li>
                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการผู้ใช้งาน หรือตั้งค่าระบบบริษัทได้</li>
                      </>
                    )}
                    {role === 'agent' && (
                      <>
                        <li>เข้าถึง Dashboard และเข้ามาเปิดดูสรุปแชตลูกค้า/สิทธิ์ความเร่งด่วนเท่านั้น</li>
                        <li className="text-rose-500 dark:text-rose-455 list-none font-bold">❌ ไม่สามารถจัดการพนักงาน หรือลบ/แก้ไขหมวดหมู่ได้</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Checklist of companies (select multiple) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">บริษัทสังกัด (Tenant Access)</label>
                {role === 'system_admin' ? (
                  <div className="bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl p-3.5 font-bold text-slate-500 dark:text-slate-400 select-none flex items-center gap-2">
                    <Building size={14} className="text-indigo-500" />
                    เข้าถึงข้อมูลได้ทุกบริษัท (Global Admin Context)
                  </div>
                ) : (
                  <div className="space-y-2 border border-slate-200 dark:border-slate-750 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 max-h-28 overflow-y-auto">
                    {modalCompanyOptions.map(c => (
                      <label key={c.id} className="flex items-center gap-2.5 font-semibold text-slate-750 dark:text-slate-200 cursor-pointer text-[10px] select-none hover:text-indigo-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(c.id)}
                          onChange={() => handleToggleCompany(c.id)}
                          className="w-3.5 h-3.5 text-indigo-600 border-slate-350 rounded cursor-pointer"
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= ADD USER MULTI-SELECT DROPDOWN ================= */}
              <div className="space-y-1 relative" ref={addDropdownRef}>
                <label className="block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">กำหนดสิทธิ์เข้าใช้งานฟังก์ชันต่างๆ</label>
                <button
                  type="button"
                  onClick={() => setShowAddPermissionsDropdown(!showAddPermissionsDropdown)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-805 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition"
                >
                  <span className="truncate">
                    {selectedPermissions.length === 0 
                      ? 'เลือกสิทธิ์การเข้าถึง...' 
                      : `เลือกแล้ว ${selectedPermissions.length} สิทธิ์ (${selectedPermissions.map(getPermissionLabel).join(', ')})`
                    }
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                </button>

                {showAddPermissionsDropdown && (
                  <div className="w-full mt-2 bg-white dark:bg-slate-900 border-2 border-indigo-500/20 dark:border-indigo-500/40 rounded-xl p-2.5 space-y-2">
                    {PERMISSIONS_LIST.map((p) => {
                      const isDisabled = p.requireSystemAdmin && role !== 'system_admin';
                      const isChecked = selectedPermissions.includes(p.id);

                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg transition text-xs font-semibold select-none ${
                            isDisabled 
                              ? 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-slate-855/15' 
                              : isChecked
                                ? 'bg-indigo-50/50 text-indigo-770 dark:bg-indigo-955/20 dark:text-indigo-400 cursor-pointer'
                                : 'text-slate-655 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.id)}
                            className="w-4 h-4 mt-0.5 text-indigo-600 border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block leading-normal font-extrabold">{p.label}</span>
                            <span className="block text-[9px] text-slate-400 dark:text-slate-505 font-medium leading-normal mt-0.5">{p.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 py-3 rounded-xl font-bold shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-none transition cursor-pointer text-center block font-bold mt-2"
              >
                {saving ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันสร้างบัญชีใหม่'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
