'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VendorSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/vendor/check-status');
      const result = await response.json();
      
      if (response.ok) {
        setMessage(JSON.stringify(result, null, 2));
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const createVendorRecord = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/vendor/create-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vendor record created successfully! You can now access the vendor dashboard.');
      } else {
        setError(result.error || 'Failed to create vendor record');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const ensureSampleVendor = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/vendor/ensure-sample-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Sample vendor setup completed! You can now login with sample.vendor@rasan.com / vendor123');
      } else {
        setError(result.error || 'Failed to setup sample vendor');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const simpleFix = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/vendor/simple-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('Simple fix completed! Vendor record created successfully. Go to /vendor-dashboard now.');
      } else {
        setError(result.error || 'Failed to apply simple fix');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vendor Setup</CardTitle>
          <CardDescription>
            Fix vendor dashboard access issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
              <pre className="whitespace-pre-wrap">{message}</pre>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={checkStatus}
              variant="outline"
              className="w-full"
            >
              Check Vendor Status
            </Button>

            <Button 
              onClick={simpleFix}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Applying Simple Fix...' : 'SIMPLE FIX - Try This First'}
            </Button>

            <Button 
              onClick={createVendorRecord}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Vendor Record...' : 'Create Vendor Record'}
            </Button>

            <Button 
              onClick={ensureSampleVendor}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Setting up Sample Vendor...' : 'Setup Sample Vendor'}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Simple Fix Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Click "SIMPLE FIX - Try This First"</strong> (blue button) - uses exact admin seed code</li>
              <li>Then visit /vendor-dashboard to access your dashboard</li>
              <li>Use /menu-management to add meals</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-100 rounded text-blue-800 text-sm">
              <strong>Simple Fix:</strong> Uses the exact same code as the working admin seed data endpoint.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}