/**
 * Guest Management Services
 *
 * Provides API calls for guest management functionality
 */

import { get, post, del, patch } from "../../utils/axios/request";
import type {
  Guest,
  Permission,
  SearchContactsResponse,
  AddGuestResponse,
  RemoveGuestResponse,
  UpdatePermissionResponse,
  GetEventGuestsResponse,
} from "../../components/GuestManager/types";

/**
 * Search contacts from Google Contacts API
 *
 * @param searchTerm - Search term to find contacts
 * @param limit - Maximum number of results (default: 50)
 * @param offset - Pagination offset (default: 0)
 * @returns Promise with search results
 */
export const searchContacts = async (
  searchTerm: string,
  limit: number = 50,
  offset: number = 0,
): Promise<SearchContactsResponse> => {
  return await get(
    `/guests/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`,
  );
};

/**
 * Add a guest to an event
 *
 * @param eventId - Event ID
 * @param email - Guest email
 * @param name - Guest name
 * @param avatar - Guest avatar URL (optional)
 * @param permission - Guest permission level (default: view_guest_list)
 * @returns Promise with added guest data
 */
export const addGuest = async (
  eventId: string,
  email: string,
  name: string,
  avatar?: string,
  permission: Permission = "view_guest_list",
): Promise<AddGuestResponse> => {
  return await post("/guests/add", {
    eventId,
    email,
    name,
    avatar,
    permission,
  });
};

/**
 * Remove a guest from an event
 *
 * @param guestId - Guest ID to remove
 * @returns Promise with removal confirmation
 */
export const removeGuest = async (
  guestId: string,
): Promise<RemoveGuestResponse> => {
  return await del(`/guests/${guestId}`);
};

/**
 * Update guest permission
 *
 * @param guestId - Guest ID
 * @param permission - New permission level
 * @returns Promise with updated permission
 */
export const updateGuestPermission = async (
  guestId: string,
  permission: Permission,
): Promise<UpdatePermissionResponse> => {
  return await patch(`/guests/${guestId}/permission`, { permission });
};

/**
 * Get all guests for an event
 *
 * @param eventId - Event ID
 * @returns Promise with list of guests
 */
export const getEventGuests = async (
  eventId: string,
): Promise<GetEventGuestsResponse> => {
  return await get(`/guests/events/${eventId}`);
};

/**
 * Get a specific guest by ID
 *
 * @param guestId - Guest ID
 * @returns Promise with guest data
 */
export const getGuestById = async (guestId: string): Promise<Guest> => {
  return await get(`/guests/${guestId}`);
};
