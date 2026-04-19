import React, { createContext, useContext, useRef, useState } from "react";
import type { Subtask } from "../services/taskServices";

export interface SubtaskChatContext {
  subtaskTitle: string;
  parentTaskTitle: string;
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
  openWithSubtask: (
    subtask: Subtask,
    parentTaskTitle: string,
    taskId: string,
    index: number,
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

  // Map lưu history riêng cho từng subtask
  const conversationMap = useRef<Map<string, Message[]>>(new Map());

  const openWithSubtask = (
    subtask: Subtask,
    parentTaskTitle: string,
    taskId: string,
    index: number,
  ) => {
    const subtaskKey = `${taskId}:${index}`;
    const ctx: SubtaskChatContext = {
      subtaskTitle: subtask.title,
      parentTaskTitle,
      difficulty: subtask.difficulty,
      description: subtask.description,
      subtaskKey,
    };

    // Lưu history hiện tại nếu đang có subtask context
    if (subtaskContext) {
      conversationMap.current.set(subtaskContext.subtaskKey, currentHistory);
    }

    // Load history của subtask mới (hoặc tạo initial message)
    const existingHistory = conversationMap.current.get(subtaskKey);
    if (existingHistory) {
      setCurrentHistory(existingHistory);
    } else {
      const difficultyLabel =
        subtask.difficulty === "easy"
          ? "Dễ"
          : subtask.difficulty === "medium"
            ? "Trung bình"
            : subtask.difficulty === "hard"
              ? "Khó"
              : "";

      const initialMsg: Message = {
        role: "model",
        text: `📚 Chào bạn! Tôi sẽ giúp bạn học về **${subtask.title}** trong task "${parentTaskTitle}".\n\n${difficultyLabel ? `Độ khó: **${difficultyLabel}**\n\n` : ""}Bạn muốn bắt đầu từ đâu?\n- 📖 **Lý thuyết** — Giải thích khái niệm cơ bản\n- 🏋️ **Bài tập** — Thực hành ngay\n- 💡 **Ví dụ** — Xem ví dụ thực tế`,
      };
      setCurrentHistory([initialMsg]);
    }

    setSubtaskContext(ctx);
    setIsOpen(true);
  };

  const openGeneral = () => {
    // Lưu history subtask hiện tại nếu có
    if (subtaskContext) {
      conversationMap.current.set(subtaskContext.subtaskKey, currentHistory);
    }
    setSubtaskContext(null);
    setCurrentHistory([DEFAULT_WELCOME]);
    setIsOpen(true);
  };

  const close = () => {
    // Lưu history trước khi đóng
    if (subtaskContext) {
      conversationMap.current.set(subtaskContext.subtaskKey, currentHistory);
    }
    setIsOpen(false);
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        subtaskContext,
        currentHistory,
        setCurrentHistory,
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
