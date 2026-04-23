import { get, post, edit, del, postForm } from "../../utils/axios/request";

export type MessengerUser = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
};

export type MessengerAttachment = {
  kind: "image" | "video" | "file";
  url: string;
  publicId?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
};

export type MessengerReaction = {
  userId: string;
  emoji: string;
  createdAt: string;
};

export type CallMeta = {
  callId: string;
  kind: "audio" | "video";
  status: "started" | "ended" | "missed" | "rejected";
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
};

export type MessengerMessage = {
  id: string;
  conversationId: string;
  senderId?: MessengerUser;
  content: string;
  type: string;
  attachments?: MessengerAttachment[];
  reactions?: MessengerReaction[];
  replyTo?: MessengerMessage | null;
  editedAt?: string;
  deletedAt?: string;
  call?: CallMeta;
  seenBy: string[];
  createdAt: string;
  // client side flags
  clientTempId?: string;
  sending?: boolean;
  error?: string;
};

export type MessengerConversation = {
  id: string;
  type: "direct" | "group" | "task";
  members: MessengerUser[];
  admins?: string[];
  createdBy?: string;
  taskId?: { id: string; title: string };
  teamId?: { id: string; name: string; avatar?: string } | string;
  title?: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    type?: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
};

export const listConversations = (params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ conversations: MessengerConversation[] }> => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  const qs = q.toString();
  return get(`chat/conversations${qs ? `?${qs}` : ""}`);
};

export const getConversation = (
  conversationId: string,
): Promise<{ conversation: MessengerConversation }> =>
  get(`chat/conversations/${conversationId}`);

export const createDirectConversation = (
  otherUserId: string,
): Promise<{ conversation: MessengerConversation }> =>
  post(`chat/conversations/direct`, { userId: otherUserId });

export const getOrCreateTeamConversation = (
  teamId: string,
): Promise<{ conversation: MessengerConversation }> =>
  post(`chat/conversations/team`, { teamId });

export const listMessages = (
  conversationId: string,
  params?: { limit?: number; before?: string; after?: string },
): Promise<{ messages: MessengerMessage[] }> => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.before) q.set("before", params.before);
  if (params?.after) q.set("after", params.after);
  const qs = q.toString();
  return get(
    `chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
  );
};

export const sendMessageREST = (
  conversationId: string,
  data: {
    content?: string;
    type?: string;
    attachments?: MessengerAttachment[];
    replyTo?: string;
  },
): Promise<{ message: MessengerMessage }> =>
  post(`chat/conversations/${conversationId}/messages`, data);

export const markAllAsSeenREST = (conversationId: string) =>
  post(`chat/conversations/${conversationId}/seen`, {});

export const reactMessageREST = (
  messageId: string,
  emoji: string,
  action: "add" | "remove",
): Promise<{ message: MessengerMessage }> =>
  post(`chat/messages/${messageId}/react`, { emoji, action });

export const editMessageREST = (
  messageId: string,
  content: string,
): Promise<{ message: MessengerMessage }> =>
  edit(`chat/messages/${messageId}`, { content });

export const deleteMessageREST = (
  messageId: string,
): Promise<{ message: MessengerMessage }> => del(`chat/messages/${messageId}`);

export const uploadAttachment = (
  file: File,
): Promise<{ attachment: MessengerAttachment }> => {
  const form = new FormData();
  form.append("file", file);
  return postForm(`chat/uploads`, form);
};

export const searchUsers = (q: string): Promise<{ users: MessengerUser[] }> =>
  get(`chat/users/search?q=${encodeURIComponent(q)}`);

export const getOnlineUsers = (): Promise<{ onlineUsers: string[] }> =>
  get(`chat/presence/online`);
