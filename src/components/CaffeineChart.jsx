import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { Coffee, BarChart2, Eye, EyeOff } from 'lucide-react';

const RANGE_OPTIONS = [
  { value: 'day', label: 'Today', durationMs: 24 * 60 * 60 * 1000 },
  { value: '3d', label: 'Last 3 Days', durationMs: 3 * 24 * 60 * 60 * 1000 },
  { value: 'week', label: 'Last Week', durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'All Drinks' }
];

const LIMIT_PRESETS = [200, 300, 400, 500];

export const CaffeineChart = ({ 
  data, 
  caffeineLimit, 
  sleepTime, 
  targetSleepCaffeine,
  darkMode = false 
}) => {
  const [rangePreset, setRangePreset] = useState('day'); // today, 3d, week, all
  const [limitField, setLimitField] = useState(String(caffeineLimit));

  useEffect(() => {
    setLimitField(String(caffeineLimit));
  }, [caffeineLimit]);

  // Parse sleep time to create a reference line
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);
  
  // Create a date object for today's sleep time
  const today = new Date();
  const sleepTimeDate = new Date(today);
  sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);
  
  // If sleep time is in the past for today, use tomorrow's date
  if (sleepTimeDate < today) {
    sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
  }

  const resolvedLimit = useMemo(() => {
    const parsed = parseInt(limitField, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return caffeineLimit;
    }
    return Math.min(Math.max(parsed, 50), 800);
  }, [limitField, caffeineLimit]);

  // Filter data based on date preset
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (rangePreset === 'all') {
      return data;
    }

    const selectedRange = RANGE_OPTIONS.find(option => option.value === rangePreset);
    if (!selectedRange || !selectedRange.durationMs) {
      return data;
    }
    
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - selectedRange.durationMs);
    
    return data.filter(point => new Date(point.time) >= cutoffTime);
  }, [data, rangePreset]);

  // Calculate current caffeine level (fixed calculation)
  const currentCaffeineLevel = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    
    // Get the most recent data point
    const sortedData = [...filteredData].sort((a, b) => new Date(a.time) - new Date(b.time));
    const mostRecent = sortedData[sortedData.length - 1];
    
    return Math.round(mostRecent?.level || 0);
  }, [filteredData]);

  // Calculate peak level for today
  const peakLevel = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    
    const levels = filteredData.map(d => d.level);
    return Math.round(Math.max(...levels));
  }, [filteredData]);

  // Find peaks for hover highlighting only
  const peaks = useMemo(() => {
    if (!filteredData || filteredData.length < 3) return [];
    
    const peakPoints = [];
    for (let i = 1; i < filteredData.length - 1; i++) {
      const prev = filteredData[i - 1].level;
      const current = filteredData[i].level;
      const next = filteredData[i + 1].level;
      
      // Detect significant increases (likely intake moments)
      if (current > prev + 20 && current > next + 10) {
        peakPoints.push({
          time: filteredData[i].time,
          level: current,
          index: i
        });
      }
    }
    return peakPoints;
  }, [filteredData]);

  // Format time for x-axis with mobile-friendly formatting
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Enhanced tooltip with peak highlighting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const level = payload[0].value;
      const formattedTime = date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      // Check if this is a peak
      const isPeak = peaks.some(peak => 
        Math.abs(new Date(peak.time).getTime() - date.getTime()) < 60000 // Within 1 minute
      );
      
      // Determine status
      const percentage = (level / resolvedLimit) * 100;
      let status = { text: 'Low', color: 'text-green-500' };
      if (percentage >= 80) status = { text: 'High', color: 'text-red-500' };
      else if (percentage >= 50) status = { text: 'Moderate', color: 'text-yellow-500' };

      return (
        <div className={`p-3 rounded-lg shadow-lg border max-w-xs ${
          darkMode 
            ? 'bg-gray-800 text-white border-gray-600' 
            : 'bg-white text-gray-900 border-gray-200'
        }`}>
          <p className="font-medium text-sm mb-1">{formattedTime}</p>
          <div className="flex items-center gap-2 mb-1">
            <Coffee size={14} className="text-blue-500" />
            <span className="font-bold text-lg">{Math.round(level)} mg</span>
            <span className={`text-xs font-medium ${status.color}`}>({status.text})</span>
          </div>
          {isPeak && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              ☕ Intake detected
            </div>
          )}
          <div className="text-xs opacity-75">
            {Math.round((level / resolvedLimit) * 100)}% of daily limit
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Chart component selection (fixed to AreaChart for consistent look)
  const ChartComponent = AreaChart;
  const lineType = 'monotone';

  const yAxisMax = useMemo(() => {
    const limitCandidate = resolvedLimit || caffeineLimit;
    const dataPeak = peakLevel || 0;
    const target = Math.max(limitCandidate * 1.1, dataPeak * 1.1, 120);
    return Math.ceil(target / 25) * 25;
  }, [resolvedLimit, caffeineLimit, peakLevel]);

  const remainingLimit = Math.max(resolvedLimit - currentCaffeineLevel, 0);

  const handleLimitBlur = () => {
    const parsed = parseInt(limitField, 10);
    if (Number.isNaN(parsed)) {
      setLimitField(String(caffeineLimit));
      return;
    }
    const normalized = Math.min(Math.max(parsed, 50), 800);
    setLimitField(String(normalized));
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-2xl shadow-lg border space-y-6 ${
        darkMode
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <BarChart2 size={18} className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
            Trending Intake
          </div>
          <h2 className="text-2xl font-bold mt-1">Caffeine Levels</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:text-base">
          <div className={`rounded-xl p-3 border col-span-2 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Approx. Caffeine</p>
            <p className="text-2xl font-bold">{currentCaffeineLevel} mg</p>
          </div>
          <div className={`rounded-xl p-3 border ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Peak</p>
            <p className="text-lg font-semibold">{peakLevel} mg</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Date window
          </span>
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value)}
            className={`w-full p-2.5 rounded-xl border font-medium appearance-none ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Upper limit (mg)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="50"
              max="800"
              value={limitField}
              onChange={(e) => setLimitField(e.target.value)}
              onBlur={handleLimitBlur}
              className={`flex-1 rounded-xl px-3 py-2 border font-semibold ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>mg</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 sm:h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darkMode ? '#3b82f6' : '#2563eb'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={darkMode ? '#3b82f6' : '#2563eb'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke={darkMode ? '#374151' : '#e5e7eb'} 
              opacity={0.5}
            />
            
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            
            <YAxis 
              stroke={darkMode ? '#9ca3af' : '#6b7280'} 
              domain={[0, yAxisMax]}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines without labels */}
            <ReferenceLine 
              y={resolvedLimit} 
              stroke={darkMode ? '#ef4444' : '#dc2626'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            <ReferenceLine 
              x={sleepTimeDate} 
              stroke={darkMode ? '#8b5cf6' : '#7c3aed'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            <ReferenceLine 
              y={targetSleepCaffeine} 
              stroke={darkMode ? '#10b981' : '#059669'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            {chartType === 'area' ? (
              <Area
                type={lineType}
                dataKey="level"
                stroke={darkMode ? '#3b82f6' : '#2563eb'}
                fill={darkMode ? '#3b82f6' : '#2563eb'}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: darkMode ? '#60a5fa' : '#3b82f6',
                  stroke: darkMode ? '#1e40af' : '#1d4ed8',
                  strokeWidth: 2
                }}
              />
            ) : (
              <Line
                type={lineType}
                dataKey="level"
                stroke={darkMode ? '#3b82f6' : '#2563eb'}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: darkMode ? '#60a5fa' : '#3b82f6',
                  stroke: darkMode ? '#1e40af' : '#1d4ed8',
                  strokeWidth: 2
                }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
          <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>Caffeine Level</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-red-500' : 'border-red-600'}`} />
          <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
            Daily Limit ({resolvedLimit}mg)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-green-500' : 'border-green-600'}`} />
          <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
            Sleep Target ({targetSleepCaffeine}mg)
          </span>
        </div>
      </div>
    </div>
  );
}; 