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
 * 时间段枚举
 * sunrise: 日出 (0-25)
 * noon: 正午 (25-50)
 * sunset: 日落 (50-75)
 * night: 夜晚 (75-100)
 */
export type TimeOfDay = 'sunrise' | 'noon' | 'sunset' | 'night';

/**
 * 环境设置接口
 * 用于控制飞行场景的各种环境元素
 */
export interface EnvironmentSettings {
  /** 时间值 0-100，对应日出到夜晚 */
  timeOfDay: number;
  /** 云层密度 0-100 */
  cloudDensity: number;
  /** 云层高度偏移 -50 到 50 */
  cloudAltitude: number;
  /** 山脉高度 0-100 */
  mountainHeight: number;
  /** 雾气浓度 0-100 */
  fogDensity: number;
  /** 星星可见度 0-100 */
  starVisibility: number;
  /** 风速影响 0-100 */
  windStrength: number;
}

export interface FlightState {
  aircraft: Aircraft;
  clouds: Cloud[];
  mountains: Mountain[];
  thrustParticles: ThrustParticle[];
  environment: EnvironmentSettings;
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
}

/**
 * 时间配置 - 每个时间段的颜色配置
 */
export interface TimeColors {
  skyTop: string;
  skyMiddle: string;
  skyBottom: string;
  sunColor: string;
  sunGlowColor: string;
  ambientLight: number;
  cloudTint: string;
  mountainTint: string;
  starOpacity: number;
  sunPosition: { x: number; y: number };
}
