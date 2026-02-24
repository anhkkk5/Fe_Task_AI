import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "../UserAvatar";

describe("UserAvatar", () => {
  it("should render with default props", () => {
    render(<UserAvatar />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("should render with src", () => {
    render(<UserAvatar src="https://example.com/avatar.jpg" name="Test User" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(img).toHaveAttribute("alt", "Test User");
  });

  it("should render with custom size", () => {
    render(<UserAvatar size={64} />);
    const img = screen.getByRole("img");
    expect(img).toHaveStyle({ width: "64px", height: "64px" });
  });

  it("should render with custom className", () => {
    render(<UserAvatar className="custom-avatar" />);
    const img = screen.getByRole("img");
    expect(img).toHaveClass("custom-avatar");
  });
});
