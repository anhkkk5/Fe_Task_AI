import { Pagination as AntPagination } from "antd";
import "./Pagination.scss";

interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange: (page: number, pageSize?: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  className?: string;
}

function Pagination({
  current,
  total,
  pageSize = 20,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal = true,
  className = "",
}: PaginationProps) {
  const handleShowTotal = (total: number, range: [number, number]) => {
    return `${range[0]}-${range[1]} của ${total} kết quả`;
  };

  return (
    <div className={`pagination-wrapper ${className}`}>
      <AntPagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={onChange}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={pageSizeOptions}
        showTotal={showTotal ? handleShowTotal : undefined}
        className="custom-pagination"
      />
    </div>
  );
}

export default Pagination;
