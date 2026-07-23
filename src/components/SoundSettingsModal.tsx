'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Music, Play, Check, X, ShieldAlert, Radio, Megaphone } from 'lucide-react';
import { playAlertTone, getAudioContext, isSoundEnabled } from '@/lib/audio';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void;
}

export default function SoundSettingsModal({ isOpen, onClose, onSettingsChanged }: SoundSettingsModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedTone, setSelectedTone] = useState('siren');
  const [volumeLevel, setVolumeLevel] = useState(1.0);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = isSoundEnabled();
      const tone = localStorage.getItem('chats_sound_tone') || 'siren';
      const vol = parseFloat(localStorage.getItem('chats_sound_volume') || '1.0');

      setSoundEnabled(enabled);
      setSelectedTone(tone);
      setVolumeLevel(vol);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('chats_sound_enabled', String(enabled));
    // Trigger storage event so other components sync state
    window.dispatchEvent(new Event('storage'));
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleSelectTone = (tone: string) => {
    setSelectedTone(tone);
    localStorage.setItem('chats_sound_tone', tone);
    // Play quick test sample of selected tone
    playAlertTone(tone, volumeLevel, true);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleSelectVolume = (vol: number) => {
    setVolumeLevel(vol);
    localStorage.setItem('chats_sound_volume', String(vol));
    // Play quick test sample of volume
    playAlertTone(selectedTone, vol, true);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    // Unlock AudioContext and force play sound sample
    getAudioContext();
    playAlertTone(selectedTone, volumeLevel, true);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const toneOptions = [
    {
      id: 'siren',
      title: '🚨 ไซเรนเตือนฉุกเฉิน (Digital Siren)',
      desc: 'เสียงสังเคราะห์ความถี่สูงสลับจังหวะ ชัดเจนสะดุดตาที่สุด',
      icon: ShieldAlert
    },
    {
      id: 'dual_chime',
      title: '🎵 เสียงสองโทน (Dual Chime)',
      desc: 'เสียงชิเมะสองโทนกังวานใส นุ่มนวลฟังสบาย',
      icon: Music
    },
    {
      id: 'radar_pulse',
      title: '📡 เรดาร์เตือนถี่ (Radar Pulse)',
      desc: 'เสียงบี๊บเรดาร์สัญญาณ 4 จังหวะเตือนสั้นถี่',
      icon: Radio
    },
    {
      id: 'emergency_horn',
      title: '📢 แตรฉุกเฉิน (Emergency Horn)',
      desc: 'เสียงแตรเตือนภัยความถี่ต่ำก้องกังวานในห้องทำงาน',
      icon: Megaphone
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-855/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">ตั้งค่าเสียงแจ้งเตือนเคสด่วน (Sound Alert Settings)</h3>
              <p className="text-slate-400 text-xs mt-0.5">เลือกโทนเสียง ปรับความดัง และทดสอบฟังเสียงได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 size={22} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX size={22} className="text-slate-400" />
              )}
              <div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">เปิดการส่งเสียงเตือนเคสด่วน</span>
                <span className="text-xs text-slate-400">ส่งเสียงเมื่อมีเคสระดับ URGENT หรือ Critical ใหม่เข้ามา</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-1 ${
                soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Tone Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              🎵 เลือกรูปแบบโทนเสียง (Select Sound Tone)
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {toneOptions.map((tone) => {
                const Icon = tone.icon;
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => handleSelectTone(tone.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-955/30 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{tone.title}</span>
                        {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 font-extrabold" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{tone.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Level Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              🔊 ปรับระดับความดังเสียง (Volume Level)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'เบา (50%)', val: 0.5 },
                { label: 'ปานกลาง (75%)', val: 0.75 },
                { label: 'ดังชัด (100%)', val: 1.0 },
                { label: 'ดังที่สุด (150%)', val: 1.5 }
              ].map((vol) => {
                const isActive = volumeLevel === vol.val;
                return (
                  <button
                    key={vol.val}
                    onClick={() => handleSelectVolume(vol.val)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {vol.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Test Sound Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-855/50">
          <button
            onClick={handleTestSound}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-sm cursor-pointer ${
              isPlayingTest
                ? 'bg-emerald-600 text-white border-emerald-600 scale-95'
                : 'bg-indigo-50 dark:bg-indigo-955/40 text-indigo-650 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100'
            }`}
          >
            <Play size={14} className={isPlayingTest ? 'animate-spin' : ''} />
            <span>{isPlayingTest ? 'กำลังทดสอบเล่นเสียง...' : '🔊 กดทดสอบเล่นเสียงสัญญาณ (Test Sound)'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            เสร็จสิ้น (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
