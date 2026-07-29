'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Database, RefreshCw, MessageSquare, Info,
  TrendingUp, CircleAlert, ShieldAlert, BadgeInfo, Plus, X, CheckCircle, Trash2
} from 'lucide-react';
import { saveAuditLog } from '@/lib/audit';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function CategoriesPage() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  
  // Add Category Modal states
  const [showModal, setShowModal] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Edit Category Modal states
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserProfile(JSON.parse(savedSession));
      } catch (e) {}
    }
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories via Server API Proxy
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
      }

      // 2. Fetch chats count to calculate stats via Server API Proxy
      const chatsRes = await fetch('/api/chats');
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        const counts: Record<string, number> = {};
        chats.forEach((c: any) => {
          const catId = c.category_id || 'other';
          counts[catId] = (counts[catId] || 0) + 1;
        });
        setCategoryStats(counts);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId || !newCatName) {
      alert('กรุณากรอกไอดีและชื่อหมวดหมู่ให้ครบถ้วน');
      return;
    }
    
    // Clean ID format (lowercase, English alphanumeric and underscores/hyphens only)
    const cleanedId = newCatId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (!cleanedId) {
      alert('ไอดีหมวดหมู่ต้องเป็นภาษาอังกฤษ ตัวเลข หรือขีดกลาง/ขีดล่างเท่านั้น');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: cleanedId,
          name: newCatName.trim(),
          description: newCatDesc.trim()
        })
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to create category');
      }

      const newCategory = await res.json();
      
      // Update local state with the new category
      setCategories(prev => [...prev, newCategory]);
      
      // Reset inputs & close modal
      setNewCatId('');
      setNewCatName('');
      setNewCatDesc('');
      setShowModal(false);
      
      // Save audit log
      await saveAuditLog('CREATE', `สร้างหมวดหมู่ใหม่: ${newCatName.trim()} (ID: ${cleanedId})`);

      alert('สร้างหมวดหมู่ใหม่สำเร็จ!');
    } catch (err: any) {
      console.error(err);
      alert(`ไม่สามารถเพิ่มหมวดหมู่ได้: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Edit Start Handler
  const handleStartEdit = (cat: any) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || cat.title || '');
    setEditCatDesc(cat.description || cat.desc || '');
  };

  // Edit Save Handler
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCatName.trim(),
          description: editCatDesc.trim()
        })
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to update category');
      }

      const updatedCategory = await res.json();

      // Update local state
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c));
      
      // Save audit log
      await saveAuditLog('UPDATE', `แก้ไขหมวดหมู่: ${editCatName.trim()} (ID: ${editingCategory.id})`);

      setEditingCategory(null);
      alert('แก้ไขหมวดหมู่สำเร็จ!');
    } catch (err: any) {
      console.error(err);
      alert(`ไม่สามารถแก้ไขหมวดหมู่ได้: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (cat: any) => {
    const isConfirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${cat.name || cat.id}"?\nการดำเนินการนี้จะลบข้อมูลออกจากระบบอย่างถาวรและไม่สามารถเรียกคืนได้`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to delete category');
      }

      // Update local state
      setCategories(prev => prev.filter(c => c.id !== cat.id));

      // Save audit log
      await saveAuditLog('DELETE', `ลบหมวดหมู่: ${cat.name || cat.id} (ID: ${cat.id})`);

      alert('ลบหมวดหมู่สำเร็จ!');
    } catch (err: any) {
      console.error(err);
      alert(`ไม่สามารถลบหมวดหมู่ได้: ${err.message}`);
    }
  };

  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [systemTags, setSystemTags] = useState<string[]>([
    '#VIP', '#ส่งเรื่องทีมเทคนิค', '#รอสลิป', '#ติดตามผล', '#รอธนาคารแก้ไข', '#เคสพิเศษ'
  ]);
  const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddSystemTag = () => {
    if (!newTagInput.trim()) return;
    let tagName = newTagInput.trim();
    if (!tagName.startsWith('#')) tagName = '#' + tagName;
    if (systemTags.includes(tagName)) {
      alert('มีแท็กชื่อนี้ในระบบแล้ว');
      return;
    }
    setSystemTags(prev => [...prev, tagName]);
    setNewTagInput('');
    saveAuditLog('CREATE', `เพิ่มแท็กใหม่ในระบบ: ${tagName}`);
    alert(`เพิ่มแท็ก "${tagName}" เข้าสู่ระบบสำเร็จ!`);
  };

  const handleRenameSystemTag = (oldName: string) => {
    if (!editingTag || !editingTag.newName.trim()) return;
    let updatedName = editingTag.newName.trim();
    if (!updatedName.startsWith('#')) updatedName = '#' + updatedName;

    setSystemTags(prev => prev.map(t => t === oldName ? updatedName : t));
    saveAuditLog('UPDATE', `แก้ไขชื่อแท็กระบบจาก ${oldName} เป็น ${updatedName}`);
    setEditingTag(null);
    alert(`แก้ไขชื่อแท็กจาก "${oldName}" เป็น "${updatedName}" สำเร็จ!`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
            {language === 'th' ? 'ศูนย์จัดการหมวดหมู่และแท็กระบบ (Category & Tag Manager)' : 'Category & Tag Manager'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === 'th' ? 'ตั้งค่าหมวดหมู่ปัญหาหลัก และแท็กติดเคสสำหรับคัดแยกด้วย AI และทีมสนับสนุน' : 'Configure main categories and tag labels evaluated by AI and support agents'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'categories' && (userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin') && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer"
            >
              <Plus size={16} /> {language === 'th' ? 'เพิ่มหมวดหมู่ใหม่' : 'Add Category'}
            </button>
          )}
          
          <button 
            onClick={fetchCategories}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> {language === 'th' ? 'อัปเดตข้อมูล' : 'Reload Data'}
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Database size={14} />
          <span>📂 หมวดหมู่หลัก (Main Categories)</span>
          <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{categories.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'tags'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings size={14} />
          <span>🏷️ แท็กติดเคสระบบ (System Tags)</span>
          <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{systemTags.length}</span>
        </button>
      </div>

      {activeTab === 'tags' ? (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start gap-3">
            <BadgeInfo size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-semibold">
              แท็กระบบด้านล่างนี้ใช้สำหรับให้แอดมินหรือระบบ AI ติดสัญลักษณ์เพื่อจำแนกประเภทเคสพิเศษแบบรวดเร็ว (เช่น <span className="font-extrabold text-indigo-600 dark:text-indigo-400">#VIP</span>, <span className="font-extrabold text-indigo-600 dark:text-indigo-400">#รอสลิป</span>) สามารถเพิ่มแท็กใหม่ หรือกดแก้ไขชื่อแท็กทั้งระบบเพื่ออัปเดตเคสทั้งหมดได้ทันที
            </div>
          </div>

          {/* Add New Tag Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              ➕ เพิ่มแท็กใหม่เข้าสู่ระบบ
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="พิมพ์ชื่อแท็กใหม่ (เช่น #คืนยอดเสีย, #เคสด่วนพิเศษ)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSystemTag();
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSystemTag}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer shrink-0"
              >
                + เพิ่มแท็กระบบ
              </button>
            </div>
          </div>

          {/* System Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTags.map((tagName) => {
              const isEditingThis = editingTag?.oldName === tagName;

              return (
                <div key={tagName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        System Label
                      </span>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        พร้อมใช้งาน
                      </span>
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={editingTag.newName}
                          onChange={(e) => setEditingTag({ ...editingTag, newName: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-850 border border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingTag(null)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRenameSystemTag(tagName)}
                            className="text-[10px] font-bold px-3 py-1 rounded-lg bg-indigo-600 text-white"
                          >
                            บันทึก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                          {tagName}
                        </span>
                        {(userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin') && (
                          <button
                            type="button"
                            onClick={() => setEditingTag({ oldName: tagName, newName: tagName })}
                            className="text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="แก้ไขชื่อแท็กทั้งระบบ"
                          >
                            ✏️ แก้ไขชื่อแท็ก
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/chats?search=${encodeURIComponent(tagName)}`}
                    className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-between group transition cursor-pointer"
                  >
                    <span>ค้นหาเคสติดแท็กนี้</span>
                    <span className="group-hover:translate-x-1 transition-transform">➡️</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 dark:text-slate-500">
          <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold">{language === 'th' ? 'กำลังตรวจสอบรายการหมวดหมู่...' : 'Checking categories list...'}</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-16 rounded-2xl shadow-sm text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-3 transition-all duration-250">
          <Settings size={36} className="text-slate-300 dark:text-slate-700" />
          <span>ไม่พบหมวดหมู่ใดๆ ในฐานข้อมูล Supabase ตาราง categories</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info callout */}
          <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl flex items-start gap-3">
            <BadgeInfo size={20} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div className="text-sm text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
              หมวดหมู่ด้านล่างนี้คือกลุ่มหัวข้อหลักที่ AI (Triage Agent) จะนำไปพิจารณาจัดกลุ่มเมื่อลูกค้าแจ้งแชตเข้ามา หากประเด็นไหนไม่ตรงเลย จะถูกจัดเป็น **`other (อื่นๆ)`** พนักงานสามารถดูแนวโน้มปริมาณของแต่ละหัวข้อได้จากตัวเลขเคสสะสม
              {!(userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin') && (
                <div className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  🔒 หมายเหตุ: เนื่องจากสิทธิ์ผู้ใช้ของคุณคือ {userProfile?.role?.replace('_', ' ') || 'Guest'} หน้านี้จึงแสดงผลเพื่อดูสถิติได้อย่างเดียว (แก้ไขไม่ได้) หากต้องการเพิ่ม/แก้ไขหมวดหมู่หลักกรุณาติดต่อทีม Super Admin หรือ System Admin
                </div>
              )}
            </div>
          </div>

          {/* Feature #4: Category Usage Overview Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl">
                <Database size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">หมวดหมู่หลักทั้งหมด</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">{categories.length} หมวดหมู่</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-955/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">เคสรวมทุกหมวดหมู่</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {Object.values(categoryStats).reduce((a, b) => a + b, 0)} เคส
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 p-3 rounded-xl">
                <MessageSquare size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">หมวดหมู่ที่พบบ่อยที่สุด</span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block truncate max-w-[180px]">
                  {(() => {
                    const sorted = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
                    if (sorted.length === 0) return 'ไม่มีข้อมูล';
                    const topCat = categories.find(c => c.id === sorted[0][0]);
                    return topCat ? `${topCat.name} (${sorted[0][1]} เคส)` : `${sorted[0][0]} (${sorted[0][1]} เคส)`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const catId = cat.id;
              const catName = cat.name || cat.title || catId;
              const catDesc = cat.description || cat.desc || 'ไม่มีคำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้';
              const ticketCount = categoryStats[catId] || 0;

              return (
                <div key={catId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group duration-250">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-wider font-semibold">Category ID: {catId}</span>
                        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-1 font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {catName}
                        </h3>
                      </div>
                      
                      {/* Action buttons (Edit & Delete) */}
                      {(userProfile?.role === 'super_admin' || userProfile?.role === 'system_admin') && (
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            title="แก้ไขหมวดหมู่"
                            className="bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                          >
                            <Settings size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            title="ลบหมวดหมู่"
                            className="bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                      {catDesc}
                    </p>
                  </div>

                  {/* Stat Footer (Clickable to view chats list) */}
                  <Link 
                    href={`/chats?category=${cat.id}`}
                    className="bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-250 transition-all cursor-pointer group/footer select-none"
                  >
                    <span className="text-slate-400 dark:text-slate-500 group-hover/footer:text-indigo-600 dark:group-hover/footer:text-indigo-400 flex items-center gap-1.5 transition-colors">
                      <MessageSquare size={14} /> {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Total Accumulated'}
                    </span>
                    <span className="text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 rounded-lg font-extrabold group-hover/footer:scale-105 transition-transform flex items-center gap-1">
                      {ticketCount} {language === 'th' ? 'เคส' : 'Cases'} ➡️
                    </span>
                  </Link>
                </div>
              );
            })}

            {/* Other / Unclassified Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group duration-250">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-555 font-mono font-bold uppercase tracking-wider font-semibold">Fallback (Default)</span>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-1 font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {language === 'th' ? 'อื่นๆ (Other / Unclassified)' : 'Other / Unclassified'}
                    </h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-slate-400">
                    <Info size={18} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                  {language === 'th' ? 'กลุ่มสำหรับแชตที่ AI ไม่สามารถจำแนกลงในหมวดหมู่หลักทั้ง 4 ด้านข้างต้นได้ พนักงานจะเป็นผู้เข้ามาพิจารณาสร้างหมวดหมู่ใหม่เป็นกรณีพิเศษ' : 'Chats that AI cannot categorize into the main mapped categories. Admins will manually triage or setup a new category.'}
                </p>
              </div>

              {/* Stat Footer (Clickable to view unclassified chats) */}
              <Link 
                href="/chats?category=other"
                className="bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-250 transition-all cursor-pointer group/footer select-none"
              >
                <span className="text-slate-400 dark:text-slate-500 group-hover/footer:text-indigo-600 dark:group-hover/footer:text-indigo-400 flex items-center gap-1.5 transition-colors">
                  <MessageSquare size={14} /> {language === 'th' ? 'เคสสะสมทั้งหมด' : 'Total Accumulated'}
                </span>
                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-2.5 py-0.5 rounded-lg font-extrabold group-hover/footer:scale-105 transition-transform flex items-center gap-1">
                  {categoryStats['other'] || categoryStats['Other'] || 0} {language === 'th' ? 'เคส' : 'Cases'} ➡️
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-all transform scale-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850/40">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">เพิ่มหมวดหมู่ปัญหาใหม่</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">สร้างหัวข้อใหม่เพื่อให้ระบบ AI และพนักงานนำไปคัดกรอง</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCategory} className="p-6 space-y-5">
              {/* Category ID */}
              <div>
                <label className="block text-slate-555 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                  ไอดีหมวดหมู่ (Category ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ตัวอย่าง: billing, product_return"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                  * กรอกภาษาอังกฤษตัวพิมพ์เล็ก ไม่มีวรรค (เช่น billing, delivery)
                </p>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-slate-555 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                  ชื่อหมวดหมู่ที่ใช้แสดงผล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ตัวอย่าง: ปัญหาการเงินและการชำระเงิน"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Category Description */}
              <div>
                <label className="block text-slate-555 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                  คำอธิบายหมวดหมู่ (Description)
                </label>
                <textarea
                  placeholder="ตัวอย่าง: สอบถามการชำระเงิน โอนเงินไม่เข้า หรือขอเงินคืน"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-755 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl transition text-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition text-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  {saving ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-all transform scale-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850/40">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">แก้ไขหมวดหมู่ปัญหา</h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">ไอดีหมวดหมู่: {editingCategory.id} (แก้ไขไม่ได้)</p>
              </div>
              <button 
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditCategory} className="p-6 space-y-5">
              {/* Category Name */}
              <div>
                <label className="block text-slate-555 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                  ชื่อหมวดหมู่ที่ใช้แสดงผล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ตัวอย่าง: ปัญหาการเงินและการชำระเงิน"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Category Description */}
              <div>
                <label className="block text-slate-555 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                  คำอธิบายหมวดหมู่ (Description)
                </label>
                <textarea
                  placeholder="ตัวอย่าง: สอบถามการชำระเงิน โอนเงินไม่เข้า หรือขอเงินคืน"
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-755 dark:text-slate-200 font-bold px-5 py-2.5 rounded-xl transition text-sm cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition text-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
