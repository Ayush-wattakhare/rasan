'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Store, Truck } from 'lucide-react';
import { CreateVendorForm } from '@/components/admin/create-vendor-form';
import { CreateDeliveryForm } from '@/components/admin/create-delivery-form';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Vendor {
  id: string;
  business_name: string;
  is_active: boolean;
  rating: number;
  total_orders: number;
  created_at: string;
  profiles: User;
}

interface DeliveryPartner {
  id: string;
  vehicle_type: string;
  vehicle_number: string;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  created_at: string;
  profiles: User;
}

interface UserManagementProps {
  users: User[];
  vendors: Vendor[];
  deliveryPartners: DeliveryPartner[];
}

export default function UserManagement({ users, vendors, deliveryPartners }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'delivery' | 'customers'>('overview');
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);

  const customerCount = users.filter(u => u.role === 'customer').length;
  const vendorCount = vendors.length;
  const deliveryCount = deliveryPartners.length;

  const handleVendorSuccess = () => {
    setShowCreateVendor(false);
    // Refresh the page to show new vendor
    window.location.reload();
  };

  const handleDeliverySuccess = () => {
    setShowCreateDelivery(false);
    // Refresh the page to show new delivery partner
    window.location.reload();
  };

  if (showCreateVendor) {
    return (
      <CreateVendorForm 
        onSuccess={handleVendorSuccess}
        onCancel={() => setShowCreateVendor(false)}
      />
    );
  }

  if (showCreateDelivery) {
    return (
      <CreateDeliveryForm 
        onSuccess={handleDeliverySuccess}
        onCancel={() => setShowCreateDelivery(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold">{customerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendors</p>
                <p className="text-2xl font-bold">{vendorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Partners</p>
                <p className="text-2xl font-bold">{deliveryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowCreateVendor(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Vendor
        </Button>
        <Button 
          onClick={() => setShowCreateDelivery(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Delivery Partner
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', count: users.length },
            { id: 'customers', label: 'Customers', count: customerCount },
            { id: 'vendors', label: 'Vendors', count: vendorCount },
            { id: 'delivery', label: 'Delivery Partners', count: deliveryCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.filter(u => u.role === 'customer').map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'vendors' && (
          <Card>
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{vendor.business_name}</h3>
                      <p className="text-sm text-gray-600">{vendor.profiles.name}</p>
                      <p className="text-sm text-gray-600">{vendor.profiles.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">Rating: {vendor.rating}/5</span>
                        <span className="text-xs text-gray-500">Orders: {vendor.total_orders}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        vendor.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{partner.profiles.name}</h3>
                      <p className="text-sm text-gray-600">{partner.profiles.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {partner.vehicle_type} - {partner.vehicle_number}
                        </span>
                        <span className="text-xs text-gray-500">Rating: {partner.rating}/5</span>
                        <span className="text-xs text-gray-500">Deliveries: {partner.total_deliveries}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          partner.is_verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {partner.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(partner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}