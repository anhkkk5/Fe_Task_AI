import { useState, useEffect, useCallback } from "react";
import { App } from "antd";
import {
  getTasks,
  updateTask,
  deleteTask,
  createTask,
  type Task,
} from "../services/taskServices";

export function useTasks() {
  const { message } = App.useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTasks();
      setTasks(response.items || []);
    } catch {
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchTasks();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchTasks();
    };

    const handleAiTasksCreated = () => fetchTasks();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("ai-tasks-created", handleAiTasksCreated);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("ai-tasks-created", handleAiTasksCreated);
    };
  }, [fetchTasks]);

  const handleCreate = async (values: any) => {
    try {
      await createTask(values);
      message.success("Tạo công việc thành công!");
      await fetchTasks();
      return true;
    } catch (error) {
      message.error("Tạo công việc thất bại!");
      return false;
    }
  };

  const handleUpdate = async (taskId: string, values: any) => {
    try {
      await updateTask(taskId, values);
      message.success("Cập nhật công việc thành công!");
      await fetchTasks();
      return true;
    } catch (error) {
      message.error("Cập nhật thất bại!");
      return false;
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      message.success("Xóa công việc thành công!");
      await fetchTasks();
      window.dispatchEvent(
        new CustomEvent("task-deleted", { detail: { taskId } }),
      );
      return true;
    } catch (error) {
      message.error("Xóa thất bại!");
      return false;
    }
  };

  return {
    tasks,
    loading,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
