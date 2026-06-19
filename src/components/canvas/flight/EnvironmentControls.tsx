import React from 'react';
import { Sun, Cloud, Mountain, Wind, CloudFog, Star, RotateCcw, Sunrise, Sun as SunIcon, Sunset, Moon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { getTimeOfDayName, getTimeOfDayType } from './skyColors';

/**
 * TimeSlider - 时间滑块组件
 * 单一职责：提供日出/正午/日落/夜晚四个时间段的快速切换和滑动调节
 */
const TimeSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const timePresets = [
    { value: 0, label: '日出', icon: Sunrise },
    { value: 33, label: '正午', icon: SunIcon },
    { value: 66, label: '日落', icon: Sunset },
    { value: 100, label: '夜晚', icon: Moon },
  ];

  const currentType = getTimeOfDayType(value);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-white/70">
          <Sun className="w-4 h-4" />
          <span className="text-sm">时间</span>
        </div>
        <span className="text-white font-medium text-sm">
          {getTimeOfDayName(value)}
        </span>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full overflow-hidden bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${value}%`,
              background: 'linear-gradient(90deg, #ff7b54 0%, #4a90d9 33%, #ff6b6b 66%, #0d1033 100%)',
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg pointer-events-none transition-all duration-150"
          style={{
            left: `calc(${value}% - 10px)`,
            boxShadow: '0 0 15px rgba(255,255,255,0.5)',
          }}
        />
      </div>

      <div className="flex justify-between gap-2">
        {timePresets.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentType === getTimeOfDayType(preset.value);
          return (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * EnvironmentSliderItem - 单个环境参数滑块组件
 */
const EnvironmentSliderItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (value: number) => void;
}> = ({ icon, label, value, min = 0, max = 100, unit = '%', onChange }) => (
  <Slider
    value={value}
    min={min}
    max={max}
    onChange={onChange}
    label={label}
    showValue
    unit={unit}
  />
);

/**
 * EnvironmentControls - 环境控制面板组件
 * 单一职责：提供所有环境参数的用户界面控制
 */
export const EnvironmentControls: React.FC = () => {
  const {
    flight: { environment },
    updateEnvironment,
    resetEnvironment,
  } = useAppStore();

  return (
    <GlassCard className="p-5 w-72" glow>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">环境设置</h2>
            <p className="text-white/50 text-xs">自定义飞行场景</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetEnvironment}
          className="p-2 h-auto text-white/50 hover:text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-5">
        <TimeSlider
          value={environment.timeOfDay}
          onChange={(v) => updateEnvironment({ timeOfDay: v })}
        />

        <div className="h-px bg-white/10" />

        <EnvironmentSliderItem
          icon={<Cloud className="w-4 h-4" />}
          label="云层密度"
          value={environment.cloudDensity}
          onChange={(v) => updateEnvironment({ cloudDensity: v })}
        />

        <EnvironmentSliderItem
          icon={<Cloud className="w-4 h-4" />}
          label="云层高度"
          value={environment.cloudAltitude}
          min={-50}
          max={50}
          onChange={(v) => updateEnvironment({ cloudAltitude: v })}
        />

        <EnvironmentSliderItem
          icon={<Mountain className="w-4 h-4" />}
          label="山脉高度"
          value={environment.mountainHeight}
          onChange={(v) => updateEnvironment({ mountainHeight: v })}
        />

        <EnvironmentSliderItem
          icon={<Wind className="w-4 h-4" />}
          label="风速"
          value={environment.windStrength}
          onChange={(v) => updateEnvironment({ windStrength: v })}
        />

        <EnvironmentSliderItem
          icon={<CloudFog className="w-4 h-4" />}
          label="雾气浓度"
          value={environment.fogDensity}
          onChange={(v) => updateEnvironment({ fogDensity: v })}
        />

        <EnvironmentSliderItem
          icon={<Star className="w-4 h-4" />}
          label="星星可见度"
          value={environment.starVisibility}
          onChange={(v) => updateEnvironment({ starVisibility: v })}
        />
      </div>
    </GlassCard>
  );
};
