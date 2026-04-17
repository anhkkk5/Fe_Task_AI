import { useState } from "react";
import { List, Avatar, Button, Empty, Popconfirm } from "antd";
import { DeleteOutlined, UserOutlined } from "@ant-design/icons";
import type { Guest, Permission } from "./types";
import { PERMISSION_LABELS } from "./types";
import PermissionSelector from "./PermissionSelector";
import "./GuestList.scss";

interface GuestListProps {
  /**
   * List of guests to display
   */
  guests: Guest[];

  /**
   * Callback when remove button is clicked
   */
  onRemoveGuest: (guestId: string) => void;

  /**
   * Callback when permission is changed
   */
  onUpdatePermission: (guestId: string, permission: Permission) => void;

  /**
   * Read-only mode (disable actions)
   */
  readOnly?: boolean;
}

/**
 * GuestList Component
 *
 * Displays all added guests with their information and actions.
 * Features:
 * - Display guest avatar, name, email, permission
 * - Hover actions (edit, remove)
 * - Empty state message
 * - Permission selector for each guest
 * - Confirmation before removing guest
 *
 * @example
 * ```tsx
 * <GuestList
 *   guests={guests}
 *   onRemoveGuest={handleRemoveGuest}
 *   onUpdatePermission={handleUpdatePermission}
 *   readOnly={false}
 * />
 * ```
 */
function GuestList({
  guests,
  onRemoveGuest,
  onUpdatePermission,
  readOnly = false,
}: GuestListProps) {
  const [hoveredGuestId, setHoveredGuestId] = useState<string | null>(null);

  /**
   * Get guest ID (handle both _id and guestId fields)
   */
  const getGuestId = (guest: Guest): string => {
    return guest._id || guest.guestId || guest.email;
  };

  /**
   * Render guest item
   */
  const renderGuestItem = (guest: Guest) => {
    const guestId = getGuestId(guest);
    const displayName = guest.name || guest.email;
    const isHovered = hoveredGuestId === guestId;

    return (
      <div
        key={guestId}
        className="guest-item"
        onMouseEnter={() => setHoveredGuestId(guestId)}
        onMouseLeave={() => setHoveredGuestId(null)}
      >
        <div className="guest-content">
          <Avatar
            size={40}
            src={guest.avatar}
            icon={<UserOutlined />}
            className="guest-avatar"
          />
          <div className="guest-info">
            <div className="guest-name">{displayName}</div>
            <div className="guest-email">{guest.email}</div>
          </div>
        </div>

        <div className="guest-actions">
          {!readOnly && (
            <PermissionSelector
              guestId={guestId}
              currentPermission={guest.permission}
              onPermissionChange={(permission) =>
                onUpdatePermission(guestId, permission)
              }
              compact
            />
          )}

          {isHovered && !readOnly && (
            <Popconfirm
              title="Remove Guest"
              description="Are you sure you want to remove this guest?"
              onConfirm={() => onRemoveGuest(guestId)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="remove-button"
              />
            </Popconfirm>
          )}

          {readOnly && (
            <span className="permission-badge">
              {PERMISSION_LABELS[guest.permission]}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (guests.length === 0) {
    return (
      <div className="guest-list-wrapper">
        <div className="guest-list-header">
          <h3>Guests (0)</h3>
        </div>
        <Empty description="No guests added yet" style={{ marginTop: 20 }} />
      </div>
    );
  }

  return (
    <div className="guest-list-wrapper">
      <div className="guest-list-header">
        <h3>Guests ({guests.length})</h3>
      </div>
      <List
        dataSource={guests}
        renderItem={(guest) => (
          <List.Item className="guest-list-item">
            {renderGuestItem(guest)}
          </List.Item>
        )}
        className="guest-list"
      />
    </div>
  );
}

export default GuestList;
