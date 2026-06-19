/**
 * CloudRenderer.ts
 * --------------------------------------------
 * 单一职责：管理云朵的初始化、更新（位置/数量调整）以及绘制。
 * 将云层逻辑从 FlightSimulator 主组件中拆分出来，便于复用与测试。
 */

import { Cloud } from '@/types/flight';
import { randomRange } from '@/utils/math';
import { TimeOfDayPalette } from './timeOfDay';

/** 云朵基础容量（cloudDensity = 1 时的云朵数量） */
const MAX_CLOUDS = 28;

/**
 * 创建一朵随机云。
 * @param w 画布宽度
 * @param h 画布高度
 * @param x 可选指定 x 坐标，默认随机
 */
const createCloud = (w: number, h: number, x?: number): Cloud => ({
  x: x ?? randomRange(-100, w + 100),
  y: randomRange(50, h * 0.6),
  width: randomRange(80, 300),
  height: randomRange(30, 90),
  speed: randomRange(15, 40),
  opacity: randomRange(0.25, 0.7),
  puffCount: Math.floor(randomRange(3, 7)),
  layer: Math.floor(randomRange(0, 3)),
});

/**
 * 根据云层密度生成初始云朵数组。
 * @param density 0~1，0 时仅 2 朵，1 时 MAX_CLOUDS 朵
 */
export const initClouds = (w: number, h: number, density: number): Cloud[] => {
  const target = clampedCloudCount(density);
  const arr: Cloud[] = [];
  for (let i = 0; i < target; i++) {
    arr.push(createCloud(w, h));
  }
  return arr;
};

/**
 * 根据当前密度同步云朵数量（实时调整）。
 * 当用户拉动 cloudDensity 滑块时，调用此方法动态增删云朵。
 */
export const syncCloudDensity = (
  clouds: Cloud[],
  w: number,
  h: number,
  density: number
): void => {
  const target = clampedCloudCount(density);
  // 不足则补充
  while (clouds.length < target) {
    clouds.push(createCloud(w, h, w + randomRange(0, 300)));
  }
  // 超出则裁剪（移除最远端的云朵，避免突兀）
  if (clouds.length > target) {
    clouds.length = target;
  }
};

/** 计算给定密度对应的目标云朵数量。 */
const clampedCloudCount = (density: number): number => {
  const d = Math.max(0, Math.min(1, density));
  return Math.round(2 + d * (MAX_CLOUDS - 2));
};

/**
 * 更新单朵云的位置（向左飘动），并在飘出边界时循环重置。
 */
export const updateClouds = (
  clouds: Cloud[],
  deltaTime: number,
  w: number,
  h: number
): void => {
  for (const cloud of clouds) {
    cloud.x -= cloud.speed * deltaTime;
    if (cloud.x < -cloud.width) {
      cloud.x = w + randomRange(0, 300);
      cloud.y = randomRange(50, h * 0.6);
      cloud.width = randomRange(80, 300);
      cloud.height = randomRange(30, 90);
      cloud.speed = randomRange(15, 40);
      cloud.opacity = randomRange(0.25, 0.7);
    }
  }
};

/**
 * 绘制全部云朵，按 y 坐标从远到近排序避免穿插。
 * 颜色受 palette.cloudTint / cloudShadow 控制，使其在不同时间呈现不同质感。
 */
export const drawClouds = (
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  palette: TimeOfDayPalette
): void => {
  // 拷贝后排序，避免污染原数组
  const sorted = [...clouds].sort((a, b) => a.y - b.y);
  for (let i = sorted.length - 1; i >= 0; i--) {
    drawSingleCloud(ctx, sorted[i], palette);
  }
};

/**
 * 绘制单朵云（蓬松质感 = 主体椭圆 + 多团云絮 + 底部阴影）。
 */
const drawSingleCloud = (
  ctx: CanvasRenderingContext2D,
  cloud: Cloud,
  palette: TimeOfDayPalette
): void => {
  ctx.save();
  ctx.globalAlpha = cloud.opacity;

  // 主体椭圆：使用 palette.cloudTint 作为高光色
  const baseGradient = ctx.createRadialGradient(
    cloud.x,
    cloud.y + cloud.height * 0.2,
    0,
    cloud.x,
    cloud.y + cloud.height * 0.2,
    cloud.width * 0.55
  );
  baseGradient.addColorStop(0, palette.cloudTint);
  baseGradient.addColorStop(0.35, addAlphaToColor(palette.cloudTint, 0.75));
  baseGradient.addColorStop(0.7, addAlphaToColor(palette.cloudTint, 0.35));
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

  // 多团云絮
  for (let i = 0; i < cloud.puffCount; i++) {
    const angle = (i / cloud.puffCount) * Math.PI * 1.6 - Math.PI * 0.8;
    const dist = cloud.width * 0.22 + Math.sin(i * 1.3) * cloud.width * 0.08;
    const px = cloud.x + Math.cos(angle) * dist;
    const py = cloud.y + Math.sin(angle) * dist * 0.45;
    const size = cloud.height * (0.45 + Math.sin(i * 1.8 + 0.5) * 0.3);

    const puffGradient = ctx.createRadialGradient(
      px,
      py - size * 0.2,
      0,
      px,
      py,
      size
    );
    puffGradient.addColorStop(0, palette.cloudTint);
    puffGradient.addColorStop(0.5, addAlphaToColor(palette.cloudTint, 0.7));
    puffGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = puffGradient;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 底部阴影
  const bottomGradient = ctx.createLinearGradient(
    cloud.x,
    cloud.y,
    cloud.x,
    cloud.y + cloud.height * 0.8
  );
  bottomGradient.addColorStop(0, 'transparent');
  bottomGradient.addColorStop(0.6, addAlphaToColor(palette.cloudShadow, 0.6));
  bottomGradient.addColorStop(1, palette.cloudShadow);

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
};

/** 将 rgba 字符串中的 alpha 替换为指定值。 */
const addAlphaToColor = (color: string, alpha: number): string => {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
};
