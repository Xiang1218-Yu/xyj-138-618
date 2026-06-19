/**
 * 云层系统模块
 * 职责：管理云层的生成、更新和渲染，支持密度配置
 * 单一职责：仅负责云层相关的所有逻辑，与其他环境系统解耦
 */

import { Cloud } from '@/types/flight';
import { randomRange } from '@/utils/math';

interface CloudData extends Cloud {
  /** 基础宽度 */
  baseWidth: number;
  /** 基础高度 */
  baseHeight: number;
  /** 基础速度 */
  baseSpeed: number;
  /** 基础不透明度 */
  baseOpacity: number;
}

/**
 * 云层管理类
 * 封装云层的创建、动画和渲染逻辑
 */
export class CloudSystem {
  /** 云层数组 */
  private clouds: CloudData[] = [];
  /** 画布宽度 */
  private width: number = 0;
  /** 画布高度 */
  private height: number = 0;
  /** 云层密度 0-100 */
  private density: number = 50;
  /** 是否初始化完成 */
  private initialized: boolean = false;
  /** 最大云层数量 */
  private readonly MAX_CLOUDS = 28;
  /** 最小云层数量 */
  private readonly MIN_CLOUDS = 4;

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
    const targetCount = Math.floor((this.density / 100) * (this.MAX_CLOUDS - this.MIN_CLOUDS)) + this.MIN_CLOUDS;
    this.clouds = [];

    for (let i = 0; i < targetCount; i++) {
      this.clouds.push(this.createCloudData(
        randomRange(-100, this.width + 100),
        randomRange(50, this.height * 0.65)
      ));
    }

    this.updateCloudScales();
  }

  /**
   * 创建单个云层数据对象
   * @param x - 初始X位置
   * @param y - 初始Y位置
   * @returns 新的CloudData对象
   */
  private createCloudData(x: number, y: number): CloudData {
    return {
      x,
      y,
      width: 0,
      height: 0,
      speed: 0,
      opacity: 0,
      puffCount: Math.floor(randomRange(3, 7)),
      layer: Math.floor(randomRange(0, 3)),
      baseWidth: randomRange(80, 300),
      baseHeight: randomRange(30, 90),
      baseSpeed: randomRange(15, 40),
      baseOpacity: randomRange(0.25, 0.7),
    };
  }

  /**
   * 根据当前密度更新所有云的实际属性
   * 只缩放大小/速度/透明度，不改变位置
   */
  private updateCloudScales(): void {
    const densityMultiplier = this.density / 100;
    const scale = 0.6 + densityMultiplier * 0.6;
    const speedScale = 0.5 + densityMultiplier * 0.8;
    const opacityScale = 0.4 + densityMultiplier * 0.8;

    for (const cloud of this.clouds) {
      cloud.width = cloud.baseWidth * scale;
      cloud.height = cloud.baseHeight * scale;
      cloud.speed = cloud.baseSpeed * speedScale;
      cloud.opacity = cloud.baseOpacity * opacityScale;
    }
  }

  /**
   * 设置云层密度（平滑调整，不重新生成）
   * @param density - 新的密度值 0-100
   */
  setDensity(density: number): void {
    this.density = Math.max(0, Math.min(100, density));
    this.updateCloudScales();
  }

  /**
   * 更新云层位置（动画帧调用）
   * @param deltaTime - 帧间隔时间（秒）
   */
  update(deltaTime: number): void {
    if (!this.initialized) return;

    const densityMultiplier = this.density / 100;
    const scale = 0.6 + densityMultiplier * 0.6;
    const speedScale = 0.5 + densityMultiplier * 0.8;
    const opacityScale = 0.4 + densityMultiplier * 0.8;

    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * deltaTime;
      if (cloud.x < -cloud.width - 50) {
        const newX = this.width + randomRange(0, 300);
        const newY = randomRange(50, this.height * 0.65);
        Object.assign(cloud, this.createCloudData(newX, newY));
        cloud.width = cloud.baseWidth * scale;
        cloud.height = cloud.baseHeight * scale;
        cloud.speed = cloud.baseSpeed * speedScale;
        cloud.opacity = cloud.baseOpacity * opacityScale;
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

    const sortedClouds = [...this.clouds].sort((a, b) => a.y - b.y);
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

    const tr = timeTint.r / 255;
    const tg = timeTint.g / 255;
    const tb = timeTint.b / 255;
    const tintedWhite = `rgb(${Math.round(255 * tr)}, ${Math.round(255 * tg)}, ${Math.round(255 * tb)})`;
    const tintedLight = `rgb(${Math.round(230 * tr)}, ${Math.round(230 * tg)}, ${Math.round(230 * tb)})`;
    const tintedMedium = `rgb(${Math.round(200 * tr)}, ${Math.round(200 * tg)}, ${Math.round(200 * tb)})`;

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

    for (let i = 0; i < cloud.puffCount; i++) {
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
    bottomGradient.addColorStop(0.6, `rgba(${Math.round(180 * tr)}, ${Math.round(180 * tg)}, ${Math.round(220 * tb)}, 0.15)`);
    bottomGradient.addColorStop(1, `rgba(${Math.round(150 * tr)}, ${Math.round(150 * tg)}, ${Math.round(200 * tb)}, 0.25)`);

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
