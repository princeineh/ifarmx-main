import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, MapPin, Search, Filter,
  Trash2, Edit3, X, Eye, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ProductListing } from '../types/database';

interface MarketplacePageProps {
  onNavigate: (page: string, data?: any) => void;
}

const categories = [
  { id: 'all', label: 'All Products' },
  { id: 'palm_oil', label: 'Palm Oil' },
  { id: 'palm_kernel', label: 'Palm Kernel' },
  { id: 'seedlings', label: 'Seedlings' },
  { id: 'tools', label: 'Farm Tools' },
  { id: 'other', label: 'Other' },
];

const units = ['litres', 'kg', 'pieces', 'bags', 'bundles', 'bottles', 'gallons'];

export function MarketplacePage({ onNavigate }: MarketplacePageProps) {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('palm_oil');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('litres');
  const [newQuantity, setNewQuantity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, [activeCategory]);

  const loadListings = async () => {
    setLoading(true);
    let query = supabase
      .from('product_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }

    const { data } = await query;
    if (data) setListings(data);
    setLoading(false);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreateError(null);
    setCreateLoading(true);

    try {
      const { error } = await supabase
        .from('product_listings')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
          price: parseFloat(newPrice),
          unit: newUnit,
          quantity_available: parseInt(newQuantity),
          location: newLocation.trim(),
          status: 'active',
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewCategory('palm_oil');
      setNewPrice('');
      setNewUnit('litres');
      setNewQuantity('');
      setNewLocation('');
      await loadListings();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create listing');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    const { error } = await supabase
      .from('product_listings')
      .delete()
      .eq('id', id);

    if (!error) await loadListings();
  };

  const handleToggleStatus = async (listing: ProductListing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('product_listings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', listing.id);

    if (!error) await loadListings();
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOwner = !showMyListings || listing.user_id === user?.id;
    return matchesSearch && matchesOwner;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('trade-centre')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
                <p className="text-sm text-gray-600">Buy and sell palm oil products</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Sell Product
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            onClick={() => setShowMyListings(!showMyListings)}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              showMyListings
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            My Listings
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No products found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {showMyListings
                ? "You haven't listed any products yet."
                : 'No products match your search.'}
            </p>
            {showMyListings && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Create your first listing
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="h-32 bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center">
                  <Package className="w-10 h-10 text-green-400" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {listing.location || 'Nigeria'}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {listing.status}
                    </span>
                  </div>

                  {listing.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-green-600">N{listing.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">/{listing.unit}</span>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {listing.quantity_available} available
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <span className="capitalize">{listing.category.replace('_', ' ')}</span>
                    <span>-</span>
                    <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>

                  {listing.user_id === user?.id && (
                    <div className="flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        {listing.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">List a Product</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="e.g., Fresh Palm Oil - Grade A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  rows={3}
                  placeholder="Describe your product..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (N)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="e.g., Lagos, Ikeja"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    List Product
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
