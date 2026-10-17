'use client';

import { Settings, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useCategoriesManagement } from '@/hooks/useCategoriesManagement';
import CategoryHeader from '@/components/categories/CategoryHeader';
import CategoryListGrid from '@/components/categories/CategoryListGrid';
import CategoryModal from '@/components/categories/CategoryModal';
import SystemTagsManager from '@/components/categories/SystemTagsManager';

export default function CategoriesPage() {
  const { language } = useLanguage();

  const {
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
  } = useCategoriesManagement();

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <CategoryHeader
        language={language}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canManage={canManage}
        categoriesCount={categories.length}
        systemTagsCount={systemTags.length}
        onOpenCreateModal={handleOpenCreateModal}
        onRefresh={fetchCategories}
      />

      {/* Main Content Area */}
      {activeTab === 'tags' ? (
        <SystemTagsManager
          systemTags={systemTags}
          setSystemTags={setSystemTags}
          canManage={canManage}
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-2.5 text-neutral-400 dark:text-neutral-500 font-mono text-xs">
          <RefreshCw size={18} className="animate-spin text-neutral-400 dark:text-neutral-600" />
          <span>
            {language === 'th' ? 'กำลังโหลดรายการหมวดหมู่...' : 'Fetching taxonomy data...'}
          </span>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 p-12 text-center text-neutral-400 dark:text-neutral-500 text-xs flex flex-col items-center justify-center gap-2 backdrop-blur-md">
          <Settings size={24} className="text-neutral-300 dark:text-neutral-700" />
          <span>ไม่พบหมวดหมู่ใดๆ ในฐานข้อมูล</span>
        </div>
      ) : (
        <CategoryListGrid
          categories={categories}
          totalChatsCount={totalChatsCount}
          categoryStats={categoryStats}
          canManage={canManage}
          userProfile={userProfile}
          language={language}
          onEdit={handleStartEdit}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSave={handleSaveCategory}
        language={language}
      />
    </div>
  );
}
