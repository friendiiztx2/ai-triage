'use client';

import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import UserFilterBar from '@/components/users/UserFilterBar';
import UserTable from '@/components/users/UserTable';
import AddUserModal from '@/components/users/AddUserModal';

export default function UsersPage() {
  const { language } = useLanguage();

  const {
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
  } = useUsersManagement();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-display">
            {language === 'th' ? 'จัดการสมาชิกและสิทธิ์' : 'Team & Permissions'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-0.5 font-normal">
            {language === 'th'
              ? 'กำหนดบทบาทและสิทธิ์การเข้าถึงระบบของพนักงานและผู้ดูแล'
              : 'Configure user credentials, tenant bindings, and role-based access privileges'}
          </p>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <UserFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCompany={selectedCompanyFilter}
        onCompanyChange={handleCompanyFilterChange}
        companies={companies}
        userProfile={userProfile}
        onRefresh={() => fetchUsers(selectedCompanyFilter)}
        onOpenAddModal={() => setShowAddModal(true)}
        loading={loading}
        language={language}
      />

      {/* Users Table Component */}
      <UserTable
        users={filteredUsers}
        loading={loading}
        userProfile={userProfile}
        companies={companies}
        expandedPatchUserId={expandedPatchUserId}
        visiblePasswordUserIds={visiblePasswordUserIds}
        language={language}
        onTogglePatch={handleTogglePatch}
        onDelete={handleDeleteUser}
        onTogglePassword={togglePasswordVisibility}
        onSavePatch={handleSavePatch}
        onCancelPatch={() => setExpandedPatchUserId(null)}
        onOpenAddModal={() => setShowAddModal(true)}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companies={companies}
        userProfile={userProfile}
        language={language}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
