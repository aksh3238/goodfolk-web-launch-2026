import React, { useEffect, useRef } from 'react';
import { useSiteContent } from '../context/SiteContentContext';

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  baseAlpha: number;
  phaseOffset: number;
}

interface CtaMotionGraphicProps {
  className?: string;
  isTriggered?: boolean;
  targetRef?: React.RefObject<HTMLElement | null>;
}

export const CtaMotionGraphic: React.FC<CtaMotionGraphicProps> = ({
  className = '',
  targetRef
}) => {
  const { siteContent } = useSiteContent();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const rawAnimType = (siteContent?.ctaAnimationType || 'animated').toLowerCase();
  // Standardize mode names: static, animated, wavy, gaming
  const isEnabled = rawAnimType !== 'none' && rawAnimType !== 'static';
  const isWavy = rawAnimType === 'wavy' || rawAnimType === 'aurora';
  const isGaming = rawAnimType === 'gaming' || rawAnimType === 'game' || rawAnimType === 'cyber';
  const isAnimated = !isWavy && !isGaming && isEnabled;

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    // Accessibility check: respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 550);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // =========================================================================
    // MODE 1: GAMING / CYBER RETRO GRID & SCANLINE PULSE
    // =========================================================================
    if (isGaming) {
      let tick = 0;
      const stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number; color: string }> = [];
      const starCount = width < 640 ? 30 : 55;
      const gamingPalette = ['#F07822', '#2458A6', '#80D0FF', '#FFFFFF', '#FFB380'];

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.8 + 0.3,
          alpha: Math.random() * 0.5 + 0.4,
          color: gamingPalette[Math.floor(Math.random() * gamingPalette.length)]
        });
      }

      const renderGaming = () => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        tick++;

        // 1. Horizon & Perspective Wireframe Ground Grid
        const horizonY = height * 0.45;
        const gridGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        gridGrad.addColorStop(0, 'rgba(36, 88, 166, 0.05)');
        gridGrad.addColorStop(0.5, 'rgba(240, 120, 34, 0.12)');
        gridGrad.addColorStop(1, 'rgba(23, 59, 117, 0.28)');
        ctx.fillStyle = gridGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        // Perspective converging vertical lines
        const vanishX = width * 0.5;
        const lineCount = 14;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(240, 120, 34, 0.15)';
        for (let i = -lineCount; i <= lineCount; i++) {
          const bottomX = vanishX + i * (width / (lineCount * 1.1));
          ctx.beginPath();
          ctx.moveTo(vanishX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        // Animated forward-scrolling horizontal grid lines
        const offset = (tick * 0.8) % 35;
        ctx.strokeStyle = 'rgba(128, 208, 255, 0.18)';
        for (let y = horizonY; y < height; y += 18) {
          const depthProgress = (y - horizonY) / (height - horizonY);
          const dynamicSpacing = horizonY + Math.pow(depthProgress, 1.8) * (height - horizonY) + offset * depthProgress;
          if (dynamicSpacing <= height) {
            ctx.beginPath();
            ctx.moveTo(0, dynamicSpacing);
            ctx.lineTo(width, dynamicSpacing);
            ctx.stroke();
          }
        }
        ctx.restore();

        // 2. Neon Radar Pulse rings centered around CTA button position
        let targetX = width * 0.5;
        let targetY = height * 0.72;
        if (targetRef?.current && canvas) {
          const btnRect = targetRef.current.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          targetX = btnRect.left + btnRect.width / 2 - canvasRect.left;
          targetY = btnRect.top + btnRect.height / 2 - canvasRect.top;
        }

        const pulseRadius = (tick * 1.4) % 180;
        const pulseAlpha = Math.max(0, 1 - pulseRadius / 180);
        ctx.save();
        ctx.beginPath();
        ctx.arc(targetX, targetY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240, 120, 34, ${0.4 * pulseAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();

        // Secondary inner pulse ring
        const pulseRadius2 = ((tick * 1.4) + 90) % 180;
        const pulseAlpha2 = Math.max(0, 1 - pulseRadius2 / 180);
        ctx.beginPath();
        ctx.arc(targetX, targetY, pulseRadius2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(36, 88, 166, ${0.35 * pulseAlpha2})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();

        // 3. Cyber Star / Particle Field
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.y += s.speed;
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
          const twinkle = Math.sin(tick * 0.08 + i) * 0.2;
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, s.alpha + twinkle);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          // Draw diamond pixel
          ctx.fillRect(s.x, s.y, s.size, s.size);
          ctx.restore();
        }

        // 4. Sweeping horizontal cyber scanline
        const scanY = (tick * 1.6) % height;
        const scanGrad = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
        scanGrad.addColorStop(0, 'rgba(240, 120, 34, 0)');
        scanGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
        scanGrad.addColorStop(1, 'rgba(240, 120, 34, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 6, width, 12);

        animFrameRef.current = requestAnimationFrame(renderGaming);
      };

      renderGaming();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    // =========================================================================
    // MODE 2: WAVY FLOWING AURORA RIBBONS
    // =========================================================================
    if (isWavy) {
      let phase = 0;
      const renderRibbons = () => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        phase += 0.014;

        // Ambient depth glow
        const bgGlow = ctx.createRadialGradient(
          width * 0.5,
          height * 0.65,
          20,
          width * 0.5,
          height * 0.65,
          Math.max(width, height) * 0.7
        );
        bgGlow.addColorStop(0, 'rgba(240, 120, 34, 0.14)');
        bgGlow.addColorStop(0.4, 'rgba(36, 88, 166, 0.16)');
        bgGlow.addColorStop(1, 'rgba(23, 59, 117, 0)');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, width, height);

        // Flowing Ribbon Wave A (Warm Orange & White crest)
        ctx.beginPath();
        ctx.moveTo(0, height * 0.58);
        for (let x = 0; x <= width; x += 15) {
          const y =
            height * 0.56 +
            Math.sin(x * 0.0035 + phase) * 45 +
            Math.cos(x * 0.007 - phase * 0.8) * 22;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const waveGradA = ctx.createLinearGradient(0, height * 0.4, width, height);
        waveGradA.addColorStop(0, 'rgba(36, 88, 166, 0.25)');
        waveGradA.addColorStop(1, 'rgba(23, 59, 117, 0.1)');
        ctx.fillStyle = waveGradA;
        ctx.fill();

        // Flowing Ribbon Wave B (Warm Orange Accent)
        ctx.beginPath();
        ctx.moveTo(0, height * 0.7);
        for (let x = 0; x <= width; x += 15) {
          const y =
            height * 0.7 +
            Math.sin(x * 0.0045 - phase * 1.2) * 35 +
            Math.cos(x * 0.002 + phase) * 25;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const waveGradB = ctx.createLinearGradient(0, height * 0.5, width, height);
        waveGradB.addColorStop(0, 'rgba(240, 120, 34, 0.2)');
        waveGradB.addColorStop(0.5, 'rgba(240, 120, 34, 0.09)');
        waveGradB.addColorStop(1, 'rgba(23, 59, 117, 0)');
        ctx.fillStyle = waveGradB;
        ctx.fill();

        animFrameRef.current = requestAnimationFrame(renderRibbons);
      };

      renderRibbons();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    // =========================================================================
    // MODE 3: ANIMATED / WHITE PARTICLES → CTA FOCUS LOOP (Default Standard)
    // =========================================================================
    if (isAnimated) {
      const particleCount = width < 640 ? 36 : 68;
      const palette = [
        'rgba(255, 255, 255, 0.95)',
        'rgba(255, 255, 255, 0.80)',
        'rgba(255, 255, 255, 0.65)',
        'rgba(255, 249, 241, 0.85)',
        'rgba(240, 120, 34, 0.75)'
      ];

      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const hx = Math.random() * width;
        const hy = Math.random() * height;
        particles.push({
          x: hx,
          y: hy,
          homeX: hx,
          homeY: hy,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 1.8 + 1.2,
          color: palette[Math.floor(Math.random() * palette.length)],
          baseAlpha: Math.random() * 0.35 + 0.55,
          phaseOffset: Math.random() * Math.PI * 2
        });
      }

      let tick = 0;
      const CYCLE_LENGTH = 480;

      const renderParticles = () => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        tick = (tick + 1) % CYCLE_LENGTH;
        const progress = tick / CYCLE_LENGTH;

        let targetX = width * 0.5;
        let targetY = height * 0.72;
        if (targetRef?.current && canvas) {
          const btnRect = targetRef.current.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          targetX = btnRect.left + btnRect.width / 2 - canvasRect.left;
          targetY = btnRect.top + btnRect.height / 2 - canvasRect.top;
        }

        let convergenceWeight = 0;
        let ctaPopWeight = 0;

        if (progress < 0.25) {
          convergenceWeight = 0;
          ctaPopWeight = 0;
        } else if (progress < 0.52) {
          const t = (progress - 0.25) / 0.27;
          convergenceWeight = t * t * (3 - 2 * t);
          ctaPopWeight = Math.max(0, (t - 0.6) / 0.4);
        } else if (progress < 0.72) {
          convergenceWeight = 1;
          const t = (progress - 0.52) / 0.2;
          ctaPopWeight = 0.8 + Math.sin(t * Math.PI) * 0.2;
        } else {
          const t = (progress - 0.72) / 0.28;
          convergenceWeight = 1 - (t * t * (3 - 2 * t));
          ctaPopWeight = Math.max(0, 1 - t * 2.5);
        }

        if (ctaPopWeight > 0.05) {
          const glowRadius = Math.min(width, height) * 0.28;
          const halo = ctx.createRadialGradient(targetX, targetY, 15, targetX, targetY, glowRadius);
          halo.addColorStop(0, `rgba(240, 120, 34, ${0.22 * ctaPopWeight})`);
          halo.addColorStop(0.4, `rgba(255, 255, 255, ${0.10 * ctaPopWeight})`);
          halo.addColorStop(1, 'rgba(23, 59, 117, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(targetX, targetY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        const ambientGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          10,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.65
        );
        ambientGrad.addColorStop(0, 'rgba(36, 88, 166, 0.12)');
        ambientGrad.addColorStop(0.7, 'rgba(23, 59, 117, 0.04)');
        ambientGrad.addColorStop(1, 'rgba(23, 59, 117, 0)');
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.homeX += p.vx;
          p.homeY += p.vy;
          if (p.homeX < 0) p.homeX = width;
          if (p.homeX > width) p.homeX = 0;
          if (p.homeY < 0) p.homeY = height;
          if (p.homeY > height) p.homeY = 0;

          const angle = p.phaseOffset + tick * 0.02;
          const orbitRadius = 45 + ((i % 5) * 12);
          const ctaX = targetX + Math.cos(angle) * orbitRadius;
          const ctaY = targetY + Math.sin(angle) * (orbitRadius * 0.45);

          p.x = p.homeX * (1 - convergenceWeight) + ctaX * convergenceWeight;
          p.y = p.homeY * (1 - convergenceWeight) + ctaY * convergenceWeight;

          const twinkle = Math.sin(tick * 0.05 + p.phaseOffset) * 0.25;
          const alpha = Math.min(1, Math.max(0.15, (p.baseAlpha + twinkle)));

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.size > 2) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();
          }
          ctx.restore();
        }

        animFrameRef.current = requestAnimationFrame(renderParticles);
      };

      renderParticles();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [isEnabled, isWavy, isGaming, isAnimated]);

  if (!isEnabled) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-hidden="true"
      />
    </div>
  );
};
