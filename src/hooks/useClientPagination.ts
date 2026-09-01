import { useEffect, useMemo, useState } from 'react';

export function useClientPagination<T>(items: T[], pageSize: number, resetToken?: string | number) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetToken, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    total,
    pageSize,
  };
}
