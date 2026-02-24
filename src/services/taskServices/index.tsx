import { get, post, patch, del } from "../../utils/axios/request";

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
}

// Get task list
export const getTasks = async (params?: {
  status?: string;
  priority?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<TaskListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.priority) queryParams.append("priority", params.priority);
  if (params?.keyword) queryParams.append("keyword", params.keyword);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/tasks?${queryString}` : "/tasks";
  return await get(url);
};

// Get task by ID
export const getTaskById = async (id: string): Promise<{ task: Task }> => {
  return await get(`/tasks/${id}`);
};

// Update task
export const updateTask = async (
  id: string,
  data: UpdateTaskData,
): Promise<{ task: Task }> => {
  return await patch(`/tasks/${id}`, data);
};

// Delete task
export const deleteTask = async (id: string): Promise<{ message: string }> => {
  return await del(`/tasks/${id}`);
};

// Create new task
export const createTask = async (data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
}): Promise<{ task: Task }> => {
  return await post("/tasks", data);
};
