'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, X, ArrowRight, MessageSquare, Volume2, Play } from 'lucide-react';
import { playAlertTone, getAudioContext } from '@/lib/audio';

interface UrgentToast {
  id: string;
  customerName: string;
  summary: string;
  priority: string;
}

export default function GlobalNotifier() {
  const [toast, setToast] = useState<UrgentToast | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const triggerSound = () => {
    playAlertTone();
  };

  useEffect(() => {
    // Only check if user is logged in
    const checkSession = () => {
      if (typeof window === 'undefined') return false;
      const session = localStorage.getItem('user_session');
      return !!session;
    };

    const pollUrgentChats = async () => {
      if (!checkSession()) return;

      try {
        const res = await fetch('/api/chats?summary_only=true');
        if (!res.ok) return;

        const chats = await res.json();
        if (!Array.isArray(chats)) return;

        // Find urgent chats
        const urgentChats = chats.filter(c => {
          const pri = (c.priority || '').toLowerCase();
          return pri === 'urgent' || pri === 'critical';
        });

        if (urgentChats.length === 0) return;

        // Initialize notified IDs on first run to prevent spamming old chats
        if (notifiedIdsRef.current.size === 0) {
          urgentChats.forEach(c => notifiedIdsRef.current.add(c.id));
          return;
        }

        // Find any urgent chats that haven't been notified yet
        const newUrgentChats = urgentChats.filter(c => !notifiedIdsRef.current.has(c.id));
        
        if (newUrgentChats.length > 0) {
          // Sort by created_at descending to show the newest in toast
          const sortedNewUrgent = [...newUrgentChats].sort((a, b) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeB - timeA;
          });
          const newest = sortedNewUrgent[0];
          
          // Mark all as notified
          newUrgentChats.forEach(c => notifiedIdsRef.current.add(c.id));
          
          setToast({
            id: newest.id,
            customerName: newest.customer_name || 'ลูกค้าทั่วไป',
            summary: newest.summary || 'คัดกรองปัญหาสนทนาด้วย AI',
            priority: newest.priority
          });
          
          triggerSound();
        }
      } catch (err) {
        console.error('Polling urgent chats failed:', err);
      }
    };

    // Run query immediately, then repeat every 30 seconds
    pollUrgentChats();
    const intervalId = setInterval(pollUrgentChats, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-4 animate-slideIn select-none">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce">
          <AlertTriangle size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              🔴 เคสเร่งด่วนที่สุด! (URGENT)
            </span>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>
          
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5 truncate">
            คุณ {toast.customerName}
          </h4>
          
          <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
            {toast.summary}
          </p>

          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                getAudioContext();
                playAlertTone(undefined, undefined, true);
              }}
              className="flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-955/40 hover:bg-indigo-100 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm"
              title="กดทดสอบเสียงสัญญาณเตือน"
            >
              <Volume2 size={11} />
              <span>ฟังเสียงเตือน</span>
            </button>

            <button
              onClick={() => setToast(null)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg text-[10px] font-bold transition text-center"
            >
              รับทราบ
            </button>
            
            <Link
              href="/chats"
              onClick={() => setToast(null)}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
            >
              ดูแชตนี้ <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
