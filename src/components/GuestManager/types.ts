/**
 * Type definitions for Guest Manager components
 */

/**
 * Permission levels for guests
 */
export type Permission = "edit_event" | "view_guest_list" | "invite_others";

/**
 * Contact from Google Contacts API
 */
export interface Contact {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumbers?: string[];
  addresses?: string[];
  organizations?: string[];
}

/**
 * Guest added to an event
 */
export interface Guest {
  _id?: string;
  guestId?: string;
  eventId: string;
  email: string;
  name: string;
  avatar?: string;
  permission: Permission;
  status?: "pending" | "accepted" | "declined";
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API response for search contacts
 */
export interface SearchContactsResponse {
  success: boolean;
  data?: {
    contacts: Contact[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

/**
 * API response for add guest
 */
export interface AddGuestResponse {
  success: boolean;
  data?: Guest;
  error?: string;
}

/**
 * API response for remove guest
 */
export interface RemoveGuestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * API response for update permission
 */
export interface UpdatePermissionResponse {
  success: boolean;
  data?: {
    guestId: string;
    permission: Permission;
    updatedAt: string;
  };
  error?: string;
}

/**
 * API response for get event guests
 */
export interface GetEventGuestsResponse {
  success: boolean;
  data?: {
    guests: Guest[];
  };
  error?: string;
}

/**
 * Permission labels for display
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  edit_event: "Edit event",
  view_guest_list: "View guest list",
  invite_others: "Invite others",
};

/**
 * Available permissions
 */
export const AVAILABLE_PERMISSIONS: Permission[] = [
  "edit_event",
  "view_guest_list",
  "invite_others",
];
