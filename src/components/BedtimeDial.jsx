import React, { useState, useEffect, useRef } from 'react';
import { Moon } from 'lucide-react';

export const BedtimeDial = ({ value, onChange, darkMode }) => {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const safeValue = value || '22:00';

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const formatTime = (totalMinutes) => {
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    h = h % 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const currentMinutes = parseTime(safeValue);

  const minutesToDegrees = (minutes) => {
    return (minutes / 1440) * 360;
  };

  const degreesToMinutes = (degrees) => {
    let d = degrees;
    if (d < 0) d += 360;
    d = d % 360;
    const totalMinutes = (d / 360) * 1440;
    const snapped = Math.round(totalMinutes / 15) * 15;
    return snapped % 1440;
  };

  const getAngleFromEvent = (event) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    let clockDeg = angleDeg + 90;
    if (clockDeg < 0) clockDeg += 360;
    return clockDeg;
  };

  const handleStart = (e) => {
    setIsDragging(true);
    handleMove(e);
  };

  const handleMove = (e) => {
    if (!isDragging && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    if (e.type === 'touchmove') e.preventDefault();
    const angle = getAngleFromEvent(e);
    const minutes = degreesToMinutes(angle);
    if (typeof onChange === 'function') {
      onChange(formatTime(minutes));
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMove = (e) => isDragging && handleMove(e);
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  const RADIUS = 100;
  const TRACK_WIDTH = 12;
  const HANDLE_RADIUS = 18;
  const LABEL_RADIUS = RADIUS - 25;
  const currentAngle = minutesToDegrees(currentMinutes);
  const rad = (currentAngle * Math.PI) / 180;
  const handleX = RADIUS * Math.sin(rad);
  const handleY = -RADIUS * Math.cos(rad);

  const getDisplayTime = () => {
    const [h, m] = safeValue.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return {
      time: `${displayH}:${m.toString().padStart(2, '0')}`,
      period
    };
  };

  const { time, period } = getDisplayTime();

  const ticks = [
    { label: '12', sub: 'AM', angle: 0 },
    { label: '6', sub: 'AM', angle: 90 },
    { label: '12', sub: 'PM', angle: 180 },
    { label: '6', sub: 'PM', angle: 270 },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full py-4 touch-none select-none">
      <svg
        ref={svgRef}
        width="260"
        height="260"
        viewBox="-130 -130 260 260"
        className="cursor-pointer touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
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
            y="80"
            textAnchor="middle"
            fill={darkMode ? '#60a5fa' : '#3b82f6'}
            fontSize="10"
            fontWeight="600"
          >
            Release to set
          </text>
        )}
      </svg>
    </div>
  );
};
