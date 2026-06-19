/**
 * 飞行场景页面
 * 职责：整合飞行模拟器和环境控制面板，作为场景入口
 * 单一职责：仅负责页面布局和组件组装，业务逻辑委托给子组件
 */

import React from 'react';
import { FlightSimulator } from '@/components/canvas/FlightSimulator';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EnvironmentControlPanel } from '@/components/canvas/flight/EnvironmentControlPanel';
import { useAppStore } from '@/store/useAppStore';
import { Plane, RotateCcw, Info, Fuel, Gauge, Mountain } from 'lucide-react';

const Flight: React.FC = () =&gt; {
  const {
    flight: { aircraft },
    resetFlight,
  } = useAppStore();

  return (
    &lt;div className="relative w-full h-screen overflow-hidden"&gt;
      &lt;FlightSimulator /&gt;

      &lt;div className="absolute top-24 left-6 z-20 space-y-4"&gt;
        &lt;GlassCard className="p-5 w-72" glow&gt;
          &lt;div className="flex items-center gap-3 mb-4"&gt;
            &lt;div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"&gt;
              &lt;Plane className="w-5 h-5 text-white" /&gt;
            &lt;/div&gt;
            &lt;div&gt;
              &lt;h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              &gt;
                飞行器驾驶
              &lt;/h2&gt;
              &lt;p className="text-white/50 text-xs"&gt;
                高度 {Math.round(aircraft.altitude)}m · 速度 {Math.round(aircraft.speed * 10)}km/h
              &lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="space-y-4"&gt;
            &lt;div className="flex items-center justify-between text-sm"&gt;
              &lt;div className="flex items-center gap-2 text-white/70"&gt;
                &lt;Fuel className="w-4 h-4" /&gt;
                &lt;span&gt;燃料&lt;/span&gt;
              &lt;/div&gt;
              &lt;span className="text-white font-medium"&gt;
                {Math.round(aircraft.fuel)}%
              &lt;/span&gt;
            &lt;/div&gt;

            &lt;div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"&gt;
              &lt;div
                className={`h-full transition-all duration-300 rounded-full ${
                  aircraft.fuel &gt; 30
                    ? 'bg-gradient-to-r from-green-400 to-cyan-400'
                    : 'bg-gradient-to-r from-pink-500 to-yellow-400'
                }`}
                style={{ width: `${aircraft.fuel}%` }}
              /&gt;
            &lt;/div&gt;

            &lt;div className="grid grid-cols-2 gap-3"&gt;
              &lt;div className="bg-white/5 rounded-lg p-3"&gt;
                &lt;div className="flex items-center gap-2 text-white/50 text-xs mb-1"&gt;
                  &lt;Gauge className="w-3 h-3" /&gt;
                  &lt;span&gt;速度&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="text-white font-bold text-lg"&gt;
                  {Math.round(aircraft.speed * 10)}
                  &lt;span className="text-xs text-white/50 ml-1"&gt;km/h&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div className="bg-white/5 rounded-lg p-3"&gt;
                &lt;div className="flex items-center gap-2 text-white/50 text-xs mb-1"&gt;
                  &lt;Mountain className="w-3 h-3" /&gt;
                  &lt;span&gt;高度&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="text-white font-bold text-lg"&gt;
                  {Math.round(aircraft.altitude)}
                  &lt;span className="text-xs text-white/50 ml-1"&gt;m&lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;Button
              variant="primary"
              onClick={resetFlight}
              className="w-full"
            &gt;
              &lt;span className="flex items-center justify-center gap-2"&gt;
                &lt;RotateCcw className="w-4 h-4" /&gt;
                重置飞行
              &lt;/span&gt;
            &lt;/Button&gt;
          &lt;/div&gt;
        &lt;/GlassCard&gt;
      &lt;/div&gt;

      &lt;div className="absolute top-24 right-6 z-20 space-y-4"&gt;
        &lt;EnvironmentControlPanel /&gt;

        &lt;GlassCard className="p-4 w-72"&gt;
          &lt;div className="flex items-start gap-3"&gt;
            &lt;Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" /&gt;
            &lt;div className="text-sm text-white/70 space-y-1"&gt;
              &lt;p&gt;
                &lt;span className="text-white font-medium"&gt;操作提示：&lt;/span&gt;
              &lt;/p&gt;
              &lt;p&gt;• 移动鼠标控制方向&lt;/p&gt;
              &lt;p&gt;• 按住左键加速起飞&lt;/p&gt;
              &lt;p&gt;• 使用右侧面板自定义环境&lt;/p&gt;
              &lt;p&gt;• 拖动时间滑块切换时段&lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/GlassCard&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
};

export default Flight;
