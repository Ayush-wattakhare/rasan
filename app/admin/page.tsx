import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CreateUserButtons from '@/components/admin/create-user-buttons';
import { 
  Activity, 
  Wrench, 
  Database, 
  Users,
  Package,
  Store,
  Truck
} from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System management, partner onboarding, and diagnostic tools</p>
        </div>
        <CreateUserButtons />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Check */}

        {/* Fix Vendor */}

        {/* Seed Data */}
        <Link href="/admin/seed-data">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Seed Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Populate database with sample data for testing
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* User Management */}
        <Link href="/admin-dashboard/users">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage users, roles, and permissions
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Setup */}
        <Link href="/admin/setup">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Initial Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Run initial database setup and configuration
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  );
}
