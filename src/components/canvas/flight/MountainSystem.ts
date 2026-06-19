/**
 * 山脉系统模块
 * 职责：管理山脉的生成、视差滚动和渲染，支持高度配置
 * 单一职责：仅负责山脉相关的所有逻辑，与其他环境系统解耦
 */

import { Mountain } from '@/types/flight';
import { randomRange } from '@/utils/math';
import { lightenColor, darkenColor } from '@/utils/colors';

/**
 * 山脉管理类
 * 封装多层视差山脉的创建、滚动和渲染逻辑
 */
export class MountainSystem {
  /** 多层山脉数组（远到近） */
  private mountains: Mountain[][] = [];
  /** 画布宽度 */
  private width: number = 0;
  /** 画布高度 */
  private height: number = 0;
  /** 山脉高度系数 0-100 */
  private heightMultiplier: number = 50;
  /** 视差滚动偏移量 */
  private scrollOffset: number = 0;
  /** 是否初始化完成 */
  private initialized: boolean = false;
  /** 山脉层数 */
  private readonly LAYER_COUNT = 5;

  /**
   * 初始化山脉系统
   * @param width - 画布宽度
   * @param height - 画布高度
   * @param heightMultiplier - 初始高度系数 0-100
   */
  initialize(width: number, height: number, heightMultiplier: number = 50): void {
    this.width = width;
    this.height = height;
    this.heightMultiplier = heightMultiplier;
    this.generateMountains();
    this.initialized = true;
  }

  /**
   * 生成多层视差山脉
   * 每层山脉有不同的颜色、高度和视差速度
   */
  private generateMountains(): void {
    this.mountains = [];
    const heightFactor = 0.4 + (this.heightMultiplier / 100) * 0.8;

    for (let layer = 0; layer &lt; this.LAYER_COUNT; layer++) {
      const layerMountains: Mountain[] = [];
      const layerDepth = layer / this.LAYER_COUNT;
      const baseHeight = this.height * (0.15 + layerDepth * 0.35) * heightFactor;
      const mountainCount = 4 + layer * 2;

      for (let i = 0; i &lt; mountainCount; i++) {
        const hue = 220 + layer * 8 + i * 3;
        const lightness = 8 + layer * 6 + i * 2;
        layerMountains.push({
          x: (i / mountainCount) * this.width * 2 - this.width * 0.3,
          height: baseHeight * randomRange(0.7, 1.2),
          width: this.width * randomRange(0.4, 0.8),
          color: `hsl(${hue}, ${20 + layer * 5}%, ${lightness}%)`,
          parallaxSpeed: 8 + layer * 15,
        });
      }
      this.mountains.push(layerMountains);
    }
  }

  /**
   * 设置山脉高度系数并重新生成
   * @param multiplier - 高度系数 0-100
   */
  setHeightMultiplier(multiplier: number): void {
    this.heightMultiplier = Math.max(0, Math.min(100, multiplier));
    this.generateMountains();
  }

  /**
   * 更新山脉视差滚动位置
   * @param deltaTime - 帧间隔时间（秒）
   * @param flightSpeed - 飞行速度，影响滚动速度
   */
  update(deltaTime: number, flightSpeed: number = 1): void {
    if (!this.initialized) return;
    this.scrollOffset += deltaTime * flightSpeed * 60;
  }

  /**
   * 调整画布尺寸
   * @param width - 新宽度
   * @param height - 新高度
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.generateMountains();
  }

  /**
   * 渲染所有山脉层
   * 从远到近绘制，产生正确的遮挡关系
   * @param ctx - Canvas 2D上下文
   * @param timeTint - 时间着色（用于不同时段的山脉颜色）
   */
  render(
    ctx: CanvasRenderingContext2D,
    timeTint: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }
  ): void {
    if (!this.initialized) return;

    for (let layer = 0; layer &lt; this.mountains.length; layer++) {
      for (const mountain of this.mountains[layer]) {
        this.drawMountain(ctx, mountain, layer, timeTint);
      }
    }
  }

  /**
   * 绘制单个山脉
   * @param ctx - Canvas 2D上下文
   * @param mountain - 山脉数据
   * @param layer - 所在层索引
   * @param timeTint - 时间着色
   */
  private drawMountain(
    ctx: CanvasRenderingContext2D,
    mountain: Mountain,
    layer: number,
    timeTint: { r: number; g: number; b: number }
  ): void {
    const x = (mountain.x - this.scrollOffset * mountain.parallaxSpeed * 0.01) % (this.width * 2.5);
    const adjustedX = x &lt; -mountain.width ? x + this.width * 2.5 : x;

    ctx.save();

    const tintedColor = this.applyTint(mountain.color, timeTint, layer / this.LAYER_COUNT);

    const mtnGradient = ctx.createLinearGradient(
      adjustedX + mountain.width * 0.3,
      this.height - mountain.height,
      adjustedX + mountain.width * 0.5,
      this.height
    );
    mtnGradient.addColorStop(0, lightenColor(tintedColor, 10));
    mtnGradient.addColorStop(0.4, tintedColor);
    mtnGradient.addColorStop(1, darkenColor(tintedColor, 20));

    ctx.beginPath();
    ctx.moveTo(adjustedX, this.height);
    ctx.lineTo(adjustedX + mountain.width * 0.25, this.height - mountain.height * 0.5);
    ctx.quadraticCurveTo(
      adjustedX + mountain.width * 0.45,
      this.height - mountain.height,
      adjustedX + mountain.width * 0.55,
      this.height - mountain.height * 0.95
    );
    ctx.quadraticCurveTo(
      adjustedX + mountain.width * 0.7,
      this.height - mountain.height * 0.7,
      adjustedX + mountain.width * 0.85,
      this.height - mountain.height * 0.4
    );
    ctx.lineTo(adjustedX + mountain.width, this.height);
    ctx.closePath();

    ctx.fillStyle = mtnGradient;
    ctx.fill();

    if (layer &gt;= this.LAYER_COUNT - 2 &amp;&amp; mountain.height &gt; this.height * 0.3) {
      const snowY = this.height - mountain.height * 0.85;
      ctx.beginPath();
      ctx.moveTo(adjustedX + mountain.width * 0.42, snowY + mountain.height * 0.1);
      ctx.quadraticCurveTo(
        adjustedX + mountain.width * 0.5,
        this.height - mountain.height,
        adjustedX + mountain.width * 0.58,
        snowY + mountain.height * 0.08
      );
      ctx.quadraticCurveTo(
        adjustedX + mountain.width * 0.52,
        snowY + mountain.height * 0.05,
        adjustedX + mountain.width * 0.42,
        snowY + mountain.height * 0.1
      );
      ctx.fillStyle = `rgba(${Math.round(255 * timeTint.r / 255)}, ${Math.round(255 * timeTint.g / 255)}, ${Math.round(255 * timeTint.b / 255)}, 0.25)`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 对颜色应用时间着色
   * @param baseColor - 基础HSL颜色字符串
   * @param tint - 着色RGB
   * @param depth - 深度系数，影响着色强度
   * @returns 着色后的HSL颜色
   */
  private applyTint(
    baseColor: string,
    tint: { r: number; g: number; b: number },
    depth: number
  ): string {
    const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) return baseColor;

    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    let l = parseInt(hslMatch[3]);

    const tintStrength = 0.15 * (1 - depth);
    const avgTint = (tint.r + tint.g + tint.b) / 3;
    l = l + (avgTint - 128) / 255 * tintStrength * 20;
    l = Math.max(0, Math.min(100, l));

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  /**
   * 获取当前高度系数
   */
  getHeightMultiplier(): number {
    return this.heightMultiplier;
  }

  /**
   * 重置山脉系统
   */
  reset(): void {
    this.scrollOffset = 0;
    this.generateMountains();
  }
}
