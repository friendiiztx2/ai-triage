'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveAuditLog } from '@/lib/audit';

const QUICK_ACCOUNTS = [
  {
    email: 'friendiiztx2@gmail.com',
    name: 'System Admin (แอดมินกลางดูแลทุกบริษัท)',
    role: 'system_admin',
    roleLabel: 'System Admin',
    companyId: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2', // Default tenant
    companyName: 'ดูแลระบบทั้งหมด (All Companies)',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-955/20 dark:border-indigo-900/30 dark:text-indigo-400',
    password: 'Aa234234*'
  },
  {
    email: 'aor',
    name: 'aor (Super Admin ของ Alpha Support)',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    companyId: '2e65829a-6a60-4022-8289-0fe64ec98fae', // Alpha Support Co., Ltd.
    companyName: 'Alpha Support Co., Ltd.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-955/20 dark:border-emerald-900/30 dark:text-emerald-400',
    password: 'Aor278444'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any old sessions on login page load
  useEffect(() => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    localStorage.removeItem('user_session');
    localStorage.removeItem('company_id');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Attempt login via database query (matches either name or login ID/email)
      const inputVal = email.trim();
      const { data: dbUser, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${inputVal.toLowerCase()},name.eq.${inputVal}`)
        .eq('password', password.trim())
        .maybeSingle();

      if (dbErr) {
        console.warn("Database login failed, attempting fallback:", dbErr.message);
        throw dbErr;
      }

      if (dbUser) {
        let compName = 'Mika Co. (บริษัทเริ่มต้น)';
        if (dbUser.company_id === '2e65829a-6a60-4022-8289-0fe64ec98fae') {
          compName = 'Alpha Support Co., Ltd.';
        }
        
        completeLogin({
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          companyId: dbUser.company_id,
          companyName: compName,
          permissions: dbUser.permissions
        });
        return;
      }

      // 2. Fallback to mock account list if email + password matches mock defaults
      const mockMatch = QUICK_ACCOUNTS.find(
        acc => acc.email.toLowerCase() === email.toLowerCase().trim() && password.trim() === acc.password
      );

      if (mockMatch) {
        completeLogin(mockMatch);
      } else {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      // Check fallback even on connection or query error (e.g. table not updated yet)
      const mockMatch = QUICK_ACCOUNTS.find(
        acc => acc.email.toLowerCase() === email.toLowerCase().trim() && password.trim() === acc.password
      );

      if (mockMatch) {
        completeLogin(mockMatch);
      } else {
        setError(
          `เกิดข้อผิดพลาด: ${err.message || err}. ` +
          `(หากต้องการล็อกอินผ่านฐานข้อมูลจริง โปรดนำคำสั่งในไฟล์ supabase_setup.sql ไปกดรันใน SQL Editor บนเว็บ Supabase หรือยังครับ)`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (account: any) => {
    const sessionObj = {
      email: account.email,
      name: account.name,
      role: account.role,
      company_id: account.companyId || account.company_id,
      company_name: account.companyName || account.company_name,
      permissions: account.permissions || (
        account.role === 'system_admin'
          ? ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv']
          : ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'export_csv']
      )
    };

    // Save user session in Cookie and LocalStorage
    document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionObj))}; path=/; max-age=31536000`;
    document.cookie = `company_id=${sessionObj.company_id}; path=/; max-age=31536000`;
    localStorage.setItem('user_session', JSON.stringify(sessionObj));
    localStorage.setItem('company_id', sessionObj.company_id);

    // Save audit log asynchronously
    saveAuditLog('LOGIN', `เข้าสู่ระบบสำเร็จ (สิทธิ์: ${account.role || 'unknown'})`);

    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-955 p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none mb-3">
            <BrainCircuit size={28} />
          </div>
          <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl leading-none">AI Triage</h1>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase mt-1">Back Office Dashboard</span>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 text-xs font-semibold p-3.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 mb-5 leading-normal">
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">ชื่อบัญชี หรือ อีเมล (Login ID / Email)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-455 dark:text-slate-500" size={16} />
              <input
                type="text"
                placeholder="ป้อนชื่อบัญชี หรือ อีเมล เช่น superadmin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-855/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-455 dark:text-slate-500" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-855/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:shadow-none transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* Quick Login Accounts Panel */}
        <div className="mt-7 border-t border-slate-100 dark:border-slate-800 pt-6">
          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center select-none">
            <UserCheck size={12} /> หรือเลือกบัญชีเพื่อทดสอบระบบ (Quick Login)
          </span>
          
          <div className="space-y-2">
            {QUICK_ACCOUNTS.map((acc, index) => (
              <button
                key={index}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                  completeLogin(acc);
                }}
                className={`w-full flex items-center justify-between border p-3 rounded-2xl text-left transition cursor-pointer hover:scale-[1.01] ${acc.color}`}
              >
                <div>
                  <div className="text-xs font-bold leading-tight">{acc.name}</div>
                  <div className="text-[10px] opacity-75 font-semibold mt-0.5">{acc.companyName}</div>
                </div>
                <span className="text-[9px] font-bold tracking-wider uppercase border border-current px-2.5 py-0.5 rounded-full select-none shrink-0 ml-3">
                  {acc.roleLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
