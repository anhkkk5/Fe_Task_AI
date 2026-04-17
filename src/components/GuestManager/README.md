# Guest Manager Components

Guest Manager is a comprehensive React component suite for managing event guests with Google Contacts integration. It provides search, add, remove, and permission management functionality.

## Components

### GuestManager (Container)

Main container component that orchestrates all guest management functionality.

**Props:**

```typescript
interface GuestManagerProps {
  eventId: string; // Event ID
  onGuestAdded?: (guest: Guest) => void; // Callback when guest is added
  onGuestRemoved?: (guestId: string) => void; // Callback when guest is removed
  readOnly?: boolean; // Read-only mode (default: false)
}
```

**Features:**

- Search and display Google Contacts
- Add/remove guests
- Manage guest permissions
- Load existing guests on mount
- Handle API errors with user-friendly messages

**Example:**

```tsx
import { GuestManager } from "@/components/GuestManager";

function EventForm() {
  const handleGuestAdded = (guest) => {
    console.log("Guest added:", guest);
  };

  return (
    <GuestManager
      eventId="event123"
      onGuestAdded={handleGuestAdded}
      readOnly={false}
    />
  );
}
```

### ContactSearch

Handles contact search input with debouncing and displays search results.

**Props:**

```typescript
interface ContactSearchProps {
  onSearch: (term: string) => Promise<Contact[]>; // Search callback
  onSelectContact: (contact: Contact) => void; // Selection callback
  isLoading?: boolean; // Loading state
  error?: string | null; // Error message
  existingGuests?: Guest[]; // Existing guests (for duplicate prevention)
  debounceMs?: number; // Debounce delay (default: 300ms)
  pageSize?: number; // Results per page (default: 50)
}
```

**Features:**

- Debounced search input (300ms default)
- Real-time search results display
- Duplicate prevention (gray out already-added contacts)
- Pagination for 50+ results
- Error display with retry option
- Loading state indicator

**Example:**

```tsx
import { ContactSearch } from "@/components/GuestManager";

function SearchContacts() {
  const handleSearch = async (term) => {
    const response = await fetch(`/api/guests/search?q=${term}`);
    return response.json();
  };

  return (
    <ContactSearch
      onSearch={handleSearch}
      onSelectContact={(contact) => console.log(contact)}
      existingGuests={[]}
    />
  );
}
```

### GuestList

Displays all added guests with their information and actions.

**Props:**

```typescript
interface GuestListProps {
  guests: Guest[]; // List of guests
  onRemoveGuest: (guestId: string) => void; // Remove callback
  onUpdatePermission: (guestId: string, permission: Permission) => void; // Update callback
  readOnly?: boolean; // Read-only mode
}
```

**Features:**

- Display guest avatar, name, email, permission
- Hover actions (edit, remove)
- Empty state message
- Permission selector for each guest
- Confirmation before removing guest
- Read-only mode support

**Example:**

```tsx
import { GuestList } from "@/components/GuestManager";

function GuestListView() {
  const guests = [
    {
      _id: "1",
      email: "john@example.com",
      name: "John Doe",
      avatar: "https://...",
      permission: "view_guest_list",
      eventId: "event123",
    },
  ];

  return (
    <GuestList
      guests={guests}
      onRemoveGuest={(id) => console.log("Remove:", id)}
      onUpdatePermission={(id, perm) => console.log("Update:", id, perm)}
    />
  );
}
```

### PermissionSelector

Dropdown/select component for managing guest permissions.

**Props:**

```typescript
interface PermissionSelectorProps {
  guestId?: string; // Guest ID
  currentPermission: Permission; // Current permission
  onPermissionChange: (permission: Permission) => void; // Change callback
  availablePermissions?: Permission[]; // Available permissions
  compact?: boolean; // Compact mode
  disabled?: boolean; // Disabled state
}
```

**Supported Permissions:**

- `edit_event` - Edit event
- `view_guest_list` - View guest list
- `invite_others` - Invite others

**Example:**

```tsx
import { PermissionSelector } from "@/components/GuestManager";

function PermissionControl() {
  return (
    <PermissionSelector
      currentPermission="view_guest_list"
      onPermissionChange={(perm) => console.log("New permission:", perm)}
      compact={true}
    />
  );
}
```

## Types

```typescript
// Guest added to an event
interface Guest {
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

// Contact from Google Contacts API
interface Contact {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumbers?: string[];
  addresses?: string[];
  organizations?: string[];
}

// Permission levels
type Permission = "edit_event" | "view_guest_list" | "invite_others";
```

## API Integration

The components expect the following API endpoints:

### Search Contacts

```
GET /api/guests/search?q=<term>&limit=50&offset=0
```

Response:

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "google_contact_id",
        "email": "john@example.com",
        "name": "John Doe",
        "avatar": "https://...",
        "phoneNumbers": ["123-456-7890"]
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### Add Guest

```
POST /api/guests/add
```

Request:

```json
{
  "eventId": "event_id",
  "email": "john@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "permission": "view_guest_list"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "guestId": "guest_id",
    "eventId": "event_id",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "permission": "view_guest_list",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Remove Guest

```
DELETE /api/guests/:guestId
```

Response:

```json
{
  "success": true,
  "message": "Guest removed successfully"
}
```

### Update Permission

```
PUT /api/guests/:guestId/permission
```

Request:

```json
{
  "permission": "edit_event"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "guestId": "guest_id",
    "permission": "edit_event",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

### Get Event Guests

```
GET /api/events/:eventId/guests
```

Response:

```json
{
  "success": true,
  "data": {
    "guests": [
      {
        "guestId": "guest_id",
        "email": "john@example.com",
        "name": "John Doe",
        "avatar": "https://...",
        "permission": "view_guest_list",
        "addedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

## Services

Guest services are available in `src/services/guestServices/`:

```typescript
import {
  searchContacts,
  addGuest,
  removeGuest,
  updateGuestPermission,
  getEventGuests,
  getGuestById,
} from "@/services/guestServices";

// Search contacts
const results = await searchContacts("john", 50, 0);

// Add guest
const guest = await addGuest(
  "event123",
  "john@example.com",
  "John Doe",
  "https://...",
  "view_guest_list",
);

// Remove guest
await removeGuest("guest123");

// Update permission
await updateGuestPermission("guest123", "edit_event");

// Get event guests
const guests = await getEventGuests("event123");

// Get specific guest
const guest = await getGuestById("guest123");
```

## Styling

Components use SCSS for styling with the following structure:

- `GuestManager.scss` - Main container styles
- `ContactSearch.scss` - Search input and results styles
- `GuestList.scss` - Guest list and items styles
- `PermissionSelector.scss` - Permission dropdown styles

All components use Ant Design components and follow the project's design system.

## Error Handling

Components handle the following error scenarios:

- **Search Errors**: Display error message with retry option
- **Add Guest Errors**: Show error alert (duplicate, invalid email, etc.)
- **Remove Guest Errors**: Show error alert with confirmation
- **Permission Update Errors**: Show error alert
- **Load Guests Errors**: Show error alert with retry option

## Performance Considerations

- **Debouncing**: Search requests are debounced by 300ms to reduce API calls
- **Pagination**: Results are paginated at 50 items per page
- **Memoization**: Components use `useMemo` and `useCallback` for optimization
- **Lazy Loading**: Avatars are loaded on demand

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation is supported
- Color contrast meets WCAG standards
- Error messages are announced to screen readers

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 19+
- Ant Design 6+
- Axios 1.13+
- TypeScript 5.9+

## License

MIT
