/**
 * 天空渲染器模块
 * 职责：根据时间段（0-100滑块值）渲染不同的天空效果
 * - 0-25: 日出 (sunrise)
 * - 25-50: 正午 (noon)
 * - 50-75: 日落 (sunset)
 * - 75-100: 夜晚 (night)
 * 支持时间段之间的平滑颜色插值过渡
 */

import { SkyPalette, TimeOfDay } from '@/types/flight';

/**
 * 四个关键时间段的天空配色预设
 */
const SKY_PALETTES: Record<TimeOfDay, SkyPalette> = {
  sunrise: {
    gradientStops: [
      { offset: 0, color: '#1a1a3e' },
      { offset: 0.3, color: '#4a3060' },
      { offset: 0.5, color: '#c77d6a' },
      { offset: 0.7, color: '#ffb366' },
      { offset: 1, color: '#ffd4a3' },
    ],
    sunPosition: { x: 0.15, y: 0.7 },
    sunColor: '#ffaa44',
    sunGlow: [
      'rgba(255, 180, 100, 0.6)',
      'rgba(255, 140, 80, 0.3)',
      'rgba(255, 100, 80, 0.1)',
      'transparent',
    ],
    showStars: true,
    starOpacity: 0.3,
    ambientLight: 0.6,
  },
  noon: {
    gradientStops: [
      { offset: 0, color: '#1e3a8a' },
      { offset: 0.3, color: '#3b82f6' },
      { offset: 0.6, color: '#60a5fa' },
      { offset: 0.85, color: '#93c5fd' },
      { offset: 1, color: '#bfdbfe' },
    ],
    sunPosition: { x: 0.85, y: 0.12 },
    sunColor: '#fff8dc',
    sunGlow: [
      'rgba(255, 250, 200, 0.4)',
      'rgba(255, 230, 150, 0.15)',
      'transparent',
    ],
    showStars: false,
    starOpacity: 0,
    ambientLight: 1,
  },
  sunset: {
    gradientStops: [
      { offset: 0, color: '#1e1b4b' },
      { offset: 0.25, color: '#581c87' },
      { offset: 0.5, color: '#be185d' },
      { offset: 0.7, color: '#ea580c' },
      { offset: 1, color: '#fbbf24' },
    ],
    sunPosition: { x: 0.85, y: 0.75 },
    sunColor: '#ff6633',
    sunGlow: [
      'rgba(255, 120, 50, 0.7)',
      'rgba(255, 80, 80, 0.4)',
      'rgba(200, 50, 100, 0.15)',
      'transparent',
    ],
    showStars: true,
    starOpacity: 0.4,
    ambientLight: 0.65,
  },
  night: {
    gradientStops: [
      { offset: 0, color: '#030712' },
      { offset: 0.25, color: '#0d1033' },
      { offset: 0.5, color: '#1a1f4d' },
      { offset: 0.75, color: '#252d6b' },
      { offset: 1, color: '#3d3280' },
    ],
    sunPosition: { x: 0.5, y: -0.2 },
    sunColor: '#e8e8ff',
    sunGlow: [
      'rgba(200, 200, 255, 0.2)',
      'rgba(150, 150, 200, 0.08)',
      'transparent',
    ],
    showStars: true,
    starOpacity: 1,
    ambientLight: 0.35,
  },
};

/**
 * 在两个颜色值之间进行线性插值
 * @param color1 起始颜色（十六进制，如 #ff0000）
 * @param color2 目标颜色
 * @param t 插值因子 (0-1)
 */
function lerpColor(color1: string, color2: string, t: number): string {
  const hex = (c: string) => parseInt(c.replace('#', ''), 16);
  const r1 = (hex(color1) >> 16) & 0xff;
  const g1 = (hex(color1) >> 8) & 0xff;
  const b1 = hex(color1) & 0xff;
  const r2 = (hex(color2) >> 16) & 0xff;
  const g2 = (hex(color2) >> 8) & 0xff;
  const b2 = hex(color2) & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * 在两个 rgba 颜色字符串之间插值
 */
function lerpRgba(color1: string, color2: string, t: number): string {
  const parseRgba = (c: string) => {
    const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
      };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const c1 = parseRgba(color1);
  const c2 = parseRgba(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  const a = c1.a + (c2.a - c1.a) * t;

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/**
 * 根据时间滑块值获取当前时间段和插值因子
 * @param timeValue 0-100 的时间滑块值
 */
export function getTimeOfDayInfo(timeValue: number): {
  current: TimeOfDay;
  next: TimeOfDay;
  factor: number;
  label: string;
} {
  const normalized = timeValue / 100;
  const segment = Math.floor(normalized * 4);
  const factor = (normalized * 4) % 1;

  const times: TimeOfDay[] = ['sunrise', 'noon', 'sunset', 'night'];
  const labels: Record<TimeOfDay, string> = {
    sunrise: '日出',
    noon: '正午',
    sunset: '日落',
    night: '夜晚',
  };

  const currentIndex = Math.min(segment, 3);
  const nextIndex = (currentIndex + 1) % 4;

  return {
    current: times[currentIndex],
    next: times[nextIndex],
    factor,
    label: labels[times[currentIndex]],
  };
}

/**
 * 根据时间值计算插值后的天空配色
 */
export function getInterpolatedSkyPalette(timeValue: number): {
  gradientStops: { offset: number; color: string }[];
  sunPosition: { x: number; y: number };
  sunColor: string;
  sunGlow: string[];
  showStars: boolean;
  starOpacity: number;
  ambientLight: number;
} {
  const { current, next, factor } = getTimeOfDayInfo(timeValue);
  const p1 = SKY_PALETTES[current];
  const p2 = SKY_PALETTES[next];

  return {
    gradientStops: p1.gradientStops.map((stop, i) => ({
      offset: stop.offset,
      color: lerpColor(stop.color, p2.gradientStops[i]?.color || stop.color, factor),
    })),
    sunPosition: {
      x: p1.sunPosition.x + (p2.sunPosition.x - p1.sunPosition.x) * factor,
      y: p1.sunPosition.y + (p2.sunPosition.y - p1.sunPosition.y) * factor,
    },
    sunColor: lerpColor(p1.sunColor, p2.sunColor, factor),
    sunGlow: p1.sunGlow.map((glow, i) =>
      lerpRgba(glow, p2.sunGlow[i] || glow, factor)
    ),
    showStars: p1.showStars || p2.showStars,
    starOpacity: p1.starOpacity + (p2.starOpacity - p1.starOpacity) * factor,
    ambientLight: p1.ambientLight + (p2.ambientLight - p1.ambientLight) * factor,
  };
}

/**
 * 渲染天空
 * @param ctx Canvas 2D 上下文
 * @param w 画布宽度
 * @param h 画布高度
 * @param timeValue 时间滑块值 (0-100)
 * @param animationTime 动画时间戳（用于星星闪烁）
 */
export function renderSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeValue: number,
  animationTime: number
): void {
  const palette = getInterpolatedSkyPalette(timeValue);

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  palette.gradientStops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * palette.sunPosition.x;
  const sunY = h * palette.sunPosition.y;
  const sunRadius = w * 0.5;

  if (sunY < h * 1.2) {
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    palette.sunGlow.forEach((color, i) => {
      sunGradient.addColorStop(i / (palette.sunGlow.length - 1), color);
    });
    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, w, h);

    if (timeValue > 70 || timeValue < 30) {
      const moonGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
      moonGlow.addColorStop(0, palette.sunColor);
      moonGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 35);
      sunCore.addColorStop(0, palette.sunColor);
      sunCore.addColorStop(0.7, palette.sunColor);
      sunCore.addColorStop(1, 'transparent');
      ctx.fillStyle = sunCore;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (palette.showStars && palette.starOpacity > 0) {
    const starCount = Math.floor(120 * palette.starOpacity);
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 137.508) % w;
      const sy = (i * 73.67) % (h * 0.5);
      const twinkle = 0.5 + 0.5 * Math.sin(animationTime * 0.002 + i * 0.7);
      const opacity = palette.starOpacity * (0.3 + twinkle * 0.7);

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + twinkle * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
