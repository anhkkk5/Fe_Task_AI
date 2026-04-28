import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Input, Spin, Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
import { useSelector } from "react-redux";
import {
  PlusOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  LoadingOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  BarChartOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getConversations,
  getConversationMessages,
  sendChatMessage,
  deleteConversation,
  renameConversation,
  type AiConversation,
  type AiMessage,
} from "../../services/chatServices";
import "./Chat.scss";

type Suggestion = { icon: React.ReactNode; label: string; prompt: string };
type ScheduleGuideAction = {
  label: string;
  description: string;
  prompt: string;
  sendNow?: boolean;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: <ThunderboltOutlined />,
    label: "Tối ưu lịch hôm nay",
    prompt:
      "Giúp tôi sắp xếp lại lịch làm việc hôm nay sao cho hiệu quả nhất dựa trên mức độ ưu tiên.",
  },
  {
    icon: <CalendarOutlined />,
    label: "Tạo công việc mới",
    prompt:
      "Tôi muốn tạo một công việc mới. Hãy hỏi tôi các thông tin cần thiết (tiêu đề, deadline, ưu tiên, ước lượng thời gian).",
  },
  {
    icon: <BarChartOutlined />,
    label: "Tóm tắt tiến độ tuần",
    prompt:
      "Hãy tóm tắt tiến độ công việc của tôi trong tuần này và chỉ ra các task đang chậm deadline.",
  },
  {
    icon: <BulbOutlined />,
    label: "Gợi ý cải thiện năng suất",
    prompt:
      "Dựa trên thói quen làm việc của tôi, hãy gợi ý 3 điều tôi có thể cải thiện để năng suất cao hơn.",
  },
];

const SCHEDULING_GUIDE_ACTIONS: ScheduleGuideAction[] = [
  {
    label: "Bắt đầu từng bước",
    description:
      "AI sẽ hỏi lần lượt mục tiêu, thời lượng, khung giờ, ngày ưu tiên.",
    prompt:
      "Hãy giúp tôi lên lịch theo từng bước. Bạn hãy hỏi tôi từng câu một để thu thập đủ: hoạt động, thời lượng mỗi buổi, số buổi/tuần, khung giờ mong muốn, ngày ưu tiên. Khi đủ dữ liệu thì tóm tắt lại và hỏi tôi có muốn lên lịch luôn không.",
    sendNow: true,
  },
  {
    label: "Mẫu nhập nhanh",
    description: "Dùng mẫu có sẵn để điền nhanh rồi AI lên lịch.",
    prompt:
      "Tôi muốn lên lịch theo mẫu sau: hoạt động=[...], thời lượng mỗi buổi=[...] phút, số buổi/tuần=[...], khung giờ=[...], ngày ưu tiên=[...], khoảng ngày=[... đến ...]. Hãy hỏi bù phần thiếu rồi mới lên lịch.",
    sendNow: true,
  },
  {
    label: "Kiểm tra lịch rảnh trước",
    description: "Xem lịch bận/rảnh trước khi chốt đề xuất.",
    prompt:
      "Hãy bắt đầu bằng cách kiểm tra lịch rảnh của tôi tuần này, sau đó hỏi tôi từng bước để lên lịch hoạt động phù hợp.",
    sendNow: true,
  },
];

function Chat() {
  const { user } = useSelector((state: any) => state.auth);
  const firstName = (user?.name || "bạn").split(" ").slice(-1)[0];
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [renameModal, setRenameModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);
  const [selectionPopup, setSelectionPopup] = useState<{
    show: boolean;
    x: number;
    y: number;
    text: string;
  }>({ show: false, x: 0, y: 0, text: "" });

  // Listen for text selection in assistant messages
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim() ?? "";
        if (!selectedText || selectedText.length < 3) {
          setSelectionPopup((p) => ({ ...p, show: false }));
          return;
        }
        const range = selection?.getRangeAt(0);
        if (!range) return;
        // Only show if inside .msg-bubble of assistant
        const container = range.commonAncestorContainer;
        const bubble = (container as Element).closest
          ? (container as Element).closest?.(".msg-row.assistant .msg-bubble")
          : null;
        if (!bubble) return;
        const rect = range.getBoundingClientRect();
        setSelectionPopup({
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          text: selectedText,
        });
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest?.(".chat-selection-popup")) {
        setSelectionPopup((p) => ({ ...p, show: false }));
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const handleAskAboutSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectionPopup.text) return;
    const contextMsg = `"${selectionPopup.text}" — `;
    setInput(contextMsg);
    setSelectionPopup({ show: false, x: 0, y: 0, text: "" });
    window.getSelection()?.removeAllRanges();
    // Focus input
    setTimeout(() => {
      const ta = document.querySelector(
        ".input-wrap textarea",
      ) as HTMLTextAreaElement;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(contextMsg.length, contextMsg.length);
      }
    }, 50);
  };

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.conversations || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = async (id: string) => {
    if (sending || activeId === id) return;
    setActiveId(id);
    setLoadingMsgs(true);
    shouldScrollRef.current = false; // Don't auto-scroll when loading history
    try {
      const res = await getConversationMessages(id);
      setMessages(res.messages || []);
    } catch {
      message.error("Không thể tải tin nhắn");
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleNewChat = () => {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setInput("");
  };

  const sendMessageText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending) return;

      const userMsg: AiMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      try {
        const res = await sendChatMessage({
          message: text,
          conversationId: activeId ?? undefined,
        });

        if (!activeId) setActiveId(res.conversationId);

        const aiMsg: AiMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          createdAt: new Date().toISOString(),
        };
        shouldScrollRef.current = true;
        setMessages((prev) => [...prev, aiMsg]);
        loadConversations();

        // Notify task list / calendar to refetch when AI created tasks
        if ((res as any).tasksCreated > 0) {
          window.dispatchEvent(
            new CustomEvent("ai-tasks-created", {
              detail: { count: (res as any).tasksCreated },
            }),
          );
        }
      } catch {
        message.error("Gửi tin nhắn thất bại");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(text);
      } finally {
        setSending(false);
      }
    },
    [activeId, loadConversations, sending],
  );

  const handleSend = async () => {
    void sendMessageText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "Xóa cuộc trò chuyện?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteConversation(id);
          if (activeId === id) {
            setActiveId(null);
            setMessages([]);
          }
          loadConversations();
          message.success("Đã xóa");
        } catch {
          message.error("Xóa thất bại");
        }
      },
    });
  };

  const handleRenameOpen = (conv: AiConversation) => {
    setRenameModal({ id: conv.id, title: conv.title });
    setRenameValue(conv.title);
  };

  const handleRenameConfirm = async () => {
    if (!renameModal || !renameValue.trim()) return;
    try {
      await renameConversation(renameModal.id, renameValue.trim());
      loadConversations();
      setRenameModal(null);
      message.success("Đã đổi tên");
    } catch {
      message.error("Đổi tên thất bại");
    }
  };

  const getConvMenu = (conv: AiConversation): MenuProps => ({
    items: [
      {
        key: "rename",
        icon: <EditOutlined />,
        label: "Đổi tên",
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
          handleRenameOpen(conv);
        },
      },
      { type: "divider" },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Xóa",
        danger: true,
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
          handleDelete(conv.id);
        },
      },
    ],
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isNewChat = !activeId && messages.length === 0;

  // Group conversations by date bucket (Today, Yesterday, Last 7 days, Older)
  const groupedConversations = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    const groups: Record<string, AiConversation[]> = {
      "Hôm nay": [],
      "Hôm qua": [],
      "7 ngày trước": [],
      "Cũ hơn": [],
    };
    conversations.forEach((c) => {
      const diff = now - new Date(c.updatedAt).getTime();
      if (diff < DAY) groups["Hôm nay"].push(c);
      else if (diff < 2 * DAY) groups["Hôm qua"].push(c);
      else if (diff < 7 * DAY) groups["7 ngày trước"].push(c);
      else groups["Cũ hơn"].push(c);
    });
    return groups;
  }, [conversations]);

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const ta = document.querySelector(
        ".chat-composer textarea",
      ) as HTMLTextAreaElement | null;
      ta?.focus();
    }, 30);
  };

  const handleSchedulingGuideAction = (action: ScheduleGuideAction) => {
    if (sending) return;

    if (action.sendNow) {
      void sendMessageText(action.prompt);
      return;
    }

    setInput(action.prompt);
  };

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusOutlined />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        <nav className="conversation-list">
          {conversations.length === 0 ? (
            <div className="no-convs">Chưa có cuộc trò chuyện nào</div>
          ) : (
            Object.entries(groupedConversations).map(([groupLabel, items]) =>
              items.length === 0 ? null : (
                <div key={groupLabel} className="conv-group">
                  <div className="conv-group-label">{groupLabel}</div>
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`conv-item ${activeId === conv.id ? "active" : ""}`}
                      onClick={() => openConversation(conv.id)}
                    >
                      <span className="conv-title">{conv.title}</span>
                      <Dropdown
                        menu={getConvMenu(conv)}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <button
                          className="conv-more-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Tùy chọn"
                        >
                          <MoreOutlined />
                        </button>
                      </Dropdown>
                    </div>
                  ))}
                </div>
              ),
            )
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="chat-main">
        {isNewChat ? (
          <div className="chat-welcome">
            <div className="welcome-inner">
              <div className="welcome-greeting">
                <span className="greet-sparkle">✨</span> Xin chào {firstName}!
              </div>
              <h1 className="welcome-title">Chúng ta bắt đầu từ đâu nhỉ?</h1>

              <SchedulingGuideBlock
                actions={SCHEDULING_GUIDE_ACTIONS}
                onActionClick={handleSchedulingGuideAction}
                compact={false}
                disabled={sending}
              />

              <ChatComposer
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                sending={sending}
                placeholder="Hỏi TaskMind AI bất cứ điều gì..."
              />

              <div className="suggestion-chips">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(s.prompt)}
                  >
                    <span className="chip-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="messages-area">
              <div className="messages-inner">
                {loadingMsgs ? (
                  <div className="loading-center">
                    <Spin size="large" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`msg-row ${msg.role}`}>
                      {msg.role === "assistant" && (
                        <div className="msg-avatar">
                          <div className="avatar ai-avatar">
                            <RobotOutlined />
                          </div>
                        </div>
                      )}
                      <div className="msg-body">
                        <div className="msg-bubble">
                          {msg.role === "assistant" ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                        <span
                          className="msg-time"
                          title={new Date(msg.createdAt).toLocaleString(
                            "vi-VN",
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.role === "user" && (
                        <div className="msg-avatar">
                          <div className="avatar user-avatar">
                            <UserOutlined />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {sending && (
                  <div className="msg-row assistant">
                    <div className="msg-avatar">
                      <div className="avatar ai-avatar">
                        <RobotOutlined />
                      </div>
                    </div>
                    <div className="msg-body">
                      <div className="msg-bubble">
                        <div className="typing">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="input-bar">
              <SchedulingGuideBlock
                actions={SCHEDULING_GUIDE_ACTIONS}
                onActionClick={handleSchedulingGuideAction}
                compact
                disabled={sending}
              />
              <ChatComposer
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                sending={sending}
                placeholder="Hỏi tiếp TaskMind AI... (Enter gửi, Shift+Enter xuống dòng)"
              />
              <span className="input-hint">
                TaskMind AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
              </span>
            </div>
          </>
        )}
      </main>

      {/* Selection popup */}
      {selectionPopup.show && (
        <div
          className="chat-selection-popup"
          style={{
            position: "fixed",
            left: selectionPopup.x,
            top: selectionPopup.y,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
          onMouseDown={handleAskAboutSelection}
        >
          <button className="chat-ask-selection-btn">
            <QuestionCircleOutlined />
            <span>Hỏi về đoạn này</span>
          </button>
        </div>
      )}

      {/* Rename modal */}
      <Modal
        title="Đổi tên cuộc trò chuyện"
        open={!!renameModal}
        onOk={handleRenameConfirm}
        onCancel={() => setRenameModal(null)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleRenameConfirm}
          maxLength={100}
          autoFocus
        />
      </Modal>
    </div>
  );
}

function SchedulingGuideBlock(props: {
  actions: ScheduleGuideAction[];
  onActionClick: (action: ScheduleGuideAction) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const { actions, onActionClick, compact = false, disabled = false } = props;

  return (
    <section className={`schedule-guide ${compact ? "compact" : ""}`}>
      <div className="schedule-guide-header">
        <CalendarOutlined className="guide-icon" />
        <div>
          <div className="guide-title">Hướng dẫn lên lịch với AI</div>
          <div className="guide-subtitle">
            Chạm một lựa chọn để bắt đầu ngay, AI sẽ hỏi từng bước đến khi đủ
            thông tin rồi mới đề xuất/chốt lịch.
          </div>
        </div>
      </div>

      <div className="guide-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="guide-action"
            onClick={() => onActionClick(action)}
            disabled={disabled}
          >
            <span className="action-label">{action.label}</span>
            <span className="action-description">{action.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// Reusable pill composer (ChatGPT-style)
function ChatComposer(props: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sending: boolean;
  placeholder?: string;
}) {
  const { input, setInput, onSend, onKeyDown, sending, placeholder } = props;
  return (
    <div className="chat-composer">
      <Input.TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || "Hỏi bất kỳ điều gì..."}
        autoSize={{ minRows: 1, maxRows: 8 }}
        disabled={sending}
        variant="borderless"
      />
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={sending ? <LoadingOutlined /> : <SendOutlined />}
        onClick={onSend}
        disabled={!input.trim() || sending}
        className="composer-send-btn"
      />
    </div>
  );
}

export default Chat;
