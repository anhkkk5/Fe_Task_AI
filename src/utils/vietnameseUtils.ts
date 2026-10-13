/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu và chuẩn hóa chữ thường.
 * Ví dụ: "Hoàn thiện báo cáo tài chính" -> "hoan thien bao cao tai chinh"
 */
export const removeVietnameseTones = (str: string = ""): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

/**
 * Kiểm tra xem chuỗi `target` có khớp với `query` không (kể cả có dấu lẫn không dấu).
 * Ví dụ:
 * - target: "Hoàn thiện báo cáo", query: "bao cao" -> true
 * - target: "Thiết kế Figma", query: "thiet ke" -> true
 */
export const matchVietnameseSearch = (
  target: string = "",
  query: string = "",
): boolean => {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const targetLower = target.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  // 1. So sánh trực tiếp chuỗi chữ thường
  if (targetLower.includes(queryLower)) return true;

  // 2. So sánh sau khi loại bỏ toàn bộ dấu tiếng Việt
  const targetNormalized = removeVietnameseTones(target);
  const queryNormalized = removeVietnameseTones(query);

  return targetNormalized.includes(queryNormalized);
};
