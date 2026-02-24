import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  getTasks,
  updateTask,
  deleteTask,
  createTask,
  type Task,
} from "../services/taskServices";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTasks();
      console.log("API tasks response:", response);
      setTasks(response.items || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    console.log("useEffect: calling fetchTasks");
    fetchTasks();
  }, [fetchTasks]);

  // Create task
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

  // Update task
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

  // Delete task
  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      message.success("Xóa công việc thành công!");
      setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
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
