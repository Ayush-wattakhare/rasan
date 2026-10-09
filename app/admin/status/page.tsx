'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/check-meals');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Check failed:', error);
      setStatus({ error: 'Failed to check status' });
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ condition }: { condition: boolean | null }) => {
    if (condition === null) return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    if (condition) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const hasVendors = status?.vendors?.data && status.vendors.data.length > 0;
  const hasMeals = status?.meals?.data && status.meals.data.length > 0;
  const joinWorks = status?.mealsWithVendors?.data && status.mealsWithVendors.data.length > 0;
  const vendorExists = hasVendors && status.vendors.data.some(
    (v: any) => v.user_id === '39736e0c-1ab5-485a-94db-d812fa4a77f9'
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">System Status Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {/* Status Checks */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <StatusIcon condition={hasVendors} />
                  <div className="flex-1">
                    <p className="font-medium">Vendors Table</p>
                    <p className="text-sm text-gray-600">
                      {hasVendors 
                        ? `${status.vendors.data.length} vendor(s) found` 
                        : 'No vendors in database'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <StatusIcon condition={vendorExists} />
                  <div className="flex-1">
                    <p className="font-medium">Sample Vendor (sample.vendor@rasan.com)</p>
                    <p className="text-sm text-gray-600">
                      {vendorExists 
                        ? 'Vendor record exists' 
                        : 'Vendor record missing - SQL fix required'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <StatusIcon condition={hasMeals} />
                  <div className="flex-1">
                    <p className="font-medium">Meals Table</p>
                    <p className="text-sm text-gray-600">
                      {hasMeals 
                        ? `${status.meals.count} meal(s) found` 
                        : 'No meals in database'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <StatusIcon condition={joinWorks} />
                  <div className="flex-1">
                    <p className="font-medium">Meals + Vendors Join Query</p>
                    <p className="text-sm text-gray-600">
                      {joinWorks 
                        ? 'Join query working - meals will show on dashboard' 
                        : 'Join query failing - meals won\'t show'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Issue Summary */}
              {!vendorExists && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">Critical Issue</h3>
                      <p className="text-sm text-red-800 mb-3">
                        The vendor record for sample.vendor@rasan.com is missing. This prevents:
                      </p>
                      <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        <li>Vendor dashboard from loading</li>
                        <li>Meals from showing in customer dashboard (join fails)</li>
                        <li>Any meal operations for this vendor</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {hasMeals && !joinWorks && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Warning</h3>
                      <p className="text-sm text-yellow-800">
                        Meals exist in the database but the join with vendors table is failing. 
                        This means meals won't show on the customer dashboard even though they exist.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {joinWorks && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">All Systems Operational</h3>
                      <p className="text-sm text-green-800">
                        Vendor record exists and meals are showing correctly. The system is working as expected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={checkStatus} variant="outline" className="flex-1">
                  Refresh Status
                </Button>
                {!vendorExists && (
                  <Link href="/admin/fix-vendor" className="flex-1">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Fix Vendor Issue
                    </Button>
                  </Link>
                )}
              </div>

              {/* Raw Data */}
              <details className="bg-gray-50 border rounded-lg p-4">
                <summary className="font-semibold cursor-pointer">View Raw Data</summary>
                <pre className="text-xs overflow-x-auto mt-3 bg-white p-3 rounded border">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </details>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
