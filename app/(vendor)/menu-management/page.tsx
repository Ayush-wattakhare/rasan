'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleMealForm } from '@/components/vendor/simple-meal-form';
import {
  Pencil,
  Trash2,
  X,
  Loader2,
  ChefHat,
  Clock,
  AlertTriangle,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  meal_type: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  preparation_time: number;
  rating: number;
  image_url: string | null;
  stock: number | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// Edit Modal — centered modal with image upload
// ─────────────────────────────────────────────
function EditMealModal({
  meal,
  onClose,
  onSaved,
}: {
  meal: Meal;
  onClose: () => void;
  onSaved: (updated: Meal) => void;
}) {
  const [form, setForm] = useState({
    name: meal.name,
    description: meal.description || '',
    category: meal.category,
    meal_type: meal.meal_type,
    price: String(meal.price),
    preparation_time: String(meal.preparation_time),
    is_veg: meal.is_veg,
    is_available: meal.is_available,
    stock: meal.stock != null ? String(meal.stock) : '',
  });

  const [imageUrl, setImageUrl] = useState<string>(meal.image_url || '');
  const [imagePreview, setImagePreview] = useState<string>(meal.image_url || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'meals');

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setImageUrl(data.url);
      setImagePreview(data.url);
    } catch (err: any) {
      setError(`Image upload failed: ${err.message}`);
      setImagePreview(meal.image_url || '');
    } finally {
      setUploadingImage(false);
    }
  }, [meal.image_url]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  };

  const removeImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/meals/${meal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          meal_type: form.meal_type,
          price: parseFloat(form.price),
          preparation_time: parseInt(form.preparation_time),
          is_veg: form.is_veg,
          is_available: form.is_available,
          stock: form.stock !== '' ? parseInt(form.stock) : null,
          image_url: imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      onSaved(data.meal as Meal);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop with z-[100] to sit cleanly in front of floating bottom navigation */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] my-auto">
        {/* Header - fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase italic tracking-tight text-sm">Edit Meal</h3>
              <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-wider">Changes save immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Food Photo Upload & Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">
                Food Photo
              </label>
              {imageUrl && (
                <span className="text-[0.6rem] font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Photo Attached
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFilePick}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 shadow-sm group">
                <div className="relative h-44 w-full bg-orange-50">
                  <Image
                    src={imagePreview}
                    alt={form.name || 'Meal preview'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-gray-900 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-orange-50 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="bg-red-600 text-white p-2 rounded-xl shadow-md hover:bg-red-500 transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-orange-600 font-black text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Image...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  dragOver
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100/60 flex items-center justify-center text-orange-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-700 uppercase tracking-tight">Click or Drag & Drop Photo</p>
                  <p className="text-[0.65rem] text-gray-400 font-semibold mt-0.5">PNG, JPG, WebP up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Meal Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="e.g., Butter Chicken"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              placeholder="Describe your dish..."
            />
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {['Main Course','Breakfast','Snacks','Dessert','Beverages','Salads','Soups'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Meal Type</label>
              <select
                value={form.meal_type}
                onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="breakfast">☀️ Breakfast</option>
                <option value="lunch">🍱 Lunch</option>
                <option value="dinner">🌙 Dinner</option>
                <option value="snack">🍿 Snack</option>
              </select>
            </div>
          </div>

          {/* Price + Prep Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-orange-600">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full h-11 pl-8 pr-3 border border-gray-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Prep Time (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={form.preparation_time}
                  onChange={(e) => setForm({ ...form, preparation_time: e.target.value })}
                  className="w-full h-11 pl-9 pr-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Daily Tiffin Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Leave blank for unlimited"
              className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_veg: !form.is_veg })}
              className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wide transition-all ${
                form.is_veg ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              <span className="text-base">{form.is_veg ? '🌱' : '🍗'}</span>
              {form.is_veg ? 'Vegetarian' : 'Non-Veg'}
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_available: !form.is_available })}
              className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wide transition-all ${
                form.is_available ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${form.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {form.is_available ? 'Available' : 'Unavailable'}
            </button>
          </div>
        </div>

        {/* Footer - pinned at bottom of modal */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingImage || !form.name || !form.price}
            type="button"
            className="flex-1 h-12 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-wider hover:bg-orange-500 shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Delete Confirmation Dialog
// ─────────────────────────────────────────────
function DeleteConfirmModal({
  meal,
  onClose,
  onDeleted,
}: {
  meal: Meal;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/meals/${meal.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Delete failed');
      }
      onDeleted(meal.id);
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase italic tracking-tight">Delete Meal?</h3>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              "<span className="text-gray-800">{meal.name}</span>" will be permanently removed from your menu.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Keep It
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-11 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-wider hover:bg-red-500 shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : '🗑️ Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function VendorMenuManagementPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null);

  useEffect(() => { loadVendorData(); }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/vendor/check-status');
      const result = await response.json();
      if (response.ok && result.data.vendor) {
        setVendorId(result.data.vendor.id);
        await loadMeals(result.data.vendor.id);
      } else {
        setError('Vendor profile not found. Please create your vendor profile first.');
      }
    } catch { setError('Failed to load vendor data'); }
    finally { setLoading(false); }
  };

  const loadMeals = async (vid: string) => {
    try {
      const res = await fetch(`/api/meals?vendor_id=${vid}`);
      if (res.ok) {
        const result = await res.json();
        setMeals(result.meals || []);
      }
    } catch { /* silent */ }
  };

  const handleMealCreated = () => {
    setShowAddForm(false);
    if (vendorId) loadMeals(vendorId);
  };

  const handleMealSaved = (updated: Meal) => {
    setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditingMeal(null);
  };

  const handleMealDeleted = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setDeletingMeal(null);
  };

  const toggleMealAvailability = async (mealId: string, current: boolean) => {
    const res = await fetch(`/api/meals/${mealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !current }),
    });
    if (res.ok && vendorId) loadMeals(vendorId);
  };

  const updateStock = async (mealId: string, newStock: number) => {
    if (newStock < 0) return;
    const res = await fetch(`/api/meals/${mealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
    if (res.ok) {
      setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, stock: newStock } : m)));
    }
  };

  const filteredMeals = meals.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-100 rounded-2xl w-64 mx-auto" />
          <div className="h-4 bg-gray-100 rounded-2xl w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl max-w-md mx-auto space-y-3">
          <h2 className="text-lg font-black uppercase">Menu Management Error</h2>
          <p className="font-semibold text-sm">{error}</p>
          <Button onClick={() => window.location.href = '/vendor-setup'} className="w-full bg-orange-600 hover:bg-orange-700">Setup Vendor Profile</Button>
          <Button onClick={loadVendorData} variant="outline" className="w-full">Retry</Button>
        </div>
      </div>
    );
  }

  // ── Add Form ──
  if (showAddForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SimpleMealForm vendorId={vendorId!} onSuccess={handleMealCreated} onCancel={() => setShowAddForm(false)} />
      </div>
    );
  }

  return (
    <>
      {/* Edit Modal */}
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onSaved={handleMealSaved}
        />
      )}

      {/* Delete Confirm */}
      {deletingMeal && (
        <DeleteConfirmModal
          meal={deletingMeal}
          onClose={() => setDeletingMeal(null)}
          onDeleted={handleMealDeleted}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-gray-900 mb-1">Menu Management</h1>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                {meals.length} {meals.length === 1 ? 'item' : 'items'} on your menu
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-orange-200"
            >
              + Add Meal
            </Button>
          </div>
          <Input
            placeholder="Search meals by name or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md rounded-2xl border-gray-200 font-semibold"
          />
        </div>

        {/* Empty state */}
        {filteredMeals.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto">
              <ChefHat className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-gray-700">
              {searchQuery ? 'No meals match your search' : 'No meals yet'}
            </h3>
            <p className="text-gray-400 font-semibold text-sm max-w-xs mx-auto">
              {searchQuery ? 'Try a different search term.' : 'Add your first home-cooked meal to start taking orders.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddForm(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-orange-200">
                Add Your First Meal 🍽️
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col group">

                {/* Food Image */}
                <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                  {meal.image_url ? (
                    <Image src={meal.image_url} alt={meal.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="text-5xl">{meal.is_veg ? '🥗' : '🍗'}</span>
                      <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">No Photo</span>
                    </div>
                  )}

                  {/* Veg badge */}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[0.6rem] font-black uppercase tracking-wider border ${
                    meal.is_veg ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {meal.is_veg ? '🌱 Veg' : '🍗 Non-Veg'}
                  </div>

                  {/* Availability toggle */}
                  <button
                    onClick={() => toggleMealAvailability(meal.id, meal.is_available)}
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[0.6rem] font-black uppercase tracking-wider border transition-all ${
                      meal.is_available
                        ? 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {meal.is_available ? '● Live' : '○ Off'}
                  </button>

                  {/* Edit / Delete hover actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setEditingMeal(meal)}
                      className="flex items-center gap-1.5 bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl hover:bg-orange-50 hover:text-orange-700 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingMeal(meal)}
                      className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl hover:bg-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-black text-gray-900 tracking-tight leading-tight">{meal.name}</h3>
                    <span className="text-lg font-black text-orange-600 whitespace-nowrap">₹{meal.price}</span>
                  </div>

                  {meal.description && (
                    <p className="text-gray-500 text-xs font-semibold line-clamp-2 mb-3 leading-relaxed">{meal.description}</p>
                  )}

                  {/* Stock / Tiffin Counter */}
                  <div className="mb-3">
                    {meal.stock === null ? (
                      <span className="text-[0.65rem] text-gray-300 font-bold uppercase">No stock limit</span>
                    ) : (
                      <div className="space-y-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[0.65rem] font-black uppercase tracking-wider ${
                          meal.stock === 0 ? 'bg-red-100 text-red-700' : meal.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meal.stock === 0 ? 'bg-red-500' : meal.stock <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                          {meal.stock === 0 ? '🚫 Sold Out' : meal.stock <= 5 ? `⚠️ Only ${meal.stock} left!` : `✅ ${meal.stock} tiffins left`}
                        </div>
                        <div className="flex items-center gap-0 w-full">
                          <button onClick={() => updateStock(meal.id, (meal.stock ?? 0) - 1)} disabled={(meal.stock ?? 0) <= 0} className="w-8 h-8 rounded-l-xl bg-gray-100 hover:bg-red-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-red-600 font-black text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all">−</button>
                          <div className="flex-1 h-8 border-t border-b border-gray-200 flex items-center justify-center bg-white">
                            <span className="text-sm font-black text-gray-900">{meal.stock}</span>
                            <span className="text-[0.6rem] text-gray-400 font-bold ml-1">tiffins</span>
                          </div>
                          <button onClick={() => updateStock(meal.id, (meal.stock ?? 0) + 1)} className="w-8 h-8 rounded-r-xl bg-gray-100 hover:bg-green-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-green-700 font-black text-lg transition-all">+</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer row */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-400 font-bold">
                      <span>⏱</span><span>{meal.preparation_time} min</span>
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-bold">{meal.category}</span>
                    <div className="flex items-center gap-0.5 font-bold text-amber-500">
                      <span>★</span><span className="text-gray-600">{meal.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Edit / Delete always-visible buttons (mobile fallback) */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 sm:hidden">
                    <button
                      onClick={() => setEditingMeal(meal)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingMeal(meal)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
