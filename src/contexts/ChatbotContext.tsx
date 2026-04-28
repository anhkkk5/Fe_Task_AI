import React, { createContext, useContext, useRef, useState } from "react";
import type { Subtask } from "../services/taskServices";
import {
  getOrCreateConversationByParent,
  type AiMessage,
} from "../services/chatServices";

export interface SubtaskChatContext {
  parentTaskId: string;
  subtaskTitle: string;
  subtaskDescription?: string;
  parentTaskTitle: string;
  parentTaskDescription?: string;
  estimatedDuration?: number;
  parentEstimatedDuration?: number;
  dailyTargetDuration?: number;
  dailyTargetMin?: number;
  difficulty?: string;
  description?: string;
  subtaskKey: string; // `${taskId}:${subtaskIndex}`
  subtaskIndex: number;
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

const GENERAL_KEY = "__general__";

const messagesToHistory = (messages: AiMessage[]): Message[] =>
  messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      text: m.content,
    }));

const buildIntroMessage = (
  subtask: Subtask,
  parentTaskTitle: string,
): Message => {
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

  return {
    role: "model",
    text:
      `📚 Chào bạn! Tôi sẽ hướng dẫn bạn làm **${subtask.title}** — một bước trong "${parentTaskTitle}".\n\n` +
      (difficultyLabel ? `🎯 Độ khó: **${difficultyLabel}**\n` : "") +
      (durationStr ? `⏱️ Thời gian dự kiến: **${durationStr}**\n` : "") +
      (subtask.description ? `📝 Nội dung: ${subtask.description}\n` : "") +
      `\nĐể hỗ trợ tốt nhất, bạn cho mình biết:\n` +
      `- 🧩 Bạn muốn tiếp cận theo hướng nào (lý thuyết, thực hành, hay tôi code/làm mẫu hộ)?\n` +
      `- 🛠️ Có công cụ/công nghệ/ngôn ngữ cụ thể nào bạn muốn dùng không?`,
  };
};

const buildTransitionMessage = (
  subtask: Subtask,
  parentTaskTitle: string,
): Message => ({
  role: "model",
  text:
    `🔀 Chuyển sang bước tiếp theo: **${subtask.title}** (trong "${parentTaskTitle}").\n` +
    (subtask.description ? `📝 ${subtask.description}\n` : "") +
    `\nMình vẫn giữ ngữ cảnh và lựa chọn trước đó của bạn. Bạn muốn tiếp tục hướng cũ hay đổi cách tiếp cận?`,
});

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

  // Cache by parent task id (or __general__). All subtasks of the same parent
  // share ONE thread, so we only need to key by parentTaskId on the FE side.
  const conversationMap = useRef<
    Map<string, { history: Message[]; convId: string | null }>
  >(new Map());

  const persistCurrent = (key: string | null) => {
    if (!key) return;
    conversationMap.current.set(key, {
      history: currentHistory,
      convId: activeConversationId,
    });
  };

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
      parentTaskId: taskId,
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
      subtaskIndex: index,
    };

    // Persist whatever is currently on screen before switching
    const previousKey = subtaskContext
      ? subtaskContext.parentTaskId
      : GENERAL_KEY;
    persistCurrent(previousKey);

    const switchingWithinSameParent =
      !!subtaskContext && subtaskContext.parentTaskId === taskId;

    const cached = conversationMap.current.get(taskId);

    if (cached) {
      // Same parent → same conversation. Append a transition notice if
      // the user is jumping to another subtask inside that parent.
      if (
        switchingWithinSameParent &&
        subtaskContext?.subtaskKey !== subtaskKey
      ) {
        setCurrentHistory([
          ...cached.history,
          buildTransitionMessage(subtask, parentTaskTitle),
        ]);
      } else {
        setCurrentHistory(cached.history);
      }
      setActiveConversationId(cached.convId);
      setSubtaskContext(ctx);
      setIsOpen(true);
      return;
    }

    // First time opening chat for this parent task → hydrate from BE if exists
    setSubtaskContext(ctx);
    setIsOpen(true);
    setCurrentHistory([buildIntroMessage(subtask, parentTaskTitle)]);
    setActiveConversationId(null);

    (async () => {
      try {
        const { conversation, messages } =
          await getOrCreateConversationByParent(taskId, parentTaskTitle);
        const history = messagesToHistory(messages);
        // Prepend our local intro if BE thread is empty so UX feels warm.
        const nextHistory =
          history.length === 0
            ? [buildIntroMessage(subtask, parentTaskTitle)]
            : history;
        conversationMap.current.set(taskId, {
          history: nextHistory,
          convId: conversation.id,
        });
        setCurrentHistory(nextHistory);
        setActiveConversationId(conversation.id);
      } catch {
        // silent — keep local intro, BE creates thread on first message
      }
    })();
  };

  const openGeneral = () => {
    const previousKey = subtaskContext
      ? subtaskContext.parentTaskId
      : GENERAL_KEY;
    persistCurrent(previousKey);

    const existing = conversationMap.current.get(GENERAL_KEY);
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
    const previousKey = subtaskContext
      ? subtaskContext.parentTaskId
      : GENERAL_KEY;
    persistCurrent(previousKey);
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
