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
  schedulingStrategy?: "sequential" | "parallel" | "balanced";
  distributionPattern?: "front-load" | "even" | "adaptive";
}

export interface TaskEstimationMeta {
  taskId: string;
  method: "user" | "ai" | "heuristic" | "hybrid" | "default";
  confidence: number;
  estimatedFields: string[];
  heuristicDuration?: number;
  aiDifficulty?: "easy" | "medium" | "hard";
  aiMultiplier?: number;
  finalDuration: number;
  finalDailyTarget: number;
  finalDailyMin: number;
}

export interface ScheduleWarning {
  taskId: string;
  title: string;
  feasible: boolean;
  daysLeft: number;
  maxPossibleHours: number;
  requiredHours: number;
  shortfallHours: number;
  message: string;
}

export interface AIScheduleResponse {
  id?: string;
  schedule: {
    day: string;
    date: string;
    tasks: {
      scheduleId?: string;
      sessionId?: string;
      taskId: string;
      title: string;
      priority: string;
      suggestedTime: string;
      reason: string;
      status?: string;
      createSubtask?: boolean;
    }[];
    note?: string;
  }[];
  totalTasks: number;
  suggestedOrder: string[];
  personalizationNote?: string;
  totalEstimatedTime?: string;
  splitStrategy?: string;
  confidenceScore?: number;
  warnings?: ScheduleWarning[];
  estimationMetadata?: TaskEstimationMeta[];
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
  aiSchedule: AIScheduleResponse,
): Promise<{
  message: string;
  scheduleId: string;
  totalSessions: number;
  totalDays: number;
}> => {
  return await post("/tasks/save-ai-schedule", {
    schedule: aiSchedule.schedule,
    suggestedOrder: aiSchedule.suggestedOrder,
    personalizationNote: aiSchedule.personalizationNote,
    totalEstimatedTime: aiSchedule.totalEstimatedTime,
    splitStrategy: aiSchedule.splitStrategy,
    confidenceScore: aiSchedule.confidenceScore,
    sourceTasks: aiSchedule.totalTasks ? [] : [], // Will be populated from taskIds used in schedule
  });
};

// Get active AI schedule
export const getActiveAISchedule = async (): Promise<{
  success: boolean;
  data: AIScheduleResponse | null;
}> => {
  return await get("/ai-schedules/active");
};

// Delete AI schedule
export const deleteAISchedule = async (
  scheduleId: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  return await del(`/ai-schedules/${scheduleId}`);
};

// Update AI session time (drag-drop)
export const updateAISessionTime = async (
  scheduleId: string,
  sessionId: string,
  suggestedTime: string,
): Promise<{
  success: boolean;
  data: AIScheduleResponse | null;
}> => {
  return await patch(`/ai-schedules/${scheduleId}/sessions/time`, {
    sessionId,
    suggestedTime,
  });
};

export const updateAISessionStatus = async (
  scheduleId: string,
  sessionId: string,
  status: "pending" | "in_progress" | "completed" | "skipped",
): Promise<{
  success: boolean;
  data: AIScheduleResponse | null;
}> => {
  return await patch(`/ai-schedules/${scheduleId}/sessions/status`, {
    sessionId,
    status,
  });
};

export const deleteAISession = async (
  scheduleId: string,
  sessionId: string,
): Promise<{
  success: boolean;
  data: AIScheduleResponse | null;
}> => {
  return await del(`/ai-schedules/${scheduleId}/sessions/${sessionId}`);
};

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
