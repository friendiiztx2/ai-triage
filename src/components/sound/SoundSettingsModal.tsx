'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Play, X } from 'lucide-react';
import { playAlertTone, getAudioContext, isSoundEnabled } from '@/lib/audio';
import SoundToneSelector from './SoundToneSelector';
import SoundVolumeSelector from './SoundVolumeSelector';

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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-settings-title"
        className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-955/40 text-brand-600 dark:text-brand-400 shrink-0">
              <Bell size={16} />
            </div>
            <h3 id="sound-settings-title" className="font-bold text-neutral-800 dark:text-neutral-100 text-sm truncate">
              ตั้งค่าเสียงแจ้งเตือนเคสด่วน
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Toggle */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {soundEnabled ? (
                <Volume2 size={18} className="text-brand-600 dark:text-brand-400 shrink-0" />
              ) : (
                <VolumeX size={18} className="text-neutral-400 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 block">เสียงเตือนเคสด่วน</span>
                <span className="text-xs text-neutral-400 block">ดังเมื่อมีเคส Urgent หรือ Critical ใหม่</span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={soundEnabled}
              aria-label="เปิดเสียงเตือนเคสด่วน"
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                soundEnabled ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tone and volume stay editable while sound is off, but look secondary */}
          <div className={`space-y-4 transition-opacity ${soundEnabled ? '' : 'opacity-60'}`}>
            <SoundToneSelector selectedTone={selectedTone} onSelectTone={handleSelectTone} />
            <SoundVolumeSelector volumeLevel={volumeLevel} onSelectVolume={handleSelectVolume} />
          </div>
        </div>

        {/* Footer with Test Sound Button */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleTestSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              isPlayingTest
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {isPlayingTest ? <Volume2 size={14} className="animate-pulse" /> : <Play size={14} />}
            <span>{isPlayingTest ? 'กำลังเล่น...' : 'ทดสอบเสียง'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}
