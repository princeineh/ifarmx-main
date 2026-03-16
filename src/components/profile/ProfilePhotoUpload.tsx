import { useState, useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfilePhotoUploadProps {
  userId: string;
  currentUrl: string | null;
  displayName: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

export function ProfilePhotoUpload({ userId, currentUrl, displayName, onUploaded, onRemoved }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      onUploaded(publicUrl);
    } catch {
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const { data: files } = await supabase.storage
        .from('profile-photos')
        .list(userId);

      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from('profile-photos').remove(paths);
      }

      await supabase
        .from('user_profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

      onRemoved();
    } catch {
    } finally {
      setRemoving(false);
    }
  };

  const initials = (displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-emerald-200">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="text-center">
        <p className="text-xs text-earth-400">JPG, PNG up to 5MB</p>
        {currentUrl && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="mt-1 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
