import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createNotification } from '../services/notifications';
import {
  Gift, ArrowLeft, Sparkles, CheckCircle, XCircle, AlertTriangle,
  Users, Plus, Trash2, Package, Send, Copy, Check, Share2, Loader2,
  Droplets, Sun, Leaf
} from 'lucide-react';

interface ActivateKitPageProps {
  onNavigate: (page: string) => void;
  onActivated: () => void;
  prefilledCode?: string | null;
}

interface KitItem {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
  display_order: number;
}

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  kitsAllocated: number;
  phone?: string;
  isExisting?: boolean;
}

interface ExistingGroup {
  id: string;
  group_type: 'family' | 'group';
  group_name: string;
  total_seeds: number;
}

type Step = 'code' | 'activation-type' | 'verify' | 'assign' | 'success';

export function ActivateKitPage({ onNavigate, onActivated, prefilledCode }: ActivateKitPageProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>('code');
  const [kitCode, setKitCode] = useState(prefilledCode || '');
  const [plantName, setPlantName] = useState('');
  const [kitData, setKitData] = useState<any>(null);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [itemChecks, setItemChecks] = useState<Record<string, boolean>>({});
  const [missingNotes, setMissingNotes] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'family' | 'group'>('family');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoValidated, setAutoValidated] = useState(false);
  const [siblingCodes, setSiblingCodes] = useState<any[]>([]);
  const [bulkActivation, setBulkActivation] = useState(false);
  const [existingGroup, setExistingGroup] = useState<ExistingGroup | null>(null);
  const [groupLoaded, setGroupLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [remainingCodes, setRemainingCodes] = useState<string[]>([]);

  const [isFamily, setIsFamily] = useState(profile?.user_type === 'family');

  useEffect(() => {
    if (!user) return;
    if (profile?.user_type === 'family') {
      setIsFamily(true);
      return;
    }
    supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('linked_user_id', user.id)
      .then(({ count }) => {
        if ((count ?? 0) > 0) setIsFamily(true);
      });
  }, [user, profile?.user_type]);

  useEffect(() => {
    loadKitItems();
    if (user && isFamily) loadExistingGroup();
    else setGroupLoaded(true);
  }, [user, isFamily]);

  useEffect(() => {
    if (prefilledCode && user && !autoValidated && step === 'code') {
      setAutoValidated(true);
      autoValidateCode(prefilledCode);
    }
  }, [prefilledCode, user]);

  const loadExistingGroup = async () => {
    if (!user) return;
    const { data: groups } = await supabase
      .from('farming_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (groups && groups.length > 0) {
      const group = groups[0];
      setExistingGroup({
        id: group.id,
        group_type: group.group_type,
        group_name: group.group_name,
        total_seeds: group.total_seeds,
      });
      setGroupName(group.group_name);
      setGroupType(group.group_type);

      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at');

      if (members && members.length > 0) {
        setFamilyMembers(
          members.map((m: any) => ({
            id: m.id,
            name: m.name,
            relationship: m.relationship || '',
            kitsAllocated: 0,
            phone: m.phone || '',
            isExisting: true,
          }))
        );
      }
    }
    setGroupLoaded(true);
  };

  const findSiblingCodes = async (code: string) => {
    const { data: orders } = await supabase
      .from('kit_orders')
      .select('kit_codes_assigned')
      .contains('kit_codes_assigned', [code]);

    if (!orders || orders.length === 0) return [];
    const allCodes: string[] = orders[0].kit_codes_assigned || [];
    const otherCodes = allCodes.filter(c => c !== code);
    if (otherCodes.length === 0) return [];

    const { data: unusedCodes } = await supabase
      .from('kit_codes')
      .select('*')
      .in('code', otherCodes)
      .eq('used', false);

    return unusedCodes || [];
  };

  const autoValidateCode = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const { data: validatedKitData, error: checkError } = await supabase
        .from('kit_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (checkError) throw checkError;
      if (!validatedKitData) throw new Error('Invalid kit code. Please check and try again.');
      if (validatedKitData.used) throw new Error('This kit code has already been activated.');

      setKitData(validatedKitData);
      const siblings = await findSiblingCodes(code.trim().toUpperCase());
      setSiblingCodes(siblings);
      setStep(siblings.length > 0 ? 'activation-type' : 'verify');
    } catch (err: any) {
      setError(err.message || 'Failed to validate kit code');
    } finally {
      setLoading(false);
    }
  };

  const loadKitItems = async () => {
    const { data, error: err } = await supabase
      .from('kit_items')
      .select('*')
      .order('display_order');

    if (!err && data) {
      setKitItems(data);
      const initialChecks: Record<string, boolean> = {};
      data.forEach(item => { initialChecks[item.id] = false; });
      setItemChecks(initialChecks);
    }
  };

  const handleValidateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    try {
      const { data: validatedKitData, error: checkError } = await supabase
        .from('kit_codes')
        .select('*')
        .eq('code', kitCode.trim().toUpperCase())
        .maybeSingle();

      if (checkError) throw checkError;
      if (!validatedKitData) throw new Error('Invalid kit code. Please check and try again.');
      if (validatedKitData.used) throw new Error('This kit code has already been activated.');

      setKitData(validatedKitData);
      const siblings = await findSiblingCodes(kitCode.trim().toUpperCase());
      setSiblingCodes(siblings);
      setStep(siblings.length > 0 ? 'activation-type' : 'verify');
    } catch (err: any) {
      setError(err.message || 'Failed to validate kit code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    if (!user || !kitData) return;
    setError(null);
    setLoading(true);

    try {
      const missing = kitItems.filter(item => !itemChecks[item.id]).map(item => item.name);
      const allPresent = missing.length === 0;
      const alarmRaised = missing.some(itemName =>
        kitItems.find(item => item.name === itemName && item.is_required)
      );

      const { data: verification, error: verificationError } = await supabase
        .from('kit_verifications')
        .insert({
          kit_code_id: kitData.id,
          user_id: user.id,
          all_items_present: allPresent,
          missing_items: missing,
          notes: missingNotes || null,
          alarm_raised: alarmRaised,
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      const itemCheckData = kitItems.map(item => ({
        verification_id: verification.id,
        kit_item_id: item.id,
        is_present: itemChecks[item.id],
      }));

      const { error: checksError } = await supabase.from('kit_item_checks').insert(itemCheckData);
      if (checksError) throw checksError;

      if (isFamily) {
        setStep('assign');
      } else {
        await handleCompleteActivation();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete verification');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteActivation = async () => {
    if (!user || !kitData) return;
    setError(null);
    setLoading(true);

    try {
      const farmingType = isFamily ? groupType : 'individual';
      let farmingGroupId: string | null = existingGroup?.id || null;

      if (isFamily) {
        if (!farmingGroupId) {
          const { data: group, error: groupError } = await supabase
            .from('farming_groups')
            .insert({
              user_id: user.id,
              group_type: groupType,
              group_name: groupName || (groupType === 'family' ? 'My Family' : 'My Group'),
              total_seeds: availableKits,
            })
            .select()
            .single();

          if (groupError) throw groupError;
          farmingGroupId = group.id;

          const newMembers = familyMembers.filter(m => !m.isExisting && m.name.trim());
          if (newMembers.length > 0) {
            const memberData = newMembers.map(m => ({
              group_id: farmingGroupId,
              name: m.name,
              relationship: m.relationship || null,
              seeds_allocated: m.kitsAllocated,
              phone: m.phone || null,
            }));
            const { error: membersError } = await supabase.from('group_members').insert(memberData);
            if (membersError) throw membersError;
          }
        } else {
          await supabase
            .from('farming_groups')
            .update({ total_seeds: (existingGroup?.total_seeds || 0) + availableKits })
            .eq('id', farmingGroupId);

          const newMembers = familyMembers.filter(m => !m.isExisting && m.name.trim());
          if (newMembers.length > 0) {
            const memberData = newMembers.map(m => ({
              group_id: farmingGroupId,
              name: m.name,
              relationship: m.relationship || null,
              seeds_allocated: m.kitsAllocated,
              phone: m.phone || null,
            }));
            const { error: membersError } = await supabase.from('group_members').insert(memberData);
            if (membersError) throw membersError;
          }

          for (const m of familyMembers.filter(mm => mm.isExisting && mm.id && mm.kitsAllocated > 0)) {
            const { data: currentMember } = await supabase
              .from('group_members')
              .select('seeds_allocated')
              .eq('id', m.id!)
              .maybeSingle();
            const currentSeeds = currentMember?.seeds_allocated || 0;
            await supabase
              .from('group_members')
              .update({ seeds_allocated: currentSeeds + m.kitsAllocated })
              .eq('id', m.id!);
          }
        }
      }

      const codesToActivate = bulkActivation ? [kitData, ...siblingCodes] : [kitData];
      const codeIds = codesToActivate.map((c: any) => c.id);
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('kit_codes')
        .update({ used: true, user_id: user.id, activated_at: now })
        .in('id', codeIds);
      if (updateError) throw updateError;

      const memberAssignments: { memberId: string | null; count: number }[] = [];
      if (isFamily) {
        for (const m of familyMembers) {
          if (m.kitsAllocated > 0 && m.id) {
            memberAssignments.push({ memberId: m.id, count: m.kitsAllocated });
          }
        }
        if (remainingKits > 0) {
          memberAssignments.push({ memberId: null, count: remainingKits });
        }
      }

      const plantRecords: any[] = [];
      let codeIdx = 0;

      if (isFamily && memberAssignments.length > 0) {
        const { data: allMembers } = farmingGroupId
          ? await supabase.from('group_members').select('id, name').eq('group_id', farmingGroupId)
          : { data: [] };
        const memberNameMap: Record<string, string> = {};
        (allMembers || []).forEach((m: any) => { memberNameMap[m.id] = m.name; });

        for (const assignment of memberAssignments) {
          for (let i = 0; i < assignment.count && codeIdx < codesToActivate.length; i++) {
            const c = codesToActivate[codeIdx];
            const memberName = assignment.memberId ? memberNameMap[assignment.memberId] : null;
            const baseName = plantName || 'My Palm Tree';
            const label = memberName
              ? `${memberName}'s Palm${assignment.count > 1 ? ` #${i + 1}` : ''}`
              : codesToActivate.length > 1 ? `${baseName} #${codeIdx + 1}` : baseName;

            plantRecords.push({
              user_id: user.id,
              kit_code_id: c.id,
              program_id: c.program_id,
              name: label,
              stage: 'nursery',
              planted_date: now.split('T')[0],
              farming_type: farmingType,
              farming_group_id: farmingGroupId,
              group_member_id: assignment.memberId,
            });
            codeIdx++;
          }
        }
      } else {
        codesToActivate.forEach((c: any, idx: number) => {
          plantRecords.push({
            user_id: user.id,
            kit_code_id: c.id,
            program_id: c.program_id,
            name: codesToActivate.length > 1
              ? `${plantName || 'My Palm Tree'} #${idx + 1}`
              : plantName || 'My Palm Tree',
            stage: 'nursery',
            planted_date: now.split('T')[0],
            farming_type: farmingType,
            farming_group_id: farmingGroupId,
            group_member_id: null,
          });
        });
      }

      const { error: plantError } = await supabase.from('plants').insert(plantRecords);
      if (plantError) throw plantError;

      const programIds = [...new Set(codesToActivate.map((c: any) => c.program_id).filter(Boolean))];
      for (const pid of programIds) {
        await supabase
          .from('program_participants')
          .update({ kit_activated: true })
          .eq('program_id', pid)
          .eq('user_id', user.id);
      }

      if (!bulkActivation && siblingCodes.length > 0) {
        setRemainingCodes(siblingCodes.map((sc: any) => sc.code));
      }

      createNotification(
        user.id,
        'kit_activated',
        'Kit Activated Successfully!',
        `Congratulations! Your Oil Palm Revolution Kit has been activated with ${plantRecords.length} plant${plantRecords.length > 1 ? 's' : ''}. Your farming journey begins now! Start by logging your daily plant care to track growth and earn achievements. Visit your dashboard to see your plants.`
      );

      setStep('success');
      setTimeout(() => onActivated(), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to activate kit');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCheck = (itemId: string) => {
    setItemChecks(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relationship: '', kitsAllocated: 0, isExisting: false }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string | number) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const availableKits = bulkActivation ? siblingCodes.length + 1 : 1;
  const totalAllocated = familyMembers.reduce((sum, m) => sum + m.kitsAllocated, 0);
  const remainingKits = availableKits - totalAllocated;
  const missingItems = kitItems.filter(item => !itemChecks[item.id]);
  const hasMissingRequired = missingItems.some(item => item.is_required);

  if (step === 'success') {
    const activatedCount = bulkActivation ? siblingCodes.length + 1 : 1;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-5 animate-bounce">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activatedCount > 1 ? `${activatedCount} Kits Activated!` : 'Kit Activated!'}
              </h2>
              <p className="text-gray-600">
                Your palm farming journey has officially begun. Every great harvest starts with a single seed.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <h3 className="text-sm font-bold text-emerald-900 mb-3">First Steps for a Strong Start</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Droplets className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">Water your seedlings early morning or late evening -- consistency is key.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sun className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">Palm trees love sunlight. Make sure they get at least 6 hours daily.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Leaf className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">Log your care activities weekly to track progress and earn achievements.</p>
                </div>
              </div>
            </div>

            {remainingCodes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-amber-900 text-sm">
                    {remainingCodes.length} Code{remainingCodes.length > 1 ? 's' : ''} to Share
                  </h3>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Gift these to friends or family. They can sign up and activate with these codes.
                </p>
                <div className="space-y-2">
                  {remainingCodes.map(code => (
                    <div key={code} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2">
                      <span className="font-mono font-bold text-gray-900 tracking-wider text-sm">{code}</span>
                      <button
                        onClick={() => copyCode(code)}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        {copiedCode === code ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'activation-type') {
    const totalKitCount = siblingCodes.length + 1;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button onClick={() => { setStep('code'); setSiblingCodes([]); setBulkActivation(false); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Multiple Kits Detected</h1>
              <p className="text-gray-600">
                This code belongs to an order with <span className="font-bold text-gray-900">{totalKitCount} kits</span>.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div
                onClick={() => setBulkActivation(true)}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${bulkActivation ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${bulkActivation ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Package className={`w-5 h-5 ${bulkActivation ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Activate All {totalKitCount} Kits</h3>
                    <p className="text-sm text-gray-600">
                      {isFamily ? 'Activate all kits and assign to your members.' : 'All kits are for me. Activate them all at once.'}
                    </p>
                  </div>
                  {bulkActivation && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                </div>
              </div>

              <div
                onClick={() => setBulkActivation(false)}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${!bulkActivation ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${!bulkActivation ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Send className={`w-5 h-5 ${!bulkActivation ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Activate Just This Kit</h3>
                    <p className="text-sm text-gray-600">
                      Gift or share the other codes with friends and family.
                    </p>
                  </div>
                  {!bulkActivation && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                </div>
              </div>
            </div>

            {bulkActivation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">Kits to be activated ({totalKitCount}):</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-mono font-semibold">{kitData?.code}</span>
                  {siblingCodes.map((sc: any) => (
                    <span key={sc.id} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-mono">{sc.code}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setStep('verify')} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <button onClick={() => setStep(siblingCodes.length > 0 ? 'activation-type' : 'code')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Kit Contents</h1>
              <p className="text-gray-600">Check off each item to confirm you received everything</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {hasMissingRequired && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">Missing Required Items</p>
                    <p className="text-sm text-yellow-800">We'll alert the organization about this issue.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {kitItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${itemChecks[item.id] ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  onClick={() => toggleItemCheck(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {itemChecks[item.id] ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.is_required && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {missingItems.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes About Missing Items</label>
                <textarea
                  value={missingNotes}
                  onChange={(e) => setMissingNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe any issues..."
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Summary:</strong> {Object.values(itemChecks).filter(Boolean).length} of {kitItems.length} items checked
                {missingItems.length > 0 && <span className="block mt-1">Missing: {missingItems.map(i => i.name).join(', ')}</span>}
              </p>
            </div>

            <button
              onClick={handleVerificationComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isFamily ? 'Saving...' : 'Activating...') : (isFamily ? 'Continue to Assignment' : 'Complete Activation')}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can still proceed even with missing items. We'll notify the organization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'assign') {
    const hasGroup = !!existingGroup;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <button onClick={() => setStep('verify')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {hasGroup ? `Assign to ${existingGroup!.group_name}` : 'Set Up Your Family / Group'}
              </h1>
              <p className="text-gray-600">
                {hasGroup
                  ? `Assign ${availableKits} kit${availableKits > 1 ? 's' : ''} to your members`
                  : 'Create your group once -- you can manage members anytime from your dashboard.'}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {!hasGroup && (
              <>
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setGroupType('family')}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${groupType === 'family' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Family
                  </button>
                  <button
                    onClick={() => setGroupType('group')}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${groupType === 'group' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    Group / Friends
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {groupType === 'family' ? 'Family' : 'Group'} Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={groupType === 'family' ? 'e.g., The Okafor Family' : 'e.g., Community Farmers Group'}
                  />
                </div>
              </>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">Kits to Assign</span>
                <span className="text-2xl font-bold text-emerald-700">{availableKits}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Allocate kits to members below. Unassigned kits will be linked to you.
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Members</h3>
                <button onClick={addFamilyMember} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium text-sm">
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm">No members yet</p>
                  <p className="text-gray-400 text-xs mt-1">Add members to assign kits, or all kits go to you</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyMembers.map((member, index) => (
                    <div key={index} className={`border rounded-xl p-4 ${member.isExisting ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
                      {member.isExisting && (
                        <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-2">
                          Existing Member
                        </span>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="Full name"
                            readOnly={member.isExisting}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
                          <input
                            type="text"
                            value={member.relationship}
                            onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder={groupType === 'family' ? 'Spouse, Child...' : 'Friend, Member...'}
                            readOnly={member.isExisting}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Kits</label>
                            <input
                              type="number"
                              value={member.kitsAllocated}
                              onChange={(e) => updateFamilyMember(index, 'kitsAllocated', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              min="0"
                              max={availableKits}
                            />
                          </div>
                          {!member.isExisting && (
                            <button onClick={() => removeFamilyMember(index)} className="self-end p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {!member.isExisting && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                          <input
                            type="text"
                            value={member.phone || ''}
                            onChange={(e) => updateFamilyMember(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="Phone number"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Assigned: {totalAllocated} / {availableKits}
                </span>
                <span className={`text-sm font-semibold ${remainingKits < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remainingKits > 0 ? `${remainingKits} for you` : remainingKits === 0 ? 'All assigned' : 'Over-assigned!'}
                </span>
              </div>
              {remainingKits < 0 && (
                <p className="text-xs text-red-600 mt-2">You've assigned more kits than available. Please adjust.</p>
              )}
            </div>

            <button
              onClick={handleCompleteActivation}
              disabled={loading || remainingKits < 0}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating...' : 'Complete Activation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activate Your Kit</h1>
            <p className="text-gray-600">Enter your unique kit code to start tracking</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {!groupLoaded && isFamily ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleValidateKit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kit Code</label>
                <input
                  type="text"
                  value={kitCode}
                  onChange={(e) => setKitCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase font-mono"
                  placeholder="PALM-2024-001"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Found on your kit packaging</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name Your Palm Tree (optional)</label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., My First Palm, Prosperity Tree"
                />
              </div>

              {isFamily && existingGroup && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">{existingGroup.group_name}</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''} -- you'll assign kits after verification.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !kitCode}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validating...' : 'Continue to Verification'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
