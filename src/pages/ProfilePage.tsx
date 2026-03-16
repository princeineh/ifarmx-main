import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Save, Loader2, User, MapPin,
  Heart, Utensils, Briefcase, Calendar, Phone
} from 'lucide-react';
import { NIGERIAN_STATES, COMMON_OCCUPATIONS, GENDERS, DISABILITIES, HEALTH_CHALLENGES } from '../data/nigerianStates';
import { ProfilePhotoUpload } from '../components/profile/ProfilePhotoUpload';
import { ProfileFormSection } from '../components/profile/ProfileFormSection';
import { ProfileCompletionBanner } from '../components/profile/ProfileCompletionBanner';
import type { UserProfile } from '../types/database';

interface ProfilePageProps {
  onNavigate: (page: string, data?: any) => void;
}

type FormData = {
  display_name: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  state_of_origin: string;
  lga: string;
  location: string;
  occupation: string;
  favorite_dish: string;
  region_vibe: string;
  disabilities: string;
  health_challenge: string;
};

const EMPTY_FORM: FormData = {
  display_name: '',
  phone_number: '',
  gender: '',
  date_of_birth: '',
  state_of_origin: '',
  lga: '',
  location: '',
  occupation: '',
  favorite_dish: '',
  region_vibe: '',
  disabilities: '',
  health_challenge: '',
};

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        phone_number: profile.phone_number || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        state_of_origin: profile.state_of_origin || '',
        lga: profile.lga || '',
        location: profile.location || '',
        occupation: profile.occupation || '',
        favorite_dish: profile.favorite_dish || '',
        region_vibe: profile.region_vibe || '',
        disabilities: profile.disabilities || '',
        health_challenge: profile.health_challenge || '',
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const updateField = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      (Object.keys(form) as (keyof FormData)[]).forEach(key => {
        updates[key] = form[key] || null;
      });

      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      await refreshProfile();
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setAvatarUrl(url);
    refreshProfile();
  };

  const handlePhotoRemoved = () => {
    setAvatarUrl(null);
    refreshProfile();
  };

  if (!profile || !user) return null;

  const liveProfile: UserProfile = { ...profile, ...form, avatar_url: avatarUrl } as UserProfile;

  const personalCount = [form.display_name, form.phone_number, form.gender, form.date_of_birth, form.occupation]
    .filter(Boolean).length;
  const locationCount = [form.state_of_origin, form.lga, form.location].filter(Boolean).length;
  const healthCount = [form.disabilities, form.health_challenge].filter(Boolean).length;
  const prefCount = [form.favorite_dish, form.region_vibe].filter(Boolean).length;

  const inputCls = "w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm text-earth-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors placeholder:text-earth-300";
  const selectCls = `${inputCls} appearance-none`;
  const labelCls = "block text-xs font-semibold text-earth-700 mb-1.5";

  return (
    <div className="min-h-screen mud-texture adinkra-bg">
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b-4 kente-border sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-earth-600 hover:text-earth-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back</span>
            </button>
            <h1 className="text-sm font-bold text-earth-900">My Profile</h1>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                saved
                  ? 'bg-emerald-100 text-emerald-700'
                  : dirty
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'bg-earth-100 text-earth-400'
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <ProfileCompletionBanner profile={liveProfile} />

        <div className="bg-white rounded-xl border border-earth-200/60 shadow-sm p-6">
          <ProfilePhotoUpload
            userId={user.id}
            currentUrl={avatarUrl}
            displayName={form.display_name}
            onUploaded={handlePhotoUploaded}
            onRemoved={handlePhotoRemoved}
          />
          <div className="mt-4 text-center">
            <p className="font-bold text-earth-900 text-lg">{form.display_name || 'Your Name'}</p>
            <p className="text-xs text-earth-500 capitalize">{profile.user_type} account</p>
          </div>
        </div>

        <ProfileFormSection
          title="Personal Information"
          icon={<User className="w-4 h-4" />}
          completionCount={personalCount}
          totalFields={5}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>
                {profile.user_type === 'organization' ? 'Organization Name' : 'Full Name'}
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                className={inputCls}
                placeholder={profile.user_type === 'organization' ? 'e.g. Green Harvest Foundation' : 'e.g. Adamu Bello'}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number (with country code)</span>
              </label>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(e) => updateField('phone_number', e.target.value)}
                className={inputCls}
                placeholder="e.g. +2348012345678"
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={selectCls}
              >
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</span>
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => updateField('date_of_birth', e.target.value)}
                className={inputCls}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className={labelCls}>
                <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> Occupation</span>
              </label>
              <select
                value={form.occupation}
                onChange={(e) => updateField('occupation', e.target.value)}
                className={selectCls}
              >
                <option value="">Select occupation</option>
                {COMMON_OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          title="Location"
          icon={<MapPin className="w-4 h-4" />}
          completionCount={locationCount}
          totalFields={3}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className={labelCls}>State of Origin</label>
              <select
                value={form.state_of_origin}
                onChange={(e) => updateField('state_of_origin', e.target.value)}
                className={selectCls}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>LGA (Local Government Area)</label>
              <input
                type="text"
                value={form.lga}
                onChange={(e) => updateField('lga', e.target.value)}
                className={inputCls}
                placeholder="e.g. Ikeja"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                className={inputCls}
                placeholder="e.g. 12 Palm Avenue, Lekki"
              />
            </div>
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          title="Health Information"
          icon={<Heart className="w-4 h-4" />}
          completionCount={healthCount}
          totalFields={2}
          defaultOpen={false}
        >
          <p className="text-[11px] text-earth-400 mt-2 mb-3">
            This information helps program organizers provide appropriate support. It is kept private.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Disabilities</label>
              <select
                value={form.disabilities}
                onChange={(e) => updateField('disabilities', e.target.value)}
                className={selectCls}
              >
                <option value="">Select option</option>
                {DISABILITIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Health Challenges</label>
              <select
                value={form.health_challenge}
                onChange={(e) => updateField('health_challenge', e.target.value)}
                className={selectCls}
              >
                <option value="">Select option</option>
                {HEALTH_CHALLENGES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </ProfileFormSection>

        <ProfileFormSection
          title="Preferences"
          icon={<Utensils className="w-4 h-4" />}
          completionCount={prefCount}
          totalFields={2}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className={labelCls}>Favorite Nigerian Dish</label>
              <input
                type="text"
                value={form.favorite_dish}
                onChange={(e) => updateField('favorite_dish', e.target.value)}
                className={inputCls}
                placeholder="e.g. Jollof Rice, Pounded Yam"
              />
            </div>
            <div>
              <label className={labelCls}>Region / Cultural Vibe</label>
              <input
                type="text"
                value={form.region_vibe}
                onChange={(e) => updateField('region_vibe', e.target.value)}
                className={inputCls}
                placeholder="e.g. Yoruba, Igbo, Hausa"
              />
            </div>
          </div>
        </ProfileFormSection>

        {dirty && (
          <div className="sticky bottom-4 z-30">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving changes...' : 'Save All Changes'}
            </button>
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}
