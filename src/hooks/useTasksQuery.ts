import { useQuery, useMutation } from "@tanstack/react-query";
import { App } from "antd";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
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

  return {
    tasks,
    loading,
    isFetching,
    error,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
