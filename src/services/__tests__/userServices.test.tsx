import { describe, it, expect, vi } from "vitest";
import {
  getUsers,
  getUserById,
  updateProfile,
  changePassword,
  deleteUser,
} from "../userServices";

// Mock axios request
vi.mock("../../utils/axios/request", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

describe("User Services", () => {
  it("should call getUsers with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getUsers();
    expect(get).toHaveBeenCalledWith("/users");
  });

  it("should call getUsers with query params", async () => {
    const { get } = await import("../../utils/axios/request");
    await getUsers({ page: 1, limit: 10 });
    expect(get).toHaveBeenCalledWith("/users?page=1&limit=10");
  });

  it("should call getUserById with correct URL", async () => {
    const { get } = await import("../../utils/axios/request");
    await getUserById("123");
    expect(get).toHaveBeenCalledWith("/users/123");
  });

  it("should call updateProfile with correct data", async () => {
    const { patch } = await import("../../utils/axios/request");
    const data = { name: "Test User", avatar: "http://example.com/avatar.jpg" };
    await updateProfile(data);
    expect(patch).toHaveBeenCalledWith("/users/profile", data);
  });

  it("should call changePassword with correct data", async () => {
    const { patch } = await import("../../utils/axios/request");
    const data = { currentPassword: "old123", newPassword: "new123" };
    await changePassword(data);
    expect(patch).toHaveBeenCalledWith("/users/change-password", data);
  });

  it("should call deleteUser with correct URL", async () => {
    const { del } = await import("../../utils/axios/request");
    await deleteUser("123");
    expect(del).toHaveBeenCalledWith("/users/123");
  });
});
