'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FloatingWindowItem {
  id: string;
  chat: any;
  x: number;
  y: number;
  zIndex: number;
}

export function useFloatingWindows() {
  const [activeWindows, setActiveWindows] = useState<FloatingWindowItem[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(100);

  // Close top-most window on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeWindows.length > 0) {
          e.preventDefault();
          const sortedWindows = [...activeWindows].sort((a, b) => b.zIndex - a.zIndex);
          const topWindow = sortedWindows[0];
          if (topWindow) {
            setActiveWindows((prev) => prev.filter((w) => w.id !== topWindow.id));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindows]);

  const openChatWindow = useCallback(
    (chat: any) => {
      const exists = activeWindows.find((w) => w.id === chat.id);
      if (exists) {
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        setActiveWindows((prev) => prev.map((w) => (w.id === chat.id ? { ...w, zIndex: newZ } : w)));
      } else {
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        const cascadeOffset = (activeWindows.length % 5) * 24;
        const sidebarWidth = 240;
        const defaultWinWidth = 880;
        const defaultWinHeight = 640;

        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
        const availableW = Math.max(400, screenW - sidebarWidth);

        // Center window in main content workspace to the right of the sidebar
        const preferredX = sidebarWidth + Math.max(20, Math.floor((availableW - defaultWinWidth) / 2));
        const preferredY = Math.max(30, Math.floor((screenH - defaultWinHeight) / 2));

        const initialX = Math.max(sidebarWidth + 16, Math.min(Math.max(sidebarWidth + 20, screenW - 350), preferredX + cascadeOffset));
        const initialY = Math.max(20, Math.min(Math.max(50, screenH - 200), preferredY + cascadeOffset));

        const newWin: FloatingWindowItem = {
          id: chat.id,
          chat,
          x: initialX,
          y: initialY,
          zIndex: newZ,
        };
        setActiveWindows((prev) => [...prev, newWin]);
      }
    },
    [activeWindows, maxZIndex]
  );

  const closeWindow = useCallback((windowId: string) => {
    setActiveWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const focusWindow = useCallback(
    (windowId: string) => {
      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);
      setActiveWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, zIndex: newZ } : w)));
    },
    [maxZIndex]
  );

  const updateWindowPosition = useCallback((windowId: string, newX: number, newY: number) => {
    setActiveWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, x: newX, y: newY } : w)));
  }, []);

  const updateWindowTags = useCallback((chatId: string, newTags: string[]) => {
    setActiveWindows((prev) =>
      prev.map((w) => (w.chat?.id === chatId ? { ...w, chat: { ...w.chat, tags: newTags } } : w))
    );
  }, []);

  return {
    activeWindows,
    maxZIndex,
    openChatWindow,
    closeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowTags,
    setActiveWindows,
  };
}
