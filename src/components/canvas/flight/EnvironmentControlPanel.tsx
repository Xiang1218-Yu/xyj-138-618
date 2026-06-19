/**
 * 环境控制面板组件
 * 职责：提供环境参数调节的UI界面，包括云层密度、山脉高度、时间滑块
 * 单一职责：仅负责UI展示和用户交互，不包含渲染逻辑
 */

import React from 'react';
import { Cloud, Mountain, Settings2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Slider } from '@/components/ui/Slider';
import { TimeSlider } from '@/components/ui/TimeSlider';
import { useAppStore } from '@/store/useAppStore';
import { TimeOfDay } from '@/types/flight';

/**
 * 环境控制面板组件
 * 整合云层密度、山脉高度、时间选择等控制项
 */
export const EnvironmentControlPanel: React.FC = () => {
  const {
    flight: { environment },
    setCloudDensity,
    setMountainHeight,
    setTimeValue,
    setTimeOfDay,
  } = useAppStore();

  /**
   * 处理时间滑块变化
   */
  const handleTimeChange = (value: number) => {
    setTimeValue(value);
  };

  /**
   * 处理快捷时段选择
   */
  const handleTimeOfDaySelect = (timeOfDay: TimeOfDay) => {
    setTimeOfDay(timeOfDay);
  };

  /**
   * 处理云层密度变化
   */
  const handleCloudDensityChange = (value: number) => {
    setCloudDensity(value);
  };

  /**
   * 处理山脉高度变化
   */
  const handleMountainHeightChange = (value: number) => {
    setMountainHeight(value);
  };

  return (
    <GlassCard className="p-5 w-72" glow>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            环境设置
          </h2>
          <p className="text-white/50 text-xs">自定义你的飞行场景</p>
        </div>
      </div>

      <div className="space-y-5">
        <TimeSlider
          value={environment.timeValue}
          onChange={handleTimeChange}
          onTimeOfDaySelect={handleTimeOfDaySelect}
          currentTimeOfDay={environment.timeOfDay}
        />

        <div className="h-px bg-white/10" />

        <div className="space-y-4">
          <Slider
            label={
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-white/70" />
                <span className="text-white/70">云层密度</span>
              </div>
            }
            value={environment.cloudDensity}
            onChange={handleCloudDensityChange}
            min={0}
            max={100}
            unit="%"
          />

          <Slider
            label={
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-white/70" />
                <span className="text-white/70">山脉高度</span>
              </div>
            }
            value={environment.mountainHeight}
            onChange={handleMountainHeightChange}
            min={0}
            max={100}
            unit="%"
          />
        </div>
      </div>
    </GlassCard>
  );
};
