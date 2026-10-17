'use client';

import React from 'react';
import { useUrgentNotifier } from '@/hooks/useUrgentNotifier';
import UrgentToastCard from '@/components/notifications/UrgentToastCard';

export default function GlobalNotifier() {
  const {
    toast,
    popupEnabled,
    timeLeft,
    isPaused,
    setIsPaused,
    handleDismiss,
    handleViewChat,
  } = useUrgentNotifier();

  if (!toast || !popupEnabled) return null;

  return (
    <UrgentToastCard
      toast={toast}
      timeLeft={timeLeft}
      isPaused={isPaused}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onDismiss={handleDismiss}
      onViewChat={handleViewChat}
    />
  );
}
