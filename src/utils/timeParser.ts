/**
 * Chuyển đổi bất kỳ chuỗi thời gian nào sang số phút một cách cực kỳ linh hoạt.
 * Hỗ trợ các định dạng:
 * - Số phút đơn thuần: "45", "17m", "42p", "50 phút", "50min", "85 mins"
 * - Số giờ thập phân: "1.2h", "0.75h", "2.5 giờ", "1.5 hrs"
 * - Giờ và phút kết hợp: "1h13", "1h20m", "1h 20p", "2h5", "2 giờ 15 phút", "1:20"
 * - Chỉ có giờ: "1h", "2 giờ", "3hrs"
 */
export const parseHourStringToMinutes = (input: string | number): number => {
  if (typeof input === "number") return Math.round(input);
  if (!input) return 0;

  const raw = input.toString().trim().toLowerCase();
  if (!raw) return 0;

  // 1. Nếu chỉ nhập số nguyên (coi là phút): "17", "45", "90"
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }

  // 2. Giờ thập phân: "1.2h", "2.5 giờ", "0.5h"
  const decimalHourMatch = raw.match(
    /^(\d+(?:\.\d+)?)\s*(?:h|giờ|gio|hr|hrs|hour|hours)$/,
  );
  if (decimalHourMatch) {
    const hours = parseFloat(decimalHourMatch[1]);
    return Math.round(hours * 60);
  }

  // 3. Chỉ có phút: "17m", "42p", "50 phút", "35min"
  const onlyMinutesMatch = raw.match(
    /^(\d+)\s*(?:m|p|phút|phut|min|mins|minute|minutes)$/,
  );
  if (onlyMinutesMatch) {
    return parseInt(onlyMinutesMatch[1], 10);
  }

  // 4. Kết hợp giờ và phút: "1h13", "1h20m", "1h 20p", "2h5", "1:30"
  const combinedMatch = raw.match(
    /^(\d+)\s*(?:h|giờ|gio|hr|hrs)?\s*[:h]?\s*(\d+)\s*(?:m|p|phút|phut|min|mins)?$/,
  );
  if (combinedMatch) {
    const hours = parseInt(combinedMatch[1], 10);
    const minutes = parseInt(combinedMatch[2], 10);
    return hours * 60 + minutes;
  }

  // 5. Chỉ có giờ nguyên: "2h", "3 giờ"
  const onlyHoursMatch = raw.match(/^(\d+)\s*(?:h|giờ|gio|hr|hrs)$/);
  if (onlyHoursMatch) {
    return parseInt(onlyHoursMatch[1], 10) * 60;
  }

  return 0;
};

/**
 * Phân tích khoảng thời gian mục tiêu ngày (Daily Target Range) cực kỳ linh hoạt:
 * - "35m - 1h10m"
 * - "45p - 1h20p"
 * - "17m - 42m"
 * - "1h - 2.5h"
 * - "50m đến 1h30"
 * - "40m ~ 1h15"
 * - Hoặc chỉ nhập 1 giá trị duy nhất: "1h13" hoặc "45m" (tự tính min = 80% max)
 */
export const parseTimeRange = (
  range: string,
): { dailyTargetMin: number; dailyTargetDuration: number } => {
  if (!range || !range.trim()) return { dailyTargetMin: 0, dailyTargetDuration: 0 };

  const clean = range.trim();
  // Tách bởi '-', '~', 'đến', 'to'
  const separators = /[-~]|đến|\bto\b/;
  const parts = clean.split(separators);

  if (parts.length >= 2) {
    const minVal = parseHourStringToMinutes(parts[0]);
    const maxVal = parseHourStringToMinutes(parts[1]);

    if (minVal > 0 && maxVal > 0) {
      const actualMin = Math.min(minVal, maxVal);
      const actualMax = Math.max(minVal, maxVal);
      return {
        dailyTargetMin: actualMin,
        dailyTargetDuration: actualMax,
      };
    } else if (maxVal > 0) {
      return {
        dailyTargetMin: Math.round(maxVal * 0.8),
        dailyTargetDuration: maxVal,
      };
    } else if (minVal > 0) {
      return {
        dailyTargetMin: Math.round(minVal * 0.8),
        dailyTargetDuration: minVal,
      };
    }
  }

  // Nếu người dùng chỉ nhập 1 mốc thời gian duy nhất (VD: "45m", "1h13", "1.5h")
  const singleVal = parseHourStringToMinutes(clean);
  if (singleVal > 0) {
    return {
      dailyTargetMin: Math.round(singleVal * 0.8),
      dailyTargetDuration: singleVal,
    };
  }

  return { dailyTargetMin: 0, dailyTargetDuration: 0 };
};

// Alias parseEstimatedDuration
export const parseEstimatedDuration = (value: string | number): number => {
  return parseHourStringToMinutes(value);
};

/**
 * Hiển thị số phút thành chuỗi ngắn gọn, trực quan:
 * - 45 phút -> "45p"
 * - 60 phút -> "1h"
 * - 73 phút -> "1h13"
 * - 120 phút -> "2h"
 * - 150 phút -> "2h30"
 */
export const minutesToHourString = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}h`;

  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${h}h${mStr}`;
};

/**
 * Validator linh hoạt cho Ant Design Form cho trường Thời gian (Duration)
 */
export const validateFlexibleTime = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.resolve();
  }
  const mins = parseHourStringToMinutes(value);
  if (mins > 0) {
    return Promise.resolve();
  }
  return Promise.reject(
    new Error("Định dạng hợp lệ: 45m, 17p, 1h, 1h20, 1.2h, 90 (phút)..."),
  );
};

/**
 * Validator linh hoạt cho Ant Design Form cho trường Mục tiêu ngày (Daily Target Range)
 */
export const validateFlexibleRange = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.resolve();
  }
  const range = parseTimeRange(value);
  if (range.dailyTargetDuration > 0) {
    return Promise.resolve();
  }
  return Promise.reject(
    new Error("Định dạng hợp lệ: 35m-1h10m, 45p-1h20p, 17m-42m, 1h-2h, 45m..."),
  );
};

// Giữ lại regex tương thích ngược (loose regex chấp nhận đa dạng)
export const timeRegex = /^(\d+(\.\d+)?[hH]?|\d+[hH]\d+[mMpP]?|\d+[mMpP])$/;
export const rangeRegex = /.+/;
