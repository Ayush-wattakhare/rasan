/** Customer refund share by the status the order was in when cancelled. */
export function cancellationPolicy(status: string): { percentage: number; reason: string } {
  if (['pending', 'confirmed'].includes(status)) {
    return { percentage: 100, reason: 'Full refund (cancelled before the kitchen started cooking).' };
  }
  if (status === 'preparing') {
    return { percentage: 50, reason: '50% refund (the kitchen had already started cooking).' };
  }
  return { percentage: 0, reason: 'Not refundable (the order was ready or out for delivery).' };
}
