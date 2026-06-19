/**
 * 山脉渲染器模块
 * 职责：管理和渲染山脉，支持高度配置（0-100）
 * - 根据高度系数动态调整山脉高度
 * - 多层视差滚动效果
 * - 山脉颜色受环境光照和时间影响
 * - 支持雪顶效果
 */

import { Mountain } from '@/types/flight';

/**
 * 初始化山脉数组
 * @param w 画布宽度
 * @param h 画布高度
 * @param heightFactor 高度系数 0-100
 */
export function initializeMountains(w: number, h: number, heightFactor: number): Mountain[] {
  const mountains: Mountain[] = [];
  const mountainCount = 7;

  for (let i = 0; i < mountainCount; i++) {
    const baseHeight = h * (0.15 + i * 0.06);
    const baseWidth = w * (0.4 + Math.random() * 0.5);
    mountains.push({
      x: (i / (mountainCount - 1)) * w * 1.8 - w * 0.2,
      height: baseHeight,
      baseHeight: baseHeight,
      width: baseWidth,
      color: `hsl(${220 + i * 5}, ${15 + i * 3}%, ${8 + i * 4}%)`,
      parallaxSpeed: 12 + i * 10,
    });
  }

  return adjustMountainHeight(mountains, heightFactor, h);
}

/**
 * 根据高度系数调整山脉高度
 * @param heightFactor 0-100，50为基准高度
 */
export function adjustMountainHeight(
  mountains: Mountain[],
  heightFactor: number,
  h: number
): Mountain[] {
  const heightMultiplier = 0.4 + (heightFactor / 100) * 1.2;

  return mountains.map((m, i) => ({
    ...m,
    height: m.baseHeight * heightMultiplier,
  }));
}

/**
 * 更新山脉位置（视差滚动）
 */
export function updateMountains(
  mountains: Mountain[],
  offset: number,
  w: number
): void {
  for (const m of mountains) {
    const adjustedX = (m.x - offset * m.parallaxSpeed * 0.008) % (w * 2.2);
    m.x = adjustedX < -m.width * 1.2 ? adjustedX + w * 2.2 : adjustedX;
  }
}

/**
 * 根据时间和环境光调整山脉颜色
 */
function getMountainColor(
  baseHsl: string,
  ambientLight: number,
  timeValue: number,
  layerIndex: number
): { main: string; light: string; dark: string } {
  const hslMatch = baseHsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) {
    return { main: baseHsl, light: '#333', dark: '#111' };
  }

  const h = parseInt(hslMatch[1]);
  const s = parseInt(hslMatch[2]);
  const l = parseInt(hslMatch[3]);

  let warmShift = 0;
  let saturationShift = 0;
  let lightShift = 0;

  if (timeValue < 25) {
    const t = timeValue / 25;
    warmShift = (1 - t) * 15;
    saturationShift = (1 - t) * 10;
    lightShift = (1 - t) * 5;
  } else if (timeValue > 50 && timeValue < 75) {
    const t = (timeValue - 50) / 25;
    warmShift = t * 20;
    saturationShift = t * 15;
    lightShift = t * 5;
  } else if (timeValue >= 75) {
    warmShift = -10;
    saturationShift = -10;
    lightShift = -15;
  }

  const finalH = h + warmShift;
  const finalS = Math.max(5, Math.min(50, s + saturationShift + (1 - ambientLight) * -5));
  const finalL = Math.max(3, l + lightShift + (ambientLight - 0.5) * 15);
  const lightL = Math.min(60, finalL + 10);
  const darkL = Math.max(2, finalL - 12);

  return {
    main: `hsl(${finalH}, ${finalS}%, ${finalL}%)`,
    light: `hsl(${finalH + 5}, ${finalS}%, ${lightL}%)`,
    dark: `hsl(${finalH - 5}, ${finalS - 5}%, ${darkL}%)`,
  };
}

/**
 * 渲染所有山脉
 * @param ctx Canvas 2D 上下文
 * @param w 画布宽度
 * @param h 画布高度
 * @param mountains 山脉数组
 * @param ambientLight 环境光强度 0-1
 * @param timeValue 时间滑块值 0-100
 */
export function renderMountains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mountains: Mountain[],
  ambientLight: number,
  timeValue: number
): void {
  for (let i = mountains.length - 1; i >= 0; i--) {
    const m = mountains[i];
    const colors = getMountainColor(m.color, ambientLight, timeValue, i);

    ctx.save();

    const mtnGradient = ctx.createLinearGradient(
      m.x + m.width * 0.3,
      h - m.height,
      m.x + m.width * 0.5,
      h
    );
    mtnGradient.addColorStop(0, colors.light);
    mtnGradient.addColorStop(0.4, colors.main);
    mtnGradient.addColorStop(1, colors.dark);

    ctx.beginPath();
    ctx.moveTo(m.x, h);
    ctx.lineTo(m.x + m.width * 0.2, h - m.height * 0.4);
    ctx.quadraticCurveTo(
      m.x + m.width * 0.35,
      h - m.height * 0.7,
      m.x + m.width * 0.45,
      h - m.height
    );
    ctx.quadraticCurveTo(
      m.x + m.width * 0.55,
      h - m.height * 0.95,
      m.x + m.width * 0.65,
      h - m.height * 0.6
    );
    ctx.quadraticCurveTo(
      m.x + m.width * 0.8,
      h - m.height * 0.3,
      m.x + m.width,
      h
    );
    ctx.closePath();

    ctx.fillStyle = mtnGradient;
    ctx.fill();

    const snowLine = h - m.height * 0.85;
    if (m.height > h * 0.2) {
      const snowOpacity = ambientLight > 0.5 ? 0.35 : 0.15;
      ctx.beginPath();
      ctx.moveTo(m.x + m.width * 0.38, snowLine + m.height * 0.08);
      ctx.quadraticCurveTo(
        m.x + m.width * 0.5,
        h - m.height,
        m.x + m.width * 0.62,
        snowLine + m.height * 0.06
      );
      ctx.quadraticCurveTo(
        m.x + m.width * 0.53,
        snowLine + m.height * 0.02,
        m.x + m.width * 0.38,
        snowLine + m.height * 0.08
      );

      const snowGradient = ctx.createLinearGradient(
        m.x + m.width * 0.5,
        h - m.height,
        m.x + m.width * 0.5,
        snowLine + m.height * 0.1
      );
      snowGradient.addColorStop(0, `rgba(255, 255, 255, ${snowOpacity + 0.2})`);
      snowGradient.addColorStop(1, `rgba(255, 255, 255, ${snowOpacity})`);
      ctx.fillStyle = snowGradient;
      ctx.fill();
    }

    ctx.restore();
  }
}
