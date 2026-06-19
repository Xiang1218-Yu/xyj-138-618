import React, { useEffect, useRef, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { useAppStore } from '@/store/useAppStore';
import { Cloud, Mountain, ThrustParticle } from '@/types/flight';
import { generateId, randomRange, lerp, lerpAngle, clamp } from '@/utils/math';
import { createGradient, withAlpha, lightenColor } from '@/utils/colors';
// 环境渲染模块（单一职责拆分）
import { getPaletteForTime } from './flight/timeOfDay';
import { drawSky, drawAmbientOverlay } from './flight/SkyRenderer';
import { drawMountains } from './flight/MountainRenderer';
import {
  initClouds,
  syncCloudDensity,
  updateClouds,
  drawClouds,
} from './flight/CloudRenderer';

interface FlightSimulatorProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const FlightSimulator: React.FC<FlightSimulatorProps> = ({
  onMouseEnter,
  onMouseLeave,
}) => {
  const { canvasRef, getContext, width, height, clear } = useCanvas();
  const {
    flight: { aircraft, thrustParticles, environment },
    updateAircraft,
    addThrustParticle,
    setCursorType,
  } = useAppStore();

  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const aircraftRef = useRef(aircraft);
  const cloudsRef = useRef<Cloud[]>([]);
  const mountainsRef = useRef<Mountain[]>([]);
  const timeRef = useRef(0);
  const initializedRef = useRef(false);
  const speedLinesRef = useRef<{ x: number; y: number; length: number; opacity: number }[]>([]);
  // 通过 ref 持有最新 environment，避免在动画回调中触发重渲
  const environmentRef = useRef(environment);

  useEffect(() => {
    aircraftRef.current = aircraft;
  }, [aircraft]);

  // 环境配置变化时同步到 ref，并实时调整云朵数量
  useEffect(() => {
    environmentRef.current = environment;
    if (width > 0 && height > 0 && initializedRef.current) {
      syncCloudDensity(cloudsRef.current, width, height, environment.cloudDensity);
    }
  }, [environment, width, height]);

  const initializeScene = useCallback(
    (w: number, h: number) => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      // 云朵：交由 CloudRenderer 模块根据当前密度生成
      cloudsRef.current = initClouds(w, h, environmentRef.current.cloudDensity);

      // 山脉：保留原有随机生成逻辑（颜色字段会被 MountainRenderer 按 palette 覆盖）
      const initialMountains: Mountain[] = [];
      for (let i = 0; i < 6; i++) {
        initialMountains.push({
          x: (i / 6) * w * 1.8,
          height: randomRange(h * 0.25, h * 0.55),
          width: randomRange(w * 0.35, w * 0.9),
          color: `hsl(${225 + i * 4}, 25%, ${12 + i * 4}%)`,
          parallaxSpeed: 15 + i * 12,
        });
      }
      mountainsRef.current = initialMountains;

      const speedLines = [];
      for (let i = 0; i < 20; i++) {
        speedLines.push({
          x: randomRange(-w, w),
          y: randomRange(0, h),
          length: randomRange(20, 80),
          opacity: 0,
        });
      }
      speedLinesRef.current = speedLines;

      updateAircraft({
        x: w * 0.35,
        y: h * 0.55,
        targetX: w * 0.35,
        targetY: h * 0.55,
        fuel: 100,
      });
    },
    [updateAircraft]
  );

  useEffect(() => {
    if (width > 0 && height > 0) {
      initializeScene(width, height);
    }
  }, [width, height, initializeScene]);

  // 注：天空、山脉、云朵的绘制已拆分至 ./flight 子模块（SkyRenderer / MountainRenderer / CloudRenderer）。

  const drawSpeedLines = (
    ctx: CanvasRenderingContext2D,
    ac: typeof aircraft,
    time: number
  ) => {
    const speedRatio = ac.speed / ac.maxSpeed;
    if (speedRatio < 0.2) return;

    const lineCount = Math.floor(speedRatio * 15);

    for (let i = 0; i < lineCount && i < speedLinesRef.current.length; i++) {
      const line = speedLinesRef.current[i];
      const opacity = speedRatio * 0.6 * (0.5 + 0.5 * Math.sin(time * 0.01 + i));

      const angle = ac.angle + (Math.random() - 0.5) * 0.5;
      const startDist = 60 + Math.random() * 100;
      const lineLength = 30 + Math.random() * 60 * speedRatio;

      const startX = ac.x - Math.cos(angle) * startDist;
      const startY = ac.y - Math.sin(angle) * startDist;
      const endX = startX - Math.cos(angle) * lineLength;
      const endY = startY - Math.sin(angle) * lineLength;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, `rgba(200, 220, 255, ${opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  const drawAircraft = (
    ctx: CanvasRenderingContext2D,
    ac: typeof aircraft,
    time: number
  ) => {
    ctx.save();
    ctx.translate(ac.x, ac.y);
    ctx.rotate(ac.angle);

    const speedScale = 0.85 + (ac.speed / ac.maxSpeed) * 0.35;
    const tilt = Math.sin(ac.angle) * 0.15;
    ctx.scale(speedScale, speedScale * (1 + tilt * 0.1));

    const bodyLength = 90;
    const bodyHeight = 22;

    ctx.shadowColor = 'rgba(100, 80, 200, 0.5)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;

    const bodyGradient = ctx.createLinearGradient(0, -bodyHeight / 2, 0, bodyHeight / 2);
    bodyGradient.addColorStop(0, '#7c7a9c');
    bodyGradient.addColorStop(0.25, '#5a587a');
    bodyGradient.addColorStop(0.5, '#3d3b5c');
    bodyGradient.addColorStop(0.75, '#2a2840');
    bodyGradient.addColorStop(1, '#1a1830');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.5, 0);
    ctx.quadraticCurveTo(bodyLength * 0.3, -bodyHeight * 0.7, -bodyLength * 0.35, -bodyHeight * 0.55);
    ctx.quadraticCurveTo(-bodyLength * 0.5, 0, -bodyLength * 0.35, bodyHeight * 0.55);
    ctx.quadraticCurveTo(bodyLength * 0.3, bodyHeight * 0.7, bodyLength * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    const highlightGradient = ctx.createLinearGradient(0, -bodyHeight * 0.3, 0, -bodyHeight * 0.1);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(bodyLength * 0.05, -bodyHeight * 0.2, bodyLength * 0.35, bodyHeight * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    const cockpitGradient = ctx.createRadialGradient(
      bodyLength * 0.2,
      -bodyHeight * 0.15,
      0,
      bodyLength * 0.2,
      0,
      bodyHeight * 0.5
    );
    cockpitGradient.addColorStop(0, '#9fd8ff');
    cockpitGradient.addColorStop(0.3, '#5dade2');
    cockpitGradient.addColorStop(0.7, '#3498db');
    cockpitGradient.addColorStop(1, '#21618c');

    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.42, -bodyHeight * 0.35);
    ctx.quadraticCurveTo(bodyLength * 0.5, -bodyHeight * 0.1, bodyLength * 0.42, bodyHeight * 0.2);
    ctx.quadraticCurveTo(bodyLength * 0.3, bodyHeight * 0.3, bodyLength * 0.15, bodyHeight * 0.15);
    ctx.quadraticCurveTo(bodyLength * 0.1, -bodyHeight * 0.1, bodyLength * 0.42, -bodyHeight * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(bodyLength * 0.3, -bodyHeight * 0.2, bodyLength * 0.12, bodyHeight * 0.08, -0.3, 0, Math.PI * 2);
    ctx.fill();

    const wingSweep = 0.55;
    const wingSpan = 55;

    const wingTopGradient = ctx.createLinearGradient(0, -wingSpan * 0.3, 0, -wingSpan * 0.7);
    wingTopGradient.addColorStop(0, '#8b7cf0');
    wingTopGradient.addColorStop(0.5, '#6c5ce7');
    wingTopGradient.addColorStop(1, '#5a4db8');

    ctx.fillStyle = wingTopGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.1, -bodyHeight * 0.45);
    ctx.quadraticCurveTo(-bodyLength * wingSweep, -wingSpan * 0.5, -bodyLength * (wingSweep + 0.05), -wingSpan * 0.85);
    ctx.quadraticCurveTo(-bodyLength * 0.2, -wingSpan * 0.6, bodyLength * 0.05, -bodyHeight * 0.35);
    ctx.closePath();
    ctx.fill();

    const wingBottomGradient = ctx.createLinearGradient(0, wingSpan * 0.3, 0, wingSpan * 0.7);
    wingBottomGradient.addColorStop(0, '#7c6ddf');
    wingBottomGradient.addColorStop(0.5, '#5a4db8');
    wingBottomGradient.addColorStop(1, '#4a3f9e');

    ctx.fillStyle = wingBottomGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.1, bodyHeight * 0.45);
    ctx.quadraticCurveTo(-bodyLength * wingSweep, wingSpan * 0.5, -bodyLength * (wingSweep + 0.05), wingSpan * 0.85);
    ctx.quadraticCurveTo(-bodyLength * 0.2, wingSpan * 0.6, bodyLength * 0.05, bodyHeight * 0.35);
    ctx.closePath();
    ctx.fill();

    const wingEdgeGradient = ctx.createLinearGradient(0, -wingSpan * 0.7, 0, -wingSpan * 0.9);
    wingEdgeGradient.addColorStop(0, '#a29bfe');
    wingEdgeGradient.addColorStop(1, '#6c5ce7');

    ctx.fillStyle = wingEdgeGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.15, -wingSpan * 0.65);
    ctx.quadraticCurveTo(-bodyLength * wingSweep, -wingSpan * 0.75, -bodyLength * (wingSweep + 0.05), -wingSpan * 0.85);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(162, 155, 254, 0.6)';
    ctx.stroke();

    ctx.fillStyle = wingEdgeGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.15, wingSpan * 0.65);
    ctx.quadraticCurveTo(-bodyLength * wingSweep, wingSpan * 0.75, -bodyLength * (wingSweep + 0.05), wingSpan * 0.85);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(162, 155, 254, 0.6)';
    ctx.stroke();

    const tailGradient = ctx.createLinearGradient(-bodyLength * 0.45, -bodyHeight * 0.3, -bodyLength * 0.5, bodyHeight * 0.3);
    tailGradient.addColorStop(0, '#ff7eb3');
    tailGradient.addColorStop(0.5, '#fd79a8');
    tailGradient.addColorStop(1, '#e84393');

    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.35, -bodyHeight * 0.3);
    ctx.lineTo(-bodyLength * 0.55, -bodyHeight * 0.95);
    ctx.lineTo(-bodyLength * 0.42, -bodyHeight * 0.1);
    ctx.lineTo(-bodyLength * 0.55, bodyHeight * 0.95);
    ctx.lineTo(-bodyLength * 0.35, bodyHeight * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(-bodyLength * 0.38, -bodyHeight * 0.25);
    ctx.lineTo(-bodyLength * 0.52, -bodyHeight * 0.85);
    ctx.lineTo(-bodyLength * 0.43, -bodyHeight * 0.15);
    ctx.closePath();
    ctx.fill();

    const engineGradient = ctx.createRadialGradient(
      -bodyLength * 0.48,
      0,
      0,
      -bodyLength * 0.48,
      0,
      bodyHeight * 0.5
    );
    engineGradient.addColorStop(0, '#4a4a6a');
    engineGradient.addColorStop(0.5, '#2d2d4a');
    engineGradient.addColorStop(1, '#1a1a2e');

    ctx.fillStyle = engineGradient;
    ctx.beginPath();
    ctx.ellipse(-bodyLength * 0.48, 0, bodyHeight * 0.45, bodyHeight * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#12121f';
    ctx.beginPath();
    ctx.ellipse(-bodyLength * 0.48, 0, bodyHeight * 0.3, bodyHeight * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    if (ac.isThrusting && ac.fuel > 0) {
      const flameIntensity = 0.6 + 0.4 * Math.sin(time * 0.025);
      const flameLength = 50 + flameIntensity * 40;

      const outerFlameGradient = ctx.createLinearGradient(-bodyLength * 0.48 - flameLength, 0, -bodyLength * 0.48, 0);
      outerFlameGradient.addColorStop(0, 'transparent');
      outerFlameGradient.addColorStop(0.3, 'rgba(255, 100, 50, 0.4)');
      outerFlameGradient.addColorStop(0.6, 'rgba(255, 150, 80, 0.7)');
      outerFlameGradient.addColorStop(0.85, 'rgba(255, 220, 100, 0.9)');
      outerFlameGradient.addColorStop(1, 'rgba(255, 255, 200, 1)');

      ctx.fillStyle = outerFlameGradient;
      ctx.beginPath();
      ctx.moveTo(-bodyLength * 0.48, -bodyHeight * 0.35);
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.5,
        -bodyHeight * 0.5,
        -bodyLength * 0.48 - flameLength,
        -bodyHeight * 0.15
      );
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.7,
        0,
        -bodyLength * 0.48 - flameLength,
        bodyHeight * 0.15
      );
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.5,
        bodyHeight * 0.5,
        -bodyLength * 0.48,
        bodyHeight * 0.35
      );
      ctx.closePath();
      ctx.fill();

      const innerFlameGradient = ctx.createLinearGradient(-bodyLength * 0.48 - flameLength * 0.7, 0, -bodyLength * 0.48, 0);
      innerFlameGradient.addColorStop(0, 'transparent');
      innerFlameGradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.6)');
      innerFlameGradient.addColorStop(0.8, 'rgba(255, 255, 200, 0.95)');
      innerFlameGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

      ctx.fillStyle = innerFlameGradient;
      ctx.beginPath();
      ctx.moveTo(-bodyLength * 0.48, -bodyHeight * 0.2);
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.35,
        -bodyHeight * 0.3,
        -bodyLength * 0.48 - flameLength * 0.7,
        -bodyHeight * 0.08
      );
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.5,
        0,
        -bodyLength * 0.48 - flameLength * 0.7,
        bodyHeight * 0.08
      );
      ctx.quadraticCurveTo(
        -bodyLength * 0.48 - flameLength * 0.35,
        bodyHeight * 0.3,
        -bodyLength * 0.48,
        bodyHeight * 0.2
      );
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 5; i++) {
        const sparkDist = flameLength * (0.3 + Math.random() * 0.7);
        const sparkY = (Math.random() - 0.5) * bodyHeight * 0.6;
        const sparkSize = 2 + Math.random() * 4;
        const sparkBrightness = 0.5 + Math.random() * 0.5;

        ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, ${50 + Math.random() * 50}, ${sparkBrightness})`;
        ctx.beginPath();
        ctx.arc(-bodyLength * 0.48 - sparkDist, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const landingLightGradient = ctx.createRadialGradient(
      bodyLength * 0.48,
      -bodyHeight * 0.25,
      0,
      bodyLength * 0.48,
      -bodyHeight * 0.25,
      8
    );
    landingLightGradient.addColorStop(0, '#ffffff');
    landingLightGradient.addColorStop(0.3, '#ffffaa');
    landingLightGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = landingLightGradient;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.48, -bodyHeight * 0.25, 5, 0, Math.PI * 2);
    ctx.fill();

    const navLightColor = time % 2000 < 1000 ? '#ff4444' : '#ff8888';
    ctx.fillStyle = navLightColor;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.48, bodyHeight * 0.2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const drawThrustParticle = (
    ctx: CanvasRenderingContext2D,
    p: ThrustParticle
  ) => {
    const opacity = p.opacity;
    const size = p.size * opacity;

    const gradient = createGradient(ctx, p.x, p.y, size, [
      withAlpha(p.color, opacity),
      withAlpha(lightenColor(p.color, 30), opacity * 0.5),
      'transparent',
    ]);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawHUD = (
    ctx: CanvasRenderingContext2D,
    w: number,
    ac: typeof aircraft
  ) => {
    const padding = 20;
    const barWidth = 150;
    const barHeight = 8;

    const panelGradient = ctx.createLinearGradient(padding, padding, padding, padding + 80);
    panelGradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    panelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    ctx.fillStyle = panelGradient;
    ctx.beginPath();
    ctx.roundRect(padding, padding, barWidth + 10, 85, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('高度', padding + 8, padding + 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(padding + 8, padding + 25, barWidth - 6, barHeight);
    const altitudePercent = ac.altitude / 100;
    const altitudeGradient = ctx.createLinearGradient(
      padding + 8,
      0,
      padding + 8 + barWidth - 6,
      0
    );
    altitudeGradient.addColorStop(0, '#00f2fe');
    altitudeGradient.addColorStop(1, '#4facfe');
    ctx.fillStyle = altitudeGradient;
    ctx.fillRect(
      padding + 8,
      padding + 25,
      (barWidth - 6) * clamp(altitudePercent, 0, 1),
      barHeight
    );

    const speedY = padding + 48;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('速度', padding + 8, speedY + 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(padding + 8, speedY + 18, barWidth - 6, barHeight);
    const speedPercent = ac.speed / ac.maxSpeed;
    const speedGradient = ctx.createLinearGradient(
      padding + 8,
      0,
      padding + 8 + barWidth - 6,
      0
    );
    speedGradient.addColorStop(0, '#f093fb');
    speedGradient.addColorStop(1, '#f5576c');
    ctx.fillStyle = speedGradient;
    ctx.fillRect(
      padding + 8,
      speedY + 18,
      (barWidth - 6) * speedPercent,
      barHeight
    );

    const fuelX = w - padding - barWidth - 10;
    const fuelPanelGradient = ctx.createLinearGradient(fuelX, padding, fuelX, padding + 50);
    fuelPanelGradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    fuelPanelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    ctx.fillStyle = fuelPanelGradient;
    ctx.beginPath();
    ctx.roundRect(fuelX, padding, barWidth + 10, 50, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('燃料', fuelX + 8, padding + 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(fuelX + 8, padding + 25, barWidth - 6, barHeight);
    const fuelPercent = ac.fuel / ac.maxFuel;
    const fuelGradient = ctx.createLinearGradient(
      fuelX + 8,
      0,
      fuelX + 8 + (barWidth - 6),
      0
    );
    if (fuelPercent > 0.3) {
      fuelGradient.addColorStop(0, '#43e97b');
      fuelGradient.addColorStop(1, '#38f9d7');
    } else {
      fuelGradient.addColorStop(0, '#fa709a');
      fuelGradient.addColorStop(1, '#fee140');
    }
    ctx.fillStyle = fuelGradient;
    ctx.fillRect(
      fuelX + 8,
      padding + 25,
      (barWidth - 6) * fuelPercent,
      barHeight
    );

    const centerTextGradient = ctx.createLinearGradient(w / 2 - 100, 0, w / 2 + 100, 0);
    centerTextGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    centerTextGradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.95)');
    centerTextGradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

    ctx.fillStyle = centerTextGradient;
    ctx.font = '500 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `高度 ${Math.round(ac.altitude)}m · 速度 ${Math.round(ac.speed * 10)}km/h`,
      w / 2,
      padding + 25
    );
    ctx.textAlign = 'left';
  };

  const render = useCallback(
    (deltaTime: number, timestamp: number) => {
      const ctx = getContext();
      if (!ctx || width === 0 || height === 0) return;

      timeRef.current = timestamp;

      clear();

      // 1) 根据当前时间值解析调色板
      const env = environmentRef.current;
      const palette = getPaletteForTime(env.timeOfDay);

      // 2) 天空背景（含太阳/月亮 + 星空）
      drawSky(ctx, width, height, palette, timestamp);

      // 3) 山脉（应用用户高度倍数 + 时段色调）
      drawMountains(ctx, mountainsRef.current, width, height, timestamp, env.mountainHeight, palette);

      // 4) 云朵（更新位置后按时段色调绘制）
      updateClouds(cloudsRef.current, deltaTime, width, height);
      drawClouds(ctx, cloudsRef.current, palette);

      const ac = { ...aircraftRef.current };

      const lerpFactor = 0.07;
      ac.x = lerp(ac.x, mouseRef.current.x || width * 0.4, lerpFactor);
      ac.y = lerp(ac.y, mouseRef.current.y || height * 0.5, lerpFactor);

      const dx = mouseRef.current.x - ac.x;
      const dy = mouseRef.current.y - ac.y;
      const targetAngle = Math.atan2(dy, dx);
      ac.angle = lerpAngle(ac.angle, targetAngle, 0.09);

      if (mouseRef.current.isDown && ac.fuel > 0) {
        const acceleration = 500;
        ac.velocityX += Math.cos(ac.angle) * acceleration * deltaTime;
        ac.velocityY += Math.sin(ac.angle) * acceleration * deltaTime;
        ac.isThrusting = true;
        ac.fuel = Math.max(0, ac.fuel - deltaTime * 4.5);

        for (let i = 0; i < 3; i++) {
          const spread = (Math.random() - 0.5) * 0.6;
          const particleAngle = ac.angle + Math.PI + spread;
          const speed = randomRange(120, 250);
          addThrustParticle({
            id: generateId(),
            x: ac.x - Math.cos(ac.angle) * 45,
            y: ac.y - Math.sin(ac.angle) * 45,
            vx: Math.cos(particleAngle) * speed,
            vy: Math.sin(particleAngle) * speed,
            size: randomRange(4, 10),
            color: `hsl(${25 + Math.random() * 35}, 100%, 65%)`,
            opacity: 1,
            life: randomRange(25, 50),
            maxLife: 50,
          });
        }
      } else {
        ac.isThrusting = false;
        ac.fuel = Math.min(ac.maxFuel, ac.fuel + deltaTime * 12);
      }

      const drag = 0.985;
      ac.velocityX *= drag;
      ac.velocityY *= drag;

      ac.speed = Math.sqrt(ac.velocityX ** 2 + ac.velocityY ** 2);
      if (ac.speed > ac.maxSpeed * 60) {
        const scale = (ac.maxSpeed * 60) / ac.speed;
        ac.velocityX *= scale;
        ac.velocityY *= scale;
        ac.speed = ac.maxSpeed * 60;
      }

      ac.x += ac.velocityX * deltaTime;
      ac.y += ac.velocityY * deltaTime;

      ac.x = clamp(ac.x, 80, width - 80);
      ac.y = clamp(ac.y, 80, height - 80);

      ac.altitude = (height - ac.y) / (height * 0.01);
      ac.speed = ac.speed / 60;

      drawSpeedLines(ctx, ac, timestamp);

      for (let i = thrustParticles.length - 1; i >= 0; i--) {
        const p = thrustParticles[i];
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= deltaTime * 60;
        p.opacity = Math.max(0, p.life / p.maxLife);

        if (p.life <= 0) {
          thrustParticles.splice(i, 1);
        } else {
          drawThrustParticle(ctx, p);
        }
      }

      drawAircraft(ctx, ac, timestamp);

      // 5) 在所有场景元素之上叠加环境氛围色（如夜晚的冷蓝、日出的暖橙）
      drawAmbientOverlay(ctx, width, height, palette);

      drawHUD(ctx, width, ac);

      updateAircraft({
        x: ac.x,
        y: ac.y,
        velocityX: ac.velocityX,
        velocityY: ac.velocityY,
        angle: ac.angle,
        speed: ac.speed,
        altitude: ac.altitude,
        fuel: ac.fuel,
        isThrusting: ac.isThrusting,
      });
    },
    [
      getContext,
      width,
      height,
      clear,
      thrustParticles,
      addThrustParticle,
      updateAircraft,
    ]
  );

  useAnimationFrame(render, true);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.isDown = true;
      setCursorType('draw');
    }
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
    setCursorType('hover');
  };

  const handleMouseEnter = () => {
    onMouseEnter?.();
    setCursorType('hover');
  };

  const handleMouseLeave = () => {
    onMouseLeave?.();
    handleMouseUp();
    setCursorType('default');
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            mouseRef.current.x = touch.clientX - rect.left;
            mouseRef.current.y = touch.clientY - rect.top;
            mouseRef.current.isDown = true;
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            mouseRef.current.x = touch.clientX - rect.left;
            mouseRef.current.y = touch.clientY - rect.top;
          }
        }}
        onTouchEnd={handleMouseUp}
      />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none text-center">
        <div>
          {mouseRef.current.isDown
            ? '按住加速，穿越云层 ✈️'
            : '移动鼠标控制方向，按住加速起飞'}
        </div>
        <div className="text-xs mt-1">松开减速，自动补充燃料</div>
      </div>
    </div>
  );
};
