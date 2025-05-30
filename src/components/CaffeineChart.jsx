import React, { useState, useMemo } from 'react';
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
  AreaChart,
  Dot,
  Legend
} from 'recharts';
import { Coffee, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Eye, EyeOff, BarChart2 } from 'lucide-react';
import { ChartControls, ChartAnalytics } from './ChartControls';

export const CaffeineChart = ({ 
  data, 
  caffeineLimit, 
  sleepTime, 
  targetSleepCaffeine,
  darkMode = false 
}) => {
  const [chartType, setChartType] = useState('line'); // 'line', 'area', or 'smooth'
  const [showGrid, setShowGrid] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState('24h'); // '6h', '12h', '24h', 'all'

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

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffTime;
    
    switch (timeRange) {
      case '6h':
        cutoffTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
        break;
      case '12h':
        cutoffTime = new Date(now.getTime() - (12 * 60 * 60 * 1000));
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      default:
        return data;
    }
    
    return data.filter(point => new Date(point.time) >= cutoffTime);
  }, [data, timeRange]);

  // Calculate chart statistics
  const chartStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    
    const levels = filteredData.map(d => d.level);
    const currentLevel = levels[levels.length - 1] || 0;
    const maxLevel = Math.max(...levels);
    const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    const trend = levels.length > 1 ? levels[levels.length - 1] - levels[levels.length - 2] : 0;
    
    return {
      current: Math.round(currentLevel),
      max: Math.round(maxLevel),
      average: Math.round(avgLevel),
      trend: Math.round(trend * 10) / 10 // Round to 1 decimal
    };
  }, [filteredData]);

  // Find peaks (caffeine intake moments)
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

  // Format time for x-axis with smarter formatting
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Enhanced tooltip with more information
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const level = payload[0].value;
      const formattedTime = date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Determine status
      const percentage = (level / caffeineLimit) * 100;
      let status = { text: 'Low', color: 'text-green-500' };
      if (percentage >= 80) status = { text: 'High', color: 'text-red-500' };
      else if (percentage >= 50) status = { text: 'Moderate', color: 'text-yellow-500' };

      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
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
          <div className="text-xs opacity-75">
            {Math.round((level / caffeineLimit) * 100)}% of daily limit
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Custom dot for peaks
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isPeak = peaks.some(peak => 
      new Date(peak.time).getTime() === new Date(payload.time).getTime()
    );
    
    if (isPeak) {
      return (
        <Dot 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill={darkMode ? '#fbbf24' : '#f59e0b'}
          stroke={darkMode ? '#92400e' : '#d97706'}
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  // Chart component selection
  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const lineType = chartType === 'smooth' ? 'monotone' : 'linear';

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      {/* Header with stats */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <BarChart2 size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            Caffeine Levels
          </h2>
          
          {/* Quick Stats */}
          {chartStats && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Current:</span>
                <span className="font-semibold">{chartStats.current} mg</span>
                {chartStats.trend !== 0 && (
                  <span className={`flex items-center gap-1 ${
                    chartStats.trend > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {chartStats.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(chartStats.trend)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Peak:</span>
                <span className="font-semibold">{chartStats.max} mg</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Avg:</span>
                <span className="font-semibold">{chartStats.average} mg</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="ml-4">
          <ChartControls
            chartType={chartType}
            setChartType={setChartType}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            showAnalytics={showAnalytics}
            setShowAnalytics={setShowAnalytics}
            darkMode={darkMode}
          />
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke={darkMode ? '#374151' : '#e5e7eb'} 
                opacity={0.5}
              />
            )}
            
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              fontSize={12}
              tickLine={false}
            />
            
            <YAxis 
              stroke={darkMode ? '#9ca3af' : '#6b7280'} 
              domain={[0, Math.max(caffeineLimit * 1.2, 100)]}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines with enhanced styling */}
            <ReferenceLine 
              y={caffeineLimit} 
              stroke={darkMode ? '#ef4444' : '#dc2626'} 
              strokeDasharray="4 4" 
              strokeWidth={2}
              label={{ 
                value: `Limit (${caffeineLimit}mg)`, 
                position: 'topRight',
                fill: darkMode ? '#ef4444' : '#dc2626',
                fontSize: 12,
                fontWeight: 'bold'
              }} 
            />
            
            <ReferenceLine 
              x={sleepTimeDate} 
              stroke={darkMode ? '#8b5cf6' : '#7c3aed'} 
              strokeDasharray="4 4" 
              strokeWidth={2}
              label={{ 
                value: 'Sleep Time', 
                position: 'top',
                fill: darkMode ? '#8b5cf6' : '#7c3aed',
                fontSize: 12,
                fontWeight: 'bold'
              }} 
            />
            
            <ReferenceLine 
              y={targetSleepCaffeine} 
              stroke={darkMode ? '#10b981' : '#059669'} 
              strokeDasharray="4 4" 
              strokeWidth={2}
              label={{ 
                value: `Sleep Target (${targetSleepCaffeine}mg)`, 
                position: 'topLeft',
                fill: darkMode ? '#10b981' : '#059669',
                fontSize: 12,
                fontWeight: 'bold'
              }} 
            />
            
            {chartType === 'area' ? (
              <Area
                type={lineType}
                dataKey="level"
                stroke={darkMode ? '#3b82f6' : '#2563eb'}
                fill={darkMode ? '#3b82f6' : '#2563eb'}
                fillOpacity={0.2}
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 6, 
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
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ 
                  r: 6, 
                  fill: darkMode ? '#60a5fa' : '#3b82f6',
                  stroke: darkMode ? '#1e40af' : '#1d4ed8',
                  strokeWidth: 2
                }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-6">
          <ChartAnalytics
            chartStats={chartStats}
            peaks={peaks}
            caffeineLimit={caffeineLimit}
            targetSleepCaffeine={targetSleepCaffeine}
            darkMode={darkMode}
          />
        </div>
      )}
      
      {/* Enhanced Legend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-0.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Caffeine Level</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-red-500' : 'border-red-600'}`} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Daily Limit</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-green-500' : 'border-green-600'}`} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Sleep Target</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-purple-500' : 'border-purple-600'}`} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Sleep Time</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-yellow-500' : 'bg-yellow-600'}`} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Intake Moments</span>
          </div>
          
          {peaks.length > 0 && (
            <div className="text-xs opacity-75">
              {peaks.length} intake{peaks.length !== 1 ? 's' : ''} detected
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      {chartStats && !showAnalytics && (
        <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            <span className="text-sm font-medium">Quick Insights</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 text-xs">
            {chartStats.current > caffeineLimit && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={12} />
                <span>Currently above daily limit</span>
              </div>
            )}
            
            {chartStats.trend > 0 && (
              <div className="flex items-center gap-2 text-yellow-500">
                <TrendingUp size={12} />
                <span>Caffeine levels rising</span>
              </div>
            )}
            
            {chartStats.trend < 0 && (
              <div className="flex items-center gap-2 text-green-500">
                <TrendingDown size={12} />
                <span>Caffeine levels declining</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-blue-500">
              <Clock size={12} />
              <span>Sleep ready: {chartStats.current <= targetSleepCaffeine ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 