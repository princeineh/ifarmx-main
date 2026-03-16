import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Calendar, Droplets, Leaf, Scissors, Bug, Sprout, Edit, Trash2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import type { Plant, CareLog } from '../types/database';

interface PlantDetailPageProps {
  plant: Plant;
  onNavigate: (page: string, data?: any) => void;
}

const stageOptions = [
  { value: 'nursery', label: 'Nursery', emoji: '🌱' },
  { value: 'transplant', label: 'Transplant', emoji: '🌿' },
  { value: 'flowering', label: 'Flowering', emoji: '🌼' },
  { value: 'fruiting', label: 'Fruiting', emoji: '🍊' },
  { value: 'harvest', label: 'Harvest', emoji: '🌴' }
];

export function PlantDetailPage({ plant: initialPlant, onNavigate }: PlantDetailPageProps) {
  const { user } = useAuth();
  const [plant, setPlant] = useState(initialPlant);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [editingPlant, setEditingPlant] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [logForm, setLogForm] = useState({
    issue_report: '',
    watered: false,
    fertilized: false,
    weeded: false,
    pruned: false,
    pest_checked: false,
    photo: null as File | null
  });

  const [plantForm, setPlantForm] = useState({
    name: plant.name,
    stage: plant.stage,
    land_volunteer: plant.land_volunteer
  });

  useEffect(() => {
    loadLogs();
  }, [plant.id]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('care_logs')
      .select('*')
      .eq('plant_id', plant.id)
      .order('log_date', { ascending: false });

    if (data) setLogs(data);
    setLoading(false);
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let photoUrl = null;

      if (logForm.photo) {
        const fileExt = logForm.photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('care-photos')
          .upload(fileName, logForm.photo);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('care-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('care_logs')
        .insert({
          plant_id: plant.id,
          user_id: user.id,
          log_date: new Date().toISOString().split('T')[0],
          issue_report: logForm.issue_report || null,
          photo_url: photoUrl,
          watered: logForm.watered,
          fertilized: logForm.fertilized,
          weeded: logForm.weeded,
          pruned: logForm.pruned,
          pest_checked: logForm.pest_checked
        });

      if (!error) {
        setLogForm({
          issue_report: '',
          watered: false,
          fertilized: false,
          weeded: false,
          pruned: false,
          pest_checked: false,
          photo: null
        });
        setSubmitSuccess(true);
        loadLogs();
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('history');
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting log:', err);
    }
  };

  const handleUpdatePlant = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('plants')
        .update({
          name: plantForm.name,
          stage: plantForm.stage,
          land_volunteer: plantForm.land_volunteer,
          updated_at: new Date().toISOString()
        })
        .eq('id', plant.id)
        .select()
        .single();

      if (!error && data) {
        setPlant(data);
        setEditingPlant(false);
      }
    } catch (err) {
      console.error('Error updating plant:', err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm('Delete this log entry?')) {
      await supabase.from('care_logs').delete().eq('id', logId);
      loadLogs();
    }
  };

  const getDaysSincePlanting = () => {
    const planted = new Date(plant.planted_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getComplianceRate = () => {
    const daysSincePlanting = getDaysSincePlanting();
    const expectedLogs = Math.min(daysSincePlanting, 30);
    if (expectedLogs <= 0) return 0;
    const uniqueDays = new Set(logs.map(l => l.log_date.slice(0, 10))).size;
    return Math.min(Math.round((uniqueDays / expectedLogs) * 100), 100);
  };

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const hasLoggedToday = logs.some(l => l.log_date.slice(0, 10) === todayStr);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <Leaf className="w-12 h-12 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {editingPlant ? (
            <form onSubmit={handleUpdatePlant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant Name
                </label>
                <input
                  type="text"
                  value={plantForm.name}
                  onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Growth Stage
                </label>
                <select
                  value={plantForm.stage}
                  onChange={(e) => setPlantForm({ ...plantForm, stage: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {stageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="landVolunteer"
                  checked={plantForm.land_volunteer}
                  onChange={(e) => setPlantForm({ ...plantForm, land_volunteer: e.target.checked })}
                  className="w-4 h-4 text-green-600"
                />
                <label htmlFor="landVolunteer" className="text-sm font-medium text-gray-700">
                  Enrolled in Land Volunteer Program
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlant(false);
                    setPlantForm({
                      name: plant.name,
                      stage: plant.stage,
                      land_volunteer: plant.land_volunteer
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{plant.name}</h1>
                  <p className="text-gray-600">
                    Planted {new Date(plant.planted_date).toLocaleDateString()} • {getDaysSincePlanting()} days old
                  </p>
                </div>
                <button
                  onClick={() => setEditingPlant(true)}
                  className="p-2 text-gray-600 hover:text-green-600"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Stage</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stageOptions.find(s => s.value === plant.stage)?.emoji} {stageOptions.find(s => s.value === plant.stage)?.label}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Logs</p>
                  <p className="text-xl font-bold text-gray-900">{logs.length}</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Care Compliance</p>
                  <p className="text-xl font-bold text-gray-900">{getComplianceRate()}%</p>
                </div>
              </div>

              {plant.land_volunteer && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-semibold">
                    🌍 This plant is enrolled in the Land Volunteer Program
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('log')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                activeTab === 'log'
                  ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Log
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent Activity
              {logs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                  {logs.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'log' && (
              <>
                {submitSuccess || hasLoggedToday ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {submitSuccess ? 'Log saved!' : 'You are all done for today!'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                      Great work caring for {plant.name}. Come back tomorrow to keep your plants healthy and maintain your streak!
                    </p>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      View Activity History
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLog}>
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-800">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What did you do today?</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
                      {[
                        { key: 'watered', label: 'Watered', icon: Droplets, color: 'border-blue-400 bg-blue-50 text-blue-700' },
                        { key: 'fertilized', label: 'Fertilized', icon: Sprout, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                        { key: 'weeded', label: 'Weeded', icon: Leaf, color: 'border-amber-400 bg-amber-50 text-amber-700' },
                        { key: 'pruned', label: 'Pruned', icon: Scissors, color: 'border-orange-400 bg-orange-50 text-orange-700' },
                        { key: 'pest_checked', label: 'Pest Check', icon: Bug, color: 'border-red-400 bg-red-50 text-red-700' }
                      ].map(({ key, label, icon: Icon, color }) => (
                        <label
                          key={key}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            logForm[key as keyof typeof logForm]
                              ? color
                              : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={logForm[key as keyof typeof logForm] as boolean}
                            onChange={(e) => setLogForm({ ...logForm, [key]: e.target.checked })}
                            className="w-4 h-4 text-green-600 sr-only"
                          />
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Report Issue (optional)
                      </label>
                      <textarea
                        value={logForm.issue_report}
                        onChange={(e) => setLogForm({ ...logForm, issue_report: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-300 text-sm"
                        rows={2}
                        placeholder="e.g. yellowing leaves, pests spotted, wilting..."
                      />
                    </div>

                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Photo (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogForm({ ...logForm, photo: e.target.files?.[0] || null })}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      Save Today's Log
                    </button>
                  </form>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No care logs yet.</p>
                    <button
                      onClick={() => setActiveTab('log')}
                      className="mt-3 text-sm text-green-600 font-semibold hover:text-green-700"
                    >
                      Add your first log
                    </button>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(log.log_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-1.5 flex-wrap mb-1.5">
                        {log.watered && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Droplets className="w-3 h-3" /> Watered
                          </span>
                        )}
                        {log.fertilized && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Sprout className="w-3 h-3" /> Fertilized
                          </span>
                        )}
                        {log.weeded && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Leaf className="w-3 h-3" /> Weeded
                          </span>
                        )}
                        {log.pruned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            <Scissors className="w-3 h-3" /> Pruned
                          </span>
                        )}
                        {log.pest_checked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <Bug className="w-3 h-3" /> Pest Check
                          </span>
                        )}
                      </div>

                      {log.issue_report && (
                        <div className="flex items-start gap-1.5 mt-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700">{log.issue_report}</p>
                        </div>
                      )}
                      {log.notes && !log.issue_report && (
                        <p className="text-xs text-gray-500 mt-1.5">{log.notes}</p>
                      )}

                      {log.photo_url && (
                        <img
                          src={log.photo_url}
                          alt="Care log"
                          className="mt-2 rounded-lg w-full h-32 object-cover"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 border-2 border-yellow-200">
          <h3 className="font-bold text-lg text-gray-900 mb-2">🎯 Trade Centre (Coming Soon)</h3>
          <p className="text-gray-700">
            {plant.stage === 'harvest'
              ? "Your plant is ready for harvest! Soon you'll connect with buyers who value traceable African palm oil through iFarmX."
              : `Keep caring for your plant until it reaches harvest stage. iFarmX will connect you with buyers who value traceable palm oil!`}
          </p>
        </div>
      </div>
    </div>
  );
}
