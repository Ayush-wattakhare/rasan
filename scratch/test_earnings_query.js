const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('d:/project/Rasan/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const partnerId = '7080066c-996a-4230-a1f4-6a87d5b0d921';
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total,
      delivery_fee,
      created_at,
      delivery_address,
      vendors:vendor_id (
        id,
        business_name,
        address
      )
    `)
    .eq('delivery_partner_id', partnerId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false });

  console.log('QUERY RESULT:', JSON.stringify(orders?.[0], null, 2));
  if (error) console.log('ERROR:', error);
}
run();
