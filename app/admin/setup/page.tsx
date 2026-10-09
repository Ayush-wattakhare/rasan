'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function DemoUsersButton({ setupSecret }: { setupSecret: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const createDemoUsers = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/create-demo-users', {
        method: 'POST',
        headers: { 'x-admin-secret': setupSecret },
      });
      const data = await res.json();
      if (res.ok) {
        const created = data.results?.map((r: any) => `${r.email}: ${r.status}`).join(', ');
        setResult('✅ Done! ' + created);
      } else {
        setResult('❌ Error: ' + (data.error || 'Unknown error'));
      }
    } catch {
      setResult('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={createDemoUsers} disabled={loading} variant="outline" className="w-full">
        {loading ? 'Creating…' : 'Create Demo Users'}
      </Button>
      {result && <p className="text-xs text-gray-600 break-all">{result}</p>}
    </div>
  );
}

export default function AdminSetupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [setupSecret, setSetupSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': setupSecret,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Admin user created successfully! You can now login with these credentials.');
      } else {
        setError(result.error || 'Failed to create admin user');
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
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Create an admin account for Rasan platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupSecret">Setup Secret</Label>
              <Input
                id="setupSecret"
                type="password"
                value={setupSecret}
                onChange={(e) => setSetupSecret(e.target.value)}
                placeholder="Value of ADMIN_SETUP_SECRET"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Admin...' : 'Create Admin User'}
            </Button>

          </CardContent>
        </form>

        <CardContent className="pt-0 border-t border-gray-100 mt-2">
          <h3 className="font-semibold text-gray-800 mb-1 mt-4">Setup Demo Accounts</h3>
          <p className="text-xs text-gray-500 mb-3">
            Creates <code>customer@rasan.com</code> (customer123) and <code>delivery@rasan.com</code> (delivery123) for testing.
          </p>
          <DemoUsersButton setupSecret={setupSecret} />
        </CardContent>
      </Card>
    </div>
  );
}