'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import FloatingChatHeader from '@/components/chats/floating/FloatingChatHeader';
import ChatConversationView from '@/components/chats/floating/ChatConversationView';
import ChatIssuesTriagePanel from '@/components/chats/floating/ChatIssuesTriagePanel';
import ChatTagsSection from '@/components/chats/floating/ChatTagsSection';
import ChatHistoryTimeline from '@/components/chats/floating/ChatHistoryTimeline';
import ImageHoverZoom from '@/components/ui/ImageHoverZoom';
import { useWindowDragResize } from '@/hooks/useWindowDragResize';
import { useChatTriage } from '@/hooks/useChatTriage';

interface FloatingChatWindowProps {
  chat: any;
  initialX: number;
  initialY: number;
  initialZIndex: number;
  categories: any[];
  userProfile: any;
  allChats: any[];
  onClose: () => void;
  onFocus: () => void;
  onSaved: () => void;
  onPositionChange: (x: number, y: number) => void;
  onUpdateTags?: (chatId: string, tags: string[]) => void;
  onOpenChat?: (chat: any) => void;
  language?: 'th' | 'en';
}

export default function FloatingChatWindow({
  chat,
  initialX,
  initialY,
  initialZIndex,
  categories,
  userProfile,
  allChats = [],
  onOpenChat,
  onClose,
  onFocus,
  onSaved,
  onPositionChange,
  onUpdateTags,
}: FloatingChatWindowProps) {
  const { language } = useLanguage();

  const currentIndex = allChats && Array.isArray(allChats) ? allChats.findIndex((c) => c.id === chat.id) : -1;
  const totalChatsCount = allChats && Array.isArray(allChats) ? allChats.length : 0;

  const handleNavigatePrev = () => {
    if (currentIndex > 0 && onOpenChat) {
      onOpenChat(allChats[currentIndex - 1]);
      onClose();
    }
  };

  const handleNavigateNext = () => {
    if (currentIndex !== -1 && currentIndex < totalChatsCount - 1 && onOpenChat) {
      onOpenChat(allChats[currentIndex + 1]);
      onClose();
    }
  };

  // Hover Zoom State for Images
  const [hoveredImg, setHoveredImg] = useState<string | null>(null);

  // Custom Tags State
  const [tags, setTags] = useState<string[]>(chat?.tags || []);
  const [copiedId, setCopiedId] = useState<any>(null);

  // Drag and Resize Hook
  const {
    x,
    y,
    width,
    height,
    isMinimized,
    setIsMinimized,
    isMaximized,
    setIsMaximized,
    handleMouseDown,
    handleResizeMouseDown,
  } = useWindowDragResize({
    initialX,
    initialY,
    onFocus,
    onPositionChange,
  });

  // Triage and Feedback Hook
  const {
    customerInfo,
    fullConversation,
    chatIssues,
    loadingIssues,
    retryingTriage,
    triageError,
    triageSuccess,
    editIssues,
    setEditIssues,
    setEditCategory,
    setEditPriority,
    updating,
    loadChatIssues,
    handleTriggerTriage,
    handleSaveChanges,
    handleApproveAI,
  } = useChatTriage({
    chat,
    userProfile,
    onSaved,
    language,
  });

  if (!chat) return null;

  const chatWithConversation = fullConversation ? { ...chat, conversation: fullConversation } : chat;

  const handleTogglePresetTag = (tagName: string) => {
    let nextTags: string[];
    if (tags.includes(tagName)) {
      nextTags = tags.filter((t) => t !== tagName);
    } else {
      nextTags = [...tags, tagName];
    }
    setTags(nextTags);
    if (onUpdateTags) onUpdateTags(chat.id, nextTags);
  };

  const handleRemoveTag = (tagName: string) => {
    const nextTags = tags.filter((t) => t !== tagName);
    setTags(nextTags);
    if (onUpdateTags) onUpdateTags(chat.id, nextTags);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        transform: isMaximized
          ? 'none'
          : `translate3d(${x}px, ${y}px, 0px)`,
        width: isMaximized ? '100vw' : isMinimized ? 340 : width,
        height: isMaximized ? '100vh' : isMinimized ? 52 : height,
        top: isMaximized ? 0 : 0,
        left: isMaximized ? 0 : 0,
        zIndex: initialZIndex,
      }}
      className={`fixed transition-shadow select-none duration-100 flex flex-col ${
        isMaximized
          ? 'rounded-none'
          : 'rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800'
      } bg-white dark:bg-neutral-900 overflow-hidden text-neutral-800 dark:text-neutral-100`}
      onClick={onFocus}
    >
      {/* 1. Header with Window Controls */}
      <FloatingChatHeader
        chat={chatWithConversation}
        customerInfo={customerInfo}
        onMouseDown={handleMouseDown}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isMaximized={isMaximized}
        setIsMaximized={setIsMaximized}
        onClose={onClose}
        currentIndex={currentIndex}
        totalChatsCount={totalChatsCount}
        onNavigatePrev={currentIndex > 0 ? handleNavigatePrev : undefined}
        onNavigateNext={currentIndex !== -1 && currentIndex < totalChatsCount - 1 ? handleNavigateNext : undefined}
      />

      {/* 2. Main Window Body (Hidden if Minimized) */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-200/80 dark:divide-neutral-800">
          {/* Left Column: Full Raw Chat Dialogue & Media Preview */}
          <ChatConversationView
            chat={chatWithConversation}
            chatIssues={chatIssues}
            language={language}
            onHoverImg={setHoveredImg}
          />

          {/* Right Column: AI Triage, Categorization & Resolution Timeline */}
          <div className="w-full md:w-1/2 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Sift AI Triage Panel */}
              <ChatIssuesTriagePanel
                chat={chat}
                chatIssues={chatIssues}
                categories={categories}
                userProfile={userProfile}
                language={language}
                editIssues={editIssues}
                setEditIssues={setEditIssues}
                setEditCategory={setEditCategory}
                setEditPriority={setEditPriority}
                retryingTriage={retryingTriage}
                loadingIssues={loadingIssues}
                triageError={triageError}
                triageSuccess={triageSuccess}
                onTriggerTriage={handleTriggerTriage}
                onReloadIssues={loadChatIssues}
                onApproveAI={handleApproveAI}
                onSaveChanges={handleSaveChanges}
                updating={updating}
                copiedId={copiedId}
                onCopyText={handleCopyText}
              />

              {/* Tags Section */}
              <ChatTagsSection
                tags={tags}
                onRemoveTag={handleRemoveTag}
                onTogglePresetTag={handleTogglePresetTag}
              />

              {/* Audit Timeline */}
              <ChatHistoryTimeline chat={chat} categories={categories} language={language} />
            </div>
          </div>
        </div>
      )}

      {/* Resize Grip (Only in Normal Window Mode) */}
      {!isMaximized && !isMinimized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize z-30 group flex items-end justify-end p-0.5"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-900 dark:group-hover:border-white transition" />
        </div>
      )}

      {/* Floating Image Zoom Portal Preview */}
      <ImageHoverZoom imageUrl={hoveredImg} />
    </div>
  );
}