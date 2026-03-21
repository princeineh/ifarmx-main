import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, Trash2 } from 'lucide-react';

interface KitProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  created_at: string;
}

export function AdminKitProducts() {
  const [products, setProducts] = useState<KitProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: 0, description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('kit_products').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop();
      const filename = `kit-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('kit-images')
        .upload(filename, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, fall back to base64 data URL for preview only
        setError('Storage bucket "kit-images" not set up. Using URL input instead.');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('kit-images').getPublicUrl(filename);
      setForm(f => ({ ...f, image_url: publicUrl }));
      setPreviewUrl(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    await handleImageUpload(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'image_url') setPreviewUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { setError('Name and price are required'); return; }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('kit_products').insert({ ...form, price: Number(form.price) });
    if (error) setError(error.message);
    else {
      setForm({ name: '', price: 0, description: '', image_url: '' });
      setPreviewUrl('');
      await loadProducts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('kit_products').delete().eq('id', id);
    await loadProducts();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Kit Store Products</h2>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-4">
        <h3 className="font-semibold text-gray-800">Add New Product</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Standard Kit" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN) *</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" placeholder="e.g. 24999" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief description of this kit" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={2} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kit Image</label>

          {/* Upload area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(''); setForm(f => ({ ...f, image_url: '' })); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePick} className="hidden" />

          {/* URL fallback */}
          <div className="mt-2">
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="Or paste image URL"
              className="w-full border border-gray-200 rounded-lg p-2 text-xs text-gray-600"
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add Product'}
        </button>
      </form>

      <h3 className="text-lg font-semibold mb-3">Existing Products</h3>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
          No products yet. Add one above.
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map(p => (
            <li key={p.id} className="border border-gray-200 rounded-xl p-4 flex gap-4 items-center">
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">{p.name}</div>
                <div className="text-emerald-700 font-semibold">N{p.price.toLocaleString()}</div>
                <div className="text-xs text-gray-500 truncate">{p.description}</div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
