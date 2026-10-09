'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSeedData = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Sample data created successfully! Created ${result.data.mealsCreated} meals.`);
      } else {
        setError(result.error || 'Failed to create sample data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Sample Data</CardTitle>
          <CardDescription>
            Create sample meals and vendor data for testing
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

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">This will create:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 1 Sample vendor (Mama's Kitchen)</li>
                <li>• 8 Sample meals (Chapati Bhaji, Rice Plate, etc.)</li>
                <li>• Complete meal details with ratings and pricing</li>
              </ul>
            </div>

            <Button 
              onClick={handleSeedData}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Sample Data...' : 'Create Sample Data'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Note: You need to be logged in as admin to use this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}