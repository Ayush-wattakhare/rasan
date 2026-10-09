'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DevSeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/basic-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Success! ${result.message}. Created ${result.data?.mealsCreated || 0} meals.`);
      } else {
        setError(result.error || 'Failed to seed data');
        console.error('Seed error details:', result);
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Development Data Seeding</CardTitle>
          <CardDescription>
            Seed the database with sample meals and vendor data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleSeed}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Seeding Database...' : 'Seed Sample Data'}
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">What this creates:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sample vendor "Mama's Kitchen"</li>
              <li>• 8 sample Indian meals with pricing</li>
              <li>• Ratings and nutritional information</li>
              <li>• Fixes "Error fetching meals" issue</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}