'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateDashboardMetrics } from '@/lib/dashboardMetrics';

interface UseDashboardDataParams {
  dateRange: string;
  startDate: string;
  endDate: string;
  language: 'th' | 'en';
}

export function useDashboardData({ dateRange, startDate, endDate, language }: UseDashboardDataParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allChats, setAllChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [rawCategories, setRawCategories] = useState<any[]>([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState<number>(0);

  const [stats, setStats] = useState({
    totalChats: 0,
    pendingTriage: 0,
    highPriority: 0,
    highOnlyCount: 0,
    totalCustomers: 0,
  });

  const [aiMetrics, setAiMetrics] = useState({
    accuracyRate: '100.0',
    totalAudited: 0,
    confirmedCount: 0,
    correctedCount: 0,
  });

  const [chartData, setChartData] = useState<Array<{ name: string; value: number; id: string }>>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([
    { name: 'Urgent', count: 0 },
    { name: 'High', count: 0 },
    { name: 'Medium', count: 0 },
    { name: 'Low', count: 0 },
  ]);
  const [otherCount, setOtherCount] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
      const rawCompId = matchCookie
        ? decodeURIComponent(matchCookie[1])
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') || '' : '');
      const compId = rawCompId && rawCompId !== 'undefined' && rawCompId !== 'null' ? rawCompId : '';

      const chatsUrl = compId
        ? `/api/chats?summary_only=true&company_id=${encodeURIComponent(compId)}&nocache=${Date.now()}`
        : `/api/chats?summary_only=true&nocache=${Date.now()}`;
      const custUrl = compId
        ? `/api/customers?company_id=${encodeURIComponent(compId)}&nocache=${Date.now()}`
        : `/api/customers?nocache=${Date.now()}`;

      const [catRes, chatsRes, custRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(chatsUrl),
        fetch(custUrl),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const catMap: Record<string, string> = {};
        if (catData) {
          catData.forEach((c: any) => {
            const name = c.name || c.title || c.id;
            catMap[c.id] = name;
            const base = c.id.includes(':') ? c.id.split(':').pop()! : c.id;
            catMap[base] = name;
          });
          setCategories(catMap);
          setRawCategories(catData || []);
        }
      }

      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        setAllChats(chats || []);
      }

      if (custRes.ok) {
        const customersList = await custRes.json();
        setTotalCustomersCount(customersList ? customersList.length : 0);
      }
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหลังบ้าน');
    } finally {
      setLoading(false);
    }
  }, []);

  const silentBackgroundReload = useCallback(async () => {
    try {
      const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
      const compId = matchCookie
        ? decodeURIComponent(matchCookie[1])
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') || '' : '');
      const chatsRes = await fetch(`/api/chats?company_id=${compId}&nocache=${Date.now()}`);
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        setAllChats(chats || []);
      }
    } catch (err) {
      console.error('Silent reload error:', err);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Realtime Supabase listener
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        silentBackgroundReload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_issues' }, () => {
        silentBackgroundReload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [silentBackgroundReload]);

  // Re-calculate metrics on filter or data changes
  useEffect(() => {
    if (allChats.length === 0) {
      setStats({
        totalChats: 0,
        pendingTriage: 0,
        highPriority: 0,
        highOnlyCount: 0,
        totalCustomers: totalCustomersCount,
      });
      setChartData([]);
      setTimeSeriesData([]);
      setOtherCount(0);
      return;
    }

    // Filter by Date Range
    let filtered = allChats;
    const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

    if (dateRange === 'today') {
      filtered = filtered.filter((c: any) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr === todayLocalStr;
      });
    } else if (dateRange === '7days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      filtered = filtered.filter((c: any) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateRange === '30days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      filtered = filtered.filter((c: any) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateRange === 'custom') {
      if (startDate) {
        filtered = filtered.filter((c: any) => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr >= startDate;
        });
      }
      if (endDate) {
        filtered = filtered.filter((c: any) => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr <= endDate;
        });
      }
    }

    const metrics = calculateDashboardMetrics({
      filteredChats: filtered,
      rawCategories,
      categories,
      totalCustomersCount,
      language,
      dateRange,
      startDate,
      endDate,
    });

    setStats(metrics.stats);
    setAiMetrics(metrics.aiMetrics);
    setChartData(metrics.chartData);
    setTimeSeriesData(metrics.timeSeriesData);
    setPriorityData(metrics.priorityData);
    setOtherCount(metrics.otherCount);
  }, [allChats, dateRange, startDate, endDate, rawCategories, categories, totalCustomersCount, language]);

  return {
    loading,
    error,
    stats,
    aiMetrics,
    chartData,
    timeSeriesData,
    priorityData,
    otherCount,
    rawCategories,
    categories,
    loadDashboardData,
  };
}
