import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GuestManager from "../GuestManager";
import * as guestServices from "../../../services/guestServices";

// Mock the axios request utilities
vi.mock("../../../utils/axios/request", () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  patch: vi.fn(),
}));

describe("GuestManager Component", () => {
  const mockEventId = "event123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render GuestManager component", () => {
    render(<GuestManager eventId={mockEventId} />);
    expect(screen.getByText("Add Guests")).toBeInTheDocument();
  });

  it("should load existing guests on mount", async () => {
    const mockGuests = [
      {
        _id: "guest1",
        eventId: mockEventId,
        email: "john@example.com",
        name: "John Doe",
        avatar: "https://example.com/avatar.jpg",
        permission: "view_guest_list" as const,
      },
    ];

    vi.spyOn(guestServices, "getEventGuests").mockResolvedValue({
      success: true,
      data: { guests: mockGuests },
    });

    render(<GuestManager eventId={mockEventId} />);

    await waitFor(() => {
      expect(screen.getByText("Guests (1)")).toBeInTheDocument();
    });
  });

  it("should display search input", () => {
    render(<GuestManager eventId={mockEventId} />);
    const searchInput = screen.getByPlaceholderText("Search contacts...");
    expect(searchInput).toBeInTheDocument();
  });

  it("should display empty state when no guests", async () => {
    vi.spyOn(guestServices, "getEventGuests").mockResolvedValue({
      success: true,
      data: { guests: [] },
    });

    render(<GuestManager eventId={mockEventId} />);

    await waitFor(() => {
      expect(screen.getByText("No guests added yet")).toBeInTheDocument();
    });
  });

  it("should handle read-only mode", () => {
    render(<GuestManager eventId={mockEventId} readOnly={true} />);
    const searchInput = screen.queryByPlaceholderText("Search contacts...");
    expect(searchInput).not.toBeInTheDocument();
  });

  it("should call onGuestAdded callback when guest is added", async () => {
    const onGuestAdded = vi.fn();
    const mockGuest = {
      _id: "guest1",
      eventId: mockEventId,
      email: "john@example.com",
      name: "John Doe",
      permission: "view_guest_list" as const,
    };

    vi.spyOn(guestServices, "getEventGuests").mockResolvedValue({
      success: true,
      data: { guests: [] },
    });

    vi.spyOn(guestServices, "addGuest").mockResolvedValue({
      success: true,
      data: mockGuest,
    });

    render(<GuestManager eventId={mockEventId} onGuestAdded={onGuestAdded} />);

    // Simulate adding a guest
    await waitFor(() => {
      expect(onGuestAdded).toHaveBeenCalledWith(mockGuest);
    });
  });
});
