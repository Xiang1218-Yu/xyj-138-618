/**
 * 时间滑块组件
 * 职责：提供直观的时间选择界面，支持滑块拖动和四个时段快捷按钮
 * 单一职责：仅负责时间选择UI交互
 */

import React from 'react';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { TimeOfDay } from '@/types/flight';
import { TIME_QUICK_POINTS, getTimeOfDayLabel } from '@/components/canvas/flight/TimeOfDaySystem';

interface TimeSliderProps {
  /** 当前时间值 0-100 */
  value: number;
  /** 时间变化回调 */
  onChange: (value: number) => void;
  /** 快捷时段点击回调 */
  onTimeOfDaySelect: (timeOfDay: TimeOfDay) => void;
  /** 当前时段 */
  currentTimeOfDay: TimeOfDay;
}

/**
 * 时段图标映射
 */
const TIME_ICONS: Record<TimeOfDay, React.ReactNode> = {
  [TimeOfDay.Sunrise]: <Sunrise className="w-4 h-4" />,
  [TimeOfDay.Noon]: <Sun className="w-4 h-4" />,
  [TimeOfDay.Sunset]: <Sunset className="w-4 h-4" />,
  [TimeOfDay.Night]: <Moon className="w-4 h-4" />,
};

/**
 * 时段对应渐变色
 */
const TIME_GRADIENTS: Record<TimeOfDay, string> = {
  [TimeOfDay.Sunrise]: 'from-orange-400 to-pink-500',
  [TimeOfDay.Noon]: 'from-cyan-400 to-blue-500',
  [TimeOfDay.Sunset]: 'from-orange-500 to-purple-600',
  [TimeOfDay.Night]: 'from-indigo-600 to-purple-900',
};

export const TimeSlider: React.FC<TimeSliderProps> = ({
  value,
  onChange,
  onTimeOfDaySelect,
  currentTimeOfDay,
}) => {
  const percentage = value;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm font-medium">时间</span>
        <span className={`text-sm font-bold bg-gradient-to-r ${TIME_GRADIENTS[currentTimeOfDay]} bg-clip-text text-transparent`}>
          {getTimeOfDayLabel(currentTimeOfDay)}
        </span>
      </div>

      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 via-cyan-400 via-orange-500 to-indigo-900">
          <div className="absolute inset-0 bg-white/10" />
        </div>

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
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg shadow-black/30 pointer-events-none transition-all duration-100 flex items-center justify-center z-20"
          style={{ left: `${percentage}%` }}
        >
          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${TIME_GRADIENTS[currentTimeOfDay]}`} />
        </div>
      </div>

      <div className="flex justify-between">
        {TIME_QUICK_POINTS.map((point) => (
          <button
            key={point.time}
            onClick={() => onTimeOfDaySelect(point.time)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              currentTimeOfDay === point.time
                ? `bg-gradient-to-br ${TIME_GRADIENTS[point.time]} bg-opacity-20 scale-110`
                : 'hover:bg-white/10'
            }`}
          >
            <span className={currentTimeOfDay === point.time ? 'text-white' : 'text-white/50'}>
              {TIME_ICONS[point.time]}
            </span>
            <span className={`text-xs ${currentTimeOfDay === point.time ? 'text-white font-medium' : 'text-white/50'}`}>
              {point.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
