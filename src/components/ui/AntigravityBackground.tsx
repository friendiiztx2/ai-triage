'use client';

import React, { useEffect, useRef } from 'react';

interface LaserBeam {
  x: number;
  yRatio: number; // percentage of height
  length: number;
  speed: number;
  width: number;
  colorStart: string;
  colorEnd: string;
  glowColor: string;
}

interface LightPulse {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export default function AntigravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    // Prismatic Laser Beams matching Sift AI Glass Refraction Palette
    const beams: LaserBeam[] = [
      {
        x: -300,
        yRatio: 0.38, // near the prism logo
        length: 360,
        speed: 3.4,
        width: 1.5,
        colorStart: 'rgba(56, 189, 248, 0)',
        colorEnd: 'rgba(56, 189, 248, 0.95)',
        glowColor: 'rgba(56, 189, 248, 0.45)',
      },
      {
        x: -550,
        yRatio: 0.52, // behind the login card
        length: 320,
        speed: 2.8,
        width: 1.5,
        colorStart: 'rgba(244, 114, 182, 0)',
        colorEnd: 'rgba(236, 72, 153, 0.95)',
        glowColor: 'rgba(244, 114, 182, 0.45)',
      },
      {
        x: -750,
        yRatio: 0.65, // below the login card
        length: 380,
        speed: 3.6,
        width: 1.5,
        colorStart: 'rgba(168, 85, 247, 0)',
        colorEnd: 'rgba(147, 51, 234, 0.95)',
        glowColor: 'rgba(168, 85, 247, 0.4)',
      },
      {
        x: -400,
        yRatio: 0.22, // upper screen
        length: 290,
        speed: 2.5,
        width: 1.5,
        colorStart: 'rgba(96, 165, 250, 0)',
        colorEnd: 'rgba(59, 130, 246, 0.9)',
        glowColor: 'rgba(96, 165, 250, 0.35)',
      },
      {
        x: -650,
        yRatio: 0.78, // lower screen
        length: 310,
        speed: 3.1,
        width: 1.5,
        colorStart: 'rgba(251, 191, 36, 0)',
        colorEnd: 'rgba(245, 158, 11, 0.9)',
        glowColor: 'rgba(251, 191, 36, 0.35)',
      },
    ];

    const pulses: LightPulse[] = [];

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      targetMouseX = width / 2;
      targetMouseY = height / 2;
      if (currentMouseX === 0) currentMouseX = targetMouseX;
      if (currentMouseY === 0) currentMouseY = targetMouseY;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let lastPulseTime = 0;
    const pulseColors = ['#38bdf8', '#f472b6', '#a855f7', '#60a5fa', '#fbbf24'];

    const render = (timestamp: number) => {
      // Smooth mouse interpolation for ambient soft lighting
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      // 1. Soft Interactive Cursor Ambient Glow (Clean, No Grid Lines)
      const cursorRadius = Math.min(width, height) * 0.28;
      const cursorGrad = ctx.createRadialGradient(
        currentMouseX,
        currentMouseY,
        0,
        currentMouseX,
        currentMouseY,
        cursorRadius
      );
      const cursorAlpha = isDark ? 0.07 : 0.045;
      cursorGrad.addColorStop(0, `rgba(56, 189, 248, ${cursorAlpha})`);
      cursorGrad.addColorStop(0.5, `rgba(168, 85, 247, ${cursorAlpha * 0.5})`);
      cursorGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = cursorGrad;
      ctx.beginPath();
      ctx.arc(currentMouseX, currentMouseY, cursorRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Periodic Soft Light Pulses (Smooth expanding rings at beam tracks)
      if (timestamp - lastPulseTime > 1400 && pulses.length < 4) {
        lastPulseTime = timestamp;
        const randomX = width * (0.15 + Math.random() * 0.7);
        const randomY = height * (0.2 + Math.random() * 0.6);
        pulses.push({
          x: randomX,
          y: randomY,
          life: 0,
          maxLife: 70,
          color: pulseColors[Math.floor(Math.random() * pulseColors.length)],
          radius: 12 + Math.random() * 10,
        });
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.life++;
        const progress = p.life / p.maxLife;
        const pulseAlpha = Math.sin(progress * Math.PI) * (isDark ? 0.45 : 0.3);
        const currentR = 2 + progress * p.radius;

        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = pulseAlpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.globalAlpha = pulseAlpha * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          pulses.splice(i, 1);
        }
      }

      // 3. Horizontal Prismatic Laser Beams Gliding Across Clean Space
      for (let i = 0; i < beams.length; i++) {
        const beam = beams[i];
        beam.x += beam.speed;

        const currentY = beam.yRatio * height;

        // When beam exits right edge, wrap back to the left with random stagger
        if (beam.x - beam.length > width) {
          beam.x = -beam.length - Math.random() * 450;
          // Slightly vary height between 18% and 82%
          beam.yRatio = 0.18 + Math.random() * 0.64;
        }

        // Draw soft radiant ambient glow under laser beam
        const glowGrad = ctx.createLinearGradient(beam.x - beam.length, currentY, beam.x, currentY);
        glowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        glowGrad.addColorStop(0.65, beam.glowColor);
        glowGrad.addColorStop(1, beam.colorEnd);

        ctx.save();
        ctx.strokeStyle = glowGrad;
        ctx.lineWidth = beam.width * 3.5;
        ctx.globalAlpha = isDark ? 0.6 : 0.4;
        ctx.beginPath();
        ctx.moveTo(beam.x - beam.length, currentY);
        ctx.lineTo(beam.x, currentY);
        ctx.stroke();

        // Draw crisp core laser beam
        const coreGrad = ctx.createLinearGradient(beam.x - beam.length, currentY, beam.x, currentY);
        coreGrad.addColorStop(0, beam.colorStart);
        coreGrad.addColorStop(0.8, beam.colorEnd);
        coreGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = coreGrad;
        ctx.lineWidth = beam.width;
        ctx.globalAlpha = isDark ? 0.95 : 0.85;
        ctx.beginPath();
        ctx.moveTo(beam.x - beam.length, currentY);
        ctx.lineTo(beam.x, currentY);
        ctx.stroke();

        // Glowing white leading head photon
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(beam.x, currentY, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
      style={{ opacity: 0.98 }}
    />
  );
}
