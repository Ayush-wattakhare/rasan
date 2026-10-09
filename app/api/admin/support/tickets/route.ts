import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  user_role: 'customer' | 'vendor' | 'delivery';
  user_name: string;
  user_email: string;
  user_phone?: string;
  order_id?: string;
  order_total?: number;
  category: 
    | 'food_quality' 
    | 'spillage_missing_item' 
    | 'late_delivery' 
    | 'rider_no_show' 
    | 'customer_unreachable' 
    | 'payout_delay' 
    | 'breakdown_reassign' 
    | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  resolution_notes?: string;
  refund_amount?: number;
  compensation_amount?: number;
  created_at: string;
  updated_at: string;
}

// In-memory persistent fallback if tickets table is not created in Supabase yet
let MEMORY_TICKETS: SupportTicket[] = [
  {
    id: 't-001',
    ticket_number: 'TCK-9841',
    user_id: 'cust-1',
    user_role: 'customer',
    user_name: 'Avatta Khare',
    user_email: 'customer@rasan.com',
    user_phone: '+91 9876543210',
    order_id: 'ORD-7518',
    order_total: 105,
    category: 'spillage_missing_item',
    priority: 'high',
    status: 'open',
    subject: 'Missing Sweet Dish from Executive Thali',
    description: 'Received the North Indian Thali on time, but the Gulab Jamun was missing from the container.',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 't-002',
    ticket_number: 'TCK-9842',
    user_id: 'vend-1',
    user_role: 'vendor',
    user_name: 'Anita Sharma (Anita’s Kitchen)',
    user_email: 'vendor@rasan.com',
    user_phone: '+91 9811223344',
    order_id: 'ORD-8921',
    order_total: 320,
    category: 'rider_no_show',
    priority: 'critical',
    status: 'open',
    subject: 'Rider delayed >20 mins for pickup',
    description: 'Hot meal packed and ready since 20 mins. Customer is calling repeatedly. Please assign another nearby rider immediately.',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 't-003',
    ticket_number: 'TCK-9843',
    user_id: 'del-1',
    user_role: 'delivery',
    user_name: 'Rohan Sharma (Pilot #24)',
    user_email: 'delivery@rasan.com',
    user_phone: '+91 9988776655',
    order_id: 'ORD-9012',
    order_total: 240,
    category: 'customer_unreachable',
    priority: 'high',
    status: 'in_progress',
    subject: 'Customer phone switched off at gate',
    description: 'Standing at Block E security gate since 12 minutes. Security is not allowing entry without OTP. Calling phone goes to voicemail.',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 't-004',
    ticket_number: 'TCK-9844',
    user_id: 'del-2',
    user_role: 'delivery',
    user_name: 'Riya Patel',
    user_email: 'riya@rasan.com',
    user_phone: '+91 9776655443',
    order_id: 'ORD-9104',
    order_total: 180,
    category: 'breakdown_reassign',
    priority: 'critical',
    status: 'open',
    subject: 'Flat tyre near Rahatani Chowk - Need urgent re-assignment',
    description: 'Electric scooter tyre punctured. Carrying 1 active order for Rahatani. Please transfer mission to another nearby rider.',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 't-005',
    ticket_number: 'TCK-9839',
    user_id: 'vend-2',
    user_role: 'vendor',
    user_name: 'Super Chef Kitchen',
    user_email: 'superchef@rasan.com',
    order_id: 'ORD-7102',
    category: 'payout_delay',
    priority: 'medium',
    status: 'resolved',
    subject: 'Weekly Payout Bank IFSC inquiry',
    description: 'Verified IFSC code and completed withdrawal of ₹4,200.',
    resolution_notes: 'IFSC updated to SBIN0001234 and payout transferred instantly via IMPS.',
    refund_amount: 0,
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    let tickets = [...MEMORY_TICKETS];

    if (roleFilter && roleFilter !== 'all') {
      tickets = tickets.filter(t => t.user_role === roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      tickets = tickets.filter(t => t.status === statusFilter);
    }
    if (priorityFilter && priorityFilter !== 'all') {
      tickets = tickets.filter(t => t.priority === priorityFilter);
    }

    return NextResponse.json({
      success: true,
      tickets,
      counts: {
        total: MEMORY_TICKETS.length,
        open: MEMORY_TICKETS.filter(t => t.status === 'open').length,
        in_progress: MEMORY_TICKETS.filter(t => t.status === 'in_progress').length,
        resolved: MEMORY_TICKETS.filter(t => t.status === 'resolved').length,
        critical: MEMORY_TICKETS.filter(t => t.priority === 'critical' && t.status !== 'resolved').length,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      ticket_number: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: body.user_id || 'guest',
      user_role: body.user_role || 'customer',
      user_name: body.user_name || 'Anonymous User',
      user_email: body.user_email || 'user@rasan.com',
      user_phone: body.user_phone,
      order_id: body.order_id,
      order_total: body.order_total,
      category: body.category || 'general',
      priority: body.priority || 'medium',
      status: 'open',
      subject: body.subject || 'Support Query',
      description: body.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MEMORY_TICKETS.unshift(newTicket);

    return NextResponse.json({
      success: true,
      ticket: newTicket,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, status, resolutionNotes, refundAmount, compensationAmount, actionType } = body;

    const ticketIndex = MEMORY_TICKETS.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = MEMORY_TICKETS[ticketIndex];
    ticket.status = status || ticket.status;
    if (resolutionNotes) ticket.resolution_notes = resolutionNotes;
    if (refundAmount) ticket.refund_amount = refundAmount;
    if (compensationAmount) ticket.compensation_amount = compensationAmount;
    ticket.updated_at = new Date().toISOString();

    // Push notification to user if service client is available
    try {
      const serviceClient = createServiceClient();
      if (ticket.user_id && ticket.user_id.length > 10) {
        await (serviceClient.from('notifications') as any).insert({
          user_id: ticket.user_id,
          type: 'system',
          title: `Ticket #${ticket.ticket_number} Updated (${ticket.status.toUpperCase()})`,
          message: resolutionNotes || `Your query regarding "${ticket.subject}" has been marked as ${ticket.status}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      ticket,
      message: `Ticket #${ticket.ticket_number} updated successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
