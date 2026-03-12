// Parse time string like "2h", "2h30", "2.5h" to minutes
export const parseHourStringToMinutes = (time: string): number => {
  if (!time) return 0;

  time = time.trim().toLowerCase();

  // 2.5h
  if (time.includes(".")) {
    const hours = parseFloat(time.replace("h", ""));
    return Math.round(hours * 60);
  }

  // 2h30
  const match = time.match(/^(\d+)h(?:(\d+))?$/);

  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);

  return hours * 60 + minutes;
};

// Parse range like "2h-3h", "2h30-3h30" to { min, max }
export const parseTimeRange = (range: string) => {
  if (!range) return { min: 0, max: 0 };

  const [min, max] = range.split("-");

  return {
    dailyTargetMin: parseHourStringToMinutes(min),
    dailyTargetDuration: parseHourStringToMinutes(max),
  };
};

// Alias for estimated duration parsing
export const parseEstimatedDuration = (value: string): number => {
  return parseHourStringToMinutes(value);
};

// Convert minutes back to hour string for display
export const minutesToHourString = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (m === 0) return `${h}h`;

  return `${h}h${m}`;
};

// Regex for form validation
export const timeRegex = /^(\d+h\d+|\d+(\.\d+)?h)$/;
export const rangeRegex = /^(\d+h\d+|\d+(\.\d+)?h)-(\d+h\d+|\d+(\.\d+)?h)$/;
