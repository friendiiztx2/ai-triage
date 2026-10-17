'use client';

import React from 'react';

export interface ImageHoverZoomProps {
  imageUrl: string | null;
  title?: string;
  hint?: string;
}

export default function ImageHoverZoom({
  imageUrl,
  title = 'พรีวิวรูปภาพจากแชต (Hover Zoom)',
  hint = 'เลื่อนเมาส์ออกเพื่อปิด',
}: ImageHoverZoomProps) {
  if (!imageUrl) return null;

  return (
    <div className="pointer-events-none fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950/95 p-3 rounded-2xl shadow-2xl border border-neutral-700/80 backdrop-blur-md max-w-[500px] max-h-[500px] flex flex-col items-center animate-fade-in select-none">
      <div className="w-full flex items-center justify-between pb-2 text-[11px] font-bold text-neutral-300">
        <span className="flex items-center gap-1.5">
          <span>🔍</span>
          <span>{title}</span>
        </span>
        <span className="text-[10px] text-indigo-400 font-mono">{hint}</span>
      </div>
      <img
        src={imageUrl}
        alt="Image hover zoom preview"
        className="max-w-[460px] max-h-[420px] object-contain rounded-xl shadow-lg border border-neutral-800"
      />
    </div>
  );
}
