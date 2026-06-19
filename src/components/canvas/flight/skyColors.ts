import { TimeColors, EnvironmentSettings } from '@/types/flight';

/**
 * 预定义的四个关键时间点颜色配置
 * 日出(sunrise): 0
 * 正午(noon): 33
 * 日落(sunset): 66
 * 夜晚(night): 100
 */
const TIME_COLORS: Record<string, TimeColors> = {
  sunrise: {
    skyTop: '#1a1a3e',
    skyMiddle: '#ff7b54',
    skyBottom: '#ffb26b',
    sunColor: 'rgba(255, 200, 100, 0.9)',
    sunGlowColor: 'rgba(255, 150, 80, 0.4)',
    ambientLight: 0.7,
    cloudTint: 'rgba(255, 200, 150, 0.3)',
    mountainTint: 'rgba(100, 60, 80, 0.4)',
    starOpacity: 0.3,
    sunPosition: { x: 0.15, y: 0.7 },
  },
  noon: {
    skyTop: '#4a90d9',
    skyMiddle: '#87ceeb',
    skyBottom: '#b8d4e8',
    sunColor: 'rgba(255, 255, 200, 1)',
    sunGlowColor: 'rgba(255, 255, 150, 0.3)',
    ambientLight: 1,
    cloudTint: 'rgba(255, 255, 255, 0)',
    mountainTint: 'rgba(100, 120, 150, 0.2)',
    starOpacity: 0,
    sunPosition: { x: 0.5, y: 0.1 },
  },
  sunset: {
    skyTop: '#2d1b4e',
    skyMiddle: '#ff6b6b',
    skyBottom: '#feca57',
    sunColor: 'rgba(255, 120, 50, 0.95)',
    sunGlowColor: 'rgba(255, 100, 80, 0.5)',
    ambientLight: 0.65,
    cloudTint: 'rgba(255, 150, 100, 0.4)',
    mountainTint: 'rgba(80, 50, 90, 0.5)',
    starOpacity: 0.4,
    sunPosition: { x: 0.85, y: 0.65 },
  },
  night: {
    skyTop: '#0a0a1a',
    skyMiddle: '#0d1033',
    skyBottom: '#1a1f4d',
    sunColor: 'rgba(200, 220, 255, 0.8)',
    sunGlowColor: 'rgba(150, 180, 255, 0.15)',
    ambientLight: 0.3,
    cloudTint: 'rgba(50, 60, 100, 0.5)',
    mountainTint: 'rgba(20, 25, 50, 0.6)',
    starOpacity: 1,
    sunPosition: { x: 0.85, y: 0.15 },
  },
};

/**
 * 在两个颜色值之间进行线性插值
 * @param color1 起始颜色（十六进制或rgba）
 * @param color2 结束颜色
 * @param t 插值因子 0-1
 */
function lerpColor(color1: string, color2: string, t: number): string {
  const parseColor = (color: string): number[] => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        1,
      ];
    } else if (color.startsWith('rgba')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
      if (match) {
        return [
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          match[4] ? parseFloat(match[4]) : 1,
        ];
      }
    }
    return [0, 0, 0, 1];
  };

  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  const a = c1[3] + (c2[3] - c1[3]) * t;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * 在两个 TimeColors 配置之间进行插值
 */
function lerpTimeColors(c1: TimeColors, c2: TimeColors, t: number): TimeColors {
  return {
    skyTop: lerpColor(c1.skyTop, c2.skyTop, t),
    skyMiddle: lerpColor(c1.skyMiddle, c2.skyMiddle, t),
    skyBottom: lerpColor(c1.skyBottom, c2.skyBottom, t),
    sunColor: lerpColor(c1.sunColor, c2.sunColor, t),
    sunGlowColor: lerpColor(c1.sunGlowColor, c2.sunGlowColor, t),
    ambientLight: c1.ambientLight + (c2.ambientLight - c1.ambientLight) * t,
    cloudTint: lerpColor(c1.cloudTint, c2.cloudTint, t),
    mountainTint: lerpColor(c1.mountainTint, c2.mountainTint, t),
    starOpacity: c1.starOpacity + (c2.starOpacity - c1.starOpacity) * t,
    sunPosition: {
      x: c1.sunPosition.x + (c2.sunPosition.x - c1.sunPosition.x) * t,
      y: c1.sunPosition.y + (c2.sunPosition.y - c1.sunPosition.y) * t,
    },
  };
}

/**
 * 根据时间值 (0-100) 计算当前的天空颜色配置
 * @param timeValue 时间值 0-100
 */
export function getTimeColors(timeValue: number): TimeColors {
  const normalizedTime = Math.max(0, Math.min(100, timeValue));
  const segment = normalizedTime / 33.33;
  const segmentIndex = Math.min(Math.floor(segment), 2);
  const t = segment - segmentIndex;

  const timeKeys = ['sunrise', 'noon', 'sunset', 'night'];
  const key1 = timeKeys[segmentIndex];
  const key2 = timeKeys[segmentIndex + 1];

  return lerpTimeColors(TIME_COLORS[key1], TIME_COLORS[key2], t);
}

/**
 * 获取当前时间段名称
 */
export function getTimeOfDayName(timeValue: number): string {
  if (timeValue < 25) return '日出';
  if (timeValue < 50) return '正午';
  if (timeValue < 75) return '日落';
  return '夜晚';
}

/**
 * 获取当前时间段类型
 */
export function getTimeOfDayType(timeValue: number): 'sunrise' | 'noon' | 'sunset' | 'night' {
  if (timeValue < 25) return 'sunrise';
  if (timeValue < 50) return 'noon';
  if (timeValue < 75) return 'sunset';
  return 'night';
}
