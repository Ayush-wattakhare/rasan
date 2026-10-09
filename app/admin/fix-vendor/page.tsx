'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function FixVendorPage() {
  const [copied, setCopied] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const sqlQuery = `-- Step 1: Delete any existing vendor record for this user
DELETE FROM vendors WHERE user_id = '39736e0c-1ab5-485a-94db-d812fa4a77f9';

-- Step 2: Insert new vendor record with proper PostGIS geometry
INSERT INTO vendors (
  user_id, 
  business_name, 
  description, 
  cuisine, 
  location, 
  address, 
  phone, 
  email, 
  operating_hours, 
  rating, 
  total_orders, 
  is_active
)
VALUES (
  '39736e0c-1ab5-485a-94db-d812fa4a77f9',
  'Mama''s Kitchen',
  'Authentic home-cooked Indian meals made with love',
  ARRAY['Indian', 'North Indian', 'Vegetarian']::text[],
  ST_Point(72.8777, 19.0760),
  'Mumbai, Maharashtra, India',
  '+919876543210',
  'sample.vendor@rasan.com',
  '{"monday":{"open":"09:00","close":"21:00","closed":false},"tuesday":{"open":"09:00","close":"21:00","closed":false},"wednesday":{"open":"09:00","close":"21:00","closed":false},"thursday":{"open":"09:00","close":"21:00","closed":false},"friday":{"open":"09:00","close":"21:00","closed":false},"saturday":{"open":"09:00","close":"21:00","closed":false},"sunday":{"open":"09:00","close":"21:00","closed":false}}'::jsonb,
  4.5,
  150,
  true
);`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/debug/check-meals');
      const data = await response.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Check failed:', error);
      setCheckResult({ error: 'Failed to check status' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Fix Vendor Record - SQL Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Why SQL is Required</h3>
            <p className="text-sm text-yellow-800">
              The <code>location</code> field in the vendors table uses PostGIS geometry format. 
              JavaScript clients cannot create this format correctly - it must be done via raw SQL 
              using the <code>ST_Point()</code> function.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">📋 Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Copy the SQL query below</li>
              <li>Go to your Supabase Dashboard → SQL Editor</li>
              <li>Paste the query and click "Run"</li>
              <li>Come back here and click "Check Status" to verify</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">SQL Query:</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              {sqlQuery}
            </pre>
          </div>

          <div>
            <Button onClick={checkStatus} className="w-full">
              Check Status
            </Button>
          </div>

          {checkResult && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Status Check Results:</h3>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(checkResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ What This Does</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Creates vendor record for user: sample.vendor@rasan.com</li>
              <li>• Business name: Mama's Kitchen</li>
              <li>• Location: Mumbai (19.0760, 72.8777)</li>
              <li>• Sets up operating hours for all days 9 AM - 9 PM</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
