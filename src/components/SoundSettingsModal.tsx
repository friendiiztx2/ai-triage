'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Play, X } from 'lucide-react';
import { playAlertTone, getAudioContext, isSoundEnabled } from '@/lib/audio';
import SoundToneSelector from './sound/SoundToneSelector';
import SoundVolumeSelector from './sound/SoundVolumeSelector';

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
    window.dispatchEvent(new Event('storage'));
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleSelectTone = (tone: string) => {
    setSelectedTone(tone);
    localStorage.setItem('chats_sound_tone', tone);
    playAlertTone(tone, volumeLevel, true);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleSelectVolume = (vol: number) => {
    setVolumeLevel(vol);
    localStorage.setItem('chats_sound_volume', String(vol));
    playAlertTone(selectedTone, vol, true);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    getAudioContext();
    playAlertTone(selectedTone, volumeLevel, true);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">ตั้งค่าเสียงแจ้งเตือนเคสด่วน (Sound Alert Settings)</h3>
              <p className="text-neutral-400 text-xs mt-0.5">เลือกโทนเสียง ปรับความดัง และทดสอบฟังเสียงได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 size={22} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX size={22} className="text-neutral-400" />
              )}
              <div>
                <span className="font-bold text-sm text-neutral-800 dark:text-neutral-100 block">เปิดการส่งเสียงเตือนเคสด่วน</span>
                <span className="text-xs text-neutral-400">ส่งเสียงเมื่อมีเคสระดับ URGENT หรือ Critical ใหม่เข้ามา</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-1 ${
                soundEnabled ? 'bg-[#1a73e8]' : 'bg-neutral-300 dark:bg-neutral-700'
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
          <SoundToneSelector selectedTone={selectedTone} onSelectTone={handleSelectTone} />

          {/* Volume Level Selection */}
          <SoundVolumeSelector volumeLevel={volumeLevel} onSelectVolume={handleSelectVolume} />
        </div>

        {/* Footer with Test Sound Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            onClick={handleTestSound}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition shadow-xs cursor-pointer ${
              isPlayingTest
                ? 'bg-emerald-600 text-white border-emerald-600 scale-95'
                : 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1a73e8] dark:text-blue-300 border-[#1a73e8]/30 hover:bg-[#d2e3fc]'
            }`}
          >
            <Play size={14} className={isPlayingTest ? 'animate-spin' : ''} />
            <span>{isPlayingTest ? 'กำลังทดสอบเล่นเสียง...' : '🔊 ทดสอบเล่นเสียงสัญญาณ'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-5 py-2 rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
