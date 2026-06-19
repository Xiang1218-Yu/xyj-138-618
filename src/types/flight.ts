/**
 * 飞行器状态接口
 * 定义飞行器的所有物理属性
 */
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

/**
 * 云层接口
 * 定义单个云层的视觉属性和运动参数
 */
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

/**
 * 山脉接口
 * 定义单个山脉的几何属性和视觉样式
 */
export interface Mountain {
  x: number;
  height: number;
  width: number;
  color: string;
  parallaxSpeed: number;
}

/**
 * 推进器粒子接口
 * 定义飞行器尾焰粒子的属性
 */
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
 * 时段枚举
 * 定义一天中的四个关键时段
 */
export enum TimeOfDay {
  Sunrise = 'sunrise',
  Noon = 'noon',
  Sunset = 'sunset',
  Night = 'night',
}

/**
 * 天空配色接口
 * 定义特定时段的天空渐变颜色和天体属性
 */
export interface SkyColors {
  /** 天空顶部颜色 */
  topColor: string;
  /** 天空中部颜色 */
  middleColor: string;
  /** 天空底部颜色 */
  bottomColor: string;
  /** 太阳/月亮位置X比例 */
  sunX: number;
  /** 太阳/月亮位置Y比例 */
  sunY: number;
  /** 太阳/月亮颜色 */
  sunColor: string;
  /** 太阳光晕颜色 */
  sunGlowColor: string;
  /** 是否显示星星 */
  showStars: boolean;
  /** 星星亮度 */
  starBrightness: number;
  /** 大气雾颜色 */
  fogColor: string;
}

/**
 * 环境配置接口
 * 定义可自定义的环境参数
 */
export interface EnvironmentConfig {
  /** 云层密度 0-100 */
  cloudDensity: number;
  /** 山脉高度 0-100 */
  mountainHeight: number;
  /** 当前时间值 0-100（映射到四个时段） */
  timeValue: number;
  /** 当前时段 */
  timeOfDay: TimeOfDay;
}

/**
 * 飞行场景状态接口
 */
export interface FlightState {
  aircraft: Aircraft;
  clouds: Cloud[];
  mountains: Mountain[];
  thrustParticles: ThrustParticle[];
  isMouseDown: boolean;
  mouseX: number;
  mouseY: number;
  environment: EnvironmentConfig;
}
