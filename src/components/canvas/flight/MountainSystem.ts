/**
 * 山脉系统模块
 * 职责：管理山脉的生成、视差滚动和渲染，支持高度配置
 * 单一职责：仅负责山脉相关的所有逻辑，与其他环境系统解耦
 */

import { Mountain } from '@/types/flight';
import { randomRange } from '@/utils/math';
import { lightenColor, darkenColor, hslToHex, hexToRgb, rgbToHex } from '@/utils/colors';

interface MountainData extends Mountain {
  /** 基础高度随机比例 0.7-1.2 */
  baseHeightRatio: number;
  /** 所在层索引 */
  layerIndex: number;
}

/**
 * 山脉管理类
 * 封装多层视差山脉的创建、滚动和渲染逻辑
 */
export class MountainSystem {
  /** 多层山脉数据（远到近） */
  private mountains: MountainData[][] = [];
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
   * 每层山脉有不同的颜色、基础高度和视差速度
   * 随机种子在初始化时固定，后续调节高度只进行缩放
   */
  private generateMountains(): void {
    this.mountains = [];

    for (let layer = 0; layer < this.LAYER_COUNT; layer++) {
      const layerMountains: MountainData[] = [];
      const layerDepth = layer / this.LAYER_COUNT;
      const layerBaseHeight = this.height * (0.15 + layerDepth * 0.35);
      const mountainCount = 4 + layer * 2;

      for (let i = 0; i < mountainCount; i++) {
        const hue = 220 + layer * 8 + i * 3;
        const saturation = 20 + layer * 5;
        const lightness = 8 + layer * 6 + i * 2;
        layerMountains.push({
          x: (i / mountainCount) * this.width * 2 - this.width * 0.3,
          height: 0,
          width: this.width * randomRange(0.4, 0.8),
          color: hslToHex(hue, saturation, lightness),
          parallaxSpeed: 8 + layer * 15,
          baseHeightRatio: randomRange(0.7, 1.2),
          layerIndex: layer,
        });
      }
      this.mountains.push(layerMountains);
    }

    this.updateMountainHeights();
  }

  /**
   * 根据当前heightMultiplier更新所有山脉的实际高度
   * 只进行缩放，不改变位置和形状比例
   */
  private updateMountainHeights(): void {
    const heightFactor = 0.4 + (this.heightMultiplier / 100) * 0.8;

    for (let layer = 0; layer < this.LAYER_COUNT; layer++) {
      const layerDepth = layer / this.LAYER_COUNT;
      const layerBaseHeight = this.height * (0.15 + layerDepth * 0.35) * heightFactor;

      for (const mountain of this.mountains[layer]) {
        mountain.height = layerBaseHeight * mountain.baseHeightRatio;
      }
    }
  }

  /**
   * 设置山脉高度系数（仅缩放高度，不重新生成位置形状）
   * @param multiplier - 高度系数 0-100
   */
  setHeightMultiplier(multiplier: number): void {
    this.heightMultiplier = Math.max(0, Math.min(100, multiplier));
    this.updateMountainHeights();
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

    for (let layer = 0; layer < this.mountains.length; layer++) {
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
    const adjustedX = x < -mountain.width ? x + this.width * 2.5 : x;

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

    if (layer >= this.LAYER_COUNT - 2 && mountain.height > this.height * 0.3) {
      const snowY = this.height - mountain.height * 0.85;
      const tr = timeTint.r / 255;
      const tg = timeTint.g / 255;
      const tb = timeTint.b / 255;
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
      ctx.fillStyle = `rgba(${Math.round(255 * tr)}, ${Math.round(255 * tg)}, ${Math.round(255 * tb)}, 0.25)`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 对颜色应用时间着色
   * @param baseColor - 基础hex颜色字符串
   * @param tint - 着色RGB
   * @param depth - 深度系数，影响着色强度
   * @returns 着色后的hex颜色
   */
  private applyTint(
    baseColor: string,
    tint: { r: number; g: number; b: number },
    depth: number
  ): string {
    const baseRgb = hexToRgb(baseColor);
    const tintStrength = 0.15 * (1 - depth);
    const tr = baseRgb.r + (tint.r - baseRgb.r) * tintStrength;
    const tg = baseRgb.g + (tint.g - baseRgb.g) * tintStrength;
    const tb = baseRgb.b + (tint.b - baseRgb.b) * tintStrength;
    return rgbToHex(tr, tg, tb);
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
