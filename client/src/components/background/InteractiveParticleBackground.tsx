'use client';

import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';

type BackgroundMode = 'full' | 'reduced' | 'static';
type PerformanceProfileName = 'ultra' | 'high' | 'medium' | 'low' | 'mobile' | 'reduced';
type ParticleColor = '#f8fbff' | '#00e5ff' | '#7dd3fc';

interface ParticleProfile {
  particleCount: number;
  connectionDistance: number;
  connectionOpacity: number;
  pointerRadius: number;
  pointerForce: number;
  velocityDamping: number;
  maxSpeed: number;
  speedMultiplier: number;
  radiusMin: number;
  radiusMax: number;
  maxLinksPerParticle: number;
  dprCap: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: ParticleColor;
  alpha: number;
  links: number;
}

interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

interface ViewportSize {
  width: number;
  height: number;
}

const PROFILES: Record<PerformanceProfileName, ParticleProfile> = {
  ultra: {
    particleCount: 118,
    connectionDistance: 172,
    connectionOpacity: 0.2,
    pointerRadius: 150,
    pointerForce: 0.012,
    velocityDamping: 0.992,
    maxSpeed: 0.42,
    speedMultiplier: 0.55,
    radiusMin: 1.05,
    radiusMax: 2.25,
    maxLinksPerParticle: 4,
    dprCap: 2,
  },
  high: {
    particleCount: 86,
    connectionDistance: 154,
    connectionOpacity: 0.18,
    pointerRadius: 140,
    pointerForce: 0.01,
    velocityDamping: 0.99,
    maxSpeed: 0.38,
    speedMultiplier: 0.5,
    radiusMin: 1,
    radiusMax: 2.1,
    maxLinksPerParticle: 3,
    dprCap: 1.75,
  },
  medium: {
    particleCount: 64,
    connectionDistance: 138,
    connectionOpacity: 0.16,
    pointerRadius: 128,
    pointerForce: 0.008,
    velocityDamping: 0.988,
    maxSpeed: 0.34,
    speedMultiplier: 0.45,
    radiusMin: 0.95,
    radiusMax: 2,
    maxLinksPerParticle: 3,
    dprCap: 1.5,
  },
  low: {
    particleCount: 40,
    connectionDistance: 116,
    connectionOpacity: 0.12,
    pointerRadius: 112,
    pointerForce: 0.006,
    velocityDamping: 0.985,
    maxSpeed: 0.28,
    speedMultiplier: 0.4,
    radiusMin: 0.9,
    radiusMax: 1.85,
    maxLinksPerParticle: 2,
    dprCap: 1.25,
  },
  mobile: {
    particleCount: 34,
    connectionDistance: 104,
    connectionOpacity: 0.11,
    pointerRadius: 104,
    pointerForce: 0.005,
    velocityDamping: 0.985,
    maxSpeed: 0.24,
    speedMultiplier: 0.36,
    radiusMin: 0.85,
    radiusMax: 1.75,
    maxLinksPerParticle: 2,
    dprCap: 1.15,
  },
  reduced: {
    particleCount: 30,
    connectionDistance: 102,
    connectionOpacity: 0.1,
    pointerRadius: 96,
    pointerForce: 0.003,
    velocityDamping: 0.982,
    maxSpeed: 0.18,
    speedMultiplier: 0.24,
    radiusMin: 0.85,
    radiusMax: 1.7,
    maxLinksPerParticle: 2,
    dprCap: 1.1,
  },
};

const PALETTE: ParticleColor[] = ['#f8fbff', '#00e5ff', '#7dd3fc'];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function colorWithAlpha(color: ParticleColor, alpha: number) {
  const normalizedAlpha = clamp(alpha, 0, 1);
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha.toFixed(3)})`;
}

function getNavigatorCapabilities() {
  if (typeof window === 'undefined') {
    return { deviceMemory: 4, hardwareConcurrency: 4, maxTouchPoints: 0 };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  return {
    deviceMemory: nav.deviceMemory ?? 4,
    hardwareConcurrency: nav.hardwareConcurrency ?? 4,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
  };
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolveProfile(mode: BackgroundMode, reducedMotion: boolean, width: number, height: number): ParticleProfile {
  if (mode === 'static') {
    return resolveAdaptiveProfile(width, height);
  }

  if (mode === 'reduced' || reducedMotion) {
    return PROFILES.reduced;
  }

  return resolveAdaptiveProfile(width, height);
}

function resolveAdaptiveProfile(width: number, height: number) {
  const { deviceMemory, hardwareConcurrency, maxTouchPoints } = getNavigatorCapabilities();
  const isTouch = maxTouchPoints > 0 || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const area = width * height;

  if (width < 640 || isTouch) {
    return PROFILES.mobile;
  }

  if (deviceMemory >= 8 && hardwareConcurrency >= 8 && width >= 1440 && area >= 1_400_000) {
    return PROFILES.ultra;
  }

  if (deviceMemory >= 4 && hardwareConcurrency >= 6 && width >= 1024) {
    return PROFILES.high;
  }

  if (deviceMemory <= 2 || hardwareConcurrency <= 2 || area < 700_000) {
    return PROFILES.low;
  }

  return PROFILES.medium;
}

function createParticles(width: number, height: number, profile: ParticleProfile): Particle[] {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const particles: Particle[] = [];

  for (let i = 0; i < profile.particleCount; i += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(0.08, 0.28);

    particles.push({
      x: randomBetween(0, safeWidth),
      y: randomBetween(0, safeHeight),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randomBetween(profile.radiusMin, profile.radiusMax),
      color: PALETTE[i % PALETTE.length],
      alpha: randomBetween(0.42, 0.82),
      links: 0,
    });
  }

  return particles;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  profile: ParticleProfile,
) {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = 0.85;

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];

    if (a.links >= profile.maxLinksPerParticle) continue;

    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      if (b.links >= profile.maxLinksPerParticle) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > profile.connectionDistance) continue;

      const opacity = Math.pow(1 - distance / profile.connectionDistance, 1.65) * profile.connectionOpacity * Math.min(a.alpha, b.alpha);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = colorWithAlpha(a.color, opacity);
      ctx.stroke();

      a.links += 1;
      b.links += 1;
    }
  }

  ctx.restore();

  ctx.save();
  for (const particle of particles) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(particle.color, particle.alpha * 0.95);
    ctx.shadowColor = colorWithAlpha(particle.color, 0.24);
    ctx.shadowBlur = 8;
    ctx.fill();
  }
  ctx.restore();
}

function updateParticles(particles: Particle[], profile: ParticleProfile, pointer: PointerState, width: number, height: number) {
  const margin = 12;

  for (const particle of particles) {
    let ax = 0;
    let ay = 0;

    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.01 && distance < profile.pointerRadius) {
        const force = (1 - distance / profile.pointerRadius) * profile.pointerForce;
        ax += (dx / distance) * force;
        ay += (dy / distance) * force;
      }
    }

    particle.vx = clamp((particle.vx + ax) * profile.velocityDamping, -profile.maxSpeed, profile.maxSpeed);
    particle.vy = clamp((particle.vy + ay) * profile.velocityDamping, -profile.maxSpeed, profile.maxSpeed);
    particle.x += particle.vx * profile.speedMultiplier;
    particle.y += particle.vy * profile.speedMultiplier;
    particle.links = 0;

    if (particle.x < margin) {
      particle.x = margin;
      particle.vx = Math.abs(particle.vx);
    }

    if (particle.x > width - margin) {
      particle.x = width - margin;
      particle.vx = -Math.abs(particle.vx);
    }

    if (particle.y < margin) {
      particle.y = margin;
      particle.vy = Math.abs(particle.vy);
    }

    if (particle.y > height - margin) {
      particle.y = height - margin;
      particle.vy = -Math.abs(particle.vy);
    }
  }
}

export default function InteractiveParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const profileRef = useRef<ParticleProfile>(PROFILES.medium);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });
  const mode = useUIStore((state) => state.backgroundMode);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);

    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewport.width === 0 || viewport.height === 0) return;

    const profile = resolveProfile(mode, reducedMotion, viewport.width, viewport.height);
    const dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap);

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    profileRef.current = profile;
    particlesRef.current = createParticles(viewport.width, viewport.height, profile);

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (mode === 'static') {
      drawScene(ctx, viewport.width, viewport.height, particlesRef.current, profile);
      return;
    }

    const animate = () => {
      updateParticles(particlesRef.current, profile, pointerRef.current, viewport.width, viewport.height);
      drawScene(ctx, viewport.width, viewport.height, particlesRef.current, profile);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [mode, reducedMotion, viewport.height, viewport.width]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      } else if (!document.hidden && mode !== 'static' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
          updateParticles(particlesRef.current, profileRef.current, pointerRef.current, viewport.width, viewport.height);
          drawScene(ctx, viewport.width, viewport.height, particlesRef.current, profileRef.current);
          frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode, viewport.height, viewport.width]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-background"
      aria-hidden="true"
    />
  );
}
