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
