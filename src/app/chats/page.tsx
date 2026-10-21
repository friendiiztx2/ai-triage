'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import SoundSettingsModal from '@/components/SoundSettingsModal';
import { isSoundEnabled } from '@/lib/audio';
import { filterChats, chatHasImage, isImageWithTextChat, isImageOnlyChat } from '@/lib/chatFilters';
import { exportChatsToCSV } from '@/lib/chatExport';
import { DEFAULT_SYSTEM_TAGS } from '@/lib/tags';
import { useFloatingWindows } from '@/hooks/useFloatingWindows';
import { useChatsData } from '@/hooks/useChatsData';

import ChatHeader from '@/components/chats/ChatHeader';
import FloatingWindowsContainer from '@/components/chats/FloatingWindowsContainer';
import TagRenameModal from '@/components/chats/TagRenameModal';
import TagManagerModal from '@/components/chats/TagManagerModal';
import ImageHoverZoom from '@/components/ui/ImageHoverZoom';
import ChatQuickTabs from '@/components/chats/ChatQuickTabs';
import ChatFilterBar from '@/components/chats/ChatFilterBar';
import ChatTable from '@/components/chats/ChatTable';

function ChatsPageContent() {
  const autoOpenedRef = useRef<string | null>(null);
  const { language } = useLanguage();
  const searchParams = useSearchParams();

  // Sound & Desktop Notification
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [desktopNotifyEnabled, setDesktopNotifyEnabled] = useState(false);

  // Hover Zoom
  const [tableHoveredImg, setTableHoveredImg] = useState<string | null>(null);

  // System Tags
  const [allAvailableTags, setAllAvailableTags] = useState(DEFAULT_SYSTEM_TAGS);
  const [showTagManagerModal, setShowTagManagerModal] = useState(false);
  const [showTagRenameModal, setShowTagRenameModal] = useState(false);
  const [tagToRename] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [auditFilter, setAuditFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync filters from URL query parameters (Deep-linking from Dashboard / Reports)
  useEffect(() => {
    if (!searchParams) return;
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const timeframeParam = searchParams.get('timeframe') || searchParams.get('date');
    const qParam = searchParams.get('q') || searchParams.get('search');
    const catParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');
    const openParam = searchParams.get('open') || searchParams.get('chat_id');

    if (statusParam) setStatusFilter(statusParam);
    if (priorityParam) setPriorityFilter(priorityParam);
    if (timeframeParam) setDateFilter(timeframeParam);
    if (qParam) setSearchQuery(qParam);
    if (catParam) setCategoryFilter(catParam);
    if (tagParam) setTagFilter(tagParam);

    if (openParam) {
      if (!timeframeParam) setDateFilter('all');
      if (!qParam) setSearchQuery(openParam);
    }
  }, [searchParams]);

  // Init local notification preferences
  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
    if (typeof window !== 'undefined') {
      const savedPopup = localStorage.getItem('desktop_popup_enabled');
      if (savedPopup !== null) {
        setDesktopNotifyEnabled(savedPopup === 'true');
      } else {
        const hasPermission = 'Notification' in window && Notification.permission === 'granted';
        setDesktopNotifyEnabled(hasPermission);
      }
    }
  }, []);

  // Custom Hooks
  const {
    chats,
    setChats,
    categories,
    loading,
    userProfile,
    activeCompanyId,
    fetchInitialData,
  } = useChatsData({ soundEnabled, desktopNotifyEnabled });

  const {
    activeWindows,
    maxZIndex,
    openChatWindow,
    closeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowTags,
    setActiveWindows,
  } = useFloatingWindows();

  // Auto-open floating chat window when 'open' or 'chat_id' is present in URL
  useEffect(() => {
    if (!searchParams) return;
    const openId = searchParams.get('open') || searchParams.get('chat_id');
    if (!openId) return;
    if (autoOpenedRef.current === openId) return;

    const found = chats.find(
      (c) =>
        c.id === openId ||
        c.id?.toLowerCase() === openId.toLowerCase() ||
        c.id?.toLowerCase().includes(openId.toLowerCase())
    );

    if (found) {
      openChatWindow(found);
      autoOpenedRef.current = openId;
      return;
    }

    if (!loading) {
      fetch(`/api/chats?id=${encodeURIComponent(openId)}&summary_only=true`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const directChat = data[0];
            setChats((prev) => (prev.some((c) => c.id === directChat.id) ? prev : [directChat, ...prev]));
            openChatWindow(directChat);
            autoOpenedRef.current = openId;
          }
        })
        .catch((e) => console.warn('Could not auto-open deep-linked chat:', e));
    }
  }, [searchParams, chats, loading, openChatWindow, setChats]);

  // 1. Filter by Active Company first
  const companyFilteredChats = useMemo(() => {
    return chats.filter(
      (c) => !activeCompanyId || activeCompanyId === 'all' || c.company_id === activeCompanyId
    );
  }, [chats, activeCompanyId]);

  // 2. Filter by Active Timeframe (for badge counts & filter dropdowns)
  const timeframeFilteredChats = useMemo(() => {
    return filterChats(companyFilteredChats, {
      dateFilter,
      startDate,
      endDate,
    });
  }, [companyFilteredChats, dateFilter, startDate, endDate]);

  // 3. Fully Filtered Chats (applied to the main table)
  const filteredChats = useMemo(() => {
    return filterChats(companyFilteredChats, {
      searchQuery,
      statusFilter,
      priorityFilter,
      categoryFilter,
      tagFilter,
      dateFilter,
      startDate,
      endDate,
      auditFilter,
    });
  }, [companyFilteredChats, searchQuery, statusFilter, priorityFilter, categoryFilter, tagFilter, dateFilter, startDate, endDate, auditFilter]);

  // Badge & Dropdown Counts (calculated from the currently selected timeframe)
  const totalCount = timeframeFilteredChats.length;
  const pendingCount = timeframeFilteredChats.filter((c) => (c.status || 'pending') === 'pending').length;
  const completedCount = timeframeFilteredChats.filter((c) => c.status === 'completed').length;
  const urgentCount = timeframeFilteredChats.filter((c) => {
    const pri = c.priority?.toLowerCase() || 'low';
    const urg = (c.urgency || '').toLowerCase();
    let issueMatch = false;
    if (c.chat_issues && c.chat_issues.length > 0) {
      issueMatch = c.chat_issues.some((issue: any) => issue.priority?.toLowerCase() === 'urgent');
    }
    return pri === 'urgent' || pri === 'critical' || urg === 'urgent' || issueMatch;
  }).length;
  const highCount = timeframeFilteredChats.filter((c) => {
    const pri = c.priority?.toLowerCase() || 'low';
    let issueMatch = false;
    if (c.chat_issues && c.chat_issues.length > 0) {
      issueMatch = c.chat_issues.some((issue: any) => issue.priority?.toLowerCase() === 'high');
    }
    return pri === 'high' || issueMatch;
  }).length;
  const mediumCount = timeframeFilteredChats.filter((c) => {
    const pri = c.priority?.toLowerCase() || 'low';
    let issueMatch = false;
    if (c.chat_issues && c.chat_issues.length > 0) {
      issueMatch = c.chat_issues.some((issue: any) => issue.priority?.toLowerCase() === 'medium');
    }
    return pri === 'medium' || issueMatch;
  }).length;
  const lowCount = timeframeFilteredChats.filter((c) => {
    const pri = c.priority?.toLowerCase() || 'low';
    let issueMatch = false;
    if (c.chat_issues && c.chat_issues.length > 0) {
      issueMatch = c.chat_issues.some((issue: any) => issue.priority?.toLowerCase() === 'low');
    }
    return pri === 'low' || issueMatch;
  }).length;
  const imageCount = timeframeFilteredChats.filter(chatHasImage).length;
  const imageWithTextCount = timeframeFilteredChats.filter(isImageWithTextChat).length;
  const imageOnlyCount = timeframeFilteredChats.filter(isImageOnlyChat).length;

  // Update Tags
  const handleUpdateTags = async (chatId: string, newTags: string[]) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, tags: newTags } : c)));
    updateWindowTags(chatId, newTags);

    try {
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, tags: newTags }),
      });
    } catch (e) {
      console.warn('Failed to update tags:', e);
    }
  };

  // Tag manager renames
  const handleSaveRenameSystemTag = (index: number, newTagName: string) => {
    let formattedNew = newTagName.trim();
    if (!formattedNew.startsWith('#')) formattedNew = '#' + formattedNew;

    const oldTagObj = allAvailableTags[index];
    const oldTagName = oldTagObj.name;

    const updated = [...allAvailableTags];
    updated[index] = { ...oldTagObj, name: formattedNew };
    setAllAvailableTags(updated);

    setChats((prev) =>
      prev.map((chat) => {
        if (!chat.tags || !chat.tags.includes(oldTagName)) return chat;
        return { ...chat, tags: chat.tags.map((t: string) => (t === oldTagName ? formattedNew : t)) };
      })
    );
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setTagFilter('all');
    setDateFilter('today');
    setAuditFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <ChatHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          localStorage.setItem('chats_sound_enabled', String(next));
        }}
        desktopNotifyEnabled={desktopNotifyEnabled}
        onToggleDesktopNotify={() => {
          const next = !desktopNotifyEnabled;
          setDesktopNotifyEnabled(next);
          localStorage.setItem('desktop_popup_enabled', String(next));
          window.dispatchEvent(new Event('desktop-popup-setting-changed'));
        }}
        onOpenTagManager={() => setShowTagManagerModal(true)}
        onExportCSV={() => exportChatsToCSV(filteredChats, dateFilter)}
        language={language}
      />

      {/* 1. Unified Triage Control Panel (Quick Tabs + Search & Filters) */}
      <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 shadow-xs backdrop-blur-md overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60">
        <ChatQuickTabs
          totalCount={totalCount}
          urgentCount={urgentCount}
          imageCount={imageCount}
          imageWithTextCount={imageWithTextCount}
          imageOnlyCount={imageOnlyCount}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          tagFilter={tagFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onSelectTab={(tab) => {
            if (tab === 'all') {
              setStatusFilter('all');
              setPriorityFilter('all');
              setTagFilter('all');
            } else if (tab === 'urgent') {
              if (priorityFilter === 'urgent') {
                setPriorityFilter('all');
              } else {
                setPriorityFilter('urgent');
                setStatusFilter('all');
                setTagFilter('all');
              }
            } else if (tab === 'has-image' || tab === 'image') {
              if (
                tagFilter === '#รูปภาพ' ||
                tagFilter === '#รูปภาพทั้งหมด' ||
                tagFilter === 'has-image' ||
                tagFilter === 'image'
              ) {
                setTagFilter('all');
              } else {
                setTagFilter('#รูปภาพทั้งหมด');
                setStatusFilter('all');
                setPriorityFilter('all');
              }
            } else if (tab === 'image-with-text') {
              if (
                tagFilter === '#รูปภาพแนบ' ||
                tagFilter === '#รูปภาพพร้อมข้อความ' ||
                tagFilter === 'image-with-text'
              ) {
                setTagFilter('all');
              } else {
                setTagFilter('#รูปภาพแนบ');
                setStatusFilter('all');
                setPriorityFilter('all');
              }
            } else if (tab === 'image-only') {
              if (tagFilter === '#รูปภาพล้วน' || tagFilter === 'image-only') {
                setTagFilter('all');
              } else {
                setTagFilter('#รูปภาพล้วน');
                setStatusFilter('all');
                setPriorityFilter('all');
              }
            }
          }}
          language={language}
          className="bg-transparent border-0 rounded-none shadow-none"
        />

        <ChatFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          tagFilter={tagFilter}
          onTagChange={setTagFilter}
          auditFilter={auditFilter}
          onAuditChange={setAuditFilter}
          dateFilter={dateFilter}
          categories={categories}
          allAvailableTags={allAvailableTags}
          pendingCount={pendingCount}
          completedCount={completedCount}
          urgentCount={urgentCount}
          highCount={highCount}
          mediumCount={mediumCount}
          lowCount={lowCount}
          filteredCount={filteredChats.length}
          totalCount={totalCount}
          onClearFilters={handleClearFilters}
          language={language}
          className="bg-transparent border-0 rounded-none shadow-none"
        />
      </div>

      {/* 3. Chat Table */}
      <ChatTable
        chats={filteredChats}
        loading={loading}
        categories={categories}
        activeWindows={activeWindows}
        onSelectChat={openChatWindow}
        onHoverImg={setTableHoveredImg}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        language={language}
      />

      {/* 5. Floating Windows */}
      <FloatingWindowsContainer
        activeWindows={activeWindows}
        categories={categories}
        userProfile={userProfile}
        allChats={filteredChats}
        maxZIndex={maxZIndex}
        onOpenChat={openChatWindow}
        onCloseWindow={closeWindow}
        onFocusWindow={focusWindow}
        onSaved={fetchInitialData}
        onPositionChange={updateWindowPosition}
        onUpdateTags={handleUpdateTags}
        language={language}
      />

      {/* 6. Tag Management Modals */}
      <TagRenameModal
        isOpen={showTagRenameModal}
        onClose={() => setShowTagRenameModal(false)}
        tagToRename={tagToRename}
        onConfirmRename={() => {}}
      />

      <TagManagerModal
        isOpen={showTagManagerModal}
        onClose={() => setShowTagManagerModal(false)}
        allAvailableTags={allAvailableTags}
        onSaveRenameTag={handleSaveRenameSystemTag}
      />

      <SoundSettingsModal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
      />

      <ImageHoverZoom imageUrl={tableHoveredImg} />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={null}>
      <ChatsPageContent />
    </Suspense>
  );
}
