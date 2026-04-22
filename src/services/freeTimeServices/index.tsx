import { del, get, patch } from "../../utils/axios/request";

export interface AvailableTimeSlot {
  start: string;
  end: string;
}

export interface WeeklyPattern {
  monday: AvailableTimeSlot[];
  tuesday: AvailableTimeSlot[];
  wednesday: AvailableTimeSlot[];
  thursday: AvailableTimeSlot[];
  friday: AvailableTimeSlot[];
  saturday: AvailableTimeSlot[];
  sunday: AvailableTimeSlot[];
}

export interface CustomDateOverride {
  date: string;
  slots: AvailableTimeSlot[];
}

export interface FreeTimeAvailability {
  id: string;
  userId: string;
  weeklyPattern: WeeklyPattern;
  customDates: CustomDateOverride[];
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export const getMyAvailability = async (): Promise<{
  availability: FreeTimeAvailability | null;
}> => {
  return await get("/free-time/me");
};

export const updateWeeklyAvailability = async (payload: {
  weeklyPattern: WeeklyPattern;
  timezone?: string;
}): Promise<{ availability: FreeTimeAvailability; message: string }> => {
  return await patch("/free-time/weekly", payload);
};

export const setCustomDateAvailability = async (
  date: string,
  slots: AvailableTimeSlot[],
): Promise<{ availability: FreeTimeAvailability; message: string }> => {
  return await patch(`/free-time/custom-dates/${date}`, { slots });
};

export const deleteCustomDateAvailability = async (
  date: string,
): Promise<{ availability: FreeTimeAvailability; message: string }> => {
  return await del(`/free-time/custom-dates/${date}`);
};
