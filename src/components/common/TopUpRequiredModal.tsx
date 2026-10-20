import { ConfirmModal } from './ConfirmModal';

type TopUpRequiredModalProps = {
  /** Message to show; the modal is open while this is set. */
  message: string | null;
  onClose: () => void;
  /** Omit when the viewer can't top up themselves (e.g. a trainee whose mentor is billed). */
  onTopUp?: () => void;
};

export function TopUpRequiredModal({ message, onClose, onTopUp }: TopUpRequiredModalProps) {
  return (
    <ConfirmModal
      open={message != null}
      title="Top-up required"
      subtitle="Your ledger balance is negative"
      confirmLabel={onTopUp ? 'Top up now' : 'OK'}
      danger
      onClose={onClose}
      onConfirm={() => {
        onClose();
        onTopUp?.();
      }}
    >
      {message}
    </ConfirmModal>
  );
}
