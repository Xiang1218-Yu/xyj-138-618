/**
 * 飞行器状态接口
 * 定义飞行器的位置、速度、角度、燃料等核心属性
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
 * 云朵接口
 * 定义单朵云的位置、大小、速度和视觉属性
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
 * 定义单座山的位置、尺寸、颜色和视差速度
 */
export interface Mountain {
  x: number;
  height: number;
  width: number;
  color: string;
  parallaxSpeed: number;
  baseHeight: number;
}

/**
 * 推进器粒子接口
 * 定义引擎喷射粒子的物理和视觉属性
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
 * 时间段枚举
 * 定义一天中的四个时间段：日出、正午、日落、夜晚
 */
export type TimeOfDay = 'sunrise' | 'noon' | 'sunset' | 'night';

/**
 * 天空配色接口
 * 定义不同时间段的天空渐变色、太阳/月亮位置、星星可见性等
 */
export interface SkyPalette {
  gradientStops: { offset: number; color: string }[];
  sunPosition: { x: number; y: number };
  sunColor: string;
  sunGlow: string[];
  showStars: boolean;
  starOpacity: number;
  ambientLight: number;
}

/**
 * 环境设置接口
 * 用户可自定义的飞行场景环境参数
 * - cloudDensity: 云层密度 (0-100)
 * - mountainHeight: 山脉高度系数 (0-100)
 * - timeOfDay: 时间段滑块值 (0-100，对应四个时间段)
 */
export interface EnvironmentSettings {
  cloudDensity: number;
  mountainHeight: number;
  timeOfDay: number;
}

/**
 * 飞行场景完整状态接口
 */
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
