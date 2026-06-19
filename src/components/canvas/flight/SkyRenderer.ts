import { EnvironmentSettings } from '@/types/flight';
import { getTimeColors } from './skyColors';

/**
 * SkyRenderer - 天空渲染器
 * 单一职责：负责绘制天空背景、太阳/月亮、星星
 * 根据环境设置中的时间参数动态调整颜色和光照效果
 */
export class SkyRenderer {
  /**
   * 绘制完整天空场景
   * @param ctx Canvas 2D 上下文
   * @param width 画布宽度
   * @param height 画布高度
   * @param time 动画时间戳（用于星星闪烁）
   * @param env 环境设置
   */
  static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    env: EnvironmentSettings
  ): void {
    const timeColors = getTimeColors(env.timeOfDay);

    this.drawSkyGradient(ctx, width, height, timeColors);
    this.drawSun(ctx, width, height, timeColors, env);
    this.drawStars(ctx, width, height, time, timeColors, env);
  }

  /**
   * 绘制天空渐变背景
   */
  private static drawSkyGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: ReturnType<typeof getTimeColors>
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(0.4, colors.skyMiddle);
    gradient.addColorStop(1, colors.skyBottom);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * 绘制太阳/月亮及其光晕
   * 在夜晚时月亮使用冷色调
   */
  private static drawSun(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: ReturnType<typeof getTimeColors>,
    env: EnvironmentSettings
  ): void {
    const sunX = width * colors.sunPosition.x;
    const sunY = height * colors.sunPosition.y;
    const sunRadius = Math.min(width, height) * 0.08;

    const glowRadius = sunRadius * 6;
    const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowRadius);
    glowGradient.addColorStop(0, colors.sunGlowColor);
    glowGradient.addColorStop(0.4, colors.sunGlowColor.replace(/[\d.]+\)$/, '0.15)'));
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, colors.sunColor);
    sunGradient.addColorStop(0.7, colors.sunColor.replace(/[\d.]+\)$/, '0.8)'));
    sunGradient.addColorStop(1, colors.sunColor.replace(/[\d.]+\)$/, '0.4)'));

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    const isNight = env.timeOfDay >= 75;
    if (isNight) {
      this.drawMoonCrater(ctx, sunX - sunRadius * 0.3, sunY - sunRadius * 0.2, sunRadius * 0.15);
      this.drawMoonCrater(ctx, sunX + sunRadius * 0.25, sunY + sunRadius * 0.3, sunRadius * 0.12);
      this.drawMoonCrater(ctx, sunX - sunRadius * 0.1, sunY + sunRadius * 0.35, sunRadius * 0.08);
    }
  }

  /**
   * 绘制月球陨石坑（仅夜晚时）
   */
  private static drawMoonCrater(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ): void {
    ctx.fillStyle = 'rgba(180, 190, 220, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制闪烁的星星
   * 星星可见度受环境设置和时间共同影响
   */
  private static drawStars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    colors: ReturnType<typeof getTimeColors>,
    env: EnvironmentSettings
  ): void {
    const starOpacity = (colors.starOpacity * env.starVisibility) / 100;
    if (starOpacity <= 0) return;

    const starCount = Math.floor(120 * (env.starVisibility / 100));
    const seed = 12345;

    for (let i = 0; i < starCount; i++) {
      const pseudoRandom = ((seed * (i + 1) * 7919) % 10000) / 10000;
      const sx = pseudoRandom * width;
      const sy = (((seed * (i + 1) * 6271) % 10000) / 10000) * height * 0.5;

      const twinkleSpeed = 0.001 + (i % 5) * 0.0005;
      const twinkle = 0.5 + 0.5 * Math.sin(time * twinkleSpeed + i * 0.7);
      const baseSize = 0.5 + (i % 3) * 0.4;
      const size = baseSize * (0.7 + twinkle * 0.6);

      const brightness = 0.4 + twinkle * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * starOpacity})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();

      if (i % 8 === 0 && size > 1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * starOpacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx - size * 2, sy);
        ctx.lineTo(sx + size * 2, sy);
        ctx.moveTo(sx, sy - size * 2);
        ctx.lineTo(sx, sy + size * 2);
        ctx.stroke();
      }
    }
  }
}
