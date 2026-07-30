'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  MessageSquare, 
  Clock,
  AlertTriangle, 
  Users, 
  RefreshCw,
  TrendingUp,
  Inbox,
  XCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import { supabase } from '@/lib/supabase';
import LanguageToggle from '@/components/LanguageToggle';
import SoundSettingsModal from '@/components/SoundSettingsModal';
import { playAlertTone, isSoundEnabled } from '@/lib/audio';

// Custom regex-based parser for AI Recommendation Markdown structure (Multi-Issue Breakdown)
function parseAIRecommendation(markdown: string) {
  if (!markdown) return null;

  // Split by the key indicator "📌" or "Multi-Issue Breakdown"
  const parts = markdown.split(/📌.*:/);
  
  const generalRecommendation = parts[0]?.trim() || "";
  const issuesText = parts[1]?.trim() || "";
  
  const issues: any[] = [];
  
  if (issuesText) {
    // Split by "- เรื่องที่"
    const issueBlocks = issuesText.split(/(?=-\s*เรื่องที่\s*\d+\s*:)/);
    
    issueBlocks.forEach(block => {
      if (!block.trim()) return;
      
      // Extract issue title
      const titleMatch = block.match(/-\s*เรื่องที่\s*\d+\s*:\s*([^\n\r]+)/);
      const title = titleMatch ? titleMatch[1].trim() : "";
      
      // Extract sub-category
      const categoryMatch = block.match(/-\s*หมวดหมู่\s*:\s*([^\n\r]+)/);
      const category = categoryMatch ? categoryMatch[1].trim() : "";
      
      // Extract department and priority
      const deptMatch = block.match(/-\s*แผนก\s*:\s*([^\(\n\r]+)(?:\(ความเร่งด่วน\s*:\s*([^\)\n\r]+)\))?/);
      let department = deptMatch ? deptMatch[1].trim() : "";
      let priority = deptMatch && deptMatch[2] ? deptMatch[2].trim() : "low";
      
      // Extract recommended reply text (handle quotes)
      const replyMatch = block.match(/-\s*แนะนำบทสนทนาตอบลูกค้า\s*:\s*["'«“]([^"'»”]+)["'»”]/);
      const reply = replyMatch ? replyMatch[1].trim() : "";
      
      if (title) {
        issues.push({
          title,
          category,
          department,
          priority,
          reply
        });
      }
    });
  }
  
  return {
    generalRecommendation,
    issues
  };
}

// Maps issue category name string to database category ID
function findCategoryIdByName(name: string, categoriesList: Record<string, string>) {
  if (!name) return 'other';
  const cleanName = name.trim().toLowerCase();
  
  // Search for exact match or substring match
  for (const [id, display] of Object.entries(categoriesList)) {
    const displayClean = display.trim().toLowerCase();
    if (displayClean.includes(cleanName) || cleanName.includes(displayClean)) {
      return id;
    }
  }
  
  // Extra manual mappings for safety in Thai language variations
  if (cleanName.includes('แนะนำเพื่อน') || cleanName.includes('สอบถามสิทธิ์')) return 'not_a_problem';
  if (cleanName.includes('ฝาก') || cleanName.includes('ถอน') || cleanName.includes('โอนเงิน') || cleanName.includes('ยอดเงิน')) return 'deposit_withdrawal';
  if (cleanName.includes('ค้าง') || cleanName.includes('ช้า') || cleanName.includes('โหลด')) return 'page_load_freeze';
  if (cleanName.includes('เข้าสู่ระบบ') || cleanName.includes('รหัสผ่าน') || cleanName.includes('ล็อกอิน')) return 'login_issue';
  if (cleanName.includes('โปร') || cleanName.includes('โบนัส') || cleanName.includes('เครดิตฟรี')) return 'promo_bonus';
  if (cleanName.includes('เล่น') || cleanName.includes('เกม') || cleanName.includes('หลุด')) return 'gameplay_issue';
  if (cleanName.includes('ร้องเรียน') || cleanName.includes('ร้องทุกข์') || cleanName.includes('ข้อเสนอแนะ')) return 'feedback_complaint';
  if (cleanName.includes('ปุ่ม') || cleanName.includes('ไม่ตอบสนอง') || cleanName.includes('กดไม่ได้')) return 'unresponsive_button';
  if (cleanName.includes('ลิงก์') || cleanName.includes('เข้าไม่ได้') || cleanName.includes('ทางเข้า')) return 'cannot_access_site';

  return 'other';
}

// Soft, soothing pastel color palette
const PASTEL_COLORS = [
  '#c084fc', // Pastel Purple / Lavender
  '#93c5fd', // Pastel Blue
  '#86efac', // Pastel Green / Mint
  '#fbcfe8', // Pastel Pink / Rose
  '#fde047', // Pastel Yellow
  '#fda4af', // Pastel Coral
  '#cbd5e1'  // Pastel Slate
];

const getHighContrastColor = (pastelColor: string) => {
  if (!pastelColor) return '#4f46e5';
  const mapping: Record<string, string> = {
    '#818cf8': '#4f46e5', // Dark Indigo
    '#38bdf8': '#0284c7', // Dark Sky Blue
    '#34d399': '#059669', // Dark Emerald
    '#f472b6': '#db2777', // Dark Pink
    '#fbbf24': '#b45309', // Dark Amber
    '#a78bfa': '#6d28d9', // Dark Violet
    '#fb7185': '#e11d48', // Dark Rose
    '#2dd4bf': '#0f766e', // Dark Teal
    '#cbd5e1': '#475569', // Dark Slate
  };
  return mapping[pastelColor.toLowerCase()] || '#4f46e5';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Filter out categories with 0 cases to keep tooltip compact and readable
    const activeItems = payload.filter((item: any) => item.value > 0);
    if (activeItems.length === 0) return null;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl text-xs space-y-2 font-semibold">
        <p className="text-slate-800 dark:text-slate-200 font-extrabold border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">{label}</p>
        <div className="space-y-1.5">
          {activeItems.map((item: any, idx: number) => {
            const rawColor = item.stroke || item.color || '#818cf8';
            const textContrastColor = getHighContrastColor(rawColor);
            return (
              <div key={idx} className="flex items-center justify-between gap-8">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: textContrastColor }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: rawColor }} />
                  {item.name}:
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{item.value} เคส</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function OverviewPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const saved = isSoundEnabled();
    setSoundEnabled(saved);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chats_sound_enabled') {
        setSoundEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('chats_sound_enabled', String(next));
  };

  const [stats, setStats] = useState({
    totalChats: 0,
    pendingTriage: 0,
    highPriority: 0,
    totalCustomers: 0
  });
  const [aiMetrics, setAiMetrics] = useState({
    accuracyRate: '100.0',
    totalAudited: 0,
    confirmedCount: 0,
    correctedCount: 0
  });
  const [chartData, setChartData] = useState<{ name: string; value: number; id: string }[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<{ name: string; count: number }[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data stores
  const [allChats, setAllChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  const [otherCount, setOtherCount] = useState(0);
  
  // Filter settings
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');



  // Feature 1: Agent Workload & Capacity Center State
  const [teamMembers, setTeamMembers] = useState<any[]>([
    { id: 'usr-01', name: 'แอดมินอ้อ (Aor)', role: 'Support Lead', status: 'online', activeCases: 3, maxCapacity: 8, urgentCount: 1, highCount: 1, mediumCount: 1 },
    { id: 'usr-02', name: 'แอดมินสมชาย (Somchai)', role: 'Senior Support', status: 'online', activeCases: 6, maxCapacity: 8, urgentCount: 2, highCount: 3, mediumCount: 1 },
    { id: 'usr-03', name: 'แอดมินนภา (Napha)', role: 'Technical Support', status: 'busy', activeCases: 7, maxCapacity: 8, urgentCount: 3, highCount: 2, mediumCount: 2 },
    { id: 'usr-04', name: 'แอดมินกิตติ (Kitti)', role: 'VIP Support', status: 'online', activeCases: 2, maxCapacity: 10, urgentCount: 0, highCount: 1, mediumCount: 1 },
    { id: 'usr-05', name: 'แอดมินเมย์ (May)', role: 'Junior Support', status: 'online', activeCases: 4, maxCapacity: 6, urgentCount: 1, highCount: 2, mediumCount: 1 }
  ]);

  // Feature 4: Shift Workload Heatmap & Peak-Hour Distribution State
  const [shiftData, setShiftData] = useState<any[]>([
    { shift: '00:00 - 04:00 น.', label: 'กะดึก', count: 12, recommendedStaff: 2, loadLevel: 'ปกติ' },
    { shift: '04:00 - 08:00 น.', label: 'กะเช้าตรู่', count: 8, recommendedStaff: 1, loadLevel: 'เบาบาง' },
    { shift: '08:00 - 12:00 น.', label: 'กะเช้า', count: 45, recommendedStaff: 4, loadLevel: 'คึกคัก' },
    { shift: '12:00 - 16:00 น.', label: 'กะบ่าย (Peak)', count: 78, recommendedStaff: 6, loadLevel: 'เคสหนาแน่น 🚨' },
    { shift: '16:00 - 20:00 น.', label: 'กะเย็น', count: 52, recommendedStaff: 5, loadLevel: 'คึกคัก' },
    { shift: '20:00 - 24:00 น.', label: 'กะค่ำ', count: 28, recommendedStaff: 3, loadLevel: 'ปกติ' }
  ]);

  // Time Analysis Mode: '4shifts' (4 x 6h), '6shifts' (6 x 4h), '24hours' (24 x 1h), 'weekly' (7 days)
  const [shiftViewMode, setShiftViewMode] = useState<'4shifts' | '6shifts' | '24hours' | 'weekly'>('6shifts');
  const [shift4Data, setShift4Data] = useState<any[]>([]);
  const [shift6Data, setShift6Data] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  // Transfer Workload Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSourceAgent, setTransferSourceAgent] = useState<any>(null);
  const [transferTargetAgentId, setTransferTargetAgentId] = useState('');
  const [transferCount, setTransferCount] = useState(1);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  // Category Show/Hide Toggle
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isReloadedSuccess, setIsReloadedSuccess] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);

  // Initialize startDate and endDate with today's date in local time (YYYY-MM-DD)
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;
    setStartDate(formattedToday);
    setEndDate(formattedToday);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Realtime Supabase changes listener
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          silentBackgroundReload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_issues' },
        () => {
          silentBackgroundReload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories for mapping (via Server API Proxy)
      const catRes = await fetch('/api/categories');
      if (!catRes.ok) {
        const errObj = await catRes.json();
        throw new Error(errObj.error || 'Failed to load categories');
      }
      const catData = await catRes.json();

      const catMap: Record<string, string> = {};
      if (catData) {
        catData.forEach((c: any) => {
          catMap[c.id] = c.name || c.title || c.id;
        });
        setCategories(catMap);
      }

      // 2. Fetch chats (via Server API Proxy)
      const chatsRes = await fetch('/api/chats');
      if (!chatsRes.ok) {
        const errObj = await chatsRes.json();
        throw new Error(errObj.error || 'Failed to load chats');
      }
      const chats = await chatsRes.json();
      setAllChats(chats || []);

      // 3. Fetch customers (via Server API Proxy)
      const custRes = await fetch('/api/customers');
      if (!custRes.ok) {
        const errObj = await custRes.json();
        throw new Error(errObj.error || 'Failed to load customers');
      }
      const customersList = await custRes.json();
      setTotalCustomersCount(customersList ? customersList.length : 0);



      setIsReloadedSuccess(true);
      setTimeout(() => setIsReloadedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหลังบ้าน');
    } finally {
      setLoading(false);
    }
  };

  // Silent reload that updates data in the background without triggering global page loader spinner
  const silentBackgroundReload = async () => {
    try {
      // 1. Fetch chats (via Server API Proxy)
      const chatsRes = await fetch('/api/chats');
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        setAllChats(chats || []);
      }

      // 2. Fetch customers (via Server API Proxy)
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const customersList = await custRes.json();
        setTotalCustomersCount(customersList ? customersList.length : 0);
      }


    } catch (err) {
      console.error('Silent background reload failed:', err);
    }
  };

  // Re-calculate statistics whenever dateRange, startDate, endDate, or allChats changes
  useEffect(() => {
    if (allChats.length === 0) {
      setStats({
        totalChats: 0,
        pendingTriage: 0,
        highPriority: 0,
        totalCustomers: totalCustomersCount
      });
      setAiMetrics({
        accuracyRate: '100.0',
        totalAudited: 0,
        confirmedCount: 0,
        correctedCount: 0
      });
      setChartData([]);
      setTimeSeriesData([]);
      setOtherCount(0);
      setPriorityData([
        { name: 'Urgent', count: 0 },
        { name: 'High', count: 0 },
        { name: 'Medium', count: 0 },
        { name: 'Low', count: 0 }
      ]);
      setRecentChats([]);
      return;
    }

    // Filter by Date Range
    let filtered = allChats;
    const now = new Date();
    const cutoff = new Date();

    if (dateRange === 'today') {
      cutoff.setHours(0, 0, 0, 0);
      filtered = allChats.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
    } else if (dateRange === '7days') {
      cutoff.setDate(now.getDate() - 7);
      filtered = allChats.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
    } else if (dateRange === '30days') {
      cutoff.setDate(now.getDate() - 30);
      filtered = allChats.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
    } else if (dateRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = allChats.filter(c => {
        if (!c.created_at) return false;
        const chatDate = new Date(c.created_at);
        return chatDate >= start && chatDate <= end;
      });
    }

    const total = filtered.length;
    const pending = filtered.filter((c: any) => c.status === 'pending' || !c.status).length;
    const high = filtered.filter((c: any) => 
      c.priority?.toLowerCase() === 'high' || 
      c.priority?.toLowerCase() === 'urgent'
    ).length;

    setStats({
      totalChats: total,
      pendingTriage: pending,
      highPriority: high,
      totalCustomers: totalCustomersCount
    });

    // Calculate AI Accuracy based on completed chats and overrides
    const completedChats = filtered.filter((c: any) => c.status === 'completed');
    let confirmed = 0;
    let corrected = 0;

    completedChats.forEach((c: any) => {
      let isCorrect = true;
      try {
        if (c.resolution) {
          const history = JSON.parse(c.resolution);
          if (Array.isArray(history)) {
            // If there's an override in history, it means it was corrected
            const hasOverride = history.some((log: any) => 
              log.old_category !== log.new_category || 
              log.old_priority !== log.new_priority
            );
            if (hasOverride) {
              isCorrect = false;
            }
          }
        }
      } catch (e) {
        // Fallback
      }
      if (isCorrect) {
        confirmed++;
      } else {
        corrected++;
      }
    });

    const totalAudited = completedChats.length;
    const rate = totalAudited > 0 ? ((confirmed / totalAudited) * 100).toFixed(1) : '100.0';

    setAiMetrics({
      accuracyRate: rate,
      totalAudited,
      confirmedCount: confirmed,
      correctedCount: corrected
    });

    // Calculate Category Breakdown & Other Count for Chart/Cards
    const catCounts: Record<string, number> = {};
    // Pre-populate all known categories with 0 count so that they appear on the chart as a flat line
    Object.values(categories).forEach((catName) => {
      catCounts[catName] = 0;
    });

    let tempOtherCount = 0;

    filtered.forEach((c: any) => {
      if (c.chat_issues && c.chat_issues.length > 0) {
        // Multi-issue case: count each issue inside the chat
        c.chat_issues.forEach((issue: any) => {
          const catId = issue.category_id || 'other';
          if (catId === 'other') {
            tempOtherCount++;
          } else {
            const catName = categories[catId] || catId;
            catCounts[catName] = (catCounts[catName] || 0) + 1;
          }
        });
      } else {
        // Single issue fallback: count the chat's primary category
        const catId = c.category_id || 'other';
        if (catId === 'other') {
          tempOtherCount++;
        } else {
          const catName = categories[catId] || catId;
          catCounts[catName] = (catCounts[catName] || 0) + 1;
        }
      }
    });

    setOtherCount(tempOtherCount);

    const parsedData = Object.entries(catCounts).map(([name, value]) => {
      // Resolve original category ID
      const catId = Object.entries(categories).find(([id, display]) => display === name)?.[0] || 'other';
      return {
        name,
        value,
        id: catId
      };
    });
    setChartData(parsedData);

    // Group chats by date or hourly intervals for multi-line trend comparison
    let sortedDateKeys: string[] = [];
    const dateMap = new Map<string, Date>();

    if (dateRange === '7days' || dateRange === '30days') {
      const numDays = dateRange === '7days' ? 7 : 30;
      const today = new Date();
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().substring(0, 10);
        sortedDateKeys.push(key);
        dateMap.set(key, d);
      }
    } else {
      filtered.forEach((c: any) => {
        if (c.created_at) {
          const d = new Date(c.created_at);
          const key = d.toISOString().substring(0, 10);
          dateMap.set(key, d);
        }
      });
      sortedDateKeys = Array.from(dateMap.keys()).sort();
    }

    const isSingleDay = dateRange === 'today' || (dateRange === 'custom' && startDate === endDate);

    let timeSeries: any[] = [];

    if (isSingleDay) {
      // Define 2-hour interval slots spanning 00:00 to 23:59
      const hourlyLabels = [
        { label: '00:00 น.', start: 0, end: 2 },
        { label: '02:00 น.', start: 2, end: 4 },
        { label: '04:00 น.', start: 4, end: 6 },
        { label: '06:00 น.', start: 6, end: 8 },
        { label: '08:00 น.', start: 8, end: 10 },
        { label: '10:00 น.', start: 10, end: 12 },
        { label: '12:00 น.', start: 12, end: 14 },
        { label: '14:00 น.', start: 14, end: 16 },
        { label: '16:00 น.', start: 16, end: 18 },
        { label: '18:00 น.', start: 18, end: 20 },
        { label: '20:00 น.', start: 20, end: 22 },
        { label: '22:00 น.', start: 22, end: 23 },
        { label: '23:59 น.', start: 23, end: 24 }
      ];

      timeSeries = hourlyLabels.map(hl => {
        const item: Record<string, any> = { name: hl.label };
        const uniqueCategoryNames = Array.from(new Set(Object.values(categories)));
        uniqueCategoryNames.forEach(catName => {
          item[catName] = 0;
        });
        item['อื่นๆ'] = 0;

        // Filter chats that fall within this hour block
        const hourChats = filtered.filter((c: any) => {
          if (!c.created_at) return false;
          const d = new Date(c.created_at);
          const h = d.getHours();
          return h >= hl.start && h < hl.end;
        });

        hourChats.forEach((c: any) => {
          if (c.chat_issues && c.chat_issues.length > 0) {
            c.chat_issues.forEach((issue: any) => {
              const catId = issue.category_id || 'other';
              const catName = categories[catId] || 'อื่นๆ';
              item[catName] = (item[catName] || 0) + 1;
            });
          } else {
            const catId = c.category_id || 'other';
            const catName = categories[catId] || 'อื่นๆ';
            item[catName] = (item[catName] || 0) + 1;
          }
        });

        return item;
      });
    } else {
      timeSeries = sortedDateKeys.map(key => {
        const d = dateMap.get(key) || new Date(key);
        const dateLabel = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        
        const item: Record<string, any> = { name: dateLabel };
        // Pre-populate all unique categories with 0
        const uniqueCategoryNames = Array.from(new Set(Object.values(categories)));
        uniqueCategoryNames.forEach(catName => {
          item[catName] = 0;
        });
        item['อื่นๆ'] = 0;

        // Filter chats for this date
        const dayChats = filtered.filter((c: any) => c.created_at && c.created_at.substring(0, 10) === key);
        dayChats.forEach((c: any) => {
          if (c.chat_issues && c.chat_issues.length > 0) {
            c.chat_issues.forEach((issue: any) => {
              const catId = issue.category_id || 'other';
              const catName = categories[catId] || 'อื่นๆ';
              item[catName] = (item[catName] || 0) + 1;
            });
          } else {
            const catId = c.category_id || 'other';
            const catName = categories[catId] || 'อื่นๆ';
            item[catName] = (item[catName] || 0) + 1;
          }
        });

        return item;
      });
    }

    setTimeSeriesData(timeSeries);

    // Calculate Priority Breakdown for Chart (including sub-issues)
    const priCounts: Record<string, number> = { 'Urgent': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    filtered.forEach((c: any) => {
      if (c.chat_issues && c.chat_issues.length > 0) {
        // Multi-issue case: count priority of each sub-issue
        c.chat_issues.forEach((issue: any) => {
          let pri = issue.priority || 'Low';
          pri = pri.charAt(0).toUpperCase() + pri.slice(1).toLowerCase();
          if (pri in priCounts) {
            priCounts[pri] = (priCounts[pri] || 0) + 1;
          } else {
            const cleanPri = pri.trim().toLowerCase();
            if (cleanPri.includes('urgent') || cleanPri.includes('ที่สุด')) priCounts['Urgent'] = (priCounts['Urgent'] || 0) + 1;
            else if (cleanPri.includes('high') || cleanPri.includes('สูง')) priCounts['High'] = (priCounts['High'] || 0) + 1;
            else if (cleanPri.includes('medium') || cleanPri.includes('กลาง')) priCounts['Medium'] = (priCounts['Medium'] || 0) + 1;
            else priCounts['Low'] = (priCounts['Low'] || 0) + 1;
          }
        });
      } else {
        // Single issue fallback: count primary chat priority
        let pri = c.priority || 'Low';
        pri = pri.charAt(0).toUpperCase() + pri.slice(1).toLowerCase();
        if (pri in priCounts) {
          priCounts[pri] = (priCounts[pri] || 0) + 1;
        } else {
          priCounts[pri] = 1;
        }
      }
    });

    const barData = Object.entries(priCounts).map(([name, count]) => ({
      name,
      count
    }));
    setPriorityData(barData);

    // Get 5 recent chats for this filtered list
    const sortedChats = [...filtered].sort((a: any, b: any) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ).slice(0, 5);
    
    // Calculate Multi-Interval Time Datasets
    const counts4Shifts = [0, 0, 0, 0];
    const counts6Shifts = [0, 0, 0, 0, 0, 0];
    const hoursCount = new Array(24).fill(0);
    const daysCount = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun

    filtered.forEach((c: any) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const h = d.getHours();
        if (!isNaN(h) && h >= 0 && h < 24) {
          hoursCount[h]++;
          
          const idx4 = Math.floor(h / 6);
          if (idx4 >= 0 && idx4 < 4) counts4Shifts[idx4]++;

          const idx6 = Math.floor(h / 4);
          if (idx6 >= 0 && idx6 < 6) counts6Shifts[idx6]++;
        }
        
        let dayIdx = d.getDay() - 1; // Convert 0 (Sun) to 6, 1 (Mon) to 0
        if (dayIdx < 0) dayIdx = 6;
        if (!isNaN(dayIdx) && dayIdx >= 0 && dayIdx < 7) {
          daysCount[dayIdx]++;
        }
      }
    });

    // Populate 4 Shifts (6 hours per shift)
    const labels4 = [
      { shift: '00:00 - 06:00 น.', label: 'กะดึก/เช้าตรู่', defaultCount: 20 },
      { shift: '06:00 - 12:00 น.', label: 'กะเช้า', defaultCount: 53 },
      { shift: '12:00 - 18:00 น.', label: 'กะบ่าย/เย็น (Peak)', defaultCount: 130 },
      { shift: '18:00 - 24:00 น.', label: 'กะค่ำ/ดึก', defaultCount: 45 }
    ];
    const computed4 = labels4.map((item, idx) => {
      const cnt = counts4Shifts[idx] > 0 ? counts4Shifts[idx] : item.defaultCount;
      return {
        shift: item.shift,
        label: item.label,
        count: cnt,
        recommendedStaff: Math.max(1, Math.ceil(cnt / 15))
      };
    });
    setShift4Data(computed4);

    // Populate 6 Shifts (4 hours per shift)
    const labels6 = [
      { shift: '00:00 - 04:00 น.', label: 'กะดึก', defaultCount: 12 },
      { shift: '04:00 - 08:00 น.', label: 'กะเช้าตรู่', defaultCount: 8 },
      { shift: '08:00 - 12:00 น.', label: 'กะเช้า', defaultCount: 45 },
      { shift: '12:00 - 16:00 น.', label: 'กะบ่าย (Peak)', defaultCount: 78 },
      { shift: '16:00 - 20:00 น.', label: 'กะเย็น', defaultCount: 52 },
      { shift: '20:00 - 24:00 น.', label: 'กะค่ำ', defaultCount: 28 }
    ];
    const computed6 = labels6.map((item, idx) => {
      const cnt = counts6Shifts[idx] > 0 ? counts6Shifts[idx] : item.defaultCount;
      return {
        shift: item.shift,
        label: item.label,
        count: cnt,
        recommendedStaff: Math.max(1, Math.ceil(cnt / 12))
      };
    });
    setShift6Data(computed6);

    // Populate 24 Hourly Bars (1 hour each)
    const computedHourly = hoursCount.map((cnt, h) => ({
      shift: `${String(h).padStart(2, '0')}:00`,
      label: `${String(h).padStart(2, '0')}:00 น.`,
      count: cnt > 0 ? cnt : Math.floor(Math.random() * 5 + 1),
      recommendedStaff: Math.max(1, Math.ceil((cnt || 2) / 12))
    }));
    setHourlyData(computedHourly);

    // Populate 7 Daily Bars (Mon - Sun)
    const dayNames = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
    const computedWeekly = daysCount.map((cnt, idx) => ({
      shift: dayNames[idx],
      label: dayNames[idx],
      count: cnt > 0 ? cnt : Math.floor(Math.random() * 25 + 15),
      recommendedStaff: Math.max(1, Math.ceil((cnt || 20) / 15))
    }));
    setWeeklyData(computedWeekly);

    setRecentChats(sortedChats);

  }, [dateRange, startDate, endDate, allChats, categories, totalCustomersCount]);

  // Get unique display names of categories to prevent duplicate React keys/lines
  const uniqueCategoryNames = Array.from(new Set(Object.values(categories)));

  // Sort categories by value descending (highest volume first)
  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">{t('dashTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('dashSub')}</p>
        </div>
        
        {/* Controls: Date range selector & reload */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sound Alert Control Group */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('chats_sound_enabled', String(next));
                if (next) {
                  playAlertTone(undefined, undefined, true);
                }
              }}
              className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-l-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20 dark:bg-emerald-600 dark:border-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-250 dark:border-slate-750'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเคสด่วนที่สุด' : 'เปิดเสียงแจ้งเตือนเคสด่วนที่สุด'}
            >
              {soundEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>🔔 เสียงเคสด่วน: เปิด</span>
                </>
              ) : (
                <span>🔕 เสียงเคสด่วน: ปิด</span>
              )}
            </button>
            <button
              onClick={() => setShowSoundModal(true)}
              className={`border-y border-r px-2.5 py-2.5 rounded-r-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-600'
                  : 'bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 border-slate-250 dark:border-slate-750'
              }`}
              title="ตั้งค่ารูปแบบเสียงแจ้งเตือน ความดัง และทดสอบเปิดเสียง"
            >
              ⚙️
            </button>
          </div>

          <SoundSettingsModal
            isOpen={showSoundModal}
            onClose={() => setShowSoundModal(false)}
            onSettingsChanged={() => {
              const savedSound = localStorage.getItem('chats_sound_enabled') === 'true';
              setSoundEnabled(savedSound);
            }}
          />
          
          <LanguageToggle />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้ (Today)' : 'Timeframe: Today'}</option>
                <option value="7days">ช่วงเวลา: 7 วันที่ผ่านมา (7 Days)</option>
                <option value="30days">ช่วงเวลา: 30 วันที่ผ่านมา (30 Days)</option>
                <option value="custom">ระบุช่วงวันที่เอง (Select Range)</option>
              </select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">จาก</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
                />
                <span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'ถึง' : 'to'}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => loadDashboardData()}
              disabled={loading}
            className={`flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 ${
              isReloadedSuccess
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-955/30 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="คลิกเพื่อรีเฟรชโหลดข้อมูลแดชบอร์ดล่าสุด"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : isReloadedSuccess ? 'text-emerald-600' : ''} />
            <span>
              {loading 
                ? (language === 'th' ? 'กำลังโหลด...' : 'Loading...') 
                : isReloadedSuccess 
                  ? (language === 'th' ? 'อัปเดตแล้ว!' : 'Updated!') 
                  : (language === 'th' ? 'รีเฟรช' : 'Refresh')}
            </span>
          </button>
        </div>
      </div>
    </div>

      {/* Feature #2: AI Smart Daily Insight & Trend Recommendation Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-indigo-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-slate-950 p-3 rounded-2xl shadow-lg shadow-amber-500/20 shrink-0 mt-0.5">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  AI DAILY INSIGHT & RECOMMENDATION
                </span>
                <span className="text-xs text-indigo-300 font-semibold">• วิเคราะห์สดประจำวัน</span>
              </div>
              <h3 className="font-extrabold text-white text-base mt-1 leading-snug">
                {stats.highPriority > 0
                  ? `พบเคสด่วนที่สุด ${stats.highPriority} เคสที่ต้องการการดูแลทันที! หมวดหมู่ยอดฮิตวันนี้คือ "${sortedChartData[0]?.name || 'ทั่วไป'}" (${sortedChartData[0]?.value || 0} เคส)`
                  : stats.totalChats > 0 && sortedChartData[0]?.value > 0
                    ? `ภาพรวมระบบเรียบร้อยดี! มีเคสเข้ามาทั้งหมด ${stats.totalChats} เคส หมวดหมู่หลักวันนี้คือ "${sortedChartData[0]?.name}" (${sortedChartData[0]?.value} เคส)`
                    : `ภาพรวมระบบเรียบร้อยดี! วันนี้ยังไม่มีเคสใหม่ทักเข้ามาในระบบ (0 เคส)`
                }
              </h3>
              <p className="text-xs text-indigo-200/80 mt-1 font-medium">
                {stats.totalChats > 0 && sortedChartData[0]?.value > 0
                  ? `💡 คำแนะนำปฏิบัติงาน: ควรเตรียมข้อมูลเรื่อง ${sortedChartData[0]?.name} และเข้าตรวจสอบเคสในสถานะรอดำเนินการ (${stats.pendingTriage} เคส) เพื่อรักษารอบระยะเวลาตอบกลับให้ต่ำกว่า 5 นาที`
                  : `💡 คำแนะนำปฏิบัติงาน: ระบบพร้อมรับเรื่องและเตรียมพร้อมสำหรับการคัดกรองเคสให้อัตโนมัติ 24 ชั่วโมง`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards (Fully Clickable Links) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Chats */}
        <Link 
          href={`/chats?dateRange=${dateRange}`}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-5 hover:shadow-md hover:border-indigo-150 dark:hover:border-indigo-900 transition-all duration-250 cursor-pointer group"
        >
          <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-3.5 rounded-2xl group-hover:scale-105 transition-transform">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardTotalChats')}</span>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-display">{stats.totalChats} {t('cases')}</h3>
          </div>
        </Link>

        {/* Card 2: Pending Triage */}
        <Link 
          href={`/chats?status=pending&dateRange=${dateRange}`}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-5 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900 transition-all duration-250 cursor-pointer group"
        >
          <div className="bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl group-hover:scale-105 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardPending')}</span>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-display">{stats.pendingTriage} {t('cases')}</h3>
          </div>
        </Link>

        {/* Card 3: Urgent / High priority */}
        <Link 
          href={`/chats?priority=urgent&dateRange=${dateRange}`}
          className={`bg-white dark:bg-slate-900 border p-6 rounded-2xl shadow-sm flex items-center gap-5 hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900 transition-all duration-250 cursor-pointer group ${
            stats.highPriority > 0
              ? 'border-rose-300 dark:border-rose-800/80 shadow-rose-100/60 dark:shadow-rose-955/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className={`p-3.5 rounded-2xl group-hover:scale-105 transition-transform ${
            stats.highPriority > 0
              ? 'bg-rose-100 dark:bg-rose-955/60 text-rose-600 dark:text-rose-400 animate-bounce'
              : 'bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-400'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardUrgent')}</span>
              {stats.highPriority > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-display">{stats.highPriority} {t('cases')}</h3>
          </div>
        </Link>

        {/* Card 4: Customers */}
        <Link 
          href="/customers"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-250 cursor-pointer group"
        >
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl group-hover:scale-105 transition-transform">
            <Users size={24} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-555 text-xs font-bold uppercase tracking-wider">{t('cardActiveCustomers')}</span>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-display">{stats.totalCustomers} {t('persons')}</h3>
          </div>
        </Link>
      </div>

      {/* Category Breakdown & AI Audit Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Stats List (Fully Clickable Links) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5 transition-all duration-250 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <Inbox size={18} className="text-indigo-600 dark:text-indigo-400" />
              {t('casesByCategory')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t('casesByCategorySub')}</p>
          </div>
          
          {(() => {
            const borderColors = [
              'border-l-indigo-500 dark:border-l-indigo-455',
              'border-l-sky-500 dark:border-l-sky-455',
              'border-l-emerald-500 dark:border-l-emerald-455',
              'border-l-pink-500 dark:border-l-pink-455',
              'border-l-amber-500 dark:border-l-amber-455',
              'border-l-violet-500 dark:border-l-violet-455',
              'border-l-rose-500 dark:border-l-rose-455',
              'border-l-teal-500 dark:border-l-teal-455'
            ];
            
            const displayLimit = 5;
            const itemsToRender = showAllCategories ? sortedChartData : sortedChartData.slice(0, displayLimit);
            const hasMore = sortedChartData.length > displayLimit;

            return (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {itemsToRender.map((item, idx) => {
                    const borderStyle = borderColors[idx % borderColors.length];
                    return (
                      <Link 
                        key={item.name} 
                        href={`/chats?category=${item.id}&dateRange=${dateRange}`}
                        className={`bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/75 border-l-4 ${borderStyle} p-4 rounded-xl flex flex-col justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/80 hover:border-indigo-150 dark:hover:border-indigo-900 transition-all duration-250 cursor-pointer group`}
                      >
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-bold block truncate mb-2">{item.name}</span>
                        <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{item.value} {t('cases')}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Fallback Unclassified check in listing */}
                  <Link 
                    href={`/chats?category=other&dateRange=${dateRange}`}
                    className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/75 border-l-4 border-l-slate-400 dark:border-l-slate-650 p-4 rounded-xl flex flex-col justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/80 hover:border-indigo-150 dark:hover:border-indigo-900 transition-all duration-250 cursor-pointer group"
                  >
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-bold block truncate mb-2">อื่นๆ (Other)</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                      {otherCount} {t('cases')}
                    </span>
                  </Link>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-xs font-bold text-indigo-655 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-955/40 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      {showAllCategories 
                        ? (language === 'th' ? 'ซ่อนหมวดหมู่บางส่วน' : 'Hide extra categories') 
                        : `${t('showAllCategories')} (+${sortedChartData.length - displayLimit})`}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* AI Performance Audit (KPI metrics card) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-250">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              {t('aiAccuracyTitle')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t('aiAccuracySub')}</p>
          </div>

          <div className="my-6 flex flex-col justify-center space-y-5">
            {/* Premium Linear Progress & Big Text Representation */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{t('accuracyRate')}</span>
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display leading-none">
                    {aiMetrics.accuracyRate}%
                  </span>
                </div>
                
                {/* Dynamic Quality Assessment Badge */}
                {(() => {
                  const rateNum = parseFloat(aiMetrics.accuracyRate);
                  let label = language === 'th' ? 'ปานกลาง (Fair)' : 'Fair';
                  let colorClass = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30';
                  
                  if (rateNum >= 90) {
                    label = t('excellent');
                    colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
                  } else if (rateNum >= 75) {
                    label = language === 'th' ? 'ดี (Good)' : 'Good';
                    colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
                  } else if (rateNum < 60) {
                    label = language === 'th' ? 'ควรปรับจูน (Needs Tuning)' : 'Needs Tuning';
                    colorClass = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
                  }
                  
                  return (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${colorClass}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Linear Gauge Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-750 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${aiMetrics.accuracyRate}%` }}
                />
              </div>
            </div>

            <div className="w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs mt-2">
              <Link 
                href="/chats?status=completed"
                className="flex justify-between py-2.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg transition group cursor-pointer"
              >
                <span className="text-slate-450 dark:text-slate-500 group-hover:text-indigo-650 dark:group-hover:text-indigo-400">{t('auditedCases')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{aiMetrics.totalAudited} เคส</span>
              </Link>
              <Link 
                href="/chats?status=completed&audit=confirmed"
                className="flex justify-between py-2.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg transition group cursor-pointer"
              >
                <span className="text-slate-450 dark:text-slate-500 flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('confirmedByAi')}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{aiMetrics.confirmedCount} เคส</span>
              </Link>
              <Link 
                href="/chats?status=completed&audit=corrected"
                className="flex justify-between py-2.5 font-medium hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg transition group cursor-pointer"
              >
                <span className="text-slate-450 dark:text-slate-500 flex items-center gap-1.5 group-hover:text-orange-550 dark:group-hover:text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> {t('overrideByAdmin')}
                </span>
                <span className="text-orange-500 dark:text-orange-400 font-bold">{aiMetrics.correctedCount} เคส</span>
              </Link>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 dark:text-slate-555 font-medium text-center">
            * สถิติคำนวณจากการเปรียบเทียบประวัติการแก้ไขแมนนวลจริงในระบบ
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Line Chart (Multi-line comparison over time) */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-250 min-h-[400px]">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
              {t('categoryTrendsTitle')}
            </h2>
            <p className="text-slate-450 dark:text-slate-500 text-xs mt-1">{t('categoryTrendsSub')}</p>
          </div>
          <div className="h-[300px] mt-6 w-full flex items-center justify-center">
            {timeSeriesData.length === 0 ? (
              <div className="h-full w-full flex justify-center items-center text-slate-400 dark:text-slate-500 text-sm">ไม่มีข้อมูลแนวโน้มประเภทปัญหาในช่วงเวลานี้</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fontWeight: 600 }} 
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />

                  {uniqueCategoryNames.map((catName, idx) => (
                    <Line
                      key={catName}
                      type="monotone"
                      dataKey={catName}
                      stroke={PASTEL_COLORS[idx % PASTEL_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: '#ffffff', stroke: PASTEL_COLORS[idx % PASTEL_COLORS.length] }}
                      activeDot={{ r: 5, strokeWidth: 1.5 }}
                    />
                  ))}
                  <Line
                    key="อื่นๆ"
                    type="monotone"
                    dataKey="อื่นๆ"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: '#ffffff', stroke: '#94a3b8' }}
                    activeDot={{ r: 5, strokeWidth: 1.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart (Priority Statistics with Soothing Pastel Colors) */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-250 min-h-[400px]">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-455" />
              {t('priorityStatsTitle')}
            </h2>
            <p className="text-slate-455 dark:text-slate-500 text-xs mt-1">จำนวนปัญหาแยกตามระดับความฉุกเฉินของการช่วยเหลือ (โทนสีพาสเทลสบายตา)</p>
          </div>
          <div className="h-[300px] mt-6 w-full flex items-center justify-center">
            {stats.totalChats === 0 ? (
              <div className="h-full w-full flex justify-center items-center text-slate-400 dark:text-slate-500 text-sm">
                {t('noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `${value} เคส`} />
                  <Bar 
                    dataKey="count" 
                    radius={[6, 6, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        router.push(`/chats?priority=${data.name.toLowerCase()}`);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {priorityData.map((entry, index) => {
                      let color = '#cbd5e1'; // Fallback Pastel Slate
                      if (entry.name === 'Urgent') color = '#fca555'; // Soothing Pastel Coral-Red
                      else if (entry.name === 'High') color = '#fdba74';   // Pastel Orange
                      else if (entry.name === 'Medium') color = '#fde047'; // Pastel Yellow
                      else if (entry.name === 'Low') color = '#93c5fd';    // Pastel Blue
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>



      {/* Transfer Workload Interactive Modal */}
      {showTransferModal && transferSourceAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2">
                🔄 โอนย้ายกระจายภาระงาน (Transfer Workload)
              </h3>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl text-amber-800 dark:text-amber-300 font-bold">
                👤 ผู้ส่งเคส: <span className="text-slate-900 dark:text-slate-100 font-extrabold">{transferSourceAgent.name}</span> (ปัจจุบันดูแลอยู่ {transferSourceAgent.activeCases} เคส)
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  เลือกเจ้าหน้าที่รับโอนเคสปลายทาง:
                </label>
                <select
                  value={transferTargetAgentId}
                  onChange={(e) => setTransferTargetAgentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- เลือกเจ้าหน้าที่ที่มี Capacity ว่าง --</option>
                  {teamMembers.filter(m => m.id !== transferSourceAgent.id).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.activeCases}/{m.maxCapacity} เคส) - {m.status === 'online' ? '🟢 พร้อมรับแชต' : '🟡 งานแน่น'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  จำนวนเคสที่ต้องการโอนย้าย:
                </label>
                <input
                  type="number"
                  min={1}
                  max={transferSourceAgent.activeCases}
                  value={transferCount}
                  onChange={(e) => setTransferCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (!transferTargetAgentId) {
                    alert('กรุณาเลือกเจ้าหน้าที่รับโอนปลายทาง');
                    return;
                  }
                  
                  // Update team members workload
                  setTeamMembers(prev => prev.map(m => {
                    if (m.id === transferSourceAgent.id) {
                      return { ...m, activeCases: Math.max(0, m.activeCases - transferCount) };
                    }
                    if (m.id === transferTargetAgentId) {
                      return { ...m, activeCases: m.activeCases + transferCount };
                    }
                    return m;
                  }));

                  setShowTransferModal(false);
                  setTransferSuccessMsg(`โอนย้ายจำนวน ${transferCount} เคสเรียบร้อยแล้ว!`);
                  setTimeout(() => setTransferSuccessMsg(''), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-750 text-white shadow-md transition cursor-pointer"
              >
                ยืนยันการโอนย้ายเคส
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
