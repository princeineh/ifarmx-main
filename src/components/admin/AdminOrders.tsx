import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../../services/notifications';
import {
  Package, Search, ChevronLeft, ChevronRight, CheckCircle,
  ShieldCheck, Key, X, AlertTriangle
} from 'lucide-react';

interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  buyer_name: string | null;
  buyer_type: string | null;
  quantity: number;
  total_price: number;
  payment_status: string;
  delivery_status: string;
  delivery_state: string;
  delivery_phone: string;
  delivery_address: string;
  program_id: string | null;
  program_name: string | null;
  admin_approved: boolean;
  kit_codes_assigned: string[];
  notes: string | null;
  created_at: string;
}

function generateKitCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return `GF-${segments.join('-')}`;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  useEffect(() => {
    loadOrders();
  }, [page, filterPayment, filterDelivery]);

  const loadOrders = async () => {
    setLoading(true);

    let query = supabase
      .from('kit_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterPayment !== 'all') query = query.eq('payment_status', filterPayment);
    if (filterDelivery !== 'all') query = query.eq('delivery_status', filterDelivery);

    const { data, count } = await query;
    setTotalCount(count || 0);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(o => o.user_id))];
    const programIds = [...new Set(data.map(o => o.program_id).filter(Boolean))];

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, user_type')
      .in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    let programMap = new Map<string, string>();
    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', programIds as string[]);
      programMap = new Map((programs || []).map(p => [p.id, p.name]));
    }

    const result: AdminOrder[] = data.map(o => {
      const prof = profileMap.get(o.user_id);
      return {
        ...o,
        buyer_name: prof?.display_name || null,
        buyer_type: prof?.user_type || null,
        program_name: o.program_id ? programMap.get(o.program_id) || null : null,
        kit_codes_assigned: o.kit_codes_assigned || [],
      };
    });

    setOrders(result);
    setLoading(false);
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    await supabase.from('kit_orders').update({ payment_status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    await supabase.from('order_status_updates').insert({
      order_id: orderId,
      status: newStatus,
      message: `Payment status updated to ${newStatus} by admin.`,
    });
    if (order) {
      const statusMessages: Record<string, string> = {
        paid: `Payment for your order ${order.order_number} has been confirmed. Your kit will be prepared for delivery shortly.`,
        pending: `Payment for your order ${order.order_number} is marked as pending. Please complete your payment to proceed.`,
        failed: `Payment for your order ${order.order_number} could not be verified. Please contact support or try again.`,
        refunded: `A refund has been processed for your order ${order.order_number}. Please allow a few business days for the funds to appear.`,
      };
      await createNotification(
        order.user_id,
        'payment_confirmed',
        `Payment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - Order ${order.order_number}`,
        statusMessages[newStatus] || `Payment status for order ${order.order_number} updated to ${newStatus}.`
      );
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
  };

  const generateAndAssignCodes = async (order: AdminOrder): Promise<string[]> => {
    const codes: string[] = [];
    for (let i = 0; i < order.quantity; i++) {
      codes.push(generateKitCode());
    }

    for (const code of codes) {
      await supabase.from('kit_codes').insert({
        code,
        program_id: order.program_id || null,
        used: false,
      });
    }

    await supabase.from('kit_orders').update({
      kit_codes_assigned: codes,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id);

    return codes;
  };

  const sendCodeNotification = async (order: AdminOrder, codes: string[]) => {
    const isOrg = order.buyer_type === 'organization';
    const codeList = codes.join(', ');

    await supabase.from('notifications').insert({
      user_id: order.user_id,
      type: 'system',
      title: isOrg
        ? 'Order Approved - Kit Codes Ready'
        : 'Kit Delivered - Activation Code Ready',
      message: isOrg
        ? `Your order ${order.order_number} has been approved. ${codes.length} kit code(s) generated: ${codeList}. Go to your program to assign codes to participants.`
        : `Your kit for order ${order.order_number} has been delivered! Your activation code is: ${codes[0]}. Go to Activate Kit from your dashboard to get started.`,
      read: false,
      metadata: { link_type: 'activate_kit', link_id: codes[0], codes, order_id: order.id },
    });
  };

  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const isIndividualOrFamily = order.buyer_type === 'individual' || order.buyer_type === 'family';

    if (newStatus === 'delivered' && isIndividualOrFamily && order.kit_codes_assigned.length === 0) {
      setActionLoading(orderId);
      try {
        const codes = await generateAndAssignCodes(order);
        await sendCodeNotification(order, codes);

        await supabase.from('kit_orders').update({
          delivery_status: 'delivered',
          updated_at: new Date().toISOString(),
        }).eq('id', orderId);

        await supabase.from('order_status_updates').insert({
          order_id: orderId,
          status: 'delivered',
          message: `Kit delivered. ${codes.length} activation code(s) auto-generated and sent to user: ${codes.join(', ')}`,
        });

        setOrders(prev => prev.map(o => o.id === orderId
          ? { ...o, delivery_status: 'delivered', kit_codes_assigned: codes }
          : o
        ));
      } finally {
        setActionLoading(null);
      }
      return;
    }

    await supabase.from('kit_orders').update({ delivery_status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    await supabase.from('order_status_updates').insert({
      order_id: orderId,
      status: newStatus,
      message: `Delivery status updated to ${newStatus} by admin.`,
    });
    if (order) {
      const deliveryMessages: Record<string, string> = {
        processing: `Your order ${order.order_number} is now being processed. We are preparing your kit for shipment.`,
        shipped: `Your order ${order.order_number} has been shipped! It is on its way to ${order.delivery_state}.`,
        in_transit: `Your order ${order.order_number} is in transit to ${order.delivery_address || order.delivery_state}. Delivery is on track.`,
        delivered: `Your order ${order.order_number} has been delivered. Check your delivery address for your kit package.`,
      };
      await createNotification(
        order.user_id,
        'order_approved',
        `Delivery Update - ${newStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        deliveryMessages[newStatus] || `Delivery status for order ${order.order_number} updated to ${newStatus}.`
      );
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o));
  };

  const approveOrgOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.payment_status !== 'paid') {
      alert('Cannot approve: payment has not been confirmed yet.');
      return;
    }

    if (order.admin_approved) return;

    setActionLoading(orderId);
    try {
      const codes = await generateAndAssignCodes(order);
      await sendCodeNotification(order, codes);

      await supabase.from('kit_orders').update({
        admin_approved: true,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);

      await supabase.from('order_status_updates').insert({
        order_id: orderId,
        status: 'approved',
        message: `Order approved by admin. ${codes.length} kit code(s) generated for program "${order.program_name || 'N/A'}" and notification sent to organization.`,
      });

      await createNotification(
        order.user_id,
        'order_approved',
        'Order Approved by Admin',
        `Your order ${order.order_number} for ${order.quantity} kit(s) has been approved. ${codes.length} kit code(s) have been generated and are ready for assignment to your program participants.`
      );

      setOrders(prev => prev.map(o => o.id === orderId
        ? { ...o, admin_approved: true, kit_codes_assigned: codes }
        : o
      ));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search
    ? orders.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (o.buyer_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const paymentBadge = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const deliveryBadge = (s: string) => {
    switch (s) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or buyer..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <select
            value={filterPayment}
            onChange={(e) => { setFilterPayment(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={filterDelivery}
            onChange={(e) => { setFilterDelivery(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Delivery</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => {
                const isOrg = order.buyer_type === 'organization';
                const hasCodes = order.kit_codes_assigned.length > 0;
                const isExpanded = expandedOrder === order.id;
                const isProcessing = actionLoading === order.id;

                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="text-left"
                      >
                        <p className="text-sm font-mono font-semibold text-gray-900 hover:text-emerald-700 transition-colors">
                          {order.order_number}
                        </p>
                        {order.notes && <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{order.notes}</p>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{order.buyer_name || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-400">{order.buyer_type} | {order.delivery_state}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">N{order.total_price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.payment_status}
                        onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${paymentBadge(order.payment_status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isOrg ? (
                        <select
                          value={order.delivery_status}
                          onChange={(e) => updateDeliveryStatus(order.id, e.target.value)}
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${deliveryBadge(order.delivery_status)}`}
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      ) : (
                        <select
                          value={order.delivery_status}
                          onChange={(e) => updateDeliveryStatus(order.id, e.target.value)}
                          disabled={isProcessing}
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${deliveryBadge(order.delivery_status)} ${isProcessing ? 'opacity-50' : ''}`}
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {isOrg ? (
                        order.admin_approved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-700 rounded-lg px-2 py-1">
                            <ShieldCheck className="w-3 h-3" /> Approved
                          </span>
                        ) : order.payment_status === 'paid' ? (
                          <button
                            onClick={() => approveOrgOrder(order.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Awaiting payment</span>
                        )
                      ) : (
                        hasCodes ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-700 rounded-lg px-2 py-1">
                            <Key className="w-3 h-3" /> Code Sent
                          </span>
                        ) : order.delivery_status === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 rounded-lg px-2 py-1">
                            <AlertTriangle className="w-3 h-3" /> No Code
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Pending delivery</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {expandedOrder && (() => {
          const order = filtered.find(o => o.id === expandedOrder);
          if (!order) return null;
          return (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900">Order Details - {order.order_number}</h4>
                <button onClick={() => setExpandedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Delivery Address</p>
                  <p className="font-medium text-gray-900">{order.delivery_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p className="font-medium text-gray-900">{order.delivery_phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">State</p>
                  <p className="font-medium text-gray-900">{order.delivery_state}</p>
                </div>
                {order.buyer_type === 'organization' && order.program_name && (
                  <div>
                    <p className="text-gray-500 text-xs">Program</p>
                    <p className="font-medium text-emerald-700">{order.program_name}</p>
                  </div>
                )}
                {order.kit_codes_assigned.length > 0 && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-gray-500 text-xs mb-1">Generated Kit Codes ({order.kit_codes_assigned.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.kit_codes_assigned.map(code => (
                        <span key={code} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-mono text-xs px-2 py-1 rounded-md">
                          <Key className="w-3 h-3" />
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-700">Page {page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
