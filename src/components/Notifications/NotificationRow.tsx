import type { NotificationItem } from '../../api/notificationTypes';

type NotificationRowProps = {
  item: NotificationItem;
  onAction: (item: NotificationItem) => void;
};

export function NotificationRow({ item, onAction }: NotificationRowProps) {
  return (
    <div className={`notification-row${item.read ? ' is-read' : ' is-unread'}`}>
      <div className="notification-row-content">
        <div className="notification-row-title">{item.title}</div>
        <div className="notification-row-body">{item.body}</div>
        <div className="notification-row-time">{item.created_at}</div>
      </div>
      {item.action_view ? (
        <button type="button" className="btn-pill-primary notification-row-action" onClick={() => onAction(item)}>
          Take action
        </button>
      ) : null}
    </div>
  );
}
