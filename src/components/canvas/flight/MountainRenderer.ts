/**
 * MountainRenderer.ts
 * --------------------------------------------
 * 单一职责：根据当前 palette 与山脉高度倍数，绘制带视差的远景山脉。
 * 不维护数据，山脉数据由调用方提供并管理。
 */

import { Mountain } from '@/types/flight';
import { TimeOfDayPalette } from './timeOfDay';

/**
 * 根据 palette 和山脉序号生成动态颜色。
 * 越靠后的山脉（i 越大）色调更深更冷，模拟大气透视。
 */
const computeMountainColor = (
  palette: TimeOfDayPalette,
  index: number
): string => {
  const { h, s, lBase } = palette.mountainHsl;
  const l = Math.min(80, lBase + index * 4);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/** 调亮 hsl 字符串中 lightness。 */
const lightenHsl = (hsl: string, amount: number): string => {
  const m = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%?,\s*(\d+(?:\.\d+)?)%?\)/);
  if (!m) return hsl;
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]);
  const l = Math.min(100, parseFloat(m[3]) + amount);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/** 调暗 hsl 字符串中 lightness。 */
const darkenHsl = (hsl: string, amount: number): string => {
  const m = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%?,\s*(\d+(?:\.\d+)?)%?\)/);
  if (!m) return hsl;
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]);
  const l = Math.max(0, parseFloat(m[3]) - amount);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * 绘制所有山脉。
 * @param ctx Canvas 上下文
 * @param mountains 山脉数据数组
 * @param w 画布宽度
 * @param h 画布高度
 * @param offset 视差偏移基准（一般传 timestamp）
 * @param heightScale 用户控制的山脉高度倍数（0.3~1.5）
 * @param palette 当前时段调色板
 */
export const drawMountains = (
  ctx: CanvasRenderingContext2D,
  mountains: Mountain[],
  w: number,
  h: number,
  offset: number,
  heightScale: number,
  palette: TimeOfDayPalette
): void => {
  // 从远到近绘制（数组末尾 → 索引大 → 远景）
  for (let i = mountains.length - 1; i >= 0; i--) {
    const m = mountains[i];
    // 应用用户高度倍数
    const scaledHeight = m.height * heightScale;
    const color = computeMountainColor(palette, i);

    // 横向视差滚动
    const x = (m.x - offset * m.parallaxSpeed * 0.01) % (w * 2);
    const adjustedX = x < -m.width ? x + w * 2 : x;

    ctx.save();

    // 山体主渐变
    const mtnGradient = ctx.createLinearGradient(
      adjustedX + m.width * 0.3,
      h - scaledHeight,
      adjustedX + m.width * 0.5,
      h
    );
    mtnGradient.addColorStop(0, lightenHsl(color, 10));
    mtnGradient.addColorStop(0.4, color);
    mtnGradient.addColorStop(1, darkenHsl(color, 20));

    ctx.beginPath();
    ctx.moveTo(adjustedX, h);
    ctx.lineTo(adjustedX + m.width * 0.25, h - scaledHeight * 0.5);
    ctx.quadraticCurveTo(
      adjustedX + m.width * 0.45,
      h - scaledHeight,
      adjustedX + m.width * 0.55,
      h - scaledHeight * 0.95
    );
    ctx.quadraticCurveTo(
      adjustedX + m.width * 0.7,
      h - scaledHeight * 0.7,
      adjustedX + m.width * 0.85,
      h - scaledHeight * 0.4
    );
    ctx.lineTo(adjustedX + m.width, h);
    ctx.closePath();

    ctx.fillStyle = mtnGradient;
    ctx.fill();

    // 雪顶（夜晚降低饱和度，让画面更柔和）
    const snowOpacity = 0.25 - palette.mountainHsl.lBase * 0.005;
    if (snowOpacity > 0.05) {
      const snowY = h - scaledHeight * 0.85;
      ctx.beginPath();
      ctx.moveTo(adjustedX + m.width * 0.42, snowY + scaledHeight * 0.1);
      ctx.quadraticCurveTo(
        adjustedX + m.width * 0.5,
        h - scaledHeight,
        adjustedX + m.width * 0.58,
        snowY + scaledHeight * 0.08
      );
      ctx.quadraticCurveTo(
        adjustedX + m.width * 0.52,
        snowY + scaledHeight * 0.05,
        adjustedX + m.width * 0.42,
        snowY + scaledHeight * 0.1
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, snowOpacity)})`;
      ctx.fill();
    }

    ctx.restore();
  }
};
