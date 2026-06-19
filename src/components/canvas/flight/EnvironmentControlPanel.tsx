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
export const EnvironmentControlPanel: React.FC = () =&gt; {
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
  const handleTimeChange = (value: number) =&gt; {
    setTimeValue(value);
  };

  /**
   * 处理快捷时段选择
   */
  const handleTimeOfDaySelect = (timeOfDay: TimeOfDay) =&gt; {
    setTimeOfDay(timeOfDay);
  };

  /**
   * 处理云层密度变化
   */
  const handleCloudDensityChange = (value: number) =&gt; {
    setCloudDensity(value);
  };

  /**
   * 处理山脉高度变化
   */
  const handleMountainHeightChange = (value: number) =&gt; {
    setMountainHeight(value);
  };

  return (
    &lt;GlassCard className="p-5 w-72" glow&gt;
      &lt;div className="flex items-center gap-3 mb-5"&gt;
        &lt;div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"&gt;
          &lt;Settings2 className="w-5 h-5 text-white" /&gt;
        &lt;/div&gt;
        &lt;div&gt;
          &lt;h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          &gt;
            环境设置
          &lt;/h2&gt;
          &lt;p className="text-white/50 text-xs"&gt;自定义你的飞行场景&lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="space-y-5"&gt;
        &lt;TimeSlider
          value={environment.timeValue}
          onChange={handleTimeChange}
          onTimeOfDaySelect={handleTimeOfDaySelect}
          currentTimeOfDay={environment.timeOfDay}
        /&gt;

        &lt;div className="h-px bg-white/10" /&gt;

        &lt;div className="space-y-4"&gt;
          &lt;Slider
            label={
              &lt;div className="flex items-center gap-2"&gt;
                &lt;Cloud className="w-4 h-4 text-white/70" /&gt;
                &lt;span className="text-white/70"&gt;云层密度&lt;/span&gt;
              &lt;/div&gt;
            }
            value={environment.cloudDensity}
            onChange={handleCloudDensityChange}
            min={0}
            max={100}
            unit="%"
          /&gt;

          &lt;Slider
            label={
              &lt;div className="flex items-center gap-2"&gt;
                &lt;Mountain className="w-4 h-4 text-white/70" /&gt;
                &lt;span className="text-white/70"&gt;山脉高度&lt;/span&gt;
              &lt;/div&gt;
            }
            value={environment.mountainHeight}
            onChange={handleMountainHeightChange}
            min={0}
            max={100}
            unit="%"
          /&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/GlassCard&gt;
  );
};
