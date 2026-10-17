'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { isSoundEnabled } from '@/lib/audio';
import { getCategoryLabel } from '@/lib/categories';
import { useDashboardData } from '@/hooks/useDashboardData';

import DashboardFilterHeader from '@/components/dashboard/DashboardFilterHeader';
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid';
import DashboardCategoryBreakdown from '@/components/dashboard/DashboardCategoryBreakdown';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export default function DashboardPage() {
  const { language } = useLanguage();

  // Filters & Controls
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
  }, []);

  const {
    loading,
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
        language={language}
      />

      {/* 4. Category Breakdown & AI Audit */}
      <DashboardCategoryBreakdown
        sortedChartData={sortedChartData}
        otherCount={otherCount}
        aiMetrics={aiMetrics}
        dateRange={dateRange}
        language={language}
      />

      {/* 5. Charts Section */}
      <DashboardCharts
        timeSeriesData={timeSeriesData}
        priorityData={priorityData}
        uniqueCategoryNames={uniqueCategoryNames}
        totalChats={stats.totalChats}
        language={language}
      />
    </div>
  );
}
