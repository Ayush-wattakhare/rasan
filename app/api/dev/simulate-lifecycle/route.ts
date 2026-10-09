import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';

// In-memory simulation state store
let CURRENT_SIMULATION: any = null;

export async function GET() {
  if (!CURRENT_SIMULATION) {
    return NextResponse.json({
      active: false,
      message: 'No active simulation in memory. Click Start Simulation to begin.',
    });
  }
  return NextResponse.json({
    active: true,
    simulation: CURRENT_SIMULATION,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, step, customPin } = body;

    const serviceClient = createServiceClient();

    switch (action) {
      case 'start_or_reset': {
        const orderNumber = `ORD-SIM-${Math.floor(1000 + Math.random() * 9000)}`;
        const otpPin = customPin || Math.floor(1000 + Math.random() * 9000).toString();

        CURRENT_SIMULATION = {
          orderId: `sim-order-${Date.now()}`,
          orderNumber,
          otpPin,
          stage: '1_placed',
          createdAt: new Date().toISOString(),
          customer: {
            name: 'Avatta Khare (Customer)',
            email: 'customer@rasan.com',
            address: 'Flat 402, Green Acre Heights, Rahatani, Pune',
            coordinates: { lat: 18.6429, lng: 73.8129 },
          },
          vendor: {
            name: 'Master Chef Anita',
            businessName: "Anita's Home Kitchen",
            email: 'vendor@rasan.com',
            address: 'Pimpri Colony, Pimpri-Chinchwad, Pune',
            coordinates: { lat: 18.6279, lng: 73.8009 },
          },
          rider: {
            name: 'Rohan Sharma',
            email: 'delivery@rasan.com',
            vehicle: 'MH 14 DA 2024 (Electric Scooter)',
            currentCoordinates: { lat: 18.6279, lng: 73.8009 },
            routeProgress: 0,
          },
          financials: {
            mealTotal: 160,
            deliveryFee: 40,
            packagingFee: 15,
            grossTotal: 215,
            platformCommissionRate: RASAN_COMMISSION_PERCENTAGE, // 7% Launch Tier
            platformCommissionCut: Math.round(160 * (RASAN_COMMISSION_PERCENTAGE / 100)), // 7% of 160 = ₹11
            chefNetPayout: 160 - Math.round(160 * (RASAN_COMMISSION_PERCENTAGE / 100)), // 93% of 160 = ₹149
            riderBounty: 40, // 100% of delivery fee
          },
          items: [
            { name: 'Special Maharashtrian Thali', quantity: 1, price: 110, icon: '🍛' },
            { name: 'Warm Puran Poli with Desi Ghee', quantity: 2, price: 50, icon: '🫓' },
          ],
          logs: [
            {
              timestamp: new Date().toLocaleTimeString(),
              stage: '1_placed',
              message: `Order #${orderNumber} placed by Customer. Secure PIN generated: ${otpPin}`,
            },
          ],
        };

        return NextResponse.json({
          success: true,
          action: 'start_or_reset',
          simulation: CURRENT_SIMULATION,
        });
      }

      case 'chef_accept_cook': {
        if (!CURRENT_SIMULATION) throw new Error('Simulation not initialized');
        CURRENT_SIMULATION.stage = '2_cooking';
        CURRENT_SIMULATION.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          stage: '2_cooking',
          message: "Chef Anita received audio dispatch alert, accepted order and initiated small-batch prep.",
        });
        return NextResponse.json({ success: true, simulation: CURRENT_SIMULATION });
      }

      case 'chef_ready_packed': {
        if (!CURRENT_SIMULATION) throw new Error('Simulation not initialized');
        CURRENT_SIMULATION.stage = '3_ready';
        CURRENT_SIMULATION.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          stage: '3_ready',
          message: "Hot food packed in spill-proof containers. Broadcasted pickup alert to nearby riders.",
        });
        return NextResponse.json({ success: true, simulation: CURRENT_SIMULATION });
      }

      case 'rider_accept_pickup': {
        if (!CURRENT_SIMULATION) throw new Error('Simulation not initialized');
        CURRENT_SIMULATION.stage = '4_en_route';
        CURRENT_SIMULATION.rider.routeProgress = 20;
        CURRENT_SIMULATION.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          stage: '4_en_route',
          message: "Rider Rohan accepted sortie at Anita's Kitchen. Food safely stowed. Live GPS transmitting.",
        });
        return NextResponse.json({ success: true, simulation: CURRENT_SIMULATION });
      }

      case 'rider_step_gps': {
        if (!CURRENT_SIMULATION) throw new Error('Simulation not initialized');
        const progress = Math.min(100, (CURRENT_SIMULATION.rider.routeProgress || 0) + 30);
        CURRENT_SIMULATION.rider.routeProgress = progress;
        
        // Interpolate coordinates
        const origin = CURRENT_SIMULATION.vendor.coordinates;
        const dest = CURRENT_SIMULATION.customer.coordinates;
        const ratio = progress / 100;
        CURRENT_SIMULATION.rider.currentCoordinates = {
          lat: Number((origin.lat + (dest.lat - origin.lat) * ratio).toFixed(5)),
          lng: Number((origin.lng + (dest.lng - origin.lng) * ratio).toFixed(5)),
        };

        CURRENT_SIMULATION.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          stage: '4_en_route',
          message: `Rider GPS update: ${progress}% of route completed (~${Math.max(1, Math.round((1 - ratio) * 10))} mins ETA).`,
        });

        return NextResponse.json({ success: true, simulation: CURRENT_SIMULATION });
      }

      case 'doorstep_handover_verify': {
        if (!CURRENT_SIMULATION) throw new Error('Simulation not initialized');
        CURRENT_SIMULATION.stage = '5_delivered';
        CURRENT_SIMULATION.rider.routeProgress = 100;
        const utr = `UTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
        CURRENT_SIMULATION.utrNumber = utr;

        CURRENT_SIMULATION.logs.unshift({
          timestamp: new Date().toLocaleTimeString(),
          stage: '5_delivered',
          message: `Handover OTP (${CURRENT_SIMULATION.otpPin}) confirmed at doorstep! Meal delivered. ₹${CURRENT_SIMULATION.financials.platformCommissionCut} platform commission (7% launch tier) reconciled (Ref: ${utr}).`,
        });

        return NextResponse.json({ success: true, simulation: CURRENT_SIMULATION });
      }

      default:
        return NextResponse.json({ error: 'Unknown simulation action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Lifecycle simulation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
