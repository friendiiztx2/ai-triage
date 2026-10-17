'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { playAlertTone } from '@/lib/audio';

interface UseChatsDataOptions {
  soundEnabled: boolean;
  desktopNotifyEnabled: boolean;
}

export function useChatsData({ soundEnabled, desktopNotifyEnabled }: UseChatsDataOptions) {
  const [chats, setChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const previousChatsRef = useRef<Map<string, string>>(new Map());

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
      const compId = matchCookie
        ? decodeURIComponent(matchCookie[1])
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') || '' : '');
      setActiveCompanyId(compId);

      const [catRes, chatsRes] = await Promise.all([
        fetch(`/api/categories?company_id=${compId}`),
        fetch(`/api/chats?summary_only=true&company_id=${compId}&nocache=${Date.now()}`),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        if (chatsData) {
          const processed = chatsData.map((c: any) => ({
            ...c,
            status: c.status || 'pending',
          }));
          const sorted = [...processed].sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );

          // Check new urgent cases for sound/toast
          let hasNewUrgent = false;
          let latestUrgentChat: any = null;
          const isFirstRun = previousChatsRef.current.size === 0;

          sorted.forEach((c: any) => {
            const pri = (c.priority || 'low').toLowerCase();
            const prevPri = previousChatsRef.current.get(c.id);
            if (!prevPri && (pri === 'urgent' || pri === 'high')) {
              hasNewUrgent = true;
              latestUrgentChat = c;
            } else if (prevPri && prevPri !== pri && (pri === 'urgent' || pri === 'high')) {
              hasNewUrgent = true;
              latestUrgentChat = c;
            }
            previousChatsRef.current.set(c.id, pri);
          });

          if (!isFirstRun && hasNewUrgent) {
            if (soundEnabled) playAlertTone(undefined, undefined, false);
            if (desktopNotifyEnabled && latestUrgentChat) {
              try {
                new Notification('🚨 เคสด่วนที่สุดยิงเข้ามาใหม่!', {
                  body: `ลูกค้า ${latestUrgentChat.customer_name || latestUrgentChat.id}: ${
                    latestUrgentChat.summary || 'ต้องการการช่วยเหลือด่วน'
                  }`,
                  icon: '/favicon.ico',
                });
              } catch (e) {}
            }
          }

          setChats(sorted);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, desktopNotifyEnabled]);

  // Init session
  useEffect(() => {
    fetchInitialData();

    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserProfile(JSON.parse(savedSession));
      } catch (e) {}
    }
  }, [fetchInitialData]);

  // Realtime Supabase changes listener
  useEffect(() => {
    const channel = supabase
      .channel('realtime-chats-chats-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_issues' }, () => {
        fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialData]);

  return {
    chats,
    setChats,
    categories,
    loading,
    userProfile,
    activeCompanyId,
    fetchInitialData,
  };
}
