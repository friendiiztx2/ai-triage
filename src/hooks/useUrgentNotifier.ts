'use client';

import { useState, useEffect } from 'react';
import { playAlertTone } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { UrgentToastData } from '@/components/notifications/UrgentToastCard';

export function useUrgentNotifier() {
  const [toast, setToast] = useState<UrgentToastData | null>(null);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  // Sync popup enabled state with localStorage
  useEffect(() => {
    const checkPopupSetting = () => {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('desktop_popup_enabled');
      const isEnabled = saved !== 'false';
      setPopupEnabled(isEnabled);
      if (!isEnabled) {
        setToast(null);
      }
    };

    checkPopupSetting();
    window.addEventListener('desktop-popup-setting-changed', checkPopupSetting);
    window.addEventListener('storage', checkPopupSetting);
    return () => {
      window.removeEventListener('desktop-popup-setting-changed', checkPopupSetting);
      window.removeEventListener('storage', checkPopupSetting);
    };
  }, []);

  const triggerSound = () => {
    if (typeof window === 'undefined') return;
    const soundOn = localStorage.getItem('chats_sound_enabled') === 'true';
    if (!soundOn) return;
    try {
      playAlertTone();
    } catch (e) {}
  };

  const getNotifiedIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = sessionStorage.getItem('notified_urgent_ids');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const markAsNotified = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const current = getNotifiedIds();
      current.add(id);
      sessionStorage.setItem('notified_urgent_ids', JSON.stringify(Array.from(current)));
    } catch {}
  };

  const getActiveCompanyId = () => {
    if (typeof window === 'undefined') return null;
    const matchCookie = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
    return matchCookie ? decodeURIComponent(matchCookie[1]) : (localStorage.getItem('company_id') || null);
  };

  useEffect(() => {
    const checkSession = () => {
      if (typeof window === 'undefined') return false;
      return !!localStorage.getItem('user_session');
    };

    const pollUrgentChats = async () => {
      if (!checkSession()) return;
      
      const isPopupOn = typeof window !== 'undefined' ? localStorage.getItem('desktop_popup_enabled') !== 'false' : true;
      if (!isPopupOn) return;

      try {
        const compId = getActiveCompanyId();
        const url = compId && compId !== 'all'
          ? `/api/chats?summary_only=true&company_id=${compId}&nocache=${Date.now()}`
          : `/api/chats?summary_only=true&nocache=${Date.now()}`;

        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!res.ok) return;

        const chats = await res.json();
        if (!Array.isArray(chats)) return;

        const notifiedSet = getNotifiedIds();
        const now = Date.now();
        const recentThreshold = now - (2 * 60 * 60 * 1000);

        const urgentChats = chats.filter((c) => {
          const pri = (c.priority || '').toLowerCase();
          const urg = (c.urgency || '').toLowerCase();
          const isUrgent = pri === 'urgent' || pri === 'critical' || urg === 'urgent';
          if (!isUrgent) return false;

          const resStatus = (c.resolution || '').toLowerCase();
          if (resStatus === 'solved' || resStatus === 'closed') return false;
          const status = (c.status || '').toLowerCase();
          if (status === 'resolved' || status === 'closed') return false;

          const createdTime = new Date(c.created_at || 0).getTime();
          if (createdTime > 0 && createdTime < recentThreshold) return false;

          return true;
        });

        if (urgentChats.length === 0) return;

        const newUrgent = urgentChats.filter((c) => !notifiedSet.has(c.id));
        if (newUrgent.length > 0) {
          const sorted = [...newUrgent].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          const newest = sorted[0];

          markAsNotified(newest.id);

          setToast({
            id: newest.id,
            customerName: newest.customer_name || `ลูกค้า #${newest.customer_id || newest.id}`,
            summary: newest.summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
            priority: newest.priority || 'urgent',
            companyId: newest.company_id,
          });
          setTimeLeft(60);
          setIsPaused(false);
          triggerSound();
        }
      } catch (err) {
        console.error('Polling urgent chats failed:', err);
      }
    };

    pollUrgentChats();
    const intervalId = setInterval(pollUrgentChats, 8000);

    const channel = supabase
      .channel('global-urgent-notifier-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, (payload: any) => {
        if (payload?.eventType === 'INSERT' || payload?.eventType === 'UPDATE') {
          const row = payload.new;
          if (row) {
            const pri = (row.priority || '').toLowerCase();
            const urg = (row.urgency || '').toLowerCase();
            const isUrgent = pri === 'urgent' || pri === 'critical' || urg === 'urgent';
            const resStatus = (row.resolution || '').toLowerCase();
            const status = (row.status || '').toLowerCase();
            const isResolved = resStatus === 'solved' || resStatus === 'closed' || status === 'resolved' || status === 'closed';
            const compId = getActiveCompanyId();
            const matchesComp = !compId || compId === 'all' || row.company_id === compId;

            if (isUrgent && !isResolved && matchesComp) {
              const notifiedSet = getNotifiedIds();
              if (!notifiedSet.has(row.id)) {
                markAsNotified(row.id);
                setToast({
                  id: row.id,
                  customerName: row.customer_name || `ลูกค้า #${row.customer_id || row.id}`,
                  summary: row.summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
                  priority: row.priority || 'urgent',
                  companyId: row.company_id,
                });
                setTimeLeft(60);
                setIsPaused(false);
                triggerSound();
                return;
              }
            }
          }
        }
        pollUrgentChats();
      })
      .subscribe();

    const handleUrgentEvent = (e: any) => {
      if (e?.detail) {
        const { id, customerName, summary, priority, companyId } = e.detail;
        const compId = getActiveCompanyId();
        if (!compId || compId === 'all' || companyId === compId) {
          const notifiedSet = getNotifiedIds();
          if (!notifiedSet.has(id)) {
            markAsNotified(id);
            setToast({
              id,
              customerName: customerName || `ลูกค้า #${id}`,
              summary: summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
              priority: priority || 'urgent',
              companyId,
            });
            triggerSound();
          }
        }
      }
    };
    window.addEventListener('urgent-chat-detected', handleUrgentEvent);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
      window.removeEventListener('urgent-chat-detected', handleUrgentEvent);
    };
  }, []);

  const handleDismiss = () => {
    if (toast) {
      markAsNotified(toast.id);
    }
    setToast(null);
  };

  useEffect(() => {
    if (toast) {
      setTimeLeft(60);
      setIsPaused(false);
    }
  }, [toast?.id]);

  useEffect(() => {
    if (!toast || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [toast?.id, isPaused]);

  useEffect(() => {
    if (!toast) return;
    if (timeLeft === 0) {
      handleDismiss();
    }
  }, [timeLeft, toast]);

  const handleViewChat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toast) return;

    const targetChatId = toast.id;
    const targetCompId = toast.companyId;

    markAsNotified(targetChatId);
    setToast(null);

    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/chats') {
        window.dispatchEvent(new CustomEvent('open-chat-modal', {
          detail: { chatId: targetChatId, companyId: targetCompId },
        }));
      } else {
        window.location.href = `/chats?open_chat=${targetChatId}${targetCompId ? `&company_id=${targetCompId}` : ''}`;
      }
    }
  };

  return {
    toast,
    popupEnabled,
    timeLeft,
    isPaused,
    setIsPaused,
    handleDismiss,
    handleViewChat,
  };
}
