import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CloseOutlined,
  MinusOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  SmileOutlined,
  PaperClipOutlined,
  SendOutlined,
  LikeOutlined,
  PictureOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import { message as antMessage, Dropdown, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { useMessenger } from "../../contexts/MessengerContext";
import {
  getConversation,
  listMessages,
  markAllAsSeenREST,
  uploadAttachment,
  type MessengerAttachment,
  type MessengerConversation,
  type MessengerMessage,
} from "../../services/messengerServices";
import {
  formatFileSize,
  formatMessageTime,
  getConversationAvatar,
  getConversationTitle,
  getInitial,
  getOtherMember,
  isOwnerOnline,
} from "./utils";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

type Props = {
  conversationId: string;
  minimized?: boolean;
  onClose?: () => void;
  onToggleMinimize?: () => void;
  embedded?: boolean; // when used in full-screen page
};

const ChatWindow: React.FC<Props> = ({
  conversationId,
  minimized,
  onClose,
  onToggleMinimize,
  embedded,
}) => {
  const navigate = useNavigate();
  const {
    socket,
    currentUserId,
    onlineUsers,
    typingByConv,
    onMessageNew,
    onMessageUpdated,
    onMessageReacted,
    onMessageSeen,
  } = useMessenger();

  const [conversation, setConversation] =
    useState<MessengerConversation | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<MessengerMessage | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<
    MessengerAttachment[]
  >([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [reactPickerFor, setReactPickerFor] = useState<string | null>(null);

  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  // ───── Load conversation + messages ─────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, msgRes] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId, { limit: 50 }),
      ]);
      setConversation(convRes.conversation);
      setMessages(msgRes.messages);
      // mark all as seen
      try {
        await markAllAsSeenREST(conversationId);
      } catch {}
    } catch {
      antMessage.error("Không thể tải cuộc trò chuyện");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ───── Join/leave conversation room ─────
  useEffect(() => {
    if (!socket) return;
    socket.emit("conversation:join", { conversationId });
    return () => {
      socket.emit("conversation:leave", { conversationId });
    };
  }, [socket, conversationId]);

  // ───── Subscribe to socket events ─────
  useEffect(() => {
    const offNew = onMessageNew((m) => {
      if (m.conversationId !== conversationId) return;
      setMessages((prev) => {
        // Replace clientTemp if sender is us
        if (m.senderId?.id === currentUserId) {
          const temp = prev.find(
            (x) =>
              x.clientTempId &&
              x.sending &&
              x.senderId?.id === currentUserId &&
              x.content === m.content,
          );
          if (temp) {
            return prev.map((x) => (x.id === temp.id ? m : x));
          }
        }
        if (prev.find((x) => x.id === m.id)) return prev;
        return [...prev, m];
      });
      // Mark seen if window is open & other sender
      if (m.senderId?.id !== currentUserId && socket) {
        socket.emit("message:seen", {
          messageId: m.id,
          conversationId,
        });
      }
    });
    const offUpd = onMessageUpdated((m) => {
      if (m.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    });
    const offReact = onMessageReacted((m) => {
      if (m.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    });
    const offSeen = onMessageSeen(({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((x) =>
          x.id === messageId && !x.seenBy.includes(userId)
            ? { ...x, seenBy: [...x.seenBy, userId] }
            : x,
        ),
      );
    });
    return () => {
      offNew();
      offUpd();
      offReact();
      offSeen();
    };
  }, [
    conversationId,
    currentUserId,
    onMessageNew,
    onMessageUpdated,
    onMessageReacted,
    onMessageSeen,
    socket,
  ]);

  useEffect(() => {
    if (!socket) return;

    const onSent = (data: {
      message: MessengerMessage;
      clientTempId?: string;
    }) => {
      if (!data.clientTempId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.clientTempId === data.clientTempId ? { ...data.message } : m,
        ),
      );
    };

    const onError = (data: {
      event?: string;
      message?: string;
      clientTempId?: string;
    }) => {
      if (data.event !== "message:send") return;
      if (!data.clientTempId) {
        antMessage.error(data.message || "Gửi tin nhắn thất bại");
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.clientTempId === data.clientTempId
            ? { ...m, sending: false, error: data.message || "Gửi thất bại" }
            : m,
        ),
      );
      antMessage.error(data.message || "Gửi tin nhắn thất bại");
    };

    socket.on("message:sent", onSent);
    socket.on("error", onError);
    return () => {
      socket.off("message:sent", onSent);
      socket.off("error", onError);
    };
  }, [socket]);

  // ───── Auto scroll ─────
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  // ───── Send message ─────
  const handleSend = () => {
    const text = input.trim();
    if (!text && pendingAttachments.length === 0) return;
    if (!socket || !socket.connected) {
      antMessage.error("Mất kết nối");
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessengerMessage = {
      id: tempId,
      clientTempId: tempId,
      conversationId,
      senderId: currentUserId ? { id: currentUserId, name: "Bạn" } : undefined,
      content: text,
      type: pendingAttachments[0]?.kind || "text",
      attachments: pendingAttachments,
      reactions: [],
      replyTo: replyTo || null,
      seenBy: currentUserId ? [currentUserId] : [],
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    socket.emit("message:send", {
      conversationId,
      content: text,
      attachments: pendingAttachments,
      replyTo: replyTo?.id,
      clientTempId: tempId,
    });
    setInput("");
    setPendingAttachments([]);
    setReplyTo(null);
    // Clear typing
    if (isTypingRef.current) {
      socket.emit("typing:stop", { conversationId });
      isTypingRef.current = false;
    }
  };

  // ───── Typing indicator ─────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!socket) return;
    if (!isTypingRef.current && e.target.value.length > 0) {
      socket.emit("typing:start", { conversationId });
      isTypingRef.current = true;
    }
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("typing:stop", { conversationId });
        isTypingRef.current = false;
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ───── Attach files ─────
  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploadingCount((c) => c + files.length);
    for (const file of files) {
      try {
        const res = await uploadAttachment(file);
        setPendingAttachments((prev) => [...prev, res.attachment]);
      } catch {
        antMessage.error(`Không tải lên được: ${file.name}`);
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  };

  // ───── Reactions ─────
  const handleReact = (messageId: string, emoji: string) => {
    if (!socket) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const mine = msg.reactions?.find(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );
    socket.emit("message:react", {
      messageId,
      conversationId,
      emoji,
      action: mine ? "remove" : "add",
    });
    setReactPickerFor(null);
  };

  // ───── Edit / Delete ─────
  const handleEdit = (msg: MessengerMessage) => {
    const next = window.prompt("Sửa tin nhắn:", msg.content);
    if (next == null || next.trim() === msg.content) return;
    socket?.emit("message:edit", {
      messageId: msg.id,
      conversationId,
      content: next.trim(),
    });
  };
  const handleDelete = (msg: MessengerMessage) => {
    if (!window.confirm("Xóa tin nhắn này?")) return;
    socket?.emit("message:delete", {
      messageId: msg.id,
      conversationId,
    });
  };

  // ───── Call actions ─────
  const startCall = (kind: "audio" | "video") => {
    if (!conversation || !socket) return;
    const targets = conversation.members
      .map((m) => m.id)
      .filter((id) => id !== currentUserId);
    const callId = `${conversationId}-${Date.now()}`;
    const event = new CustomEvent("messenger:startCall", {
      detail: {
        callId,
        conversationId,
        kind,
        targetUserIds: targets,
        peerName: title,
        peerAvatar: avatar,
      },
    });
    window.dispatchEvent(event);
  };

  // ───── Derived ─────
  const title = conversation
    ? getConversationTitle(conversation, currentUserId)
    : "...";
  const avatar = conversation
    ? getConversationAvatar(conversation, currentUserId)
    : undefined;
  const online = conversation
    ? isOwnerOnline(conversation, currentUserId, onlineUsers)
    : false;
  const typingIds = typingByConv[conversationId] || new Set<string>();
  const typingOthers = Array.from(typingIds).filter(
    (id) => id !== currentUserId,
  );
  const headerSub = online
    ? "Đang hoạt động"
    : conversation?.type === "group"
      ? `${conversation.members.length} thành viên`
      : " ";

  // Helper: last own message the other side has seen
  const lastSeenByOther = (() => {
    if (!conversation || conversation.type !== "direct") return null;
    const other = getOtherMember(conversation, currentUserId);
    if (!other) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId?.id === currentUserId && m.seenBy.includes(other.id)) {
        return { msg: m, other };
      }
    }
    return null;
  })();

  return (
    <div className={`chat-window ${minimized ? "minimized" : ""}`}>
      {/* Header */}
      <div
        className="cw-header"
        onClick={minimized ? onToggleMinimize : undefined}
      >
        <div
          className="cw-header-info"
          onClick={(e) => {
            e.stopPropagation();
            if (!embedded && conversation?.type === "direct") {
              // open fullscreen? no - keep small. double-click opens full.
            }
          }}
        >
          <div className="cw-header-avatar">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : (
              getInitial(title)
            )}
            {online && <span className="cw-online-dot" />}
          </div>
          <div className="cw-header-text">
            <div className="cw-header-title">{title}</div>
            <div className="cw-header-sub">
              {typingOthers.length > 0 ? "Đang nhập..." : headerSub}
            </div>
          </div>
        </div>
        {!minimized && (
          <div
            className="cw-header-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title="Gọi thoại">
              <button onClick={() => startCall("audio")}>
                <PhoneOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Gọi video">
              <button onClick={() => startCall("video")}>
                <VideoCameraOutlined />
              </button>
            </Tooltip>
            {!embedded && (
              <Tooltip title="Mở rộng">
                <button
                  onClick={() => navigate(`/messenger?c=${conversationId}`)}
                >
                  <ExpandOutlined />
                </button>
              </Tooltip>
            )}
            {!embedded && (
              <>
                <Tooltip title="Thu nhỏ">
                  <button onClick={onToggleMinimize}>
                    <MinusOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Đóng">
                  <button onClick={onClose}>
                    <CloseOutlined />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {!minimized && (
        <>
          <div className="cw-messages" ref={messagesRef}>
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#8a8d91",
                  fontSize: 13,
                }}
              >
                Đang tải...
              </div>
            ) : (
              messages.map((msg, idx) => {
                const prev = messages[idx - 1];
                const isOwn = msg.senderId?.id === currentUserId;
                const consecutive =
                  prev &&
                  prev.senderId?.id === msg.senderId?.id &&
                  new Date(msg.createdAt).getTime() -
                    new Date(prev.createdAt).getTime() <
                    2 * 60 * 1000;
                const isDeleted = !!msg.deletedAt;

                // Group reactions
                const reactionGroups: Record<
                  string,
                  { count: number; mine: boolean }
                > = {};
                (msg.reactions || []).forEach((r) => {
                  if (!reactionGroups[r.emoji])
                    reactionGroups[r.emoji] = { count: 0, mine: false };
                  reactionGroups[r.emoji].count++;
                  if (r.userId === currentUserId)
                    reactionGroups[r.emoji].mine = true;
                });

                return (
                  <div
                    key={msg.id}
                    className={`cw-msg ${isOwn ? "own" : ""} ${
                      consecutive ? "consecutive" : ""
                    }`}
                  >
                    {!isOwn && (
                      <div className="cw-msg-avatar">
                        {msg.senderId?.avatar ? (
                          <img src={msg.senderId.avatar} alt="" />
                        ) : (
                          getInitial(msg.senderId?.name)
                        )}
                      </div>
                    )}
                    <div className="cw-msg-body">
                      {msg.replyTo && !isDeleted && (
                        <div className="cw-reply-ref">
                          <strong>
                            Trả lời{" "}
                            {msg.replyTo.senderId?.id === currentUserId
                              ? "bạn"
                              : msg.replyTo.senderId?.name || ""}
                          </strong>
                          <span>
                            {msg.replyTo.deletedAt
                              ? "(Tin nhắn đã bị xóa)"
                              : msg.replyTo.content ||
                                (msg.replyTo.attachments?.[0]?.kind === "image"
                                  ? "[Ảnh]"
                                  : msg.replyTo.attachments?.[0]?.kind ===
                                      "video"
                                    ? "[Video]"
                                    : "[Tệp]")}
                          </span>
                        </div>
                      )}
                      {msg.type === "call" ? (
                        <div className="cw-bubble">{msg.content}</div>
                      ) : isDeleted ? (
                        <div className="cw-bubble deleted">
                          Tin nhắn đã được thu hồi
                        </div>
                      ) : (
                        <div className="cw-bubble">
                          {msg.content && <span>{msg.content}</span>}
                          {(msg.attachments || []).map((a, i) => (
                            <div className="cw-attach" key={i}>
                              {a.kind === "image" ? (
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img src={a.url} alt={a.name || ""} />
                                </a>
                              ) : a.kind === "video" ? (
                                <video src={a.url} controls />
                              ) : (
                                <a
                                  className="cw-file"
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileOutlined className="cw-file-icon" />
                                  <div className="cw-file-info">
                                    <span className="cw-file-name">
                                      {a.name || "Tệp đính kèm"}
                                    </span>
                                    <span className="cw-file-size">
                                      {formatFileSize(a.size)}
                                    </span>
                                  </div>
                                </a>
                              )}
                            </div>
                          ))}
                          {msg.editedAt && (
                            <span className="cw-edited">(đã sửa)</span>
                          )}
                        </div>
                      )}

                      {/* Reactions */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className="cw-reactions-bar">
                          {Object.entries(reactionGroups).map(([emoji, g]) => (
                            <button
                              key={emoji}
                              className={`cw-react-chip ${g.mine ? "mine" : ""}`}
                              onClick={() => handleReact(msg.id, emoji)}
                            >
                              <span>{emoji}</span>
                              {g.count > 1 && (
                                <span className="cw-react-count">
                                  {g.count}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Meta/time */}
                      {!consecutive && (
                        <div className="cw-msg-meta">
                          {formatMessageTime(msg.createdAt)}
                          {msg.sending ? " · Đang gửi..." : ""}
                        </div>
                      )}
                    </div>

                    {/* Actions on hover */}
                    {!isDeleted && (
                      <div className="cw-msg-actions">
                        <Tooltip title="Thả cảm xúc">
                          <button
                            onClick={() =>
                              setReactPickerFor(
                                reactPickerFor === msg.id ? null : msg.id,
                              )
                            }
                          >
                            <SmileOutlined />
                          </button>
                        </Tooltip>
                        <Tooltip title="Trả lời">
                          <button onClick={() => setReplyTo(msg)}>↩️</button>
                        </Tooltip>
                        {isOwn && (
                          <Dropdown
                            trigger={["click"]}
                            menu={{
                              items: [
                                {
                                  key: "edit",
                                  icon: <EditOutlined />,
                                  label: "Sửa",
                                  onClick: () => handleEdit(msg),
                                  disabled: msg.type !== "text" || !msg.content,
                                },
                                {
                                  key: "del",
                                  icon: <DeleteOutlined />,
                                  label: "Xóa",
                                  danger: true,
                                  onClick: () => handleDelete(msg),
                                },
                              ],
                            }}
                          >
                            <button>
                              <MoreOutlined />
                            </button>
                          </Dropdown>
                        )}
                        {reactPickerFor === msg.id && (
                          <div className="cw-emoji-picker">
                            {QUICK_EMOJIS.map((e) => (
                              <button
                                key={e}
                                onClick={() => handleReact(msg.id, e)}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {/* Seen indicator */}
            {lastSeenByOther && (
              <div className="cw-seen-indicator">
                {lastSeenByOther.other.avatar ? (
                  <img src={lastSeenByOther.other.avatar} alt="" />
                ) : (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "#1AA0B0",
                      color: "#fff",
                      fontSize: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getInitial(lastSeenByOther.other.name)}
                  </span>
                )}
                Đã xem
              </div>
            )}
            {typingOthers.length > 0 && (
              <div className="cw-typing-indicator">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="cw-input-bar">
            {replyTo && (
              <div className="cw-reply-preview">
                <strong>
                  Trả lời{" "}
                  {replyTo.senderId?.id === currentUserId
                    ? "chính bạn"
                    : replyTo.senderId?.name || ""}
                  :
                </strong>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {replyTo.content ||
                    (replyTo.attachments?.[0]?.kind === "image"
                      ? "[Ảnh]"
                      : "[Tệp]")}
                </span>
                <button
                  className="cw-reply-close"
                  onClick={() => setReplyTo(null)}
                >
                  <CloseOutlined />
                </button>
              </div>
            )}
            {(pendingAttachments.length > 0 || uploadingCount > 0) && (
              <div className="cw-attach-previews">
                {pendingAttachments.map((a, i) => (
                  <div className="attach-prev" key={i}>
                    {a.kind === "image" ? (
                      <img src={a.url} alt="" />
                    ) : a.kind === "video" ? (
                      <video src={a.url} muted />
                    ) : (
                      <span>{a.name?.slice(0, 8) || "Tệp"}</span>
                    )}
                    <button
                      className="attach-remove"
                      onClick={() =>
                        setPendingAttachments((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <div className="attach-prev" key={`up-${i}`}>
                    <span>...</span>
                  </div>
                ))}
              </div>
            )}

            <div className="cw-input-row">
              <div className="cw-input-actions">
                <Tooltip title="Đính kèm tệp">
                  <button
                    className="icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperClipOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Ảnh / Video">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*,video/*";
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <PictureOutlined />
                  </button>
                </Tooltip>
              </div>
              <textarea
                className="cw-textarea"
                placeholder="Aa"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              {input.trim() || pendingAttachments.length > 0 ? (
                <button
                  className="icon-btn"
                  onClick={handleSend}
                  disabled={uploadingCount > 0}
                >
                  <SendOutlined />
                </button>
              ) : (
                <Tooltip title="Gửi cảm xúc">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      if (!socket) return;
                      socket.emit("message:send", {
                        conversationId,
                        content: "👍",
                        clientTempId: `like-${Date.now()}`,
                      });
                    }}
                  >
                    <LikeOutlined />
                  </button>
                </Tooltip>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              multiple
              style={{ display: "none" }}
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.accept = "";
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
