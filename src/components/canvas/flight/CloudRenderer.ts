import { Cloud, EnvironmentSettings } from '@/types/flight';
import { randomRange } from '@/utils/math';
import { getTimeColors } from './skyColors';

/**
 * CloudRenderer - 云层渲染器
 * 单一职责：负责云的生成、物理更新和渲染
 * 支持根据云层密度、高度、风速等环境参数动态调整
 */
export class CloudRenderer {
  private clouds: Cloud[] = [];
  private maxClouds = 25;
  private lastDensity = -1;
  private lastAltitude = -1;
  private lastWind = -1;

  /**
   * 初始化云层
   * @param width 画布宽度
   * @param height 画布高度
   * @param env 环境设置
   */
  initialize(width: number, height: number, env: EnvironmentSettings): void {
    this.clouds = [];
    const cloudCount = Math.floor((env.cloudDensity / 100) * this.maxClouds);

    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push(this.createCloud(width, height, env, true));
    }
    this.lastDensity = env.cloudDensity;
    this.lastAltitude = env.cloudAltitude;
    this.lastWind = env.windStrength;
  }

  /**
   * 创建单个云对象
   */
  private createCloud(
    width: number,
    height: number,
    env: EnvironmentSettings,
    initial: boolean = false
  ): Cloud {
    const altitudeOffset = (env.cloudAltitude / 100) * height * 0.2;
    const baseY = randomRange(50, height * 0.5) + altitudeOffset;

    return {
      x: initial ? randomRange(-100, width + 100) : width + randomRange(50, 300),
      y: baseY,
      width: randomRange(80, 300),
      height: randomRange(30, 90),
      speed: randomRange(15, 40) * (1 + env.windStrength / 100),
      opacity: randomRange(0.25, 0.7),
      puffCount: Math.floor(randomRange(3, 7)),
      layer: Math.floor(randomRange(0, 3)),
    };
  }

  /**
   * 更新云层状态
   * @param deltaTime 帧间隔时间
   * @param width 画布宽度
   * @param height 画布高度
   * @param env 环境设置
   */
  update(
    deltaTime: number,
    width: number,
    height: number,
    env: EnvironmentSettings
  ): void {
    const targetCount = Math.floor((env.cloudDensity / 100) * this.maxClouds);

    if (env.cloudDensity !== this.lastDensity) {
      while (this.clouds.length < targetCount) {
        this.clouds.push(this.createCloud(width, height, env));
      }
      while (this.clouds.length > targetCount) {
        this.clouds.pop();
      }
      this.lastDensity = env.cloudDensity;
    }

    const altitudeOffset = (env.cloudAltitude / 100) * height * 0.2;
    const windSpeedMultiplier = 1 + env.windStrength / 100;

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];

      cloud.x -= cloud.speed * windSpeedMultiplier * deltaTime;

      const targetY = (cloud.y + altitudeOffset);
      cloud.y += (targetY - cloud.y) * 0.02;

      if (cloud.x < -cloud.width - 100) {
        this.clouds[i] = this.createCloud(width, height, env);
      }
    }
  }

  /**
   * 渲染所有云层
   * @param ctx Canvas 2D 上下文
   * @param env 环境设置
   */
  render(ctx: CanvasRenderingContext2D, env: EnvironmentSettings): void {
    const timeColors = getTimeColors(env.timeOfDay);
    const sortedClouds = [...this.clouds].sort((a, b) => a.layer - b.layer);

    for (const cloud of sortedClouds) {
      this.drawCloud(ctx, cloud, timeColors.cloudTint);
    }

    if (env.fogDensity > 0) {
      this.drawFog(ctx, env);
    }
  }

  /**
   * 绘制单个云朵
   */
  private drawCloud(
    ctx: CanvasRenderingContext2D,
    cloud: Cloud,
    tintColor: string
  ): void {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;

    const baseGradient = ctx.createRadialGradient(
      cloud.x,
      cloud.y + cloud.height * 0.2,
      0,
      cloud.x,
      cloud.y + cloud.height * 0.2,
      cloud.width * 0.55
    );
    baseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    baseGradient.addColorStop(0.35, 'rgba(240, 240, 255, 0.8)');
    baseGradient.addColorStop(0.7, 'rgba(220, 220, 245, 0.4)');
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
      puffGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      puffGradient.addColorStop(0.5, 'rgba(245, 245, 255, 0.75)');
      puffGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = puffGradient;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tintColor !== 'rgba(255, 255, 255, 0)') {
      ctx.globalCompositeOperation = 'overlay';
      const tintGradient = ctx.createRadialGradient(
        cloud.x,
        cloud.y + cloud.height * 0.2,
        0,
        cloud.x,
        cloud.y + cloud.height * 0.2,
        cloud.width * 0.5
      );
      tintGradient.addColorStop(0, tintColor);
      tintGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = tintGradient;
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
      ctx.globalCompositeOperation = 'source-over';
    }

    const bottomGradient = ctx.createLinearGradient(
      cloud.x,
      cloud.y,
      cloud.x,
      cloud.y + cloud.height * 0.8
    );
    bottomGradient.addColorStop(0, 'transparent');
    bottomGradient.addColorStop(0.6, 'rgba(180, 180, 220, 0.15)');
    bottomGradient.addColorStop(1, 'rgba(150, 150, 200, 0.25)');

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
   * 绘制雾气效果
   */
  private drawFog(ctx: CanvasRenderingContext2D, env: EnvironmentSettings): void {
    const fogOpacity = env.fogDensity / 200;
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, `rgba(200, 210, 230, ${fogOpacity * 0.3})`);
    gradient.addColorStop(1, `rgba(180, 190, 220, ${fogOpacity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
