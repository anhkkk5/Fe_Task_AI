export type ApiTaskStatus =
  | "todo"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export const normalizeApiStatus = (apiStatus: string): ApiTaskStatus => {
  if (
    apiStatus === "todo" ||
    apiStatus === "scheduled" ||
    apiStatus === "in_progress" ||
    apiStatus === "completed" ||
    apiStatus === "cancelled"
  ) {
    return apiStatus;
  }

  if (apiStatus === "pending") return "todo";

  return "todo";
};

export interface TaskItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  status: "todo" | "scheduled" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  startAt?: string;
  dueDate: string;
  deadline?: string;
  scheduledTime?: {
    start: string;
    end: string;
    aiPlanned?: boolean;
    reason?: string;
  } | null;
  assignee?: string;
  userId?: any;
  aiBreakdown?: any[];
  aiAssisted: boolean;
  tags: string[];
  estimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
  parentTaskId?: string;
  subtasks?: TaskItem[];
  isSubtask?: boolean;
  teamId?: string;
}
