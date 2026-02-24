import { get, post, patch, del } from "../../utils/axios/request";

export interface Chat {
  _id?: string;
  id?: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  content: string;
  sender: string;
  createdAt: string;
  isRead?: boolean;
}

// Get chats
export const getChats = async () => {
  return await get("/chats");
};

// Create chat
export const createChat = async (title: string) => {
  return await post("/chats", { title });
};

// Get chat by ID
export const getChatById = async (id: string) => {
  return await get(`/chats/${id}`);
};

// Update chat
export const updateChat = async (id: string, title: string) => {
  return await patch(`/chats/${id}`, { title });
};

// Delete chat
export const deleteChat = async (id: string) => {
  return await del(`/chats/${id}`);
};

// Send message
export const sendMessage = async (chatId: string, content: string) => {
  return await post(`/chats/${chatId}/messages`, { content });
};

// Get messages
export const getMessages = async (chatId: string, params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/chats/${chatId}/messages?${queryString}` : `/chats/${chatId}/messages`;
  return await get(url);
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string) => {
  return await patch(`/chats/${chatId}/messages/read`, {});
};
