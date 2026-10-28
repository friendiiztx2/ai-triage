'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { saveAuditLog } from '@/lib/audit';
import AntigravityBackground from '@/components/ui/AntigravityBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any stale client-side session storage when landing on /login
  // (Middleware already redirects valid authenticated users with a valid HttpOnly auth_token to '/')
  useEffect(() => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;';
    document.cookie = 'company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;';
    localStorage.removeItem('user_session');
    localStorage.removeItem('company_id');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const resData = await res.json();

      if (res.ok && resData.user) {
        const dbUser = resData.user;
        let compName = dbUser.company_name || (dbUser.role === 'system_admin' ? 'ทุกบริษัท (All Companies)' : 'บริษัทของฉัน');
        if (dbUser.company_id) {
          try {
            const compRes = await fetch('/api/companies');
            if (compRes.ok) {
              const comps = await compRes.json();
              const found = Array.isArray(comps) && comps.find((c: any) => c.id === dbUser.company_id);
              if (found) compName = found.name;
            }
          } catch (e) {}
        }

        completeLogin({
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          companyId: dbUser.company_id,
          companyName: compName,
          permissions: dbUser.permissions,
        });
        return;
      }

      setError(resData.error || 'ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
    } catch (err: any) {
      setError(`เกิดข้อผิดพลาดในการเชื่อมต่อระบบ: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (account: any) => {
    sessionStorage.removeItem('session_logout');
    const sessionObj = {
      id: account.id || account.user_id,
      email: account.email,
      name: account.name,
      role: account.role,
      company_id: account.companyId || account.company_id,
      company_name: account.companyName || account.company_name,
      permissions: account.permissions || (
        account.role === 'system_admin'
          ? ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'manage_companies', 'export_csv']
          : ['view_dashboard', 'view_chats', 'manage_categories', 'manage_users', 'export_csv']
      ),
    };

    document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionObj))}; path=/; max-age=31536000`;
    document.cookie = `company_id=${sessionObj.company_id}; path=/; max-age=31536000`;
    localStorage.setItem('user_session', JSON.stringify(sessionObj));
    localStorage.setItem('company_id', sessionObj.company_id);

    window.location.href = '/';
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-[#07090e] p-4 relative overflow-hidden select-none">
      {/* Google Antigravity Style Orbital Vortex Particle Canvas */}
      <AntigravityBackground />

      {/* Main Centered Container */}
      <div className="w-full max-w-[310px] sm:max-w-[325px] relative z-10 flex flex-col items-center">
        {/* Floating 3D Logo above Card */}
        <div className="mb-4 flex flex-col items-center justify-center">
          <img
            src="/sift-ai-logo.png"
            alt="Sift AI Logo"
            className="w-36 sm:w-44 h-auto object-contain drop-shadow-2xl select-none transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Clean Glassmorphic Card */}
        <div className="w-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800/80 rounded-[28px] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6)] p-5 sm:p-6 transition-all">
          {error && (
            <div className="bg-rose-50/90 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 text-xs font-medium p-3.5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 mb-5 leading-normal flex items-start gap-2 animate-in fade-in duration-300">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                <input
                  type="text"
                  placeholder="ชื่อผู้ใช้ หรือ อีเมล"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/70 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:focus:ring-sky-400/20 focus:border-sky-400 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                  autoComplete="username"
                  aria-label="ชื่อผู้ใช้ หรือ อีเมล"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/70 rounded-2xl pl-10 pr-11 py-3 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:focus:ring-sky-400/20 focus:border-sky-400 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                  autoComplete="current-password"
                  aria-label="รหัสผ่าน"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1 cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Concept 3: Frosted Glass with Subtle Iridescent Border */}
            <div className="flex justify-center pt-2">
              <div className="rounded-full p-[1px] bg-gradient-to-r from-sky-400/50 via-indigo-400/40 to-pink-400/50 hover:from-sky-500 hover:via-indigo-500 hover:to-pink-500 transition-all duration-300 shadow-xs hover:shadow-md hover:shadow-indigo-500/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-auto min-w-[155px] bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-md text-neutral-800 hover:text-black dark:text-neutral-100 dark:hover:text-white rounded-full px-6 py-2.5 sm:py-3 text-sm sm:text-[15px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98] group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-700 dark:border-white/30 dark:border-t-white rounded-full animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </div>
                  ) : (
                    <>
                      <span className="tracking-wide text-sm sm:text-[15px]">เข้าสู่ระบบ</span>
                      <ArrowRight size={17} className="text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
