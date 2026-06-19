import { Mountain, EnvironmentSettings } from '@/types/flight';
import { randomRange } from '@/utils/math';
import { lightenColor, darkenColor } from '@/utils/colors';
import { getTimeColors } from './skyColors';

/**
 * MountainRenderer - 山脉渲染器
 * 单一职责：负责远山层的生成、视差滚动和渲染
 * 支持根据山脉高度参数动态调整
 */
export class MountainRenderer {
  private mountains: Mountain[] = [];
  private mountainCount = 7;
  private offset = 0;
  private lastHeight = -1;

  /**
   * 初始化山脉层
   * @param width 画布宽度
   * @param height 画布高度
   * @param env 环境设置
   */
  initialize(width: number, height: number, env: EnvironmentSettings): void {
    this.mountains = [];
    this.offset = 0;

    const heightMultiplier = 0.3 + (env.mountainHeight / 100) * 0.7;

    for (let i = 0; i < this.mountainCount; i++) {
      const baseHeight = randomRange(height * 0.2, height * 0.5) * heightMultiplier;
      this.mountains.push({
        x: (i / this.mountainCount) * width * 2 - width * 0.3,
        height: baseHeight,
        width: randomRange(width * 0.3, width * 0.8),
        color: `hsl(${220 + i * 5}, 20%, ${10 + i * 3}%)`,
        parallaxSpeed: 8 + i * 10,
      });
    }
    this.lastHeight = env.mountainHeight;
  }

  /**
   * 更新山脉位置（视差滚动）
   * @param deltaTime 帧间隔时间
   * @param width 画布宽度
   * @param height 画布高度
   * @param speed 飞行速度
   * @param env 环境设置
   */
  update(
    deltaTime: number,
    width: number,
    height: number,
    speed: number,
    env: EnvironmentSettings
  ): void {
    if (env.mountainHeight !== this.lastHeight) {
      const heightMultiplier = 0.3 + (env.mountainHeight / 100) * 0.7;
      for (let i = 0; i < this.mountains.length; i++) {
        const baseHeight = randomRange(height * 0.2, height * 0.5) * heightMultiplier;
        this.mountains[i].height = baseHeight;
      }
      this.lastHeight = env.mountainHeight;
    }

    this.offset += speed * 80 * deltaTime;
  }

  /**
   * 渲染所有山脉层
   * @param ctx Canvas 2D 上下文
   * @param width 画布宽度
   * @param height 画布高度
   * @param env 环境设置
   */
  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    env: EnvironmentSettings
  ): void {
    const timeColors = getTimeColors(env.timeOfDay);

    for (let i = this.mountains.length - 1; i >= 0; i--) {
      const m = this.mountains[i];
      this.drawMountain(ctx, m, width, height, timeColors.mountainTint);
    }
  }

  /**
   * 绘制单个山脉
   */
  private drawMountain(
    ctx: CanvasRenderingContext2D,
    mountain: Mountain,
    width: number,
    height: number,
    tintColor: string
  ): void {
    const x = ((mountain.x - this.offset * mountain.parallaxSpeed * 0.005) % (width * 2.5)) - width * 0.3;
    const adjustedX = x;

    ctx.save();

    const mtnGradient = ctx.createLinearGradient(
      adjustedX + mountain.width * 0.3,
      height - mountain.height,
      adjustedX + mountain.width * 0.5,
      height
    );

    const baseTop = lightenColor(mountain.color, 15);
    const baseMid = mountain.color;
    const baseBottom = darkenColor(mountain.color, 25);

    mtnGradient.addColorStop(0, baseTop);
    mtnGradient.addColorStop(0.4, baseMid);
    mtnGradient.addColorStop(1, baseBottom);

    ctx.beginPath();
    ctx.moveTo(adjustedX, height);

    ctx.lineTo(adjustedX + mountain.width * 0.15, height - mountain.height * 0.4);
    ctx.lineTo(adjustedX + mountain.width * 0.3, height - mountain.height * 0.7);

    ctx.quadraticCurveTo(
      adjustedX + mountain.width * 0.42,
      height - mountain.height * 0.95,
      adjustedX + mountain.width * 0.5,
      height - mountain.height
    );

    ctx.quadraticCurveTo(
      adjustedX + mountain.width * 0.58,
      height - mountain.height * 0.92,
      adjustedX + mountain.width * 0.65,
      height - mountain.height * 0.75
    );

    ctx.lineTo(adjustedX + mountain.width * 0.8, height - mountain.height * 0.45);
    ctx.lineTo(adjustedX + mountain.width, height);
    ctx.closePath();

    ctx.fillStyle = mtnGradient;
    ctx.fill();

    if (mountain.height > height * 0.25) {
      this.drawSnowCap(ctx, adjustedX, mountain, height);
    }

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tintColor;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }

  /**
   * 绘制山顶雪盖
   */
  private drawSnowCap(
    ctx: CanvasRenderingContext2D,
    x: number,
    mountain: Mountain,
    height: number
  ): void {
    const snowBaseY = height - mountain.height * 0.85;

    ctx.beginPath();
    ctx.moveTo(x + mountain.width * 0.38, snowBaseY + mountain.height * 0.12);

    ctx.quadraticCurveTo(
      x + mountain.width * 0.5,
      height - mountain.height,
      x + mountain.width * 0.62,
      snowBaseY + mountain.height * 0.1
    );

    ctx.quadraticCurveTo(
      x + mountain.width * 0.52,
      snowBaseY + mountain.height * 0.03,
      x + mountain.width * 0.38,
      snowBaseY + mountain.height * 0.12
    );

    const snowGradient = ctx.createLinearGradient(
      x + mountain.width * 0.5,
      height - mountain.height,
      x + mountain.width * 0.5,
      snowBaseY
    );
    snowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    snowGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

    ctx.fillStyle = snowGradient;
    ctx.fill();
  }
}
