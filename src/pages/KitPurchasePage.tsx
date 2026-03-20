import { useState, useEffect } from 'react';
import {
  ArrowLeft, ShoppingBag, Check, CreditCard, MapPin,
  Phone, FileText, Shield, Truck, FolderOpen, Clock, UsersRound, Image
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../services/analytics';
import { createNotification } from '../services/notifications';
import type { Program } from '../types/database';

interface KitPurchasePageProps {
  onNavigate: (page: string, data?: any) => void;
}

// Remove KIT_PRICE, plans, etc. for product listing
interface KitProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  created_at: string;
}

const INDIVIDUAL_PLANS = [
  { name: 'Solo Farmer', kits: 1, discount: 0, popular: false },
  { name: 'Duo Pack', kits: 2, discount: 0, popular: false },
  { name: 'Trio Bundle', kits: 3, discount: 0, popular: false },
  { name: 'Starter Bundle', kits: 4, discount: 0, popular: false },
];

const FAMILY_PLANS = [
  { name: 'Family Starter', kits: 5, discount: 5, popular: true },
  { name: 'Family Growth', kits: 8, discount: 10, popular: false },
  { name: 'Family Estate', kits: 12, discount: 15, popular: false },
];

const ORG_PLANS = [
  { name: 'Community Seed', kits: 10, discount: 3, popular: false },
  { name: 'Village Program', kits: 25, discount: 8, popular: true },
  { name: 'Impact Scale', kits: 50, discount: 12, popular: false },
  { name: 'Enterprise', kits: 100, discount: 15, popular: false },
];

// Price is derived from the selected product; this helper is unused but kept for reference
const calculatePrice = (unitPrice: number, kits: number, discount: number): number => {
  const basePrice = unitPrice * kits;
  return Math.round(basePrice * (1 - discount / 100));
};

const getDiscountForQuantity = (quantity: number, isOrg: boolean): number => {
  if (isOrg) {
    if (quantity >= 100) return 15;
    if (quantity >= 50) return 12;
    if (quantity >= 25) return 8;
    if (quantity >= 10) return 3;
    return 0;
  }
  if (quantity >= 12) return 15;
  if (quantity >= 8) return 10;
  if (quantity >= 5) return 5;
  return 0;
};

const kitItems = [
  'Manure',
  'Refined sand',
  'Grower bag',
  'Disposable gloves',
  'Nifor Book',
  'Pamphlet',
  'Manual',
  'Water sprayer',
  'Tenera sprouted Seed (NIFOR EWS)',
];

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

type Step = 'details' | 'payment' | 'confirmation';

export function KitPurchasePage({ onNavigate }: KitPurchasePageProps) {
  const { user, profile } = useAuth();
  const isOrg = profile?.user_type === 'organization';

  const [step, setStep] = useState<Step>('details');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const [products, setProducts] = useState<KitProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(isOrg);
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase.from('kit_products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
      if (data.length > 0) setSelectedProductId(data[0].id);
    }
  };

  useEffect(() => {
    if (isOrg && user) loadOrgPrograms();
  }, [isOrg, user]);

  useEffect(() => {
    if (profile) {
      if (!address && profile.location) setAddress(profile.location);
      if (!state && profile.state_of_origin) setState(profile.state_of_origin);
      if (!phone && profile.phone_number) setPhone(profile.phone_number);
    }
  }, [profile]);

  const loadOrgPrograms = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('org_user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setPrograms(data);
      if (data.length > 0) setSelectedProgramId(data[0].id);
    }
    setLoadingPrograms(false);
  };

  const allFamilyPlans = [...INDIVIDUAL_PLANS, ...FAMILY_PLANS];
  const matchedPlan = !isOrg ? allFamilyPlans.find(p => p.kits === quantity) : ORG_PLANS.find(p => p.kits === quantity);
  const appliedDiscount = matchedPlan ? matchedPlan.discount : getDiscountForQuantity(quantity, isOrg);
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;
  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const generateOrderNumber = () => {
    const prefix = 'GF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (!address.trim() || !state || !phone.trim()) {
      setError('Please fill in all delivery details');
      return;
    }
    if (isOrg && !selectedProgramId) {
      setError('Please select a program for these kits');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('kit_orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          kit_type: selectedProduct?.name || 'standard',
          product_id: selectedProductId,
          quantity,
          unit_price: selectedProduct?.price || 0,
          total_price: totalPrice,
          payment_status: 'pending',
          delivery_status: 'processing',
          delivery_address: address.trim(),
          delivery_state: state,
          delivery_phone: phone.trim(),
          program_id: isOrg && selectedProgramId ? selectedProgramId : null,
          notes: isOrg
            ? `Program: ${selectedProgram?.name || 'N/A'}${notes.trim() ? ` | ${notes.trim()}` : ''}`
            : notes.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await supabase.from('order_status_updates').insert({
        order_id: order.id,
        status: 'processing',
        message: 'Order placed successfully. Awaiting payment confirmation.',
      });

      trackEvent('place_order', 'kit-purchase', user.id, { quantity, total: totalPrice, is_org: isOrg });

      createNotification(
        user.id,
        'order_placed',
        'Order Placed Successfully!',
        `Your order #${orderNumber} for ${quantity} Oil Palm Revolution Kit${quantity > 1 ? 's' : ''} has been placed. Total: NGN ${totalPrice.toLocaleString()}. Please proceed to make your payment to complete the order. We'll notify you once your payment is confirmed.`
      );

      setCreatedOrder(order);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!createdOrder) return;

    setLoading(true);
    setError(null);

    try {
      const paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}`;

      const { error: updateError } = await supabase
        .from('kit_orders')
        .update({
          payment_status: 'paid',
          payment_reference: paymentRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createdOrder.id);

      if (updateError) throw updateError;

      trackEvent('confirm_payment', 'kit-purchase', user?.id, { order_id: createdOrder.id });

      await supabase.from('order_status_updates').insert({
        order_id: createdOrder.id,
        status: 'paid',
        message: isOrg
          ? `Payment submitted. Reference: ${paymentRef}. Awaiting admin verification and approval.`
          : `Payment submitted. Reference: ${paymentRef}. Your activation code will be sent once delivery is confirmed.`,
      });

      createNotification(
        user!.id,
        'payment_confirmed',
        'Payment Submitted!',
        `Your payment for order #${createdOrder.order_number} has been submitted with reference ${paymentRef}. ${isOrg ? 'Your order is now awaiting admin verification and approval.' : 'Your activation code will be sent once delivery is confirmed.'} Thank you for your purchase!`
      );

      setCreatedOrder({ ...createdOrder, payment_status: 'paid', payment_reference: paymentRef });
      setStep('confirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirmation' && createdOrder) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isOrg ? 'Order Submitted for Review' : 'Payment Submitted!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isOrg
                ? `${quantity} kit${quantity !== 1 ? 's' : ''} ordered for ${selectedProgram?.name || 'your program'}. Pending admin approval.`
                : 'Your kit is on its way to making Naija greener!'}
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-mono font-semibold text-gray-900">{createdOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold text-gray-900">{createdOrder.quantity}</span>
                </div>
                {isOrg && selectedProgram && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Program</span>
                    <span className="font-semibold text-gray-900">{selectedProgram.name}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-emerald-200 pt-2">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-bold text-emerald-700">N{createdOrder.total_price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm mb-1">What Happens Next?</h3>
                  <p className="text-xs text-amber-800">
                    {isOrg
                      ? 'Our admin team will verify your payment and review your program. Once approved, kit codes will be generated and sent to you via notification.'
                      : 'Our team will verify your payment, process and ship your kit. Once delivered, your activation code will be automatically generated and sent to you via notification.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('order-tracking', createdOrder)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Track Order
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && createdOrder) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('details')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number</span>
                <span className="font-mono font-semibold">{createdOrder.order_number}</span>
              </div>
              {isOrg && selectedProgram && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Program</span>
                  <span className="font-semibold">{selectedProgram.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">iFarm Kit x {quantity}</span>
                <span className="font-semibold">N{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-lg">N{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Method
            </h2>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-emerald-900 mb-2">Bank Transfer</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-800">Bank</span>
                  <span className="font-semibold text-emerald-900">iFarmX Ltd - GTBank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Account Number</span>
                  <span className="font-mono font-semibold text-emerald-900">0123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Amount</span>
                  <span className="font-bold text-emerald-900">N{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Reference</span>
                  <span className="font-mono font-semibold text-emerald-900">{createdOrder.order_number}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Use your order number as payment reference. After making the transfer, click the button below to confirm.
            </p>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                {isOrg
                  ? 'Your payment will be verified by our admin team. Kit codes will be generated after approval.'
                  : 'Your payment will be verified by our team. Your activation code will be sent once your kit is delivered.'}
              </p>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  I've Made the Payment
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('trade-centre')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{isOrg ? 'Purchase Kits for Program' : 'Buy a Kit'}</h1>
                <p className="text-sm text-gray-600">Oil Palm Revolution Starter Kit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kit Store Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProductId(p.id); setQuantity(1); }}
                className={`border rounded-xl p-4 flex gap-4 items-center transition-all ${selectedProductId === p.id ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'}`}
              >
                <img src={p.image_url} alt={p.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900 text-lg mb-1">{p.name}</div>
                  <div className="text-emerald-700 text-xl font-bold mb-1">N{p.price.toLocaleString()} <span className="text-sm text-gray-500 font-normal">/ kit</span></div>
                  <div className="text-xs text-gray-500">{p.description}</div>
                </div>
                {selectedProductId === p.id && <Check className="w-6 h-6 text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>

        {!isOrg && (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UsersRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Family Discounts Available</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Farm together, save together. Get 5 or more kits and unlock family discounts up to 15% off.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-white rounded-full text-gray-700 font-medium">Save up to 15%</span>
                  <span className="px-2 py-1 bg-white rounded-full text-gray-700 font-medium">Shared family dashboard</span>
                  <span className="px-2 py-1 bg-white rounded-full text-gray-700 font-medium">Assign kits to members</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isOrg && (
          <>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                Link to Program
              </h3>
              {loadingPrograms ? (
                <div className="text-sm text-gray-500">Loading programs...</div>
              ) : programs.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No programs found. <button onClick={() => onNavigate('organization')} className="text-emerald-600 font-semibold hover:underline">Create one first</button>.
                </div>
              ) : (
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.target_participants} target participants)
                    </option>
                  ))}
                </select>
              )}
              {selectedProgram && (
                <p className="text-xs text-gray-500 mt-2">
                  Kit codes will be linked to "{selectedProgram.name}" and can be auto-assigned to participants from the program detail page.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Organisation Bulk Packages</h3>
              <p className="text-sm text-gray-600 mb-4">
                Volume discounts for programs and community initiatives. Save up to 15% on large orders.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {ORG_PLANS.map((plan) => {
                  const planPrice = calculatePrice(selectedProduct?.price ?? 0, plan.kits, plan.discount);
                  const pricePerKit = Math.round(planPrice / plan.kits);
                  const isSelected = quantity === plan.kits;

                  return (
                    <button
                      key={plan.name}
                      onClick={() => setQuantity(plan.kits)}
                      className={`relative border-2 rounded-xl p-4 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                            POPULAR
                          </span>
                        </div>
                      )}

                      <div className="mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{plan.name}</h4>
                        <p className="text-xs text-gray-500">{plan.kits} kits</p>
                      </div>

                      <div className="mb-2">
                        <div className="text-xl font-bold text-gray-900">
                          N{planPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          N{pricePerKit.toLocaleString()} per kit
                        </div>
                      </div>

                      {plan.discount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                          Save {plan.discount}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isOrg && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Choose Your Plan</h3>
            <p className="text-sm text-gray-600 mb-6">Start solo or get family discounts with 5+ kits</p>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold">1</span>
                Individual Plans
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INDIVIDUAL_PLANS.map((plan) => {
                  const planPrice = calculatePrice(selectedProduct?.price ?? 0, plan.kits, plan.discount);
                  const isSelected = selectedPlan === plan.kits || quantity === plan.kits;

                  return (
                    <button
                      key={plan.name}
                      onClick={() => {
                        setSelectedPlan(plan.kits);
                        setQuantity(plan.kits);
                      }}
                      className={`relative border-2 rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{plan.name}</h4>
                        <p className="text-xs text-gray-500">{plan.kits} kit{plan.kits !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        N{planPrice.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">2</span>
                Family / Group Plans
                <span className="ml-auto text-xs text-emerald-600 font-medium">Save up to 15%</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FAMILY_PLANS.map((plan) => {
                  const planPrice = calculatePrice(selectedProduct?.price ?? 0, plan.kits, plan.discount);
                  const pricePerKit = Math.round(planPrice / plan.kits);
                  const isSelected = selectedPlan === plan.kits || quantity === plan.kits;

                  return (
                    <button
                      key={plan.name}
                      onClick={() => {
                        setSelectedPlan(plan.kits);
                        setQuantity(plan.kits);
                      }}
                      className={`relative border-2 rounded-xl p-4 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                            POPULAR
                          </span>
                        </div>
                      )}

                      <div className="mb-3">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{plan.name}</h4>
                        <p className="text-xs text-gray-500">{plan.kits} kits</p>
                      </div>

                      <div className="mb-2">
                        <div className="text-2xl font-bold text-gray-900">
                          N{planPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          N{pricePerKit.toLocaleString()} per kit
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                          Save {plan.discount}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-3">Or customize your quantity below:</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">{isOrg ? 'Quantity' : 'Custom Quantity'}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - (isOrg ? 10 : 1)))}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-medium"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="font-semibold text-gray-900 w-16 text-center border border-gray-200 rounded-lg py-1 text-sm"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + (isOrg ? 10 : 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-medium"
              >
                +
              </button>
            </div>
          </div>
          {isOrg && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {[10, 25, 50, 100, 200, 500].map(n => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    quantity === n
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {n} kits
                </button>
              ))}
            </div>
          )}
          <div className="bg-emerald-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-xl font-bold text-emerald-700">N{totalPrice.toLocaleString()}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Regular price: N{((selectedProduct?.price ?? 0) * quantity).toLocaleString()}</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <UsersRound className="w-3 h-3" />
                  Save N{(((selectedProduct?.price ?? 0) * quantity) - totalPrice).toLocaleString()} ({appliedDiscount}% off)
                </span>
              </div>
            )}
            {!isOrg && appliedDiscount === 0 && quantity < 5 && (
              <p className="text-xs text-gray-500 mt-1">
                Get 5+ kits to unlock family discounts
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Delivery Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder={isOrg ? 'Enter delivery address for kits (e.g., your office or distribution center)...' : 'Enter your full delivery address...'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select your state</option>
                {nigerianStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="08012345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                placeholder="Any special delivery instructions..."
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading || !address.trim() || !state || !phone.trim() || (isOrg && !selectedProgramId)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              Place Order - N{totalPrice.toLocaleString()}
            </>
          )}
        </button>
      </main>
    </div>
  );
}
