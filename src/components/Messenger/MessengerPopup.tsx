import React, { useMemo, useState } from "react";
import { Input, Modal, Spin } from "antd";
import {
  EditOutlined,
  SearchOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useMessenger } from "../../contexts/MessengerContext";
import {
  createDirectConversation,
  searchUsers,
  type MessengerUser,
} from "../../services/messengerServices";
import MsgAvatar from "./Avatar";
import {
  formatTime,
  getConversationAvatar,
  getConversationTitle,
  isOwnerOnline,
  lastMessagePreview,
} from "./utils";

type Props = {
  onClose?: () => void;
};

const MessengerPopup: React.FC<Props> = ({ onClose }) => {
  const {
    conversations,
    currentUserId,
    onlineUsers,
    openChat,
    refreshConversations,
  } = useMessenger();
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = getConversationTitle(c, currentUserId).toLowerCase();
      return (
        title.includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q) ||
        false
      );
    });
  }, [search, conversations, currentUserId]);

  const handleOpen = (conversationId: string) => {
    openChat(conversationId);
    onClose?.();
  };

  return (
    <div className="messenger-popup">
      <div className="popup-header">
        <h3>Đoạn chat</h3>
        <div className="popup-header-actions">
          <button onClick={() => setNewChatOpen(true)} title="Tin nhắn mới">
            <EditOutlined />
          </button>
        </div>
      </div>

      <div className="popup-search">
        <Input
          placeholder="Tìm kiếm trên Messenger"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <div className="popup-list">
        {filtered.length === 0 ? (
          <div className="popup-empty">
            {search ? "Không tìm thấy" : "Chưa có cuộc trò chuyện nào"}
          </div>
        ) : (
          filtered.map((conv) => {
            const title = getConversationTitle(conv, currentUserId);
            const avatar = getConversationAvatar(conv, currentUserId);
            const online = isOwnerOnline(conv, currentUserId, onlineUsers);
            const unread = conv.unreadCount || 0;
            return (
              <div
                className="messenger-item"
                key={conv.id}
                onClick={() => handleOpen(conv.id)}
              >
                <MsgAvatar
                  name={title}
                  avatar={avatar}
                  online={online}
                  size={44}
                />
                <div className="item-body">
                  <div className="item-title">{title}</div>
                  <div
                    className={`item-preview ${unread > 0 ? "unread" : ""}`}
                  >
                    {lastMessagePreview(conv, currentUserId)}
                  </div>
                </div>
                <div className="item-meta">
                  <span className="item-time">
                    {conv.lastMessage?.createdAt
                      ? formatTime(conv.lastMessage.createdAt)
                      : formatTime(conv.updatedAt)}
                  </span>
                  {unread > 0 && (
                    <span className="item-unread">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="popup-footer">
        <Link to="/messenger">Xem tất cả trong Messenger</Link>
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onPicked={async (user) => {
          try {
            const res = await createDirectConversation(user.id);
            await refreshConversations();
            setNewChatOpen(false);
            openChat(res.conversation.id);
            onClose?.();
          } catch {}
        }}
      />
    </div>
  );
};

// ─────────── New Chat Modal ───────────
const NewChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onPicked: (user: MessengerUser) => void;
}> = ({ open, onClose, onPicked }) => {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let cancel = false;
    if (!open || !q.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsers(q.trim());
        if (!cancel) setUsers(res.users);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 300);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [q, open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <span>
          <UserAddOutlined /> Tin nhắn mới
        </span>
      }
      destroyOnClose
    >
      <Input
        placeholder="Tìm theo tên hoặc email"
        prefix={<SearchOutlined />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="new-chat-search-list">
        {loading && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin size="small" />
          </div>
        )}
        {!loading && q && users.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
            Không tìm thấy
          </div>
        )}
        {users.map((u) => (
          <div
            className="messenger-item"
            key={u.id}
            onClick={() => onPicked(u)}
          >
            <MsgAvatar name={u.name} avatar={u.avatar} size={40} showDot={false} />
            <div className="item-body">
              <div className="item-title">{u.name}</div>
              <div className="item-preview">{u.email}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default MessengerPopup;
