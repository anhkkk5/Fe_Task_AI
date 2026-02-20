import { useState, useCallback, useRef } from "react";
import { Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "./SearchInput.scss";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (keyword: string) => void;
  loading?: boolean;
  debounceMs?: number;
  allowClear?: boolean;
  size?: "small" | "middle" | "large";
  className?: string;
}

function SearchInput({
  placeholder = "Tìm kiếm...",
  onSearch,
  loading = false,
  debounceMs = 500,
  allowClear = true,
  size = "middle",
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (newValue: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onSearch(newValue.trim());
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    handleSearch(newValue);
  };

  const handlePressEnter = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onSearch(value.trim());
  };

  return (
    <div className={`search-input-wrapper ${className}`}>
      <Input
        prefix={<SearchOutlined className="search-icon" />}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onPressEnter={handlePressEnter}
        allowClear={allowClear}
        size={size}
        className="search-input"
      />
      {loading && (
        <span className="search-loading">
          <Spin size="small" />
        </span>
      )}
    </div>
  );
}

export default SearchInput;
