import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Plus, Users, AlertCircle, FolderOpen,
  Globe, Lock, ArrowRight, Calendar, Package, Palette,
  CheckSquare, Receipt
} from 'lucide-react';
import type { Program } from '../types/database';

interface OrganizationPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export function OrganizationPage({ onNavigate }: OrganizationPageProps) {
  const { user, profile } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    target_participants: 100,
    start_date: new Date().toISOString().split('T')[0],
    acceptance_type: 'open' as 'open' | 'invite_only',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [kitAssignedCounts, setKitAssignedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && profile?.user_type === 'organization') {
      loadPrograms();
    }
  }, [user, profile]);

  const loadPrograms = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('org_user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPrograms(data);

      if (data.length > 0) {
        const programIds = data.map(p => p.id);

        const [allParticipants, allApps, allKitAssigned] = await Promise.all([
          supabase.from('program_participants').select('program_id').in('program_id', programIds),
          supabase.from('program_applications').select('program_id').in('program_id', programIds).eq('status', 'pending'),
          supabase.from('program_participants').select('program_id').in('program_id', programIds).eq('kit_code_assigned', true),
        ]);

        const counts: Record<string, number> = {};
        const apps: Record<string, number> = {};
        const kits: Record<string, number> = {};

        for (const id of programIds) {
          counts[id] = 0;
          apps[id] = 0;
          kits[id] = 0;
        }

        (allParticipants.data || []).forEach(r => { counts[r.program_id] = (counts[r.program_id] || 0) + 1; });
        (allApps.data || []).forEach(r => { apps[r.program_id] = (apps[r.program_id] || 0) + 1; });
        (allKitAssigned.data || []).forEach(r => { kits[r.program_id] = (kits[r.program_id] || 0) + 1; });

        setParticipantCounts(counts);
        setAppCounts(apps);
        setKitAssignedCounts(kits);
      }
    }

    setLoading(false);
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from('programs')
      .insert({
        org_user_id: user.id,
        name: programForm.name,
        description: programForm.description,
        target_participants: programForm.target_participants,
        start_date: programForm.start_date,
        acceptance_type: programForm.acceptance_type,
        status: 'draft',
      })
      .select()
      .single();

    if (!error && data) {
      const KIT_PRICE = 24999;
      const dueDate = new Date();
      let workingDays = 0;
      while (workingDays < 5) {
        dueDate.setDate(dueDate.getDate() + 1);
        const day = dueDate.getDay();
        if (day !== 0 && day !== 6) workingDays++;
      }

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await supabase.from('program_invoices').insert({
        program_id: data.id,
        org_user_id: user.id,
        invoice_number: invoiceNumber,
        kit_quantity: programForm.target_participants,
        unit_price: KIT_PRICE,
        total_amount: programForm.target_participants * KIT_PRICE,
        status: 'pending',
        due_date: dueDate.toISOString(),
        notes: `Invoice for ${programForm.target_participants} kits for program "${programForm.name}". Payment due within 5 working days.`,
      });

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'program_update',
        title: 'Invoice Generated',
        message: `Invoice ${invoiceNumber} for N${(programForm.target_participants * KIT_PRICE).toLocaleString()} has been generated for "${programForm.name}". Payment is due by ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        metadata: { link_type: 'invoice', invoice_number: invoiceNumber, program_id: data.id },
        read: false,
      });

      setPrograms([data, ...programs]);
      setShowCreateForm(false);
      setTermsAccepted(false);
      setProgramForm({
        name: '',
        description: '',
        target_participants: 100,
        start_date: new Date().toISOString().split('T')[0],
        acceptance_type: 'open',
      });
      onNavigate('program-detail', data.id);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  if (profile?.user_type !== 'organization') {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Access Only</h2>
          <p className="text-gray-600 mb-6 text-sm">This section is only available for organization accounts.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen mud-texture adinkra-bg flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Programs</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage your farming programs</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Program
            </button>
          </div>

          {showCreateForm && (() => {
            const KIT_PRICE = 24999;
            const qty = programForm.target_participants;
            const totalBill = qty * KIT_PRICE;
            const qualifiesForCustom = qty >= 50;

            return (
              <form onSubmit={handleCreateProgram} className="mb-6 p-5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Create New Program</h3>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                    <input
                      type="text"
                      value={programForm.name}
                      onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Palm Oil Revolution 2026"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={programForm.start_date}
                      onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    placeholder="Describe what this program is about..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Kits (Participants)</label>
                    <input
                      type="number"
                      value={programForm.target_participants}
                      onChange={(e) => setProgramForm({ ...programForm, target_participants: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acceptance Type</label>
                    <select
                      value={programForm.acceptance_type}
                      onChange={(e) => setProgramForm({ ...programForm, acceptance_type: e.target.value as 'open' | 'invite_only' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="open">Open (anyone can apply)</option>
                      <option value="invite_only">Invite Only (invite codes required)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-gray-900 text-sm">Kit Billing Summary</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Kit Price (per unit)</span>
                      <span className="font-semibold text-gray-900">N{KIT_PRICE.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Quantity</span>
                      <span className="font-semibold text-gray-900">{qty} kit{qty !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Bill</span>
                      <span className="font-bold text-emerald-700 text-lg">N{totalBill.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {qualifiesForCustom && (
                  <div className="mb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Palette className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm mb-1">
                          Free Kit Customization Included!
                        </h4>
                        <p className="text-xs text-emerald-700 mb-2">
                          Orders of 50+ kits qualify for free branding on every kit box:
                        </p>
                        <ul className="text-xs text-emerald-800 space-y-1">
                          <li className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            Your organization logo on the kit
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            Company / organization name
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            Program name printed on each box
                          </li>
                        </ul>
                        <p className="text-[11px] text-emerald-600 mt-2 italic">
                          Our team will contact you for branding assets after program creation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!qualifiesForCustom && qty > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    Order 50+ kits to unlock free custom branding (your logo, company name, program name on each kit box).
                  </div>
                )}

                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">Program Terms</h4>
                  <ul className="text-xs text-blue-800 space-y-1.5 mb-3">
                    <li>- Each accepted participant receives one kit with their unique activation code.</li>
                    <li>- Participants activate their kits to begin self-farming immediately.</li>
                    <li>- You can monitor all participant progress, performance tiers, and care logs from the dashboard.</li>
                    <li>- Kit codes are generated and assigned by you after accepting participants.</li>
                    <li>- Kits are non-refundable once activated by participants.</li>
                  </ul>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-blue-900 font-medium">
                      I understand the terms and wish to create this program
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!termsAccepted}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all"
                  >
                    <Package className="w-4 h-4" />
                    Create Program
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setTermsAccepted(false); }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            );
          })()}

          {programs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Programs Yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Create your first program to start recruiting participants.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => {
                const pCount = participantCounts[program.id] || 0;
                const aCount = appCounts[program.id] || 0;
                const kCount = kitAssignedCounts[program.id] || 0;
                const fillPct = Math.min(100, (pCount / program.target_participants) * 100);

                return (
                  <div
                    key={program.id}
                    onClick={() => onNavigate('program-detail', program.id)}
                    className="group border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm">{program.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor(program.status)}`}>
                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                          </span>
                          {program.acceptance_type === 'open' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                              <Globe className="w-3 h-3" /> Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500">
                              <Lock className="w-3 h-3" /> Invite
                            </span>
                          )}
                        </div>
                        {program.description && <p className="text-xs text-gray-500 line-clamp-1">{program.description}</p>}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Users className="w-3 h-3" /> Participants: <strong className="text-gray-900">{pCount}/{program.target_participants}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Applications: <strong className="text-amber-600">{aCount}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Kits Assigned: <strong className="text-blue-600">{kCount}</strong>
                      </span>
                      {program.start_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Start: <strong>{new Date(program.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                        </span>
                      )}
                    </div>

                    {aCount > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mb-2">
                        <AlertCircle className="w-3 h-3" />
                        {aCount} application{aCount !== 1 ? 's' : ''} waiting for review
                      </p>
                    )}

                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{Math.round(fillPct)}% of target filled</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
