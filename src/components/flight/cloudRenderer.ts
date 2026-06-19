/**
 * 云层渲染器模块
 * 职责：管理和渲染云朵，支持密度配置（0-100）
 * - 根据密度参数动态生成/移除云朵
 * - 云朵具有多层视差效果
 * - 云朵颜色受环境光照影响
 */

import { Cloud } from '@/types/flight';
import { randomRange } from '@/utils/math';

/**
 * 初始化云朵数组
 * @param w 画布宽度
 * @param h 画布高度
 * @param density 云层密度 0-100
 */
export function initializeClouds(w: number, h: number, density: number): Cloud[] {
  const cloudCount = Math.floor(4 + (density / 100) * 28);
  const clouds: Cloud[] = [];

  for (let i = 0; i < cloudCount; i++) {
    clouds.push(createCloud(w, h, true));
  }

  return clouds;
}

/**
 * 创建单个云朵
 */
function createCloud(w: number, h: number, initial: boolean = false): Cloud {
  return {
    x: initial ? randomRange(-100, w + 100) : w + randomRange(50, 400),
    y: randomRange(30, h * 0.65),
    width: randomRange(80, 320),
    height: randomRange(30, 100),
    speed: randomRange(12, 45),
    opacity: randomRange(0.2, 0.75),
    puffCount: Math.floor(randomRange(3, 8)),
    layer: Math.floor(randomRange(0, 3)),
  };
}

/**
 * 根据密度调整云朵数量
 */
export function adjustCloudDensity(
  clouds: Cloud[],
  w: number,
  h: number,
  targetDensity: number
): Cloud[] {
  const targetCount = Math.floor(4 + (targetDensity / 100) * 28);
  const result = [...clouds];

  while (result.length < targetCount) {
    result.push(createCloud(w, h, false));
  }

  while (result.length > targetCount) {
    const removeIndex = Math.floor(Math.random() * result.length);
    result.splice(removeIndex, 1);
  }

  return result;
}

/**
 * 更新云朵位置（动画帧调用）
 * @param deltaTime 帧间隔时间
 * @param w 画布宽度
 * @param h 画布高度
 */
export function updateClouds(
  clouds: Cloud[],
  deltaTime: number,
  w: number,
  h: number
): void {
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i];
    const layerSpeedMult = 0.5 + cloud.layer * 0.35;
    cloud.x -= cloud.speed * layerSpeedMult * deltaTime;

    if (cloud.x < -cloud.width * 1.5) {
      const newCloud = createCloud(w, h, false);
      clouds[i] = newCloud;
    }
  }
}

/**
 * 渲染单朵云
 * @param ambientLight 环境光强度 (0-1)，影响云的颜色
 */
function renderSingleCloud(
  ctx: CanvasRenderingContext2D,
  cloud: Cloud,
  ambientLight: number
): void {
  ctx.save();
  ctx.globalAlpha = cloud.opacity * (0.6 + ambientLight * 0.4);

  const lightFactor = 0.5 + ambientLight * 0.5;
  const r = Math.floor(200 + 55 * lightFactor);
  const g = Math.floor(200 + 55 * lightFactor);
  const b = Math.floor(220 + 35 * lightFactor);
  const shadowR = Math.floor(150 * lightFactor);
  const shadowG = Math.floor(150 * lightFactor);
  const shadowB = Math.floor(180 * lightFactor + 20);

  const baseGradient = ctx.createRadialGradient(
    cloud.x,
    cloud.y + cloud.height * 0.2,
    0,
    cloud.x,
    cloud.y + cloud.height * 0.2,
    cloud.width * 0.55
  );
  baseGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
  baseGradient.addColorStop(0.35, `rgba(${r - 25}, ${g - 25}, ${b - 20}, 0.75)`);
  baseGradient.addColorStop(0.7, `rgba(${r - 55}, ${g - 55}, ${b - 45}, 0.35)`);
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
    puffGradient.addColorStop(0, `rgba(${r + 20}, ${g + 20}, ${b + 15}, 1)`);
    puffGradient.addColorStop(0.5, `rgba(${r - 10}, ${g - 10}, ${b - 5}, 0.7)`);
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
  bottomGradient.addColorStop(0.6, `rgba(${shadowR}, ${shadowG}, ${shadowB + 20}, 0.15)`);
  bottomGradient.addColorStop(1, `rgba(${shadowR - 20}, ${shadowG - 20}, ${shadowB}, 0.25)`);

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
 * 渲染所有云朵
 * @param ctx Canvas 2D 上下文
 * @param clouds 云朵数组
 * @param ambientLight 环境光强度 (0-1)
 */
export function renderClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  ambientLight: number
): void {
  const sortedClouds = [...clouds].sort((a, b) => a.layer - b.layer || a.y - b.y);

  for (const cloud of sortedClouds) {
    renderSingleCloud(ctx, cloud, ambientLight);
  }
}
