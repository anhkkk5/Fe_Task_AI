import { describe, it, expect, vi } from "vitest";
import {
  aiChat,
  aiTaskBreakdown,
} from "../aiServices";

// Mock axios request
vi.mock("../../utils/axios/request", () => ({
  post: vi.fn(),
}));

describe("AI Services", () => {
  it("should call aiChat with correct data", async () => {
    const { post } = await import("../../utils/axios/request");
    await aiChat("Hello AI", ["context1", "context2"]);
    expect(post).toHaveBeenCalledWith("/ai/chat", {
      message: "Hello AI",
      context: ["context1", "context2"],
    });
  });

  it("should call aiTaskBreakdown with taskId", async () => {
    const { post } = await import("../../utils/axios/request");
    await aiTaskBreakdown({ taskId: "123" });
    expect(post).toHaveBeenCalledWith("/ai/tasks/123/breakdown", {});
  });

  it("should call aiTaskBreakdown with title and description", async () => {
    const { post } = await import("../../utils/axios/request");
    await aiTaskBreakdown({
      title: "Test Task",
      description: "Test Description",
    });
    expect(post).toHaveBeenCalledWith("/ai/tasks/breakdown", {
      title: "Test Task",
      description: "Test Description",
    });
  });
});
