import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';

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

// In-memory fallback if database table is unreachable or pending migration
const MEMORY_TICKETS: SupportTicket[] = [
  {
    id: 't-001',
    ticket_number: 'TCK-9841',
    user_id: 'cust-1',
    user_role: 'customer',
    user_name: 'Avatta Khare',
    user_email: 'customer@rasan.com',
    user_phone: '+91 9876543210',
    order_id: 'ORD-7518',
    order_total: 199,
    category: 'spillage_missing_item',
    priority: 'high',
    status: 'open',
    subject: 'Dal Makhani container cracked and spilled during transit',
    description: 'Received bag with dal container seal broken. Need replacement or refund for dal.',
    refund_amount: 50,
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: 't-002',
    ticket_number: 'TCK-9840',
    user_id: 'del-1',
    user_role: 'delivery',
    user_name: 'Rohan Sharma',
    user_email: 'rider.rohan@rasan.com',
    user_phone: '+91 9988776655',
    order_id: 'ORD-8921',
    category: 'rider_no_show',
    priority: 'critical',
    status: 'in_progress',
    subject: 'Flat tire near Akurdi Chowk (2 active meal drops in bag)',
    description: 'Scooter puncture. Need nearby rider to reassign ORD-8921 and ORD-8922.',
    resolution_notes: 'Reassigned rider Vikram Singh. Dispatched compensation voucher.',
    compensation_amount: 35,
    created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 't-003',
    ticket_number: 'TCK-9838',
    user_id: 'vend-1',
    user_role: 'vendor',
    user_name: "Anita's Kitchen",
    user_email: 'anita.kitchen@rasan.com',
    user_phone: '+91 9123456780',
    order_id: 'ORD-6219',
    order_total: 310,
    category: 'customer_unreachable',
    priority: 'medium',
    status: 'resolved',
    subject: 'Customer phone switched off at hostel gate for 25 mins',
    description: 'Rider waited outside Symbiosis hostel. Customer phone unreachable.',
    resolution_notes: 'Order auto-cancelled by ops. 70% food cost credited to chef Anita.',
    compensation_amount: 140,
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 't-004',
    ticket_number: 'TCK-9837',
    user_id: 'cust-2',
    user_role: 'customer',
    user_name: 'Rahul Kadam',
    user_email: 'rahul.kadam@rasan.com',
    order_id: 'ORD-9014',
    category: 'late_delivery',
    priority: 'low',
    status: 'closed',
    subject: 'Delivery arrived 15 mins later than ETA due to rain',
    description: 'Food was warm and good, but delivery was delayed.',
    resolution_notes: 'Apologized and issued 10% next-tiffin coupon.',
    created_at: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
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
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    const serviceClient = createServiceClient();
    let query: any = serviceClient
      .from('support_tickets' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('user_role', roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    const { data: dbTickets } = await query;

    // Use database records if available; otherwise use resilient fallback
    let tickets: SupportTicket[] = (dbTickets && dbTickets.length > 0)
      ? (dbTickets as unknown as SupportTicket[])
      : [...MEMORY_TICKETS];

    if (!dbTickets || dbTickets.length === 0) {
      if (roleFilter && roleFilter !== 'all') {
        tickets = tickets.filter(t => t.user_role === roleFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        tickets = tickets.filter(t => t.status === statusFilter);
      }
      if (priorityFilter && priorityFilter !== 'all') {
        tickets = tickets.filter(t => t.priority === priorityFilter);
      }
    }

    // Compute live metric counts
    const sourceForCounts = (dbTickets && dbTickets.length > 0) ? (dbTickets as unknown as SupportTicket[]) : MEMORY_TICKETS;
    const counts = {
      total: sourceForCounts.length,
      open: sourceForCounts.filter(t => t.status === 'open').length,
      in_progress: sourceForCounts.filter(t => t.status === 'in_progress').length,
      resolved: sourceForCounts.filter(t => t.status === 'resolved').length,
      critical: sourceForCounts.filter(t => t.priority === 'critical' && t.status !== 'resolved').length,
    };

    return NextResponse.json({
      success: true,
      tickets,
      counts,
      source: (dbTickets && dbTickets.length > 0) ? 'database' : 'fallback',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const ticketNumber = `TCK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      ticket_number: ticketNumber,
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

    // Attempt persistent database insertion
    const serviceClient = createServiceClient();
    try {
      const { data: inserted, error: insertError } = await (serviceClient.from('support_tickets' as any) as any)
        .insert({
          ticket_number: newTicket.ticket_number,
          user_id: newTicket.user_id && newTicket.user_id.length > 10 ? newTicket.user_id : null,
          user_role: newTicket.user_role,
          user_name: newTicket.user_name,
          user_email: newTicket.user_email,
          user_phone: newTicket.user_phone,
          order_id: newTicket.order_id && newTicket.order_id.length > 10 ? newTicket.order_id : null,
          order_total: newTicket.order_total,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open',
          subject: newTicket.subject,
          description: newTicket.description,
        })
        .select()
        .maybeSingle();

      if (inserted && !insertError) {
        newTicket.id = (inserted as any).id;
      }
    } catch {
      // In-memory array fallback
    }

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
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { ticketId, status, resolutionNotes, refundAmount, compensationAmount } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    let updatedTicket: SupportTicket | null = null;

    // Try persistent database update
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (status) updatePayload.status = status;
      if (resolutionNotes) updatePayload.resolution_notes = resolutionNotes;
      if (refundAmount !== undefined) updatePayload.refund_amount = refundAmount;
      if (compensationAmount !== undefined) updatePayload.compensation_amount = compensationAmount;

      const { data: dbUpdated } = await (serviceClient.from('support_tickets' as any) as any)
        .update(updatePayload)
        .eq('id', ticketId)
        .select()
        .maybeSingle();

      if (dbUpdated) {
        updatedTicket = dbUpdated as unknown as SupportTicket;
      }
    } catch {}

    // Fallback in-memory update
    const ticketIndex = MEMORY_TICKETS.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      const ticket = MEMORY_TICKETS[ticketIndex];
      ticket.status = status || ticket.status;
      if (resolutionNotes) ticket.resolution_notes = resolutionNotes;
      if (refundAmount !== undefined) ticket.refund_amount = refundAmount;
      if (compensationAmount !== undefined) ticket.compensation_amount = compensationAmount;
      ticket.updated_at = new Date().toISOString();
      if (!updatedTicket) updatedTicket = ticket;
    }

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Push notification to user
    try {
      if (updatedTicket.user_id && updatedTicket.user_id.length > 10) {
        await (serviceClient.from('notifications') as any).insert({
          user_id: updatedTicket.user_id,
          type: 'system',
          title: `Ticket #${updatedTicket.ticket_number} Updated (${updatedTicket.status.toUpperCase()})`,
          message: resolutionNotes || `Your query regarding "${updatedTicket.subject}" has been marked as ${updatedTicket.status}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Ticket #${updatedTicket.ticket_number} updated successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
