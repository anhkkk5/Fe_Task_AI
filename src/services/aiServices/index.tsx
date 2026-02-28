import { get, post, patch, del } from "../../utils/axios/request";

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

// Schedule Template interfaces
export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  pattern: {
    days: {
      dayOfWeek: number;
      timeBlocks: {
        startTime: string;
        endTime: string;
        label: string;
        breakDuration?: number;
      }[];
    }[];
    aiConfig?: {
      preferredWorkPattern?: "morning" | "afternoon" | "evening" | "mixed";
      maxTasksPerDay?: number;
      minBreakBetweenTasks?: number;
    };
  };
  isDefault: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
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

// Schedule Template APIs
export const getScheduleTemplates = async (
  tag?: string,
): Promise<{ templates: ScheduleTemplate[] }> => {
  const url = tag ? `/schedule-templates?tag=${tag}` : "/schedule-templates";
  return await get(url);
};

export const getDefaultTemplate = async (): Promise<{
  template: ScheduleTemplate;
}> => {
  return await get("/schedule-templates/default");
};

export const createScheduleTemplate = async (
  data: Omit<ScheduleTemplate, "id" | "usageCount" | "createdAt" | "updatedAt">,
): Promise<{ template: ScheduleTemplate }> => {
  return await post("/schedule-templates", data);
};

export const createTemplateFromSchedule = async (
  name: string,
  aiSchedule: AIScheduleResponse,
  description?: string,
  tags?: string[],
): Promise<{ template: ScheduleTemplate }> => {
  return await post("/schedule-templates/from-schedule", {
    name,
    description,
    aiSchedule,
    tags,
  });
};

export const updateScheduleTemplate = async (
  id: string,
  data: Partial<
    Omit<ScheduleTemplate, "id" | "usageCount" | "createdAt" | "updatedAt">
  >,
): Promise<{ template: ScheduleTemplate }> => {
  return await patch(`/schedule-templates/${id}`, data);
};

export const deleteScheduleTemplate = async (
  id: string,
): Promise<{ message: string }> => {
  return await del(`/schedule-templates/${id}`);
};

export const applyScheduleTemplate = async (
  id: string,
): Promise<{ template: ScheduleTemplate; message: string }> => {
  return await post(`/schedule-templates/${id}/apply`, {});
};

export const setDefaultTemplate = async (
  id: string,
): Promise<{ message: string }> => {
  return await post(`/schedule-templates/${id}/set-default`, {});
};

// Smart Reschedule API
export interface SmartRescheduleRequest {
  missedTask: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    deadline?: string;
    estimatedDuration?: number;
    originalScheduledTime?: { start: string; end: string };
  };
  reason?: "missed" | "overlapping" | "too_short" | "manual";
}

export interface SmartRescheduleResponse {
  suggestion: {
    newStartTime: string;
    newEndTime: string;
    newDate: string;
    reason: string;
    confidence: "high" | "medium" | "low";
  };
  alternativeSlots?: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }[];
  advice: string;
}

export const smartReschedule = async (
  data: SmartRescheduleRequest,
): Promise<SmartRescheduleResponse> => {
  return await post("/ai/smart-reschedule", data);
};
