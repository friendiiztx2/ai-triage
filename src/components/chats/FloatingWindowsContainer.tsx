'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FloatingChatWindow from '@/components/chats/FloatingChatWindow';

interface FloatingWindowsContainerProps {
  activeWindows: any[];
  categories: any[];
  userProfile: any;
  allChats: any[];
  maxZIndex: number;
  onOpenChat: (chat: any) => void;
  onCloseWindow: (windowId: string) => void;
  onFocusWindow: (windowId: string) => void;
  onSaved: () => void;
  onPositionChange: (windowId: string, newX: number, newY: number) => void;
  onUpdateTags: (chatId: string, newTags: string[]) => void;
  language: 'th' | 'en';
}

export default function FloatingWindowsContainer({
  activeWindows,
  categories,
  userProfile,
  allChats,
  onOpenChat,
  onCloseWindow,
  onFocusWindow,
  onSaved,
  onPositionChange,
  onUpdateTags,
  language,
}: FloatingWindowsContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || activeWindows.length === 0) return null;

  return createPortal(
    <>
      {activeWindows.map((win) => (
        <FloatingChatWindow
          key={win.id}
          chat={win.chat}
          initialX={win.x}
          initialY={win.y}
          initialZIndex={win.zIndex}
          categories={categories}
          userProfile={userProfile}
          allChats={allChats}
          onOpenChat={onOpenChat}
          onClose={() => onCloseWindow(win.id)}
          onFocus={() => onFocusWindow(win.id)}
          onSaved={onSaved}
          onPositionChange={(newX: number, newY: number) => onPositionChange(win.id, newX, newY)}
          onUpdateTags={onUpdateTags}
          language={language}
        />
      ))}
    </>,
    document.body
  );
}
