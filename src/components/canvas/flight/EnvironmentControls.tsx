/**
 * EnvironmentControls.tsx
 * --------------------------------------------
 * 单一职责：渲染飞行场景"环境自定义"控制面板。
 * 包含：
 *   - 时间滑块（0~1，连续）
 *   - 4 个时段预设按钮（日出/正午/日落/夜晚）
 *   - 云层密度滑块
 *   - 山脉高度滑块
 *   - 重置按钮
 *
 * 该组件只负责 UI 与触发 store action，不直接操作 Canvas。
 */

import React from 'react';
import { Sunrise, Sun, Sunset, Moon, Cloud as CloudIcon, Mountain as MountainIcon, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Slider } from '@/components/ui/Slider';
import { useAppStore } from '@/store/useAppStore';
import { TIME_PRESET_VALUES, getNearestPreset } from '@/components/canvas/flight/timeOfDay';
import { TimeOfDayPreset } from '@/types/flight';

/** 预设按钮的展示元数据 */
const PRESET_META: { key: TimeOfDayPreset; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'sunrise', label: '日出', icon: Sunrise },
  { key: 'noon', label: '正午', icon: Sun },
  { key: 'sunset', label: '日落', icon: Sunset },
  { key: 'night', label: '夜晚', icon: Moon },
];

export const EnvironmentControls: React.FC = () => {
  const {
    flight: { environment },
    setFlightTimeOfDay,
    setFlightCloudDensity,
    setFlightMountainHeight,
    resetFlightEnvironment,
  } = useAppStore();

  // 当前最接近的时段，用于高亮按钮
  const activePreset = getNearestPreset(environment.timeOfDay);

  return (
    <GlassCard className="p-5 w-72" glow>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-base font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            场景定制
          </h3>
          <p className="text-white/50 text-xs mt-0.5">自定义云层、山脉与时间</p>
        </div>
        <button
          onClick={resetFlightEnvironment}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title="重置环境"
          aria-label="重置环境"
        >
          <RotateCcw className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* 时段预设按钮组 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PRESET_META.map(({ key, label, icon: Icon }) => {
          const isActive = activePreset === key;
          return (
            <button
              key={key}
              onClick={() => setFlightTimeOfDay(TIME_PRESET_VALUES[key])}
              className={[
                'flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-all',
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/40 to-purple-500/40 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90',
              ].join(' ')}
              aria-pressed={isActive}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 时间连续滑块（0~1） */}
      <div className="mb-4">
        <Slider
          label="时间"
          min={0}
          max={1}
          step={0.01}
          value={environment.timeOfDay}
          onChange={(v) => setFlightTimeOfDay(v)}
          showValue
          unit=""
        />
        <div className="flex justify-between text-[10px] text-white/40 mt-1 px-0.5">
          <span>日出</span>
          <span>正午</span>
          <span>日落</span>
          <span>夜晚</span>
        </div>
      </div>

      {/* 云层密度 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
          <CloudIcon className="w-4 h-4" />
          <span>云层密度</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={environment.cloudDensity}
          onChange={(v) => setFlightCloudDensity(v)}
          showValue={false}
        />
      </div>

      {/* 山脉高度 */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
          <MountainIcon className="w-4 h-4" />
          <span>山脉高度</span>
        </div>
        <Slider
          min={0.3}
          max={1.5}
          step={0.05}
          value={environment.mountainHeight}
          onChange={(v) => setFlightMountainHeight(v)}
          showValue={false}
        />
      </div>
    </GlassCard>
  );
};
