import { useState, useCallback, useRef, useMemo } from "react";
import { Input, Alert, Avatar, Spin, Empty, List, Pagination } from "antd";
import { UserAddOutlined, SearchOutlined } from "@ant-design/icons";
import type { Guest, Contact } from "./types";
import "./ContactSearch.scss";

interface ContactSearchProps {
  /**
   * Callback when search is performed
   */
  onSearch: (term: string) => Promise<Contact[]>;

  /**
   * Callback when a contact is selected
   */
  onSelectContact: (contact: Contact) => void;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Error message
   */
  error?: string | null;

  /**
   * List of existing guests to prevent duplicates
   */
  existingGuests?: Guest[];

  /**
   * Debounce delay in milliseconds
   */
  debounceMs?: number;

  /**
   * Page size for pagination
   */
  pageSize?: number;
}

/**
 * ContactSearch Component
 *
 * Handles contact search input with debouncing and displays search results.
 * Features:
 * - Debounced search input (300ms default)
 * - Real-time search results display
 * - Duplicate prevention (gray out already-added contacts)
 * - Pagination for 50+ results
 * - Error display with retry option
 *
 * @example
 * ```tsx
 * <ContactSearch
 *   onSearch={handleSearch}
 *   onSelectContact={handleSelectContact}
 *   existingGuests={guests}
 *   isLoading={loading}
 *   error={error}
 * />
 * ```
 */
function ContactSearch({
  onSearch,
  onSelectContact,
  isLoading = false,
  error = null,
  existingGuests = [],
  debounceMs = 300,
  pageSize = 50,
}: ContactSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Get set of existing guest emails for quick lookup
   */
  const existingEmails = useMemo(
    () => new Set(existingGuests.map((g) => g.email.toLowerCase())),
    [existingGuests],
  );

  /**
   * Check if a contact is already added as a guest
   */
  const isDuplicate = useCallback(
    (contact: Contact) => existingEmails.has(contact.email.toLowerCase()),
    [existingEmails],
  );

  /**
   * Handle search with debouncing
   */
  const handleSearch = useCallback(
    async (term: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (!term.trim()) {
        setSearchResults([]);
        setCurrentPage(1);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await onSearch(term.trim());
          setSearchResults(results);
          setCurrentPage(1);
        } catch {
          setSearchResults([]);
        }
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  /**
   * Handle contact selection
   */
  const handleContactClick = (contact: Contact) => {
    if (!isDuplicate(contact)) {
      onSelectContact(contact);
      setSearchTerm("");
      setSearchResults([]);
      setCurrentPage(1);
    }
  };

  /**
   * Get paginated results
   */
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, currentPage, pageSize]);

  /**
   * Render contact item
   */
  const renderContactItem = (contact: Contact) => {
    const isDup = isDuplicate(contact);
    const displayName = contact.name || contact.email;

    return (
      <div
        key={contact.id}
        className={`contact-item ${isDup ? "duplicate" : ""}`}
        onClick={() => handleContactClick(contact)}
      >
        <Avatar
          size={40}
          src={contact.avatar}
          icon={<UserAddOutlined />}
          className="contact-avatar"
        />
        <div className="contact-info">
          <div className="contact-name">{displayName}</div>
          <div className="contact-email">{contact.email}</div>
        </div>
        {isDup && <span className="duplicate-badge">Already added</span>}
      </div>
    );
  };

  return (
    <div className="contact-search-wrapper">
      <div className="search-input-container">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Search contacts by name or email..."
          value={searchTerm}
          onChange={handleInputChange}
          allowClear
          size="large"
          className="contact-search-input"
          disabled={isLoading}
        />
        {isLoading && (
          <span className="search-loading">
            <Spin size="small" />
          </span>
        )}
      </div>

      {error && (
        <Alert
          message="Search Error"
          description={error}
          type="error"
          showIcon
          closable
          className="search-error"
        />
      )}

      {searchTerm && searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            Found {searchResults.length} contact
            {searchResults.length !== 1 ? "s" : ""}
          </div>

          <List
            dataSource={paginatedResults}
            renderItem={(contact) => (
              <List.Item className="contact-list-item">
                {renderContactItem(contact)}
              </List.Item>
            )}
            className="contact-list"
          />

          {searchResults.length > pageSize && (
            <div className="pagination-container">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={searchResults.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                size="small"
              />
            </div>
          )}
        </div>
      )}

      {searchTerm && searchResults.length === 0 && !isLoading && (
        <Empty
          description="No contacts found"
          className="empty-results"
          style={{ marginTop: 20 }}
        />
      )}
    </div>
  );
}

export default ContactSearch;
