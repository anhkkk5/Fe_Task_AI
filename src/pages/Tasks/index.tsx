import { useState, useMemo } from "react";
import { Typography, App } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import AITaskScheduler from "../../components/AITaskScheduler";
import { useTasksQuery } from "../../hooks/useTasksQuery";
import {
  getTaskEstimationExplanation,
  updateSubtaskStatus,
  type Subtask,
  type SubtaskStatus,
  type TaskEstimationExplanation,
} from "../../services/taskServices";
import { TaskStats } from "./components/TaskStats";
import { TaskFilterBar } from "./components/TaskFilterBar";
import { TaskTable } from "./components/TaskTable";
import { TaskCreateModal } from "./components/TaskCreateModal";
import { TaskEditModal } from "./components/TaskEditModal";
import { TaskBreakdownModal } from "./components/TaskBreakdownModal";
import { TaskDeleteModal } from "./components/TaskDeleteModal";
import { normalizeApiStatus, type TaskItem } from "./types";
import "./Tasks.scss";

const { Title, Text } = Typography;

function Tasks() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  // 1. Quản lý Server State với TanStack Query & Optimistic Updates
  const {
    tasks: apiTasks,
    loading,
    fetchTasks,
    handleCreate,
    handleUpdate,
    handleDelete,
    deleteMutation,
  } = useTasksQuery();

  // 2. Local View State & Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schedulerVisible, setSchedulerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 3. Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownTask, setBreakdownTask] = useState<TaskItem | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [estimationExplain, setEstimationExplain] =
    useState<TaskEstimationExplanation | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);

  // 4. Team Task Redirect Helper
  const redirectToTeamTask = (
    task: TaskItem,
    action: "sửa" | "xóa" | "đổi trạng thái",
  ): boolean => {
    if (!task.teamId) return false;
    message.warning(
      `Task này thuộc team. Vui lòng vào trang Team để ${action}. Đang chuyển hướng...`,
    );
    navigate(`/teams/${task.teamId}`);
    return true;
  };

  // 5. Chuẩn hóa dữ liệu Tasks từ API
  const tasks: TaskItem[] = useMemo(
    () =>
      apiTasks
        .filter((t: any) => !(t.parentTaskId && t.scheduledTime?.aiPlanned))
        .map((t: any) => ({
          id: t._id || t.id,
          _id: t._id,
          title: t.title,
          description: t.description || "",
          status: normalizeApiStatus(String(t.status ?? "todo")),
          priority: (t.priority || "medium") as
            | "low"
            | "medium"
            | "high"
            | "urgent",
          startAt: t.startAt || t.teamAssignment?.startAt,
          dueDate: t.deadline || t.dueDate || "",
          deadline: t.deadline,
          scheduledTime: t.scheduledTime ?? null,
          assignee: t.userId?.name || "Bạn",
          userId: t.userId,
          aiBreakdown: t.aiBreakdown,
          aiAssisted: !!(t.aiBreakdown && t.aiBreakdown.length > 0),
          tags: t.tags || [],
          estimatedDuration: t.estimatedDuration,
          dailyTargetDuration: t.dailyTargetDuration,
          dailyTargetMin: t.dailyTargetMin,
          parentTaskId: t.parentTaskId,
          isSubtask: !!t.parentTaskId,
          teamId: t.teamAssignment?.teamId,
        })),
    [apiTasks],
  );

  // 6. Nhóm Subtask vào Task cha
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, TaskItem>();
    const subs: TaskItem[] = [];

    tasks.forEach((task) => {
      if (task.isSubtask && task.parentTaskId) {
        subs.push(task);
      } else {
        taskMap.set(task.id, { ...task, subtasks: [] });
      }
    });

    subs.forEach((subtask) => {
      const parent = taskMap.get(subtask.parentTaskId!);
      if (parent) {
        parent.subtasks!.push(subtask);
      } else {
        taskMap.set(subtask.id, subtask);
      }
    });

    return Array.from(taskMap.values());
  }, [tasks]);

  // 7. Lọc dữ liệu theo Search và Trạng thái
  const filteredTasks = useMemo(() => {
    return groupedTasks.filter((task) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.subtasks?.some(
          (st) =>
            st.title.toLowerCase().includes(searchLower) ||
            st.description.toLowerCase().includes(searchLower),
        );
      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter ||
        task.subtasks?.some((st) => st.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [groupedTasks, searchText, statusFilter]);

  // 8. Event Handlers
  const onEditClick = (task: TaskItem) => {
    if (redirectToTeamTask(task, "sửa")) return;
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const onDeleteClick = (task: TaskItem) => {
    if (redirectToTeamTask(task, "xóa")) return;
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!deletingTask) return;
    const success = await handleDelete(deletingTask.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingTask(null);
    }
  };

  const onBreakdownClick = async (task: TaskItem) => {
    setBreakdownTask(task);
    setSubtasks((task.aiBreakdown as Subtask[]) ?? []);
    setEstimationExplain(null);
    setIsBreakdownModalOpen(true);

    setExplainLoading(true);
    getTaskEstimationExplanation(task.id)
      .then((res) => setEstimationExplain(res.explanation))
      .catch(() => {
        // Silent error
      })
      .finally(() => setExplainLoading(false));

    // Nếu chưa có breakdown, tự động kích hoạt tạo lần đầu
    if (!task.aiBreakdown?.length) {
      setBreakdownLoading(true);
      try {
        const { triggerAiBreakdown } = await import(
          "../../services/taskServices"
        );
        const res = await triggerAiBreakdown(task.id);
        setSubtasks((res.task.aiBreakdown as Subtask[]) ?? []);
        fetchTasks();
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.message ||
          (err?.response?.status === 429
            ? "AI đang bị giới hạn request. Vui lòng thử lại sau."
            : err?.message === "Network Error"
              ? "Không thể kết nối đến server."
              : "Không thể tạo AI Breakdown.");
        message.error(errMsg);
      } finally {
        setBreakdownLoading(false);
      }
    }
  };

  const onRegenerateBreakdown = async () => {
    if (!breakdownTask) return;
    setBreakdownLoading(true);
    try {
      const { triggerAiBreakdown } = await import(
        "../../services/taskServices"
      );
      const res = await triggerAiBreakdown(breakdownTask.id);
      setSubtasks((res.task.aiBreakdown as Subtask[]) ?? []);
      try {
        const explain = await getTaskEstimationExplanation(breakdownTask.id);
        setEstimationExplain(explain.explanation);
      } catch {
        // Silent error
      }
      fetchTasks();
      message.success("Đã tạo lại AI Breakdown!");
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        (err?.response?.status === 429
          ? "AI đang bị giới hạn request. Vui lòng thử lại sau."
          : "Không thể tạo lại AI Breakdown.");
      message.error(errMsg);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const onSubtaskStatusChange = async (
    index: number,
    status: SubtaskStatus,
  ) => {
    const updated = subtasks.map((s, i) =>
      i === index ? { ...s, status } : s,
    );
    setSubtasks(updated);
    try {
      if (breakdownTask) {
        await updateSubtaskStatus(breakdownTask.id, updated);
      }
    } catch {
      message.error("Không thể cập nhật trạng thái");
    }
  };

  return (
    <div className="tasks-page">
      <main className="tasks-main">
        {/* Header */}
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>Công việc AI</Title>
          <Text type="secondary">
            Quản lý và tối ưu hóa công việc với sự hỗ trợ của AI
          </Text>
        </div>

        {/* Thẻ thống kê tổng quan */}
        <TaskStats tasks={tasks} />

        {/* Thanh công cụ tìm kiếm và lọc */}
        <TaskFilterBar
          searchText={searchText}
          onSearchChange={setSearchText}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenScheduler={() => setSchedulerVisible(true)}
          onOpenCreateModal={() => setCreateModalVisible(true)}
        />

        {/* Bảng danh sách công việc */}
        <TaskTable
          tasks={filteredTasks}
          loading={loading}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onBreakdownClick={onBreakdownClick}
          onStatusChange={fetchTasks}
        />

        {/* Drawer AI Lên Lịch */}
        <AITaskScheduler
          visible={schedulerVisible}
          onClose={() => setSchedulerVisible(false)}
          tasks={tasks}
          onScheduleCreate={() => {
            message.success("Đã tạo lịch trình thành công!");
            fetchTasks();
          }}
        />

        {/* Modals nghiệp vụ */}
        <TaskCreateModal
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onCreate={handleCreate}
        />

        <TaskEditModal
          open={isEditModalOpen}
          task={editingTask}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onUpdate={handleUpdate}
        />

        <TaskBreakdownModal
          open={isBreakdownModalOpen}
          task={breakdownTask}
          subtasks={subtasks}
          breakdownLoading={breakdownLoading}
          explainLoading={explainLoading}
          estimationExplain={estimationExplain}
          onCancel={() => {
            setIsBreakdownModalOpen(false);
            setBreakdownTask(null);
          }}
          onRegenerate={onRegenerateBreakdown}
          onSubtaskStatusChange={onSubtaskStatusChange}
        />

        <TaskDeleteModal
          open={isDeleteModalOpen}
          task={deletingTask}
          loading={deleteMutation.isPending}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeletingTask(null);
          }}
          onConfirm={onDeleteConfirm}
        />
      </main>
    </div>
  );
}

export default Tasks;
