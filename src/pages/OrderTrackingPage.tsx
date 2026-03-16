import { useState, useEffect } from 'react';
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock,
  MapPin, Phone, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { KitOrder, OrderStatusUpdate } from '../types/database';

interface OrderTrackingPageProps {
  onNavigate: (page: string, data?: any) => void;
  initialOrder?: KitOrder | null;
}

const deliverySteps = [
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export function OrderTrackingPage({ onNavigate, initialOrder }: OrderTrackingPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<KitOrder | null>(initialOrder || null);
  const [statusUpdates, setStatusUpdates] = useState<OrderStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(initialOrder?.id || null);

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  useEffect(() => {
    if (selectedOrder) loadStatusUpdates(selectedOrder.id);
  }, [selectedOrder]);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('kit_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      if (!selectedOrder && data.length > 0) {
        setSelectedOrder(data[0]);
        setExpandedOrder(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadStatusUpdates = async (orderId: string) => {
    const { data } = await supabase
      .from('order_status_updates')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (data) setStatusUpdates(data);
  };

  const getStepIndex = (status: string) => {
    return deliverySteps.findIndex(s => s.key === status);
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
      case 'failed': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' };
      case 'refunded': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Refunded' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('trade-centre')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-sm text-gray-600">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-4">Purchase a kit to see your orders here</p>
            <button
              onClick={() => onNavigate('kit-purchase')}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Buy a Kit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const currentStepIndex = getStepIndex(order.delivery_status);
              const paymentBadge = getPaymentBadge(order.payment_status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setExpandedOrder(isExpanded ? null : order.id);
                      setSelectedOrder(order);
                    }}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                          {' '} - {order.quantity}x {order.kit_type} kit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-gray-900 text-sm">N{order.total_price.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentBadge.bg} ${paymentBadge.text}`}>
                          {paymentBadge.label}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Delivery Progress</h3>
                        <div className="flex items-center justify-between relative">
                          <div className="absolute top-5 left-6 right-6 h-0.5 bg-gray-200" />
                          <div
                            className="absolute top-5 left-6 h-0.5 bg-green-500 transition-all duration-500"
                            style={{
                              width: `${(currentStepIndex / (deliverySteps.length - 1)) * (100 - 8)}%`
                            }}
                          />

                          {deliverySteps.map((step, index) => {
                            const isActive = index <= currentStepIndex;
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex flex-col items-center relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isActive
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  <StepIcon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs mt-2 font-medium ${
                                  isActive ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700">Delivery Address</span>
                          </div>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                          <p className="text-sm text-gray-600">{order.delivery_state}, Nigeria</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700">Contact</span>
                          </div>
                          <p className="text-sm text-gray-600">{order.delivery_phone}</p>
                        </div>
                      </div>

                      {order.payment_reference && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Payment Reference</span>
                          </div>
                          <p className="text-sm font-mono text-green-800">{order.payment_reference}</p>
                        </div>
                      )}

                      {order.kit_codes_assigned && order.kit_codes_assigned.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-blue-700 mb-2">Activation Codes</h4>
                          <div className="flex flex-wrap gap-2">
                            {order.kit_codes_assigned.map((code, i) => (
                              <span key={i} className="font-mono text-sm bg-white px-3 py-1 rounded-lg border border-blue-200 text-blue-800">
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {statusUpdates.length > 0 && selectedOrder?.id === order.id && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Status History</h3>
                          <div className="space-y-3">
                            {statusUpdates.map((update) => (
                              <div key={update.id} className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-700">{update.message}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(update.created_at).toLocaleString('en-NG')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
