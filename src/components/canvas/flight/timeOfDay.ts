/**
 * timeOfDay.ts
 * --------------------------------------------
 * 单一职责：根据 0~1 的时间值，计算飞行场景在不同时间段的颜色配置。
 * 仅负责"时间 → 调色板"的换算，不涉及任何 Canvas 绘制。
 */

import { TimeOfDayPreset } from '@/types/flight';

/** 单个时间段的颜色配置 */
export interface TimeOfDayPalette {
  /** 天空垂直渐变（从顶部到地平线）的 5 段颜色 */
  sky: [string, string, string, string, string];
  /** 太阳/月亮光晕径向渐变颜色（从中心到边缘） */
  sunGlow: [string, string, string, string];
  /** 太阳/月亮在屏幕上的相对位置（x, y 占宽高的比例） */
  sunPosition: { x: number; y: number };
  /** 是否绘制星空（夜晚 / 日出前夕） */
  showStars: boolean;
  /** 星空的整体不透明度 0~1 */
  starOpacity: number;
  /** 山脉颜色基调 HSL（h:色相, s:饱和度, lBase:基础亮度） */
  mountainHsl: { h: number; s: number; lBase: number };
  /** 云朵高光颜色（被太阳染色） */
  cloudTint: string;
  /** 云朵阴影颜色 */
  cloudShadow: string;
  /** 整体环境氛围色（叠加在画面上） */
  ambient: string;
  /** 氛围色不透明度 */
  ambientOpacity: number;
}

/** 四个标准时间段的调色板 */
const PRESETS: Record<TimeOfDayPreset, TimeOfDayPalette> = {
  // 日出：暖橘色调，太阳在东方低空
  sunrise: {
    sky: ['#1a1a4a', '#5a3a7a', '#c45a7a', '#ff9a7a', '#ffd29a'],
    sunGlow: [
      'rgba(255, 200, 120, 0.55)',
      'rgba(255, 150, 100, 0.25)',
      'rgba(255, 100, 120, 0.08)',
      'transparent',
    ],
    sunPosition: { x: 0.15, y: 0.65 },
    showStars: true,
    starOpacity: 0.35,
    mountainHsl: { h: 18, s: 35, lBase: 22 },
    cloudTint: 'rgba(255, 220, 200, 1)',
    cloudShadow: 'rgba(180, 130, 160, 0.3)',
    ambient: 'rgba(255, 180, 120, 0.06)',
    ambientOpacity: 1,
  },
  // 正午：明亮蓝天，太阳在正上方
  noon: {
    sky: ['#3aa9ff', '#5fc1ff', '#8fd6ff', '#bfe7ff', '#e0f3ff'],
    sunGlow: [
      'rgba(255, 255, 220, 0.45)',
      'rgba(255, 240, 180, 0.18)',
      'rgba(255, 220, 150, 0.05)',
      'transparent',
    ],
    sunPosition: { x: 0.5, y: 0.12 },
    showStars: false,
    starOpacity: 0,
    mountainHsl: { h: 215, s: 30, lBase: 35 },
    cloudTint: 'rgba(255, 255, 255, 1)',
    cloudShadow: 'rgba(150, 170, 200, 0.25)',
    ambient: 'rgba(255, 255, 255, 0.02)',
    ambientOpacity: 1,
  },
  // 日落：火红橙紫
  sunset: {
    sky: ['#1d1654', '#5a2d7c', '#c0407a', '#ff6a40', '#ffb060'],
    sunGlow: [
      'rgba(255, 140, 60, 0.6)',
      'rgba(255, 90, 80, 0.3)',
      'rgba(180, 50, 130, 0.1)',
      'transparent',
    ],
    sunPosition: { x: 0.85, y: 0.7 },
    showStars: true,
    starOpacity: 0.25,
    mountainHsl: { h: 305, s: 30, lBase: 18 },
    cloudTint: 'rgba(255, 180, 140, 1)',
    cloudShadow: 'rgba(120, 60, 110, 0.4)',
    ambient: 'rgba(255, 120, 80, 0.08)',
    ambientOpacity: 1,
  },
  // 夜晚：深蓝紫色 + 月亮 + 满天繁星
  night: {
    sky: ['#02030f', '#0a0a30', '#15154a', '#202060', '#2a2070'],
    sunGlow: [
      'rgba(220, 230, 255, 0.35)',
      'rgba(180, 200, 255, 0.12)',
      'rgba(120, 140, 220, 0.04)',
      'transparent',
    ],
    sunPosition: { x: 0.78, y: 0.18 },
    showStars: true,
    starOpacity: 1,
    mountainHsl: { h: 230, s: 28, lBase: 10 },
    cloudTint: 'rgba(180, 190, 230, 1)',
    cloudShadow: 'rgba(20, 25, 60, 0.6)',
    ambient: 'rgba(20, 30, 80, 0.18)',
    ambientOpacity: 1,
  },
};

/** 标准 4 个时间点（环形）所对应的归一化时间 */
const TIME_POINTS: { t: number; preset: TimeOfDayPreset }[] = [
  { t: 0.0, preset: 'sunrise' },
  { t: 0.25, preset: 'noon' },
  { t: 0.5, preset: 'sunset' },
  { t: 0.75, preset: 'night' },
];

/**
 * 解析 #RRGGBB 颜色为 [r,g,b]。
 * 仅本模块内部使用，避免对外暴露不必要的工具函数。
 */
const parseHex = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
};

/** 解析 rgba(...) / rgb(...) 字符串为 [r,g,b,a]，对未知格式返回透明黑。 */
const parseRgba = (str: string): [number, number, number, number] => {
  if (str === 'transparent') return [0, 0, 0, 0];
  if (str.startsWith('#')) {
    const [r, g, b] = parseHex(str);
    return [r, g, b, 1];
  }
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpHexColor = (a: string, b: string, t: number): string => {
  const ra = parseHex(a);
  const rb = parseHex(b);
  const r = Math.round(lerp(ra[0], rb[0], t));
  const g = Math.round(lerp(ra[1], rb[1], t));
  const bl = Math.round(lerp(ra[2], rb[2], t));
  return `rgb(${r}, ${g}, ${bl})`;
};

const lerpRgbaColor = (a: string, b: string, t: number): string => {
  const ra = parseRgba(a);
  const rb = parseRgba(b);
  const r = Math.round(lerp(ra[0], rb[0], t));
  const g = Math.round(lerp(ra[1], rb[1], t));
  const bl = Math.round(lerp(ra[2], rb[2], t));
  const al = lerp(ra[3], rb[3], t);
  return `rgba(${r}, ${g}, ${bl}, ${al.toFixed(3)})`;
};

/**
 * 在两个 palette 之间做线性插值，得到任意时刻的连续配色。
 */
const interpolatePalette = (
  a: TimeOfDayPalette,
  b: TimeOfDayPalette,
  t: number
): TimeOfDayPalette => ({
  sky: [
    lerpHexColor(a.sky[0], b.sky[0], t),
    lerpHexColor(a.sky[1], b.sky[1], t),
    lerpHexColor(a.sky[2], b.sky[2], t),
    lerpHexColor(a.sky[3], b.sky[3], t),
    lerpHexColor(a.sky[4], b.sky[4], t),
  ],
  sunGlow: [
    lerpRgbaColor(a.sunGlow[0], b.sunGlow[0], t),
    lerpRgbaColor(a.sunGlow[1], b.sunGlow[1], t),
    lerpRgbaColor(a.sunGlow[2], b.sunGlow[2], t),
    lerpRgbaColor(a.sunGlow[3], b.sunGlow[3], t),
  ],
  sunPosition: {
    x: lerp(a.sunPosition.x, b.sunPosition.x, t),
    y: lerp(a.sunPosition.y, b.sunPosition.y, t),
  },
  showStars: a.showStars || b.showStars,
  starOpacity: lerp(a.starOpacity, b.starOpacity, t),
  mountainHsl: {
    h: lerp(a.mountainHsl.h, b.mountainHsl.h, t),
    s: lerp(a.mountainHsl.s, b.mountainHsl.s, t),
    lBase: lerp(a.mountainHsl.lBase, b.mountainHsl.lBase, t),
  },
  cloudTint: lerpRgbaColor(a.cloudTint, b.cloudTint, t),
  cloudShadow: lerpRgbaColor(a.cloudShadow, b.cloudShadow, t),
  ambient: lerpRgbaColor(a.ambient, b.ambient, t),
  ambientOpacity: lerp(a.ambientOpacity, b.ambientOpacity, t),
});

/**
 * 根据归一化时间值（0~1，循环）解析对应的 palette。
 * 该函数是本模块对外暴露的核心 API。
 */
export const getPaletteForTime = (timeOfDay: number): TimeOfDayPalette => {
  // 将输入限制在 [0,1) 内（环形）
  const t = ((timeOfDay % 1) + 1) % 1;

  // 在 TIME_POINTS 中找到 t 所在的区间
  for (let i = 0; i < TIME_POINTS.length; i++) {
    const cur = TIME_POINTS[i];
    const next = TIME_POINTS[(i + 1) % TIME_POINTS.length];
    const nextT = next.t === 0 ? 1 : next.t;
    if (t >= cur.t && t < nextT) {
      const localT = (t - cur.t) / (nextT - cur.t);
      return interpolatePalette(PRESETS[cur.preset], PRESETS[next.preset], localT);
    }
  }
  // 边界保护：t 接近 1 时回到 sunrise
  return PRESETS.sunrise;
};

/**
 * 根据归一化时间值得到最接近的 preset 名称（用于 UI 显示当前时段）。
 */
export const getNearestPreset = (timeOfDay: number): TimeOfDayPreset => {
  const t = ((timeOfDay % 1) + 1) % 1;
  let best: TimeOfDayPreset = 'sunrise';
  let bestDist = Infinity;
  for (const point of TIME_POINTS) {
    const d = Math.min(Math.abs(point.t - t), Math.abs(point.t + 1 - t));
    if (d < bestDist) {
      bestDist = d;
      best = point.preset;
    }
  }
  return best;
};

/** 暴露 preset 的标准时间值，供 UI 切换按钮使用 */
export const TIME_PRESET_VALUES: Record<TimeOfDayPreset, number> = {
  sunrise: 0,
  noon: 0.25,
  sunset: 0.5,
  night: 0.75,
};
