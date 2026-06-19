/**
 * 天空渲染模块
 * 职责：根据当前时间配色渲染天空背景、太阳/月亮、星星
 * 单一职责：仅负责天空背景渲染，与其他场景元素解耦
 */

import { SkyColors } from '@/types/flight';
import { getSkyColors } from './TimeOfDaySystem';

/**
 * 天空渲染器类
 * 封装天空渐变、天体、星星等渲染逻辑
 */
export class SkyRenderer {
  /** 画布宽度 */
  private width: number = 0;
  /** 画布高度 */
  private height: number = 0;
  /** 当前时间值 0-100 */
  private timeValue: number = 87.5;
  /** 星星位置缓存 */
  private stars: { x: number; y: number; size: number; phase: number }[] = [];

  /**
   * 初始化天空渲染器
   * @param width - 画布宽度
   * @param height - 画布高度
   * @param timeValue - 初始时间值
   */
  initialize(width: number, height: number, timeValue: number = 87.5): void {
    this.width = width;
    this.height = height;
    this.timeValue = timeValue;
    this.generateStars();
  }

  /**
   * 生成星星位置缓存
   * 使用黄金角分布算法产生自然的星星分布
   */
  private generateStars(): void {
    this.stars = [];
    const starCount = 120;
    for (let i = 0; i &lt; starCount; i++) {
      this.stars.push({
        x: (i * 137.5) % this.width,
        y: (i * 73.7) % (this.height * 0.5),
        size: 0.5 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * 设置当前时间值
   * @param timeValue - 时间值 0-100
   */
  setTimeValue(timeValue: number): void {
    this.timeValue = Math.max(0, Math.min(100, timeValue));
  }

  /**
   * 调整画布尺寸
   * @param width - 新宽度
   * @param height - 新高度
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.generateStars();
  }

  /**
   * 获取当前时间对应的天空配色
   */
  getSkyConfig(): SkyColors {
    return getSkyColors(this.timeValue);
  }

  /**
   * 获取当前时间的RGB着色值
   * 用于给其他场景元素（云层、山脉）提供时间色调
   */
  getTimeTint(): { r: number; g: number; b: number } {
    const colors = this.getSkyConfig();
    const hex = colors.middleColor.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  /**
   * 渲染完整天空
   * @param ctx - Canvas 2D上下文
   * @param time - 当前时间戳（用于星星闪烁动画）
   */
  render(ctx: CanvasRenderingContext2D, time: number): void {
    const colors = this.getSkyConfig();
    this.drawSkyGradient(ctx, colors);
    this.drawCelestialBody(ctx, colors);
    if (colors.showStars) {
      this.drawStars(ctx, colors, time);
    }
    this.drawAtmosphericFog(ctx, colors);
  }

  /**
   * 绘制天空渐变背景
   * @param ctx - Canvas 2D上下文
   * @param colors - 天空配色配置
   */
  private drawSkyGradient(ctx: CanvasRenderingContext2D, colors: SkyColors): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, colors.topColor);
    gradient.addColorStop(0.4, colors.middleColor);
    gradient.addColorStop(1, colors.bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制太阳或月亮
   * @param ctx - Canvas 2D上下文
   * @param colors - 天空配色配置
   */
  private drawCelestialBody(ctx: CanvasRenderingContext2D, colors: SkyColors): void {
    const sunX = this.width * colors.sunX;
    const sunY = this.height * colors.sunY;
    const sunRadius = this.width * 0.08;

    const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 4);
    glowGradient.addColorStop(0, colors.sunGlowColor);
    glowGradient.addColorStop(0.5, colors.sunGlowColor.replace(/[\d.]+\)$/, '0.1)'));
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const bodyGradient = ctx.createRadialGradient(
      sunX - sunRadius * 0.2,
      sunY - sunRadius * 0.2,
      0,
      sunX,
      sunY,
      sunRadius
    );
    bodyGradient.addColorStop(0, '#ffffff');
    bodyGradient.addColorStop(0.3, colors.sunColor);
    bodyGradient.addColorStop(1, colors.sunColor);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    if (this.timeValue &gt; 75) {
      ctx.fillStyle = 'rgba(200, 200, 220, 0.3)';
      ctx.beginPath();
      ctx.arc(sunX - sunRadius * 0.3, sunY - sunRadius * 0.1, sunRadius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX + sunRadius * 0.2, sunY + sunRadius * 0.2, sunRadius * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制星星
   * @param ctx - Canvas 2D上下文
   * @param colors - 天空配色配置
   * @param time - 当前时间戳
   */
  private drawStars(
    ctx: CanvasRenderingContext2D,
    colors: SkyColors,
    time: number
  ): void {
    for (let i = 0; i &lt; this.stars.length; i++) {
      const star = this.stars[i];
      const twinkle = 0.5 + 0.5 * Math.sin(time * 0.0015 + star.phase);
      const brightness = colors.starBrightness * (0.3 + twinkle * 0.7);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * (0.5 + twinkle * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制大气雾效
   * @param ctx - Canvas 2D上下文
   * @param colors - 天空配色配置
   */
  private drawAtmosphericFog(ctx: CanvasRenderingContext2D, colors: SkyColors): void {
    const fogGradient = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
    fogGradient.addColorStop(0, 'transparent');
    fogGradient.addColorStop(1, colors.fogColor);
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
