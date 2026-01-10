import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Moon } from 'lucide-react';

const RADIUS = 100;
const TRACK_WIDTH = 12;
const HANDLE_RADIUS = 18;
const LABEL_RADIUS = RADIUS - 25;
const TOUCH_TOLERANCE = 18;
const MIN_TOUCH_RADIUS = RADIUS - TOUCH_TOLERANCE;
const MAX_TOUCH_RADIUS = RADIUS + TOUCH_TOLERANCE;

const parseTime = (timeStr) => {
  const [h = '0', m = '0'] = (timeStr || '').split(':');
  return Number(h) * 60 + Number(m);
};

const formatTime = (totalMinutes) => {
  let h = Math.floor(totalMinutes / 60);
  let m = totalMinutes % 60;
  h = h % 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const minutesToDegrees = (minutes) => (minutes / 1440) * 360;

const degreesToMinutes = (degrees) => {
  let d = degrees;
  if (d < 0) d += 360;
  d = d % 360;
  const totalMinutes = (d / 360) * 1440;
  const snapped = Math.round(totalMinutes / 15) * 15;
  return snapped % 1440;
};

const getPointerCoordinates = (event, preferredId) => {
  if (event.touches && event.touches.length) {
    if (typeof preferredId === 'number') {
      for (let i = 0; i < event.touches.length; i += 1) {
        const touch = event.touches[i];
        if (touch.identifier === preferredId) {
          return { clientX: touch.clientX, clientY: touch.clientY, pointerId: preferredId, pointerType: 'touch' };
        }
      }
    }
    const primaryTouch = event.touches[0];
    return {
      clientX: primaryTouch.clientX,
      clientY: primaryTouch.clientY,
      pointerId: primaryTouch.identifier,
      pointerType: 'touch'
    };
  }

  if (event.changedTouches && event.changedTouches.length && typeof preferredId === 'number') {
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const touch = event.changedTouches[i];
      if (touch.identifier === preferredId) {
        return { clientX: touch.clientX, clientY: touch.clientY, pointerId: preferredId, pointerType: 'touch' };
      }
    }
  }

  return {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: 'mouse',
    pointerType: 'mouse'
  };
};

const getPointerState = (event, preferredPointerId, svgEl) => {
  if (!svgEl) return null;
  const rect = svgEl.getBoundingClientRect();
  const { clientX, clientY, pointerId, pointerType } = getPointerCoordinates(event, preferredPointerId);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let angleRad = Math.atan2(dy, dx);
  let angleDeg = angleRad * (180 / Math.PI);
  let clockDeg = angleDeg + 90;
  if (clockDeg < 0) clockDeg += 360;

  return { clientX, clientY, pointerId, pointerType, angle: clockDeg, distance };
};

export const BedtimeDial = ({ value, onChange, darkMode }) => {
  const safeValue = value || '22:00';
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const activePointerIdRef = useRef(null);

  const currentMinutes = parseTime(safeValue);
  const currentAngle = minutesToDegrees(currentMinutes);
  const rad = (currentAngle * Math.PI) / 180;
  const handleX = RADIUS * Math.sin(rad);
  const handleY = -RADIUS * Math.cos(rad);

  const updateTimeByAngle = useCallback((angle) => {
    const minutes = degreesToMinutes(angle);
    if (typeof onChange === 'function') {
      onChange(formatTime(minutes));
    }
  }, [onChange]);

  const handleStart = (event) => {
    const pointer = getPointerState(event, null, svgRef.current);
    if (!pointer) return;
    const withinHandle = pointer.distance >= MIN_TOUCH_RADIUS && pointer.distance <= MAX_TOUCH_RADIUS;
    if (!withinHandle) return;

    activePointerIdRef.current = pointer.pointerId;
    setIsDragging(true);
    updateTimeByAngle(pointer.angle);
  };

  const handleMove = useCallback((event) => {
    if (!isDragging) return;
    const pointer = getPointerState(event, activePointerIdRef.current, svgRef.current);
    if (!pointer) return;
    if (pointer.pointerType === 'touch') event.preventDefault();
    updateTimeByAngle(pointer.angle);
  }, [isDragging, updateTimeByAngle]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    activePointerIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, handleEnd, handleMove]);

  const getDisplayTime = () => {
    const [h = '0', m = '0'] = safeValue.split(':');
    const hour = Number(h);
    const minute = Number(m);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayH = hour % 12 || 12;
    return {
      time: `${displayH}:${minute.toString().padStart(2, '0')}`,
      period
    };
  };

  const { time, period } = getDisplayTime();

  const ticks = [
    { label: '12', sub: 'AM', angle: 0 },
    { label: '6', sub: 'AM', angle: 90 },
    { label: '12', sub: 'PM', angle: 180 },
    { label: '6', sub: 'PM', angle: 270 }
  ];

  return (
    <div
      className="flex flex-col items-center justify-center w-full py-4 select-none"
      style={{ touchAction: isDragging ? 'none' : 'manipulation' }}
    >
      <svg
        ref={svgRef}
        width="260"
        height="260"
        viewBox="-130 -130 260 260"
        className="cursor-pointer"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="handleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        <circle
          cx="0"
          cy="0"
          r={RADIUS}
          fill="none"
          stroke={darkMode ? '#1e293b' : '#e2e8f0'}
          strokeWidth={TRACK_WIDTH}
        />

        {ticks.map((tick) => {
          const tickRad = (tick.angle * Math.PI) / 180;
          const x = LABEL_RADIUS * Math.sin(tickRad);
          const y = -LABEL_RADIUS * Math.cos(tickRad);
          return (
            <g key={tick.angle} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={darkMode ? '#64748b' : '#94a3b8'}
                fontSize="10"
                fontWeight="600"
              >
                {tick.label}
              </text>
              <text
                y="8"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={darkMode ? '#64748b' : '#94a3b8'}
                fontSize="8"
              >
                {tick.sub}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${handleX}, ${handleY})`} style={{ cursor: 'grab' }}>
          <circle
            r={HANDLE_RADIUS}
            fill={darkMode ? '#3b82f6' : '#2563eb'}
            filter="url(#handleShadow)"
          />
          <g transform="scale(0.8) translate(-12, -12)">
            <Moon color="white" fill="white" size={24} />
          </g>
        </g>

        <text
          x="0"
          y="-5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={darkMode ? '#e2e8f0' : '#1e293b'}
          fontSize="32"
          fontWeight="bold"
        >
          {time}
        </text>
        <text
          x="0"
          y="25"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={darkMode ? '#94a3b8' : '#64748b'}
          fontSize="14"
          fontWeight="500"
        >
          {period}
        </text>

        {isDragging && (
          <text
            x="0"
            y="95"
            textAnchor="middle"
            fill={darkMode ? '#60a5fa' : '#3b82f6'}
            fontSize="11"
            fontWeight="600"
          >
            Release to set
          </text>
        )}
      </svg>
    </div>
  );
};

