import { Select } from "antd";
import type { Permission } from "./types";
import { PERMISSION_LABELS, AVAILABLE_PERMISSIONS } from "./types";
import "./PermissionSelector.scss";

interface PermissionSelectorProps {
  /**
   * Guest ID
   */
  guestId?: string;

  /**
   * Current permission
   */
  currentPermission: Permission;

  /**
   * Callback when permission changes
   */
  onPermissionChange: (permission: Permission) => void;

  /**
   * Available permissions to choose from
   */
  availablePermissions?: Permission[];

  /**
   * Compact mode (smaller size)
   */
  compact?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * PermissionSelector Component
 *
 * Dropdown/select component for managing guest permissions.
 * Features:
 * - Display all available permissions
 * - Show current permission as selected value
 * - User-friendly permission labels
 * - Callback on permission change
 *
 * @example
 * ```tsx
 * <PermissionSelector
 *   guestId="guest123"
 *   currentPermission="view_guest_list"
 *   onPermissionChange={handlePermissionChange}
 * />
 * ```
 */
function PermissionSelector({
  currentPermission,
  onPermissionChange,
  availablePermissions = AVAILABLE_PERMISSIONS,
  compact = false,
  disabled = false,
}: PermissionSelectorProps) {
  /**
   * Handle permission change
   */
  const handleChange = (value: Permission) => {
    onPermissionChange(value);
  };

  /**
   * Create options for select
   */
  const options = availablePermissions.map((permission) => ({
    label: PERMISSION_LABELS[permission],
    value: permission,
  }));

  return (
    <div className={`permission-selector ${compact ? "compact" : ""}`}>
      <Select
        value={currentPermission}
        onChange={handleChange}
        options={options}
        disabled={disabled}
        size={compact ? "small" : "middle"}
        className="permission-select"
        style={{ minWidth: compact ? 120 : 150 }}
      />
    </div>
  );
}

export default PermissionSelector;
