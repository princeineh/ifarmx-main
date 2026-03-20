import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, LayoutDashboard, Users, FolderOpen, Package, ShoppingBag,
  ArrowLeft, LogOut, FileText, BarChart3, Monitor, CalendarCheck
} from 'lucide-react';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminPrograms } from '../components/admin/AdminPrograms';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminInvoices } from '../components/admin/AdminInvoices';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { AdminMonitor } from '../components/admin/monitor/AdminMonitor';
import { AdminReservations } from '../components/admin/AdminReservations';
import { AdminKitProducts } from '../components/admin/AdminKitProducts';

interface AdminDashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
}

type AdminTab = 'overview' | 'reservations' | 'monitor' | 'analytics' | 'users' | 'programs' | 'orders' | 'invoices' | 'kit-products';

const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'reservations', label: 'Reservations', icon: CalendarCheck },
  { key: 'monitor', label: 'Monitor', icon: Monitor },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'programs', label: 'Programs', icon: FolderOpen },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'kit-products', label: 'Kit Products', icon: ShoppingBag },
];

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6 text-sm">You do not have administrator privileges.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-sm leading-tight block">iFarm Admin</span>
                  <span className="text-[10px] text-gray-500 font-medium">Platform Control</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-0.5 ml-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeTab === tab.key
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Main App</span>
              </button>
              <div className="w-px h-5 bg-gray-700" />
              <span className="text-xs text-gray-500 hidden sm:block">{profile?.display_name}</span>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="sm:hidden bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">
            {tabs.find(t => t.key === activeTab)?.label}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeTab === 'overview' && 'Platform-wide statistics and recent activity'}
            {activeTab === 'reservations' && 'View all Batch 1 spot reservations and contact details'}
            {activeTab === 'monitor' && 'Central monitoring for all kits, plants, and grower performance'}
            {activeTab === 'analytics' && 'Site visits, user behavior patterns, and activity insights'}
            {activeTab === 'users' && 'Manage user accounts, types, and admin access'}
            {activeTab === 'programs' && 'Monitor all programs across organizations'}
            {activeTab === 'orders' && 'Track orders and update payment/delivery status'}
            {activeTab === 'invoices' && 'Manage program invoices and payment tracking'}
            {activeTab === 'kit-products' && 'Add and manage kit products available in the store'}
          </p>
        </div>

        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'reservations' && <AdminReservations />}
        {activeTab === 'monitor' && <AdminMonitor />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'programs' && <AdminPrograms />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'invoices' && <AdminInvoices />}
        {activeTab === 'kit-products' && <AdminKitProducts />}
      </main>
    </div>
  );
}
