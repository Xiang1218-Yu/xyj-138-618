/**
 * SkyRenderer.ts
 * --------------------------------------------
 * 单一职责：根据当前 palette 在 Canvas 上绘制天空背景。
 * 包含：
 *   - 垂直渐变天空
 *   - 太阳/月亮光晕
 *   - 星空（夜晚 / 黄昏）
 * 不处理云层、山脉、飞行器等其它元素。
 */

import { TimeOfDayPalette } from './timeOfDay';

/**
 * 绘制完整的天空层（背景渐变 + 光晕 + 星星）。
 * @param ctx Canvas 2D 上下文
 * @param w 画布宽度
 * @param h 画布高度
 * @param palette 当前时间对应的颜色配置
 * @param time 时间戳，用于星星闪烁动画
 */
export const drawSky = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: TimeOfDayPalette,
  time: number
): void => {
  // 1) 天空垂直渐变
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  palette.sky.forEach((color, i) => {
    sky.addColorStop(i / (palette.sky.length - 1), color);
  });
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // 2) 太阳/月亮光晕
  const sunX = w * palette.sunPosition.x;
  const sunY = h * palette.sunPosition.y;
  const sunRadius = Math.max(w, h) * 0.6;
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
  palette.sunGlow.forEach((color, i) => {
    sunGradient.addColorStop(i / (palette.sunGlow.length - 1), color);
  });
  ctx.fillStyle = sunGradient;
  ctx.fillRect(0, 0, w, h);

  // 3) 太阳/月亮本体
  drawSunOrMoon(ctx, sunX, sunY, palette);

  // 4) 星空
  if (palette.showStars && palette.starOpacity > 0.01) {
    drawStars(ctx, w, h, palette.starOpacity, time);
  }
};

/**
 * 绘制太阳或月亮主体。
 * 通过 starOpacity 判断是太阳还是月亮：starOpacity 越高越像月亮（夜晚）。
 */
const drawSunOrMoon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: TimeOfDayPalette
): void => {
  const isMoon = palette.starOpacity > 0.7;
  const radius = isMoon ? 28 : 32;

  ctx.save();
  ctx.shadowColor = palette.sunGlow[0];
  ctx.shadowBlur = isMoon ? 25 : 60;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  if (isMoon) {
    grad.addColorStop(0, 'rgba(245, 245, 255, 1)');
    grad.addColorStop(0.7, 'rgba(220, 225, 245, 0.95)');
    grad.addColorStop(1, 'rgba(180, 195, 230, 0.4)');
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
    grad.addColorStop(0.5, 'rgba(255, 220, 160, 0.95)');
    grad.addColorStop(1, 'rgba(255, 170, 100, 0.6)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/**
 * 用确定性伪随机分布绘制星空，使闪烁不会因每帧重新生成而抖动。
 */
const drawStars = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opacity: number,
  time: number
): void => {
  const stars = 120;
  for (let i = 0; i < stars; i++) {
    const sx = (i * 137.5) % w;
    const sy = (i * 73.7) % (h * 0.55);
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.0015 + i * 0.7);
    const finalOpacity = (0.25 + twinkle * 0.55) * opacity;
    ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5 + twinkle * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * 在画面顶层叠加一层环境氛围色（如夜晚的冷蓝、日出的暖橙）。
 * 应在所有场景元素绘制完毕之后调用。
 */
export const drawAmbientOverlay = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: TimeOfDayPalette
): void => {
  if (palette.ambientOpacity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = palette.ambient;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
};
