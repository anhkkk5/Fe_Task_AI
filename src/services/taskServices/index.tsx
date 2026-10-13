import { get, post, patch, del } from "../../utils/axios/request";

export type SubtaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type SubtaskDifficulty = "easy" | "medium" | "hard";

export interface Subtask {
  title: string;
  status: SubtaskStatus;
  estimatedDuration?: number;
  difficulty?: SubtaskDifficulty;
  description?: string;
}

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: "todo" | "scheduled" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  startAt?: string;
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  };
  estimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
  aiBreakdown?: Subtask[];
  subtasks?: any[];
  aiChatHistory?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
}

export interface TaskEstimationExplanation {
  taskId: string;
  title: string;
  method: "user" | "ai" | "heuristic" | "hybrid" | "default";
  confidence: number;
  estimatedFields: string[];
  difficulty?: "easy" | "medium" | "hard";
  factors: {
    baseEstimate?: number;
    priorityMultiplier?: number;
    keywordMultiplier?: number;
    aiMultiplier?: number;
    levelMultiplier?: number;
    historyMultiplier?: number;
  };
  result: {
    estimatedDuration: number;
    dailyTargetDuration: number;
    dailyTargetMin: number;
  };
  task: Task;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "todo" | "scheduled" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  startAt?: string;
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  } | null;
}

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

  // Mặc định tải 100 công việc để đảm bảo hiển thị đầy đủ lịch trình tuần trên Calendar & Dashboard
  const limit = params?.limit || 100;
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/tasks?${queryString}` : "/tasks";
  return await get(url);
};

export const getTaskById = async (id: string): Promise<{ task: Task }> => {
  return await get(`/tasks/${id}`);
};

export const updateTask = async (
  id: string,
  data: UpdateTaskData,
): Promise<{ task: Task }> => {
  return await patch(`/tasks/${id}`, data);
};

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  return await del(`/tasks/${id}`);
};

export const createTask = async (data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  startAt?: string;
  deadline?: string;
  tags?: string[];
  reminderAt?: string;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  };
  estimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
}): Promise<{ task: Task }> => {
  return await post("/tasks", data);
};

export const triggerAiBreakdown = async (
  taskId: string,
): Promise<{ task: Task }> => {
  return await post(`/tasks/${taskId}/ai-breakdown`, {}, { timeout: 90000 });
};

export const getTaskEstimationExplanation = async (
  taskId: string,
): Promise<{ explanation: TaskEstimationExplanation }> => {
  return await get(`/tasks/${taskId}/explain-estimation`);
};

export const updateSubtaskStatus = async (
  taskId: string,
  subtasks: Subtask[],
): Promise<{ task: Task }> => {
  return await patch(`/tasks/${taskId}`, { aiBreakdown: subtasks });
};

export interface TaskCopilotChatResponse {
  reply: string;
  suggestedBreakdown?: Array<{
    title: string;
    estimatedDuration?: number;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  task: Task;
}

export const taskCopilotChat = async (
  taskId: string,
  message: string,
  subtaskTitle?: string,
): Promise<TaskCopilotChatResponse> => {
  return await post(
    `/tasks/${taskId}/copilot/chat`,
    { message, subtaskTitle },
    { timeout: 60000 },
  );
};

export const streamTaskCopilotChat = async (
  taskId: string,
  message: string,
  onDelta: (delta: string) => void,
  onDone: (data: {
    fullReply: string;
    suggestedBreakdown?: Array<{
      title: string;
      estimatedDuration?: number;
      description?: string;
      difficulty?: "easy" | "medium" | "hard";
    }>;
    task: Task;
  }) => void,
  onError: (err: any) => void,
  signal?: AbortSignal,
  subtaskTitle?: string,
): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    const { NORMALIZED_BASE_URL } = await import("../../utils/axios/request");
    const url = `${NORMALIZED_BASE_URL}tasks/${taskId}/copilot/stream`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, subtaskTitle }),
      signal,
    });

    if (!response.ok) {
      let errMsg = "Lỗi khi kết nối AI Copilot";
      try {
        const errorData = await response.json();
        errMsg = errorData?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    if (!response.body) {
      throw new Error("Không có phản hồi từ máy chủ");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;

        try {
          const event = JSON.parse(dataStr);
          if (event.error) {
            onError(new Error(event.error));
            return;
          }
          if (event.type === "delta" && event.delta) {
            onDelta(event.delta);
          } else if (event.type === "done") {
            onDone({
              fullReply: event.fullReply,
              suggestedBreakdown: event.suggestedBreakdown,
              task: event.task,
            });
            return;
          }
        } catch {
          // ignore chunk parse error
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return;
    onError(err);
  }
};

export const applyCopilotBreakdown = async (
  taskId: string,
  steps: Array<{
    title: string;
    estimatedDuration?: number;
    description?: string;
    difficulty?: string;
  }>,
  mode: "replace" | "append" = "replace",
): Promise<{ task: Task; message: string }> => {
  return await post(`/tasks/${taskId}/copilot/apply-breakdown`, { steps, mode });
};
