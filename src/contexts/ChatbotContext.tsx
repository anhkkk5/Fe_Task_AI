import React, { createContext, useContext, useRef, useState } from "react";
import type { Subtask } from "../services/taskServices";

export interface SubtaskChatContext {
  subtaskTitle: string;
  subtaskDescription?: string;
  parentTaskTitle: string;
  parentTaskDescription?: string;
  estimatedDuration?: number; // phút cho subtask này
  parentEstimatedDuration?: number; // tổng phút của task cha
  dailyTargetDuration?: number; // phút/ngày tối đa
  dailyTargetMin?: number; // phút/ngày tối thiểu
  difficulty?: string;
  description?: string;
  subtaskKey: string; // `${taskId}:${subtaskIndex}`
}

export interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatbotContextValue {
  isOpen: boolean;
  subtaskContext: SubtaskChatContext | null;
  currentHistory: Message[];
  setCurrentHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  // conversationId đang active (dùng để lưu lịch sử vào BE)
  activeConversationId: string | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  openWithSubtask: (
    subtask: Subtask,
    parentTaskTitle: string,
    taskId: string,
    index: number,
    parentTaskInfo?: {
      description?: string;
      estimatedDuration?: number;
      dailyTargetDuration?: number;
      dailyTargetMin?: number;
    },
  ) => void;
  openGeneral: () => void;
  close: () => void;
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

const DEFAULT_WELCOME: Message = {
  role: "model",
  text: "👋 Xin chào! Tôi là AI Assistant của Task Management. Tôi có thể giúp bạn:\n\n- **Quản lý công việc** - Gợi ý cách tổ chức và phân loại task\n- **Lập kế hoạch** - Hỗ trợ lên lịch và đặt deadline hợp lý\n- **Phân tích** - Đưa ra nhận xét về thói quen làm việc\n\nBạn cần hỗ trợ gì?",
};

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subtaskContext, setSubtaskContext] =
    useState<SubtaskChatContext | null>(null);
  const [currentHistory, setCurrentHistory] = useState<Message[]>([
    DEFAULT_WELCOME,
  ]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Map lưu history + conversationId riêng cho từng subtask/general
  const conversationMap = useRef<
    Map<string, { history: Message[]; convId: string | null }>
  >(new Map());

  const openWithSubtask = (
    subtask: Subtask,
    parentTaskTitle: string,
    taskId: string,
    index: number,
    parentTaskInfo?: {
      description?: string;
      estimatedDuration?: number;
      dailyTargetDuration?: number;
      dailyTargetMin?: number;
    },
  ) => {
    const subtaskKey = `${taskId}:${index}`;
    const ctx: SubtaskChatContext = {
      subtaskTitle: subtask.title,
      subtaskDescription: subtask.description,
      parentTaskTitle,
      parentTaskDescription: parentTaskInfo?.description,
      estimatedDuration: subtask.estimatedDuration,
      parentEstimatedDuration: parentTaskInfo?.estimatedDuration,
      dailyTargetDuration: parentTaskInfo?.dailyTargetDuration,
      dailyTargetMin: parentTaskInfo?.dailyTargetMin,
      difficulty: subtask.difficulty,
      description: subtask.description,
      subtaskKey,
    };

    // Lưu history + convId hiện tại
    const currentKey = subtaskContext
      ? subtaskContext.subtaskKey
      : "__general__";
    conversationMap.current.set(currentKey, {
      history: currentHistory,
      convId: activeConversationId,
    });

    // Load history của subtask mới (hoặc tạo initial message)
    const existing = conversationMap.current.get(subtaskKey);
    if (existing) {
      setCurrentHistory(existing.history);
      setActiveConversationId(existing.convId);
    } else {
      const difficultyLabel =
        subtask.difficulty === "easy"
          ? "Dễ"
          : subtask.difficulty === "medium"
            ? "Trung bình"
            : subtask.difficulty === "hard"
              ? "Khó"
              : "";

      const durationStr = subtask.estimatedDuration
        ? `${subtask.estimatedDuration} phút`
        : "";

      const initialMsg: Message = {
        role: "model",
        text:
          `📚 Chào bạn! Tôi sẽ hướng dẫn bạn học **${subtask.title}** — một phần trong lộ trình "${parentTaskTitle}".\n\n` +
          (difficultyLabel ? `🎯 Độ khó: **${difficultyLabel}**\n` : "") +
          (durationStr ? `⏱️ Thời gian dự kiến: **${durationStr}**\n` : "") +
          (subtask.description ? `📝 Nội dung: ${subtask.description}\n` : "") +
          `\nBạn muốn bắt đầu từ đâu?\n` +
          `- 📖 **Lý thuyết** — Giải thích khái niệm từ đầu\n` +
          `- 🏋️ **Bài tập** — Thực hành ngay với ví dụ\n` +
          `- 💡 **Mẹo học** — Cách ghi nhớ nhanh và hiệu quả`,
      };
      setCurrentHistory([initialMsg]);
      setActiveConversationId(null); // new conversation, will be created on first message
    }

    setSubtaskContext(ctx);
    setIsOpen(true);
  };

  const openGeneral = () => {
    // Lưu history subtask hiện tại nếu có
    const currentKey = subtaskContext
      ? subtaskContext.subtaskKey
      : "__general__";
    conversationMap.current.set(currentKey, {
      history: currentHistory,
      convId: activeConversationId,
    });

    // Load general history
    const existing = conversationMap.current.get("__general__");
    if (existing && existing.history.length > 1) {
      setCurrentHistory(existing.history);
      setActiveConversationId(existing.convId);
    } else {
      setCurrentHistory([DEFAULT_WELCOME]);
      setActiveConversationId(null);
    }

    setSubtaskContext(null);
    setIsOpen(true);
  };

  const close = () => {
    // Lưu history trước khi đóng
    const currentKey = subtaskContext
      ? subtaskContext.subtaskKey
      : "__general__";
    conversationMap.current.set(currentKey, {
      history: currentHistory,
      convId: activeConversationId,
    });
    setIsOpen(false);
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        subtaskContext,
        currentHistory,
        setCurrentHistory,
        activeConversationId,
        setActiveConversationId,
        openWithSubtask,
        openGeneral,
        close,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = (): ChatbotContextValue => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
};

export default ChatbotContext;
