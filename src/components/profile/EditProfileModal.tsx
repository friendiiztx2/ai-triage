'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Camera, Lock, Eye, EyeOff, Check, AlertCircle, 
  Loader2, Trash2, Shield, User as UserIcon, Sparkles,
  KeyRound, ChevronDown, Mail
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdated: (updatedUser: any) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && userProfile) {
      setNickname(userProfile.name || '');
      const existingAvatar = userProfile.avatar || userProfile.preferences?.avatar || null;
      setAvatar(existingAvatar);
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, userProfile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Handle client-side image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setErrorMsg('กรุณากรอกชื่อเล่นหรือชื่อที่ต้องการแสดง');
      return;
    }

    if (showPasswordSection) {
      if (!currentPassword.trim()) {
        setErrorMsg('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน');
        return;
      }
      if (!newPassword.trim()) {
        setErrorMsg('กรุณากรอกรหัสผ่านใหม่');
        return;
      }
      if (newPassword.trim().length < 4) {
        setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        userId: userProfile?.id,
        userEmail: userProfile?.email,
        name: trimmedNick,
        avatar: avatar,
      };

      if (showPasswordSection && newPassword.trim()) {
        payload.currentPassword = currentPassword.trim();
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      const updatedUser = data.user;
      if (updatedUser) {
        localStorage.setItem('user_session', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user_session_updated'));
        onProfileUpdated(updatedUser);
      }

      setSuccessMsg('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const initial = (nickname || userProfile?.name || 'A').charAt(0).toUpperCase();
  const roleDisplay = userProfile?.role?.replace('_', ' ') || 'admin';

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-neutral-200/90 dark:border-neutral-800 overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed dark mode gradient so no white streak appears */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-purple-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                จัดการข้อมูลส่วนตัว
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5 font-normal">
                ปรับแต่งรูปโปรไฟล์ ชื่อเล่น และรหัสผ่านความปลอดภัย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
              <Check size={16} className="shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* 1. Avatar Card */}
          <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/70 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-22 h-22 rounded-full overflow-hidden border-3 border-white dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 shadow-md flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold font-sans">
                    {initial}
                  </div>
                )}
              </div>

              {/* Quick Camera Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer border-2 border-white dark:border-neutral-800"
                title="เลือกรูปภาพใหม่"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  รูปถ่ายโปรไฟล์
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-0.5">
                  แนะนำรูปสี่เหลี่ยมจัตุรัส ระบบจะย่อขนาดให้อัตโนมัติ
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:bg-neutral-50 dark:hover:bg-neutral-750 transition cursor-pointer"
                >
                  เลือกรูปใหม่
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>ใช้รูปเริ่มต้น</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
              <span>ชื่อเล่น / ชื่อที่ใช้แสดงในระบบ</span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-400 font-normal">แสดงในเมนูด้านข้าง</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น มิกะ, zoon"
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                required
              />
              <UserIcon size={16} className="absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-400" />
            </div>
          </div>

          {/* 3. Account Meta Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/70 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1">
                <Mail size={12} />
                บัญชีผู้ใช้งาน
              </span>
              <p className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={userProfile?.email}>
                {userProfile?.email || userProfile?.name || 'user'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-1">
                <Shield size={12} />
                ระดับสิทธิ์
              </span>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/70 uppercase">
                  {roleDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Password Accordion */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-700/70 overflow-hidden bg-white dark:bg-neutral-800/40">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <KeyRound size={15} />
                </div>
                <span>เปลี่ยนรหัสผ่านเข้าสู่ระบบ</span>
              </div>
              <div className="p-1 rounded-lg text-neutral-400 dark:text-neutral-400 transition">
                <ChevronDown size={16} className={`transition-transform duration-200 ${showPasswordSection ? 'rotate-180 text-blue-500' : ''}`} />
              </div>
            </button>

            {showPasswordSection && (
              <div className="p-4 pt-1 space-y-3.5 border-t border-neutral-100 dark:border-neutral-700/70 bg-neutral-50/40 dark:bg-neutral-900/40">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    รหัสผ่านเดิม (ถ้ามี)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="ใส่รหัสผ่านเดิมเพื่อความปลอดภัย"
                      className="w-full px-3.5 py-2 pr-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="อย่างน้อย 4 ตัวอักษร"
                        className="w-full px-3.5 py-2 pr-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      ยืนยันรหัสใหม่ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="กรอกรหัสใหม่อีกครั้ง"
                        className="w-full px-3.5 py-2 pr-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
