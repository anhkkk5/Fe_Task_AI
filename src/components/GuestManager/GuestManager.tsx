import { useState, useEffect, useCallback } from "react";
import { Alert, Spin, Input, Button, Collapse, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type {
  Contact,
  Guest,
  Permission,
  SearchContactsResponse,
  AddGuestResponse,
  RemoveGuestResponse,
  UpdatePermissionResponse,
  GetEventGuestsResponse,
} from "./types";
import GuestList from "./GuestList";
import { get, post, del, patch } from "../../utils/axios/request";
import "./GuestManager.scss";

interface GuestManagerProps {
  eventId: string;
  onGuestAdded?: (guest: Guest) => void;
  onGuestRemoved?: (guestId: string) => void;
  readOnly?: boolean;
}

function GuestManager({
  eventId,
  onGuestAdded,
  onGuestRemoved,
  readOnly = false,
}: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuests, setIsLoadingGuests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const loadExistingGuests = useCallback(async () => {
    try {
      setIsLoadingGuests(true);
      setError(null);

      if (eventId.startsWith("temp_")) {
        setIsLoadingGuests(false);
        return;
      }

      const response = await get<GetEventGuestsResponse>(
        `/guests/events/${eventId}`,
      );

      if (response.success && response.data?.guests) {
        setGuests(response.data.guests);
      } else {
        setError(response.error || "Failed to load guests");
      }
    } catch {
      setError("Failed to load guests. Please try again.");
    } finally {
      setIsLoadingGuests(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId && !eventId.startsWith("temp_")) {
      loadExistingGuests();
    } else {
      setIsLoadingGuests(false);
    }
  }, [eventId, loadExistingGuests]);

  const handleAddGuestByEmail = useCallback(async () => {
    if (!emailInput.trim()) {
      setError("Please enter an email");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Search for contact first
      const response = await get<SearchContactsResponse>(
        `/guests/search?q=${encodeURIComponent(emailInput.trim())}&limit=1&offset=0`,
      );

      let contact: Contact | null = null;
      if (
        response.success &&
        response.data?.contacts &&
        response.data.contacts.length > 0
      ) {
        contact = response.data.contacts[0];
      }

      // If no contact found, create placeholder
      if (!contact) {
        contact = {
          id: `email_${emailInput.trim()}`,
          email: emailInput.trim().toLowerCase(),
          name: emailInput.trim().split("@")[0],
          avatar: undefined,
        };
      }

      // Add guest
      if (eventId.startsWith("temp_")) {
        const newGuest: Guest = {
          _id: `temp_${Date.now()}`,
          guestId: `temp_${Date.now()}`,
          eventId: eventId as any,
          email: contact.email,
          name: contact.name,
          avatar: contact.avatar,
          permission: "view_guest_list",
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        setGuests((prev) => [...prev, newGuest]);
        onGuestAdded?.(newGuest);
      } else {
        const addResponse = await post<AddGuestResponse>("/guests/add", {
          eventId,
          email: contact.email,
          name: contact.name,
          avatar: contact.avatar,
          permission: "view_guest_list" as Permission,
        });

        if (addResponse.success && addResponse.data) {
          const newGuest = addResponse.data;
          setGuests((prev) => [...prev, newGuest]);
          onGuestAdded?.(newGuest);
        } else {
          setError(addResponse.error || "Failed to add guest");
        }
      }

      setEmailInput("");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to add guest";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [emailInput, eventId, onGuestAdded]);

  const handleRemoveGuest = useCallback(
    async (guestId: string) => {
      try {
        setError(null);
        setIsLoading(true);

        if (guestId.startsWith("temp_")) {
          setGuests((prev) =>
            prev.filter((g) => (g._id || g.guestId) !== guestId),
          );
          onGuestRemoved?.(guestId);
          setIsLoading(false);
          return;
        }

        const response = await del<RemoveGuestResponse>(`/guests/${guestId}`);

        if (response.success) {
          setGuests((prev) =>
            prev.filter((g) => (g._id || g.guestId) !== guestId),
          );
          onGuestRemoved?.(guestId);
        } else {
          setError(response.error || "Failed to remove guest");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to remove guest";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [onGuestRemoved],
  );

  const handleUpdatePermission = useCallback(
    async (guestId: string, permission: Permission) => {
      try {
        setError(null);
        setIsLoading(true);

        if (guestId.startsWith("temp_")) {
          setGuests((prev) =>
            prev.map((g) =>
              (g._id || g.guestId) === guestId ? { ...g, permission } : g,
            ),
          );
          setIsLoading(false);
          return;
        }

        const response = await patch<UpdatePermissionResponse>(
          `/guests/${guestId}/permission`,
          { permission },
        );

        if (response.success) {
          setGuests((prev) =>
            prev.map((g) =>
              (g._id || g.guestId) === guestId ? { ...g, permission } : g,
            ),
          );
        } else {
          setError(response.error || "Failed to update permission");
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update permission";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  if (isLoadingGuests) {
    return (
      <div className="guest-manager-wrapper loading">
        <Spin tip="Loading guests..." />
      </div>
    );
  }

  const shouldShowCollapse = guests.length > 5;

  const guestListContent = (
    <div className="guests-section">
      <GuestList
        guests={guests}
        onRemoveGuest={handleRemoveGuest}
        onUpdatePermission={handleUpdatePermission}
        readOnly={readOnly}
      />
    </div>
  );

  return (
    <div className="guest-manager-wrapper">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {!readOnly && (
        <div className="search-section" style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Enter email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onPressEnter={handleAddGuestByEmail}
              disabled={isLoading}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddGuestByEmail}
              loading={isLoading}
            >
              Add
            </Button>
          </Space.Compact>
        </div>
      )}

      {shouldShowCollapse ? (
        <Collapse
          items={[
            {
              key: "guests",
              label: `Guests (${guests.length})`,
              children: guestListContent,
            },
          ]}
          defaultActiveKey={isExpanded ? ["guests"] : []}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      ) : (
        <>
          <h3 style={{ marginBottom: 16 }}>Guests ({guests.length})</h3>
          {guestListContent}
        </>
      )}
    </div>
  );
}

export default GuestManager;
