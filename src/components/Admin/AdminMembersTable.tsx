import type { AdminMemberApi } from '../../api/types';
import { colors } from '../../styles/theme';

const theme = colors.light;

type MemberStatus = 'Active' | 'Invited' | 'Disabled';

function statusStyles(status: MemberStatus) {
  if (status === 'Active') return { color: theme.success, background: theme['success-bg'] };
  if (status === 'Invited') return { color: theme.warning, background: theme['warning-bg'] };
  return { color: theme.error, background: theme['error-bg'] };
}

type AdminMembersTableProps = {
  members: AdminMemberApi[];
  onEdit: (member: AdminMemberApi) => void;
  onDelete: (member: AdminMemberApi) => void;
};

export function AdminMembersTable({ members, onEdit, onDelete }: AdminMembersTableProps) {
  return (
    <div className="dash-card scans-table-card" style={{ width: '100%' }}>
      <div className="scans-card-head">
        <div>
          <h2 className="scans-card-title">All accounts</h2>
          <p className="scans-card-sub">Edit admin fields · enable or disable sign-in from the edit modal</p>
        </div>
        <span className="scans-card-meta">{members.length}</span>
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
            {members.map((member, index) => {
              const chip = statusStyles(member.status as MemberStatus);
              return (
                <tr key={member.id}>
                  <td data-label="Sno">{index + 1}</td>
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
                    <span className="scans-status-chip" style={chip}>
                      {member.status}
                    </span>
                  </td>
                  <td data-label="Admin">
                    <button type="button" className="scans-action-btn" onClick={() => onEdit(member)}>
                      Edit
                    </button>
                  </td>
                  <td data-label="Delete">
                    <button type="button" className="scans-action-btn scans-action-danger" onClick={() => onDelete(member)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="reports-empty">
            <p className="reports-empty-title">No accounts yet</p>
            <p className="reports-empty-sub">Create the first member account above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
