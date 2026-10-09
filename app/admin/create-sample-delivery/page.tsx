'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateSampleDeliveryPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);

  const handleCreateSample = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    setCredentials(null);

    try {
      const response = await fetch('/api/admin/create-sample-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setCredentials(result.credentials);
      } else {
        setError(result.error || 'Failed to create sample delivery partner');
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
          <CardTitle>Create Sample Delivery Partner</CardTitle>
          <CardDescription>
            Create a sample delivery partner account for testing the dashboard
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

          {credentials && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">Login Credentials:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Email:</strong> {credentials.email}</div>
                <div><strong>Password:</strong> {credentials.password}</div>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-700">
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Logout from current account</li>
                  <li>Login with the credentials above</li>
                  <li>Visit <code>/delivery-dashboard</code> to see the full dashboard</li>
                </ol>
              </div>
            </div>
          )}

          <Button 
            onClick={handleCreateSample}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating Sample Delivery Partner...' : 'Create Sample Delivery Partner'}
          </Button>

          <div className="mt-6 p-4 bg-orange-50 rounded-md">
            <h3 className="font-semibold text-orange-900 mb-2">What this creates:</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Sample delivery partner account</li>
              <li>• Vehicle: Bike (MH12AB1234)</li>
              <li>• Rating: 4.5 stars</li>
              <li>• Sample earnings and delivery history</li>
              <li>• Ready to use dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}