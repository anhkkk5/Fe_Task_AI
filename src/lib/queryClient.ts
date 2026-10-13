import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 phút dữ liệu được coi là fresh (chuyển trang tức thì không re-fetch thừa)
      gcTime: 5 * 60 * 1000, // 5 phút lưu trữ trong bộ nhớ cache
      refetchOnWindowFocus: true, // Tự động refetch ngầm khi chuyển tab trình duyệt
      retry: 1,
    },
  },
});
