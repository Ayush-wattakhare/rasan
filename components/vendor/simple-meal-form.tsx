'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
  ChefHat,
  Clock,
  Leaf,
  Drumstick,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import Image from 'next/image';

interface SimpleMealFormProps {
  vendorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SimpleMealForm({ vendorId, onSuccess, onCancel }: SimpleMealFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tiffinCount, setTiffinCount] = useState(10); // default daily tiffin quota
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Main Course',
    meal_type: 'lunch',
    price: '',
    preparation_time: '30',
    is_veg: true,
    is_available: true,
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

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
    } catch (err: any) {
      setError(`Image upload failed: ${err.message}`);
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          meal_type: formData.meal_type,
          price: parseFloat(formData.price),
          preparation_time: parseInt(formData.preparation_time),
          is_veg: formData.is_veg,
          is_available: formData.is_available,
          ingredients: [],
          allergens: [],
          rating: 4.0,
          image_url: imageUrl || null,
          stock: tiffinCount,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create meal');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
          <ChefHat className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Add New Meal</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fill in details to list your dish</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Food Photo Upload ── */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-gray-700">
            Food Photo <span className="text-orange-500">★</span>
          </Label>

          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 shadow-lg group">
              <Image
                src={imagePreview}
                alt="Meal preview"
                width={800}
                height={320}
                className="w-full h-48 object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-orange-50"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="bg-red-600 text-white p-2 rounded-xl shadow-lg hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-orange-600 font-black text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </div>
                </div>
              )}
              {imageUrl && !uploadingImage && (
                <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-orange-500 bg-orange-50 scale-[1.01]'
                  : 'border-gray-200 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-orange-500' : 'bg-white border border-gray-200'}`}>
                  <ImagePlus className={`w-7 h-7 ${dragOver ? 'text-white' : 'text-orange-500'}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-700 uppercase tracking-wide">
                    {dragOver ? 'Drop it here!' : 'Upload Food Photo'}
                  </p>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Drag & drop or <span className="text-orange-600 underline">browse files</span>
                  </p>
                  <p className="text-[0.65rem] text-gray-300 font-bold uppercase tracking-wider mt-2">
                    PNG, JPG, WebP · Max 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>

        {/* ── Daily Tiffin Count ── */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-gray-700">
            <span className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-orange-500" />
              Daily Tiffin Quantity <span className="text-red-500">*</span>
            </span>
          </Label>
          <p className="text-[0.65rem] text-gray-400 font-semibold -mt-1">
            How many tiffins can you prepare today? Customers will see remaining stock.
          </p>
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => setTiffinCount(Math.max(1, tiffinCount - 1))}
              className="w-11 h-11 rounded-l-2xl bg-gray-100 hover:bg-orange-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:text-orange-600 font-black transition-all active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 h-11 border-t border-b border-gray-200 flex items-center justify-center bg-white">
              <span className="text-2xl font-black text-gray-900 italic tracking-tight">{tiffinCount}</span>
              <span className="text-xs font-bold text-gray-400 ml-1 self-end mb-1">tiffins</span>
            </div>
            <button
              type="button"
              onClick={() => setTiffinCount(Math.min(200, tiffinCount + 1))}
              className="w-11 h-11 rounded-r-2xl bg-gray-100 hover:bg-orange-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:text-orange-600 font-black transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Quick preset buttons */}
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTiffinCount(n)}
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase border transition-all ${
                  tiffinCount === n
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {/* Stock status preview */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
            tiffinCount === 0
              ? 'bg-red-50 text-red-600 border border-red-200'
              : tiffinCount <= 5
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              tiffinCount === 0 ? 'bg-red-500' : tiffinCount <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
            }`} />
            {tiffinCount === 0 ? 'Will show as: Sold Out' : tiffinCount <= 5 ? `Only ${tiffinCount} left — will show as: Almost Gone!` : `${tiffinCount} available — will show as: In Stock`}
          </div>
        </div>

        {/* ── Meal Name & Description ── */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Meal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Butter Chicken Masala"
              required
              className="h-11 rounded-xl border-gray-200 font-semibold focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers what makes your dish special — ingredients, taste, story..."
              rows={3}
              className="rounded-xl border-gray-200 font-semibold focus:border-orange-500 focus:ring-orange-500/20 resize-none"
            />
          </div>
        </div>

        {/* ── Category & Meal Type ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-sm bg-white"
              required
            >
              <option value="Main Course">Main Course</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Snacks">Snacks</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverages">Beverages</option>
              <option value="Salads">Salads</option>
              <option value="Soups">Soups</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meal_type" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Meal Type <span className="text-red-500">*</span>
            </Label>
            <select
              id="meal_type"
              value={formData.meal_type}
              onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-sm bg-white"
              required
            >
              <option value="breakfast">☀️ Breakfast</option>
              <option value="lunch">🍱 Lunch</option>
              <option value="dinner">🌙 Dinner</option>
              <option value="snack">🍿 Snack</option>
            </select>
          </div>
        </div>

        {/* ── Price & Prep Time ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Price (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-orange-600">₹</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                className="h-11 pl-8 rounded-xl border-gray-200 font-black text-lg focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preparation_time" className="text-xs font-black uppercase tracking-widest text-gray-700">
              Prep Time (min) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="preparation_time"
                type="number"
                min="1"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                placeholder="30"
                required
                className="h-11 pl-9 rounded-xl border-gray-200 font-semibold focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* ── Toggles: Veg / Availability ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_veg: !formData.is_veg })}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-black text-sm uppercase tracking-wide transition-all ${
              formData.is_veg
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-300 bg-red-50 text-red-700'
            }`}
          >
            {formData.is_veg ? (
              <Leaf className="w-5 h-5 text-green-600" />
            ) : (
              <Drumstick className="w-5 h-5 text-red-600" />
            )}
            {formData.is_veg ? '🌱 Vegetarian' : '🍗 Non-Veg'}
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-black text-sm uppercase tracking-wide transition-all ${
              formData.is_available
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            <div className={`w-4 h-4 rounded-full ${formData.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {formData.is_available ? 'Available Now' : 'Unavailable'}
          </button>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl font-black uppercase tracking-wider text-gray-500 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || uploadingImage}
            className="flex-1 h-12 rounded-2xl font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-200 transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</span>
            ) : (
              'Add to Menu 🍽️'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}