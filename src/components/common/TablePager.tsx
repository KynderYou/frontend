type TablePagerProps = {
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePager({
  page,
  pageSize,
  total,
  loading = false,
  onPageChange,
  className = 'mis-table-footer',
}: TablePagerProps) {
  if (total <= pageSize && !loading) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className={className}>
      <span>
        {loading
          ? 'Loading…'
          : total === 0
            ? '0 records'
            : `${start} to ${end} of ${total}`}
      </span>
      <div className="mis-pager">
        <button
          type="button"
          className="btn-pill-secondary"
          style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
          disabled={safePage <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn-pill-secondary"
          style={{ height: 32, fontSize: 12, padding: '6px 12px' }}
          disabled={safePage >= totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
