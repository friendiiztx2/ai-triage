'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { isSoundEnabled } from '@/lib/audio';
import { getCategoryLabel } from '@/lib/categories';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePersistentFilter } from '@/hooks/usePersistentFilter';

import DashboardFilterHeader from '@/components/dashboard/DashboardFilterHeader';
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid';
import DashboardCategoryBreakdown from '@/components/dashboard/DashboardCategoryBreakdown';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export default function DashboardPage() {
  const { language } = useLanguage();
  const didAutoFallbackRef = useRef(false);

  // Filters & Controls — date filters are remembered per browser (see usePersistentFilter)
  const {
    value: dateRange,
    setValue: setDateRange,
    setTemporary: setDateRangeTemp,
    hasSavedRef: dateRangeSavedRef,
  } = usePersistentFilter('dashboard.date', 'today');
  const { value: startDate, setValue: setStartDate } = usePersistentFilter('dashboard.startDate', '');
  const { value: endDate, setValue: setEndDate } = usePersistentFilter('dashboard.endDate', '');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
  }, []);

  const {
    loading,
    allChats,
    stats,
    aiMetrics,
    chartData,
    timeSeriesData,
    priorityData,
    otherCount,
    rawCategories,
    categories,
    loadDashboardData,
  } = useDashboardData({ dateRange, startDate, endDate, language });

  useEffect(() => {
    // Auto-switch to 30 days only on a first visit (the user never chose a range)
    if (didAutoFallbackRef.current || dateRangeSavedRef.current || loading || !allChats || allChats.length === 0) return;
    didAutoFallbackRef.current = true;
    const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const hasToday = allChats.some((c: any) => {
      if (!c.created_at) return false;
      return new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' }) === todayLocalStr;
    });
    if (!hasToday && dateRange === 'today') {
      setDateRangeTemp('30days');
    }
  }, [loading, allChats, dateRange]);

  const uniqueCategoryNames =
    rawCategories.length > 0
      ? Array.from(new Set(rawCategories.map((c: any) => getCategoryLabel(c, language))))
      : Array.from(new Set(Object.values(categories)));

  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* 1. Top Header & Controls */}
      <DashboardFilterHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          localStorage.setItem('chats_sound_enabled', String(next));
        }}
        showSoundModal={showSoundModal}
        onOpenSoundModal={() => setShowSoundModal(true)}
        onCloseSoundModal={() => setShowSoundModal(false)}
        onReload={loadDashboardData}
        loading={loading}
        language={language}
      />

      {/* 2. KPI Cards Grid */}
      <DashboardKpiGrid
        stats={stats}
        aiMetrics={aiMetrics}
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        language={language}
      />

      {/* 4. Category Breakdown & AI Audit */}
      <DashboardCategoryBreakdown
        sortedChartData={sortedChartData}
        otherCount={otherCount}
        aiMetrics={aiMetrics}
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        language={language}
      />

      {/* 5. Charts Section */}
      <DashboardCharts
        timeSeriesData={timeSeriesData}
        priorityData={priorityData}
        uniqueCategoryNames={uniqueCategoryNames}
        totalChats={stats.totalChats}
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        language={language}
      />
    </div>
  );
}
