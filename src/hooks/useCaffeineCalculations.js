import { useMemo } from 'react';
import { calculateCaffeineAtTime, getDecayConstant } from '../utils/caffeine';
import { parseSleepTime } from '../utils/time';

const calculateCurrentCaffeineLevel = (intakes, settings) => {
  const nowMs = Date.now();
  const decayConstant = getDecayConstant(settings);
  if (!Number.isFinite(decayConstant) || decayConstant <= 0) return 0;
  const halfLifeMs = Math.log(2) / decayConstant;
  const currentLevel = calculateCaffeineAtTime(intakes, nowMs, halfLifeMs);
  return Math.round(currentLevel);
};

const generateChartData = (intakes, settings) => {
  const now = new Date();
  const data = [];

  const sortedIntakes = [...intakes].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const intakeSeries = sortedIntakes
    .map((intake) => ({
      ...intake,
      timeMs: new Date(intake.timestamp).getTime()
    }))
    .filter((intake) => Number.isFinite(intake.timeMs) && Number.isFinite(intake.amount));

  const decayConstant = getDecayConstant(settings);

  let startTime = new Date(now.getTime() - (12 * 60 * 60 * 1000));
  if (intakeSeries.length > 0) {
    const earliestIntake = new Date(intakeSeries[0].timeMs);
    if (earliestIntake < startTime) {
      startTime = earliestIntake;
    }
  }

  const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000));

  const getChartStepMs = (rangeMs) => {
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    if (rangeMs <= 36 * hour) return 15 * 60 * 1000;
    if (rangeMs <= 3 * day) return 30 * 60 * 1000;
    if (rangeMs <= 7 * day) return hour;
    if (rangeMs <= 30 * day) return 2 * hour;
    return 4 * hour;
  };

  const rangeMs = endTime.getTime() - startTime.getTime();
  const stepMs = getChartStepMs(rangeMs);
  const alignedStartMs = Math.floor(startTime.getTime() / stepMs) * stepMs;
  const startMs = Math.min(alignedStartMs, startTime.getTime());
  const endMs = endTime.getTime();

  const timePoints = new Set();
  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepMs) {
    timePoints.add(timeMs);
  }

  timePoints.add(now.getTime());
  intakeSeries.forEach((intake) => {
    if (intake.timeMs >= startMs - stepMs && intake.timeMs <= endMs + stepMs) {
      timePoints.add(intake.timeMs);
    }
  });

  const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);

  sortedTimes.forEach((timeMs) => {
    let caffeineLevel = 0;

    intakeSeries.forEach((intake) => {
      const elapsedMs = timeMs - intake.timeMs;

      if (elapsedMs >= 0) {
        const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
        caffeineLevel += remainingAmount;
      }
    });

    data.push({
      time: new Date(timeMs),
      level: Math.round(caffeineLevel)
    });
  });

  return data;
};

export const useCaffeineCalculations = (intakes, settings) => {
  const chartData = useMemo(
    () => generateChartData(intakes, settings),
    [intakes, settings]
  );

  const currentCaffeineLevel = useMemo(
    () => calculateCurrentCaffeineLevel(intakes, settings),
    [intakes, settings]
  );

  const sleepTimeInfo = useMemo(() => {
    const safeSleepTime = settings.sleepTime || '22:00';
    const { sleepTimeDate } = parseSleepTime(safeSleepTime);

    let caffeineAtSleep = 0;
    if (chartData && chartData.length > 0) {
      let closestPoint = chartData[0];
      let smallestDiff = Math.abs(chartData[0].time - sleepTimeDate);

      for (let i = 1; i < chartData.length; i++) {
        const diff = Math.abs(chartData[i].time - sleepTimeDate);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestPoint = chartData[i];
        }
      }
      caffeineAtSleep = closestPoint.level;
    }

    const isReadyForSleep = caffeineAtSleep <= settings.targetSleepCaffeine;
    return { caffeineAtSleep, isReadyForSleep };
  }, [chartData, settings.sleepTime, settings.targetSleepCaffeine]);

  return { chartData, currentCaffeineLevel, sleepTimeInfo };
};
