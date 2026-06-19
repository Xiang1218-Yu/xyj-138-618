/**
 * 时间系统模块
 * 职责：管理一天中不同时段的天空配色，支持时段间平滑过渡插值
 * 单一职责：仅负责时间到颜色的映射和插值计算
 */

import { SkyColors, TimeOfDay } from '@/types/flight';

/**
 * 预定义四个时段的天空配色方案
 * 每个方案包含天空渐变、太阳/月亮位置、星星显示等完整配置
 */
const TIME_PRESETS: Record<TimeOfDay, SkyColors> = {
  /** 日出：橙粉渐变，太阳从东方升起 */
  [TimeOfDay.Sunrise]: {
    topColor: '#2d1b4e',
    middleColor: '#8b4769',
    bottomColor: '#ff9a56',
    sunX: 0.15,
    sunY: 0.75,
    sunColor: '#ffcc00',
    sunGlowColor: 'rgba(255, 150, 80, 0.4)',
    showStars: true,
    starBrightness: 0.3,
    fogColor: 'rgba(255, 180, 120, 0.15)',
  },
  /** 正午：明亮蓝天，太阳在顶部 */
  [TimeOfDay.Noon]: {
    topColor: '#1e90ff',
    middleColor: '#87ceeb',
    bottomColor: '#b0e0e6',
    sunX: 0.5,
    sunY: 0.1,
    sunColor: '#fff5e0',
    sunGlowColor: 'rgba(255, 250, 200, 0.3)',
    showStars: false,
    starBrightness: 0,
    fogColor: 'rgba(255, 255, 255, 0.05)',
  },
  /** 日落：紫红渐变，太阳在西方落下 */
  [TimeOfDay.Sunset]: {
    topColor: '#1a0a2e',
    middleColor: '#6b2d5b',
    bottomColor: '#ff6b35',
    sunX: 0.85,
    sunY: 0.7,
    sunColor: '#ff4500',
    sunGlowColor: 'rgba(255, 100, 50, 0.5)',
    showStars: true,
    starBrightness: 0.5,
    fogColor: 'rgba(255, 100, 80, 0.2)',
  },
  /** 夜晚：深蓝紫色，月亮和星星 */
  [TimeOfDay.Night]: {
    topColor: '#0a0a1a',
    middleColor: '#1a1f4d',
    bottomColor: '#2d1f5c',
    sunX: 0.5,
    sunY: 0.15,
    sunColor: '#e8e8f0',
    sunGlowColor: 'rgba(200, 200, 255, 0.2)',
    showStars: true,
    starBrightness: 0.9,
    fogColor: 'rgba(30, 20, 60, 0.1)',
  },
};

/**
 * 时段区间定义，用于时间值映射到对应时段
 * 0-25: 日出，25-50: 正午，50-75: 日落，75-100: 夜晚
 */
const TIME_SEGMENTS = [
  { time: TimeOfDay.Sunrise, start: 0, end: 25 },
  { time: TimeOfDay.Noon, start: 25, end: 50 },
  { time: TimeOfDay.Sunset, start: 50, end: 75 },
  { time: TimeOfDay.Night, start: 75, end: 100 },
];

/**
 * 将十六进制颜色转换为RGB数组
 * @param hex - 十六进制颜色字符串
 * @returns RGB三通道数组 [r, g, b]，范围0-255
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

/**
 * 将RGB数组转换为十六进制颜色
 * @param r - 红色通道 0-255
 * @param g - 绿色通道 0-255
 * @param b - 蓝色通道 0-255
 * @returns 十六进制颜色字符串
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/**
 * 在两个十六进制颜色之间进行线性插值
 * @param color1 - 起始颜色
 * @param color2 - 结束颜色
 * @param t - 插值比例 0-1
 * @returns 插值后的十六进制颜色
 */
const lerpColor = (color1: string, color2: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t)
  );
};

/**
 * 在两个rgba颜色字符串之间进行线性插值
 * @param color1 - 起始rgba颜色
 * @param color2 - 结束rgba颜色
 * @param t - 插值比例 0-1
 * @returns 插值后的rgba颜色字符串
 */
const lerpRgbaColor = (color1: string, color2: string, t: number): string => {
  const match1 = color1.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
  const match2 = color2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
  if (!match1 || !match2) return color1;
  const r1 = parseInt(match1[1]);
  const g1 = parseInt(match1[2]);
  const b1 = parseInt(match1[3]);
  const a1 = parseFloat(match1[4] || '1');
  const r2 = parseInt(match2[1]);
  const g2 = parseInt(match2[2]);
  const b2 = parseInt(match2[3]);
  const a2 = parseFloat(match2[4] || '1');
  return `rgba(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)}, ${a1 + (a2 - a1) * t})`;
};

/**
 * 在两个SkyColors配置之间进行线性插值
 * @param colors1 - 起始配色
 * @param colors2 - 结束配色
 * @param t - 插值比例 0-1
 * @returns 插值后的完整SkyColors配置
 */
const lerpSkyColors = (colors1: SkyColors, colors2: SkyColors, t: number): SkyColors => {
  return {
    topColor: lerpColor(colors1.topColor, colors2.topColor, t),
    middleColor: lerpColor(colors1.middleColor, colors2.middleColor, t),
    bottomColor: lerpColor(colors1.bottomColor, colors2.bottomColor, t),
    sunX: colors1.sunX + (colors2.sunX - colors1.sunX) * t,
    sunY: colors1.sunY + (colors2.sunY - colors2.sunY) * t,
    sunColor: lerpColor(colors1.sunColor, colors2.sunColor, t),
    sunGlowColor: lerpRgbaColor(colors1.sunGlowColor, colors2.sunGlowColor, t),
    showStars: t < 0.5 ? colors1.showStars : colors2.showStars,
    starBrightness: colors1.starBrightness + (colors2.starBrightness - colors1.starBrightness) * t,
    fogColor: lerpRgbaColor(colors1.fogColor, colors2.fogColor, t),
  };
};

/**
 * 根据时间值(0-100)计算对应的天空配色
 * 支持任意时间值，自动在相邻时段间平滑过渡
 * @param timeValue - 时间值 0-100
 * @returns 对应的SkyColors配置
 */
export const getSkyColors = (timeValue: number): SkyColors => {
  const clampedTime = Math.max(0, Math.min(100, timeValue));

  for (let i = 0; i < TIME_SEGMENTS.length; i++) {
    const segment = TIME_SEGMENTS[i];
    if (clampedTime <= segment.end) {
      if (i === 0) {
        return TIME_PRESETS[segment.time];
      }
      const prevSegment = TIME_SEGMENTS[i - 1];
      const segmentDuration = segment.end - segment.start;
      const progressInSegment = (clampedTime - segment.start) / segmentDuration;
      return lerpSkyColors(
        TIME_PRESETS[prevSegment.time],
        TIME_PRESETS[segment.time],
        progressInSegment
      );
    }
  }

  return TIME_PRESETS[TimeOfDay.Night];
};

/**
 * 根据时间值获取对应的时段名称
 * @param timeValue - 时间值 0-100
 * @returns 对应的TimeOfDay枚举值
 */
export const getTimeOfDay = (timeValue: number): TimeOfDay => {
  const clampedTime = Math.max(0, Math.min(100, timeValue));
  if (clampedTime < 25) return TimeOfDay.Sunrise;
  if (clampedTime < 50) return TimeOfDay.Noon;
  if (clampedTime < 75) return TimeOfDay.Sunset;
  return TimeOfDay.Night;
};

/**
 * 获取时段对应的中文显示名称
 * @param timeOfDay - 时段枚举值
 * @returns 中文名称
 */
export const getTimeOfDayLabel = (timeOfDay: TimeOfDay): string => {
  const labels: Record<TimeOfDay, string> = {
    [TimeOfDay.Sunrise]: '日出',
    [TimeOfDay.Noon]: '正午',
    [TimeOfDay.Sunset]: '日落',
    [TimeOfDay.Night]: '夜晚',
  };
  return labels[timeOfDay];
};

/**
 * 获取四个快捷时段对应的时间值
 * 用于时间滑块的快捷跳转点
 */
export const TIME_QUICK_POINTS = [
  { label: '日出', value: 12.5, time: TimeOfDay.Sunrise },
  { label: '正午', value: 37.5, time: TimeOfDay.Noon },
  { label: '日落', value: 62.5, time: TimeOfDay.Sunset },
  { label: '夜晚', value: 87.5, time: TimeOfDay.Night },
];
