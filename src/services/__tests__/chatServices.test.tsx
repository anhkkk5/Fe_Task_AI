import { describe, it, expect, vi } from "vitest";
import {
  getChats,
  createChat,
  getChatById,
  updateChat,
  deleteChat,
  sendMessage,
  getMessages,
  markMessagesAsRead,
} from "../chatServices";

// Mock axios request
vi.mock("../../utils/axios/request", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

describe("Chat Services", () => {
  it("should call getChats with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getChats();
    expect(get).toHaveBeenCalledWith("/chats");
  });

  it("should call createChat with correct data", async () => {
    const { post } = await import("../../utils/axios/request");
    await createChat("New Chat");
    expect(post).toHaveBeenCalledWith("/chats", { title: "New Chat" });
  });

  it("should call getChatById with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getChatById("123");
    expect(get).toHaveBeenCalledWith("/chats/123");
  });

  it("should call updateChat with correct data", async () => {
    const { patch } = await import("../../utils/axios/request");
    await updateChat("123", "Updated Title");
    expect(patch).toHaveBeenCalledWith("/chats/123", { title: "Updated Title" });
  });

  it("should call deleteChat with correct URL", async () => {
    const { del } = await import("../../utils/axios/request");
    await deleteChat("123");
    expect(del).toHaveBeenCalledWith("/chats/123");
  });

  it("should call sendMessage with correct data", async () => {
    const { post } = await import("../../utils/axios/request");
    await sendMessage("123", "Hello");
    expect(post).toHaveBeenCalledWith("/chats/123/messages", { content: "Hello" });
  });

  it("should call getMessages with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getMessages("123");
    expect(get).toHaveBeenCalledWith("/chats/123/messages");
  });

  it("should call getMessages with query params", async () => {
    const { get } = await import("../../utils/axios/request");
    await getMessages("123", { page: 1, limit: 20 });
    expect(get).toHaveBeenCalledWith("/chats/123/messages?page=1&limit=20");
  });

  it("should call markMessagesAsRead with correct URL", async () => {
    const { patch } = await import("../../utils/axios/request");
    await markMessagesAsRead("123");
    expect(patch).toHaveBeenCalledWith("/chats/123/messages/read", {});
  });
});
