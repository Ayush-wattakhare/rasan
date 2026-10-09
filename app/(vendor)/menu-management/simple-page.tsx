'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleMealForm } from '@/components/vendor/simple-meal-form';

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
  created_at: string;
}

export default function SimpleMenuManagementPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      
      // Get vendor status
      const response = await fetch('/api/vendor/check-status');
      const result = await response.json();
      
      if (response.ok && result.data.vendor) {
        setVendorId(result.data.vendor.id);
        await loadMeals(result.data.vendor.id);
      } else {
        setError('Vendor profile not found. Please create your vendor profile first.');
      }
    } catch (err) {
      setError('Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  };

  const loadMeals = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/meals?vendor_id=${vendorId}`);
      if (response.ok) {
        const result = await response.json();
        setMeals(result.meals || []);
      }
    } catch (err) {
      console.error('Failed to load meals:', err);
    }
  };

  const handleMealCreated = () => {
    setShowAddForm(false);
    if (vendorId) {
      loadMeals(vendorId);
    }
  };

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.href = '/vendor-setup'} 
            className="mt-4"
          >
            Setup Vendor Profile
          </Button>
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SimpleMealForm
          vendorId={vendorId!}
          onSuccess={handleMealCreated}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
            <p className="text-gray-600">Manage your meals and menu items</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-orange-600 hover:bg-orange-700">
            + Add Meal
          </Button>
        </div>

        <Input
          placeholder="Search meals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold mb-2">No meals yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first meal to the menu.</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-orange-600 hover:bg-orange-700">
            Add Your First Meal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeals.map((meal) => (
            <div key={meal.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{meal.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  meal.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {meal.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{meal.description}</p>
              
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">₹{meal.price}</span>
                <span className="text-sm text-gray-500">{meal.preparation_time} min</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="bg-gray-100 px-2 py-1 rounded">{meal.category}</span>
                <span className={`px-2 py-1 rounded ${
                  meal.is_veg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {meal.is_veg ? '🌱 Veg' : '🍖 Non-Veg'}
                </span>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Added: {new Date(meal.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}