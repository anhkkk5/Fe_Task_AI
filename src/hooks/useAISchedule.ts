import { useState, useEffect, useCallback } from "react";
import { getActiveAISchedule } from "../services/aiServices";
import type { AIScheduleResponse } from "../services/aiServices";

interface UseAIScheduleReturn {
  aiSchedule: AIScheduleResponse | null;
  loading: boolean;
  error: string | null;
  fetchAISchedule: () => Promise<void>;
}

export const useAISchedule = (): UseAIScheduleReturn => {
  const [aiSchedule, setAiSchedule] = useState<AIScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAISchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getActiveAISchedule();
      if (response.success && response.data) {
        setAiSchedule(response.data);
      } else {
        setAiSchedule(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch AI schedule");
      setAiSchedule(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAISchedule();
  }, [fetchAISchedule]);

  return {
    aiSchedule,
    loading,
    error,
    fetchAISchedule,
  };
};
