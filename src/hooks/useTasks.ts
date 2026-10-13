import { useTasksQuery } from "./useTasksQuery";

/**
 * useTasks hook - Được tối ưu hóa bằng TanStack Query
 * Tự động đồng bộ và chia sẻ cache giữa Calendar, Home và Tasks
 */
export function useTasks() {
  const {
    tasks,
    loading,
    isFetching,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useTasksQuery();

  return {
    tasks,
    loading,
    isFetching,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
