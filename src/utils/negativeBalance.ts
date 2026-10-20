export function negativeBalanceMessage(balance: number): string {
  return (
    `Your current ledger balance is −₹${Math.abs(Math.round(balance)).toLocaleString('en-IN')}. ` +
    'Scan uploads and report downloads are on hold until the outstanding amount is cleared. ' +
    'Please top up your ledger to continue.'
  );
}
