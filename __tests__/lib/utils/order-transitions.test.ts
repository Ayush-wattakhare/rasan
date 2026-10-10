import { canTransition, normalizeOrderStatus } from '@/lib/utils/order-transitions';

describe('normalizeOrderStatus', () => {
  it('maps the UI alias ready_for_pickup to ready', () => {
    expect(normalizeOrderStatus('ready_for_pickup')).toBe('ready');
  });

  it('accepts database statuses and rejects anything else', () => {
    expect(normalizeOrderStatus('delivered')).toBe('delivered');
    expect(normalizeOrderStatus('refunded')).toBeNull();
    expect(normalizeOrderStatus(undefined)).toBeNull();
  });
});

describe('canTransition', () => {
  it('lets kitchens move orders up to ready', () => {
    expect(canTransition('vendor', 'pending', 'confirmed')).toBe(true);
    expect(canTransition('vendor', 'confirmed', 'preparing')).toBe(true);
    expect(canTransition('vendor', 'preparing', 'ready')).toBe(true);
  });

  it('never lets kitchens mark orders picked up or delivered', () => {
    expect(canTransition('vendor', 'ready', 'picked_up')).toBe(false);
    expect(canTransition('vendor', 'out_for_delivery', 'delivered')).toBe(false);
  });

  it('lets riders move only their leg of the journey', () => {
    expect(canTransition('delivery', 'picked_up', 'out_for_delivery')).toBe(true);
    expect(canTransition('delivery', 'out_for_delivery', 'delivered')).toBe(true);
    expect(canTransition('delivery', 'pending', 'delivered')).toBe(false);
    expect(canTransition('delivery', 'ready', 'cancelled')).toBe(false);
  });

  it('allows no changes after delivery or cancellation', () => {
    for (const actor of ['vendor', 'delivery', 'admin'] as const) {
      expect(canTransition(actor, 'delivered', 'cancelled')).toBe(false);
      expect(canTransition(actor, 'delivered', 'delivered')).toBe(false);
      expect(canTransition(actor, 'cancelled', 'confirmed')).toBe(false);
    }
  });

  it('lets admins cancel any order that is still in progress', () => {
    expect(canTransition('admin', 'out_for_delivery', 'cancelled')).toBe(true);
  });
});
