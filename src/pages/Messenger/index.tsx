import React, { useEffect, useMemo, useState } from "react";
import { Input } from "antd";
import {
  EditOutlined,
  MessageOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { useMessenger } from "../../contexts/MessengerContext";
import ChatWindow from "../../components/Messenger/ChatWindow";
import MsgAvatar from "../../components/Messenger/Avatar";
import {
  formatTime,
  getConversationAvatar,
  getConversationTitle,
  isOwnerOnline,
  lastMessagePreview,
} from "../../components/Messenger/utils";
import "../../components/Messenger/Messenger.scss";

const MessengerPage: React.FC = () => {
  const { conversations, currentUserId, onlineUsers } = useMessenger();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("c");
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialId) setActiveId(initialId);
  }, [initialId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      getConversationTitle(c, currentUserId).toLowerCase().includes(q),
    );
  }, [search, conversations, currentUserId]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setSearchParams({ c: id });
  };

  return (
    <div className="messenger-fullscreen">
      <aside className="mf-sidebar">
        <div className="mf-sidebar-header">
          <h2>Đoạn chat</h2>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "#f0f2f5",
              cursor: "pointer",
              color: "#1AA0B0",
            }}
            title="Tin nhắn mới"
          >
            <EditOutlined />
          </button>
        </div>
        <div className="mf-sidebar-search">
          <Input
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
        <div className="mf-sidebar-list">
          {filtered.length === 0 ? (
            <div className="popup-empty">Chưa có cuộc trò chuyện nào</div>
          ) : (
            filtered.map((conv) => {
              const title = getConversationTitle(conv, currentUserId);
              const avatar = getConversationAvatar(conv, currentUserId);
              const online = isOwnerOnline(conv, currentUserId, onlineUsers);
              const unread = conv.unreadCount || 0;
              return (
                <div
                  key={conv.id}
                  className={`messenger-item ${activeId === conv.id ? "active" : ""}`}
                  onClick={() => handleSelect(conv.id)}
                >
                  <MsgAvatar name={title} avatar={avatar} online={online} />
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
      </aside>

      <section className="mf-main">
        {activeId ? (
          <div className="mf-chat">
            <ChatWindow key={activeId} conversationId={activeId} embedded />
          </div>
        ) : (
          <div className="mf-empty">
            <MessageOutlined />
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Trò chuyện với bạn bè, đồng đội và nhóm của bạn</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MessengerPage;
