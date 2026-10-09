import { createClient } from '@/lib/supabase/server';

export default async function DebugUserPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">No user logged in</div>;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check if delivery partner exists
  const { data: deliveryPartner } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Debug User Info</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Auth User:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Profile:</h2>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Delivery Partner:</h2>
        <pre>{JSON.stringify(deliveryPartner, null, 2)}</pre>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-bold">Status:</h2>
        <p>User Role: {profile?.role || 'No role'}</p>
        <p>Has Delivery Partner Record: {deliveryPartner ? 'Yes' : 'No'}</p>
        <p>Can Access Delivery Dashboard: {profile?.role === 'delivery' && deliveryPartner ? 'Yes' : 'No'}</p>
      </div>

      {profile?.role !== 'delivery' && (
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="font-bold">Action Required:</h2>
          <p>Current user role is "{profile?.role}". You need to login as a delivery partner.</p>
          <p>Use: delivery@rasan.com / delivery123</p>
        </div>
      )}
    </div>
  );
}