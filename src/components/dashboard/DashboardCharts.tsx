import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface DashboardChartsProps {
  timeSeriesData: any[];
  priorityData: any[];
  uniqueCategoryNames: string[];
  totalChats: number;
  language?: 'th' | 'en';
}

const LINE_COLORS = [
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444', // Red 500
  High: '#f97316',   // Orange 500
  Medium: '#eab308', // Amber 500
  Low: '#64748b',    // Slate 500
};

function CustomLineTooltip({ active, payload, label, language = 'th' }: any) {
  if (!active || !payload || payload.length === 0) return null;

  // Filter to categories that actually have values > 0, sorted descending
  const activeItems = payload
    .filter((item: any) => typeof item.value === 'number' && item.value > 0)
    .sort((a: any, b: any) => b.value - a.value);

  const totalForTime = activeItems.reduce((acc: number, it: any) => acc + (Number(it.value) || 0), 0);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3 shadow-xl max-w-xs select-none">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-100 dark:border-neutral-800 gap-4">
        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
          {label}
        </span>
        <span className="text-[10px] font-semibold font-mono text-[#1a73e8] dark:text-blue-300">
          {totalForTime} {language === 'th' ? 'เคส' : 'cases'}
        </span>
      </div>

      {activeItems.length === 0 ? (
        <p className="text-[11px] text-neutral-400 italic py-1">
          {language === 'th' ? 'ไม่มีเคสในเวลานี้' : 'No cases recorded'}
        </p>
      ) : (
        <div className="space-y-1">
          {activeItems.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || item.stroke }}
                />
                <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[170px] text-[11px]">
                  {item.name}
                </span>
              </div>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-[11px] tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardCharts({
  timeSeriesData,
  priorityData,
  uniqueCategoryNames,
  totalChats,
  language = 'th',
}: DashboardChartsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* 1. Line Chart: Category Trends Over Time */}
      <div className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {language === 'th' ? 'แนวโน้มประเภทปัญหาตามช่วงเวลา' : 'Category Trends Over Time'}
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Timeline
          </span>
        </div>

        <div className="h-[280px] mt-4 w-full flex items-center justify-center">
          {timeSeriesData.length === 0 ? (
            <div className="text-neutral-400 text-xs font-mono">
              {language === 'th' ? 'ไม่มีข้อมูลแนวโน้มในช่วงเวลานี้' : 'No trend telemetry in this window'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373', fontFamily: 'monospace' }} stroke="transparent" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#737373', fontFamily: 'monospace' }} stroke="transparent" />
                <Tooltip
                  content={<CustomLineTooltip language={language} />}
                  reverseDirection={{ x: false, y: true }}
                  allowEscapeViewBox={{ x: false, y: true }}
                  isAnimationActive={false}
                  animationDuration={0}
                  wrapperStyle={{ zIndex: 50, pointerEvents: 'none', transition: 'none' }}
                  offset={10}
                />

                {uniqueCategoryNames.map((catName, idx) => (
                  <Line
                    key={catName}
                    type="monotone"
                    dataKey={catName}
                    connectNulls={true}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2.5, strokeWidth: 1.5, fill: '#ffffff', stroke: LINE_COLORS[idx % LINE_COLORS.length] }}
                    activeDot={{ r: 4.5, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Bar Chart: Priority Breakdown */}
      <div className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {language === 'th' ? 'สถิติระดับความเร่งด่วน (SLA Priority)' : 'Priority Distribution'}
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            SLA Matrix
          </span>
        </div>

        <div className="h-[280px] mt-4 w-full flex items-center justify-center">
          {totalChats === 0 ? (
            <div className="text-neutral-400 text-xs font-mono">
              {language === 'th' ? 'ไม่มีข้อมูลเคส' : 'No priority data in this window'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373', fontFamily: 'monospace' }} stroke="transparent" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#737373', fontFamily: 'monospace' }} stroke="transparent" />
                <Tooltip
                  formatter={(value) => [`${value} เคส`, 'Volume']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    color: '#1f2937',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#1f2937' }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.name) {
                      router.push(`/chats?priority=${data.name.toLowerCase()}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {priorityData.map((entry, index) => {
                    const color = PRIORITY_COLORS[entry.name] || '#737373';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
