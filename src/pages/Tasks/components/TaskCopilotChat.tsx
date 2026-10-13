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
  streamTaskCopilotChat,
  applyCopilotBreakdown,
} from "../../../services/taskServices";
import type { TaskItem } from "../types";
import "./TaskCopilotChat.scss";

interface TaskCopilotChatProps {
  task: TaskItem;
  selectedSubtask?: { title: string; index?: number } | null;
  onClearSelectedSubtask?: () => void;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
  onSwitchToDetailsTab?: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  subtaskTitle?: string;
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
  selectedSubtask,
  onClearSelectedSubtask,
  onTaskUpdated,
  onSwitchToDetailsTab,
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
      subtaskTitle: selectedSubtask?.title,
      timestamp: new Date().toISOString(),
    };

    // Tạo tin nhắn assistant trống để stream chữ vào
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue("");
    setSending(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    try {
      await streamTaskCopilotChat(
        taskId,
        text,
        // onDelta: cập nhật chữ chạy ra streaming như ChatGPT
        (delta) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              last.content += delta;
            }
            return copy;
          });
        },
        // onDone: cập nhật kết quả hoàn chỉnh, checklist nếu có
        (data) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              last.content = data.fullReply;
              last.suggestedBreakdown = data.suggestedBreakdown;
            }
            return copy;
          });

          if (data.task && onTaskUpdated) {
            onTaskUpdated({
              ...task,
              ...data.task,
              aiBreakdown: data.task.aiBreakdown,
              aiChatHistory: (data.task as any).aiChatHistory,
              subtasks: data.task.subtasks || task.subtasks,
            } as TaskItem);
          }
          setSending(false);
        },
        // onError
        (err) => {
          message.error(err?.message || "Không thể kết nối tới AI Copilot");
          setSending(false);
        },
        ac.signal,
        selectedSubtask?.title,
      );
    } catch (err: any) {
      message.error(err?.message || "Không thể kết nối tới AI Copilot");
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
          ? "Đã lưu lộ trình mới vào danh sách việc con!"
          : "Đã thêm các bước vào danh sách việc con!",
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
      onSwitchToDetailsTab?.();
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

      {/* Subtask Context Focus Banner */}
      {selectedSubtask && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#ecfdf5",
            borderBottom: "1px solid #a7f3d0",
            fontSize: 13,
            color: "#065f46",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
            }}
          >
            <AimOutlined style={{ color: "#10b981", fontSize: 16 }} />
            <span
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              Đang hỏi về bước con:{" "}
              <strong style={{ color: "#047857" }}>
                "{selectedSubtask.title}"
              </strong>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                (thuộc: {task.title})
              </span>
            </span>
          </div>
          {onClearSelectedSubtask && (
            <Button
              size="small"
              type="text"
              onClick={onClearSelectedSubtask}
              style={{
                color: "#dc2626",
                fontSize: 12,
                height: 24,
                padding: "0 6px",
              }}
            >
              ✕ Bỏ chọn
            </Button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="copilot-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <ThunderboltOutlined className="empty-icon" />
            <p>
              <strong>
                Chào bạn! Tôi là Trợ lý AI đồng hành với công việc này.
              </strong>
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
                {msg.subtaskTitle && (
                  <div style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#d1fae5",
                        color: "#065f46",
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      <AimOutlined /> Về bước: {msg.subtaskTitle}
                    </span>
                  </div>
                )}

                <div className="markdown-body">
                  {!msg.content && sending && idx === messages.length - 1 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#64748b",
                        fontSize: 13,
                        padding: "4px 0",
                      }}
                    >
                      <Spin size="small" />
                      <span>AI đang suy nghĩ và chuẩn bị câu trả lời...</span>
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content.replace(/```json_breakdown[\s\S]*$/, "").trim()}
                      </ReactMarkdown>
                      {sending && idx === messages.length - 1 && (
                        <span
                          style={{
                            color: "#10b981",
                            fontWeight: 700,
                            animation: "blink 1s infinite",
                          }}
                        >
                          {" "}
                          ▍
                        </span>
                      )}
                    </>
                  )}
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

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      <div className="copilot-prompt-chips">
        {(selectedSubtask
          ? [
              `💡 Hướng dẫn chi tiết cách làm bước này`,
              `💻 Code mẫu / Cách cấu hình cho bước này`,
              `⚠️ Những lỗi thường gặp khi làm bước này`,
              `✅ Tiêu chuẩn hoàn thành bước này`,
            ]
          : PROMPT_SUGGESTIONS
        ).map((prompt, pIdx) => (
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
          placeholder={
            selectedSubtask
              ? `Hỏi AI về bước "${selectedSubtask.title}" (Nhấn Enter để gửi)...`
              : "Nhập câu hỏi, thắc mắc hoặc yêu cầu lộ trình cho AI (Nhấn Enter để gửi)..."
          }
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
        title="Áp dụng vào danh sách việc con (Subtasks) của công việc"
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        onOk={handleConfirmApply}
        confirmLoading={applying}
        okText="Xác nhận áp dụng"
        cancelText="Hủy"
      >
        <p style={{ marginBottom: 8, color: "#475569" }}>
          Bạn muốn cập nhật danh sách <strong>{selectedBreakdown.length} bước</strong> này vào mục việc con của công việc như thế nào?
        </p>

        <div
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            background: "#f0fdf4",
            borderRadius: 6,
            border: "1px solid #bbf7d0",
            fontSize: 12,
            color: "#166534",
          }}
        >
          💡 Các bước này được lưu trực tiếp dưới dạng việc con (checklist) bên trong công việc này, không làm rối hay tạo thêm thẻ ngoài bảng chính.
        </div>

        <Radio.Group
          value={applyMode}
          onChange={(e) => setApplyMode(e.target.value)}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Radio value="replace">
            <strong>Thay thế toàn bộ danh sách việc con hiện tại</strong> (Khuyên dùng khi bạn muốn theo lộ trình mới hoàn toàn từ AI)
          </Radio>
          <Radio value="append">
            <strong>Thêm nối tiếp vào danh sách việc con đang có</strong> (Giữ nguyên các việc con cũ và bổ sung thêm các bước mới này)
          </Radio>
        </Radio.Group>
      </Modal>
    </div>
  );
};
