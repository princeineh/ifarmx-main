import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FileText, Search, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertTriangle, XCircle
} from 'lucide-react';

interface AdminInvoice {
  id: string;
  invoice_number: string;
  program_id: string;
  org_user_id: string;
  org_name: string | null;
  program_name: string | null;
  kit_quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
}

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    loadInvoices();
  }, [page, filterStatus]);

  const loadInvoices = async () => {
    setLoading(true);

    let query = supabase
      .from('program_invoices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterStatus !== 'all') query = query.eq('status', filterStatus);

    const { data, count } = await query;
    setTotalCount(count || 0);

    if (!data) { setLoading(false); return; }

    const orgIds = [...new Set(data.map(i => i.org_user_id))];
    const programIds = [...new Set(data.map(i => i.program_id))];

    const [orgsRes, programsRes] = await Promise.all([
      supabase.from('user_profiles').select('id, display_name').in('id', orgIds),
      supabase.from('programs').select('id, name').in('id', programIds),
    ]);

    const orgMap = new Map((orgsRes.data || []).map(o => [o.id, o.display_name]));
    const progMap = new Map((programsRes.data || []).map(p => [p.id, p.name]));

    const result: AdminInvoice[] = data.map(inv => ({
      ...inv,
      org_name: orgMap.get(inv.org_user_id) || null,
      program_name: progMap.get(inv.program_id) || null,
    }));

    setInvoices(result);
    setLoading(false);
  };

  const updateStatus = async (invoiceId: string, newStatus: string) => {
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'paid') {
      updates.paid_at = new Date().toISOString();
    }

    await supabase.from('program_invoices').update(updates).eq('id', invoiceId);
    setInvoices(prev => prev.map(i =>
      i.id === invoiceId
        ? { ...i, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : i.paid_at }
        : i
    ));
  };

  const filtered = search
    ? invoices.filter(i =>
        i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (i.org_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.program_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'paid': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'overdue': return <AlertTriangle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Invoices</p>
          <p className="text-xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Pending Amount</p>
          <p className="text-xl font-bold text-amber-600">N{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
          <p className="text-xl font-bold text-green-600">N{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, org, or program..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'paid', 'overdue', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Kits</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const isOverdue = inv.status === 'pending' && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-semibold text-gray-900">{inv.invoice_number}</p>
                      <p className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{inv.org_name || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">{inv.program_name || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">{inv.kit_quantity}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">N{inv.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={isOverdue && inv.status === 'pending' ? 'overdue' : inv.status}
                        onChange={(e) => updateStatus(inv.id, e.target.value)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer inline-flex items-center gap-1 ${statusBadge(isOverdue ? 'overdue' : inv.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        {statusIcon(isOverdue ? 'overdue' : inv.status)}
                        <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {new Date(inv.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      {inv.paid_at && (
                        <p className="text-[10px] text-green-600">Paid: {new Date(inv.paid_at).toLocaleDateString()}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No invoices found</p>
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
