import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { message as antMessage } from "antd";
import { getAccessToken } from "../utils/axios/request";
import {
  listConversations,
  type MessengerConversation,
  type MessengerMessage,
} from "../services/messengerServices";

// ───────────────────── Types ─────────────────────
export type OpenChatWindow = {
  conversationId: string;
  minimized?: boolean;
};

type MessengerContextValue = {
  socket: Socket | null;
  connected: boolean;
  currentUserId: string | null;
  onlineUsers: Set<string>;
  typingByConv: Record<string, Set<string>>; // convId -> set of userIds
  conversations: MessengerConversation[];
  refreshConversations: () => Promise<void>;
  // floating chat windows
  openChats: OpenChatWindow[];
  openChat: (conversationId: string) => void;
  closeChat: (conversationId: string) => void;
  toggleMinimizeChat: (conversationId: string) => void;
  // last message events subscription utility
  onMessageNew: (cb: (msg: MessengerMessage) => void) => () => void;
  onMessageUpdated: (cb: (msg: MessengerMessage) => void) => () => void;
  onMessageReacted: (cb: (msg: MessengerMessage) => void) => () => void;
  onMessageSeen: (
    cb: (data: { messageId: string; userId: string }) => void,
  ) => () => void;
  onTyping: (
    cb: (data: {
      conversationId: string;
      userId: string;
      typing: boolean;
    }) => void,
  ) => () => void;
};

const MessengerContext = createContext<MessengerContextValue | null>(null);

export const useMessenger = (): MessengerContextValue => {
  const ctx = useContext(MessengerContext);
  if (!ctx)
    throw new Error("useMessenger must be used inside MessengerProvider");
  return ctx;
};

// helper to strip trailing slash
const getSocketURL = () => {
  const base = (
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3002"
  )
    .toString()
    .trim();
  return base.replace(/\/$/, "");
};

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLogin } = useSelector((state: any) => state.auth);
  const currentUserId = user?.id || user?._id || null;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingByConv, setTypingByConv] = useState<Record<string, Set<string>>>(
    {},
  );
  const [conversations, setConversations] = useState<MessengerConversation[]>(
    [],
  );
  const [openChats, setOpenChats] = useState<OpenChatWindow[]>([]);
  // External subscribers
  const subsNew = useRef<Set<(m: MessengerMessage) => void>>(new Set());
  const subsUpdated = useRef<Set<(m: MessengerMessage) => void>>(new Set());
  const subsReacted = useRef<Set<(m: MessengerMessage) => void>>(new Set());
  const subsSeen = useRef<
    Set<(d: { messageId: string; userId: string }) => void>
  >(new Set());
  const subsTyping = useRef<
    Set<
      (d: { conversationId: string; userId: string; typing: boolean }) => void
    >
  >(new Set());

  const refreshConversations = useCallback(async () => {
    try {
      const res = await listConversations({ limit: 50 });
      setConversations(res.conversations || []);
    } catch {
      // silent
    }
  }, []);

  // ───── socket lifecycle ─────
  useEffect(() => {
    if (!isLogin || !currentUserId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    const socket = io(getSocketURL(), {
      withCredentials: true,
      auth: { token: token || undefined },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      refreshConversations();
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    socket.on("connect_error", () => {
      setConnected(false);
      antMessage.error("Kết nối chat realtime thất bại");
    });

    socket.on("presence:snapshot", (data: { online: string[] }) => {
      setOnlineUsers(new Set(data.online || []));
    });
    socket.on("user:online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });
    socket.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("message:new", ({ message }: { message: MessengerMessage }) => {
      subsNew.current.forEach((cb) => cb(message));
    });
    socket.on(
      "message:updated",
      ({ message }: { message: MessengerMessage }) => {
        subsUpdated.current.forEach((cb) => cb(message));
      },
    );
    socket.on(
      "message:reacted",
      ({ message }: { message: MessengerMessage }) => {
        subsReacted.current.forEach((cb) => cb(message));
      },
    );
    socket.on("message:seen", (data: { messageId: string; userId: string }) => {
      subsSeen.current.forEach((cb) => cb(data));
    });
    socket.on(
      "typing:update",
      (data: { conversationId: string; userId: string; typing: boolean }) => {
        setTypingByConv((prev) => {
          const next = { ...prev };
          const cur = new Set(next[data.conversationId] || []);
          if (data.typing) cur.add(data.userId);
          else cur.delete(data.userId);
          next[data.conversationId] = cur;
          return next;
        });
        subsTyping.current.forEach((cb) => cb(data));
      },
    );

    socket.on(
      "conversation:updated",
      (data: {
        conversationId: string;
        lastMessage: MessengerConversation["lastMessage"];
      }) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === data.conversationId);
          if (idx === -1) {
            // new conversation - refetch
            refreshConversations();
            return prev;
          }
          const updated = {
            ...prev[idx],
            lastMessage: data.lastMessage,
            updatedAt: new Date().toISOString(),
            unreadCount:
              data.lastMessage?.senderId === currentUserId
                ? prev[idx].unreadCount
                : (prev[idx].unreadCount || 0) + 1,
          };
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        });
      },
    );

    // presence heartbeat
    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("presence:ping");
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isLogin, currentUserId, refreshConversations]);

  // Initial load of conversations
  useEffect(() => {
    if (isLogin) refreshConversations();
  }, [isLogin, refreshConversations]);

  // window management
  const openChat = useCallback((conversationId: string) => {
    setOpenChats((prev) => {
      const existing = prev.find((c) => c.conversationId === conversationId);
      if (existing) {
        return prev.map((c) =>
          c.conversationId === conversationId ? { ...c, minimized: false } : c,
        );
      }
      // Limit to 3 open chats (fb-like)
      const next = [
        { conversationId, minimized: false },
        ...prev.filter((c) => c.conversationId !== conversationId),
      ].slice(0, 3);
      return next;
    });
  }, []);
  const closeChat = useCallback((conversationId: string) => {
    setOpenChats((prev) =>
      prev.filter((c) => c.conversationId !== conversationId),
    );
  }, []);
  const toggleMinimizeChat = useCallback((conversationId: string) => {
    setOpenChats((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, minimized: !c.minimized }
          : c,
      ),
    );
  }, []);

  // subscription helpers
  const onMessageNew = useCallback((cb: (m: MessengerMessage) => void) => {
    subsNew.current.add(cb);
    return () => subsNew.current.delete(cb);
  }, []);
  const onMessageUpdated = useCallback((cb: (m: MessengerMessage) => void) => {
    subsUpdated.current.add(cb);
    return () => subsUpdated.current.delete(cb);
  }, []);
  const onMessageReacted = useCallback((cb: (m: MessengerMessage) => void) => {
    subsReacted.current.add(cb);
    return () => subsReacted.current.delete(cb);
  }, []);
  const onMessageSeen = useCallback(
    (cb: (d: { messageId: string; userId: string }) => void) => {
      subsSeen.current.add(cb);
      return () => subsSeen.current.delete(cb);
    },
    [],
  );
  const onTyping = useCallback(
    (
      cb: (d: {
        conversationId: string;
        userId: string;
        typing: boolean;
      }) => void,
    ) => {
      subsTyping.current.add(cb);
      return () => subsTyping.current.delete(cb);
    },
    [],
  );

  const value = useMemo<MessengerContextValue>(
    () => ({
      socket: socketRef.current,
      connected,
      currentUserId,
      onlineUsers,
      typingByConv,
      conversations,
      refreshConversations,
      openChats,
      openChat,
      closeChat,
      toggleMinimizeChat,
      onMessageNew,
      onMessageUpdated,
      onMessageReacted,
      onMessageSeen,
      onTyping,
    }),
    [
      connected,
      currentUserId,
      onlineUsers,
      typingByConv,
      conversations,
      refreshConversations,
      openChats,
      openChat,
      closeChat,
      toggleMinimizeChat,
      onMessageNew,
      onMessageUpdated,
      onMessageReacted,
      onMessageSeen,
      onTyping,
    ],
  );

  return (
    <MessengerContext.Provider value={value}>
      {children}
    </MessengerContext.Provider>
  );
};
