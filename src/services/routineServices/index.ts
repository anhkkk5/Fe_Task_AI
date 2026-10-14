import { get, post, put, del } from "../../utils/axios/request";

export interface DailyRoutineItem {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  daysOfWeek: number[]; // 1=T2, ..., 7=CN
  category?: string;
  color?: string;
  allowTaskOverlap?: boolean;
  isActive: boolean;
  excludedDates?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoutinePayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  category?: string;
  color?: string;
  allowTaskOverlap?: boolean;
}

export interface UpdateRoutinePayload {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  category?: string;
  color?: string;
  allowTaskOverlap?: boolean;
  isActive?: boolean;
}

export const getRoutines = async (): Promise<{ routines: DailyRoutineItem[] }> => {
  return get("/routines");
};

export const createRoutine = async (
  payload: CreateRoutinePayload
): Promise<{ routine: DailyRoutineItem; message: string }> => {
  return post("/routines", payload);
};

export const updateRoutine = async (
  id: string,
  payload: UpdateRoutinePayload
): Promise<{ routine: DailyRoutineItem; message: string }> => {
  return put(`/routines/${id}`, payload);
};

export const deleteRoutine = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return del(`/routines/${id}`);
};

export const seedDefaultRoutines = async (): Promise<{
  routines: DailyRoutineItem[];
  message: string;
}> => {
  return post("/routines/seed", {});
};

export const clearAllRoutines = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return del("/routines/clear-all");
};
