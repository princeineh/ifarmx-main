import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
  const [form, setForm] = useState({
    name: '',
    price: 0,
    description: '',
    image_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('kit_products').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('kit_products').insert({ ...form, price: Number(form.price) });
    if (error) setError(error.message);
    else {
      setForm({ name: '', price: 0, description: '', image_url: '' });
      await loadProducts();
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Kit Store Products</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" className="w-full border rounded p-2" required />
        <input name="price" value={form.price} onChange={handleChange} type="number" placeholder="Price (NGN)" className="w-full border rounded p-2" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border rounded p-2" />
        <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Image URL" className="w-full border rounded p-2" />
        <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Add Product'}</button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
      <h3 className="text-lg font-semibold mb-2">Existing Products</h3>
      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {products.map(p => (
            <li key={p.id} className="border rounded p-3 flex gap-4 items-center">
              <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <div className="font-bold text-gray-900">{p.name}</div>
                <div className="text-gray-700">N{p.price.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{p.description}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
