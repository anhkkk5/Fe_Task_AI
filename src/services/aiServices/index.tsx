import { post } from "../../utils/axios/request";

export interface AIBreakdownRequest {
  taskId?: string;
  title?: string;
  description?: string;
}

export interface AIBreakdownResponse {
  suggestions: string[];
  steps: string[];
  estimatedTime?: string;
}

export interface AIScheduleRequest {
  taskIds: string[];
  startDate?: string;
}

export interface AIScheduleResponse {
  schedule: {
    day: string;
    date: string;
    tasks: {
      taskId: string;
      title: string;
      priority: string;
      suggestedTime: string;
      reason: string;
    }[];
  }[];
  totalTasks: number;
  suggestedOrder: string[];
}

// AI task breakdown
export const aiTaskBreakdown = async (data: AIBreakdownRequest) => {
  if (data.taskId) {
    return await post(`/ai/tasks/${data.taskId}/breakdown`, {});
  }
  return await post("/ai/tasks/breakdown", {
    title: data.title,
    description: data.description,
  });
};

// AI chat/assistant
export const aiChat = async (message: string, context?: string[]) => {
  return await post("/ai/chat", { message, context });
};

// AI schedule plan - tối ưu lịch làm việc
export const aiSchedulePlan = async (
  data: AIScheduleRequest,
): Promise<AIScheduleResponse> => {
  return await post("/ai/schedule-plan", data);
};

// Save AI schedule to tasks
export const saveAISchedule = async (
  schedule: {
    taskId: string;
    date: string;
    suggestedTime: string;
    reason: string;
  }[],
): Promise<{ message: string; updated: number }> => {
  return await post("/tasks/save-ai-schedule", { schedule });
};
