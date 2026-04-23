import type {
  MessengerConversation,
  MessengerUser,
} from "../../services/messengerServices";

export const getInitial = (name?: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] || parts[0] || "?";
  return last.charAt(0).toUpperCase();
};

export const getOtherMember = (
  conv: MessengerConversation,
  currentUserId: string | null,
): MessengerUser | null => {
  if (conv.type !== "direct" || !currentUserId) return null;
  return conv.members.find((m) => m.id !== currentUserId) || null;
};

export const getConversationTitle = (
  conv: MessengerConversation,
  currentUserId: string | null,
): string => {
  if (conv.title) return conv.title;
  if (conv.type === "direct") {
    const other = getOtherMember(conv, currentUserId);
    return other?.name || "Người dùng";
  }
  if (conv.type === "group") {
    if (typeof conv.teamId === "object" && conv.teamId?.name)
      return conv.teamId.name;
    return (
      conv.members
        .filter((m) => m.id !== currentUserId)
        .slice(0, 3)
        .map((m) => m.name.split(" ").pop())
        .join(", ") || "Nhóm"
    );
  }
  return conv.taskId?.title || "Cuộc trò chuyện";
};

export const getConversationAvatar = (
  conv: MessengerConversation,
  currentUserId: string | null,
): string | undefined => {
  if (conv.avatar) return conv.avatar;
  if (conv.type === "direct") {
    const other = getOtherMember(conv, currentUserId);
    return other?.avatar;
  }
  if (conv.type === "group" && typeof conv.teamId === "object") {
    return conv.teamId?.avatar;
  }
  return undefined;
};

export const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ngày`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatMessageTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const isOwnerOnline = (
  conv: MessengerConversation,
  currentUserId: string | null,
  online: Set<string>,
): boolean => {
  if (conv.type !== "direct") return false;
  const other = getOtherMember(conv, currentUserId);
  return !!other && online.has(other.id);
};

export const lastMessagePreview = (
  conv: MessengerConversation,
  currentUserId: string | null,
): string => {
  if (!conv.lastMessage) return "Bắt đầu trò chuyện";
  const prefix =
    conv.lastMessage.senderId === currentUserId ? "Bạn: " : "";
  const type = conv.lastMessage.type || "text";
  if (type === "image") return `${prefix}[Ảnh]`;
  if (type === "video") return `${prefix}[Video]`;
  if (type === "file") return `${prefix}[Tệp]`;
  if (type === "call") return `${prefix}${conv.lastMessage.content}`;
  return `${prefix}${conv.lastMessage.content || ""}`;
};
