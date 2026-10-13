import React, { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Spin,
  message,
  Modal,
  Radio,
} from "antd";
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  AimOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  taskCopilotChat,
  applyCopilotBreakdown,
} from "../../../services/taskServices";
import type { TaskItem } from "../types";
import "./TaskCopilotChat.scss";

interface TaskCopilotChatProps {
  task: TaskItem;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestedBreakdown?: Array<{
    title: string;
    estimatedDuration?: number;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  timestamp?: string | Date;
}

const PROMPT_SUGGESTIONS = [
  "💡 Lập lộ trình học/làm theo mục tiêu ngày",
  "📚 Tóm tắt kiến thức trọng tâm & ví dụ dễ hiểu",
  "❓ Những lỗi hay gặp cần tránh khi làm việc này",
  "📋 Chia nhỏ việc này thành checklist cụ thể",
];

export const TaskCopilotChat: React.FC<TaskCopilotChatProps> = ({
  task,
  onTaskUpdated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return (task.aiChatHistory || []) as ChatMessage[];
  });
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  // Apply Breakdown Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<any[]>([]);
  const [applyMode, setApplyMode] = useState<"replace" | "append">("replace");
  const [applying, setApplying] = useState(false);

  const taskId = (task as any)._id || task.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Sync if task changes
  useEffect(() => {
    if (task.aiChatHistory && task.aiChatHistory.length > 0) {
      setMessages(task.aiChatHistory as ChatMessage[]);
    }
  }, [taskId, task.aiChatHistory]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);

    try {
      const res = await taskCopilotChat(taskId, text);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.reply,
        suggestedBreakdown: res.suggestedBreakdown,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.task && onTaskUpdated) {
        onTaskUpdated({
          ...task,
          ...res.task,
          aiBreakdown: res.task.aiBreakdown,
          aiChatHistory: (res.task as any).aiChatHistory,
          subtasks: res.task.subtasks || task.subtasks,
        } as TaskItem);
      }
    } catch (err: any) {
      message.error(err?.message || "Không thể kết nối tới AI Copilot");
    } finally {
      setSending(false);
    }
  };

  const handleOpenApplyModal = (breakdown: any[]) => {
    setSelectedBreakdown(breakdown);
    setApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedBreakdown || selectedBreakdown.length === 0) return;
    setApplying(true);
    try {
      const res = await applyCopilotBreakdown(
        taskId,
        selectedBreakdown,
        applyMode,
      );
      message.success(
        applyMode === "replace"
          ? "Đã thay thế toàn bộ checklist bằng lộ trình mới từ AI!"
          : "Đã thêm nối tiếp các bước mới vào checklist công việc!",
      );
      setApplyModalOpen(false);
      if (res.task && onTaskUpdated) {
        onTaskUpdated({
          ...task,
          ...res.task,
          aiBreakdown: res.task.aiBreakdown,
          subtasks: res.task.subtasks,
        } as TaskItem);
      }
    } catch (err: any) {
      message.error(err?.message || "Lỗi khi áp dụng các bước");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="task-copilot-container">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div className="copilot-title">
          <RobotOutlined style={{ color: "#10b981", fontSize: 18 }} />
          <span>Task Copilot</span>
          <span className="ai-badge">OpenAI gpt-4o-mini</span>
        </div>
        <div className="copilot-memory-hint">
          <HistoryOutlined />
          <span>Đã kích hoạt bộ nhớ ngữ cảnh & tiến độ học tập</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="copilot-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <ThunderboltOutlined className="empty-icon" />
            <p>
              <strong>Chào bạn! Tôi là Trợ lý AI đồng hành với công việc này.</strong>
            </p>
            <p>
              Bạn có thể hỏi tôi bất cứ kiến thức gì, giải thích ngữ pháp, tóm tắt lý thuyết, hoặc nhờ tôi chia lộ trình học/làm theo mục tiêu ngày.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble-row ${msg.role === "user" ? "user-row" : "assistant-row"}`}
            >
              <div
                className={`avatar-wrap ${msg.role === "user" ? "user-avatar" : "ai-avatar"}`}
              >
                {msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
              </div>

              <div className="chat-bubble">
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* If AI suggested actionable steps */}
                {msg.suggestedBreakdown && msg.suggestedBreakdown.length > 0 && (
                  <div className="breakdown-card">
                    <div className="breakdown-header">
                      <AimOutlined />
                      <span>
                        Đề xuất các bước thực hiện ({msg.suggestedBreakdown.length} bước)
                      </span>
                    </div>

                    <div className="breakdown-list">
                      {msg.suggestedBreakdown.map((step, sIdx) => (
                        <div key={sIdx} className="breakdown-item">
                          <span>
                            <strong>{sIdx + 1}.</strong> {step.title}
                          </span>
                          {step.estimatedDuration && (
                            <span className="step-duration">
                              {step.estimatedDuration}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      style={{
                        background: "#10b981",
                        borderColor: "#10b981",
                        fontWeight: 500,
                      }}
                      onClick={() => handleOpenApplyModal(msg.suggestedBreakdown!)}
                    >
                      Áp dụng vào các bước công việc
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="chat-bubble-row assistant-row">
            <div className="avatar-wrap ai-avatar">
              <RobotOutlined />
            </div>
            <div className="chat-bubble">
              <Spin size="small" />
              <span style={{ marginLeft: 8, color: "#64748b", fontSize: 12 }}>
                AI đang suy nghĩ và tổng hợp kiến thức...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      <div className="copilot-prompt-chips">
        {PROMPT_SUGGESTIONS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            className="chip-btn"
            disabled={sending}
            onClick={() => handleSendMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="copilot-input-area">
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập câu hỏi, thắc mắc hoặc yêu cầu lộ trình cho AI (Nhấn Enter để gửi)..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          disabled={sending}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              void handleSendMessage();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          onClick={() => void handleSendMessage()}
          style={{ height: "auto" }}
        />
      </div>

      {/* Confirmation Modal when Applying Breakdown */}
      <Modal
        title="Áp dụng các bước thực hiện vào công việc"
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        onOk={handleConfirmApply}
        confirmLoading={applying}
        okText="Xác nhận áp dụng"
        cancelText="Hủy"
      >
        <p style={{ marginBottom: 16 }}>
          Bạn muốn cập nhật danh sách <strong>{selectedBreakdown.length} bước</strong> này vào công việc như thế nào?
        </p>

        <Radio.Group
          value={applyMode}
          onChange={(e) => setApplyMode(e.target.value)}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Radio value="replace">
            <strong>Thay thế toàn bộ checklist hiện tại</strong> (Khuyên dùng khi bạn muốn theo lộ trình mới hoàn toàn từ AI)
          </Radio>
          <Radio value="append">
            <strong>Thêm nối tiếp vào các bước đang có</strong> (Giữ nguyên các việc cũ và bổ sung thêm các bước mới này)
          </Radio>
        </Radio.Group>
      </Modal>
    </div>
  );
};
