import React from 'react';
import { BarChart2, Eye, EyeOff, Calendar, TrendingUp, Activity, Zap, Clock } from 'lucide-react';

export const ChartControls = ({
  chartType,
  setChartType,
  showGrid,
  setShowGrid,
  timeRange,
  setTimeRange,
  showAnalytics,
  setShowAnalytics,
  darkMode = false
}) => {
  const timeRangeOptions = [
    { value: '6h', label: '6H', icon: <Clock size={12} /> },
    { value: '12h', label: '12H', icon: <Clock size={12} /> },
    { value: '24h', label: '24H', icon: <Calendar size={12} /> },
    { value: 'all', label: 'ALL', icon: <Activity size={12} /> }
  ];

  const chartTypeOptions = [
    { value: 'line', label: 'Line', icon: <TrendingUp size={14} /> },
    { value: 'area', label: 'Area', icon: <BarChart2 size={14} /> },
    { value: 'smooth', label: 'Smooth', icon: <Activity size={14} /> }
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Time Range Controls */}
      <div className="flex flex-col gap-2">
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Time Range
        </span>
        <div className="flex gap-1">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 transition-all ${
                timeRange === option.value
                  ? darkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Controls */}
      <div className="flex flex-col gap-2">
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Chart Style
        </span>
        <div className="flex gap-1">
          {chartTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setChartType(option.value)}
              className={`p-2 rounded-md transition-all ${
                chartType === option.value
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={`Switch to ${option.label} chart`}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="flex flex-col gap-2">
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Display
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-md transition-all ${
              showGrid
                ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle grid"
          >
            {showGrid ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-2 rounded-md transition-all ${
              showAnalytics
                ? darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle analytics"
          >
            <Zap size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChartAnalytics = ({ 
  chartStats, 
  peaks, 
  caffeineLimit, 
  targetSleepCaffeine,
  darkMode = false 
}) => {
  if (!chartStats) return null;

  const getStatusColor = (value, limit) => {
    const percentage = (value / limit) * 100;
    if (percentage >= 80) return darkMode ? 'text-red-400' : 'text-red-600';
    if (percentage >= 50) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-green-400' : 'text-green-600';
  };

  const insights = [
    {
      icon: <Activity size={14} />,
      label: 'Current Level',
      value: `${chartStats.current} mg`,
      status: getStatusColor(chartStats.current, caffeineLimit),
      percentage: Math.round((chartStats.current / caffeineLimit) * 100)
    },
    {
      icon: <TrendingUp size={14} />,
      label: 'Peak Today',
      value: `${chartStats.max} mg`,
      status: getStatusColor(chartStats.max, caffeineLimit),
      percentage: Math.round((chartStats.max / caffeineLimit) * 100)
    },
    {
      icon: <BarChart2 size={14} />,
      label: 'Average',
      value: `${chartStats.average} mg`,
      status: getStatusColor(chartStats.average, caffeineLimit),
      percentage: Math.round((chartStats.average / caffeineLimit) * 100)
    }
  ];

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} space-y-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
        <span className="font-medium text-sm">Analytics</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                {insight.icon}
              </div>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {insight.label}
              </span>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${insight.status}`}>
                {insight.value}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {insight.percentage}% of limit
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Intake Summary */}
      {peaks.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Intake Events
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {peaks.length} detected
            </span>
          </div>
          
          <div className="space-y-1">
            {peaks.slice(0, 3).map((peak, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {new Date(peak.time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>
                  {Math.round(peak.level)} mg
                </span>
              </div>
            ))}
            {peaks.length > 3 && (
              <div className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                +{peaks.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sleep Readiness */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Sleep Ready
          </span>
          <span className={`text-sm font-semibold ${
            chartStats.current <= targetSleepCaffeine 
              ? darkMode ? 'text-green-400' : 'text-green-600'
              : darkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            {chartStats.current <= targetSleepCaffeine ? 'Yes' : 'No'}
          </span>
        </div>
        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Target: ≤{targetSleepCaffeine} mg
        </div>
      </div>
    </div>
  );
}; 