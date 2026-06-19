/**
 * 云层系统模块
 * 职责：管理云层的生成、更新和渲染，支持密度配置
 * 单一职责：仅负责云层相关的所有逻辑，与其他环境系统解耦
 */

import { Cloud } from '@/types/flight';
import { randomRange } from '@/utils/math';

/**
 * 云层管理类
 * 封装云层的创建、动画和渲染逻辑
 */
export class CloudSystem {
  /** 云层数组 */
  private clouds: Cloud[] = [];
  /** 画布宽度 */
  private width: number = 0;
  /** 画布高度 */
  private height: number = 0;
  /** 云层密度 0-100 */
  private density: number = 50;
  /** 是否初始化完成 */
  private initialized: boolean = false;

  /**
   * 初始化云层系统
   * 根据画布尺寸和密度生成初始云层
   * @param width - 画布宽度
   * @param height - 画布高度
   * @param density - 初始云层密度 0-100
   */
  initialize(width: number, height: number, density: number = 50): void {
    this.width = width;
    this.height = height;
    this.density = density;
    this.generateClouds();
    this.initialized = true;
  }

  /**
   * 根据当前密度生成云层
   * 密度决定云层数量和透明度
   */
  private generateClouds(): void {
    const baseCount = Math.floor((this.density / 100) * 24) + 4;
    this.clouds = [];

    for (let i = 0; i &lt; baseCount; i++) {
      this.clouds.push(this.createCloud(
        randomRange(-100, this.width + 100),
        randomRange(50, this.height * 0.65)
      ));
    }
  }

  /**
   * 创建单个云层对象
   * @param x - 初始X位置
   * @param y - 初始Y位置
   * @returns 新的Cloud对象
   */
  private createCloud(x: number, y: number): Cloud {
    const densityMultiplier = this.density / 100;
    return {
      x,
      y,
      width: randomRange(80, 300) * (0.6 + densityMultiplier * 0.6),
      height: randomRange(30, 90) * (0.6 + densityMultiplier * 0.6),
      speed: randomRange(15, 40) * (0.5 + densityMultiplier * 0.8),
      opacity: randomRange(0.25, 0.7) * (0.4 + densityMultiplier * 0.8),
      puffCount: Math.floor(randomRange(3, 7)),
      layer: Math.floor(randomRange(0, 3)),
    };
  }

  /**
   * 更新云层密度并重新生成云层
   * @param density - 新的密度值 0-100
   */
  setDensity(density: number): void {
    this.density = Math.max(0, Math.min(100, density));
    this.generateClouds();
  }

  /**
   * 更新云层位置（动画帧调用）
   * @param deltaTime - 帧间隔时间（秒）
   */
  update(deltaTime: number): void {
    if (!this.initialized) return;

    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * deltaTime;
      if (cloud.x &lt; -cloud.width - 50) {
        const newX = this.width + randomRange(0, 300);
        const newY = randomRange(50, this.height * 0.65);
        Object.assign(cloud, this.createCloud(newX, newY));
      }
    }
  }

  /**
   * 调整画布尺寸
   * @param width - 新宽度
   * @param height - 新高度
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * 渲染所有云层
   * @param ctx - Canvas 2D上下文
   * @param timeTint - 时间着色（用于夜晚/黄昏时云层颜色变化）
   */
  render(ctx: CanvasRenderingContext2D, timeTint: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }): void {
    if (!this.initialized) return;

    const sortedClouds = [...this.clouds].sort((a, b) =&gt; a.y - b.y);
    for (const cloud of sortedClouds) {
      this.drawCloud(ctx, cloud, timeTint);
    }
  }

  /**
   * 绘制单个云层
   * @param ctx - Canvas 2D上下文
   * @param cloud - 要绘制的云层对象
   * @param timeTint - 时间着色
   */
  private drawCloud(
    ctx: CanvasRenderingContext2D,
    cloud: Cloud,
    timeTint: { r: number; g: number; b: number }
  ): void {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;

    const tintedWhite = `rgb(${Math.round(255 * timeTint.r / 255)}, ${Math.round(255 * timeTint.g / 255)}, ${Math.round(255 * timeTint.b / 255)})`;
    const tintedLight = `rgb(${Math.round(230 * timeTint.r / 255)}, ${Math.round(230 * timeTint.g / 255)}, ${Math.round(255 * timeTint.b / 255)})`;
    const tintedMedium = `rgb(${Math.round(200 * timeTint.r / 255)}, ${Math.round(200 * timeTint.g / 255)}, ${Math.round(255 * timeTint.b / 255)})`;

    const baseGradient = ctx.createRadialGradient(
      cloud.x,
      cloud.y + cloud.height * 0.2,
      0,
      cloud.x,
      cloud.y + cloud.height * 0.2,
      cloud.width * 0.55
    );
    baseGradient.addColorStop(0, tintedWhite);
    baseGradient.addColorStop(0.35, tintedLight);
    baseGradient.addColorStop(0.7, tintedMedium);
    baseGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(
      cloud.x,
      cloud.y + cloud.height * 0.3,
      cloud.width * 0.5,
      cloud.height * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    for (let i = 0; i &lt; cloud.puffCount; i++) {
      const angle = (i / cloud.puffCount) * Math.PI * 1.6 - Math.PI * 0.8;
      const dist = cloud.width * 0.22 + Math.sin(i * 1.3) * cloud.width * 0.08;
      const px = cloud.x + Math.cos(angle) * dist;
      const py = cloud.y + Math.sin(angle) * dist * 0.45;
      const size = cloud.height * (0.45 + Math.sin(i * 1.8 + 0.5) * 0.3);

      const puffGradient = ctx.createRadialGradient(px, py - size * 0.2, 0, px, py, size);
      puffGradient.addColorStop(0, tintedWhite);
      puffGradient.addColorStop(0.5, tintedLight);
      puffGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = puffGradient;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const bottomGradient = ctx.createLinearGradient(
      cloud.x,
      cloud.y,
      cloud.x,
      cloud.y + cloud.height * 0.8
    );
    bottomGradient.addColorStop(0, 'transparent');
    bottomGradient.addColorStop(0.6, `rgba(${Math.round(180 * timeTint.r / 255)}, ${Math.round(180 * timeTint.g / 255)}, ${Math.round(220 * timeTint.b / 255)}, 0.15)`);
    bottomGradient.addColorStop(1, `rgba(${Math.round(150 * timeTint.r / 255)}, ${Math.round(150 * timeTint.g / 255)}, ${Math.round(200 * timeTint.b / 255)}, 0.25)`);

    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.ellipse(
      cloud.x,
      cloud.y + cloud.height * 0.4,
      cloud.width * 0.45,
      cloud.height * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  /**
   * 获取当前云层密度
   */
  getDensity(): number {
    return this.density;
  }

  /**
   * 获取云层数组（用于外部引用）
   */
  getClouds(): Cloud[] {
    return this.clouds;
  }

  /**
   * 重置云层系统
   */
  reset(): void {
    this.generateClouds();
  }
}
