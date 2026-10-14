import { useQuery, useMutation } from "@tanstack/react-query";
import { App } from "antd";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteTasksBatch,
  deleteAllTasks,
  type Task,
  type TaskListResponse,
} from "../services/taskServices";
import { queryClient } from "../lib/queryClient";

export const TASKS_QUERY_KEY = ["tasks"] as const;

export function useTasksQuery() {
  const { message } = App.useApp();

  // 1. Fetch Tasks Query với caching tự động
  const {
    data,
    isLoading: loading,
    isFetching,
    refetch: fetchTasks,
    error,
  } = useQuery<TaskListResponse>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => getTasks(),
  });

  const tasks: Task[] = data?.items || [];

  // 2. Create Task Mutation
  const createMutation = useMutation({
    mutationFn: (values: any) => createTask(values),
    onSuccess: () => {
      message.success("Tạo công việc thành công!");
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onError: () => {
      message.error("Tạo công việc thất bại!");
    },
  });

  // 3. Update Task Mutation với OPTIMISTIC UPDATE (Phản hồi tức thì 0ms)
  const updateMutation = useMutation({
    mutationFn: ({ taskId, values }: { taskId: string; values: any }) =>
      updateTask(taskId, values),
    onMutate: async ({ taskId, values }) => {
      // Hủy mọi request đang fetch dở của ['tasks']
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      // Lưu lại snapshot dữ liệu trước khi thay đổi để rollback nếu lỗi
      const previousData = queryClient.getQueryData<TaskListResponse>(TASKS_QUERY_KEY);

      // Cập nhật lạc quan (Optimistic Update) ngay vào cache
      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(TASKS_QUERY_KEY, {
          ...previousData,
          items: previousData.items.map((item) => {
            const currentId = item._id || item.id;
            if (currentId === taskId) {
              return { ...item, ...values };
            }
            return item;
          }),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback về trạng thái cũ nếu server báo lỗi
      if (context?.previousData) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousData);
      }
      message.error("Cập nhật công việc thất bại, đã khôi phục lại!");
    },
    onSuccess: () => {
      message.success("Cập nhật công việc thành công!");
    },
    onSettled: () => {
      // Đồng bộ lại với dữ liệu mới nhất từ server
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // 4. Delete Task Mutation với OPTIMISTIC UPDATE (Xóa khỏi UI ngay lập tức)
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousData = queryClient.getQueryData<TaskListResponse>(TASKS_QUERY_KEY);

      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(TASKS_QUERY_KEY, {
          ...previousData,
          total: Math.max(0, previousData.total - 1),
          items: previousData.items.filter(
            (item) => (item._id || item.id) !== taskId,
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousData);
      }
      message.error("Xóa công việc thất bại, đã khôi phục lại!");
    },
    onSuccess: () => {
      message.success("Xóa công việc thành công!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // 5. Delete Tasks Batch Mutation
  const deleteBatchMutation = useMutation({
    mutationFn: (taskIds: string[]) => deleteTasksBatch(taskIds),
    onMutate: async (taskIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousData = queryClient.getQueryData<TaskListResponse>(TASKS_QUERY_KEY);
      const idSet = new Set(taskIds);

      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(TASKS_QUERY_KEY, {
          ...previousData,
          total: Math.max(0, previousData.total - taskIds.length),
          items: previousData.items.filter(
            (item) => !idSet.has(String(item._id || item.id || "")),
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousData);
      }
      message.error("Xóa nhiều công việc thất bại, đã khôi phục lại!");
    },
    onSuccess: (data) => {
      message.success(data?.message || "Đã xóa các công việc đã chọn!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // 6. Delete All Tasks Mutation
  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllTasks(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousData = queryClient.getQueryData<TaskListResponse>(TASKS_QUERY_KEY);

      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(TASKS_QUERY_KEY, {
          ...previousData,
          items: previousData.items.filter((item: any) => Boolean(item.teamAssignment?.teamId || item.teamId)),
          total: 0,
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousData);
      }
      message.error("Xóa tất cả công việc thất bại, đã khôi phục lại!");
    },
    onSuccess: (data) => {
      message.success(data?.message || "Đã xóa sạch công việc!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  // Helper wrappers giữ nguyên interface quen thuộc
  const handleCreate = async (values: any): Promise<boolean> => {
    try {
      await createMutation.mutateAsync(values);
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdate = async (taskId: string, values: any): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ taskId, values });
      return true;
    } catch {
      return false;
    }
  };

  const handleDelete = async (taskId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(taskId);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteMany = async (taskIds: string[]): Promise<boolean> => {
    try {
      await deleteBatchMutation.mutateAsync(taskIds);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteAll = async (): Promise<boolean> => {
    try {
      await deleteAllMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    tasks,
    loading,
    isFetching,
    error,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDeleteMany,
    handleDeleteAll,
    createMutation,
    updateMutation,
    deleteMutation,
    deleteBatchMutation,
    deleteAllMutation,
  };
}
