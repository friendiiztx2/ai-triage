'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { playAlertTone } from '@/lib/audio';

interface UseChatsDataOptions {
  soundEnabled: boolean;
  desktopNotifyEnabled: boolean;
}

function normalizeCompanyId(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed === 'all' || trimmed === 'null' || trimmed === 'undefined') {
    return '';
  }
  return trimmed;
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
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlCompId = urlParams ? urlParams.get('company_id') : null;
      const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
      const rawCompId =
        urlCompId && urlCompId !== 'all'
          ? urlCompId
          : matchCookie
          ? decodeURIComponent(matchCookie[1])
          : typeof localStorage !== 'undefined'
          ? localStorage.getItem('company_id') || ''
          : '';
      const compId = normalizeCompanyId(rawCompId);
      setActiveCompanyId(compId);

      if (urlCompId && typeof document !== 'undefined') {
        const cleanUrlComp = normalizeCompanyId(urlCompId) || 'all';
        document.cookie = `company_id=${cleanUrlComp}; path=/; max-age=31536000`;
        localStorage.setItem('company_id', cleanUrlComp);
      }

      const compQuery = compId ? `?company_id=${encodeURIComponent(compId)}` : '';
      const [catRes, chatsRes] = await Promise.all([
        fetch(`/api/categories${compQuery}`, { cache: 'no-store' }),
        fetch(`/api/chats${compQuery}`, { cache: 'no-store' }),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        if (Array.isArray(chatsData)) {
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

          setChats((prev) => {
            const missing = prev.filter((p) => !sorted.some((c: any) => c.id === p.id));
            return missing.length > 0 ? [...missing, ...sorted] : sorted;
          });
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

  // Realtime Supabase changes listener (debounced to avoid multiple rapid queries)
  useEffect(() => {
    let debounceTimer: any = null;
    const triggerDebouncedFetch = () => {
      // Don't refetch if tab is hidden
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchInitialData();
      }, 2500);
    };

    const channel = supabase
      .channel('realtime-chats-chats-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        triggerDebouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_issues' }, () => {
        triggerDebouncedFetch();
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
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
