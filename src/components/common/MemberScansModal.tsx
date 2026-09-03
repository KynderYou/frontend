import { useEffect, type ReactNode } from 'react';
import { useClientPagination } from '../../hooks/useClientPagination';
import { TablePager } from './TablePager';
const SCAN_PAGE_SIZE = 10;

export type MemberScanRow = {
  id: string;
  scanId: string;
  clientName: string;
  gender: string;
  reportType: string;
  cost: string;
  uploadedAt: string;
  status: string;
};

type MemberScansModalProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  memberName: string;
  memberEmail: string;
  scanCount: number;
  scans: MemberScanRow[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  statusStyle: (status: string) => { color: string; background: string };
};

function Cell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <td title={title}>
      <span className="member-scans-cell">{children}</span>
    </td>
  );
}

export function MemberScansModal({
  open,
  onClose,
  titleId,
  memberName,
  memberEmail,
  scanCount,
  scans,
  loading,
  error,
  emptyMessage,
  statusStyle,
}: MemberScansModalProps) {
  const pagination = useClientPagination(scans, SCAN_PAGE_SIZE, memberEmail);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const rowOffset = (pagination.page - 1) * pagination.pageSize;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel member-scans-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id={titleId} className="modal-title">
              {memberName}&apos;s scans
            </h2>
            <p className="modal-subtitle">
              {memberEmail} · {scanCount} scan{scanCount === 1 ? '' : 's'}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body member-scans-modal-body">
          {loading ? (
            <p className="member-scans-message">Loading scans…</p>
          ) : error ? (
            <p className="member-scans-message">{error}</p>
          ) : scans.length === 0 ? (
            <p className="member-scans-message">{emptyMessage}</p>
          ) : (
            <>
              <div className="member-scans-table-wrap">
                <table className="member-scans-table">
                  <colgroup>
                    <col className="col-sno" />
                    <col className="col-scan-id" />
                    <col className="col-name" />
                    <col className="col-gender" />
                    <col className="col-report" />
                    <col className="col-cost" />
                    <col className="col-uploaded" />
                    <col className="col-status" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Sno</th>
                      <th>Scan Id</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Report Type</th>
                      <th>Cost</th>
                      <th>Uploaded</th>
                      <th className="col-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((scan, index) => {
                      const chip = statusStyle(scan.status);
                      return (
                        <tr key={scan.id}>
                          <Cell>{rowOffset + index + 1}</Cell>
                          <Cell title={scan.scanId}>{scan.scanId}</Cell>
                          <Cell title={scan.clientName}>{scan.clientName}</Cell>
                          <Cell title={scan.gender}>{scan.gender}</Cell>
                          <Cell title={scan.reportType}>{scan.reportType}</Cell>
                          <Cell title={scan.cost}>{scan.cost}</Cell>
                          <Cell title={scan.uploadedAt}>{scan.uploadedAt}</Cell>
                          <td className="col-center">
                            <span className="scans-status-chip" style={chip}>
                              {scan.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePager
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={pagination.setPage}
                className="mis-table-footer member-scans-pager"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
