'use client';

import { useState } from 'react';

interface UseWindowDragResizeOptions {
  initialX: number;
  initialY: number;
  initialWidth?: number;
  initialHeight?: number;
  onFocus: () => void;
  onPositionChange: (x: number, y: number) => void;
}

export function useWindowDragResize({
  initialX,
  initialY,
  initialWidth = 880,
  initialHeight = 640,
  onFocus,
  onPositionChange,
}: UseWindowDragResizeOptions) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    const target = e.target as HTMLElement;
    if (isMaximized || target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const currentX = x;
    const currentY = y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newX = Math.max(10, currentX + dx);
      const newY = Math.max(10, currentY + dy);
      setX(newX);
      setY(newY);
      onPositionChange(newX, newY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startWidth = width;
    const startHeight = height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleResizeMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(500, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(400, startHeight + (moveEvent.clientY - startY));
      setWidth(newWidth);
      setHeight(newHeight);
    };

    const handleResizeMouseUp = () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };

    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  };

  return {
    x,
    y,
    width,
    height,
    isMinimized,
    setIsMinimized,
    isMaximized,
    setIsMaximized,
    handleMouseDown,
    handleResizeMouseDown,
  };
}
