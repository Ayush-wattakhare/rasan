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
    .select('id, order_number, total, delivery_fee, status, created_at, updated_at')
    .eq('delivery_partner_id', partnerId);
  console.log('PARTNER ORDERS:', orders);
}
run();
