export interface Aircraft {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  altitude: number;
  fuel: number;
  maxFuel: number;
  isThrusting: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  puffCount: number;
  layer: number;
}

export interface Mountain {
  x: number;
  height: number;
  width: number;
  color: string;
  parallaxSpeed: number;
}

export interface ThrustParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

/**
 * 时间段枚举：用于表达飞行场景中的四个标准时间点。
 * 每个值对应一个具有代表性的颜色 / 光照配置。
 */
export type TimeOfDayPreset = 'sunrise' | 'noon' | 'sunset' | 'night';

/**
 * 飞行场景环境配置。
 * 所有字段均允许用户自定义，以满足"自定义飞行器驾驶场景的环境元素"的需求。
 */
export interface FlightEnvironment {
  /** 云层密度（0~1）：0 表示晴空万里，1 表示乌云密布 */
  cloudDensity: number;
  /** 山脉高度倍数（0.3~1.5）：在原始随机高度基础上整体缩放 */
  mountainHeight: number;
  /**
   * 时间值（0~1，循环）：
   * 0.00 → 日出，0.25 → 正午，0.50 → 日落，0.75 → 夜晚
   * 通过滑块连续调整，色调会在四个 preset 之间平滑过渡。
   */
  timeOfDay: number;
}

export interface FlightState {
  aircraft: Aircraft;
  clouds: Cloud[];
  mountains: Mountain[];
  thrustParticles: ThrustParticle[];
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
  environment: FlightEnvironment;
}
