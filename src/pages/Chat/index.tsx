import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, Spin, Tooltip, Dropdown, Modal, message } from "antd";
import type { MenuProps } from "antd";
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

function Chat() {
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

  const handleSend = async () => {
    const text = input.trim();
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
    } catch {
      message.error("Gửi tin nhắn thất bại");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
    } finally {
      setSending(false);
    }
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

  const formatDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 86400000) return "Hôm nay";
    if (diff < 172800000) return "Hôm qua";
    return new Date(iso).toLocaleDateString("vi-VN");
  };

  const isNewChat = !activeId && messages.length === 0;

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

        <div className="sidebar-section-label">Gần đây</div>

        <nav className="conversation-list">
          {conversations.length === 0 ? (
            <div className="no-convs">Chưa có cuộc trò chuyện nào</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conv-item ${activeId === conv.id ? "active" : ""}`}
                onClick={() => openConversation(conv.id)}
              >
                <div className="conv-info">
                  <span className="conv-title">{conv.title}</span>
                  <span className="conv-date">
                    {formatDate(conv.updatedAt)}
                  </span>
                </div>
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
            ))
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="chat-main">
        {isNewChat ? (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <RobotOutlined />
            </div>
            <h2>Bạn đang làm về cái gì?</h2>
            <p>Hỏi bất kỳ điều gì về công việc, lịch trình, hoặc năng suất.</p>
            <div className="welcome-input-wrap">
              <Input.TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi bất kỳ điều gì..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={sending}
              />
              <Button
                type="primary"
                shape="circle"
                icon={sending ? <LoadingOutlined /> : <SendOutlined />}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="send-btn"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="messages-area">
              {loadingMsgs ? (
                <div className="loading-center">
                  <Spin size="large" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`msg-row ${msg.role}`}>
                    <div className="msg-avatar">
                      <div
                        className={`avatar ${msg.role === "user" ? "user-avatar" : "ai-avatar"}`}
                      >
                        {msg.role === "user" ? (
                          <UserOutlined />
                        ) : (
                          <RobotOutlined />
                        )}
                      </div>
                    </div>
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
                      <Tooltip
                        title={new Date(msg.createdAt).toLocaleString("vi-VN")}
                      >
                        <span className="msg-time">
                          {formatTime(msg.createdAt)}
                        </span>
                      </Tooltip>
                    </div>
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

            <div className="input-bar">
              <div className="input-wrap">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  disabled={sending}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={sending ? <LoadingOutlined /> : <SendOutlined />}
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="send-btn"
                />
              </div>
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

export default Chat;
