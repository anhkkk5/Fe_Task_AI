import { get, patch, post } from "../../utils/axios/request";

export interface UserHabits {
  userId: string;
  productiveHours: { start: number; end: number }[];
  preferredBreakDuration: number;
  maxFocusDuration: number;
  preferredWorkPattern: "morning" | "afternoon" | "evening" | "mixed";
  aiPreferences: {
    autoBreakdown: boolean;
    autoSchedule: boolean;
    prioritizeDeadline: boolean;
    bufferBetweenTasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductivityAnalysis {
  mostProductiveHours: number[];
  completionRate: number;
  pattern: string;
}

export interface UpdateHabitsData {
  productiveHours?: { start: number; end: number }[];
  preferredBreakDuration?: number;
  maxFocusDuration?: number;
  preferredWorkPattern?: "morning" | "afternoon" | "evening" | "mixed";
  aiPreferences?: {
    autoBreakdown?: boolean;
    autoSchedule?: boolean;
    prioritizeDeadline?: boolean;
    bufferBetweenTasks?: number;
  };
}

export interface TrackCompletionData {
  hour: number;
  dayOfWeek: number;
  completed: boolean;
  duration?: number;
}

export const userHabitServices = {
  getHabits: async (): Promise<{
    habits: UserHabits | null;
    analysis: ProductivityAnalysis | null;
  }> => {
    const response = await get("/users/habits");
    return response;
  },

  updateHabits: async (
    data: UpdateHabitsData,
  ): Promise<{ habits: UserHabits }> => {
    const response = await patch("/users/habits", data);
    return response;
  },

  trackTaskCompletion: async (
    data: TrackCompletionData,
  ): Promise<{ message: string }> => {
    const response = await post("/users/habits/track", data);
    return response;
  },
};
