/**
 * 环境控制面板组件
 * 职责：提供用户界面用于自定义飞行场景环境参数
 * - 时间滑块：支持在日出/正午/日落/夜晚之间平滑切换
 * - 云层密度滑块：0-100 调节云层数量
 * - 山脉高度滑块：0-100 调节山脉高度系数
 */

import React from 'react';
import { Cloud, Mountain, Sun, Sunrise, Sunset, Moon, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getTimeOfDayInfo } from './skyRenderer';

/**
 * 时间点预设配置
 * 每个时间点对应滑块上的一个位置（0, 25, 50, 75）
 */
const TIME_PRESETS = [
  { value: 0, label: '日出', icon: Sunrise },
  { value: 25, label: '正午', icon: Sun },
  { value: 50, label: '日落', icon: Sunset },
  { value: 75, label: '夜晚', icon: Moon },
];

/**
 * 自定义时间滑块组件
 * 带有分段标记和图标，支持点击预设快速切换
 */
const TimeSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const timeInfo = getTimeOfDayInfo(value);
  const CurrentIcon = TIME_PRESETS.find(
    (p) => p.label === timeInfo.label
  )?.icon || Sun;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Sun className="w-4 h-4" />
          <span>时间</span>
        </div>
        <div className="flex items-center gap-1.5 text-white font-medium text-sm">
          <CurrentIcon className="w-4 h-4 text-yellow-300" />
          <span>{timeInfo.label}</span>
        </div>
      </div>

      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(90deg, #ff9a56 0%, #4facfe 25%, #f093fb 50%, #667eea 100%)',
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-150 z-20"
          style={{ left: `${value}%` }}
        />

        <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none">
          {TIME_PRESETS.map((preset) => {
            const isActive =
              (preset.value === 0 && value < 12.5) ||
              (preset.value === 25 && value >= 12.5 && value < 37.5) ||
              (preset.value === 50 && value >= 37.5 && value < 62.5) ||
              (preset.value === 75 && value >= 62.5);

            return (
              <button
                key={preset.value}
                onClick={() => onChange(preset.value)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                  isActive
                    ? 'bg-white/90 scale-110'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                title={preset.label}
              >
                <preset.icon
                  className={`w-3 h-3 ${isActive ? 'text-purple-600' : 'text-white/70'}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 环境控制面板主组件
 */
export const EnvironmentControls: React.FC = () => {
  const {
    flight: { environment },
    setFlightEnvironment,
    resetFlight,
  } = useAppStore();

  /**
   * 重置环境设置到默认值
   */
  const handleResetEnvironment = () => {
    setFlightEnvironment({
      cloudDensity: 50,
      mountainHeight: 50,
      timeOfDay: 25,
    });
  };

  return (
    <GlassCard className="p-5 w-72" glow>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sun className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            环境设置
          </h3>
          <p className="text-white/50 text-xs">自定义你的飞行场景</p>
        </div>
      </div>

      <div className="space-y-5">
        <TimeSlider
          value={environment.timeOfDay}
          onChange={(val) => setFlightEnvironment({ timeOfDay: val })}
        />

        <div className="h-px bg-white/10" />

        <Slider
          label="云层密度"
          value={environment.cloudDensity}
          onChange={(val) => setFlightEnvironment({ cloudDensity: val })}
          min={0}
          max={100}
          unit="%"
        />

        <Slider
          label="山脉高度"
          value={environment.mountainHeight}
          onChange={(val) => setFlightEnvironment({ mountainHeight: val })}
          min={0}
          max={100}
          unit="%"
        />

        <div className="h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={handleResetEnvironment}
            className="w-full text-sm py-2"
          >
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              重置环境
            </span>
          </Button>
          <Button
            variant="primary"
            onClick={resetFlight}
            className="w-full text-sm py-2"
          >
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              重置飞行
            </span>
          </Button>
        </div>

        <div className="text-white/40 text-xs space-y-1 pt-1">
          <p>• 拖动滑块或点击图标切换时间</p>
          <p>• 调节云层密度改变天气效果</p>
          <p>• 山脉高度影响地形起伏</p>
        </div>
      </div>
    </GlassCard>
  );
};
