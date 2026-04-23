import React, { useEffect, useState } from "react";
import { CommentOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useMessenger } from "../../contexts/MessengerContext";
import MessengerPopup from "./MessengerPopup";
import ChatWindow from "./ChatWindow";
import CallManager from "./CallManager";
import "./Messenger.scss";

const MessengerRoot: React.FC = () => {
  const { isLogin } = useSelector((state: any) => state.auth);
  const {
    conversations,
    openChats,
    closeChat,
    toggleMinimizeChat,
    openChat,
    refreshConversations,
  } = useMessenger();
  const [popupOpen, setPopupOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Global event: pages can dispatch to open/focus a conversation
  useEffect(() => {
    const handler = async (e: any) => {
      const convId = e.detail?.conversationId;
      if (!convId) return;
      await refreshConversations();
      if (location.pathname.startsWith("/messenger")) {
        navigate(`/messenger?c=${convId}`);
      } else {
        openChat(convId);
      }
    };
    window.addEventListener("messenger:openChat", handler);
    return () => window.removeEventListener("messenger:openChat", handler);
  }, [openChat, refreshConversations, navigate, location.pathname]);

  if (!isLogin) return null;
  // Hide launcher on full-screen messenger page (windows still shown via page itself)
  const onFullscreen = location.pathname.startsWith("/messenger");

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0,
  );

  return (
    <>
      {!onFullscreen && (
        <>
          <div className="messenger-launcher">
            {popupOpen && (
              <MessengerPopup onClose={() => setPopupOpen(false)} />
            )}
            <button
              className="messenger-launcher-btn"
              onClick={() => setPopupOpen((v) => !v)}
              title="Messenger"
            >
              <CommentOutlined />
              {totalUnread > 0 && (
                <span className="unread-badge">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
          </div>

          <div className="chat-windows-container">
            {openChats.map((c) => (
              <ChatWindow
                key={c.conversationId}
                conversationId={c.conversationId}
                minimized={c.minimized}
                onClose={() => closeChat(c.conversationId)}
                onToggleMinimize={() => toggleMinimizeChat(c.conversationId)}
              />
            ))}
          </div>
        </>
      )}

      <CallManager />
    </>
  );
};

export default MessengerRoot;
