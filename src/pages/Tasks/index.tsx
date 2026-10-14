import { useState, useMemo, useEffect } from "react";
import { Typography, App } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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
import { TaskKanbanBoard } from "./components/TaskKanbanBoard";
import { TaskCreateModal } from "./components/TaskCreateModal";
import { TaskEditModal } from "./components/TaskEditModal";
import { TaskBreakdownModal } from "./components/TaskBreakdownModal";
import { TaskDeleteModal } from "./components/TaskDeleteModal";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { TaskExtendModal } from "./components/TaskExtendModal";
import { matchVietnameseSearch } from "../../utils/vietnameseUtils";
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
    handleDeleteMany,
    handleDeleteAll,
    deleteMutation,
  } = useTasksQuery();

  // 2. Chế độ xem: Bảng (Table) hoặc Kanban Board (lưu vào localStorage)
  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
    return (localStorage.getItem("tasks_view_mode") as "table" | "kanban") || "kanban";
  });

  const handleViewModeChange = (mode: "table" | "kanban") => {
    setViewMode(mode);
    localStorage.setItem("tasks_view_mode", mode);
  };

  // 3. Local View State & Filters
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schedulerVisible, setSchedulerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Listen for mission triggers & sync mission completion
  useEffect(() => {
    const handleOpenCreate = () => setCreateModalVisible(true);
    const handleOpenScheduler = () => setSchedulerVisible(true);
    window.addEventListener("taskmind-open-create-task", handleOpenCreate);
    window.addEventListener("taskmind-open-scheduler", handleOpenScheduler);
    return () => {
      window.removeEventListener("taskmind-open-create-task", handleOpenCreate);
      window.removeEventListener("taskmind-open-scheduler", handleOpenScheduler);
    };
  }, []);

  // 4. Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

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

  const [extendingTask, setExtendingTask] = useState<TaskItem | null>(null);

  // 5. Team Task Redirect Helper
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

  // 6. Chuẩn hóa dữ liệu Tasks từ API
  const tasks: TaskItem[] = useMemo(
    () =>
      apiTasks
        .filter((t: any) => !(t.parentTaskId && t.scheduledTime?.aiPlanned))
        .map((t: any) => {
          const rawStatus = String(t.status ?? "todo");
          const effectiveStatus =
            rawStatus === "todo" && t.scheduledTime?.start
              ? "scheduled"
              : rawStatus;

          const deadlineDate = t.deadline || t.dueDate || t.scheduledTime?.end;
          const isOverdue = Boolean(
            t.isOverdue ||
            (deadlineDate &&
              dayjs(deadlineDate).isBefore(dayjs()) &&
              effectiveStatus !== "completed" &&
              effectiveStatus !== "cancelled")
          );

          return {
            id: t._id || t.id,
            _id: t._id,
            title: t.title,
            description: t.description || "",
            status: normalizeApiStatus(effectiveStatus),
            priority: (t.priority || "medium") as
              | "low"
              | "medium"
              | "high"
              | "urgent",
            startAt: t.startAt || t.scheduledTime?.start || t.teamAssignment?.startAt,
            dueDate: t.deadline || t.dueDate || t.scheduledTime?.end || "",
            deadline: t.deadline || t.scheduledTime?.end,
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
            isOverdue,
            teamAssignment: t.teamAssignment,
            extensionRequest: t.extensionRequest,
          };
        }),
    [apiTasks],
  );

  // 7. Nhóm Subtask vào Task cha
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

  useEffect(() => {
    if (tasks.length > 0) {
      window.dispatchEvent(new CustomEvent("taskmind-mission-task-created"));
    }
  }, [tasks.length]);

  // 8. Lọc dữ liệu theo Search, Ngày chọn (dateFilter) và Trạng thái
  const filteredTasks = useMemo(() => {
    const trimmedSearch = searchText.trim();
    const targetDateStr = dateFilter ? dateFilter.format("YYYY-MM-DD") : null;

    const checkTaskMatchesDate = (item: TaskItem): boolean => {
      if (!targetDateStr) return true;
      const dueStr = item.dueDate ? dayjs(item.dueDate).format("YYYY-MM-DD") : null;
      const startStr = item.startAt ? dayjs(item.startAt).format("YYYY-MM-DD") : null;
      const schedStr = item.scheduledTime?.start ? dayjs(item.scheduledTime.start).format("YYYY-MM-DD") : null;
      return dueStr === targetDateStr || startStr === targetDateStr || schedStr === targetDateStr;
    };

    return groupedTasks.filter((task) => {
      const matchesSearch =
        !trimmedSearch ||
        matchVietnameseSearch(task.title, trimmedSearch) ||
        matchVietnameseSearch(task.description || "", trimmedSearch) ||
        task.tags?.some((t) => matchVietnameseSearch(t, trimmedSearch)) ||
        task.subtasks?.some(
          (st) =>
            matchVietnameseSearch(st.title, trimmedSearch) ||
            matchVietnameseSearch(st.description || "", trimmedSearch),
        );

      const matchesStatus =
        viewMode === "kanban" ||
        statusFilter === "all" ||
        (statusFilter === "overdue"
          ? Boolean(task.isOverdue || task.subtasks?.some((st) => st.isOverdue))
          : statusFilter === "done"
            ? task.status === "completed" ||
              task.subtasks?.some((st) => st.status === "completed")
            : task.status === statusFilter ||
              task.subtasks?.some((st) => st.status === statusFilter));

      const matchesDate =
        !targetDateStr ||
        checkTaskMatchesDate(task) ||
        (task.subtasks || []).some((st) => checkTaskMatchesDate(st));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [groupedTasks, searchText, statusFilter, dateFilter, viewMode]);

  // 9. Xử lý Drag & Drop trên Kanban (Cập nhật trạng thái tức thì với Optimistic UI)
  const handleDropTask = async (taskId: string, targetStatus: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    if (currentTask.status === targetStatus) return;

    if (redirectToTeamTask(currentTask, "đổi trạng thái")) return;

    await handleUpdate(taskId, { status: targetStatus });
  };

  // 10. Event Handlers
  const onTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const onSubtaskToggle = async (
    task: TaskItem,
    subtaskIndex: number,
    newStatus: string,
  ) => {
    const curSubs = (task.aiBreakdown || task.subtasks || []) as Subtask[];
    const updated = curSubs.map((s, idx) =>
      idx === subtaskIndex
        ? { ...s, status: newStatus as SubtaskStatus }
        : s,
    );
    try {
      await updateSubtaskStatus(task.id, updated);
      fetchTasks();
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({
          ...selectedTask,
          aiBreakdown: updated as any,
          subtasks: updated as any,
        });
      }
    } catch {
      message.error("Không thể cập nhật trạng thái việc con");
    }
  };

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
        // Silent
      })
      .finally(() => setExplainLoading(false));

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
        // Silent
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

        {/* Thanh công cụ tìm kiếm, chuyển đổi View và thêm việc */}
        <TaskFilterBar
          searchText={searchText}
          onSearchChange={setSearchText}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onOpenScheduler={() => setSchedulerVisible(true)}
          onOpenCreateModal={() => setCreateModalVisible(true)}
        />

        {/* Nội dung chính: Chuyển đổi giữa Dạng Bảng và Kanban Board */}
        {viewMode === "table" ? (
          <TaskTable
            tasks={filteredTasks}
            loading={loading}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onBreakdownClick={onBreakdownClick}
            onStatusChange={fetchTasks}
            onTaskClick={onTaskClick}
            onExtendClick={(task) => setExtendingTask(task)}
            onDeleteMany={handleDeleteMany}
            onDeleteAll={handleDeleteAll}
          />
        ) : (
          <TaskKanbanBoard
            tasks={filteredTasks}
            loading={loading}
            onDropTask={handleDropTask}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onBreakdownClick={onBreakdownClick}
            onOpenCreateModal={() => setCreateModalVisible(true)}
            onTaskClick={onTaskClick}
            onExtendClick={(task) => setExtendingTask(task)}
          />
        )}

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

        {/* Modal Xem & Thao tác Chi Tiết Task */}
        <TaskDetailModal
          open={isDetailModalOpen}
          task={selectedTask}
          onCancel={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onBreakdownClick={onBreakdownClick}
          onSubtaskToggle={onSubtaskToggle}
          onExtendClick={(task) => setExtendingTask(task)}
          onTaskUpdated={(updated) => {
            setSelectedTask(updated);
            void fetchTasks();
          }}
        />

        {/* Modal Gia hạn & Duyệt gia hạn Deadline */}
        <TaskExtendModal
          open={!!extendingTask}
          task={extendingTask}
          onCancel={() => setExtendingTask(null)}
          onSuccess={() => {
            setExtendingTask(null);
            fetchTasks();
          }}
        />
      </main>
    </div>
  );
}

export default Tasks;
