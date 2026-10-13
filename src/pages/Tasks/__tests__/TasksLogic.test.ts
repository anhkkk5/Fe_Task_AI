import { describe, it, expect } from "vitest";
import { normalizeApiStatus, type TaskItem } from "../types";

describe("Tasks Logic & Data Transformations", () => {
  describe("normalizeApiStatus", () => {
    it("should return valid known statuses unchanged", () => {
      expect(normalizeApiStatus("todo")).toBe("todo");
      expect(normalizeApiStatus("scheduled")).toBe("scheduled");
      expect(normalizeApiStatus("in_progress")).toBe("in_progress");
      expect(normalizeApiStatus("completed")).toBe("completed");
      expect(normalizeApiStatus("cancelled")).toBe("cancelled");
    });

    it("should normalize legacy 'pending' status to 'todo'", () => {
      expect(normalizeApiStatus("pending")).toBe("todo");
    });

    it("should fallback unknown or undefined statuses to 'todo'", () => {
      expect(normalizeApiStatus("unknown_status")).toBe("todo");
      expect(normalizeApiStatus("")).toBe("todo");
    });
  });

  describe("Subtask Grouping Algorithm", () => {
    it("should correctly group subtasks under their parent tasks", () => {
      const mockTasks: TaskItem[] = [
        {
          id: "parent_1",
          title: "Thiết kế hệ thống",
          description: "Mô tả hệ thống",
          status: "in_progress",
          priority: "high",
          dueDate: "2026-10-20",
          tags: ["architecture"],
          aiAssisted: true,
          isSubtask: false,
        },
        {
          id: "child_1",
          title: "Thiết kế database schema",
          description: "Subtask 1",
          status: "completed",
          priority: "medium",
          dueDate: "2026-10-18",
          tags: [],
          aiAssisted: false,
          parentTaskId: "parent_1",
          isSubtask: true,
        },
        {
          id: "child_2",
          title: "Vẽ kiến trúc luồng dữ liệu",
          description: "Subtask 2",
          status: "todo",
          priority: "medium",
          dueDate: "2026-10-19",
          tags: [],
          aiAssisted: false,
          parentTaskId: "parent_1",
          isSubtask: true,
        },
      ];

      // Giả lập logic nhóm subtask từ Tasks/index.tsx
      const taskMap = new Map<string, TaskItem>();
      const subs: TaskItem[] = [];

      mockTasks.forEach((task) => {
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
        }
      });

      const grouped = Array.from(taskMap.values());

      expect(grouped).toHaveLength(1);
      expect(grouped[0].id).toBe("parent_1");
      expect(grouped[0].subtasks).toHaveLength(2);
      expect(grouped[0].subtasks?.[0].id).toBe("child_1");
      expect(grouped[0].subtasks?.[1].id).toBe("child_2");
    });
  });

  describe("Kanban Column Distribution", () => {
    it("should distribute tasks into 4 kanban columns correctly", () => {
      const mockTasks: TaskItem[] = [
        { id: "1", title: "Task 1", description: "", status: "todo", priority: "low", dueDate: "", tags: [], aiAssisted: false },
        { id: "2", title: "Task 2", description: "", status: "scheduled", priority: "medium", dueDate: "", tags: [], aiAssisted: false },
        { id: "3", title: "Task 3", description: "", status: "in_progress", priority: "high", dueDate: "", tags: [], aiAssisted: false },
        { id: "4", title: "Task 4", description: "", status: "completed", priority: "low", dueDate: "", tags: [], aiAssisted: false },
        { id: "5", title: "Task 5", description: "", status: "todo", priority: "urgent", dueDate: "", tags: [], aiAssisted: false },
      ];

      const todoTasks = mockTasks.filter((t) => t.status === "todo");
      const scheduledTasks = mockTasks.filter((t) => t.status === "scheduled");
      const inProgressTasks = mockTasks.filter((t) => t.status === "in_progress");
      const completedTasks = mockTasks.filter((t) => t.status === "completed");

      expect(todoTasks).toHaveLength(2);
      expect(scheduledTasks).toHaveLength(1);
      expect(inProgressTasks).toHaveLength(1);
      expect(completedTasks).toHaveLength(1);
    });
  });

  describe("Vietnamese Accent-Insensitive Search", () => {
    it("should match Vietnamese text without accents", async () => {
      const { matchVietnameseSearch, removeVietnameseTones } = await import(
        "../../../utils/vietnameseUtils"
      );

      expect(removeVietnameseTones("Báo cáo tài chính")).toBe("bao cao tai chinh");
      expect(removeVietnameseTones("Đang thực hiện")).toBe("dang thuc hien");

      // Test tìm không dấu
      expect(matchVietnameseSearch("Hoàn thiện báo cáo tài chính Q3", "bao cao")).toBe(true);
      expect(matchVietnameseSearch("Thiết kế giao diện Mobile", "thiet ke")).toBe(true);
      expect(matchVietnameseSearch("Thiết kế giao diện Mobile", "giao dien")).toBe(true);
      expect(matchVietnameseSearch("Tối ưu hóa Database", "toi uu")).toBe(true);

      // Test tìm có dấu
      expect(matchVietnameseSearch("Hoàn thiện báo cáo tài chính Q3", "báo cáo")).toBe(true);

      // Test không khớp
      expect(matchVietnameseSearch("Hoàn thiện báo cáo tài chính Q3", "khong tim thay")).toBe(false);
    });
  });
});
