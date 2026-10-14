import { get, patch, post, postForm } from "../../utils/axios/request";

export interface AdminUserItem {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    today: number;
  };
  tasks: {
    total: number;
    today: number;
  };
  notifications?: {
    total: number;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface ListUsersResponse {
  users: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getAdminDashboardStats = async (): Promise<{ stats: AdminDashboardStats }> => {
  return await get<{ stats: AdminDashboardStats }>("/admin/dashboard");
};

export const getAdminUsers = async (params?: ListUsersParams): Promise<ListUsersResponse> => {
  return await get<ListUsersResponse>("/admin/users", { params });
};

export const updateAdminUserRole = async (
  userId: string,
  role: "user" | "admin",
): Promise<{ message: string; user: AdminUserItem }> => {
  return await patch<{ message: string; user: AdminUserItem }>(`/admin/users/${userId}/role`, {
    role,
  });
};

export const toggleAdminUserBan = async (
  userId: string,
  reason?: string,
): Promise<{ message?: string; id?: string; isBanned?: boolean; banReason?: string }> => {
  return await patch(`/admin/users/${userId}/ban`, { reason });
};

export const getGuideVideo = async (): Promise<{
  ok: boolean;
  videoUrl: string;
  videoType?: string;
  rawEmbed?: string;
}> => {
  return await get<{
    ok: boolean;
    videoUrl: string;
    videoType?: string;
    rawEmbed?: string;
  }>("/admin/guide-video");
};

export const updateGuideVideoEmbed = async (
  embedCode: string,
): Promise<{ ok: boolean; message: string; videoUrl: string; videoType: string }> => {
  return await post<{ ok: boolean; message: string; videoUrl: string; videoType: string }>(
    "/admin/guide-video/embed",
    { embedCode },
  );
};

export const uploadGuideVideo = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ ok: boolean; message: string; videoUrl: string }> => {
  const formData = new FormData();
  formData.append("video", file);
  return await postForm<{ ok: boolean; message: string; videoUrl: string }>(
    "/admin/guide-video",
    formData,
    {
      timeout: 0, // Không giới hạn timeout cho video dung lượng lớn (> 500MB)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    },
  );
};
