import type { AdminMemberApi, TraineeApi } from '../../api/types';
import { colors } from '../../styles/theme';
import { TrashButton } from '../common/TrashButton';

const theme = colors.light;

export type AdminAccountRow =
  | { kind: 'member'; key: string; member: AdminMemberApi }
  | { kind: 'trainee'; key: string; trainee: TraineeApi };

function statusStyles(status: string) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Invited') return { color: theme.warning, background: theme['warning-bg'] };
  if (status === 'Inactive') return { color: theme['text-muted'], background: theme['bg-muted'] };
  return { color: theme.error, background: theme['error-bg'] };
}

type AdminMembersTableProps = {
  rows: AdminAccountRow[];
  totalCount: number;
  rowOffset?: number;
  onEdit: (member: AdminMemberApi) => void;
  onDelete: (member: AdminMemberApi) => void;
  onEditTrainee: (trainee: TraineeApi) => void;
  onDeleteTrainee: (trainee: TraineeApi) => void;
};

export function AdminMembersTable({
  rows,
  totalCount,
  rowOffset = 0,
  onEdit,
  onDelete,
  onEditTrainee,
  onDeleteTrainee,
}: AdminMembersTableProps) {
  return (
    <div className="dash-card scans-table-card" style={{ width: '100%' }}>
      <div className="scans-card-head">
        <div>
          <h2 className="scans-card-title">All accounts</h2>
          <p className="scans-card-sub">Edit admin fields · enable or disable sign-in from the edit modal · trainees have no login</p>
        </div>
        <span className="scans-card-meta">{totalCount}</span>
      </div>

      <div className="scans-table-wrap">
        <table className="scans-table admin-members-table">
          <thead>
            <tr>
              <th>Sno</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Mentor</th>
              <th>Billing</th>
              <th>Created</th>
              <th className="col-center">Status</th>
              <th className="col-center">Admin</th>
              <th className="col-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              if (row.kind === 'trainee') {
                const trainee = row.trainee;
                return (
                  <tr key={row.key}>
                    <td data-label="Sno">{rowOffset + index + 1}</td>
                    <td data-label="Name">
                      <span className="scans-table-file-static">{trainee.name}</span>
                      <span className="scans-table-meta">{trainee.phone || '—'}</span>
                    </td>
                    <td data-label="Email">{trainee.email || '—'}</td>
                    <td data-label="Role">
                      Trainee <span className="scans-table-meta">No login</span>
                    </td>
                    <td data-label="Mentor">{trainee.mentor_name || '—'}</td>
                    <td data-label="Billing">{trainee.billing_percent}</td>
                    <td data-label="Created">{trainee.created_at || '—'}</td>
                    <td data-label="Status">
                      <span className="scans-status-chip" style={statusStyles(trainee.status)}>
                        {trainee.status}
                      </span>
                    </td>
                    <td data-label="Admin">
                      <button type="button" className="scans-action-btn" onClick={() => onEditTrainee(trainee)}>
                        Edit
                      </button>
                    </td>
                    <td data-label="Delete">
                      <TrashButton label="Delete trainee" onClick={() => onDeleteTrainee(trainee)} />
                    </td>
                  </tr>
                );
              }

              const member = row.member;
              return (
                <tr key={row.key}>
                  <td data-label="Sno">{rowOffset + index + 1}</td>
                  <td data-label="Name">
                    <span className="scans-table-file-static">{member.name}</span>
                    <span className="scans-table-meta">{member.phone}</span>
                  </td>
                  <td data-label="Email">{member.email}</td>
                  <td data-label="Role">{member.role}</td>
                  <td data-label="Mentor">{member.mentored_by || '—'}</td>
                  <td data-label="Billing">{member.billing || '—'}</td>
                  <td data-label="Created">{member.created_at}</td>
                  <td data-label="Status">
                    <span className="scans-status-chip" style={statusStyles(member.status)}>
                      {member.status}
                    </span>
                  </td>
                  <td data-label="Admin">
                    <button type="button" className="scans-action-btn" onClick={() => onEdit(member)}>
                      Edit
                    </button>
                  </td>
                  <td data-label="Delete">
                    <TrashButton label="Delete account" onClick={() => onDelete(member)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="reports-empty">
            <p className="reports-empty-title">No accounts yet</p>
            <p className="reports-empty-sub">Create the first member account above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
