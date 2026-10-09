import { createClient } from '@/lib/supabase/server';

export default async function DebugDeliveryPage() {
  const supabase = await createClient();

  // Get all delivery partners
  const { data: deliveryPartners, error: dpError } = await supabase
    .from('delivery_partners')
    .select(`
      *,
      profiles (
        name,
        email,
        role
      )
    `);

  // Get all profiles with delivery role
  const { data: deliveryProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'delivery');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Debug Delivery Partners</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Delivery Partners in Database:</h2>
        {dpError ? (
          <p className="text-red-600">Error: {dpError.message}</p>
        ) : (
          <pre>{JSON.stringify(deliveryPartners, null, 2)}</pre>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Profiles with Delivery Role:</h2>
        {profileError ? (
          <p className="text-red-600">Error: {profileError.message}</p>
        ) : (
          <pre>{JSON.stringify(deliveryProfiles, null, 2)}</pre>
        )}
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-bold">Expected Login Credentials:</h2>
        <p>Email: delivery@rasan.com</p>
        <p>Password: delivery123</p>
      </div>
    </div>
  );
}